import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'csv-parse/sync';

export interface CropProfile {
  id: string;
  scientificName: string;
  commonNames: string[];
  category: string;
  lifeSpan: string;
  temp: {
    min: number;
    optMin: number;
    optMax: number;
    max: number;
    killingEarlyGrowth: number | null;
    killingRest: number | null;
  };
  rain: {
    min: number;
    optMin: number;
    optMax: number;
    max: number;
  };
  ph: {
    min: number | null;
    optMin: number | null;
    optMax: number | null;
    max: number | null;
  };
  geography: {
    latMin: number | null;
    latOptMin: number | null;
    latOptMax: number | null;
    latMax: number | null;
    altMax: number | null;
    climateZones: string[];
  };
  light: {
    min: string | null;
    optMin: string | null;
    optMax: string | null;
    max: string | null;
    photoperiod: string[];
  };
  soil: {
    depth: { optimal: string[]; absolute: string[] };
    texture: { optimal: string[]; absolute: string[] };
    fertility: { optimal: string[]; absolute: string[] };
    alToxicity: { optimal: string[]; absolute: string[] };
    salinity: { optimal: string[]; absolute: string[] };
    drainage: { optimal: string[]; absolute: string[] };
  };
  agronomy: {
    cycleDays: { min: number | null; max: number | null };
    abioticTolerance: string[];
    abioticSusceptibility: string[];
    introductionRisk: string[];
    productionSystem: string[];
  };
}

// Helper: safely convert CSV strings to numbers or null
const toNum = (val: string | undefined): number | null => {
  if (!val || val.trim() === '' || val.trim().toUpperCase() === 'NA') return null;
  const parsed = Number(val.trim());
  return Number.isNaN(parsed) ? null : parsed;
};

// Helper: clean nullable strings
const toStr = (val: string | undefined): string | null => {
  if (!val || val.trim() === '' || val.trim().toUpperCase() === 'NA') return null;
  return val.trim();
};

// Helper: split comma-separated cell values into clean arrays
const toList = (val: string | undefined): string[] => {
  if (!val || val.trim() === '' || val.trim().toUpperCase() === 'NA') return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

// 1. Read and parse raw CSV (Note: older EcoCrop files sometimes use latin1 encoding)
const csvPath = path.resolve(import.meta.dirname, '../src/app/data/EcoCrop_DB.csv');
const rawCsv = fs.readFileSync(csvPath, 'latin1');

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
    id: String(r['ecoportcode'] || '').trim(),
    scientificName: r['scientificname'] || r['sciname'] || 'Unknown',
    commonNames: toList(r['comname']),
    category: r['cat'] || 'Other',
    lifeSpan: r['lispa'] || 'annual',
    temp: {
      min: tmin,
      optMin: topmn,
      optMax: topmx,
      max: tmax,
      killingEarlyGrowth: toNum(r['ktmp']),
      killingRest: toNum(r['ktmpr']),
    },
    rain: {
      min: rmin,
      optMin: ropmn,
      optMax: ropmx,
      max: rmax,
    },
    ph: {
      min: toNum(r['phmin']),
      optMin: toNum(r['phopmn']),
      optMax: toNum(r['phopmx']),
      max: toNum(r['phmax']),
    },
    geography: {
      latMin: toNum(r['latmn']),
      latOptMin: toNum(r['latopmn']),
      latOptMax: toNum(r['latopmx']),
      latMax: toNum(r['latmx']),
      altMax: toNum(r['altmx']),
      climateZones: toList(r['cliz']),
    },
    light: {
      min: toStr(r['limn']),
      optMin: toStr(r['liopmn']),
      optMax: toStr(r['liopmx']),
      max: toStr(r['limx']),
      photoperiod: toList(r['photo']),
    },
    soil: {
      depth: { optimal: toList(r['dep']), absolute: toList(r['depr']) },
      texture: { optimal: toList(r['text']), absolute: toList(r['textr']) },
      fertility: { optimal: toList(r['fer']), absolute: toList(r['ferr']) },
      alToxicity: { optimal: toList(r['tox']), absolute: toList(r['toxr']) },
      salinity: { optimal: toList(r['sal']), absolute: toList(r['salr']) },
      drainage: { optimal: toList(r['dra']), absolute: toList(r['drar']) },
    },
    agronomy: {
      cycleDays: {
        min: toNum(r['gmin']),
        max: toNum(r['gmax']),
      },
      abioticTolerance: toList(r['abitol']),
      abioticSusceptibility: toList(r['abisus']),
      introductionRisk: toList(r['intri']),
      productionSystem: toList(r['prosy']),
    },
  });
}

// 3. Save clean JSON
const outPath = path.resolve(import.meta.dirname, '../src/app/data/crops.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(cleanedCrops, null, 2), 'utf8');

console.log(`Converted ${cleanedCrops.length} agricultural crops to ${outPath}`);
