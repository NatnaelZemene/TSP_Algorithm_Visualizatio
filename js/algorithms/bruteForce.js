import { CITIES, CITY_MAP, d } from '../data.js';
import { state } from '../state.js';
import {
  chk, hlPseudo, incS, setS, setEl, setNodeSt, sleep, updatePathDisplay, updateProgress
} from '../ui/controls.js';
import { travelTo } from '../graph.js';
import { addTreeNode } from '../ui/tree.js';

export async function runBrute() {
  const ids = CITIES.map(c => c.id), start = ids[0], others = ids.slice(1);
  function perms(arr) { if (arr.length <= 1) return [arr]; const r = []; for (let i = 0; i < arr.length; i++) { const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]; perms(rest).forEach(p => r.push([arr[i], ...p])); } return r; }
  const all = perms(others); state.totalPerms = all.length;

  const rootId = addTreeNode(null, 'S', CITY_MAP['S'].color);
  const lvl1Map = {};
  others.forEach(cid => {
    const nid = addTreeNode(rootId, cid, CITY_MAP[cid]?.color || '#00d4ff');
    lvl1Map[cid] = nid;
  });

  for (const perm of all) {
    if (!state.running) return;
    await chk();
    state.donePerms++; updateProgress(state.donePerms, state.totalPerms);
    const path = [start, ...perm]; state.curPath = [start, ...perm];
    state.nodeStates = {}; setNodeSt(start, 'start');
    let cost = 0;

    let treeParent = lvl1Map[perm[0]] ?? rootId;

    for (let i = 0; i < path.length; i++) {
      if (!state.running) return;
      const cur = path[i], nxt = path[(i + 1) % path.length];
      setNodeSt(cur, i === 0 ? 'start' : 'current');
      hlPseudo(6); incS('steps'); incS('nodes');

      if (i >= 1 && i < path.length - 1 && state.treeNodes.length < 80) {
        treeParent = addTreeNode(treeParent, nxt, CITY_MAP[nxt]?.color || '#00d4ff');
      }

      await travelTo(cur, nxt, 'rgb(0,212,255)');
      if (i < path.length - 1) cost += d(cur, nxt);
      setNodeSt(cur, 'visited');
      updatePathDisplay(path.slice(0, i + 2));
      setS('cur', cost); await chk();
    }
    cost += d(path[path.length - 1], start);
    incS('tours'); hlPseudo(3); state.costHistory.push(cost);
    if (cost < state.S.best) {
      setS('best', cost); state.bestPath = [...path];
      setEl('f-path', path.join(' → ') + ' → ' + path[0]);
      state.costHistory.push(cost);
      CITIES.forEach(c => setNodeSt(c.id, 'best')); await sleep(80 / state.animSpd);
    } else {
      for (let i = 0; i < path.length; i++) state.rejEdges.push({ from: path[i], to: path[(i + 1) % path.length], a: 0.5 });
    }
    CITIES.forEach(c => setNodeSt(c.id, 'default')); state.curPath = [];
  }
}
