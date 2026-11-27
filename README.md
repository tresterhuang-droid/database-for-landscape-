# 區段徵收地圖 map.waveintaiwan.com

台灣浪潮協會的全台區段徵收案件地圖。純靜態網站，不碰主站 WordPress。

## 檔案

- `docs/index.html`：網站本體（地圖、篩選、案件頁、時間軸）
- `docs/data.js`：內建資料（試算表未設定或讀取失敗時使用）
- `docs/bounds.js`：徵收範圍（由 `tools/import-boundary.js` 匯入後經 build 產生）
- `docs/vendor/`：Leaflet 地圖函式庫（自帶，不依賴外部 CDN）
- `docs/geo.js`：縣市界線（taiwan-atlas，已簡化）
- `docs/config.js`：Google 試算表 CSV 網址設定
- `data/cases.json`、`data/events.json`：資料原檔
- `tools/build.js`：由 JSON 產生 docs/data.js、bounds.js、geo.js 與 CSV
- `sheet/`：匯入 Google 試算表用的 CSV 與 xlsx

## 上線方式

- 網站檔案在 `docs/`，GitHub Pages 設定為 main 分支的 `/docs` 資料夾。
- `docs/CNAME` 已設定為 `map.waveintaiwan.com`。
- Cloudflare DNS：CNAME `map` → `tresterhuang-droid.github.io`（DNS only）。
- 改資料：編輯 `data/*.json` 後在 `tools/` 執行 `node build.js`，或改用 Google 試算表（見下節）。

## 讓同仁用試算表更新資料

1. 開啟 Google 試算表「區段徵收地圖｜資料後台」。
2. 檔案 > 共用 > 發布到網路：分別發布 `cases` 與 `events` 工作表，格式選「逗號分隔值（.csv）」。
3. 把兩個網址填進 `docs/config.js` 的 `casesCsv`、`eventsCsv`。之後改試算表，網站約 5 分鐘內反映（Google 快取）。

欄位規則見試算表「說明」分頁。status 只能填：執行中、審議中、規劃中、完成、中止。

## 地圖圖層

底圖與比較圖層都由讀者瀏覽器直接向內政部國土測繪中心 WMTS 取圖（`https://wmts.nlsc.gov.tw/wmts/{圖層}/default/GoogleMapsCompatible/{z}/{y}/{x}`）：

| 圖層 | 代碼 | 用途 |
| --- | --- | --- |
| 臺灣通用電子地圖 | EMAP | 道路、地名定位 |
| 正射影像 | PHOTO2 | 看聚落、農田、整地現況 |
| 國土利用現況調查 | LUIMAP | 徵收前是農地還是聚落 |
| 公有土地 | LAND_OPENDATA | 檢驗是否優先使用公有地 |
| 地段界 | LANDSECT | 區徵後新編地段的範圍 |
| 村里界 | Village | 受影響村里 |

另有內建的簡化縣市向量底圖，外部服務中斷時仍可使用。claude.ai 的預覽頁會擋外部圖磚，所以只看得到向量底圖；上線到 map.waveintaiwan.com 後才會出現上述圖層。

## 徵收範圍：匯入官方圖資

```
cd tools && npm install
node import-boundary.js <檔案> --case <案件id> --precision 官方範圍 --source "來源名稱" --url <來源網址>
node build.js
```

- 支援 .shp／.zip／.kml／.geojson，自動把 TWD97 二度分帶（EPSG:3826）轉成經緯度，並計算圖面面積。
- `--filter 欄位=值` 可從整份都市計畫圖檔中只取出某一區。
- `--precision` 三級：`官方範圍`（機關提供的範圍檔，地圖畫實線）、`計畫圖數化`（依都市計畫書附圖描繪，畫虛線）、`示意`（虛線）。
- 案件 id 見試算表 cases 的 id 欄。

### 已知的官方圖資來源（待逐案下載）

- 新北市：都市計畫土地使用分區與都市計畫範圍 SHP，新北市政府資料開放平臺（淡海、楓江、土城、埔墘、碧潭）。
- 臺南市：地理資訊倉儲平台提供「區段徵收」WMS 圖層（南科特定區、高鐵台南站）。
- 臺中市：臺中圖資雲 WMS 有整體開發相關圖層，需申請 API 金鑰（水湳、烏日九德、高鐵台中站）。
- 高雄市：地籍段界 SHP（205兵工廠、大社，可對照新編地段）。
- 其他案件：各案都市計畫書附圖（國土署都市計畫書圖查詢）→ 以 QGIS 描繪後匯入，精度標為「計畫圖數化」。
