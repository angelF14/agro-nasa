import { Coordinates, Crop } from '@models/index';

export interface SpanishCropAlias {
  spanishLabel: string;
  terms: string[];
  scientificTargets: string[];
}

export interface ParsedAgronomistQuery {
  matchedCrops: Crop[];
  matchedCropTerms: string[];
  locationQuery?: string;
  explicitCoordinates?: Coordinates;
  asksForSeedRecommendation: boolean;
  language: 'es' | 'en';
}

export const SPANISH_CROP_ALIASES: SpanishCropAlias[] = [
  {
    spanishLabel: 'maíz dulce',
    terms: ['maiz dulce', 'elote dulce', 'choclo dulce', 'sweet corn', 'sweetcorn'],
    scientificTargets: ['Zea mays ssp. saccharata'],
  },
  {
    spanishLabel: 'maíz',
    terms: ['maiz', 'elote', 'choclo', 'milpa', 'zea mays', 'corn', 'maize', 'field corn', 'dent corn', 'flint corn'],
    scientificTargets: ['Zea mays ssp. mays', 'Zea mays ssp. saccharata'],
  },
  {
    spanishLabel: 'frijol',
    terms: [
      'frijol',
      'frijoles',
      'poroto',
      'porotos',
      'habichuela',
      'caraota',
      'alubia',
      'judia',
      'bean',
      'beans',
      'common bean',
      'common beans',
      'dry bean',
      'dry beans',
      'kidney bean',
      'black bean',
      'pinto bean',
      'navy bean',
      'snap bean',
      'green bean',
      'string bean',
    ],
    scientificTargets: ['Phaseolus vulgaris'],
  },
  {
    spanishLabel: 'papa',
    terms: ['papa', 'papas', 'patata', 'patatas', 'potato', 'potatoes', 'white potato', 'irish potato'],
    scientificTargets: ['Solanum tuberosum'],
  },
  {
    spanishLabel: 'tomate',
    terms: ['tomate', 'tomates', 'jitomate', 'jitomates', 'tomato', 'tomatoes'],
    scientificTargets: ['Lycopersicon esculentum'],
  },
  {
    spanishLabel: 'café',
    terms: ['cafe', 'cafeto', 'cafetal', 'coffea', 'coffee'],
    scientificTargets: ['Coffea liberica', 'Coffea excelsa'],
  },
  {
    spanishLabel: 'cacao',
    terms: ['cacao', 'cacaotero', 'cocoa'],
    scientificTargets: ['Theobroma cacao'],
  },
  {
    spanishLabel: 'trigo',
    terms: ['trigo', 'triticum', 'wheat', 'bread wheat', 'durum wheat'],
    scientificTargets: ['Triticum aestivum', 'Triticum durum'],
  },
  {
    spanishLabel: 'arroz',
    terms: ['arroz', 'oryza', 'rice', 'paddy rice'],
    scientificTargets: ['Oryza sativa'],
  },
  {
    spanishLabel: 'sorgo',
    terms: ['sorgo', 'maicillo', 'sorghum'],
    scientificTargets: ['Sorghum bicolor', 'Sorghum bicolor var. sweet'],
  },
  {
    spanishLabel: 'soya',
    terms: ['soya', 'soja', 'soy', 'soybean', 'soybeans', 'soya bean'],
    scientificTargets: ['Glycine max'],
  },
  {
    spanishLabel: 'cebada',
    terms: ['cebada', 'barley'],
    scientificTargets: ['Hordeum vulgare'],
  },
  {
    spanishLabel: 'avena',
    terms: ['avena', 'oat', 'oats'],
    scientificTargets: ['Avena sativa'],
  },
  {
    spanishLabel: 'garbanzo',
    terms: ['garbanzo', 'garbanzos', 'chickpea', 'chickpeas', 'garbanzo bean'],
    scientificTargets: ['Cicer arietinum'],
  },
  {
    spanishLabel: 'lenteja',
    terms: ['lenteja', 'lentejas', 'lentil', 'lentils'],
    scientificTargets: ['Lens culinaris'],
  },
  {
    spanishLabel: 'haba',
    terms: ['haba', 'habas', 'fava bean', 'faba bean', 'broad bean', 'broad beans'],
    scientificTargets: ['Vicia faba'],
  },
  {
    spanishLabel: 'arveja',
    terms: ['arveja', 'arvejas', 'chicharo', 'chicharos', 'guisante', 'guisantes', 'pea', 'peas', 'green pea', 'green peas', 'field pea'],
    scientificTargets: ['Pisum sativum'],
  },
  {
    spanishLabel: 'alfalfa',
    terms: ['alfalfa', 'lucerne'],
    scientificTargets: ['Medicago sativa'],
  },
  {
    spanishLabel: 'aguacate',
    terms: ['aguacate', 'aguacates', 'palta', 'paltas', 'avocado', 'avocados'],
    scientificTargets: ['Persea americana', 'Persea americana ssp. mexican'],
  },
  {
    spanishLabel: 'chile / pimiento',
    terms: [
      'chile',
      'chiles',
      'pimiento',
      'pimientos',
      'aji',
      'morron',
      'jalapeno',
      'serrano',
      'habanero',
      'chili',
      'chili pepper',
      'bell pepper',
      'sweet pepper',
      'hot pepper',
      'pepper',
      'peppers',
    ],
    scientificTargets: ['Capsicum annuum', 'Capsicum frutescens', 'Capsicum chinense'],
  },
  {
    spanishLabel: 'plátano / banano',
    terms: ['platano', 'platanos', 'banano', 'bananos', 'banana', 'bananas', 'guineo', 'plantain', 'plantains'],
    scientificTargets: ['Musa sp.', 'Musa acuminata', 'Musa balbisiana'],
  },
  {
    spanishLabel: 'yuca',
    terms: ['yuca', 'mandioca', 'casabe', 'cassava', 'manioc', 'tapioca'],
    scientificTargets: ['Manihot esculenta'],
  },
  {
    spanishLabel: 'caña de azúcar',
    terms: ['cana de azucar', 'cana', 'sugarcane', 'sugar cane'],
    scientificTargets: ['Saccharum barberi', 'Saccharum robustum', 'Saccharum edule'],
  },
  {
    spanishLabel: 'algodón',
    terms: ['algodon', 'cotton'],
    scientificTargets: ['Gossypium hirsutum', 'Gossypium barbadense'],
  },
  {
    spanishLabel: 'maní / cacahuate',
    terms: ['mani', 'cacahuate', 'cacahuates', 'manies', 'peanut', 'peanuts', 'groundnut', 'groundnuts'],
    scientificTargets: ['Arachis hypogaea'],
  },
  {
    spanishLabel: 'ajonjolí / sésamo',
    terms: ['ajonjoli', 'sesamo', 'sesame'],
    scientificTargets: ['Sesamum indicum'],
  },
  {
    spanishLabel: 'cebolla',
    terms: ['cebolla', 'cebollas', 'onion', 'onions'],
    scientificTargets: ['Allium cepa', 'Allium cepa var. cepa'],
  },
  {
    spanishLabel: 'ajo',
    terms: ['ajo', 'ajos', 'garlic'],
    scientificTargets: ['Allium sativum'],
  },
  {
    spanishLabel: 'zanahoria',
    terms: ['zanahoria', 'zanahorias', 'carrot', 'carrots'],
    scientificTargets: ['Daucus carota'],
  },
  {
    spanishLabel: 'lechuga',
    terms: ['lechuga', 'lechugas', 'lettuce'],
    scientificTargets: ['Lactuca sativa var. capitata'],
  },
  {
    spanishLabel: 'repollo / col',
    terms: ['repollo', 'col', 'cabbage', 'cabbages'],
    scientificTargets: ['Brassica oleracea var. capitata'],
  },
  {
    spanishLabel: 'brócoli',
    terms: ['brocoli', 'broccoli'],
    scientificTargets: ['Brassica oleracea var. italica'],
  },
  {
    spanishLabel: 'coliflor',
    terms: ['coliflor', 'cauliflower'],
    scientificTargets: ['Brassica oleracea var. botrytis'],
  },
  {
    spanishLabel: 'calabaza / ayote',
    terms: ['calabaza', 'zapallo', 'ayote', 'auyama', 'calabacita', 'pipian', 'pumpkin', 'pumpkins', 'squash', 'zucchini'],
    scientificTargets: ['Cucurbita moschata', 'Cucurbita pepo', 'Cucurbita maxima'],
  },
  {
    spanishLabel: 'pepino',
    terms: ['pepino', 'pepinos', 'cucumber', 'cucumbers'],
    scientificTargets: ['Cucumis sativus'],
  },
  {
    spanishLabel: 'melón',
    terms: ['melon', 'melones', 'cantaloupe'],
    scientificTargets: ['Cucumis melo'],
  },
  {
    spanishLabel: 'sandía',
    terms: ['sandia', 'sandias', 'patilla', 'watermelon', 'watermelons'],
    scientificTargets: ['Citrullus lanatus'],
  },
  {
    spanishLabel: 'fresa',
    terms: ['fresa', 'fresas', 'frutilla', 'frutillas', 'strawberry', 'strawberries'],
    scientificTargets: ['Fragaria x ananassa', 'Fragaria vesca'],
  },
  {
    spanishLabel: 'piña',
    terms: ['pina', 'anana', 'ananas', 'pineapple', 'pineapples'],
    scientificTargets: ['Ananas comosus'],
  },
  {
    spanishLabel: 'mango',
    terms: ['mango', 'mangos', 'mangoes'],
    scientificTargets: ['Mangifera indica'],
  },
  {
    spanishLabel: 'papaya',
    terms: ['papaya', 'lechosa', 'papayas'],
    scientificTargets: ['Carica papaya'],
  },
  {
    spanishLabel: 'limón',
    terms: ['limon', 'limones', 'lima', 'lemon', 'lemons', 'lime fruit', 'key lime', 'persian lime'],
    scientificTargets: ['Citrus limon', 'Citrus aurantifolia', 'Citrus latifolia'],
  },
  {
    spanishLabel: 'naranja',
    terms: ['naranja', 'naranjas', 'naranjo', 'oranges', 'sweet orange', 'orange tree'],
    scientificTargets: ['Citrus sinensis'],
  },
  {
    spanishLabel: 'mandarina',
    terms: ['mandarina', 'mandarinas', 'mandarin', 'mandarins', 'tangerine', 'tangerines'],
    scientificTargets: ['Citrus reticulata'],
  },
  {
    spanishLabel: 'guayaba',
    terms: ['guayaba', 'guayabas', 'guava', 'guavas'],
    scientificTargets: ['Psidium guajava'],
  },
  {
    spanishLabel: 'maracuyá',
    terms: ['maracuya', 'parchita', 'granadilla', 'passion fruit', 'passionfruit'],
    scientificTargets: ['Passiflora edulis'],
  },
  {
    spanishLabel: 'guanábana',
    terms: ['guanabana', 'soursop'],
    scientificTargets: ['Annona muricata'],
  },
  {
    spanishLabel: 'coco',
    terms: ['coco', 'cocotero', 'coconut', 'coconuts'],
    scientificTargets: ['Cocos nucifera'],
  },
  {
    spanishLabel: 'espinaca',
    terms: ['espinaca', 'espinacas', 'spinach'],
    scientificTargets: ['Spinacia oleracea', 'Basella alba'],
  },
  {
    spanishLabel: 'remolacha / betabel',
    terms: ['remolacha', 'betabel', 'acelga', 'beet', 'beets', 'beetroot', 'chard', 'swiss chard'],
    scientificTargets: ['Beta vulgaris'],
  },
  {
    spanishLabel: 'berenjena',
    terms: ['berenjena', 'berenjenas', 'eggplant', 'eggplants', 'aubergine'],
    scientificTargets: ['Solanum melongena'],
  },
  {
    spanishLabel: 'espárrago',
    terms: ['esparrago', 'esparragos', 'asparagus'],
    scientificTargets: ['Asparagus officinalis'],
  },
  {
    spanishLabel: 'apio',
    terms: ['apio', 'celery'],
    scientificTargets: ['Apium graveolens'],
  },
  {
    spanishLabel: 'cilantro',
    terms: ['cilantro', 'culantro', 'coriander'],
    scientificTargets: ['Coriandrum sativum'],
  },
  {
    spanishLabel: 'quinoa',
    terms: ['quinoa', 'quinua'],
    scientificTargets: ['Chenopodium quinoa'],
  },
  {
    spanishLabel: 'amaranto',
    terms: ['amaranto', 'kiwicha', 'amaranth'],
    scientificTargets: ['Amaranthus cruentus', 'Amaranthus sp.'],
  },
  {
    spanishLabel: 'okra',
    terms: ['okra', 'quimbombo', 'ocra'],
    scientificTargets: ['Abelmoschus esculentus'],
  },
];

const NON_LOCATION_STOPWORDS = new Set([
  'mi parcela',
  'la parcela',
  'esta parcela',
  'una parcela',
  'tu parcela',
  'el campo',
  'mi campo',
  'campo abierto',
  'mi terreno',
  'el terreno',
  'este terreno',
  'mi finca',
  'la finca',
  'mi lote',
  'el lote',
  'mi huerto',
  'el huerto',
  'mi tierra',
  'la tierra',
  'el suelo',
  'mi suelo',
  'suelo compactado',
  'suelo arenoso',
  'suelo salino',
  'suelo sano',
  'esta zona',
  'mi zona',
  'la zona',
  'esta region',
  'mi region',
  'esta ubicacion',
  'mi ubicacion',
  'este lugar',
  'mi lugar',
  'esta coordenada',
  'estas coordenadas',
  'esta foto',
  'la foto',
  'esta imagen',
  'la imagen',
  'la hoja',
  'las hojas',
  'el tallo',
  'la planta',
  'las plantas',
  'el fruto',
  'la raiz',
  'invierno',
  'verano',
  'primavera',
  'otono',
  'temporada seca',
  'temporada de lluvias',
  'epoca de lluvias',
  'epoca seca',
  'secano',
  'temporal',
  'riego',
  'goteo',
  'invernadero',
  'maceta',
  'macetas',
  'casa',
  'general',
  'detalle',
  'espanol',
  'ingles',
  'en espanol',
  'en ingles',
  '3 ciclos',
  'tres ciclos',
  'rotacion',
  'el mapa',
  'agro-nasa',
  'agronasa',
  'nasa power',
  'open-meteo',
  'ecocrop',
  'my farm',
  'the farm',
  'this farm',
  'a farm',
  'your farm',
  'my plot',
  'the plot',
  'this plot',
  'a plot',
  'my parcel',
  'the parcel',
  'this parcel',
  'my field',
  'the field',
  'this field',
  'open field',
  'my land',
  'the land',
  'this land',
  'my garden',
  'the garden',
  'this garden',
  'my yard',
  'my lot',
  'the lot',
  'my soil',
  'the soil',
  'this soil',
  'compacted soil',
  'sandy soil',
  'saline soil',
  'healthy soil',
  'this area',
  'my area',
  'the area',
  'this region',
  'my region',
  'the region',
  'this location',
  'my location',
  'the location',
  'this place',
  'my place',
  'the place',
  'this zone',
  'my zone',
  'these coordinates',
  'this coordinate',
  'this photo',
  'the photo',
  'this picture',
  'the picture',
  'this image',
  'the image',
  'the leaf',
  'the leaves',
  'my leaves',
  'leaves',
  'the stem',
  'the plant',
  'the plants',
  'the fruit',
  'the root',
  'the roots',
  'winter',
  'summer',
  'spring',
  'autumn',
  'fall',
  'dry season',
  'rainy season',
  'wet season',
  'rainfed',
  'irrigation',
  'drip irrigation',
  'greenhouse',
  'pot',
  'pots',
  'home',
  'detail',
  'english',
  'spanish',
  'english please',
  'spanish please',
  'in english',
  'in spanish',
  'simple words',
  'other words',
  'short',
  'summary',
  'resumen',
  'conclusion',
  'promedio',
  'average',
  'total',
  'surcos',
  'camas',
  'camas altas',
  'pendiente',
  'ladera',
  'rows',
  'beds',
  'raised beds',
  'containers',
  'shade',
  'full sun',
  'sombra',
  'pleno sol',
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  '3 cycles',
  'three cycles',
  'rotation',
  'crop rotation',
  'the map',
  'this climate',
  'the climate',
  'current climate',
  'unknown',
  'not set',
  'none',
]);

/**
 * Normalizes text by lowercasing, stripping diacritics/accents, and collapsing whitespace.
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Enriches FAO EcoCrop catalog entries so Spanish common names appear first in `commonNames`.
 */
export function enrichCatalogWithSpanishNames(crops: Crop[]): Crop[] {
  const sciToSpanish = new Map<string, string>();
  for (const alias of SPANISH_CROP_ALIASES) {
    for (const sci of alias.scientificTargets) {
      const key = sci.toLowerCase();
      if (!sciToSpanish.has(key)) {
        sciToSpanish.set(key, alias.spanishLabel);
      }
    }
  }

  return crops.map((crop) => {
    const spanishLabel = sciToSpanish.get(crop.scientificName.toLowerCase());
    if (!spanishLabel) {
      return crop;
    }
    const normSpanish = normalizeSearchText(spanishLabel);
    const alreadyFirst =
      crop.commonNames.length > 0 && normalizeSearchText(crop.commonNames[0]) === normSpanish;
    if (alreadyFirst) {
      return crop;
    }
    const filtered = crop.commonNames.filter((n) => normalizeSearchText(n) !== normSpanish);
    return {
      ...crop,
      commonNames: [spanishLabel, ...filtered],
    };
  });
}

/**
 * Returns the primary common name of a crop localized in Spanish or English.
 */
export function getLocalizedCropName(crop: Crop, lang: 'es' | 'en' = 'es'): string {
  const sciKey = crop.scientificName.toLowerCase();
  const alias = SPANISH_CROP_ALIASES.find((a) =>
    a.scientificTargets.some((s) => s.toLowerCase() === sciKey)
  );

  if (lang === 'es') {
    return alias?.spanishLabel || crop.commonNames[0] || crop.scientificName;
  }

  const spanishNorm = alias ? normalizeSearchText(alias.spanishLabel) : '';
  const nonSpanishCommon = crop.commonNames.find((n) => {
    const norm = normalizeSearchText(n);
    return norm && norm !== spanishNorm;
  });

  if (nonSpanishCommon) {
    return nonSpanishCommon;
  }

  return crop.commonNames[0] || crop.scientificName;
}

/**
 * Searches the EcoCrop catalog by Spanish alias, common name, or scientific name (accent-insensitive).
 */
export function searchCatalogWithAliases(query: string, catalog: Crop[]): Crop[] {
  const norm = normalizeSearchText(query);
  if (!norm) {
    return [];
  }

  const results: Crop[] = [];
  const seenIds = new Set<string>();
  const addCrop = (crop: Crop | undefined) => {
    if (crop && !seenIds.has(crop.id)) {
      seenIds.add(crop.id);
      results.push(crop);
    }
  };

  // 1. Exact Spanish alias match -> resolve prioritized scientific targets first
  for (const alias of SPANISH_CROP_ALIASES) {
    if (
      normalizeSearchText(alias.spanishLabel) === norm ||
      alias.terms.some((t) => normalizeSearchText(t) === norm)
    ) {
      for (const sciTarget of alias.scientificTargets) {
        const match = catalog.find(
          (c) => c.scientificName.toLowerCase() === sciTarget.toLowerCase()
        );
        addCrop(match);
      }
    }
  }

  // 2. Exact scientific or common name match
  for (const crop of catalog) {
    if (normalizeSearchText(crop.scientificName) === norm) {
      addCrop(crop);
      continue;
    }
    if (crop.commonNames.some((n) => normalizeSearchText(n) === norm)) {
      addCrop(crop);
    }
  }

  // 3. Partial Spanish alias match
  for (const alias of SPANISH_CROP_ALIASES) {
    if (
      normalizeSearchText(alias.spanishLabel).includes(norm) ||
      alias.terms.some((t) => normalizeSearchText(t).includes(norm))
    ) {
      for (const sciTarget of alias.scientificTargets) {
        const match = catalog.find(
          (c) => c.scientificName.toLowerCase() === sciTarget.toLowerCase()
        );
        addCrop(match);
      }
    }
  }

  // 4. Partial scientific or common name match
  for (const crop of catalog) {
    if (
      normalizeSearchText(crop.scientificName).includes(norm) ||
      crop.commonNames.some((n) => normalizeSearchText(n).includes(norm))
    ) {
      addCrop(crop);
    }
  }

  return results;
}

/**
 * Extracts all crops/seeds mentioned in a natural-language user message.
 */
export function extractCropsFromPrompt(
  text: string,
  catalog: Crop[]
): { crops: Crop[]; matchedTerms: string[] } {
  const normText = normalizeSearchText(text);
  if (!normText || catalog.length === 0) {
    return { crops: [], matchedTerms: [] };
  }

  const matches: { crop: Crop; term: string; index: number }[] = [];
  const seenCropIds = new Set<string>();

  const addCrop = (crop: Crop | undefined, term: string, index: number) => {
    if (!crop || seenCropIds.has(crop.id) || index < 0) {
      return;
    }
    seenCropIds.add(crop.id);
    matches.push({ crop, term, index });
  };

  // 1. Check curated Spanish aliases (longest terms first so 'maiz dulce' matches before 'maiz')
  const flatAliases: { term: string; scientificTargets: string[] }[] = [];
  for (const entry of SPANISH_CROP_ALIASES) {
    for (const term of entry.terms) {
      flatAliases.push({
        term: normalizeSearchText(term),
        scientificTargets: entry.scientificTargets,
      });
    }
  }
  flatAliases.sort((a, b) => b.term.length - a.term.length);

  for (const candidate of flatAliases) {
    const matchIndex = findWholeTermIndex(normText, candidate.term);
    if (matchIndex >= 0) {
      for (const sciTarget of candidate.scientificTargets) {
        const found = catalog.find(
          (c) => c.scientificName.toLowerCase() === sciTarget.toLowerCase()
        );
        if (found) {
          addCrop(found, candidate.term, matchIndex);
          break;
        }
      }
    }
  }

  // 2. Check exact scientific names mentioned in the text
  for (const crop of catalog) {
    const sciNorm = normalizeSearchText(crop.scientificName);
    if (sciNorm.length >= 6) {
      const matchIndex = findWholeTermIndex(normText, sciNorm);
      if (matchIndex >= 0) {
        addCrop(crop, sciNorm, matchIndex);
      }
    }
  }

  // 3. If no alias or scientific name matched yet, check commonNames (>= 4 chars, avoiding generic words)
  if (matches.length === 0) {
    const genericWords = new Set([
      'para',
      'como',
      'este',
      'esta',
      'pero',
      'todo',
      'toda',
      'agua',
      'solo',
      'bien',
      'tree',
      'bush',
      'weed',
      'root',
      'seed',
      'leaf',
      'date',
      'lime',
      'plant',
      'crop',
      'grass',
      'palm',
      'herb',
      'vine',
      'wood',
      'bark',
      'soil',
      'rain',
      'heat',
      'spot',
      'rust',
      'mold',
      'mildew',
      'wilt',
      'blight',
      'stem',
      'fruit',
      'grain',
      'salt',
    ]);
    for (const crop of catalog) {
      for (const rawName of crop.commonNames) {
        const cleanName = normalizeSearchText(rawName);
        if (cleanName.length < 4 || genericWords.has(cleanName)) {
          continue;
        }
        const matchIndex = findWholeTermIndex(normText, cleanName);
        if (matchIndex >= 0) {
          addCrop(crop, cleanName, matchIndex);
          break;
        }
      }
    }
  }

  matches.sort((a, b) => a.index - b.index);
  const topMatches = matches.slice(0, 4);

  return {
    crops: topMatches.map((m) => m.crop),
    matchedTerms: topMatches.map((m) => m.term),
  };
}

/**
 * Extracts explicit coordinates or a geographic location name from a natural-language Spanish or English prompt.
 */
export function extractLocationFromPrompt(
  text: string,
  matchedCropTerms: string[] = []
): { locationQuery?: string; explicitCoordinates?: Coordinates } {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }

  // 1. Check explicit coordinates: e.g. "14.46, -87.64", "lat 14.46 lon -87.64", "latitude 14.46 and -87.64"
  const coordRegex =
    /(?:lat(?:itud|itude)?\s*[:=]?\s*)?(-?\d{1,2}\.\d{2,})\s*(?:[,;]\s*(?:lon(?:gitud|gitude)?\s*[:=]?\s*)?|\s+(?:y|and)\s+(?:lon(?:gitud|gitude)?\s*[:=]?\s*)?|\s+lon(?:gitud|gitude)?\s*[:=]?\s*)(-?\d{1,3}\.\d{2,})/i;
  const coordMatch = trimmed.match(coordRegex);
  if (coordMatch) {
    const lat = Number(coordMatch[1]);
    const lon = Number(coordMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return {
        explicitCoordinates: {
          lat: Math.round(lat * 100000) / 100000,
          lon: Math.round(lon * 100000) / 100000,
        },
      };
    }
  }

  // 2. Check explicit labels: "Lugar: Comayagua", "Location: Iowa", etc.
  const labeledPattern =
    /\b(?:lugar|ubicaci[oó]n|ciudad|municipio|departamento|estado|provincia|pa[ií]s|regi[oó]n|zona|place|location|city|town|municipality|county|state|province|country|region|zone|area)\s*(?:es|is|:|=)\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s,.-]{3,65})/gi;
  let labeledMatch: RegExpExecArray | null;
  while ((labeledMatch = labeledPattern.exec(trimmed)) !== null) {
    const candidate = cleanLocationCandidate(labeledMatch[1], matchedCropTerms);
    if (candidate && isValidLocationCandidate(candidate, matchedCropTerms)) {
      return { locationQuery: candidate };
    }
  }

  // 3. Check explicit geographic prepositional phrases in Spanish & English (non-skipping on invalid candidates)
  const locationPatterns: RegExp[] = [
    /\b(?:ubicad[oa]\s+en|parcela\s+(?:en|de)|terreno\s+(?:en|de)|finca\s+(?:en|de)|lote\s+(?:en|de)|sembrar(?:\s+[a-záéíóúüñ]+){0,3}\s+en|cultivar(?:\s+[a-záéíóúüñ]+){0,3}\s+en|estoy\s+en|vivo\s+en|soy\s+de|zona\s+de|regi[oó]n\s+de|municipio\s+de|departamento\s+de|estado\s+de|provincia\s+de|valle\s+(?:de|del)|ciudad\s+de|cerca\s+de|located\s+(?:in|at)|farm\s+(?:in|at|near)|plot\s+(?:in|at|near)|field\s+(?:in|at|near)|land\s+(?:in|at|near)|parcel\s+(?:in|at|near)|plant(?:\s+[a-z-]+){0,4}\s+in|grow(?:\s+[a-z-]+){0,4}\s+in|sow(?:\s+[a-z-]+){0,4}\s+in|cultivate(?:\s+[a-z-]+){0,4}\s+in|i(?:'m|\s+am)\s+(?:in|from)|we(?:'re|\s+are)\s+(?:in|from)|i\s+live\s+in|area\s+of|region\s+of|county\s+of|state\s+of|province\s+of|city\s+of|valley\s+of|near|recommend(?:ed)?(?:\s+[a-z-]+){0,4}\s+for|best(?:\s+[a-z-]+){0,4}\s+for|suitable(?:\s+[a-z-]+){0,4}\s+for|viable(?:\s+[a-z-]+){0,4}\s+for|work(?:\s+[a-z-]+){0,4}\s+for)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s,.-]{3,65})/gi,
    /\b(?:en|hacia|in|at)\s+([A-ZÁÉÍÓÚÜÑa-záéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s,.-]{2,60})/g,
  ];

  for (const pattern of locationPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(trimmed)) !== null) {
      const candidate = cleanLocationCandidate(match[1], matchedCropTerms);
      if (candidate && isValidLocationCandidate(candidate, matchedCropTerms)) {
        return { locationQuery: candidate };
      }
      // Advance just past the trigger word so we never skip a nested "en <Lugar>" / "in <Place>" inside match[1]
      pattern.lastIndex = match.index + 2;
    }
  }

  // 4. Fallback for short direct inputs without prepositions: e.g. "Comayagua, maíz" or "Iowa, corn"
  const fallbackCandidate = extractBareLocationFallback(trimmed, matchedCropTerms);
  if (fallbackCandidate && isValidLocationCandidate(fallbackCandidate, matchedCropTerms)) {
    return { locationQuery: fallbackCandidate };
  }

  return {};
}

/**
 * Detects whether the user is asking for a seed/crop recommendation (Spanish or English).
 */
export function isAskingForSeedRecommendation(text: string): boolean {
  const norm = normalizeSearchText(text);
  return (
    /\b(?:que\s+semilla|que\s+semillas|que\s+cultivo|que\s+cultivos|que\s+sembrar|que\s+puedo\s+sembrar|que\s+me\s+recomiendas\s+sembrar|recomiendame\s+una\s+semilla|recomiendame\s+un\s+cultivo|mejor\s+semilla|mejores\s+semillas|what\s+seed|what\s+seeds|which\s+seed|which\s+seeds|what\s+crop|what\s+crops|which\s+crop|which\s+crops|what\s+(?:can|should|could)\s+i\s+(?:plant|grow|sow)|what\s+to\s+(?:plant|grow|sow)|recommend(?:\s+me)?\s+(?:a\s+)?(?:seed|seeds|crop|crops)|(?:seed|crop)\s+recommendation|best\s+(?:seed|seeds|crop|crops)|suitable\s+(?:seed|seeds|crop|crops)|what\s+(?:seed|crop)s?\s+(?:work|works|grow|grows)\s+best)\b/.test(
      norm
    ) || /\bsemillas?\b/.test(norm)
  );
}

/**
 * Detects whether a prompt is primarily in Spanish or English (defaults to `fallback`, which defaults to `'es'`).
 */
export function detectQueryLanguage(text: string, fallback: 'es' | 'en' = 'es'): 'es' | 'en' {
  const trimmed = text.trim();
  if (!trimmed) {
    return fallback;
  }

  const norm = normalizeSearchText(trimmed);

  // Explicit language switch requests take highest priority
  if (
    /^(?:english|ingles)$/.test(norm) ||
    /\b(?:in\s+english|en\s+ingles|speak\s+(?:in\s+)?english|reply\s+(?:in\s+)?english|respond\s+(?:in\s+)?english|answer\s+(?:in\s+)?english|talk\s+(?:in\s+)?english|write\s+(?:in\s+)?english|switch\s+to\s+english|use\s+english|english\s+please|only\s+english|habla(?:me)?\s+en\s+ingles|responde(?:me)?\s+en\s+ingles|contesta(?:me)?\s+en\s+ingles|escribe(?:me)?\s+en\s+ingles|dime\s+en\s+ingles|explica(?:me)?\s+en\s+ingles|solo\s+ingles)\b/.test(
      norm
    )
  ) {
    return 'en';
  }

  if (
    /^(?:spanish|espanol)$/.test(norm) ||
    /\b(?:in\s+spanish|en\s+espanol|speak\s+(?:in\s+)?spanish|reply\s+(?:in\s+)?spanish|respond\s+(?:in\s+)?spanish|answer\s+(?:in\s+)?spanish|talk\s+(?:in\s+)?spanish|write\s+(?:in\s+)?spanish|switch\s+to\s+spanish|use\s+spanish|spanish\s+please|only\s+spanish|habla(?:me)?\s+en\s+espanol|responde(?:me)?\s+en\s+espanol|contesta(?:me)?\s+en\s+espanol|escribe(?:me)?\s+en\s+espanol|dime\s+en\s+espanol|explica(?:me)?\s+en\s+espanol|solo\s+espanol)\b/.test(
      norm
    )
  ) {
    return 'es';
  }

  let esScore = 0;
  let enScore = 0;

  if (/[¿¡]/.test(trimmed)) {
    esScore += 3;
  }
  if (/[ñÑ]/.test(trimmed)) {
    esScore += 2;
  }
  // Count accented vowels only on lowercase words or sentence-initial Spanish question/verb words,
  // avoiding false Spanish bias from capitalized proper nouns (e.g., "Corn in León", "I live in Cancún", "Bogotá").
  if (
    /(?:^|[\s¿¡])[a-záéíóúü]*[áéíóúü][a-záéíóúü]*/.test(trimmed) ||
    /^(?:Qué|Cómo|Cuál|Cuáles|Cuándo|Dónde|Quién|Cuánto|Cuánta|Cuántos|Cuántas|Por\s+qué|Sí|Más|Está|Están|Podría|Podrías|Debería|Háblame|Respóndeme|Contéstame|Explícame|Recomiéndame|Muéstrame|Evalúa|Analiza)\b/.test(
      trimmed
    )
  ) {
    esScore += 2;
  }

  if (
    /\b(?:i'm|i've|i'd|i'll|don't|doesn't|didn't|can't|won't|wouldn't|shouldn't|isn't|aren't|wasn't|weren't|what's|how's|where's|when's|why's|it's|that's|there's|here's|let's|you're|we're|they're)\b/i.test(
      trimmed
    )
  ) {
    enScore += 3;
  }

  const esPhrases = norm.match(
    /\b(?:es\s+viable|son\s+viables|sea\s+viable|no\s+se|no\s+tengo|no\s+puedo|no\s+hay|no\s+me|si\s+por\s+favor|por\s+favor|de\s+acuerdo|esta\s+bien|que\s+tal|como\s+esta|como\s+le\s+va|se\s+da|se\s+puede|me\s+conviene|me\s+sirve|me\s+recomiendas|me\s+dices|me\s+ayudas|voy\s+a|vamos\s+a|a\s+sembrar|a\s+plantar|a\s+cultivar|plan\s+de|control\s+de|balance\s+hidrico|tierra\s+seca|hojas\s+amarillas)\b/g
  );
  if (esPhrases) {
    esScore += esPhrases.length * 2;
  }

  const enPhrases = norm.match(
    /\b(?:is\s+viable|are\s+viable|be\s+viable|viable\s+in|viable\s+for|tell\s+me|give\s+me|show\s+me|help\s+me|let\s+me|a\s+crop|a\s+seed|a\s+farm|a\s+plot|a\s+field|a\s+rotation|a\s+cycle|3\s+cycle|three\s+cycle|more\s+details|explain\s+more|what\s+about|how\s+about|and\s+in|or\s+in)\b/g
  );
  if (enPhrases) {
    enScore += enPhrases.length * 2;
  }

  const esMatches = norm.match(
    /\b(?:hola|buenos|buenas|dias|tardes|noches|gracias|favor|porfavor|saludos|quiero|quieres|quiere|queremos|quisiera|puedo|puedes|puede|podemos|podria|podrias|debo|deberia|tengo|tienes|tiene|tenemos|tienen|necesito|necesita|necesitan|requiere|requieren|hago|hace|hacer|pasa|sirve|sirven|conviene|crece|crecen|sembrar|siembro|siembra|cultivar|cultivo|cultivos|plantar|planto|planta|plantas|plantacion|cosechar|cosecha|regar|riego|abonar|abono|fertilizar|fertilizante|fertilizantes|recomiendas|recomienda|recomiendame|recomendar|recomendacion|ayuda|ayudame|ayudar|habla|hablas|hablame|responde|respondes|respondeme|contesta|contestame|dime|dices|dice|explica|explicame|analiza|analizar|evalua|evaluar|compara|comparar|revisa|muestra|muestrame|dame|da|dan|parcela|finca|terreno|lote|huerto|campo|tierra|suelo|suelos|agua|lluvia|lluvias|sequia|clima|temperatura|calor|frio|helada|humedad|viento|sombra|semilla|semillas|hoja|hojas|tallo|tallos|raiz|raices|fruto|frutos|plaga|plagas|enfermedad|enfermedades|hongo|hongos|insecto|insectos|mancha|manchas|amarilla|amarillas|amarillo|seca|seco|compactado|arenoso|salino|sano|rotacion|ciclo|ciclos|etapa|epoca|temporada|invierno|verano|primavera|otono|rendimiento|produccion|sintoma|sintomas|deficiencia|nitrogeno|fosforo|potasio|hidrico|pronostico|datos|ubicacion|lugar|ciudad|pais|zona|norte|sur|oeste|idioma|lenguaje|espanol|como|donde|cuando|cual|cuales|quien|cuanto|cuanta|cuantos|cuantas|porque|para|con|sin|sobre|entre|hacia|hasta|desde|segun|durante|contra|pero|aunque|tambien|tampoco|solo|aqui|ahi|alli|aca|alla|hoy|ayer|manana|ahora|antes|despues|siempre|nunca|bien|mal|mejor|mejores|peor|mas|menos|muy|mucho|mucha|muchos|muchas|poco|poca|todo|toda|todos|todas|algo|nada|otro|otra|otros|otras|mismo|misma|cada|el|la|los|las|un|una|unos|unas|al|del|de|en|por|que|este|esta|estos|estas|ese|esa|mi|mis|tu|tus|su|sus|nuestro|nuestra|yo|usted|ustedes|nosotros|ellos|se|te|le|les|lo|nos|si|y|o|ni|es|son|soy|eres|somos|era|fue|ser|estan|estoy|estamos|estar|hay|maiz|elote|choclo|frijol|frijoles|poroto|porotos|habichuela|caraota|alubia|papa|papas|patata|patatas|tomate|tomates|jitomate|cafe|cafeto|trigo|arroz|sorgo|maicillo|soya|soja|cebada|avena|garbanzo|garbanzos|lenteja|lentejas|haba|habas|arveja|arvejas|chicharo|guisante|aguacate|aguacates|palta|chile|chiles|pimiento|pimientos|aji|platano|platanos|banano|bananos|guineo|yuca|mandioca|cana|azucar|algodon|mani|cacahuate|ajonjoli|sesamo|cebolla|cebollas|ajo|ajos|zanahoria|zanahorias|lechuga|lechugas|repollo|brocoli|coliflor|calabaza|zapallo|ayote|pepino|pepinos|sandia|sandias|fresa|fresas|frutilla|pina|limon|limones|naranja|naranjas|mandarina|guayaba|maracuya|guanabana|coco|espinaca|espinacas|remolacha|betabel|acelga|berenjena|esparrago|apio|cilantro|quinua|amaranto)\b/g
  );
  if (esMatches) {
    esScore += esMatches.length;
  }

  const enMatches = norm.match(
    /\b(?:hello|hi|hey|greetings|morning|afternoon|evening|please|thanks|thank|yes|yeah|yep|nope|sure|great|nice|well|good|bad|better|best|worse|worst|suitable|healthy|compacted|sandy|saline|hot|cold|warm|cool|dry|wet|humid|sunny|cloudy|windy|high|low|long|short|small|large|big|new|old|same|different|other|another|more|most|less|least|much|many|some|any|all|both|each|every|such|very|too|just|only|also|even|still|already|always|never|now|then|here|there|where|when|why|how|what|which|who|whom|whose|up|down|out|off|the|an|in|on|at|to|of|for|with|from|by|about|into|onto|between|through|during|before|after|above|below|under|over|near|around|without|within|and|or|but|if|because|so|than|i|you|we|they|he|she|it|its|us|them|my|your|our|their|his|her|this|that|these|those|is|are|was|were|be|been|being|am|do|does|did|doing|done|have|has|had|having|can|could|will|would|shall|should|may|might|must|im|ive|id|ill|dont|doesnt|didnt|cant|wont|wouldnt|shouldnt|isnt|arent|wasnt|werent|whats|hows|wheres|whens|whys|lets|youre|theyre|want|wants|wanted|like|need|needs|needed|live|lives|living|help|tell|explain|describe|analyze|analyse|evaluate|compare|check|show|give|speak|talk|reply|respond|answer|write|read|recommend|recommends|recommended|recommendation|recommendations|suggest|suggestion|suggestions|advice|advise|guide|details|detail|summary|schedule|calendar|work|works|working|survive|handle|manage|management|improve|protect|prevent|prevention|treatment|plant|plants|planting|planted|grow|grows|growing|grown|sow|sowing|cultivate|cultivating|harvest|harvesting|farm|farms|farming|farmer|plot|plots|field|fields|parcel|land|garden|yard|soil|soils|water|watering|irrigation|irrigating|drip|rain|rains|rainfall|rainy|drought|frost|freeze|heat|heatwave|temperature|temperatures|weather|climate|forecast|humidity|moisture|sunlight|shade|drainage|seed|seeds|crop|crops|rotation|cycle|cycles|sequence|season|spring|summer|autumn|fall|winter|month|months|week|weeks|day|days|year|years|yield|yields|leaf|leaves|stem|stems|root|roots|fruit|fruits|flower|flowers|pest|pests|disease|diseases|fungus|fungi|blight|mildew|rust|wilt|rot|spot|spots|yellow|yellowing|brown|wilting|symptom|symptoms|deficiency|nitrogen|phosphorus|potassium|fertilizer|fertilizers|compost|manure|mulch|amendment|language|english|spanish|corn|maize|sweetcorn|bean|beans|soybean|soybeans|soy|potato|potatoes|tomato|tomatoes|coffee|wheat|rice|sorghum|barley|oat|oats|chickpea|chickpeas|lentil|lentils|pea|peas|lucerne|avocado|avocados|chili|pepper|peppers|plantain|plantains|cassava|manioc|tapioca|sugarcane|cotton|peanut|peanuts|groundnut|groundnuts|sesame|onion|onions|garlic|carrot|carrots|lettuce|cabbage|cabbages|broccoli|cauliflower|pumpkin|pumpkins|squash|zucchini|cucumber|cucumbers|cantaloupe|watermelon|watermelons|strawberry|strawberries|pineapple|pineapples|mangoes|lemon|lemons|lime|limes|orange|oranges|mandarin|mandarins|tangerine|tangerines|guava|guavas|passionfruit|soursop|coconut|coconuts|spinach|beet|beets|beetroot|chard|eggplant|eggplants|aubergine|asparagus|celery|coriander|amaranth)\b/g
  );
  if (enMatches) {
    enScore += enMatches.length;
  }

  if (enScore > esScore) {
    return 'en';
  }
  if (esScore > enScore) {
    return 'es';
  }

  return fallback;
}

/**
 * Parses a natural-language user message for crops, location, coordinates, seed intent, and language.
 */
export function parseAgronomistQuery(
  text: string,
  catalog: Crop[],
  fallbackLanguage: 'es' | 'en' = 'es'
): ParsedAgronomistQuery {
  const { crops, matchedTerms } = extractCropsFromPrompt(text, catalog);
  const { locationQuery, explicitCoordinates } = extractLocationFromPrompt(text, matchedTerms);
  const asksForSeedRecommendation = isAskingForSeedRecommendation(text);
  const language = detectQueryLanguage(text, fallbackLanguage);

  return {
    matchedCrops: crops,
    matchedCropTerms: matchedTerms,
    locationQuery,
    explicitCoordinates,
    asksForSeedRecommendation,
    language,
  };
}

function findWholeTermIndex(normalizedHaystack: string, normalizedNeedle: string): number {
  const escaped = normalizedNeedle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|[^a-z0-9])(${escaped})(?:$|[^a-z0-9])`, 'i');
  const match = regex.exec(normalizedHaystack);
  if (!match) {
    return -1;
  }
  return match.index + (match[0].startsWith(match[1]) ? 0 : 1);
}

function cleanLocationCandidate(raw: string, matchedCropTerms: string[]): string {
  let cleaned = raw
    .split(/[?¿!¡;:\n\r()]/)[0]
    .trim();

  // Strip leading generic geographic/parcel descriptors so "mi parcela de Comayagua" or "my farm in Texas" -> "Comayagua" / "Texas"
  cleaned = cleaned
    .replace(
      /^(?:(?:mi|la|el|una|un|esta|este|nuestra|nuestro)\s+)?(?:parcela|finca|terreno|lote|huerto|campo|tierra|zona|regi[oó]n|municipio|departamento|estado|provincia|ciudad|comunidad|aldea|pueblo|lugar|ubicaci[oó]n)\s+(?:de|del|en)\s+/i,
      ''
    )
    .replace(
      /^(?:(?:my|the|a|an|this|that|our)\s+)?(?:farm|plot|parcel|field|land|garden|lot|area|region|zone|municipality|county|department|state|province|city|town|village|community|place|location)\s+(?:of|in|at|near)\s+/i,
      ''
    )
    .trim();

  // Strip trailing connectors and conversational clauses (Spanish & English)
  const stopClauses = [
    /(?:,|\s)+(?:(?:y|o|pero|porque|donde|cuando|como|que)\s+)?(?:quiero|quisiera|queremos|voy\s+a|vamos\s+a|pienso|busco|necesito|tengo|puedo|podr[ií]a|sembrar|sembrar[eé]|sembrando|cultivar|cultivando|plantar|poner|probar|evaluar|saber|ver|usar|con\s+la\s+semilla|con\s+semilla|la\s+semilla|semilla\s+de|cultivo\s+de|con\s+el\s+cultivo|con\s+datos|usando|que\s+me\s+recomiendas|que\s+semilla|que\s+cultivo|que\s+tal|como\s+le\s+va|como\s+ves|me\s+conviene|me\s+recomiendas|recomiendas|es\s+viable|se\s+da\s+bien)\b.*$/i,
    /(?:,|\s)+(?:(?:and|or|but|because|where|when|how|that|which)\s+)?(?:i\s+want|want\s+to|would\s+like|we\s+want|going\s+to|plan\s+to|planning\s+to|need\s+to|i\s+have|can\s+i|could\s+i|to\s+plant|to\s+grow|to\s+sow|to\s+cultivate|planting|growing|sowing|cultivating|with\s+the\s+seed|with\s+seeds?|the\s+seed|seed\s+of|crop\s+of|with\s+the\s+crop|with\s+data|using|what\s+do\s+you\s+recommend|would\s+you\s+recommend|do\s+you\s+recommend|which\s+seed|what\s+seed|which\s+crop|what\s+crop|what\s+works|what\s+grows|how\s+is|is\s+it\s+viable|is\s+viable|are\s+viable|does\s+it\s+grow)\b.*$/i,
  ];
  for (const regex of stopClauses) {
    cleaned = cleaned.replace(regex, '').trim();
  }

  // Strip crop terms anywhere at the end or preceded by prepositions/conjunctions
  const allCropTermsToStrip = [
    ...matchedCropTerms,
    ...SPANISH_CROP_ALIASES.map((a) => a.spanishLabel),
  ];
  for (const cropTerm of allCropTermsToStrip) {
    const escaped = cropTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned
      .replace(
        new RegExp(
          `(?:,|\\s)+(?:(?:con|para|de|y|o|sembrando|cultivando|semilla\\s+de|cultivo\\s+de|with|for|of|and|or|planting|growing|sowing|cultivating|seed\\s+of|crop\\s+of)\\s+)?${escaped}\\b.*$`,
          'i'
        ),
        ''
      )
      .trim();
  }

  // Remove trailing punctuation or prepositions
  cleaned = cleaned
    .replace(/[,.\-\s]+$/, '')
    .replace(
      /\s+\b(?:en|de|del|la|el|los|las|con|para|y|o|semilla|cultivo|in|at|of|the|with|for|and|or|seed|seeds|crop|crops)$/i,
      ''
    )
    .trim();
  return cleaned;
}

function extractBareLocationFallback(rawText: string, matchedCropTerms: string[]): string | undefined {
  // Only apply to relatively concise prompts (<= 9 words) where the user may write "Comayagua, maíz" or "Iowa, corn"
  const withoutPunct = rawText.split(/[?¿!¡;:\n\r()]/)[0].trim();
  const words = withoutPunct.split(/\s+/);
  if (words.length === 0 || words.length > 9) {
    return undefined;
  }

  let candidate = withoutPunct;
  // Remove leading greetings/intent verbs
  candidate = candidate
    .replace(
      /^(?:hola[,.\s]*|buenos\s+d[ií]as[,.\s]*|buenas\s+tardes[,.\s]*|buenas\s+noches[,.\s]*|quiero\s+sembrar|quisiera\s+sembrar|sembrar|cultivar|evaluar|comparar|analizar|revisar|buscar|recomienda(?:me)?|dame\s+recomendaci[oó]n\s+para|hello[,.\s]*|hi[,.\s]*|hey[,.\s]*|good\s+morning[,.\s]*|good\s+afternoon[,.\s]*|good\s+evening[,.\s]*|i\s+want\s+to\s+plant|want\s+to\s+plant|i\s+want\s+to\s+grow|want\s+to\s+grow|plant|grow|sow|cultivate|evaluate|compare|comparing|analyze|analyzing|check|search|recommend(?:\s+for)?)\s+/i,
      ''
    )
    .trim();

  // Remove matched crop terms
  for (const term of matchedCropTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    candidate = candidate
      .replace(
        new RegExp(`\\b(?:semilla\\s+de\\s+|cultivo\\s+de\\s+|seed\\s+of\\s+|crop\\s+of\\s+)?${escaped}\\b`, 'gi'),
        ' '
      )
      .trim();
  }

  candidate = candidate
    .replace(/^[,.\-\s]+|[,.\-\s]+$/g, '')
    .replace(
      /^(?:y|o|con|para|de|en|and|or|with|for|of|in|at|vs|versus)(?:\s+|$)|(?:\s+|^)(?:y|o|con|para|de|en|and|or|with|for|of|in|at|vs|versus)$/gi,
      ''
    )
    .replace(/^[,.\-\s]+|[,.\-\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const remainingWords = candidate.split(/\s+/).filter(Boolean);
  if (remainingWords.length === 0 || remainingWords.length > 4) {
    return undefined;
  }

  return cleanLocationCandidate(candidate, matchedCropTerms);
}

export function isValidLocationCandidate(candidate: string, matchedCropTerms: string[]): boolean {
  const norm = normalizeSearchText(candidate);
  if (norm.length < 3 || norm.length > 60) {
    return false;
  }

  if (/^\d+(?:[.,]\d+)?$/.test(norm)) {
    return false;
  }

  if (NON_LOCATION_STOPWORDS.has(norm)) {
    return false;
  }

  // Reject candidates that contain purely agronomic, language, or question words rather than place names
  if (
    /\b(?:nitrogeno|fosforo|potasio|fertilizante|fertilizantes|abono|abonos|plaga|plagas|hongo|hongos|insecto|insectos|riego|goteo|humedad|lluvia|lluvias|sequia|calor|frio|helada|heladas|temperatura|suelo|suelos|hoja|hojas|tallo|tallos|raiz|raices|fruto|frutos|flor|flores|semilla|semillas|cultivo|cultivos|rotacion|ciclo|ciclos|rendimiento|produccion|enfermedad|enfermedades|sintoma|sintomas|deficiencia|analisis|recomendacion|recomiendas|conviene|viable|mejor|mejores|como|cuando|donde|porque|cual|cuales|cuanto|hola|ayuda|gracias|espanol|ingles|surco|surcos|cama|camas|maceta|macetas|invernadero|sombra|resumen|detalle|detalles|general|promedio|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|nitrogen|phosphorus|potassium|fertilizer|fertilizers|compost|manure|pest|pests|fungus|fungi|insect|insects|irrigation|drip|humidity|moisture|rain|rainfall|drought|heat|heatwave|cold|frost|freeze|temperature|soil|soils|leaf|leaves|stem|stems|root|roots|fruit|fruits|flower|flowers|seed|seeds|crop|crops|rotation|cycle|cycles|yield|production|disease|diseases|symptom|symptoms|deficiency|analysis|recommendation|recommend|suitable|best|better|how|when|where|why|which|what|hello|help|thanks|thank|water|conservation|planting|growing|sowing|farming|gardening|resilience|recovery|stability|retention|erosion|salinity|english|spanish|row|rows|bed|beds|container|containers|pot|pots|greenhouse|shade|summary|detail|details|average|words|january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(
      norm
    )
  ) {
    return false;
  }

  // Reject if candidate starts with possessive/demonstrative non-geographic determiners
  if (
    /^(?:mi|mis|tu|tus|su|sus|este|esta|estos|estas|ese|esa|un|una|unos|unas|el\s+suelo|la\s+hoja|las\s+hojas|el\s+tallo|los\s+tallos|la\s+raiz|las\s+raices|el\s+cultivo|la\s+semilla|los\s+datos|my|your|our|their|this|that|these|those|the\s+soil|the\s+leaf|the\s+leaves|the\s+stem|the\s+stems|the\s+root|the\s+roots|the\s+crop|the\s+crops|the\s+seed|the\s+seeds|the\s+data|the\s+climate|the\s+weather|the\s+forecast|the\s+field|the\s+farm|the\s+plot|the\s+garden)\b/.test(
      norm
    )
  ) {
    return false;
  }

  // Reject if candidate is just the crop name itself
  if (matchedCropTerms.some((term) => normalizeSearchText(term) === norm)) {
    return false;
  }
  for (const alias of SPANISH_CROP_ALIASES) {
    if (
      normalizeSearchText(alias.spanishLabel) === norm ||
      alias.terms.some((t) => normalizeSearchText(t) === norm)
    ) {
      return false;
    }
  }

  return true;
}
