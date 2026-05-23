// ============================================================
// DATA
// ============================================================
export const CITIES = [
  { id:'S', name:'San Francisco', x:0.18, y:0.50, color:'#00d4ff' },
  { id:'N', name:'New York',      x:0.82, y:0.25, color:'#00ff88' },
  { id:'D', name:'Dallas',        x:0.50, y:0.72, color:'#ffaa00' },
  { id:'C', name:'Chicago',       x:0.62, y:0.28, color:'#bf5fff' },
  { id:'A', name:'Atlanta',       x:0.72, y:0.60, color:'#ff3355' },
];
export const CITY_MAP = Object.fromEntries(CITIES.map(c => [c.id, c]));

export const DIST_TABLE = {
  'S-N':6,'N-S':6, 'S-D':3.5,'D-S':3.5, 'S-C':4.5,'C-S':4.5, 'S-A':5,'A-S':5,
  'N-D':4,'D-N':4, 'N-C':2.5,'C-N':2.5, 'N-A':2.5,'A-N':2.5,
  'D-C':2.5,'C-D':2.5, 'D-A':2,'A-D':2, 'C-A':2,'A-C':2,
};
export function d(a,b){ return DIST_TABLE[`${a}-${b}`]||DIST_TABLE[`${b}-${a}`]||0; }
