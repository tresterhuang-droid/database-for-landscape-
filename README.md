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

底圖與比較圖層由讀者瀏覽器直接向內政部國土測繪中心 WMTS 取圖（`https://wmts.nlsc.gov.tw/wmts/{圖層}/default/GoogleMapsCompatible/{z}/{y}/{x}`）。

| 分組 | 圖層 | 代碼 |
| --- | --- | --- |
| 底圖 | 地形水文界線圖（預設） | MOI_HILLSHADE＋LUIMAP04（水利類）＋本站縣市界 |
| 底圖 | 簡化縣市圖（離線） | 本站向量 |
| 底圖 | 灰階／彩色電子地圖 | EMAP01、EMAP |
| 底圖 | 正射影像，可選 2014 至 2025 年 | PHOTO2、PHOTO2014…PHOTO2025 |
| 底圖 | 地形渲染圖 | MOI_SHADERMAP |
| 行政界線 | 鄉鎮市區界、村里界 | 本站向量（`towns.js`、`villages.js`，村里開啟時才下載） |
| 徵收範圍線索 | 地段類別（青色段名＝工業區整理、區段徵收） | LANDSECT2 |
| 徵收範圍線索 | 光達地形變異（整地、填土） | DDEM052 |
| 土地與制度 | 國土利用現況、民國82年國土利用 | LUIMAP、LUIMAP82 |
| 土地與制度 | 非都市土地使用分區、公有土地 | nURBAN1、LAND_OPENDATA |
| 地形 | 等高線 | MOI_CONTOUR_2 |

行政界線來源為 taiwan-atlas（內政部行政區界簡化版），以 `tools/admin-build.js` 產生。國土測繪中心沒有河川圖層，水文以國土利用調查的水利類（河道、水圳、埤塘）呈現。

## 官方資料（已收錄）

- `data/official/taipei.txt`：臺北市區段徵收區範圍（20處，[dataset 121676](https://data.gov.tw/dataset/121676)），由原始 SHP 解析，TWD97 整數座標差分編碼、抽稀誤差 1.5 公尺內。`tools/official-build.js` 轉為 `data/official.geojson`，`data/official/links.json` 對應本站案件。
- `data/moi_cases.csv`：內政部地政司「全國已公告區段徵收案件統計」（至2025年，150案，[dataset 127668](https://data.gov.tw/dataset/127668)），網站用於各縣市面積圖層與全國清單，並校正各案官方面積。

已查但無法直接使用：臺中市重劃區及區段徵收區範圍圖（僅提供 Google Drive 圖片連結）、臺中各案都市計畫公告圖（PDF）。桃園、臺南、新竹市等提供的是範圍「地號清單」，需搭配地籍圖才能畫出範圍。

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

## 示意範圍（data/schematic.json）

尚無官方向量圖的案件，先以國土測繪中心「地段圖」中段籍類別為「區段徵收」的地段，依段界描繪範圍，地圖上以虛線呈現並標註「示意範圍」。描繪方式：於地段圖 WMS 影像上，自青色段名所在地段起做區域填充，再取外框、簡化為多邊形。每案記錄所用段名、圖面面積與公告面積的差異說明（caveat）。取得機關正式圖面後，以 tools/import-boundary.js 匯入官方範圍即會取代示意範圍。
