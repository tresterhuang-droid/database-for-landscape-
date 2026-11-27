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
console.log(cases.length, 'cases,', bounds.features.length, 'boundaries,', events.length, 'events,');
