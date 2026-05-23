import { state } from '../state.js';
import { treeCanvas, tCtx } from '../graph.js';

const NODE_H = 54;
const NODE_W = 38;
const TREE_PAD = 20;

function setEl(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

export function addTreeNode(parentId, label, color) {
  const id = state.treeNodes.length;
  state.treeNodes.push({
    id, parent: parentId, label, color,
    x: 0, y: 0,
    active: true, optimal: false,
    children: []
  });
  if (parentId !== null) {
    state.treeEdges.push({ from: parentId, to: id });
    const parentNode = state.treeNodes[parentId];
    if (parentNode) parentNode.children.push(id);
  }
  layoutAndDrawTree();
  return id;
}

export function deactivateTreeNode(id) {
  const n = state.treeNodes[id];
  if (n) { n.active = false; }
  layoutAndDrawTree();
}

export function markOptimalNode(id) {
  const n = state.treeNodes[id];
  if (n) { n.optimal = true; }
  layoutAndDrawTree();
}

function layoutTree() {
  if (state.treeNodes.length === 0) return;

  const root = state.treeNodes.find(n => n.parent === null);
  if (!root) return;

  const prelim = new Float64Array(state.treeNodes.length);
  const modifier = new Float64Array(state.treeNodes.length);
  let leafX = 0;

  function postOrder(id) {
    const node = state.treeNodes[id];
    const ch = node.children;

    if (ch.length === 0) {
      prelim[id] = leafX;
      leafX += NODE_W;
    } else {
      ch.forEach(cid => postOrder(cid));
      const firstX = prelim[ch[0]];
      const lastX = prelim[ch[ch.length - 1]];
      const mid = (firstX + lastX) / 2;
      prelim[id] = mid;
      modifier[id] = 0;
    }
  }

  postOrder(root.id);

  function applyPositions(id, depth) {
    const node = state.treeNodes[id];
    node.x = TREE_PAD + prelim[id];
    node.y = TREE_PAD + depth * NODE_H;
    node.children.forEach(cid => applyPositions(cid, depth + 1));
  }

  applyPositions(root.id, 0);

  const maxX = Math.max(...state.treeNodes.map(n => n.x)) + TREE_PAD + NODE_W / 2;
  const maxY = Math.max(...state.treeNodes.map(n => n.y)) + TREE_PAD + NODE_H / 2;

  const W = Math.max(maxX, 260);
  const H = Math.max(maxY, 120);

  treeCanvas._naturalW = W;
  treeCanvas._naturalH = H;

  treeCanvas.width = Math.round(W * state.treeZoom);
  treeCanvas.height = Math.round(H * state.treeZoom);
  treeCanvas.style.width = treeCanvas.width + 'px';
  treeCanvas.style.height = treeCanvas.height + 'px';
}

function drawTree() {
  const W = treeCanvas.width;
  const H = treeCanvas.height;
  const sc = state.treeZoom;

  tCtx.clearRect(0, 0, W, H);

  tCtx.fillStyle = 'rgba(2,8,18,1)';
  tCtx.fillRect(0, 0, W, H);

  tCtx.strokeStyle = 'rgba(0,60,120,0.12)';
  tCtx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 24 * sc) {
    tCtx.beginPath(); tCtx.moveTo(x, 0); tCtx.lineTo(x, H); tCtx.stroke();
  }
  for (let y = 0; y < H; y += 24 * sc) {
    tCtx.beginPath(); tCtx.moveTo(0, y); tCtx.lineTo(W, y); tCtx.stroke();
  }

  const sx = node => node.x * sc;
  const sy = node => node.y * sc;

  state.treeEdges.forEach(e => {
    const a = state.treeNodes[e.from];
    const b = state.treeNodes[e.to];
    if (!a || !b) return;

    const ax = sx(a), ay = sy(a);
    const bx = sx(b), by = sy(b);
    const cpY = (ay + by) / 2;

    tCtx.beginPath();
    tCtx.moveTo(ax, ay);
    tCtx.bezierCurveTo(ax, cpY, bx, cpY, bx, by);

    if (b.optimal) {
      tCtx.strokeStyle = 'rgba(255,170,0,0.85)';
      tCtx.lineWidth = 2.2 * sc;
      tCtx.shadowBlur = 7 * sc;
      tCtx.shadowColor = '#ffaa00';
    } else if (b.active) {
      tCtx.strokeStyle = 'rgba(0,160,255,0.45)';
      tCtx.lineWidth = 1.3 * sc;
      tCtx.shadowBlur = 0;
    } else {
      tCtx.strokeStyle = 'rgba(255,51,85,0.2)';
      tCtx.lineWidth = 0.8 * sc;
      tCtx.shadowBlur = 0;
    }
    tCtx.stroke();
    tCtx.shadowBlur = 0;
  });

  const r = 9 * sc;
  state.treeNodes.forEach(n => {
    const x = sx(n);
    const y = sy(n);
    const col = n.optimal ? '#ffaa00' : n.active ? n.color : '#2a3a4a';

    tCtx.globalAlpha = n.active || n.optimal ? 1 : 0.3;

    if (n.active || n.optimal) {
      tCtx.beginPath();
      tCtx.arc(x, y, r + 4 * sc, 0, Math.PI * 2);
      tCtx.strokeStyle = col + '33';
      tCtx.lineWidth = 1.5 * sc;
      tCtx.stroke();
    }

    const grd = tCtx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    if (n.optimal) {
      grd.addColorStop(0, 'rgba(255,230,150,0.95)');
      grd.addColorStop(0.4, 'rgba(255,170,0,0.9)');
      grd.addColorStop(1, 'rgba(200,100,0,0.5)');
    } else if (n.active) {
      grd.addColorStop(0, 'rgba(255,255,255,0.85)');
      grd.addColorStop(0.35, col);
      grd.addColorStop(1, col + '55');
    } else {
      grd.addColorStop(0, '#1a2a3a');
      grd.addColorStop(1, '#0a1520');
    }
    tCtx.beginPath();
    tCtx.arc(x, y, r, 0, Math.PI * 2);
    tCtx.fillStyle = grd;
    tCtx.fill();

    tCtx.beginPath();
    tCtx.arc(x, y, r, 0, Math.PI * 2);
    tCtx.strokeStyle = n.optimal ? '#ffaa00' : n.active ? col : '#1e3040';
    tCtx.lineWidth = 1.5 * sc;
    if (n.optimal || n.active) {
      tCtx.shadowBlur = 10 * sc;
      tCtx.shadowColor = col;
    }
    tCtx.stroke();
    tCtx.shadowBlur = 0;

    tCtx.globalAlpha = n.active || n.optimal ? 1 : 0.3;
    tCtx.fillStyle = n.active || n.optimal ? '#fff' : '#4a6a7a';
    tCtx.font = `bold ${Math.round(7.5 * sc)}px Orbitron`;
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText(n.label, x, y);

    tCtx.globalAlpha = 1;
  });

  const maxDepth = state.treeNodes.length > 0
    ? Math.max(...state.treeNodes.map(n => {
        let dep = 0, cur = n;
        while (cur.parent !== null) {
          dep++;
          cur = state.treeNodes[cur.parent] || { parent: null };
        }
        return dep;
      }))
    : 0;

  setEl('tree-node-count', state.treeNodes.length + ' nodes');
  setEl('tree-depth-info', 'Depth: ' + maxDepth);

  drawTreeMinimap();
}

function drawTreeMinimap() {
  const mm = document.getElementById('tree-minimap');
  if (!mm || state.treeNodes.length < 2) return;
  const mc = mm.getContext('2d');
  const mW = mm.width, mH = mm.height;
  mc.clearRect(0, 0, mW, mH);
  mc.fillStyle = 'rgba(2,8,18,0.9)'; mc.fillRect(0, 0, mW, mH);
  mc.strokeStyle = 'rgba(0,100,200,0.3)'; mc.lineWidth = 0.5;
  mc.strokeRect(0, 0, mW, mH);

  const nW = treeCanvas._naturalW || 260;
  const nH = treeCanvas._naturalH || 120;
  const sx = x => (x / nW) * mW;
  const sy = y => (y / nH) * mH;

  state.treeEdges.forEach(e => {
    const a = state.treeNodes[e.from], b = state.treeNodes[e.to]; if (!a || !b) return;
    mc.beginPath(); mc.moveTo(sx(a.x), sy(a.y)); mc.lineTo(sx(b.x), sy(b.y));
    mc.strokeStyle = b.active ? 'rgba(0,150,255,0.3)' : 'rgba(255,51,85,0.15)';
    mc.lineWidth = 0.5; mc.stroke();
  });

  state.treeNodes.forEach(n => {
    mc.beginPath(); mc.arc(sx(n.x), sy(n.y), 1.5, 0, Math.PI * 2);
    mc.fillStyle = n.optimal ? '#ffaa00' : n.active ? n.color : '#2a3a4a';
    mc.fill();
  });

  const wrap = document.getElementById('tree-canvas-wrap');
  const vpX = wrap.scrollLeft / state.treeZoom;
  const vpY = wrap.scrollTop / state.treeZoom;
  const vpW = wrap.clientWidth / state.treeZoom;
  const vpH = wrap.clientHeight / state.treeZoom;
  mc.strokeStyle = 'rgba(0,212,255,0.6)'; mc.lineWidth = 1;
  mc.strokeRect(sx(vpX), sy(vpY), sx(vpW), sy(vpH));
}

function layoutAndDrawTree() {
  layoutTree();
  drawTree();
}

export function resetTree() {
  state.treeNodes = [];
  state.treeEdges = [];
  state.treeStep = 0;
  state.treeZoom = 1.0;
  treeCanvas.width = 260;
  treeCanvas.height = 120;
  treeCanvas.style.width = '260px';
  treeCanvas.style.height = '120px';
  tCtx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);
  const wrap = document.getElementById('tree-canvas-wrap');
  wrap.scrollLeft = 0;
  wrap.scrollTop = 0;
  setEl('tree-node-count', '0 nodes');
  setEl('tree-depth-info', 'Depth: 0');
}

export function initTreeControls() {
  document.getElementById('tzb-in').addEventListener('click', () => {
    state.treeZoom = Math.min(2.5, state.treeZoom + 0.2);
    layoutAndDrawTree();
  });
  document.getElementById('tzb-out').addEventListener('click', () => {
    state.treeZoom = Math.max(0.4, state.treeZoom - 0.2);
    layoutAndDrawTree();
  });
  document.getElementById('tzb-fit').addEventListener('click', () => {
    state.treeZoom = 1.0; layoutAndDrawTree();
    const wrap = document.getElementById('tree-canvas-wrap');
    wrap.scrollLeft = 0; wrap.scrollTop = 0;
  });
  document.getElementById('tree-canvas-wrap').addEventListener('scroll', drawTreeMinimap);
}
