import { GoogleGenAI, type Content, type Part } from '@google/genai';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  AgronomistChatMessageDto,
  AgronomistChatRequest,
  AgronomistChatResponse,
  AgronomistParcelContext,
  AgronomistStatusResponse,
} from '../app/models/agronomist.model';
import type { FarmerPriority, SoilObservation } from '../app/models/farm-environment.model';

export const DEFAULT_FREE_TIER_MODEL = 'gemini-3.6-flash';
export const FALLBACK_FREE_TIER_MODEL = 'gemini-3.5-flash-lite';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BASE64_LENGTH = 6_000_000;
const MAX_HISTORY_MESSAGES = 16;
const MAX_IMAGES_IN_HISTORY = 2;

export type SupportedAgronomistLanguage = 'es' | 'en';
export type DetectedConversationLanguage = SupportedAgronomistLanguage | 'other';

const SOIL_OBSERVATION_LABELS: Record<SupportedAgronomistLanguage, Record<SoilObservation, string>> = {
  es: {
    compacted: 'Suelo compactado',
    sandy: 'Suelo arenoso',
    'low-retention': 'Baja retención de humedad',
    'erosion-prone': 'Propenso a erosión',
    saline: 'Riesgo de salinidad',
    healthy: 'Suelo con buena estructura/salud',
  },
  en: {
    compacted: 'Compacted soil',
    sandy: 'Sandy soil',
    'low-retention': 'Low moisture retention',
    'erosion-prone': 'Erosion-prone soil',
    saline: 'Salinity risk',
    healthy: 'Well-structured / healthy soil',
  },
};

const FARMER_PRIORITY_LABELS: Record<SupportedAgronomistLanguage, Record<FarmerPriority, string>> = {
  es: {
    'water-conservation': 'Conservación de agua',
    'soil-regeneration': 'Regeneración del suelo',
    'heat-resilience': 'Resiliencia frente a olas de calor',
    'nitrogen-recovery': 'Recuperación de nitrógeno',
    'yield-stability': 'Estabilidad de rendimiento',
  },
  en: {
    'water-conservation': 'Water conservation',
    'soil-regeneration': 'Soil regeneration',
    'heat-resilience': 'Heatwave resilience',
    'nitrogen-recovery': 'Nitrogen recovery',
    'yield-stability': 'Yield stability',
  },
};

const PROMPT_CONTEXT_COPY = {
  es: {
    sectionTitle: '=== CONTEXTO ACTUAL DE LA PARCELA EN AGRONASA ===',
    emptyContext:
      'Sin datos de parcela ni cultivo cargados todavía. El usuario aún puede hacer consultas agronómicas generales o subir fotos.',
    autoResolvedPrefix: '[BÚSQUEDA AUTOMÁTICA EN TIEMPO REAL]',
    resolvedLocation: (v: string) => `Ubicación geocodificada desde el mensaje: "${v}"`,
    resolvedCrop: (v: string) => `Semilla principal encontrada en FAO EcoCrop: ${v}`,
    resolvedCompared: (v: string) => `Semillas comparadas desde el mensaje: ${v}`,
    locationLine: (locLabel: string, lat: number, lon: number) =>
      `Ubicación: ${locLabel}(Lat ${lat}, Lon ${lon})`,
    locationMissing: 'Ubicación: No seleccionada en el mapa todavía.',
    meanTemp: (v: number) => `Temp media ${v} °C`,
    tempRange: (min: number, max: number) => `Rango térmico ${min} a ${max} °C`,
    annualRain: (v: number) => `Lluvia anualizada ${v} mm/año`,
    periodRain: (v: number, days: number | string) =>
      `Lluvia acumulada período ${v} mm (${days} días)`,
    elevation: (v: number) => `Altitud NASA DEM ${v} m s.n.m.`,
    solarRad: (v: number) => `Radiación solar media ${v} MJ/m²/día`,
    humidity: (v: number) => `Humedad relativa media ${v}%`,
    heatwaveRisk: (v: string) => `Riesgo de ola de calor: ${v}`,
    climateLine: (parts: string[]) => `Clima histórico NASA POWER: ${parts.join(' | ')}.`,
    climateMissing: 'Clima histórico NASA POWER: Aún no disponible.',
    weatherLine: (w: NonNullable<AgronomistParcelContext['weatherSummary']>) =>
      `Pronóstico Open-Meteo (próximos 7 días de ${w.forecastDaysCount} disponibles): ` +
      `Temp actual ${w.currentTempC} °C, HR ${w.humidityPct}%, viento ${w.windSpeedKmh} km/h | ` +
      `Rango 7d ${w.minTemp7dC}–${w.maxTemp7dC} °C | ` +
      `Lluvia esperada 7d: ${w.precipitation7dMm} mm | ET0 7d: ${w.et07dMm} mm | ` +
      `Balance hídrico 7d (Lluvia - ET0): ${w.waterBalance7dMm} mm.`,
    selectedCropLine: (c: NonNullable<AgronomistParcelContext['selectedCrop']>) =>
      `Cultivo seleccionado (FAO EcoCrop): ${c.commonName} (${c.scientificName}), ` +
      `Familia: ${c.family ?? 'No especificada'}, Categoría: ${c.category}. ` +
      `Óptimos EcoCrop: Temp ${c.tempOptRangeC}, Lluvia ${c.rainOptRangeMm}` +
      (c.phOptRange ? `, pH ${c.phOptRange}` : '') +
      (c.cycleDaysRange ? `, Ciclo ${c.cycleDaysRange}` : '') +
      '.',
    selectedCropMissing: 'Cultivo seleccionado: Ninguno todavía.',
    evaluationLine: (ev: NonNullable<AgronomistParcelContext['cropEvaluation']>) =>
      `Evaluación de aptitud EcoCrop: ${ev.overallScore}% (${ev.isViable ? 'Viable' : 'No recomendado'}). ${ev.summary}`,
    evaluationCheck: (label: string, observed: string, expected: string, status: string) =>
      `${label}: observado ${observed} vs esperado ${expected} [${status}]`,
    evaluationDetails: (details: string) => `Detalle de parámetros: ${details}.`,
    rotationCycle: (n: number, name: string, sci: string, fam: string, score: number) =>
      `Ciclo ${n}: ${name} (${sci}, ${fam}) — ${score}% aptitud`,
    rotationLine: (cycles: string) => `Plan de rotación sugerido (3 ciclos): ${cycles}.`,
    alertsLine: (alerts: string) => `Alertas activas: ${alerts}`,
    comparedItem: (ce: NonNullable<AgronomistParcelContext['comparedEvaluations']>[number]) =>
      `${ce.commonName} (${ce.scientificName}): ${ce.overallScore}% (${ce.isViable ? 'Viable' : 'No recomendado'}, Temp ópt ${ce.tempOptRangeC}, Lluvia ópt ${ce.rainOptRangeMm}) — ${ce.summary}`,
    comparedLine: (items: string) => `Comparativa de semillas mencionadas en la consulta: ${items}`,
    topSuitableItem: (
      idx: number,
      sc: NonNullable<AgronomistParcelContext['topSuitableCrops']>[number]
    ) =>
      `#${idx + 1} ${sc.commonName} (${sc.scientificName}, ${sc.family ?? sc.category}): ${sc.suitabilityScore}% aptitud (Temp ópt ${sc.tempOptRangeC}, Lluvia ópt ${sc.rainOptRangeMm})`,
    topSuitableLine: (items: string) =>
      `Ranking FAO EcoCrop de semillas más aptas para el clima de esta ubicación: ${items}.`,
    soilLine: (labels: string) => `Observaciones locales de suelo reportadas por el agricultor: ${labels}.`,
    prioritiesLine: (labels: string) => `Prioridades del agricultor: ${labels}.`,
    notesLine: (notes: string) => `Notas adicionales de campo del agricultor: "${notes}"`,
  },
  en: {
    sectionTitle: '=== CURRENT AGRONASA PARCEL CONTEXT ===',
    emptyContext:
      'No parcel or crop data loaded yet. The user can still ask general agronomic questions or upload photos.',
    autoResolvedPrefix: '[LIVE REAL-TIME LOOKUP]',
    resolvedLocation: (v: string) => `Geocoded location from message: "${v}"`,
    resolvedCrop: (v: string) => `Primary crop found in FAO EcoCrop: ${v}`,
    resolvedCompared: (v: string) => `Compared crops from message: ${v}`,
    locationLine: (locLabel: string, lat: number, lon: number) =>
      `Location: ${locLabel}(Lat ${lat}, Lon ${lon})`,
    locationMissing: 'Location: Not selected on the map yet.',
    meanTemp: (v: number) => `Mean temp ${v} °C`,
    tempRange: (min: number, max: number) => `Temp range ${min} to ${max} °C`,
    annualRain: (v: number) => `Annualized rainfall ${v} mm/year`,
    periodRain: (v: number, days: number | string) =>
      `Accumulated period rainfall ${v} mm (${days} days)`,
    elevation: (v: number) => `NASA DEM elevation ${v} m a.s.l.`,
    solarRad: (v: number) => `Mean solar radiation ${v} MJ/m²/day`,
    humidity: (v: number) => `Mean relative humidity ${v}%`,
    heatwaveRisk: (v: string) => `Heatwave risk: ${v}`,
    climateLine: (parts: string[]) => `NASA POWER historical climate: ${parts.join(' | ')}.`,
    climateMissing: 'NASA POWER historical climate: Not yet available.',
    weatherLine: (w: NonNullable<AgronomistParcelContext['weatherSummary']>) =>
      `Open-Meteo forecast (next 7 days of ${w.forecastDaysCount} available): ` +
      `Current temp ${w.currentTempC} °C, RH ${w.humidityPct}%, wind ${w.windSpeedKmh} km/h | ` +
      `7d range ${w.minTemp7dC}–${w.maxTemp7dC} °C | ` +
      `Expected 7d rainfall: ${w.precipitation7dMm} mm | 7d ET0: ${w.et07dMm} mm | ` +
      `7d water balance (Rainfall - ET0): ${w.waterBalance7dMm} mm.`,
    selectedCropLine: (c: NonNullable<AgronomistParcelContext['selectedCrop']>) =>
      `Selected crop (FAO EcoCrop): ${c.commonName} (${c.scientificName}), ` +
      `Family: ${c.family ?? 'Not specified'}, Category: ${c.category}. ` +
      `EcoCrop optima: Temp ${c.tempOptRangeC}, Rainfall ${c.rainOptRangeMm}` +
      (c.phOptRange ? `, pH ${c.phOptRange}` : '') +
      (c.cycleDaysRange ? `, Cycle ${c.cycleDaysRange}` : '') +
      '.',
    selectedCropMissing: 'Selected crop: None yet.',
    evaluationLine: (ev: NonNullable<AgronomistParcelContext['cropEvaluation']>) =>
      `EcoCrop suitability evaluation: ${ev.overallScore}% (${ev.isViable ? 'Viable' : 'Not recommended'}). ${ev.summary}`,
    evaluationCheck: (label: string, observed: string, expected: string, status: string) =>
      `${label}: observed ${observed} vs expected ${expected} [${status}]`,
    evaluationDetails: (details: string) => `Parameter details: ${details}.`,
    rotationCycle: (n: number, name: string, sci: string, fam: string, score: number) =>
      `Cycle ${n}: ${name} (${sci}, ${fam}) — ${score}% suitability`,
    rotationLine: (cycles: string) => `Suggested rotation plan (3 cycles): ${cycles}.`,
    alertsLine: (alerts: string) => `Active alerts: ${alerts}`,
    comparedItem: (ce: NonNullable<AgronomistParcelContext['comparedEvaluations']>[number]) =>
      `${ce.commonName} (${ce.scientificName}): ${ce.overallScore}% (${ce.isViable ? 'Viable' : 'Not recommended'}, Opt temp ${ce.tempOptRangeC}, Opt rainfall ${ce.rainOptRangeMm}) — ${ce.summary}`,
    comparedLine: (items: string) => `Comparison of crops mentioned in query: ${items}`,
    topSuitableItem: (
      idx: number,
      sc: NonNullable<AgronomistParcelContext['topSuitableCrops']>[number]
    ) =>
      `#${idx + 1} ${sc.commonName} (${sc.scientificName}, ${sc.family ?? sc.category}): ${sc.suitabilityScore}% suitability (Opt temp ${sc.tempOptRangeC}, Opt rainfall ${sc.rainOptRangeMm})`,
    topSuitableLine: (items: string) =>
      `FAO EcoCrop ranking of best-suited crops for this location's climate: ${items}.`,
    soilLine: (labels: string) => `Local soil observations reported by farmer: ${labels}.`,
    prioritiesLine: (labels: string) => `Farmer priorities: ${labels}.`,
    notesLine: (notes: string) => `Additional farmer field notes: "${notes}"`,
  },
};

const CROP_NAME_ES_TO_EN: Record<string, string> = {
  'maiz dulce': 'sweet corn',
  maiz: 'corn',
  frijol: 'common bean',
  papa: 'potato',
  tomate: 'tomato',
  cafe: 'coffee',
  cacao: 'cocoa',
  trigo: 'wheat',
  arroz: 'rice',
  sorgo: 'sorghum',
  soya: 'soybean',
  cebada: 'barley',
  avena: 'oats',
  garbanzo: 'chickpea',
  lenteja: 'lentil',
  haba: 'fava bean',
  arveja: 'pea',
  alfalfa: 'alfalfa',
  aguacate: 'avocado',
  'chile / pimiento': 'chili / pepper',
  'platano / banano': 'banana / plantain',
  yuca: 'cassava',
  'cana de azucar': 'sugarcane',
  algodon: 'cotton',
  'mani / cacahuate': 'peanut',
  'ajonjoli / sesamo': 'sesame',
  cebolla: 'onion',
  ajo: 'garlic',
  zanahoria: 'carrot',
  lechuga: 'lettuce',
  'repollo / col': 'cabbage',
  brocoli: 'broccoli',
  coliflor: 'cauliflower',
  'calabaza / ayote': 'pumpkin / squash',
  pepino: 'cucumber',
  melon: 'melon',
  sandia: 'watermelon',
  fresa: 'strawberry',
  pina: 'pineapple',
  mango: 'mango',
  papaya: 'papaya',
  limon: 'lemon',
  naranja: 'orange',
  mandarina: 'mandarin',
  guayaba: 'guava',
  maracuya: 'passion fruit',
  guanabana: 'soursop',
  coco: 'coconut',
  espinaca: 'spinach',
  'remolacha / betabel': 'beet / chard',
  berenjena: 'eggplant',
  esparrago: 'asparagus',
  apio: 'celery',
  cilantro: 'coriander',
  quinoa: 'quinoa',
  amaranto: 'amaranth',
  okra: 'okra',
};

function normalizeServerText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function localizeCropNameForPrompt(
  name: string,
  targetLang: SupportedAgronomistLanguage = 'es'
): string {
  if (!name || targetLang !== 'en') {
    return name;
  }
  const norm = normalizeServerText(name.trim());
  return CROP_NAME_ES_TO_EN[norm] ?? name;
}

function localizeContextTextForPrompt(
  text: string,
  targetLang: SupportedAgronomistLanguage = 'es'
): string {
  if (!text || targetLang !== 'en') {
    return text;
  }
  let out = text
    .replace(
      /\[Preseleccionada por mayor aptitud clim[aá]tica\]/gi,
      '[Preselected for highest climate suitability]'
    )
    .replace(/Temperatura Media \(T2M\)/gi, 'Mean Temperature (T2M)')
    .replace(/Precipitaci[oó]n Equivalente Anual/gi, 'Annualized Equivalent Precipitation')
    .replace(/Temperatura M[ií]nima \/ Riesgo de Helada/gi, 'Minimum Temperature / Frost Risk')
    .replace(/Temperatura M[ií]nima Observada/gi, 'Observed Minimum Temperature')
    .replace(/Altitud de la Parcela \(NASA DEM\)/gi, 'Parcel Elevation (NASA DEM)')
    .replace(/Duraci[oó]n del Ciclo \(GMIN[–-]GMAX\)/gi, 'Cycle Duration (GMIN–GMAX)')
    .replace(/Sin restricci[oó]n registrada en EcoCrop/gi, 'No restriction recorded in EcoCrop')
    .replace(/presenta condiciones [oó]ptimas/gi, 'shows optimal conditions')
    .replace(
      /en esta ubicaci[oó]n seg[uú]n los registros de NASA POWER/gi,
      'at this location according to NASA POWER records'
    )
    .replace(/es viable con reservas/gi, 'is viable with caveats')
    .replace(
      /revisa los par[aá]metros en rango aceptable para ajustar riego o manejo/gi,
      'review parameters in acceptable range to adjust irrigation or management'
    )
    .replace(/tiene baja compatibilidad/gi, 'has low compatibility')
    .replace(
      /con las condiciones clim[aá]ticas\/altitudinales observadas; revisa el plan de rotaci[oó]n sugerido/gi,
      'with observed climate/elevation conditions; review the suggested rotation plan'
    )
    .replace(/Riesgo Alto de Estr[eé]s T[eé]rmico/gi, 'High Heat Stress Risk')
    .replace(/NASA POWER registra picos de hasta/gi, 'NASA POWER records peaks up to')
    .replace(
      /Prioriza variedades tolerantes al calor y cobertura vegetal/gi,
      'Prioritize heat-tolerant varieties and mulch cover'
    )
    .replace(/Picos T[eé]rmicos Moderados/gi, 'Moderate Heat Peaks')
    .replace(/Se observaron temperaturas m[aá]ximas de/gi, 'Maximum temperatures observed:')
    .replace(/en el per[ií]odo analizado/gi, 'in the analyzed period')
    .replace(/Baja\s*Disponibilidad H[ií]drica Anualizada/gi, 'Low Annualized Water Availability')
    .replace(/La precipitaci[oó]n anualizada es de/gi, 'Annualized rainfall is')
    .replace(
      /Prioriza cultivos de baja demanda h[ií]drica y abonos verdes de cobertura/gi,
      'Prioritize low-water-demand crops and green cover crops'
    )
    .replace(/Riesgo de Helada \/ Temperatura Letal/gi, 'Frost / Lethal Temperature Risk')
    .replace(/La m[ií]nima registrada/gi, 'Recorded minimum')
    .replace(/alcanza el umbral letal de/gi, 'reaches the lethal threshold of')
    .replace(/[OÓ]ptimo/g, 'Optimal')
    .replace(/umbral letal/gi, 'lethal threshold')
    .replace(/m[ií]nimo absoluto/gi, 'absolute minimum')
    .replace(/d[ií]as seleccionados/gi, 'selected days')
    .replace(/d[ií]as requeridos/gi, 'required days')
    .replace(/en el per[ií]odo/gi, 'in period')
    .replace(/mm\/a[ñn]o/gi, 'mm/year')
    .replace(/\bd[ií]as\b/gi, 'days')
    .replace(/m s\.n\.m\./gi, 'm a.s.l.');

  for (const [esName, enName] of Object.entries(CROP_NAME_ES_TO_EN)) {
    const escaped = esName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`^${escaped}(?=\\s*\\()`, 'i'), enName);
  }
  return out;
}

function detectSingleMessageLanguage(text: string): DetectedConversationLanguage | null {
  const trimmed = text.trim();
  if (!trimmed || !/\p{L}/u.test(trimmed)) {
    return null;
  }

  const norm = normalizeServerText(trimmed);

  // Explicit language-switch requests override keyword counts
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
  let otherScore = 0;

  if (/[¿¡]/.test(trimmed)) {
    esScore += 3;
  }
  if (/[ñÑ]/.test(trimmed)) {
    esScore += 2;
  }
  const otherWordMatches = norm.match(
    /\b(?:bonjour|bonsoir|merci|pourquoi|pouvez|francais|voudrais|aimerais|obrigado|obrigada|voce|portugues|bom\s+dia|boa\s+tarde|hallo|danke|bitte|deutsch|sprechen|warum|welche|guten\s+tag|ciao|grazie|buongiorno|italiano|vorrei)\b/g
  );
  if (otherWordMatches) {
    otherScore += otherWordMatches.length * 2;
  }

  if (
    !otherWordMatches &&
    (/(?:^|[\s¿¡])[a-záéíóúü]*[áéíóúü][a-záéíóúü]*/.test(trimmed) ||
      /^(?:Qué|Cómo|Cuál|Cuáles|Cuándo|Dónde|Quién|Cuánto|Cuánta|Cuántos|Cuántas|Por\s+qué|Sí|Más|Está|Están|Podría|Podrías|Debería|Háblame|Respóndeme|Contéstame|Explícame|Recomiéndame|Muéstrame|Evalúa|Analiza)\b/.test(
        trimmed
      ))
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

  if (
    /[\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(
      trimmed
    )
  ) {
    otherScore += 3;
  }

  if (otherScore >= 2 && otherScore > esScore && otherScore > enScore) {
    return 'other';
  }
  if (enScore > esScore) {
    return 'en';
  }
  if (esScore > enScore) {
    return 'es';
  }

  return null;
}

export function detectConversationLanguage(
  messages: AgronomistChatMessageDto[]
): DetectedConversationLanguage {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'user' || !msg.text) {
      continue;
    }
    const detected = detectSingleMessageLanguage(msg.text);
    if (detected) {
      return detected;
    }
  }
  return 'es';
}

export class AgronomistHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AgronomistHttpError';
  }
}

/**
 * Loads key=value pairs from `.env.local` and `.env` in `cwd` if the key is not already defined in `process.env`.
 * Supports both local `.env` files and `.env.local` generated by `vercel env pull`.
 */
export function loadLocalEnvIfNeeded(cwd = process.cwd()): void {
  if (
    process.env['GEMINI_API_KEY'] ||
    process.env['GOOGLE_API_KEY'] ||
    process.env['NG_APP_GEMINI_API_KEY']
  ) {
    return;
  }

  for (const fileName of ['.env.local', '.env']) {
    const envPath = resolve(cwd, fileName);
    if (!existsSync(envPath)) {
      continue;
    }

    try {
      const content = readFileSync(envPath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
          continue;
        }
        const eqIndex = line.indexOf('=');
        if (eqIndex <= 0) {
          continue;
        }
        const key = line.slice(0, eqIndex).trim();
        let value = line.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (key && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch {
      // Ignore unreadable env file; runtime env vars or client-provided key can still supply it.
    }
  }
}

export function resolveServerGeminiApiKey(): string {
  loadLocalEnvIfNeeded();
  return (
    process.env['GEMINI_API_KEY'] ||
    process.env['GOOGLE_API_KEY'] ||
    process.env['NG_APP_GEMINI_API_KEY'] ||
    ''
  ).trim();
}

export function resolvePrimaryModel(): string {
  loadLocalEnvIfNeeded();
  return process.env['GEMINI_MODEL']?.trim() || DEFAULT_FREE_TIER_MODEL;
}

export function getAgronomistStatus(): AgronomistStatusResponse {
  const serverKey = resolveServerGeminiApiKey();
  return {
    configured: serverKey.length > 0,
    defaultModel: resolvePrimaryModel(),
    fallbackModel: FALLBACK_FREE_TIER_MODEL,
  };
}

export function buildAgronomistSystemPrompt(
  context?: AgronomistParcelContext,
  targetLang: DetectedConversationLanguage = 'es'
): string {
  if (targetLang === 'other') {
    return [
      'You are AgroNasa Superintelligence (AgroNasa Superinteligencia), an agronomic Superintelligence.',
      '1. Identity: Never say you are an "AI" or "artificial intelligence" ("IA" / "inteligencia artificial"). Present yourself as an agronomic Superintelligence.',
      '2. Unsupported language detected: Politely tell the user — concisely in both English and Spanish — that AgroNasa Superintelligence / AgroNasa Superinteligencia currently supports queries only in English and Spanish, and invite them to write in either language.',
      '3. Do not emit the [[AGRONASA_DETECTED: ...]] tag in this turn.',
    ].join('\n');
  }

  if (targetLang === 'en') {
    const baseInstructionsEn = [
      'You are AgroNasa Superintelligence, an agronomic Superintelligence specialized in climate-smart agriculture, crop rotation, water management, soil health, and integrated pest management (IPM).',
      'You are integrated into the AgroNasa platform (Nominatim geocoding, NASA POWER satellite data, Open-Meteo weather forecasts, and the FAO EcoCrop agronomic catalog).',
      '',
      'Response rules:',
      '1. Identity: You are AgroNasa Superintelligence, an agronomic Superintelligence. Never say you are an "AI" or "artificial intelligence"; if asked who or what you are, always present yourself as an agronomic Superintelligence.',
      '2. CRITICAL OUTPUT LANGUAGE (ENGLISH): You MUST write 100% of your entire reply in clear, natural, empathetic, practical English — even if earlier chat turns, crop common names (e.g. "cebolla" -> "onion"), or context labels contain Spanish text.',
      '   - Translate all headings, bullet points, status labels ("Viable", "Not recommended"), and units ("mm/year", "days", "m a.s.l.") into English. Never mix Spanish sentences or headings into an English reply.',
      '   - If the user writes in another language besides English or Spanish in a later turn, politely explain in English and Spanish that AgroNasa Superintelligence currently supports English and Spanish only.',
      '3. Ground your recommendations in real parcel context data below whenever available, citing exact values (temperature, annualized rainfall, ET0, water balance, elevation, EcoCrop suitability score).',
      '4. If AgroNasa automatically queried live services from the user message (geocoded place or FAO EcoCrop seed), confirm at the start in English that you loaded those live datasets and deliver a complete agronomic verdict. If multiple compared crops or top suitable crops are listed, compare them clearly with their EcoCrop scores.',
      '5. Never fabricate lab metrics, measured pH, or satellite numbers missing from context. If parcel or crop data is missing, state it clearly and ask brief helpful questions.',
      '6. When the user attaches an image (leaf, plant, pest, fruit, or soil), perform careful visual agronomic inspection: describe visible traits/symptoms, provide 2-3 ranked hypotheses while noting it does not replace laboratory analysis, and give actionable IPM steps fitted to the parcel climate.',
      '7. Organize responses with short headings, bullet lists, and bold highlights for field readability.',
      '8. Include a brief precaution note whenever recommending fertilizers, soil amendments, or crop protection treatments (verify dosage against soil analysis and local product labels).',
      '9. Metadata tag rule: ONLY if the user specifically mentioned a real geographic place (city, region, state, or country) and/or a crop/seed, include on a final separate line: [[AGRONASA_DETECTED: lugar="Place Name" | semilla="Crop Name"]] (use empty quotes "" when omitted; for semilla prefer FAO scientific name like "Zea mays" or standard crop name; NEVER put language names like "English", "Spanish", "Inglés", or "Español" inside lugar="").',
    ].join('\n');

    const contextSectionEn = formatParcelContextForPrompt(context, 'en');
    return (
      `${baseInstructionsEn}\n\n${PROMPT_CONTEXT_COPY.en.sectionTitle}\n${contextSectionEn}\n\n` +
      'FINAL INSTRUCTION: Write your entire response strictly in English.'
    );
  }

  const baseInstructionsEs = [
    'Eres AgroNasa Superinteligencia, una Superinteligencia agronómica especialista en agricultura climáticamente inteligente, rotación de cultivos, manejo de agua, salud del suelo y manejo integrado de plagas (MIP).',
    'Estás integrada en la plataforma AgroNasa (geocodificación Nominatim, datos satelitales NASA POWER, pronóstico meteorológico Open-Meteo y catálogo agronómico FAO EcoCrop).',
    '',
    'Reglas de respuesta:',
    '1. Identidad: eres AgroNasa Superinteligencia, una Superinteligencia agronómica. Nunca digas que eres una IA ni una inteligencia artificial; si el usuario pregunta qué o quién eres, preséntate siempre como una Superinteligencia agronómica.',
    '2. IDIOMA OBLIGATORIO DE SALIDA (ESPAÑOL): Redacta el 100% de tu respuesta en español claro, empático y práctico, sin mezclar frases en otros idiomas salvo nombres científicos o términos técnicos universales.',
    '3. Fundamenta tus recomendaciones en los datos reales del contexto de la parcela cuando existan, citando valores exactos (temperatura, lluvia anualizada, ET0, balance hídrico, altitud, puntaje EcoCrop).',
    '4. Si el sistema consultó automáticamente los servicios de AgroHelper a partir del mensaje del usuario (lugar geocodificado o semilla buscada en FAO EcoCrop), confirma al inicio que ya cargaste esos datos en vivo y úsalos para dar un veredicto agronómico completo. Si se evaluaron varias semillas comparadas o se listan las mejores semillas aptas para la región, compáralas claramente con sus puntajes EcoCrop.',
    '5. Nunca inventes métricas de laboratorio, pH medido o datos satelitales que no estén en el contexto. Si falta información (por ejemplo, si el usuario no ha fijado parcela en el mapa o no ha elegido cultivo), indícalo claramente y guía al usuario o haz preguntas cortas útiles.',
    '6. Cuando el usuario adjunte una imagen (hoja, planta, plaga, fruto o suelo), realiza una observación visual agronómica cuidadosa: describe síntomas o rasgos visibles, plantea 2 o 3 hipótesis ordenadas por probabilidad aclarando que no reemplazan análisis de laboratorio, y entrega acciones concretas de manejo integrado considerando el clima actual de la parcela.',
    '7. Organiza tus respuestas con encabezados cortos, listas con viñetas y negritas en los puntos accionables para facilitar la lectura en campo.',
    '8. Incluye una nota breve de precaución cuando recomiendes fertilizantes, enmiendas o control fitosanitario (verificar dosis según análisis de suelo y etiqueta local).',
    '9. Etiqueta de metadatos: ÚNICAMENTE si el usuario menciona en su consulta una ciudad, región, departamento, estado o país real y/o una semilla o cultivo, incluye al final de tu respuesta en una línea separada: [[AGRONASA_DETECTED: lugar="Nombre del lugar" | semilla="Nombre del cultivo"]] (deja comillas vacías "" si alguno no fue mencionado; para semilla usa preferentemente el nombre científico FAO como "Zea mays" o el nombre estándar; NUNCA coloques nombres de idiomas como "Inglés", "Español", "English" o "Spanish" dentro de lugar="").',
  ].join('\n');

  const contextSectionEs = formatParcelContextForPrompt(context, 'es');
  return (
    `${baseInstructionsEs}\n\n${PROMPT_CONTEXT_COPY.es.sectionTitle}\n${contextSectionEs}\n\n` +
    'INSTRUCCIÓN FINAL: Redacta toda tu respuesta estrictamente en español.'
  );
}

export function formatParcelContextForPrompt(
  context?: AgronomistParcelContext,
  targetLang: SupportedAgronomistLanguage = 'es'
): string {
  const copy = PROMPT_CONTEXT_COPY[targetLang];
  if (!context) {
    return copy.emptyContext;
  }

  const lines: string[] = [];

  if (context.autoResolvedFromPrompt) {
    const ar = context.autoResolvedFromPrompt;
    const resolvedParts: string[] = [];
    if (ar.locationResolved) {
      resolvedParts.push(copy.resolvedLocation(ar.locationResolved));
    }
    if (ar.cropResolved) {
      resolvedParts.push(
        copy.resolvedCrop(localizeContextTextForPrompt(ar.cropResolved, targetLang))
      );
    }
    if (ar.comparedCrops && ar.comparedCrops.length > 0) {
      const localizedCompared = ar.comparedCrops.map((c) =>
        localizeContextTextForPrompt(c, targetLang)
      );
      resolvedParts.push(copy.resolvedCompared(localizedCompared.join(', ')));
    }
    if (resolvedParts.length > 0) {
      lines.push(`${copy.autoResolvedPrefix} ${resolvedParts.join(' | ')}.`);
    }
  }

  if (context.coordinates) {
    const locLabel = context.locationName ? `${context.locationName} ` : '';
    lines.push(copy.locationLine(locLabel, context.coordinates.lat, context.coordinates.lon));
  } else {
    lines.push(copy.locationMissing);
  }

  const climate = context.historicalClimate;
  if (
    climate &&
    (climate.meanTempC !== undefined || climate.annualizedPrecipitationMm !== undefined)
  ) {
    const parts: string[] = [];
    if (climate.meanTempC !== undefined) parts.push(copy.meanTemp(climate.meanTempC));
    if (climate.minTempC !== undefined && climate.maxTempC !== undefined) {
      parts.push(copy.tempRange(climate.minTempC, climate.maxTempC));
    }
    if (climate.annualizedPrecipitationMm !== undefined) {
      parts.push(copy.annualRain(climate.annualizedPrecipitationMm));
    }
    if (climate.totalPrecipitationMm !== undefined) {
      parts.push(copy.periodRain(climate.totalPrecipitationMm, climate.analyzedDays ?? '?'));
    }
    if (climate.elevationM !== undefined) parts.push(copy.elevation(climate.elevationM));
    if (climate.solarRadiationMjM2Day !== undefined) {
      parts.push(copy.solarRad(climate.solarRadiationMjM2Day));
    }
    if (climate.relativeHumidityPct !== undefined) {
      parts.push(copy.humidity(climate.relativeHumidityPct));
    }
    if (climate.heatwaveRisk) parts.push(copy.heatwaveRisk(climate.heatwaveRisk));
    lines.push(copy.climateLine(parts));
  } else {
    lines.push(copy.climateMissing);
  }

  const weather = context.weatherSummary;
  if (weather) {
    lines.push(copy.weatherLine(weather));
  }

  if (context.selectedCrop) {
    const localizedCrop = {
      ...context.selectedCrop,
      commonName: localizeCropNameForPrompt(context.selectedCrop.commonName, targetLang),
      tempOptRangeC: localizeContextTextForPrompt(context.selectedCrop.tempOptRangeC, targetLang),
      rainOptRangeMm: localizeContextTextForPrompt(context.selectedCrop.rainOptRangeMm, targetLang),
      phOptRange: context.selectedCrop.phOptRange
        ? localizeContextTextForPrompt(context.selectedCrop.phOptRange, targetLang)
        : null,
      cycleDaysRange: context.selectedCrop.cycleDaysRange
        ? localizeContextTextForPrompt(context.selectedCrop.cycleDaysRange, targetLang)
        : null,
    };
    lines.push(copy.selectedCropLine(localizedCrop));
  } else {
    lines.push(copy.selectedCropMissing);
  }

  if (context.cropEvaluation) {
    const ev = context.cropEvaluation;
    lines.push(
      copy.evaluationLine({
        ...ev,
        summary: localizeContextTextForPrompt(ev.summary, targetLang),
      })
    );
    if (ev.checks.length > 0) {
      const checkDetails = ev.checks
        .map((ck) =>
          copy.evaluationCheck(
            localizeContextTextForPrompt(ck.label, targetLang),
            localizeContextTextForPrompt(ck.observed, targetLang),
            localizeContextTextForPrompt(ck.expected, targetLang),
            ck.status
          )
        )
        .join('; ');
      lines.push(copy.evaluationDetails(checkDetails));
    }
  }

  if (context.rotationPlan && context.rotationPlan.cycles.length > 0) {
    const cyclesText = context.rotationPlan.cycles
      .map((cy) => {
        const localCropName = localizeCropNameForPrompt(cy.cropName, targetLang);
        return copy.rotationCycle(
          cy.cycleNumber,
          localCropName,
          cy.scientificName,
          cy.family ?? localCropName,
          cy.compatibilityScore
        );
      })
      .join(' | ');
    lines.push(copy.rotationLine(cyclesText));
    if (context.rotationPlan.alerts.length > 0) {
      const alertsText = context.rotationPlan.alerts
        .map(
          (a) =>
            `[${a.severity}] ${localizeContextTextForPrompt(a.title, targetLang)}: ${localizeContextTextForPrompt(a.message, targetLang)}`
        )
        .join(' | ');
      lines.push(copy.alertsLine(alertsText));
    }
  }

  if (context.comparedEvaluations && context.comparedEvaluations.length > 0) {
    const comparedText = context.comparedEvaluations
      .map((ce) =>
        copy.comparedItem({
          ...ce,
          commonName: localizeCropNameForPrompt(ce.commonName, targetLang),
          summary: localizeContextTextForPrompt(ce.summary, targetLang),
          tempOptRangeC: localizeContextTextForPrompt(ce.tempOptRangeC, targetLang),
          rainOptRangeMm: localizeContextTextForPrompt(ce.rainOptRangeMm, targetLang),
        })
      )
      .join(' || ');
    lines.push(copy.comparedLine(comparedText));
  }

  if (context.topSuitableCrops && context.topSuitableCrops.length > 0) {
    const topText = context.topSuitableCrops
      .map((sc, idx) =>
        copy.topSuitableItem(idx, {
          ...sc,
          commonName: localizeCropNameForPrompt(sc.commonName, targetLang),
          tempOptRangeC: localizeContextTextForPrompt(sc.tempOptRangeC, targetLang),
          rainOptRangeMm: localizeContextTextForPrompt(sc.rainOptRangeMm, targetLang),
        })
      )
      .join(' | ');
    lines.push(copy.topSuitableLine(topText));
  }

  const local = context.localContext;
  if (local) {
    if (local.soilObservations.length > 0) {
      const obsLabels = local.soilObservations.map(
        (o) => SOIL_OBSERVATION_LABELS[targetLang][o] ?? o
      );
      lines.push(copy.soilLine(obsLabels.join(', ')));
    }
    if (local.priorities.length > 0) {
      const prioLabels = local.priorities.map(
        (p) => FARMER_PRIORITY_LABELS[targetLang][p] ?? p
      );
      lines.push(copy.prioritiesLine(prioLabels.join(', ')));
    }
    if (local.customNotes?.trim()) {
      lines.push(copy.notesLine(local.customNotes.trim()));
    }
  }

  return lines.join('\n');
}

export function buildGeminiContents(
  rawMessages: AgronomistChatMessageDto[],
  targetLang: SupportedAgronomistLanguage = 'es'
): Content[] {
  const recent = rawMessages.slice(-MAX_HISTORY_MESSAGES);

  // Determine which message indices keep inline image bytes to avoid blowing free-tier TPM quotas.
  const imageIndices: number[] = [];
  recent.forEach((msg, index) => {
    if (msg.role === 'user' && msg.image) {
      imageIndices.push(index);
    }
  });
  const keepImagesFrom = new Set(imageIndices.slice(-MAX_IMAGES_IN_HISTORY));

  const contents: Content[] = [];
  for (let i = 0; i < recent.length; i++) {
    const msg = recent[i];
    if (msg.role !== 'user' && msg.role !== 'model') {
      continue;
    }

    const parts: Part[] = [];
    const trimmedText = (msg.text ?? '').trim();

    if (msg.role === 'user' && msg.image) {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(msg.image.mimeType)) {
        throw new AgronomistHttpError(
          400,
          'Formato de imagen no compatible. Usa JPEG, PNG o WebP.',
        );
      }
      if (!msg.image.dataBase64 || msg.image.dataBase64.length > MAX_BASE64_LENGTH) {
        throw new AgronomistHttpError(
          413,
          'La imagen adjunta excede el tamaño máximo permitido (4 MB).',
        );
      }

      if (keepImagesFrom.has(i)) {
        parts.push({
          inlineData: {
            mimeType: msg.image.mimeType,
            data: msg.image.dataBase64,
          },
        });
      } else {
        parts.push({
          text:
            targetLang === 'en'
              ? `[Previously attached image: ${msg.image.name}]`
              : `[Imagen previa adjuntada: ${msg.image.name}]`,
        });
      }
    }

    if (trimmedText) {
      parts.push({ text: trimmedText });
    } else if (msg.role === 'user' && msg.image) {
      parts.push({
        text:
          targetLang === 'en'
            ? 'Analyze this agricultural image from an agronomic perspective and consider my parcel context.'
            : 'Analiza esta imagen agrícola desde el punto de vista agronómico y considera el contexto de mi parcela.',
      });
    }

    if (parts.length === 0) {
      continue;
    }

    // Gemini expects conversations to start with a 'user' turn.
    if (contents.length === 0 && msg.role === 'model') {
      continue;
    }

    // Merge consecutive messages of the same role to satisfy strict turn alternation.
    const previous = contents[contents.length - 1];
    if (previous && previous.role === msg.role) {
      previous.parts = [...(previous.parts ?? []), ...parts];
    } else {
      contents.push({
        role: msg.role,
        parts,
      });
    }
  }

  if (contents.length === 0 || !contents.some((c) => c.role === 'user')) {
    throw new AgronomistHttpError(
      400,
      'Escribe una consulta o adjunta una imagen para conversar con la Superinteligencia Agrónoma.',
    );
  }

  return contents;
}

function appendFinalTurnLanguageDirective(
  contents: Content[],
  targetLang: DetectedConversationLanguage
): Content[] {
  if ((targetLang !== 'en' && targetLang !== 'es') || contents.length === 0) {
    return contents;
  }
  const cloned: Content[] = contents.map((item) => ({
    ...item,
    parts: [...(item.parts ?? [])],
  }));
  const last = cloned[cloned.length - 1];
  if (last && last.role === 'user') {
    const directive =
      targetLang === 'en'
        ? '[LANGUAGE DIRECTIVE: The user wrote this message in ENGLISH. You MUST respond 100% in English, translating any Spanish crop names or context terms into English.]'
        : '[DIRECTIVA DE IDIOMA: El usuario escribió este mensaje en ESPAÑOL. DEBES responder 100% en español, traduciendo cualquier término en inglés al español.]';
    last.parts = [...(last.parts ?? []), { text: directive }];
  }
  return cloned;
}

export async function generateAgronomistReply(
  payload: AgronomistChatRequest
): Promise<AgronomistChatResponse> {
  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    throw new AgronomistHttpError(400, 'La solicitud debe incluir al menos un mensaje.');
  }

  const effectiveKey = resolveServerGeminiApiKey();

  if (!effectiveKey) {
    throw new AgronomistHttpError(
      400,
      'El servicio de Superinteligencia Agrónoma no tiene configurada la variable GEMINI_API_KEY en el servidor.'
    );
  }

  const targetLang = detectConversationLanguage(payload.messages);
  const contentLang: SupportedAgronomistLanguage = targetLang === 'en' ? 'en' : 'es';
  const baseContents = buildGeminiContents(payload.messages, contentLang);
  const contents = appendFinalTurnLanguageDirective(baseContents, targetLang);
  const systemInstruction = buildAgronomistSystemPrompt(payload.context, targetLang);
  const primaryModel = resolvePrimaryModel();

  const ai = new GoogleGenAI({ apiKey: effectiveKey });

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents,
      config: {
        httpOptions: { timeout: 25000 },
        systemInstruction,
        temperature: 0.45,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 512 },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('EMPTY_MODEL_RESPONSE');
    }

    return {
      reply: text,
      model: primaryModel,
      usedFallback: false,
    };
  } catch (error) {
    if (error instanceof AgronomistHttpError) {
      throw error;
    }

    if (shouldRetryWithFallbackModel(error, primaryModel)) {
      const fallbackCandidates = [FALLBACK_FREE_TIER_MODEL, 'gemini-3.1-flash-lite'].filter(
        (m, idx, arr) => m !== primaryModel && arr.indexOf(m) === idx
      );
      let lastFallbackError: unknown = error;
      for (const fallbackModel of fallbackCandidates) {
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: fallbackModel,
            contents,
            config: {
              httpOptions: { timeout: 25000 },
              systemInstruction,
              temperature: 0.45,
              maxOutputTokens: 4096,
            },
          });

          const fallbackText = fallbackResponse.text?.trim();
          if (fallbackText) {
            return {
              reply: fallbackText,
              model: fallbackModel,
              usedFallback: true,
            };
          }
        } catch (fallbackError) {
          lastFallbackError = fallbackError;
        }
      }
      throw mapGeminiError(lastFallbackError, contentLang);
    }

    throw mapGeminiError(error, contentLang);
  }
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? '');
}

function shouldRetryWithFallbackModel(error: unknown, primaryModel: string): boolean {
  if (primaryModel === FALLBACK_FREE_TIER_MODEL) {
    return false;
  }
  const status = getErrorStatus(error);
  const msg = getErrorMessage(error).toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    status === 404 ||
    msg.includes('resource_exhausted') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable') ||
    msg.includes('timeout') ||
    msg.includes('aborted') ||
    msg.includes('empty_model_response')
  );
}

function mapGeminiError(
  error: unknown,
  lang: SupportedAgronomistLanguage = 'es'
): AgronomistHttpError {
  if (error instanceof AgronomistHttpError) {
    return error;
  }

  const status = getErrorStatus(error);
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();
  const isEn = lang === 'en';

  if (
    status === 401 ||
    status === 403 ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied')
  ) {
    return new AgronomistHttpError(
      401,
      isEn
        ? 'The Google Gemini API key is invalid or revoked. Please check your key in Google AI Studio (aistudio.google.com/apikey).'
        : 'La API key de Google Gemini no es válida o fue revocada. Verifica tu clave gratuita en Google AI Studio (aistudio.google.com/apikey).'
    );
  }

  if (status === 429 || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return new AgronomistHttpError(
      429,
      isEn
        ? 'The Google Gemini free-tier request limit (RPM/RPD) was temporarily reached. Please wait a few seconds and try again.'
        : 'Se alcanzó temporalmente el límite de solicitudes de la capa gratuita de Google Gemini (RPM/RPD). Espera unos segundos e inténtalo de nuevo.'
    );
  }

  if (status === 400) {
    return new AgronomistHttpError(
      400,
      isEn
        ? 'The request could not be processed. Please check the image format or shorten your message.'
        : 'La solicitud no pudo ser procesada por Gemini. Revisa el formato de la imagen o reduce el texto enviado.'
    );
  }

  if (status === 503 || status === 500) {
    return new AgronomistHttpError(
      503,
      isEn
        ? 'The Agronomic Superintelligence service is temporarily busy. Please try again in a few seconds.'
        : 'El servicio de Google Gemini está temporalmente saturado. Intenta nuevamente en unos segundos.'
    );
  }

  return new AgronomistHttpError(
    502,
    isEn
      ? 'Could not connect to the Agronomic Superintelligence right now. Please check your connection and try again.'
      : 'No se pudo conectar con la Superinteligencia Agrónoma en este momento. Verifica tu conexión e inténtalo nuevamente.'
  );
}
