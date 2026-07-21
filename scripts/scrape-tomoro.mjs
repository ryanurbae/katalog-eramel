// Scraper otomatis outlet Tomoro via endpoint resmi app.
// Endpoint memaafkan wToken (dummy cukup), jadi gak butuh token asli.
// Cara kerja: storeName adalah filter substring. Loop a-z + 0-9,
// union hasilnya = 100% outlet (tiap nama pasti punya >=1 huruf/angka).
// Jalankan: node scripts/scrape-tomoro.mjs

const BASE = 'https://api-service.tomoro-coffee.id/portal/app/basic/storeInfo/getStoreList/v3';
const PAGE_SIZE = 2000;

const HEADERS = {
  'User-Agent': 'okhttp/5.1.0',
  'Accept-Encoding': 'gzip',
  'appChannel': 'google play',
  'appLanguage': 'en',
  'countryCode': 'id',
  'deviceCode': 'scraper0000000000',
  'latitude': '-6.214721938666667',
  'longitude': '106.8450014385',
  'revision': '3.5.1',
  'timeZone': 'Asia/Jakarta',
  'ucde': 't698',
  'wToken': 'dummy',
  'token': '',
};

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

function buildUrl(storeName, pageNo) {
  const u = new URL(BASE);
  u.searchParams.set('pageNo', String(pageNo));
  u.searchParams.set('pageSize', String(PAGE_SIZE));
  u.searchParams.set('storeName', storeName);
  return u.toString();
}

async function fetchPage(storeName, pageNo) {
  const res = await fetch(buildUrl(storeName, pageNo), { headers: HEADERS });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  const records = (json && json.data && json.data.records) || [];
  return records;
}

async function scrapeChar(storeName) {
  const out = [];
  let pageNo = 1;
  const MAX_PAGES = 50;
  while (pageNo <= MAX_PAGES) {
    const records = await fetchPage(storeName, pageNo);
    out.push(...records);
    if (records.length < PAGE_SIZE) break; // halaman terakhir
    pageNo++;
    await new Promise(r => setTimeout(r, 150)); // jeda sopan
  }
  return out;
}

async function main() {
  const byCode = new Map();
  let requests = 0;

  for (const c of CHARS) {
    try {
      const recs = await scrapeChar(c);
      for (const r of recs) {
        if (r.storeCode) byCode.set(r.storeCode, r);
      }
      requests++;
      if (requests % 6 === 0) console.log(`Progress: ${requests}/${CHARS.length} query, total unik ${byCode.size}`);
      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.warn(`Query "${c}" gagal: ${e.message}`);
    }
  }

  const fs = await import('node:fs/promises');
  const outPath = new URL('../scripts/tomoro.json', import.meta.url);
  await fs.writeFile(outPath, JSON.stringify([...byCode.values()], null, 2), 'utf8');
  console.log(`SELESAI. ${byCode.size} outlet Tomoro unik tersimpan di scripts/tomoro.json`);
  console.log('Lanjut gabung ke outlets.json:');
  console.log('$env:NAME=\'storeName\'; $env:ADDR=\'storeAddress\'; $env:LAT=\'latitude\'; $env:LNG=\'longitude\'; $env:PHONE=\'storePhone\'');
  console.log('node scripts/convert-outlets.mjs scripts/tomoro.json "Tomoro"');
}

main().catch(e => { console.error(e); process.exit(1); });
