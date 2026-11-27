// 將 data/official/*.txt（由政府開放資料 SHP 解析、TWD97 差分整數座標）轉成 GeoJSON
// 輸出 data/official.geojson；links.json 將官方範圍對應到本站案件 id
const fs = require('fs'), path = require('path'), proj4 = require('proj4'), area = require('@turf/area').default;
proj4.defs('EPSG:3826', '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
const dir = path.join(__dirname, '../data/official');
const links = JSON.parse(fs.readFileSync(path.join(dir, 'links.json'), 'utf8'));
const feats = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.txt'))) {
  const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
  const [, src, url, county] = lines[0].split('|');
  let cur = null;
  for (const l of lines.slice(1)) {
    if (l.startsWith('F|')) { const [, name, status, id] = l.split('|'); cur = { name, status, id, rings: [] }; feats.push(Object.assign(cur, { src, url, county })); }
    else if (l.startsWith('R|') && cur) {
      let x = 0, y = 0;
      const ring = l.slice(2).trim().split(' ').map(p => { const [dx, dy] = p.split(',').map(Number); x += dx; y += dy; const [lng, lat] = proj4('EPSG:3826', 'EPSG:4326', [x, y]); return [Math.round(lng * 1e6) / 1e6, Math.round(lat * 1e6) / 1e6]; });
      if (ring.length > 2 && (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])) ring.push(ring[0]);
      cur.rings.push(ring);
    }
  }
}
// 外環與內洞：以面積正負判斷（SHP 外環為順時針）
const signed = r => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += (r[i + 1][0] - r[i][0]) * (r[i + 1][1] + r[i][1]); return s; };
const out = { type: 'FeatureCollection', features: feats.map(f => {
  const polys = []; for (const r of f.rings) { if (signed(r) > 0 || !polys.length) polys.push([r]); else polys.at(-1).push(r); }
  const geometry = { type: 'MultiPolygon', coordinates: polys };
  return { type: 'Feature', properties: { name: f.name, status: f.status, county: f.county, source: f.src, url: f.url, case: links[f.county + '|' + f.name] || null, area_ha: Math.round(area({ type: 'Feature', geometry }) / 100) / 100 }, geometry };
}) };
fs.writeFileSync(path.join(__dirname, '../data/official.geojson'), JSON.stringify(out));
for (const f of out.features) console.log(f.properties.county, f.properties.name, f.properties.status, f.properties.area_ha + 'ha', f.properties.case || '');
