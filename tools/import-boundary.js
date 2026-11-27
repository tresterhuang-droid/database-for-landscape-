#!/usr/bin/env node
/* 匯入官方徵收範圍到 data/boundaries.geojson
 *
 * 用法：
 *   node tools/import-boundary.js <檔案> --case <案件id> --precision <官方範圍|計畫圖數化|示意>
 *        --source "<資料來源名稱>" [--url <來源網址>] [--filter 欄位=值] [--note "<說明>"]
 *
 * 支援：.shp（同資料夾需有 .dbf/.prj）、.zip（內含 shp）、.kml、.geojson/.json
 * 座標：自動判斷 WGS84 經緯度或 TWD97 二度分帶（EPSG:3826，澎湖可加 --tm119 用 EPSG:3825）
 * 同一案件再次匯入會取代舊範圍。
 */
const fs = require('fs'), path = require('path'), os = require('os');
const proj4 = require('proj4');
const area = require('@turf/area').default;

proj4.defs('EPSG:3826', '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
proj4.defs('EPSG:3825', '+proj=tmerc +lat_0=0 +lon_0=119 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
const PRECISION = ['官方範圍', '計畫圖數化', '示意'];

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const file = args[0];
const caseId = opt('case'), precision = opt('precision', '官方範圍'), source = opt('source'), url = opt('url', ''), note = opt('note', ''), filter = opt('filter');
if (!file || !caseId || !source) { console.error('需要：<檔案> --case <id> --source "<來源>"'); process.exit(1); }
if (!PRECISION.includes(precision)) { console.error('--precision 只能是：' + PRECISION.join('、')); process.exit(1); }

const root = path.join(__dirname, '..');
const cases = JSON.parse(fs.readFileSync(path.join(root, 'data/cases.json'), 'utf8'));
if (!cases.some(c => c.id === caseId)) { console.error('找不到案件 id：' + caseId); process.exit(1); }

async function read(f) {
  const ext = path.extname(f).toLowerCase();
  if (ext === '.geojson' || ext === '.json') return JSON.parse(fs.readFileSync(f, 'utf8'));
  if (ext === '.kml') {
    const { DOMParser } = require('@xmldom/xmldom');
    return require('@tmcw/togeojson').kml(new DOMParser().parseFromString(fs.readFileSync(f, 'utf8'), 'text/xml'));
  }
  if (ext === '.zip') {
    const AdmZip = require('adm-zip'), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bnd-'));
    new AdmZip(f).extractAllTo(dir, true);
    const shp = walk(dir).find(p => p.toLowerCase().endsWith('.shp'));
    if (!shp) throw new Error('zip 內找不到 .shp');
    return read(shp);
  }
  if (ext === '.shp') {
    const dbf = f.replace(/\.shp$/i, '.dbf');
    return require('shapefile').read(f, fs.existsSync(dbf) ? dbf : undefined, { encoding: 'utf-8' });
  }
  throw new Error('不支援的格式：' + ext);
}
const walk = d => fs.readdirSync(d).flatMap(n => { const p = path.join(d, n); return fs.statSync(p).isDirectory() ? walk(p) : [p]; });

function firstCoord(g) { let c = g.coordinates; while (Array.isArray(c[0])) c = c[0]; return c; }
function mapCoords(c, fn) { return typeof c[0] === 'number' ? fn(c) : c.map(x => mapCoords(x, fn)); }

(async () => {
  let fc = await read(file);
  if (fc.type !== 'FeatureCollection') fc = { type: 'FeatureCollection', features: [fc.type === 'Feature' ? fc : { type: 'Feature', geometry: fc, properties: {} }] };
  let feats = fc.features.filter(f => f.geometry && /Polygon/.test(f.geometry.type));
  if (filter) { const [k, v] = filter.split('='); feats = feats.filter(f => String((f.properties || {})[k]) === v); }
  if (!feats.length) throw new Error('沒有可用的面資料（Polygon）');

  const [x0] = firstCoord(feats[0].geometry);
  const crs = Math.abs(x0) > 1000 ? (args.includes('--tm119') ? 'EPSG:3825' : 'EPSG:3826') : null;
  const r6 = n => Math.round(n * 1e6) / 1e6;
  const polys = [];
  for (const f of feats) {
    const g = f.geometry;
    const coords = mapCoords(g.coordinates, c => { const p = crs ? proj4(crs, 'EPSG:4326', [c[0], c[1]]) : c; return [r6(p[0]), r6(p[1])]; });
    if (g.type === 'Polygon') polys.push(coords); else polys.push(...coords);
  }
  const geometry = { type: 'MultiPolygon', coordinates: polys };
  const ha = Math.round(area({ type: 'Feature', geometry }) / 100) / 100;

  const out = path.join(root, 'data/boundaries.geojson');
  const db = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : { type: 'FeatureCollection', features: [] };
  db.features = db.features.filter(f => f.properties.case !== caseId);
  db.features.push({ type: 'Feature', properties: { case: caseId, precision, source, url, note, area_ha: ha, imported: new Date().toISOString().slice(0, 10) }, geometry });
  fs.writeFileSync(out, JSON.stringify(db));
  console.log(`已匯入 ${caseId}：${polys.length} 個面，計算面積約 ${ha} 公頃（座標：${crs || 'WGS84'}）`);
  console.log('接著執行 node tools/build.js 更新網站資料');
})().catch(e => { console.error(e.message); process.exit(1); });
