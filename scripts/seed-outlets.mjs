// Seed outlet McDonald's ke Supabase.
// Jalankan:
//   $env:SUPABASE_URL="https://xxxx.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ...service role..."
//   node scripts/seed-outlets.mjs
//
// Aman dijalankan berkali-kali: pakai upsert on_conflict (brand, name).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY dulu.');
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(here, 'outlets_mcd.json');
const rows = JSON.parse(await fs.readFile(jsonPath, 'utf8'));

const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/outlets`;
const batchSize = 200;

async function upsert(batch) {
  const res = await fetch(`${endpoint}?on_conflict=brand,name`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert gagal (${res.status}): ${text}`);
  }
}

let inserted = 0;
for (let i = 0; i < rows.length; i += batchSize) {
  const batch = rows.slice(i, i + batchSize);
  await upsert(batch);
  inserted += batch.length;
  console.log(`Insert ${inserted}/${rows.length}...`);
}

console.log(`Selesai. ${rows.length} outlet McDonald's di-upsert ke tabel outlets.`);
