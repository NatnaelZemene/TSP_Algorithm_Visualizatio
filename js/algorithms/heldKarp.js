import { CITIES, CITY_MAP, d } from '../data.js';
import { state } from '../state.js';
import {
  chk, hlPseudo, incS, setS, setEl, setNodeSt, sleep, spd, status, addDP, updatePathDisplay, showCache
} from '../ui/controls.js';
import { travelTo } from '../graph.js';
import { addTreeNode } from '../ui/tree.js';

export async function runDP() {
  const ids = CITIES.map(c => c.id), n = ids.length, startIdx = 0, allMask = (1 << n) - 1;
  const dp = {}, par = {};
  dp[1 << startIdx] = { [startIdx]: 0 };
  addDP(ids[startIdx] + ',end=' + ids[startIdx], 0, false);
  hlPseudo(2); status('INITIALIZING DP TABLE');
  const rootId = addTreeNode(null, ids[startIdx], CITY_MAP[ids[startIdx]]?.color || '#00d4ff');
  await sleep(spd()); await chk();

  for (let mask = 1; mask <= allMask; mask++) {
    if (!state.running) return;
    if (!dp[mask]) continue;
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i)) || dp[mask][i] === undefined) continue;
      for (let j = 0; j < n; j++) {
        if (!state.running) return;
        if (mask & (1 << j)) continue;
        const newMask = mask | (1 << j), newCost = dp[mask][i] + d(ids[i], ids[j]);
        if (!dp[newMask]) dp[newMask] = {};
        const isCached = dp[newMask][j] !== undefined;
        if (isCached) { showCache(true); hlPseudo(8); addDP(`${ids.filter((_, k) => newMask & (1 << k)).join(',')} end=${ids[j]}`, dp[newMask][j], true); }
        if (!isCached || newCost < dp[newMask][j]) {
          dp[newMask][j] = newCost; par[`${newMask},${j}`] = i;
          hlPseudo(6); setNodeSt(ids[i], 'current'); setNodeSt(ids[j], 'visited');
          incS('nodes'); incS('calls'); incS('steps'); setS('cur', newCost);
          const subset = ids.filter((_, k) => newMask & (1 << k)).join(',');
          addDP(`{${subset}} end=${ids[j]}`, newCost, false);
          const childId = state.treeNodes.length < 70 ? addTreeNode(rootId, ids[j], CITY_MAP[ids[j]]?.color || '#00d4ff') : rootId;
          await travelTo(ids[i], ids[j], isCached ? 'rgb(191,95,255)' : 'rgb(0,212,255)');
          state.costHistory.push(newCost); updatePathDisplay([ids[i], ids[j]]); await chk();
        }
      }
    }
  }

  hlPseudo(8); status('FINDING OPTIMAL TOUR');
  let minCost = Infinity, lastCity = -1;
  for (let i = 1; i < n; i++) {
    if (dp[allMask] && dp[allMask][i] !== undefined) {
      const c = dp[allMask][i] + d(ids[i], ids[startIdx]);
      if (c < minCost) { minCost = c; lastCity = i; }
    }
  }
  if (lastCity !== -1) {
    let path = [], mask = allMask, cur = lastCity;
    while (cur !== undefined) { path.unshift(ids[cur]); const prev = par[`${mask},${cur}`]; mask = mask ^ (1 << cur); cur = prev; }
    state.bestPath = path; setS('best', minCost); incS('tours');
    status('ANIMATING OPTIMAL PATH');
    for (let i = 0; i < path.length; i++) { setNodeSt(path[i], 'best'); if (i > 0) await travelTo(path[i - 1], path[i], 'rgb(255,170,0)'); }
    await travelTo(path[path.length - 1], path[0], 'rgb(255,170,0)');
    setEl('f-path', path.join(' → ') + ' → ' + path[0]);
    updatePathDisplay(path, '→ ' + path[0] + ' (return)');
  }
}
