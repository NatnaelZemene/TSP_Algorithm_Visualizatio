import { state } from './state.js';
import {
  resize, initCityPos, animBG, startRender, drawComplexityChart, initCanvasEvents
} from './graph.js';
import {
  buildLegend, loadAlgo, resetAll, showResult, closeResult, setButtons, status, setS, setEl, showBT
} from './ui/controls.js';
import { initTreeControls } from './ui/tree.js';
import { runBrute } from './algorithms/bruteForce.js';
import { runBacktrack } from './algorithms/backtracking.js';
import { runDP } from './algorithms/heldKarp.js';
import { runGreedy } from './algorithms/greedy.js';

// ============================================================
// MAIN RUNNER
// ============================================================
async function run() {
  resetAll(); state.running = true; state.paused = false; state.startTime = Date.now();
  setButtons('run'); status('RUNNING...');
  try {
    switch (state.algo) {
      case 'brute': await runBrute(); break;
      case 'backtrack': await runBacktrack(); break;
      case 'dp': await runDP(); break;
      case 'greedy': await runGreedy(); break;
    }
    if (state.running) { status('COMPLETE ✓'); setS('time', Date.now() - state.startTime); state.running = false; setButtons('idle'); showResult(); }
  } catch (e) {
    if (e.message !== 'STOPPED') console.error(e);
    status('STOPPED');
  } finally { state.running = false; state.paused = false; showBT(false); setButtons('idle'); }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function initEventListeners() {
  document.getElementById('btn-run').addEventListener('click', run);
  document.getElementById('btn-pause').addEventListener('click', () => { state.paused = true; setButtons('pause'); status('PAUSED'); });
  document.getElementById('btn-resume').addEventListener('click', () => { state.paused = false; setButtons('run'); status('RUNNING...'); });
  document.getElementById('btn-stop').addEventListener('click', () => { state.running = false; state.paused = false; setButtons('idle'); status('STOPPED'); });
  document.getElementById('btn-reset').addEventListener('click', resetAll);
  document.getElementById('btn-next').addEventListener('click', () => { if (state.stepResolve) { state.stepResolve(); state.stepResolve = null; } });
  document.getElementById('speed-slider').addEventListener('input', () => {
    const s = parseInt(document.getElementById('speed-slider').value);
    state.animSpd = Math.max(.1, s / 50);
    const labels = ['×0.1', '×0.25', '×0.5', '×1', '×2', '×5', '×MAX'];
    const idx = s <= 10 ? 0 : s <= 25 ? 1 : s <= 40 ? 2 : s <= 60 ? 3 : s <= 75 ? 4 : s <= 90 ? 5 : 6;
    setEl('speed-lbl', labels[idx]);
  });
  document.getElementById('mode-auto').addEventListener('click', () => { state.stepMode = false; document.getElementById('mode-auto').classList.add('active'); document.getElementById('mode-step').classList.remove('active'); document.getElementById('btn-next').disabled = true; });
  document.getElementById('mode-step').addEventListener('click', () => { state.stepMode = true; document.getElementById('mode-step').classList.add('active'); document.getElementById('mode-auto').classList.remove('active'); if (state.running) document.getElementById('btn-next').disabled = false; });

  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
    if (state.running) { state.running = false; state.paused = false; }
    resetAll();
    loadAlgo(btn.dataset.algo);
    closeNavMenu();
  }));

  const navMenuBtn = document.getElementById('nav-menu-btn');
  const navTabs = document.getElementById('nav-tabs');
  function closeNavMenu() {
    if (!navTabs || !navMenuBtn) return;
    navTabs.classList.remove('open');
    navMenuBtn.setAttribute('aria-expanded', 'false');
  }
  navMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = navTabs.classList.toggle('open');
    navMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (navTabs?.classList.contains('open') && !e.target.closest('nav')) closeNavMenu();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNavMenu();
  });

  ['zoom-in', 'zb-in'].forEach(id => document.getElementById(id)?.addEventListener('click', () => state.graphSc *= 1.18));
  ['zoom-out', 'zb-out'].forEach(id => document.getElementById(id)?.addEventListener('click', () => state.graphSc /= 1.18));
  ['zoom-reset', 'zb-rst'].forEach(id => document.getElementById(id)?.addEventListener('click', () => { state.graphSc = 1; state.graphOx = 0; state.graphOy = 0; }));
  ['fullscreen-btn', 'zb-fs'].forEach(id => document.getElementById(id)?.addEventListener('click', () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); }));

  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
}

// ============================================================
// INIT
// ============================================================
window.closeResult = closeResult;

resize();
initCityPos();
buildLegend();
loadAlgo('brute');
animBG();
startRender();
drawComplexityChart();
initTreeControls();
initCanvasEvents();
initEventListeners();
