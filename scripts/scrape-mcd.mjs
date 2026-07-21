// Scraper outlet McDonald's Indonesia
// Data GeoJSON semua outlet di-embed langsung di HTML halaman /locations.
// Jalankan: node scripts/scrape-mcd.mjs

const SOURCE_URL = 'https://www.mcdonalds.co.id/locations';

async function main() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error('Gagal fetch: ' + res.status);
  const html = await res.text();

  const marker = 'var geojson = ';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error('Tidak menemukan "var geojson =" di halaman.');

  // Ambil substring setelah marker, lalu cari array JSON dengan bracket balancing.
  const from = html.slice(start + marker.length).trimStart();
  if (from[0] !== '[') throw new Error('Format geojson tidak terduga.');

  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = 0; i < from.length; i++) {
    const c = from[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end === -1) throw new Error('Tidak bisa menemukan akhir array geojson.');

  const geojson = JSON.parse(from.slice(0, end));
  const collection = Array.isArray(geojson) ? geojson[0] : geojson;
  const features = collection.features || [];

  const outlets = features.map((f) => {
    const p = f.properties || {};
    const coords = f.geometry?.coordinates || [];
    const lng = parseFloat(coords[0]);
    const lat = parseFloat(coords[1]);
    const facilities = (p.fasilitas || []).map((x) => x.label || x.name).filter(Boolean);
    return {
      brand: "McDonald's",
      name: p.merchant || '',
      address: p.crossStreet || '',
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      phone: p.telephone || null,
      hours: [p.hours, p.days].filter(Boolean).join(' ') || null,
      facilities: facilities.length ? facilities : null,
    };
  }).filter((o) => o.name);

  const fs = await import('node:fs/promises');
  const outPath = new URL('../scripts/outlets_mcd.json', import.meta.url);
  await fs.writeFile(outPath, JSON.stringify(outlets, null, 2), 'utf8');
  console.log(`Berhasil scrape ${outlets.length} outlet McDonald's -> scripts/outlets_mcd.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
