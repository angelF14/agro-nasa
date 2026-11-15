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
}

export const SPANISH_CROP_ALIASES: SpanishCropAlias[] = [
  {
    spanishLabel: 'maíz dulce',
    terms: ['maiz dulce', 'elote dulce', 'choclo dulce', 'sweet corn'],
    scientificTargets: ['Zea mays ssp. saccharata'],
  },
  {
    spanishLabel: 'maíz',
    terms: ['maiz', 'elote', 'choclo', 'milpa', 'zea mays'],
    scientificTargets: ['Zea mays ssp. mays', 'Zea mays ssp. saccharata'],
  },
  {
    spanishLabel: 'frijol',
    terms: ['frijol', 'frijoles', 'poroto', 'porotos', 'habichuela', 'caraota', 'alubia', 'judia'],
    scientificTargets: ['Phaseolus vulgaris'],
  },
  {
    spanishLabel: 'papa',
    terms: ['papa', 'papas', 'patata', 'patatas'],
    scientificTargets: ['Solanum tuberosum'],
  },
  {
    spanishLabel: 'tomate',
    terms: ['tomate', 'tomates', 'jitomate', 'jitomates'],
    scientificTargets: ['Lycopersicon esculentum'],
  },
  {
    spanishLabel: 'café',
    terms: ['cafe', 'cafeto', 'cafetal', 'coffea'],
    scientificTargets: ['Coffea liberica', 'Coffea excelsa'],
  },
  {
    spanishLabel: 'cacao',
    terms: ['cacao', 'cacaotero'],
    scientificTargets: ['Theobroma cacao'],
  },
  {
    spanishLabel: 'trigo',
    terms: ['trigo', 'triticum'],
    scientificTargets: ['Triticum aestivum', 'Triticum durum'],
  },
  {
    spanishLabel: 'arroz',
    terms: ['arroz', 'oryza'],
    scientificTargets: ['Oryza sativa'],
  },
  {
    spanishLabel: 'sorgo',
    terms: ['sorgo', 'maicillo'],
    scientificTargets: ['Sorghum bicolor', 'Sorghum bicolor var. sweet'],
  },
  {
    spanishLabel: 'soya',
    terms: ['soya', 'soja'],
    scientificTargets: ['Glycine max'],
  },
  {
    spanishLabel: 'cebada',
    terms: ['cebada'],
    scientificTargets: ['Hordeum vulgare'],
  },
  {
    spanishLabel: 'avena',
    terms: ['avena'],
    scientificTargets: ['Avena sativa'],
  },
  {
    spanishLabel: 'garbanzo',
    terms: ['garbanzo', 'garbanzos'],
    scientificTargets: ['Cicer arietinum'],
  },
  {
    spanishLabel: 'lenteja',
    terms: ['lenteja', 'lentejas'],
    scientificTargets: ['Lens culinaris'],
  },
  {
    spanishLabel: 'haba',
    terms: ['haba', 'habas'],
    scientificTargets: ['Vicia faba'],
  },
  {
    spanishLabel: 'arveja',
    terms: ['arveja', 'arvejas', 'chicharo', 'chicharos', 'guisante', 'guisantes'],
    scientificTargets: ['Pisum sativum'],
  },
  {
    spanishLabel: 'alfalfa',
    terms: ['alfalfa'],
    scientificTargets: ['Medicago sativa'],
  },
  {
    spanishLabel: 'aguacate',
    terms: ['aguacate', 'aguacates', 'palta', 'paltas'],
    scientificTargets: ['Persea americana', 'Persea americana ssp. mexican'],
  },
  {
    spanishLabel: 'chile / pimiento',
    terms: ['chile', 'chiles', 'pimiento', 'pimientos', 'aji', 'morron', 'jalapeno', 'serrano', 'habanero'],
    scientificTargets: ['Capsicum annuum', 'Capsicum frutescens', 'Capsicum chinense'],
  },
  {
    spanishLabel: 'plátano / banano',
    terms: ['platano', 'platanos', 'banano', 'bananos', 'banana', 'guineo'],
    scientificTargets: ['Musa sp.', 'Musa acuminata', 'Musa balbisiana'],
  },
  {
    spanishLabel: 'yuca',
    terms: ['yuca', 'mandioca', 'casabe'],
    scientificTargets: ['Manihot esculenta'],
  },
  {
    spanishLabel: 'caña de azúcar',
    terms: ['cana de azucar', 'cana'],
    scientificTargets: ['Saccharum barberi', 'Saccharum robustum', 'Saccharum edule'],
  },
  {
    spanishLabel: 'algodón',
    terms: ['algodon'],
    scientificTargets: ['Gossypium hirsutum', 'Gossypium barbadense'],
  },
  {
    spanishLabel: 'maní / cacahuate',
    terms: ['mani', 'cacahuate', 'cacahuates', 'manies'],
    scientificTargets: ['Arachis hypogaea'],
  },
  {
    spanishLabel: 'ajonjolí / sésamo',
    terms: ['ajonjoli', 'sesamo'],
    scientificTargets: ['Sesamum indicum'],
  },
  {
    spanishLabel: 'cebolla',
    terms: ['cebolla', 'cebollas'],
    scientificTargets: ['Allium cepa', 'Allium cepa var. cepa'],
  },
  {
    spanishLabel: 'ajo',
    terms: ['ajo', 'ajos'],
    scientificTargets: ['Allium sativum'],
  },
  {
    spanishLabel: 'zanahoria',
    terms: ['zanahoria', 'zanahorias'],
    scientificTargets: ['Daucus carota'],
  },
  {
    spanishLabel: 'lechuga',
    terms: ['lechuga', 'lechugas'],
    scientificTargets: ['Lactuca sativa var. capitata'],
  },
  {
    spanishLabel: 'repollo / col',
    terms: ['repollo', 'col'],
    scientificTargets: ['Brassica oleracea var. capitata'],
  },
  {
    spanishLabel: 'brócoli',
    terms: ['brocoli'],
    scientificTargets: ['Brassica oleracea var. italica'],
  },
  {
    spanishLabel: 'coliflor',
    terms: ['coliflor'],
    scientificTargets: ['Brassica oleracea var. botrytis'],
  },
  {
    spanishLabel: 'calabaza / ayote',
    terms: ['calabaza', 'zapallo', 'ayote', 'auyama', 'calabacita', 'pipian'],
    scientificTargets: ['Cucurbita moschata', 'Cucurbita pepo', 'Cucurbita maxima'],
  },
  {
    spanishLabel: 'pepino',
    terms: ['pepino', 'pepinos'],
    scientificTargets: ['Cucumis sativus'],
  },
  {
    spanishLabel: 'melón',
    terms: ['melon', 'melones'],
    scientificTargets: ['Cucumis melo'],
  },
  {
    spanishLabel: 'sandía',
    terms: ['sandia', 'sandias', 'patilla'],
    scientificTargets: ['Citrullus lanatus'],
  },
  {
    spanishLabel: 'fresa',
    terms: ['fresa', 'fresas', 'frutilla', 'frutillas'],
    scientificTargets: ['Fragaria x ananassa', 'Fragaria vesca'],
  },
  {
    spanishLabel: 'piña',
    terms: ['pina', 'anana', 'ananas'],
    scientificTargets: ['Ananas comosus'],
  },
  {
    spanishLabel: 'mango',
    terms: ['mango', 'mangos'],
    scientificTargets: ['Mangifera indica'],
  },
  {
    spanishLabel: 'papaya',
    terms: ['papaya', 'lechosa'],
    scientificTargets: ['Carica papaya'],
  },
  {
    spanishLabel: 'limón',
    terms: ['limon', 'limones', 'lima'],
    scientificTargets: ['Citrus limon', 'Citrus aurantifolia', 'Citrus latifolia'],
  },
  {
    spanishLabel: 'naranja',
    terms: ['naranja', 'naranjas', 'naranjo'],
    scientificTargets: ['Citrus sinensis'],
  },
  {
    spanishLabel: 'mandarina',
    terms: ['mandarina', 'mandarinas'],
    scientificTargets: ['Citrus reticulata'],
  },
  {
    spanishLabel: 'guayaba',
    terms: ['guayaba', 'guayabas'],
    scientificTargets: ['Psidium guajava'],
  },
  {
    spanishLabel: 'maracuyá',
    terms: ['maracuya', 'parchita', 'granadilla'],
    scientificTargets: ['Passiflora edulis'],
  },
  {
    spanishLabel: 'guanábana',
    terms: ['guanabana'],
    scientificTargets: ['Annona muricata'],
  },
  {
    spanishLabel: 'coco',
    terms: ['coco', 'cocotero'],
    scientificTargets: ['Cocos nucifera'],
  },
  {
    spanishLabel: 'espinaca',
    terms: ['espinaca', 'espinacas'],
    scientificTargets: ['Spinacia oleracea', 'Basella alba'],
  },
  {
    spanishLabel: 'remolacha / betabel',
    terms: ['remolacha', 'betabel', 'acelga'],
    scientificTargets: ['Beta vulgaris'],
  },
  {
    spanishLabel: 'berenjena',
    terms: ['berenjena', 'berenjenas'],
    scientificTargets: ['Solanum melongena'],
  },
  {
    spanishLabel: 'espárrago',
    terms: ['esparrago', 'esparragos'],
    scientificTargets: ['Asparagus officinalis'],
  },
  {
    spanishLabel: 'apio',
    terms: ['apio'],
    scientificTargets: ['Apium graveolens'],
  },
  {
    spanishLabel: 'cilantro',
    terms: ['cilantro', 'culantro'],
    scientificTargets: ['Coriandrum sativum'],
  },
  {
    spanishLabel: 'quinoa',
    terms: ['quinoa', 'quinua'],
    scientificTargets: ['Chenopodium quinoa'],
  },
  {
    spanishLabel: 'amaranto',
    terms: ['amaranto', 'kiwicha'],
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
  '3 ciclos',
  'tres ciclos',
  'rotacion',
  'el mapa',
  'agro-nasa',
  'agronasa',
  'nasa power',
  'open-meteo',
  'ecocrop',
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

  // 3. If no alias or scientific name matched yet, check commonNames (>= 4 chars, avoiding generic English words)
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
 * Extracts explicit coordinates or a geographic location name from a natural-language Spanish prompt.
 */
export function extractLocationFromPrompt(
  text: string,
  matchedCropTerms: string[] = []
): { locationQuery?: string; explicitCoordinates?: Coordinates } {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }

  // 1. Check explicit coordinates: e.g. "14.46, -87.64" or "lat 14.46 lon -87.64"
  const coordRegex =
    /(?:lat(?:itud)?\s*[:=]?\s*)?(-?\d{1,2}\.\d{2,})\s*(?:,|;|\s+y\s+|\s+lon(?:gitud)?\s*[:=]?\s*)\s*(-?\d{1,3}\.\d{2,})/i;
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

  // 2. Check explicit labels: "Lugar: Comayagua", "Ubicación es Sinaloa", etc.
  const labeledPattern =
    /\b(?:lugar|ubicaci[oó]n|ciudad|municipio|departamento|estado|provincia|pa[ií]s|regi[oó]n|zona)\s*(?:es|:|=)\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s,.-]{3,65})/gi;
  let labeledMatch: RegExpExecArray | null;
  while ((labeledMatch = labeledPattern.exec(trimmed)) !== null) {
    const candidate = cleanLocationCandidate(labeledMatch[1], matchedCropTerms);
    if (candidate && isValidLocationCandidate(candidate, matchedCropTerms)) {
      return { locationQuery: candidate };
    }
  }

  // 3. Check explicit geographic prepositional phrases in Spanish (non-skipping on invalid candidates)
  const locationPatterns: RegExp[] = [
    /\b(?:ubicad[oa]\s+en|parcela\s+(?:en|de)|terreno\s+(?:en|de)|finca\s+(?:en|de)|lote\s+(?:en|de)|sembrar(?:\s+[a-záéíóúüñ]+){0,3}\s+en|cultivar(?:\s+[a-záéíóúüñ]+){0,3}\s+en|estoy\s+en|vivo\s+en|soy\s+de|zona\s+de|regi[oó]n\s+de|municipio\s+de|departamento\s+de|estado\s+de|provincia\s+de|valle\s+(?:de|del)|ciudad\s+de|cerca\s+de)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s,.-]{3,65})/gi,
    /\b(?:en|hacia)\s+([A-ZÁÉÍÓÚÜÑa-záéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s,.-]{2,60})/g,
  ];

  for (const pattern of locationPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(trimmed)) !== null) {
      const candidate = cleanLocationCandidate(match[1], matchedCropTerms);
      if (candidate && isValidLocationCandidate(candidate, matchedCropTerms)) {
        return { locationQuery: candidate };
      }
      // Advance just past the trigger word so we never skip a nested "en <Lugar>" inside match[1]
      pattern.lastIndex = match.index + 2;
    }
  }

  // 4. Fallback for short direct inputs without prepositions: e.g. "Comayagua, maíz" or "Sinaloa y frijol" or "Comayagua, Honduras"
  const fallbackCandidate = extractBareLocationFallback(trimmed, matchedCropTerms);
  if (fallbackCandidate && isValidLocationCandidate(fallbackCandidate, matchedCropTerms)) {
    return { locationQuery: fallbackCandidate };
  }

  return {};
}

/**
 * Detects whether the user is asking for a seed/crop recommendation.
 */
export function isAskingForSeedRecommendation(text: string): boolean {
  const norm = normalizeSearchText(text);
  return (
    /\b(?:que\s+semilla|que\s+semillas|que\s+cultivo|que\s+cultivos|que\s+sembrar|que\s+puedo\s+sembrar|que\s+me\s+recomiendas\s+sembrar|recomiendame\s+una\s+semilla|recomiendame\s+un\s+cultivo|mejor\s+semilla|mejores\s+semillas)\b/.test(
      norm
    ) || norm.includes('semilla')
  );
}

/**
 * Parses a natural-language user message for crops, location, coordinates, and seed recommendation intent.
 */
export function parseAgronomistQuery(text: string, catalog: Crop[]): ParsedAgronomistQuery {
  const { crops, matchedTerms } = extractCropsFromPrompt(text, catalog);
  const { locationQuery, explicitCoordinates } = extractLocationFromPrompt(text, matchedTerms);
  const asksForSeedRecommendation = isAskingForSeedRecommendation(text);

  return {
    matchedCrops: crops,
    matchedCropTerms: matchedTerms,
    locationQuery,
    explicitCoordinates,
    asksForSeedRecommendation,
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

  // Strip leading generic geographic/parcel descriptors so "mi parcela de Comayagua" or "la zona de Sinaloa" -> "Comayagua" / "Sinaloa"
  cleaned = cleaned
    .replace(
      /^(?:(?:mi|la|el|una|un|esta|este|nuestra|nuestro)\s+)?(?:parcela|finca|terreno|lote|huerto|campo|tierra|zona|regi[oó]n|municipio|departamento|estado|provincia|ciudad|comunidad|aldea|pueblo|lugar|ubicaci[oó]n)\s+(?:de|del|en)\s+/i,
      ''
    )
    .trim();

  // Strip trailing connectors and conversational clauses (with or without comma or "y")
  const stopClauses = [
    /(?:,|\s)+(?:(?:y|o|pero|porque|donde|cuando|como|que)\s+)?(?:quiero|quisiera|queremos|voy\s+a|vamos\s+a|pienso|busco|necesito|tengo|puedo|podr[ií]a|sembrar|sembrar[eé]|sembrando|cultivar|cultivando|plantar|poner|probar|evaluar|saber|ver|usar|con\s+la\s+semilla|con\s+semilla|la\s+semilla|semilla\s+de|cultivo\s+de|con\s+el\s+cultivo|con\s+datos|usando|que\s+me\s+recomiendas|que\s+semilla|que\s+cultivo|que\s+tal|como\s+le\s+va|como\s+ves|me\s+conviene|me\s+recomiendas|recomiendas|es\s+viable|se\s+da\s+bien)\b.*$/i,
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
          `(?:,|\\s)+(?:(?:con|para|de|y|o|sembrando|cultivando|semilla\\s+de|cultivo\\s+de)\\s+)?${escaped}\\b.*$`,
          'i'
        ),
        ''
      )
      .trim();
  }

  // Remove trailing punctuation or prepositions
  cleaned = cleaned
    .replace(/[,.\-\s]+$/, '')
    .replace(/\s+\b(?:en|de|del|la|el|los|las|con|para|y|o|semilla|cultivo)$/i, '')
    .trim();
  return cleaned;
}

function extractBareLocationFallback(rawText: string, matchedCropTerms: string[]): string | undefined {
  // Only apply to relatively concise prompts (<= 10 words) where the user may write "Comayagua, maíz" or "Sinaloa, México"
  const withoutPunct = rawText.split(/[?¿!¡;:\n\r()]/)[0].trim();
  const words = withoutPunct.split(/\s+/);
  if (words.length === 0 || words.length > 9) {
    return undefined;
  }

  let candidate = withoutPunct;
  // Remove leading greetings/intent verbs
  candidate = candidate
    .replace(
      /^(?:hola[,.\s]*|buenos\s+d[ií]as[,.\s]*|buenas\s+tardes[,.\s]*|buenas\s+noches[,.\s]*|quiero\s+sembrar|quisiera\s+sembrar|sembrar|cultivar|evaluar|buscar|recomienda(?:me)?|dame\s+recomendaci[oó]n\s+para)\s+/i,
      ''
    )
    .trim();

  // Remove matched crop terms
  for (const term of matchedCropTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    candidate = candidate
      .replace(new RegExp(`\\b(?:semilla\\s+de\\s+|cultivo\\s+de\\s+)?${escaped}\\b`, 'gi'), ' ')
      .trim();
  }

  candidate = candidate
    .replace(/^[,.\-\s]+|[,.\-\s]+$/g, '')
    .replace(/^(?:y|o|con|para|de|en)\s+|\s+(?:y|o|con|para|de|en)$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const remainingWords = candidate.split(/\s+/).filter(Boolean);
  if (remainingWords.length === 0 || remainingWords.length > 4) {
    return undefined;
  }

  return cleanLocationCandidate(candidate, matchedCropTerms);
}

function isValidLocationCandidate(candidate: string, matchedCropTerms: string[]): boolean {
  const norm = normalizeSearchText(candidate);
  if (norm.length < 3 || norm.length > 60) {
    return false;
  }

  if (NON_LOCATION_STOPWORDS.has(norm)) {
    return false;
  }

  // Reject candidates that contain purely agronomic/question words rather than place names
  if (
    /\b(?:nitrogeno|fosforo|potasio|fertilizante|abono|plaga|plagas|hongo|hongos|insecto|riego|goteo|humedad|lluvia|lluvias|sequia|calor|helada|temperatura|suelo|suelos|hoja|hojas|tallo|raiz|fruto|semilla|semillas|cultivo|cultivos|rotacion|ciclo|ciclos|rendimiento|produccion|enfermedad|sintoma|sintomas|deficiencia|analisis|recomendacion|recomiendas|conviene|viable|mejor|mejores|como|cuando|donde|porque|cual|cuales|cuanto|hola|ayuda|gracias)\b/.test(
      norm
    )
  ) {
    return false;
  }

  // Reject if candidate starts with possessive/demonstrative non-geographic determiners
  if (
    /^(?:mi|mis|tu|tus|su|sus|este|esta|estos|estas|ese|esa|un|una|unos|unas|el\s+suelo|la\s+hoja|las\s+hojas|el\s+cultivo|la\s+semilla|los\s+datos)\b/.test(
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
