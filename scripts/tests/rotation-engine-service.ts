// scripts/test-engine.ts
import { RotationEngineService } from '../../src/app/services/rotation-engine.service.ts';

const engine = new RotationEngineService();

// 1. Check total loaded catalog
const allCrops = engine.getAllCrops();
console.log(`Loaded ${allCrops.length} crops.`);

// 2. Search for a specific crop (exact & partial match)
console.log('\n--- Search: "rice" ---');
const crop = engine.getCropRequirements('rice');
console.log(
  crop
    ? {
        id: crop.id,
        name: crop.commonNames[0],
        scientificName: crop.scientificName,
        temp: crop.temp,
      }
    : 'Not found',
);

// 3. Test suitability filtering with sample climate/soil inputs
console.log('\n--- Suitable Crops (24°C, 1100mm rain, pH 6.2, medium texture) ---');
const matches = engine.findSuitableCrops({
  temperature: 24,
  rainfall: 1100,
  ph: 6.2,
  soilTexture: 'medium',
  availableDays: 120,
});

console.table(
  matches.slice(0, 10).map((m) => ({
    ID: m.crop.id,
    ScientificName: m.crop.scientificName,
    CommonName: m.crop.commonNames[0] || 'N/A',
    Score: `${m.suitabilityScore}%`,
  })),
);
