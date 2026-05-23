import { CITIES, d } from './data.js';
import { state } from './state.js';

// ============================================================
// CANVASES
// ============================================================
export const mainCanvas  = document.getElementById('main-canvas');
export const mCtx        = mainCanvas.getContext('2d');
export const bgCanvas    = document.getElementById('bg-canvas');
export const bCtx        = bgCanvas.getContext('2d');
export const treeCanvas  = document.getElementById('tree-canvas');
export const tCtx        = treeCanvas.getContext('2d');
export const miniCanvas  = document.getElementById('mini-canvas');
export const miCtx       = miniCanvas.getContext('2d');
export const compCanvas  = document.getElementById('comp-canvas');
export const cCtx        = compCanvas.getContext('2d');

const bgPts = [];
for (let i = 0; i < 100; i++) bgPts.push({
  x: Math.random() * 2000, y: Math.random() * 1200,
  vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
  r: Math.random() * 1.5 + .3, a: Math.random() * .3 + .05,
  hue: Math.random() < 0.3 ? 200 : Math.random() < 0.5 ? 160 : 270
});

export function resize() {
  const cp = document.getElementById('center-panel');
  mainCanvas.width  = cp.clientWidth;
  mainCanvas.height = cp.clientHeight;
  bgCanvas.width    = window.innerWidth;
  bgCanvas.height   = window.innerHeight;
  miniCanvas.width  = miniCanvas.parentElement.clientWidth  - 16;
  miniCanvas.height = miniCanvas.parentElement.clientHeight - 16;
  compCanvas.width  = compCanvas.parentElement.clientWidth  - 16;
  compCanvas.height = compCanvas.parentElement.clientHeight - 24;
  initCityPos();
  drawComplexityChart();
}

export function initCityPos() {
  const W = mainCanvas.width, H = mainCanvas.height, pad = 90;
  CITIES.forEach(c => {
    if (!state.cityPos[c.id])
      state.cityPos[c.id] = { x: pad + c.x * (W - 2 * pad), y: pad + c.y * (H - 2 * pad) };
  });
}

export function getScreen(id) {
  const p = state.cityPos[id]; if (!p) return { x: 0, y: 0 };
  return { x: (p.x + state.graphOx) * state.graphSc, y: (p.y + state.graphOy) * state.graphSc };
}

export function animBG() {
  bCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgPts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = bgCanvas.width; if (p.x > bgCanvas.width) p.x = 0;
    if (p.y < 0) p.y = bgCanvas.height; if (p.y > bgCanvas.height) p.y = 0;
    bCtx.beginPath(); bCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bCtx.fillStyle = `hsla(${p.hue},80%,60%,${p.a})`;
    bCtx.fill();
  });
  requestAnimationFrame(animBG);
}

// ============================================================
// TRAVEL ORBS
// ============================================================
class Orb {
  constructor(from, to, color, onDone) { this.from = from; this.to = to; this.color = color; this.onDone = onDone; this.t = 0; this.done = false; this.trail = []; }
  update(dt) { const dur = 220 / state.animSpd; this.t += dt / dur; if (this.t >= 1) { this.t = 1; this.done = true; if (this.onDone) this.onDone(); } }
  getPos() {
    const a = getScreen(this.from), b = getScreen(this.to);
    const t = this.t < .5 ? 2 * this.t * this.t : -1 + (4 - 2 * this.t) * this.t;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  draw(ctx) {
    if (this.done) return;
    const pos = this.getPos();
    this.trail.push({ ...pos });
    if (this.trail.length > 22) this.trail.shift();
    for (let i = 1; i < this.trail.length; i++) {
      const a = i / this.trail.length;
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
      const rgb = this.color;
      ctx.strokeStyle = rgb.replace(')', `,${a * 0.55})`).replace('rgb', 'rgba');
      ctx.lineWidth = 2.5 * a; ctx.stroke();
    }
    const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 16);
    g.addColorStop(0, this.color); g.addColorStop(.4, this.color.replace(')', ',0.4)').replace('rgb', 'rgba')); g.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 14; ctx.shadowColor = this.color; ctx.fill(); ctx.shadowBlur = 0;
  }
}

export function travelTo(from, to, color = 'rgb(0,212,255)') {
  return new Promise(r => { state.orbs.push(new Orb(from, to, color, r)); });
}

// ============================================================
// RENDER LOOP
// ============================================================
function render(ts) {
  requestAnimationFrame(render);
  const dt = ts - state.lastT; state.lastT = ts;
  mCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  drawGrid();
  drawAllEdges();
  if (state.bestPath.length > 1) drawBestPath();
  if (state.curPath.length > 1) drawCurPath();
  drawRejEdges();
  state.orbs = state.orbs.filter(o => !o.done);
  state.orbs.forEach(o => { o.update(dt); o.draw(mCtx); });
  drawCities();
  if (state.running && !state.paused) { state.S.time = Date.now() - state.startTime; setEl('f-time', state.S.time + 'ms'); }
  if (ts % 400 < 20) drawMiniChart();
}

function setEl(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

function drawGrid() {
  mCtx.strokeStyle = 'rgba(0,60,120,0.07)'; mCtx.lineWidth = .5;
  for (let x = 0; x < mainCanvas.width; x += 55) { mCtx.beginPath(); mCtx.moveTo(x, 0); mCtx.lineTo(x, mainCanvas.height); mCtx.stroke(); }
  for (let y = 0; y < mainCanvas.height; y += 55) { mCtx.beginPath(); mCtx.moveTo(0, y); mCtx.lineTo(mainCanvas.width, y); mCtx.stroke(); }
}

function drawAllEdges() {
  for (let i = 0; i < CITIES.length; i++) {
    for (let j = i + 1; j < CITIES.length; j++) {
      const a = CITIES[i], b = CITIES[j]; const dd = d(a.id, b.id); if (!dd) continue;
      const pa = getScreen(a.id), pb = getScreen(b.id);
      mCtx.beginPath(); mCtx.moveTo(pa.x, pa.y); mCtx.lineTo(pb.x, pb.y);
      mCtx.strokeStyle = 'rgba(0,80,150,0.12)'; mCtx.lineWidth = 1; mCtx.stroke();
      const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
      mCtx.fillStyle = 'rgba(60,130,200,0.55)'; mCtx.font = '10px "JetBrains Mono"';
      mCtx.textAlign = 'center'; mCtx.textBaseline = 'middle'; mCtx.fillText(dd, mx, my - 9);
    }
  }
}

function drawBestPath() {
  const done = !state.running;
  mCtx.save();
  if (done) { mCtx.shadowBlur = 22; mCtx.shadowColor = '#ffaa00'; mCtx.strokeStyle = 'rgba(255,170,0,0.92)'; mCtx.lineWidth = 3.5; mCtx.setLineDash([]); }
  else { mCtx.strokeStyle = 'rgba(0,212,255,0.45)'; mCtx.lineWidth = 2.5; mCtx.setLineDash([8, 5]); mCtx.lineDashOffset = -(state.lastT / 50) % 13; }
  mCtx.beginPath();
  state.bestPath.forEach((id, i) => { const p = getScreen(id); i === 0 ? mCtx.moveTo(p.x, p.y) : mCtx.lineTo(p.x, p.y); });
  const fp = getScreen(state.bestPath[0]); mCtx.lineTo(fp.x, fp.y); mCtx.stroke();
  mCtx.restore(); mCtx.setLineDash([]);
}

function drawCurPath() {
  mCtx.save(); mCtx.strokeStyle = 'rgba(0,200,255,0.8)'; mCtx.lineWidth = 2.5;
  mCtx.shadowBlur = 8; mCtx.shadowColor = '#00d4ff'; mCtx.setLineDash([]);
  mCtx.beginPath();
  state.curPath.forEach((id, i) => { const p = getScreen(id); i === 0 ? mCtx.moveTo(p.x, p.y) : mCtx.lineTo(p.x, p.y); });
  mCtx.stroke(); mCtx.restore();
}

function drawRejEdges() {
  state.rejEdges.forEach(e => { e.a = Math.max(0, e.a - 0.008); if (e.a <= 0) return;
    const pa = getScreen(e.from), pb = getScreen(e.to);
    mCtx.beginPath(); mCtx.moveTo(pa.x, pa.y); mCtx.lineTo(pb.x, pb.y);
    mCtx.strokeStyle = `rgba(255,51,85,${e.a * 0.4})`; mCtx.lineWidth = 1.5;
    mCtx.setLineDash([4, 4]); mCtx.stroke(); mCtx.setLineDash([]);
  });
  state.rejEdges = state.rejEdges.filter(e => e.a > 0);
}

function drawCities() {
  const t = state.lastT / 1000;
  CITIES.forEach(c => {
    const p = getScreen(c.id); const st = state.nodeStates[c.id] || 'default';
    let col = c.color, r = 13;
    if (st === 'current') { col = '#ffe600'; r = 16; }
    else if (st === 'best') { col = '#ffaa00'; }
    const pulse = st === 'current' ? Math.sin(t * 6) * .35 + .65 : .5;
    mCtx.save();
    if (st === 'current' || st === 'best') {
      mCtx.beginPath(); mCtx.arc(p.x, p.y, r + 8 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
      mCtx.strokeStyle = `${col}22`; mCtx.lineWidth = 1; mCtx.stroke();
    }
    mCtx.shadowBlur = 24 * pulse; mCtx.shadowColor = col;
    mCtx.beginPath(); mCtx.arc(p.x, p.y, r + 5, 0, Math.PI * 2);
    mCtx.strokeStyle = col + '33'; mCtx.lineWidth = 1.5; mCtx.stroke();
    const g = mCtx.createRadialGradient(p.x - 3, p.y - 3, 0, p.x, p.y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(.35, col); g.addColorStop(1, col + '66');
    mCtx.beginPath(); mCtx.arc(p.x, p.y, r, 0, Math.PI * 2); mCtx.fillStyle = g; mCtx.fill();
    mCtx.beginPath(); mCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
    mCtx.strokeStyle = col; mCtx.lineWidth = 1.5; mCtx.stroke();
    mCtx.restore();
    mCtx.fillStyle = '#fff'; mCtx.font = 'bold 11px Orbitron';
    mCtx.textAlign = 'center'; mCtx.textBaseline = 'middle'; mCtx.fillText(c.id, p.x, p.y);
    mCtx.fillStyle = 'rgba(180,220,255,0.65)'; mCtx.font = '9px Rajdhani';
    mCtx.textAlign = 'center'; mCtx.fillText(c.name, p.x, p.y + r + 13);
  });
}

function drawMiniChart() {
  const W = miniCanvas.width, H = miniCanvas.height;
  miCtx.clearRect(0, 0, W, H);
  if (state.costHistory.length < 2) return;
  const mn = Math.min(...state.costHistory), mx = Math.max(...state.costHistory), rng = mx - mn || 1;
  miCtx.beginPath();
  state.costHistory.forEach((v, i) => { const x = (i / (state.costHistory.length - 1)) * W, y = H - ((v - mn) / rng) * (H - 10) - 5; i === 0 ? miCtx.moveTo(x, y) : miCtx.lineTo(x, y); });
  miCtx.strokeStyle = 'rgba(0,212,255,0.85)'; miCtx.lineWidth = 1.5; miCtx.stroke();
  miCtx.lineTo(W, H); miCtx.lineTo(0, H); miCtx.fillStyle = 'rgba(0,100,255,0.07)'; miCtx.fill();
  miCtx.fillStyle = 'rgba(100,160,220,0.55)'; miCtx.font = '8px Orbitron'; miCtx.textAlign = 'left'; miCtx.fillText('COST HISTORY', 2, 10);
}

function factorial(n) { if (n <= 1) return 1; return n * factorial(n - 1); }

export function drawComplexityChart() {
  const W = compCanvas.width, H = compCanvas.height; cCtx.clearRect(0, 0, W, H);
  const fns = { brute: n => factorial(n - 1), backtrack: n => factorial(n - 1), dp: n => n * n * Math.pow(2, n), greedy: n => n * n };
  const fn = fns[state.algo] || fns.brute;
  const pts = []; for (let n = 1; n <= 9; n++) pts.push({ x: n, y: fn(n) });
  const maxY = Math.max(...pts.map(p => p.y)); const minY = 0;
  const xs = n => ((n - 1) / (9 - 1)) * (W - 20) + 10;
  const ys = v => H - 5 - ((v - minY) / (maxY - minY || 1)) * (H - 15);
  cCtx.strokeStyle = 'rgba(0,80,150,0.15)'; cCtx.lineWidth = .5;
  for (let i = 0; i <= 4; i++) { const y = 5 + i * (H - 10) / 4; cCtx.beginPath(); cCtx.moveTo(0, y); cCtx.lineTo(W, y); cCtx.stroke(); }
  const grad = cCtx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(191,95,255,0.5)'); grad.addColorStop(1, 'rgba(191,95,255,0.02)');
  cCtx.beginPath(); pts.forEach((p, i) => { const x = xs(p.x), y = ys(p.y); i === 0 ? cCtx.moveTo(x, y) : cCtx.lineTo(x, y); });
  cCtx.lineTo(xs(pts[pts.length - 1].x), H); cCtx.lineTo(xs(1), H); cCtx.fillStyle = grad; cCtx.fill();
  cCtx.beginPath(); pts.forEach((p, i) => { const x = xs(p.x), y = ys(p.y); i === 0 ? cCtx.moveTo(x, y) : cCtx.lineTo(x, y); });
  cCtx.strokeStyle = 'rgba(191,95,255,0.9)'; cCtx.lineWidth = 2; cCtx.shadowBlur = 6; cCtx.shadowColor = '#bf5fff'; cCtx.stroke(); cCtx.shadowBlur = 0;
  pts.forEach(p => { const x = xs(p.x), y = ys(p.y); cCtx.beginPath(); cCtx.arc(x, y, 2.5, 0, Math.PI * 2); cCtx.fillStyle = '#bf5fff'; cCtx.fill(); });
  cCtx.fillStyle = 'rgba(80,120,160,0.7)'; cCtx.font = '7px JetBrains Mono'; cCtx.textAlign = 'center';
  for (let n = 1; n <= 9; n += 2) cCtx.fillText(n, xs(n), H - 1);
  cCtx.fillStyle = 'rgba(100,150,200,0.55)'; cCtx.font = '7px Orbitron'; cCtx.textAlign = 'left'; cCtx.fillText('n', W - 8, H - 1);
}

export function startRender() {
  requestAnimationFrame(render);
}

export function initCanvasEvents() {
  mainCanvas.addEventListener('mousedown', e => {
    const r = mainCanvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    for (const c of CITIES) { const p = getScreen(c.id); if (Math.hypot(p.x - mx, p.y - my) < 20) { state.dragCity = c.id; return; } }
    state.isDrag = true; state.lastMX = { x: e.clientX, y: e.clientY };
  });
  mainCanvas.addEventListener('mousemove', e => {
    const r = mainCanvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    if (state.dragCity) { state.cityPos[state.dragCity] = { x: mx / state.graphSc - state.graphOx, y: my / state.graphSc - state.graphOy }; return; }
    if (state.isDrag) { state.graphOx += (e.clientX - state.lastMX.x) / state.graphSc; state.graphOy += (e.clientY - state.lastMX.y) / state.graphSc; state.lastMX = { x: e.clientX, y: e.clientY }; return; }
    const tip = document.getElementById('tooltip');
    let hov = null; for (const c of CITIES) { const p = getScreen(c.id); if (Math.hypot(p.x - mx, p.y - my) < 22) { hov = c; break; } }
    if (hov) {
      tip.style.display = 'block'; tip.style.left = (mx + 18) + 'px'; tip.style.top = (my - 12) + 'px';
      const conns = CITIES.filter(o => o.id !== hov.id).map(o => `<span style="color:${o.color}">${o.id}</span>: ${d(hov.id, o.id)}`).join('  ');
      tip.innerHTML = `<strong style="color:${hov.color}">${hov.name} [${hov.id}]</strong><br>${conns}`;
    } else tip.style.display = 'none';
  });
  mainCanvas.addEventListener('mouseup', () => { state.isDrag = false; state.dragCity = null; });
  mainCanvas.addEventListener('mouseleave', () => { state.isDrag = false; state.dragCity = null; document.getElementById('tooltip').style.display = 'none'; });
  mainCanvas.addEventListener('wheel', e => { e.preventDefault(); state.graphSc *= e.deltaY < 0 ? 1.1 : 0.9; }, { passive: false });
}
