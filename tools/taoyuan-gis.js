// 解析 data/official/taoyuan_gis.txt（桃園市都市計畫地理資訊服務網圖層計算結果，差分整數編碼 1e5）
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const dec = s => s.split(';').map(r => { const n = r.split(',').map(Number); let x = 0, y = 0; const o = []; for (let i = 0; i < n.length; i += 2) { x += n[i]; y += n[i + 1]; o.push([x / 1e5, y / 1e5]); } if (o.length && (o[0][0] !== o[o.length - 1][0] || o[0][1] !== o[o.length - 1][1])) o.push(o[0]); return o; }).filter(r => r.length >= 4);
const sArea = r => { const R = 6378137, rad = Math.PI / 180; let a = 0; for (let i = 0; i < r.length - 1; i++) { const [x1, y1] = r[i], [x2, y2] = r[i + 1]; a += (x2 - x1) * rad * (2 + Math.sin(y1 * rad) + Math.sin(y2 * rad)); } return a * R * R / 2 / 1e4; };
const inRing = (p, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
// ArcGIS：外環與內環以有向面積正負區分
function toMulti(rings) {
  const outers = [], holes = [];
  for (const r of rings) (sArea(r) > 0 ? outers : holes).push(r);
  const polys = outers.map(o => [o]);
  for (const h of holes) { const i = outers.findIndex(o => inRing(h[0], o)); if (i >= 0) polys[i].push(h); else polys.push([h]); }
  const area = rings.reduce((t, r) => t + sArea(r), 0);
  return { geometry: { type: 'MultiPolygon', coordinates: polys }, area: Math.round(area * 10) / 10 };
}
const out = {};
for (const line of fs.readFileSync(path.join(root, 'data/official/taoyuan_gis.txt'), 'utf8').trim().split('\n')) {
  const k = line.slice(0, line.indexOf('=')), v = line.slice(line.indexOf('=') + 1);
  if (k === 'aero') out.aero = toMulti(dec(v));
  else { const [name, loc, , g] = v.split('|'); out[k] = { name, loc: loc.trim(), ...toMulti(dec(g)) }; }
}
module.exports = out;
if (require.main === module) for (const [k, v] of Object.entries(out)) console.log(k, v.area, v.geometry.coordinates.length, v.name || '');
