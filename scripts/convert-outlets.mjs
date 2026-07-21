// Converter & merger outlet dari hasil capture API (Kopi Kenangan / Tomoro / lainnya).
// Pakai:
//   node scripts/convert-outlets.mjs <file-json-capture> "<Nama Brand>" [file-outlets-existing]
//
// Script ini otomatis cari field name/address/lat/lng dari bentuk JSON apa pun.
// Kalau ada yang kelewat, kamu bisa override lewat env:
//   NAME=outlet_name ADDR=alamat LAT=latitude LNG=longitude node scripts/convert-outlets.mjs ...

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const capturePath = process.argv[2];
const brand = process.argv[3] || 'Unknown';
const outletsPath = process.argv[4]
  ? path.resolve(process.argv[4])
  : path.join(here, '..', 'outlets.json');

if (!capturePath) {
  console.error('Pakai: node scripts/convert-outlets.mjs <capture.json> "<Brand>"');
  process.exit(1);
}

// Override nama field (opsional lewat env)
const F = {
  name: process.env.NAME || null,
  address: process.env.ADDR || null,
  lat: process.env.LAT || null,
  lng: process.env.LNG || null,
  phone: process.env.PHONE || null,
  hours: process.env.HOURS || null,
};

function pick(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return undefined;
}

function getCoord(item) {
  // Coba banyak bentuk umum koordinat.
  const tryLat = F.lat ? [F.lat] : ['latitude', 'lat', 'y'];
  const tryLng = F.lng ? [F.lng] : ['longitude', 'lng', 'lon', 'x'];

  let lat = pick(item, tryLat);
  let lng = pick(item, tryLng);

  // Bentuk nested: location / coordinates / latlng
  const nested = item.location || item.coordinates || item.latlng || item.geo || item.position;
  if (nested) {
    if (Array.isArray(nested)) {
      // [lng, lat] atau [lat, lng]
      if (lat === undefined) lat = nested[1] ?? nested[0];
      if (lng === undefined) lng = nested[0] ?? nested[1];
    } else if (typeof nested === 'object') {
      if (lat === undefined) lat = nested.lat ?? nested.latitude ?? nested.y;
      if (lng === undefined) lng = nested.lng ?? nested.longitude ?? nested.x;
    }
  }
  if (typeof lat === 'string') lat = parseFloat(lat);
  if (typeof lng === 'string') lng = parseFloat(lng);
  return { lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null };
}

function normalizeName(item) {
  const keys = F.name ? [F.name] : ['name', 'outlet_name', 'store_name', 'branch_name', 'title', 'outlet', 'label'];
  return pick(item, keys);
}
function normalizeAddress(item) {
  const keys = F.address ? [F.address] : ['address', 'full_address', 'alamat', 'street', 'location_name', 'detail'];
  return pick(item, keys);
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  const candidates = [
    data,
    data && data.data,
    data && data.data && data.data.data,
    data && data.response,
  ].filter(Boolean);
  for (const obj of candidates) {
    if (!obj || typeof obj !== 'object') continue;
    for (const k of ['store', 'records', 'data', 'results', 'items', 'stores', 'outlets']) {
      if (Array.isArray(obj[k])) return obj[k];
    }
    for (const k of Object.keys(obj)) {
      if (Array.isArray(obj[k])) return obj[k];
    }
  }
  return [];
}

let items = [];
const stat = await fs.stat(capturePath).catch(() => null);
if (stat && stat.isDirectory()) {
  const files = (await fs.readdir(capturePath)).filter(f => f.toLowerCase().endsWith('.json'));
  for (const f of files) {
    const d = JSON.parse(await fs.readFile(path.join(capturePath, f), 'utf8'));
    items = items.concat(asArray(d));
  }
  console.log(`Membaca ${files.length} file JSON dari folder.`);
} else {
  const raw = JSON.parse(await fs.readFile(capturePath, 'utf8'));
  items = asArray(raw);
}
if (!items.length) {
  console.error('Tidak ada array outlet yang ketemu di file capture. Cek strukturnya.');
  process.exit(1);
}

let existing = [];
try { existing = JSON.parse(await fs.readFile(outletsPath, 'utf8')); } catch { /* file mungkin belum ada */ }

const seen = new Set(existing.map(o => `${o.brand}|${o.name}`));
let added = 0;

for (const it of items) {
  const name = normalizeName(it);
  if (!name) continue;
  const { lat, lng } = getCoord(it);
  const key = `${brand}|${name}`;
  if (seen.has(key)) continue;
  seen.add(key);
  existing.push({
    brand,
    name,
    address: normalizeAddress(it) || null,
    lat,
    lng,
    phone: F.phone ? it[F.phone] : (it.phone || it.telephone || null),
    hours: F.hours ? it[F.hours] : (it.hours || it.operational_hours || null),
    facilities: null,
  });
  added++;
}

await fs.writeFile(outletsPath, JSON.stringify(existing, null, 2), 'utf8');
console.log(`Selesai. ${added} outlet "${brand}" baru ditambah. Total sekarang: ${existing.length}.`);
