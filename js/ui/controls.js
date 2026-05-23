import { CITIES, CITY_MAP } from '../data.js';
import { state } from '../state.js';
import { drawComplexityChart } from '../graph.js';
import { resetTree } from './tree.js';

// ============================================================
// PATH DISPLAY
// ============================================================
export function updatePathDisplay(path, returnLabel = '') {
  const row = document.getElementById('path-row');
  if (!path || path.length === 0) {
    row.innerHTML = '<span style="font-family:var(--mono);font-size:9px;color:var(--muted)">—</span>';
    return;
  }
  row.innerHTML = '';
  path.forEach((id, i) => {
    if (i > 0) {
      const arr = document.createElement('span');
      arr.className = 'path-arrow'; arr.textContent = '→'; row.appendChild(arr);
    }
    const nd = document.createElement('div'); nd.className = 'path-node';
    const city = CITY_MAP[id];
    nd.style.color = city ? city.color : '#fff';
    nd.style.borderColor = city ? city.color : '#fff';
    nd.style.boxShadow = `0 0 8px ${city ? city.color : '#fff'}44`;
    nd.textContent = id; row.appendChild(nd);
  });
  document.getElementById('path-return-lbl').textContent = returnLabel;
}

export function updateResultCard(path, cost, extraStats = '') {
  const card = document.getElementById('result-card'); card.classList.add('show');
  const disp = document.getElementById('result-path-disp'); disp.innerHTML = '';
  path.forEach((id, i) => {
    if (i > 0) {
      const a = document.createElement('span');
      a.className = 'path-arrow'; a.textContent = '→'; a.style.color = 'var(--muted)'; disp.appendChild(a);
    }
    const nd = document.createElement('div'); nd.className = 'path-node';
    const city = CITY_MAP[id];
    nd.style.color = city ? city.color : '#fff';
    nd.style.borderColor = city ? city.color : '#fff';
    nd.style.width = '22px'; nd.style.height = '22px'; nd.style.fontSize = '9px';
    nd.textContent = id; disp.appendChild(nd);
  });
  document.getElementById('result-cost-disp').textContent = typeof cost === 'number' ? cost.toFixed(1) : '—';
  document.getElementById('result-sub').textContent = extraStats;
}

// ============================================================
// LEGEND
// ============================================================
export function buildLegend() {
  const leg = document.getElementById('city-legend'); leg.innerHTML = '';
  CITIES.forEach(c => {
    const item = document.createElement('div'); item.className = 'city-item';
    item.innerHTML = `<div class="city-dot" style="background:${c.color};color:${c.color};box-shadow:0 0 8px ${c.color}"></div><strong style="color:${c.color}">${c.id}</strong> — ${c.name}`;
    leg.appendChild(item);
  });
}

// ============================================================
// PSEUDOCODE
// ============================================================
const PSEUDOS = {
  brute: [
    'tsp_brute(path, cost):',
    '  if |path| = n:',
    '    cost += dist(last, start)',
    '    if cost < bestCost → update',
    '    return',
    '  for each city not in path:',
    '    path.push(city)',
    '    tsp_brute(path, cost + dist)',
    '    path.pop()',
  ],
  backtrack: [
    'tsp_back(path, visited, cost):',
    '  if cost ≥ bestCost: PRUNE ✗',
    '  if |path| = n:',
    '    cost += dist(last, start)',
    '    if cost < bestCost → update',
    '    return',
    '  for each unvisited city:',
    '    mark visited; recurse',
    '    ← BACKTRACK; unmark',
  ],
  dp: [
    'dp[S][i] = min tour cost',
    '  visiting subset S, ending at i',
    'base: dp[{start}][start] = 0',
    'for each subset S of cities:',
    '  for each city i in S:',
    '    for each city j not in S:',
    '      dp[S∪{j}][j] = min(',
    '        dp[S][i] + dist(i,j) )',
    'answer = min over i of',
    '  dp[all][i] + dist(i,start)',
  ],
  greedy: [
    'greedy_tsp(start):',
    '  path = [start]',
    '  visited = {start}',
    '  while |path| < n:',
    '    nearest = ∞',
    '    for each unvisited city:',
    '      if dist(cur,city) < nearest:',
    '        next = city',
    '    path.push(next)',
    '  path.push(start) // return',
  ]
};

export const ALGO_META = {
  brute: { title: 'BRUTE FORCE', desc: 'Tries every possible permutation. Guaranteed optimal. Explodes at n>10.', tc: 'O((n-1)!)', sc: 'O(n)', treeLabel: 'Brute Force Exploration Tree' },
  backtrack: { title: 'BACKTRACKING', desc: 'Prunes branches worse than current best. Much faster in practice.', tc: 'O((n-1)!)', sc: 'O(n)', treeLabel: 'Backtracking Search Tree' },
  dp: { title: 'DYNAMIC PROG.', desc: 'Held-Karp algorithm. Stores subproblem results. Avoids recomputation.', tc: 'O(n²·2ⁿ)', sc: 'O(n·2ⁿ)', treeLabel: 'DP Subproblem Graph' },
  greedy: { title: 'GREEDY / NN', desc: 'Always picks nearest unvisited city. Fast but not always optimal.', tc: 'O(n²)', sc: 'O(n)', treeLabel: 'Greedy Choice Graph' },
};

export function loadAlgo(a) {
  state.algo = a;
  const m = ALGO_META[a];
  document.getElementById('algo-name').textContent = m.title;
  document.getElementById('algo-info').innerHTML =
    `<strong>${m.title}</strong>${m.desc}<br><span class="tag">${m.tc}</span>` +
    `<span class="tag" style="margin-left:4px;background:rgba(0,212,255,0.08);color:var(--neon-b);border-color:rgba(0,212,255,0.2)">Space: ${m.sc}</span>`;
  setEl('f-tc', m.tc); setEl('f-sc', m.sc);
  setEl('comp-label', m.tc);
  document.getElementById('tree-label').textContent = m.treeLabel;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.algo === a));
  const wrap = document.getElementById('pseudo-wrap'); wrap.innerHTML = '';
  PSEUDOS[a].forEach((line, i) => {
    const div = document.createElement('div'); div.className = 'pl'; div.dataset.ln = i;
    div.innerHTML = `<span class="ln">${i + 1}</span><span>${line}</span>`; wrap.appendChild(div);
  });
  document.getElementById('dp-section-title').style.display = a === 'dp' ? 'flex' : 'none';
  document.getElementById('dp-list').style.display = a === 'dp' ? 'block' : 'none';
  drawComplexityChart();
}

export function hlPseudo(n) { document.querySelectorAll('.pl').forEach((el, i) => el.classList.toggle('active', i === n)); }

// ============================================================
// HELPERS
// ============================================================
export function sleep(ms) { if (ms <= 0) return Promise.resolve(); return new Promise(r => setTimeout(r, ms)); }
export function waitStep() { if (!state.stepMode) return Promise.resolve(); return new Promise(r => { state.stepResolve = r; }); }
export function setNodeSt(id, st) { state.nodeStates[id] = st; }
export function setEl(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
export function incS(key) { state.S[key]++; syncStats(); }
export function setS(key, v) { state.S[key] = v; syncStats(); }
export function syncStats() {
  setEl('f-nodes', state.S.nodes); setEl('f-calls', state.S.calls);
  setEl('f-best', state.S.best === Infinity ? '∞' : state.S.best.toFixed(1));
  setEl('f-cur', typeof state.S.cur === 'number' ? state.S.cur.toFixed(1) : state.S.cur);
  setEl('f-tours', state.S.tours); setEl('f-steps', state.S.steps);
  setEl('r-best', state.S.best === Infinity ? '∞' : state.S.best.toFixed(1));
  setEl('r-cur', typeof state.S.cur === 'number' ? state.S.cur.toFixed(1) : state.S.cur);
  setEl('r-nodes', state.S.nodes); setEl('r-tours', state.S.tours);
  setEl('r-calls', state.S.calls); setEl('r-depth', state.S.depth);
}
export function spd() { const s = parseInt(document.getElementById('speed-slider').value); if (s <= 50) return 2000 - (s / 50) * 1800; return 200 - ((s - 50) / 50) * 196; }
export async function chk() {
  while (state.paused && state.running) await sleep(80);
  if (!state.running) throw new Error('STOPPED');
  if (state.stepMode) await waitStep();
  if (!state.running) throw new Error('STOPPED');
  await sleep(spd() * .3);
}
export function status(t) { setEl('algo-status', t); const badge = document.getElementById('nav-badge'); badge.textContent = '● ' + t; }
export function pushSt(txt) { const box = document.getElementById('stack-wrap'); const div = document.createElement('div'); div.className = 'sf'; div.textContent = txt; box.appendChild(div); box.scrollTop = box.scrollHeight; }
export function popSt() { const box = document.getElementById('stack-wrap'); if (box.lastChild) box.removeChild(box.lastChild); }
export function clearSt() { document.getElementById('stack-wrap').innerHTML = ''; }
export function showBT(v) { document.getElementById('bt-flash').classList.toggle('show', v); }
export function showCache(v) { const el = document.getElementById('cache-flash'); el.classList.toggle('show', v); if (v) setTimeout(() => el.classList.remove('show'), 1200); }
export function addDP(key, val, cached = false) {
  const list = document.getElementById('dp-list');
  const div = document.createElement('div'); div.className = 'dp-entry ' + (cached ? 'cached' : 'active');
  div.textContent = `dp({${key}}) = ${val.toFixed(1)}`;
  list.appendChild(div); list.scrollTop = list.scrollHeight;
  if (list.children.length > 35) list.removeChild(list.firstChild);
}
export function updateProgress(done, total) { const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0; document.getElementById('prog-bar').style.width = pct + '%'; }
export function setButtons(btnState) {
  const run = document.getElementById('btn-run'), pau = document.getElementById('btn-pause'),
    res = document.getElementById('btn-resume'), stp = document.getElementById('btn-stop'),
    nxt = document.getElementById('btn-next');
  if (btnState === 'idle') { run.disabled = false; pau.disabled = true; res.disabled = true; stp.disabled = true; nxt.disabled = true; }
  if (btnState === 'run') { run.disabled = true; pau.disabled = false; res.disabled = true; stp.disabled = false; nxt.disabled = !state.stepMode; }
  if (btnState === 'pause') { run.disabled = true; pau.disabled = true; res.disabled = false; stp.disabled = false; nxt.disabled = !state.stepMode; }
}

// ============================================================
// RESET
// ============================================================
export function resetAll() {
  state.running = false; state.paused = false; state.orbs.length = 0;
  state.bestPath = []; state.curPath = []; state.nodeStates = {}; state.rejEdges.length = 0; state.costHistory.length = 0;
  state.dpData = {}; state.donePerms = 0;
  resetTree();
  Object.assign(state.S, { nodes: 0, calls: 0, best: Infinity, cur: 0, tours: 0, steps: 0, time: 0, depth: 0 });
  syncStats(); setEl('f-path', '—'); setEl('f-time', '0ms');
  document.getElementById('dp-list').innerHTML = '';
  document.getElementById('stack-wrap').innerHTML = '';
  document.getElementById('result-card').classList.remove('show');
  document.getElementById('result-overlay').classList.remove('show');
  document.getElementById('path-row').innerHTML = '<span style="font-family:var(--mono);font-size:9px;color:var(--muted)">—</span>';
  document.getElementById('path-return-lbl').textContent = '';
  document.getElementById('prog-bar').style.width = '0%';
  showBT(false); status('READY — CLICK RUN');
  setButtons('idle');
}

// ============================================================
// SHOW RESULT
// ============================================================
export function showResult() {
  const overlay = document.getElementById('result-overlay'); overlay.classList.add('show');
  document.getElementById('m-algo').textContent = 'Algorithm: ' + ALGO_META[state.algo].title;
  document.getElementById('m-path').textContent = state.bestPath.join(' → ') + ' → ' + state.bestPath[0];
  document.getElementById('m-cost').textContent = 'Cost: ' + state.S.best.toFixed(1);
  document.getElementById('m-stats').innerHTML = `
    <div class="modal-stat"><div class="ml">Nodes Explored</div><div class="mv">${state.S.nodes}</div></div>
    <div class="modal-stat"><div class="ml">Tours Checked</div><div class="mv">${state.S.tours}</div></div>
    <div class="modal-stat"><div class="ml">Exec Time</div><div class="mv">${state.S.time}ms</div></div>
  `;
  setEl('f-path', state.bestPath.join(' → ') + ' → ' + state.bestPath[0]);
  state.bestPath.forEach(id => setNodeSt(id, 'best'));
  updateResultCard(state.bestPath, state.S.best, `Tours: ${state.S.tours}  ·  Nodes: ${state.S.nodes}  ·  Time: ${state.S.time}ms`);
}

export function closeResult() { document.getElementById('result-overlay').classList.remove('show'); }
