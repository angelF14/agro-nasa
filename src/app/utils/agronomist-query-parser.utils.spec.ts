import { Crop } from '@models/index';
import {
  enrichCatalogWithSpanishNames,
  extractCropsFromPrompt,
  extractLocationFromPrompt,
  getLocalizedCropName,
  parseAgronomistQuery,
  searchCatalogWithAliases,
} from './agronomist-query-parser.utils';

function createMockCrop(
  id: string,
  scientificName: string,
  commonNames: string[],
  family: string,
  category: string
): Crop {
  return {
    id,
    scientificName,
    commonNames,
    family,
    category,
    lifeSpan: 'annual',
    temp: {
      min: 8,
      optMin: 18,
      optMax: 30,
      max: 40,
      killingEarlyGrowth: null,
      killingRest: null,
    },
    rain: { min: 350, optMin: 600, optMax: 1200, max: 1800 },
    ph: { min: 5, optMin: 5.8, optMax: 7, max: 8 },
    geography: {
      latMin: null,
      latOptMin: null,
      latOptMax: null,
      latMax: null,
      altMax: 2800,
      climateZones: [],
    },
    light: {
      min: 'bright',
      optMin: 'bright',
      optMax: 'very bright',
      max: 'very bright',
      photoperiod: ['neutral day'],
    },
    soil: {
      depth: { optimal: ['medium'], absolute: ['shallow'] },
      texture: { optimal: ['medium'], absolute: ['light'] },
      fertility: { optimal: ['high'], absolute: ['moderate'] },
      alToxicity: { optimal: [], absolute: [] },
      salinity: { optimal: ['low'], absolute: ['low'] },
      drainage: { optimal: ['well'], absolute: ['well'] },
    },
    agronomy: {
      cycleDays: { min: 90, max: 120 },
      abioticTolerance: [],
      abioticSusceptibility: [],
      introductionRisk: [],
      productionSystem: [],
    },
  };
}

const MOCK_CATALOG: Crop[] = [
  createMockCrop('2189', 'Zea mays ssp. mays', ['corn', 'maize'], 'Gramineae', 'cereals'),
  createMockCrop(
    '1646',
    'Phaseolus vulgaris',
    ['common bean', 'frijoles'],
    'Leguminosae',
    'legumes_fibers'
  ),
  createMockCrop(
    '1993',
    'Solanum tuberosum',
    ['potato', 'white potato'],
    'Solanaceae',
    'roots_tubers'
  ),
];

describe('agronomist-query-parser.utils', () => {
  it('enriches FAO EcoCrop catalog so Spanish names appear first in commonNames', () => {
    const enriched = enrichCatalogWithSpanishNames(MOCK_CATALOG);
    expect(enriched[0].commonNames[0]).toBe('maíz');
    expect(enriched[1].commonNames[0]).toBe('frijol');
    expect(enriched[2].commonNames[0]).toBe('papa');
    expect(MOCK_CATALOG[0].commonNames[0]).toBe('corn');
  });

  it('chooses a localized common name without mutating crop data', () => {
    const crop = { ...MOCK_CATALOG[0], commonNames: ['maíz', 'corn', 'maize'] };
    const originalNames = [...crop.commonNames];

    expect(getLocalizedCropName(crop, 'en')).toBe('corn');
    expect(getLocalizedCropName(crop, 'es')).toBe('maíz');
    expect(crop.commonNames).toEqual(originalNames);
  });

  it('searches catalog with Spanish aliases and accent-insensitivity', () => {
    const enriched = enrichCatalogWithSpanishNames(MOCK_CATALOG);
    const maizMatches = searchCatalogWithAliases('maíz', enriched);
    expect(maizMatches.length).toBe(1);
    expect(maizMatches[0].scientificName).toBe('Zea mays ssp. mays');

    const porotoMatches = searchCatalogWithAliases('poroto', enriched);
    expect(porotoMatches.length).toBe(1);
    expect(porotoMatches[0].scientificName).toBe('Phaseolus vulgaris');
  });

  it('extracts both location and seed from a natural-language Spanish prompt', () => {
    const enriched = enrichCatalogWithSpanishNames(MOCK_CATALOG);
    const parsed = parseAgronomistQuery(
      'Quiero sembrar maíz en Comayagua, Honduras ¿es viable y qué rotación recomiendas?',
      enriched
    );

    expect(parsed.matchedCrops.length).toBe(1);
    expect(parsed.matchedCrops[0].scientificName).toBe('Zea mays ssp. mays');
    expect(parsed.locationQuery).toBe('Comayagua, Honduras');
  });

  it('extracts multiple crops when comparing seeds', () => {
    const enriched = enrichCatalogWithSpanishNames(MOCK_CATALOG);
    const { crops } = extractCropsFromPrompt(
      '¿Conviene más sembrar maíz, frijol o papa en este clima?',
      enriched
    );

    expect(crops.map((c) => c.scientificName)).toEqual([
      'Zea mays ssp. mays',
      'Phaseolus vulgaris',
      'Solanum tuberosum',
    ]);
  });

  it('extracts explicit lat/lon coordinates and ignores non-geographic stopwords', () => {
    const coordsRes = extractLocationFromPrompt('Tengo mi parcela en 14.4581, -87.6392 con frijol');
    expect(coordsRes.explicitCoordinates).toEqual({ lat: 14.4581, lon: -87.6392 });

    const stopwordRes = extractLocationFromPrompt('¿Cómo mejoro el nitrógeno en mi parcela?');
    expect(stopwordRes.locationQuery).toBeUndefined();
    expect(stopwordRes.explicitCoordinates).toBeUndefined();
  });

  it('extracts location from natural phrasing, nested prepositions, and bare short inputs', () => {
    const enriched = enrichCatalogWithSpanishNames(MOCK_CATALOG);

    const case1 = parseAgronomistQuery('Soy de Sinaloa, quiero sembrar frijol', enriched);
    expect(case1.locationQuery).toBe('Sinaloa');
    expect(case1.matchedCrops[0]?.scientificName).toBe('Phaseolus vulgaris');

    const case2 = parseAgronomistQuery(
      'Dame una recomendación para mi cultivo de maíz en Comayagua',
      enriched
    );
    expect(case2.locationQuery).toBe('Comayagua');
    expect(case2.matchedCrops[0]?.scientificName).toBe('Zea mays ssp. mays');

    const case3 = parseAgronomistQuery('Comayagua, maíz', enriched);
    expect(case3.locationQuery).toBe('Comayagua');
    expect(case3.matchedCrops[0]?.scientificName).toBe('Zea mays ssp. mays');

    const case4 = parseAgronomistQuery(
      'Quiero sembrar en mi parcela de Danlí semilla de frijol',
      enriched
    );
    expect(case4.locationQuery).toBe('Danlí');
    expect(case4.matchedCrops[0]?.scientificName).toBe('Phaseolus vulgaris');
  });
});
