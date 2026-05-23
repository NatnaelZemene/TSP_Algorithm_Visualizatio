import { CITIES, CITY_MAP, d } from '../data.js';
import { state } from '../state.js';
import {
  chk, hlPseudo, incS, setS, setEl, setNodeSt, sleep, spd, status, pushSt, popSt,
  showBT, syncStats, updatePathDisplay
} from '../ui/controls.js';
import { travelTo } from '../graph.js';
import { addTreeNode, deactivateTreeNode } from '../ui/tree.js';

export async function runBacktrack() {
  const ids = CITIES.map(c => c.id), n = ids.length, start = ids[0];
  let lBest = Infinity;
  const rootId = addTreeNode(null, 'S', CITY_MAP['S'].color);

  async function bt(path, vis, cost, treeParent) {
    if (!state.running) throw new Error('STOPPED');
    incS('calls'); incS('steps'); state.S.depth = path.length; syncStats();
    pushSt(`bt(${path.join('→')},${cost.toFixed(1)})`);
    hlPseudo(0); state.curPath = [...path]; updatePathDisplay(path);
    if (cost >= lBest) {
      hlPseudo(1); showBT(true); status('PRUNING BRANCH');
      const last = path[path.length - 1];
      ids.forEach(nxt => { if (!vis.has(nxt)) state.rejEdges.push({ from: last, to: nxt, a: 0.65 }); });
      await sleep(spd() * .4); showBT(false); popSt(); return;
    }
    if (path.length === n) {
      hlPseudo(2);
      const ret = d(path[path.length - 1], start), total = cost + ret;
      setS('cur', total); incS('tours'); state.costHistory.push(total);
      await travelTo(path[path.length - 1], start, 'rgb(0,212,255)');
      if (total < lBest) {
        lBest = total; setS('best', total); state.bestPath = [...path];
        setEl('f-path', path.join(' → ') + ' → ' + path[0]);
        CITIES.forEach(c => setNodeSt(c.id, 'best'));
      }
      popSt(); await chk(); return;
    }
    const last = path[path.length - 1];
    for (const nxt of ids) {
      if (!state.running) throw new Error('STOPPED');
      if (vis.has(nxt)) continue;
      setNodeSt(last, 'current'); setNodeSt(nxt, 'visited'); hlPseudo(7);
      const childId = state.treeNodes.length < 100 ? addTreeNode(treeParent, nxt, CITY_MAP[nxt]?.color || '#00d4ff') : treeParent;
      await travelTo(last, nxt, 'rgb(0,212,255)');
      vis.add(nxt); path.push(nxt); incS('nodes'); setS('cur', cost + d(last, nxt));
      updatePathDisplay(path, `Returning: ${nxt} → ${start}`); await chk();
      await bt(path, vis, cost + d(last, nxt), childId);
      if (!state.running) return;
      hlPseudo(8); showBT(true); status('BACKTRACKING...');
      path.pop(); vis.delete(nxt); state.curPath = [...path];
      if (childId !== treeParent) deactivateTreeNode(childId);
      await travelTo(nxt, last, 'rgb(255,51,85)');
      state.rejEdges.push({ from: last, to: nxt, a: 0.6 });
      setNodeSt(nxt, 'default'); setNodeSt(last, path.length > 1 ? 'visited' : 'start');
      await sleep(spd() * .25); showBT(false);
    }
    popSt();
  }

  setNodeSt(start, 'start');
  await bt([start], new Set([start]), 0, rootId);
}
