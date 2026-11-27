// 產生：site/data.js（網站內建資料）、sheet/cases.csv、sheet/events.csv（Google 試算表後台用）
const fs = require('fs'), path = require('path');
const topo = require('topojson-client');
const root = path.join(__dirname, '..');
const cases = JSON.parse(fs.readFileSync(path.join(root, 'data/cases.json'), 'utf8'));
const events = JSON.parse(fs.readFileSync(path.join(root, 'data/events.json'), 'utf8'));

// 基本檢查
const ids = new Set(cases.map(c => c.id));
for (const e of events) if (!ids.has(e.case)) throw new Error('未知案件 ' + e.case);

// 縣市界線（去除金門、連江以聚焦本島與澎湖）
const t = require('./node_modules/taiwan-atlas/counties-10t.json');
const simp = require('topojson-simplify'); const ts = simp.simplify(simp.presimplify(t), 4e-6); const fc = topo.feature(ts, ts.objects.counties);
const r = n => Math.round(n * 1000) / 1000;
const roundCoords = c => typeof c[0] === 'number' ? [r(c[0]), r(c[1])] : c.map(roundCoords);
const geo = {
  type: 'FeatureCollection',
  features: fc.features.filter(f => !['連江縣', '金門縣'].includes(f.properties.COUNTYNAME))
    .map(f => ({ type: 'Feature', properties: { n: f.properties.COUNTYNAME }, geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) } }))
};

fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/data.js'),
  '/* 由 tools/build.js 產生；改資料請改 data/*.json 或 Google 試算表 */\n' +
  'window.WAVE_CASES=' + JSON.stringify(cases) + ';\n' +
  'window.WAVE_EVENTS=' + JSON.stringify(events) + ';\n');
const bp = path.join(root, 'data/boundaries.geojson');
const bounds = fs.existsSync(bp) ? JSON.parse(fs.readFileSync(bp, 'utf8')) : { type: 'FeatureCollection', features: [] };
// 官方範圍（政府開放資料）：全部輸出為比較圖層，對應到案件者併入案件範圍
const op = path.join(root, 'data/official.geojson');
const official = fs.existsSync(op) ? JSON.parse(fs.readFileSync(op, 'utf8')) : { type: 'FeatureCollection', features: [] };
for (const f of official.features) if (f.properties.case && !bounds.features.some(b => b.properties.case === f.properties.case))
  bounds.features.push({ type: 'Feature', properties: { case: f.properties.case, precision: '官方範圍', source: f.properties.source, url: f.properties.url, area_ha: f.properties.area_ha }, geometry: f.geometry });
// 示意範圍：以國土測繪中心地段圖（段籍類別為區段徵收之地段）描繪，非官方公告範圍
const sp = path.join(root, 'data/schematic.json');
const ringHa = r => { const R = 6378137, rad = Math.PI / 180; let a = 0; for (let i = 0; i < r.length - 1; i++) { const [x1, y1] = r[i], [x2, y2] = r[i + 1]; a += (x2 - x1) * rad * (2 + Math.sin(y1 * rad) + Math.sin(y2 * rad)); } return Math.abs(a * R * R / 2) / 1e4; };
if (fs.existsSync(sp)) for (const [id, s] of Object.entries(JSON.parse(fs.readFileSync(sp, 'utf8')))) if (!bounds.features.some(b => b.properties.case === id))
  bounds.features.push({ type: 'Feature', properties: { case: id, precision: '示意範圍', source: '國土測繪中心地段圖（' + s.sections + '）', url: 'https://maps.nlsc.gov.tw/', area_ha: Math.round(s.rings.reduce((t, r) => t + ringHa(r), 0) * 10) / 10, caveat: s.caveat || '' }, geometry: { type: 'MultiPolygon', coordinates: s.rings.map(r => [r]) } });
fs.writeFileSync(path.join(root, 'docs/official.js'), 'window.WAVE_OFFICIAL=' + JSON.stringify(official) + ';\n');
// 全國已公告區段徵收案件（地政司）
const csvLines = fs.readFileSync(path.join(root, 'data/moi_cases.csv'), 'utf8').replace(/^\ufeff/, '').trim().split('\n');
const splitCsv = l => { const o = []; let f = '', q = false; for (const ch of l) { if (q) { if (ch === '"') q = false; else f += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(f); f = ''; } else f += ch; } o.push(f); return o; };
const moi = csvLines.slice(1).map(splitCsv).map(r => ({ id: r[0], status: r[2], county: r[3], name: r[4], org: r[5], area: +r[6] || null, build: +r[7] || null, pub: +r[8] || null, date: r[9] }));
fs.writeFileSync(path.join(root, 'docs/moi.js'), 'window.WAVE_MOI=' + JSON.stringify(moi) + ';\n');
for (const f of bounds.features) if (!ids.has(f.properties.case)) throw new Error('範圍檔有未知案件 ' + f.properties.case);
fs.writeFileSync(path.join(root, 'docs/bounds.js'), '/* 徵收範圍：由 tools/import-boundary.js 匯入 */\nwindow.WAVE_BOUNDS=' + JSON.stringify(bounds) + ';\n');

// CSV
const esc = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const caseCols = ['id', 'name', 'county', 'lat', 'lng', 'status', 'area', 'area_note', 'agency', 'period', 'summary', 'controversy', 'wave_view', 'sources'];
const caseRows = cases.map(c => caseCols.map(k => k === 'sources' ? c.sources.map(s => s.t + ' | ' + s.u).join('\n') : c[k]).map(esc).join(','));
fs.mkdirSync(path.join(root, 'sheet'), { recursive: true });
fs.writeFileSync(path.join(root, 'sheet/cases.csv'), '﻿' + [caseCols.join(','), ...caseRows].join('\n'));
const evCols = ['case', 'date', 'type', 'title', 'url'];
fs.writeFileSync(path.join(root, 'sheet/events.csv'), '﻿' + [evCols.join(','), ...events.map(e => evCols.map(k => esc(e[k])).join(','))].join('\n'));
console.log(cases.length, 'cases,', bounds.features.length, 'boundaries,', official.features.length, 'official,', moi.length, 'moi,', events.length, 'events,');
