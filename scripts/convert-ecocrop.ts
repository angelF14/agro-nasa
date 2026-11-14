import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'csv-parse/sync';

export interface CropProfile {
  scientificName: string;
  commonNames: string[];
  category: string;
  lifeSpan: string;
  temp: { min: number; optMin: number; optMax: number; max: number };
  rain: { min: number; optMin: number; optMax: number; max: number };
  ph: { min: number | null; optMin: number | null; optMax: number | null; max: number | null };
  cycleDays: { min: number | null; max: number | null };
  soilTexture: string[];
  soilDepth: string | null;
}

// Helper: safely convert CSV strings to numbers or null
const toNum = (val: string | undefined): number | null => {
  if (!val || val.trim() === '' || val.trim().toUpperCase() === 'NA') return null;
  const parsed = Number(val.trim());
  return Number.isNaN(parsed) ? null : parsed;
};

// Helper: split comma-separated cell values into clean arrays
const toList = (val: string | undefined): string[] => {
  if (!val || val.trim() === '') return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

// 1. Read and parse raw CSV (Note: older EcoCrop files sometimes use latin1 encoding)
const csvPath = path.resolve(import.meta.dirname, '../src/app/data/EcoCrop_DB.csv');
const rawCsv = fs.readFileSync(csvPath, 'utf8');

const records: Record<string, string>[] = parse(rawCsv, {
  columns: true, // Uses first row as keys
  skip_empty_lines: true,
  trim: true,
});

// 2. Filter & normalize rows
const agriculturalCategories = [
  'cereals',
  'legumes',
  'vegetables',
  'roots',
  'tubers',
  'forage',
  'pasture',
  'oil',
  'fibre',
  'fruits',
];

const cleanedCrops: CropProfile[] = [];

for (const row of records) {
  // Normalize column keys to lowercase in case your CSV headers are uppercase (e.g., TOPMN vs topmn)
  const r = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));

  const category = (r['cat'] || '').toLowerCase();
  const isAgCrop = agriculturalCategories.some((c) => category.includes(c));
  if (!isAgCrop) continue;

  // Parse core climate thresholds; skip species missing temperature or rainfall bounds
  const tmin = toNum(r['tmin']);
  const topmn = toNum(r['topmn']);
  const topmx = toNum(r['topmx']);
  const tmax = toNum(r['tmax']);

  const rmin = toNum(r['rmin']);
  const ropmn = toNum(r['ropmn']);
  const ropmx = toNum(r['ropmx']);
  const rmax = toNum(r['rmax']);

  if (
    tmin === null ||
    topmn === null ||
    topmx === null ||
    tmax === null ||
    rmin === null ||
    ropmn === null ||
    ropmx === null ||
    rmax === null
  ) {
    continue;
  }

  cleanedCrops.push({
    scientificName: r['scientificname'] || r['sciname'] || 'Unknown',
    commonNames: toList(r['comname']),
    category: r['cat'] || 'Other',
    lifeSpan: r['lispa'] || 'annual',
    temp: { min: tmin, optMin: topmn, optMax: topmx, max: tmax },
    rain: { min: rmin, optMin: ropmn, optMax: ropmx, max: rmax },
    ph: {
      min: toNum(r['phmin']),
      optMin: toNum(r['phopmn']),
      optMax: toNum(r['phopmx']),
      max: toNum(r['phmax']),
    },
    cycleDays: {
      min: toNum(r['gmin']),
      max: toNum(r['gmax']),
    },
    soilTexture: toList(r['text']),
    soilDepth: r['dep'] || null,
  });
}

// 3. Save clean JSON
const outPath = path.resolve(import.meta.dirname, '../src/app/data/crops.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(cleanedCrops, null, 2), 'utf8');

console.log(`Converted ${cleanedCrops.length} agricultural crops to ${outPath}`);
