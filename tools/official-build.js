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
// 桃園：由桃園市都市計畫地理資訊服務網圖層計算（見 tools/taoyuan-gis.js）
const ty = require('./taoyuan-gis.js');
const TYSRC = '桃園市都市計畫地理資訊服務網', TYURL = 'https://urplanning.tycg.gov.tw/gisMap/';
out.features.push({ type: 'Feature', properties: { name: '桃園航空城（機場園區及附近地區第一、二期）', status: '辦理中', county: '桃園市', source: TYSRC + '：「都市計畫區範圍」中航空城特定區與二期範圍，扣除「航空城剔除區段徵收地區」', url: TYURL, case: 'aerotropolis', precision: '官方圖資計算', area_ha: ty.aero.area, note: '以桃園市政府圖層計算，結果約 3,160 公頃（簡化前 3,146.5 公頃），與官方公告區徵面積 3,148 公頃相符；非地籍分割成果。' }, geometry: ty.aero.geometry });
const tyNames = { d0: '大園都市計畫區段徵收地區', d1: '中壢老街溪兩側都市更新第一期', d3: '中路地區整體開發', d4: '中壢運動公園生活園區（中壢平鎮部分）', d5: '中壢運動公園生活園區（龍岡部分）', d6: '機場捷運A21站周邊（中壢平鎮部分）', d7: '機場捷運A21站周邊（中內壢交流道特定區部分）' };
for (const [k, n] of Object.entries(tyNames)) if (ty[k]) out.features.push({ type: 'Feature', properties: { name: n, status: '都市計畫指定以區段徵收開發', county: '桃園市', source: TYSRC + '「整體開發地區」：' + ty[k].name, url: TYURL, case: null, area_ha: ty[k].area }, geometry: ty[k].geometry });
fs.writeFileSync(path.join(__dirname, '../data/official.geojson'), JSON.stringify(out));
for (const f of out.features) console.log(f.properties.county, f.properties.name, f.properties.status, f.properties.area_ha + 'ha', f.properties.case || '');
