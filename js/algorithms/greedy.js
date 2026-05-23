import { CITIES, CITY_MAP, d } from '../data.js';
import { state } from '../state.js';
import {
  chk, hlPseudo, incS, setS, setEl, setNodeSt, sleep, spd, status, updatePathDisplay
} from '../ui/controls.js';
import { travelTo } from '../graph.js';
import { addTreeNode } from '../ui/tree.js';

export async function runGreedy() {
  const ids = CITIES.map(c => c.id), start = ids[0];
  const vis = new Set([start]), path = [start]; let cost = 0;
  setNodeSt(start, 'start'); hlPseudo(0); status('STARTING FROM ' + start);
  const rootId = addTreeNode(null, start, CITY_MAP[start].color);
  let treeParent = rootId;

  while (path.length < ids.length) {
    if (!state.running) return;
    const cur = path[path.length - 1]; setNodeSt(cur, 'current'); hlPseudo(4);
    let nearest = null, nearestD = Infinity;
    for (const nxt of ids) {
      if (vis.has(nxt)) continue;
      hlPseudo(5); incS('calls'); incS('steps');
      await sleep(spd() * .15);
      if (d(cur, nxt) < nearestD) { nearestD = d(cur, nxt); nearest = nxt; }
    }
    if (!nearest) break;
    hlPseudo(7); status('→ ' + nearest + ' (d=' + nearestD + ')');
    const childId = addTreeNode(treeParent, nearest, CITY_MAP[nearest]?.color || '#00d4ff');
    treeParent = childId;
    await travelTo(cur, nearest, 'rgb(0,255,136)');
    cost += nearestD; vis.add(nearest); path.push(nearest);
    state.curPath = [...path]; setNodeSt(cur, 'visited'); setNodeSt(nearest, 'visited');
    incS('nodes'); setS('cur', cost); state.costHistory.push(cost);
    updatePathDisplay(path, '→ ' + start + ' (return when done)');
    await chk();
  }

  hlPseudo(9); status('RETURNING TO START');
  await travelTo(path[path.length - 1], start, 'rgb(0,255,136)');
  cost += d(path[path.length - 1], start);
  incS('tours'); setS('best', cost); state.bestPath = [...path];
  CITIES.forEach(c => setNodeSt(c.id, 'best'));
  setEl('f-path', path.join(' → ') + ' → ' + path[0]);
  updatePathDisplay(path, '→ ' + start + ' ✓');
}
