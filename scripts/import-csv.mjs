// scripts/import-csv.mjs
// Uso: node scripts/import-csv.mjs
// Coloca los CSV en scripts/data/ con los nombres: profiles.csv, clients.csv,
// materials.csv, projects.csv, project_payments.csv, project_extras.csv,
// project_costs.csv, project_commitments.csv

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lee .env.local desde la raíz del proyecto
function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local');
  if (!existsSync(envPath)) throw new Error('.env.local no encontrado');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

// Parser CSV en una sola pasada (RFC 4180): respeta comillas, comas y saltos
// de línea dentro de campos entre comillas. Soporta "" como escape de comilla.
function parseCSV(content) {
  const text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const records = [];
  let row = [];
  let val = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { val += '"'; i++; }
        else inQuotes = false;
      } else {
        val += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(val);
        val = '';
      } else if (ch === '\n') {
        row.push(val);
        records.push(row);
        row = [];
        val = '';
      } else {
        val += ch;
      }
    }
  }
  // Última fila si no termina en newline
  if (val !== '' || row.length > 0) {
    row.push(val);
    records.push(row);
  }

  if (records.length < 2) return [];

  const headers = records[0].map(h => h.trim());
  const rows = [];
  for (let i = 1; i < records.length; i++) {
    const r = records[i];
    if (r.length === 1 && r[0] === '') continue; // saltar líneas vacías
    const obj = {};
    headers.forEach((h, idx) => {
      const v = r[idx];
      obj[h] = (v === undefined || v === '') ? null : v;
    });
    rows.push(obj);
  }
  return rows;
}

function readCSV(filename) {
  const path = join(__dirname, 'data', filename);
  if (!existsSync(path)) {
    console.warn(`  ⚠ No encontrado: scripts/data/${filename} — omitiendo`);
    return null;
  }
  const content = readFileSync(path, 'utf-8');
  const rows = parseCSV(content);
  console.log(`  ✓ Leído ${filename}: ${rows.length} fila(s)`);
  return rows;
}

async function upsertTable(supabase, table, rows, onConflict = 'id') {
  if (!rows || rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) {
    console.error(`  ✗ Error en ${table}:`, error.message);
  } else {
    console.log(`  ✓ ${table}: ${rows.length} registro(s) importados`);
  }
}

// Limpia campos numéricos (convierte null/'' a null, strings con coma a float)
function toNum(val) {
  if (val === null || val === '') return null;
  return parseFloat(String(val).replace(',', '.'));
}

function toInt(val) {
  if (val === null || val === '') return null;
  return parseInt(val, 10);
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('\n=== Importando CSV a Supabase ===\n');

  // 1. profiles
  const profiles = readCSV('profiles_rows.csv');
  if (profiles) {
    const clean = profiles.map(r => ({
      id: r.id,
      name: r.name,
      role: r.role,
      created_at: r.created_at || undefined,
    }));
    await upsertTable(supabase, 'profiles', clean);
  }

  // 2. clients
  const clients = readCSV('clients_rows.csv');
  if (clients) {
    const clean = clients.map(r => ({
      id: r.id,
      name: r.name,
      company_name: r.company_name,
      tax_id: r.tax_id,
      phone: r.phone,
      email: r.email,
      address: r.address,
      status: r.status,
      notes: r.notes,
      committed_expenses: toNum(r.committed_expenses) ?? 0,
      created_at: r.created_at || undefined,
    }));
    await upsertTable(supabase, 'clients', clean);
  }

  // 3. materials
  const materials = readCSV('materials_rows.csv');
  if (materials) {
    const clean = materials.map(r => ({
      id: r.id,
      name: r.name,
      unit: r.unit,
      price_usd: toNum(r.price_usd),
      category: r.category,
      provider: r.provider,
      notes: r.notes,
      updated_at: r.updated_at || undefined,
    }));
    await upsertTable(supabase, 'materials', clean);
  }

  // 4. projects (depende de clients)
  const projects = readCSV('projects_rows.csv');
  if (projects) {
    const clean = projects.map(r => ({
      id: r.id,
      client_id: r.client_id,
      title: r.title,
      description: r.description,
      status: r.status,
      start_date: r.start_date,
      end_date: r.end_date,
      budget_usd: toNum(r.budget_usd),
      budget_ves: toNum(r.budget_ves) ?? 0,
      progress_pct: toInt(r.progress_pct) ?? 0,
      proposal_number: r.proposal_number ? toInt(r.proposal_number) : null,
      created_at: r.created_at || undefined,
    }));
    await upsertTable(supabase, 'projects', clean);
  }

  // 5. project_payments (depende de projects)
  const payments = readCSV('project_payments_rows.csv');
  if (payments) {
    const clean = payments.map(r => ({
      id: r.id,
      project_id: r.project_id,
      amount_usd: toNum(r.amount_usd),
      amount_ves: toNum(r.amount_ves) ?? 0,
      date: r.date,
      reference: r.reference,
      description: r.description,
      created_at: r.created_at || undefined,
    }));
    await upsertTable(supabase, 'project_payments', clean);
  }

  // 6. project_extras (depende de projects)
  const extras = readCSV('project_extras_rows.csv');
  if (extras) {
    const clean = extras.map(r => ({
      id: r.id,
      project_id: r.project_id,
      description: r.description,
      amount_usd: toNum(r.amount_usd),
      created_at: r.created_at || undefined,
    }));
    await upsertTable(supabase, 'project_extras', clean);
  }

  // 7. project_costs (depende de projects)
  const costs = readCSV('project_costs_rows.csv');
  if (costs) {
    const clean = costs.map(r => ({
      id: r.id,
      project_id: r.project_id,
      description: r.description,
      category: r.category,
      quantity: toNum(r.quantity),
      unit: r.unit,
      unit_price_usd: toNum(r.unit_price_usd),
      total_usd: toNum(r.total_usd),
      provider: r.provider,
      date: r.date,
      created_at: r.created_at || undefined,
    }));
    await upsertTable(supabase, 'project_costs', clean);
  }

  // 8. project_commitments (depende de projects)
  const commitments = readCSV('project_commitments_rows.csv');
  if (commitments) {
    const clean = commitments.map(r => ({
      id: r.id,
      project_id: r.project_id,
      description: r.description,
      amount_usd: toNum(r.amount_usd),
      date: r.date,
      reference: r.reference,
      provider: r.provider,
      category: r.category,
      quantity: toNum(r.quantity),
      unit_price_usd: toNum(r.unit_price_usd),
      created_at: r.created_at || undefined,
    }));
    await upsertTable(supabase, 'project_commitments', clean);
  }

  console.log('\n=== Importación completada ===\n');
}

main().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
