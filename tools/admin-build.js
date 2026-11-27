// 產生鄉鎮與村里界線（TopoJSON）供網站使用
const simp = require('topojson-simplify'), tc = require('topojson-client'), fs = require('fs'), path = require('path');
function mk(src, w, keep) {
  const t = JSON.parse(fs.readFileSync(src));
  let s = simp.simplify(simp.presimplify(t), w);
  s.arcs = s.arcs.map(a => a.map(pt => [pt[0], pt[1]]));
  delete s.transform;
  for (const k of Object.keys(s.objects)) if (!keep.includes(k)) delete s.objects[k];
  // 量化並差分編碼，縮小檔案
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const a of s.arcs) for (const [x, y] of a) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const n = 1e5, kx = (x1 - x0) / (n - 1) || 1, ky = (y1 - y0) / (n - 1) || 1;
  s.transform = { scale: [kx, ky], translate: [x0, y0] };
  s.arcs = s.arcs.map(a => {
    const q = []; let px, py;
    for (const [x, y] of a) { const qx = Math.round((x - x0) / kx), qy = Math.round((y - y0) / ky); if (qx !== px || qy !== py) q.push([qx, qy]); px = qx; py = qy; }
    if (q.length < 2) q.push(q[0].slice());
    let lx = 0, ly = 0; return q.map(([x, y]) => { const d = [x - lx, y - ly]; lx = x; ly = y; return d; });
  });
  return s;
}
const out = process.argv[2] || path.join(__dirname, '../docs');
const W = { towns: +process.argv[3] || 3e-6, villages: +process.argv[4] || 1e-6 };
const towns = mk(path.join(__dirname, 'node_modules/taiwan-atlas/towns-10t.json'), W.towns, ['towns']);
const vill = mk(path.join(__dirname, 'node_modules/taiwan-atlas/villages-10t.json'), W.villages, ['villages']);
// 只保留需要的屬性
for (const g of towns.objects.towns.geometries) g.properties = { c: g.properties.COUNTYNAME, t: g.properties.TOWNNAME };
for (const g of vill.objects.villages.geometries) g.properties = { c: g.properties.COUNTYNAME, t: g.properties.TOWNNAME, v: g.properties.VILLNAME };
fs.writeFileSync(path.join(out, 'towns.js'), 'window.WAVE_TOWNS=' + JSON.stringify(towns) + ';\n');
fs.writeFileSync(path.join(out, 'villages.js'), 'window.WAVE_VILLAGES=' + JSON.stringify(vill) + ';\n');
for (const f of ['towns.js', 'villages.js']) console.log(f, (fs.statSync(path.join(out, f)).size / 1024 | 0) + 'KB');
