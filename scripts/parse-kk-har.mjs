// Parser HAR HTTP Toolkit -> ekstrak semua outlet Kopi Kenangan.
// Cara pakai:
//   1. Di HTTP Toolkit, scroll list outlet di app sampai semua halaman ke-load.
//   2. Export request KK (query_pageable_store) sebagai HAR -> simpan scripts/kk_pages/kk.har
//   3. Jalankan: node scripts/parse-kk-har.mjs scripts/kk_pages/kk.har
//      -> hasil (array raw store) ditulis ke scripts/kk.json
//   4. Merge: $env:NAME='name'; $env:ADDR='address'; $env:LAT='latitude'; $env:LNG='longitude'; $env:PHONE='phone'
//            node scripts/convert-outlets.mjs scripts/kk.json "Kopi Kenangan"

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const harPath = process.argv[2];
if (!harPath) {
  console.error('Pakai: node scripts/parse-kk-har.mjs <file.har>');
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(await fs.readFile(harPath, 'utf8'));
const entries = (raw && raw.log && raw.log.entries) || [];

const stores = [];
const seen = new Set();

for (const entry of entries) {
  const url = (entry.request && entry.request.url) || '';
  if (!url.includes('query_pageable_store')) continue;

  const content = entry.response && entry.response.content;
  if (!content) continue;
  let text = content.text;
  if (!text) continue;
  if (content.encoding === 'base64') {
    text = Buffer.from(text, 'base64').toString('utf8');
  }

  try {
    const json = JSON.parse(text);
    const storeArr = json && json.data && Array.isArray(json.data.store) ? json.data.store : [];
    for (const s of storeArr) {
      const key = s.code || s.id || s.name;
      if (key && !seen.has(key)) {
        seen.add(key);
        stores.push(s);
      }
    }
  } catch (e) {
    console.warn('Gagal parse entry:', e.message);
  }
}

const outPath = path.join(here, '..', 'kk.json');
await fs.writeFile(outPath, JSON.stringify(stores, null, 2), 'utf8');
console.log(`SELESAI. ${stores.length} outlet Kopi Kenangan unik dari HAR -> scripts/kk.json`);
