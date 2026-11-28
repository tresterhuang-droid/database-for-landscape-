// 第二批：古蹟燒母體中具法定身分或審議中、尚未上圖者；縣市缺口案例；依火災列表校正日期
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const cp = path.join(root, 'data/cases.json'), ep = path.join(root, 'data/events.json');
const cases = JSON.parse(fs.readFileSync(cp, 'utf8')), events = JSON.parse(fs.readFileSync(ep, 'utf8'));
const S = (t, u) => ({ t, u });
const WIKI = S('臺灣文化資產火災列表（維基百科，作為母體索引）', 'https://zh.wikipedia.org/wiki/%E8%87%BA%E7%81%A3%E6%96%87%E5%8C%96%E8%B3%87%E7%94%A2%E7%81%AB%E7%81%BD%E5%88%97%E8%A1%A8');
const fire = (id, name, county, lat, lng, status, period, legal, summary, extra = '') => ({ id, type: '古蹟燒', name, county, lat, lng, status, area: null, area_note: '', agency: '', period, legal,
  summary, controversy: '起火原因以消防鑑定或主管機關說明為準，本站不推定。' + extra + '本案依火災列表收錄，火災後現況待查，點位為大致位置。', sources: [WIKI], wave_view: '' });
const add = [
  fire('fire-dasyueshan', '東勢大雪山製材廠火災', '台中市', 24.2585, 120.8270, '待查', '2006 火災', '歷史建築（2002年登錄）', '大雪山林業公司製材廠是台灣林業史的重要遺構，2002年登錄為歷史建築，2006年發生火災。'),
  fire('fire-tainan-agri', '原臺南州立農事試驗場辦公廳舍火災', '台南市', 22.9930, 120.2240, '待查', '2006 火災', '直轄市定古蹟（依列表註記）', '原臺南州立農事試驗場辦公廳舍2006年發生火災。'),
  fire('fire-jingyuan', '清水黃家古宅「瀞園」火災', '台中市', 24.2700, 120.5760, '已滅失', '2007 火災，房舍全毀', '歷史建築', '清水黃家古宅「瀞園」為歷史建築，2007年火災中房舍全毀。'),
  fire('fire-xiucaicuo', '蘆洲秀才厝火災與拆除', '新北市', 25.0850, 121.4730, '已滅失', '2004 起認列古蹟協商；2008 火災；2009 拆除', '認列古蹟協商中，未完成指定', '百年歷史的蘆洲秀才厝，自2004年起文化主管機關與所有權人協商認列古蹟。2008年遭縱火，2009年拆除。', '列表記載為惡意縱火。此案是「協商期間無保護」的典型：建物尚未取得身分，協商本身不構成暫定保護。'),
  fire('fire-fengshan-longshan', '鳳山龍山寺火災', '高雄市', 22.6255, 120.3600, '待查', '2012 火災', '國定古蹟', '國定古蹟鳳山龍山寺2012年發生火災，文化部協助處理。', '列表記載疑遭縱火。'),
  fire('fire-lukang-fengshan', '鹿港鳳山寺火災', '彰化縣', 24.0520, 120.4340, '待查', '2016-08-24 火災', '縣定古蹟', '縣定古蹟鹿港鳳山寺2016年8月24日清晨失火。', '列表記載原因待查，不排除香客祭拜後的殘火。'),
  fire('fire-changhua-guandi', '彰化關帝廟火災', '彰化縣', 24.0775, 120.5420, '待查', '2017-02-08 火災', '縣定古蹟', '縣定古蹟彰化關帝廟2017年2月8日發生火災。'),
  // 縣市缺口：高雄、新北
  { id: 'fengshan-station', type: '市地重劃', name: '高雄鳳山車站周邊第85期市地重劃', county: '高雄市', lat: 22.6270, lng: 120.3590, status: '執行中', area: 8,
    area_note: '約8公頃', agency: '高雄市政府地政局', period: '鐵路地下化後辦理；拆遷抗爭見公視報導',
    summary: '高雄鐵路地下化後，市府以公辦市地重劃重新開發鳳山車站周邊八公頃多的土地。原本一百多戶住戶，報導時只剩陳家一戶未搬遷，自救會到市府抗議，並與官員發生肢體衝突。',
    controversy: '自救會質疑車站前原有寬廣道路空間，卻因擴大商業開發而必須拆屋；要求溝通期間不得拆除，並希望市長親自溝通。市府副秘書長表示溝通管道一直存在，承諾向市長報告。',
    legal: '', sources: [S('公視：鳳山車站周遭8公頃土地重劃 居民反對', 'https://news.pts.org.tw/article/492722')], wave_view: '' },
  { id: 'wucuo', type: '市地重劃', name: '高雄大寮伍厝自辦市地重劃（第74期）', county: '高雄市', lat: 22.6050, lng: 120.3980, status: '中止', area: 8.01,
    area_note: '約8.01公頃', agency: '伍厝自辦市地重劃會（高雄市政府核准後廢止）', period: '2022-09 核准實施；2023-04-21 市府廢止核准',
    summary: '伍厝自辦市地重劃會2022年9月獲高雄市政府核准實施，區內26戶、上百位居民不願參加卻被劃入範圍，多次赴市府陳情，並指控住家附近出現圍籬與怪手。市府要求重劃會將不同意者剔除範圍，重劃會逾期未提方案，地政局於2023年4月21日廢止原核准處分。',
    controversy: '此案是少數由地方政府以「優先保障弱勢、維護社會公益」為由，主動廢止自辦重劃核准的案例，可與台中、台南多起仍在爭訟的案件對照。',
    legal: '', sources: [S('旺得富：高市府廢止伍厝自辦重劃核准（2023）', 'https://wantrich.chinatimes.com/news/20230421900708-420501'), S('公視：反大寮伍厝重劃案 自救會赴高雄市府陳情', 'https://news.pts.org.tw/article/619612'), S('NOWnews：市府要求重劃會提出剔除方案', 'https://www.nownews.com/news/6089197')], wave_view: '' },
  { id: 'yonghe-zhulin', type: '都市更新', name: '新北永和竹林段都更案（市府代拆）', county: '新北市', lat: 25.0145, lng: 121.5150, status: '執行中', area: null,
    area_note: '', agency: '實施者；新北市政府城鄉發展局都市更新處', period: '2023 權利變換計畫核定；其後市府代為拆除',
    summary: '鄰近永和網溪國小的竹林段都更案，2023年權利變換計畫核定，歷經九次協調後只剩一位1999年起旅居美國、無法聯繫的地主。新北市都市更新及爭議處理審議會作成拆除決定，由市府代為拆除，是新北市審議代拆的第三案。',
    controversy: '市府強調已透過外交部、移民署等管道嘗試聯繫並完備程序。此案的問題在於：無法聯繫的所有權人，在程序上如何被視為「已表達意見」。新北市2019年訂定代拆辦法後，已受理6件代拆案。',
    legal: '', sources: [S('科技新報：永和竹林段都更 新北市府強拆', 'https://technews.tw/?p=1309762')], wave_view: '' },
  { id: 'informal-putian', type: '非正式歷史建築', name: '土城媽祖田普安堂', county: '新北市', lat: 24.9555, lng: 121.4365, status: '爭議中', area: null,
    area_note: '', agency: '新北市政府文化局', period: '文資審議期間部分建物遭地主拆除；學者赴監察院陳情',
    summary: '土城媽祖田的普安堂有百年歷史。學者指出，新北市府以「必須經過土地所有人同意」作為文化資產指定登錄的要件，遲遲沒有公告其文資身分，導致部分建物被地主強拆。',
    controversy: '多位學者赴監察院陳情，要求文資審議重視專業、公開透明，並指出提報列冊後未進行審議的空窗期，讓有心人士得以破壞。屏東恆春張家古厝的保存者也以此案說明類似困境。',
    legal: '審議中未公告身分', sources: [S('公視：具文化價值建物常未審先拆 學者表憂心', 'https://news.pts.org.tw/article/427572')], wave_view: '' },
];
const have = new Set(cases.map(c => c.id));
for (const c of add) if (!have.has(c.id)) cases.push(c);
// 依火災列表校正
const fix = (id, f) => { const c = cases.find(x => x.id === id); if (c) f(c); };
fix('fire-zhengzhou', c => { c.period = '2011 火災；2016-10-08 再度起火'; c.summary = '北門附近鄭州路38巷的台鐵日式宿舍，2011年起火後，2016年10月8日再度發生火災，木造房屋全面燃燒。宿舍為台鐵產權，當時未經文資登錄。'; c.sources = [WIKI]; });
fix('fire-nanguo', c => { c.period = '2019-01-04 火災'; c.summary = c.summary.replace('某月4日深夜', '2019年1月4日深夜'); });
fix('fire-madou-xie', c => { c.summary = c.summary.replace('2019年初發生火災', '2019年1月1日發生火災，屋頂燒出兩個大洞'); c.sources.push(WIKI); });
fix('fire-huaguang', c => { c.period = '2008、2011、2013、2016 多次火災；2008 起拆屋還地訴訟；2013 拆除'; c.summary += '依火災列表，社區在2008、2011、2013年均曾起火，2016年9月25日原台北刑務所南官舍四間日式平房全毀。'; c.sources.push(WIKI); });
const ev = [
  ['fire-dasyueshan', '2006', '衝突', '火災'], ['fire-tainan-agri', '2006', '衝突', '火災'], ['fire-jingyuan', '2007', '衝突', '火災，房舍全毀'],
  ['fire-xiucaicuo', '2004', '程序', '開始協商認列古蹟'], ['fire-xiucaicuo', '2008', '衝突', '遭縱火'], ['fire-xiucaicuo', '2009', '程序', '拆除'],
  ['fire-fengshan-longshan', '2012', '衝突', '火災'], ['fire-lukang-fengshan', '2016-08-24', '衝突', '火災'], ['fire-changhua-guandi', '2017-02-08', '衝突', '火災'],
  ['fire-zhengzhou', '2011', '衝突', '火災'], ['fire-huaguang', '2016-09-25', '衝突', '南官舍四間日式平房全毀'],
  ['wucuo', '2022-09-29', '程序', '市府核准實施市地重劃'], ['wucuo', '2023-03-21', '程序', '市府要求剔除不同意者土地'], ['wucuo', '2023-04-21', '程序', '市府廢止核准處分'],
  ['yonghe-zhulin', '2023', '程序', '權利變換計畫核定'],
];
// 修正舊事件日期
for (const e of events) {
  if (e.case === 'fire-zhengzhou' && e.date === '2016-11-08') e.date = '2016-10-08';
  if (e.case === 'fire-nanguo' && /待核/.test(e.date)) e.date = '2019-01-04';
  if (e.case === 'fire-madou-xie' && e.date === '2019') e.date = '2019-01-01';
}
const key = e => e.case + '|' + e.date + '|' + e.title, ek = new Set(events.map(key));
for (const [c, d, t, ti] of ev) { const e = { case: c, date: d, type: t, title: ti, url: '' }; if (!ek.has(key(e))) events.push(e); }
fs.writeFileSync(cp, JSON.stringify(cases, null, 1)); fs.writeFileSync(ep, JSON.stringify(events, null, 1));
console.log(cases.length, 'cases', events.length, 'events');
