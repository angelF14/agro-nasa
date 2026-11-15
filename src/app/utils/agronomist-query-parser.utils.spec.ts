import { Crop } from '@models/index';
import {
  detectQueryLanguage,
  enrichCatalogWithSpanishNames,
  extractCropsFromPrompt,
  extractLocationFromPrompt,
  getLocalizedCropName,
  isValidLocationCandidate,
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

  it('extracts crops, locations, recommendation intent, and language from English prompts', () => {
    const enriched = enrichCatalogWithSpanishNames(MOCK_CATALOG);

    const case1 = parseAgronomistQuery('I want to plant corn in Iowa, is it viable?', enriched);
    expect(case1.language).toBe('en');
    expect(case1.locationQuery).toBe('Iowa');
    expect(case1.matchedCrops.map((c) => c.scientificName)).toEqual(['Zea mays ssp. mays']);

    const case2 = parseAgronomistQuery(
      'I live in Austin, Texas and want to grow beans and potatoes',
      enriched
    );
    expect(case2.language).toBe('en');
    expect(case2.locationQuery).toBe('Austin, Texas');
    expect(case2.matchedCrops.map((c) => c.scientificName)).toEqual([
      'Phaseolus vulgaris',
      'Solanum tuberosum',
    ]);

    const case3 = parseAgronomistQuery(
      'What crops do you recommend for Sinaloa, Mexico?',
      enriched
    );
    expect(case3.language).toBe('en');
    expect(case3.locationQuery).toBe('Sinaloa, Mexico');
    expect(case3.asksForSeedRecommendation).toBeTrue();

    const case4 = parseAgronomistQuery('Iowa, corn', enriched);
    expect(case4.language).toBe('en');
    expect(case4.locationQuery).toBe('Iowa');
    expect(case4.matchedCrops[0]?.scientificName).toBe('Zea mays ssp. mays');

    const case5 = parseAgronomistQuery('Compare corn and beans', enriched);
    expect(case5.locationQuery).toBeUndefined();
    expect(case5.matchedCrops.length).toBe(2);

    const stopwordCase = parseAgronomistQuery(
      'How do I improve nitrogen in my soil and what symptoms in leaves indicate water stress?',
      enriched
    );
    expect(stopwordCase.language).toBe('en');
    expect(stopwordCase.locationQuery).toBeUndefined();

    expect(detectQueryLanguage('Quiero sembrar maíz en Comayagua')).toBe('es');
    expect(detectQueryLanguage('What planting date is best for corn in Kansas?')).toBe('en');
    expect(detectQueryLanguage('Speak in English')).toBe('en');
    expect(detectQueryLanguage('Responde en inglés')).toBe('en');
    expect(detectQueryLanguage('What about onion?')).toBe('en');
    expect(detectQueryLanguage('In Spanish please')).toBe('es');

    expect(isValidLocationCandidate('Ingles', [])).toBeFalse();
    expect(isValidLocationCandidate('English', [])).toBeFalse();
    expect(isValidLocationCandidate('Español', [])).toBeFalse();
    expect(isValidLocationCandidate('Comayagua', [])).toBeTrue();

    const languageSwitchCase = parseAgronomistQuery('Responde en ingles por favor', enriched);
    expect(languageSwitchCase.language).toBe('en');
    expect(languageSwitchCase.locationQuery).toBeUndefined();
  });

  it('accurately detects Spanish vs English across unaccented, shared-word, and accented-place-name queries', () => {
    const enriched = enrichCatalogWithSpanishNames(MOCK_CATALOG);

    // Spanish queries without accents or with shared words ("viable", "banana", "ok", "plan")
    expect(detectQueryLanguage('Es viable la soya en Sinaloa?', 'en')).toBe('es');
    expect(detectQueryLanguage('Que tal se da la banana en Ecuador?', 'en')).toBe('es');
    expect(detectQueryLanguage('Ok dame el plan de rotacion', 'en')).toBe('es');
    expect(detectQueryLanguage('Si por favor explicame mas', 'en')).toBe('es');
    expect(detectQueryLanguage('Y en Chiapas?', 'en')).toBe('es');
    expect(detectQueryLanguage('Maiz en Sinaloa', 'en')).toBe('es');
    expect(detectQueryLanguage('Que me dices del sorgo?', 'en')).toBe('es');
    expect(detectQueryLanguage('La tierra esta muy seca', 'en')).toBe('es');
    expect(detectQueryLanguage('Cuales son los tres ciclos?', 'en')).toBe('es');
    expect(detectQueryLanguage('Se puede plantar cacao en Tabasco?', 'en')).toBe('es');

    // English queries including accented Latin American place names
    expect(detectQueryLanguage('Corn in León', 'es')).toBe('en');
    expect(detectQueryLanguage('Planting corn in Panamá', 'es')).toBe('en');
    expect(detectQueryLanguage('Growing coffee in Bogotá', 'es')).toBe('en');
    expect(detectQueryLanguage('I live in Cancún, what can I plant?', 'es')).toBe('en');
    expect(detectQueryLanguage('Is sorghum viable in Córdoba?', 'es')).toBe('en');
    expect(detectQueryLanguage('Soybeans in Iowa', 'es')).toBe('en');
    expect(detectQueryLanguage('Strawberries in California', 'es')).toBe('en');
    expect(detectQueryLanguage('And in Texas?', 'es')).toBe('en');
    expect(detectQueryLanguage('Give me a 3 cycle rotation', 'es')).toBe('en');
    expect(detectQueryLanguage('More details please', 'es')).toBe('en');
    expect(detectQueryLanguage("I'm in Kansas", 'es')).toBe('en');

    // Localized crop name helper returns Spanish for 'es' and English for 'en'
    expect(getLocalizedCropName(enriched[0], 'es')).toBe('maíz');
    expect(getLocalizedCropName(enriched[0], 'en')).toBe('corn');
    expect(getLocalizedCropName(enriched[1], 'es')).toBe('frijol');
    expect(getLocalizedCropName(enriched[1], 'en')).toBe('common bean');
  });
});
