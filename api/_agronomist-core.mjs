import { GoogleGenAI } from '@google/genai';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEFAULT_FREE_TIER_MODEL = 'gemini-3.6-flash';
export const FALLBACK_FREE_TIER_MODEL = 'gemini-3.5-flash-lite';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BASE64_LENGTH = 6_000_000;
const MAX_HISTORY_MESSAGES = 16;
const MAX_IMAGES_IN_HISTORY = 2;

const SOIL_OBSERVATION_LABELS = {
  compacted: 'Suelo compactado',
  sandy: 'Suelo arenoso',
  'low-retention': 'Baja retención de humedad',
  'erosion-prone': 'Propenso a erosión',
  saline: 'Riesgo de salinidad',
  healthy: 'Suelo con buena estructura/salud',
};

const FARMER_PRIORITY_LABELS = {
  'water-conservation': 'Conservación de agua',
  'soil-regeneration': 'Regeneración del suelo',
  'heat-resilience': 'Resiliencia frente a olas de calor',
  'nitrogen-recovery': 'Recuperación de nitrógeno',
  'yield-stability': 'Estabilidad de rendimiento',
};

export class AgronomistHttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AgronomistHttpError';
  }
}

export function loadLocalEnvIfNeeded(cwd = process.cwd()) {
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

export function resolveServerGeminiApiKey() {
  loadLocalEnvIfNeeded();
  return (
    process.env['GEMINI_API_KEY'] ||
    process.env['GOOGLE_API_KEY'] ||
    process.env['NG_APP_GEMINI_API_KEY'] ||
    ''
  ).trim();
}

export function resolvePrimaryModel() {
  loadLocalEnvIfNeeded();
  return process.env['GEMINI_MODEL']?.trim() || DEFAULT_FREE_TIER_MODEL;
}

export function getAgronomistStatus() {
  const serverKey = resolveServerGeminiApiKey();
  return {
    configured: serverKey.length > 0,
    defaultModel: resolvePrimaryModel(),
    fallbackModel: FALLBACK_FREE_TIER_MODEL,
  };
}

export function buildAgronomistSystemPrompt(context) {
  const baseInstructions = [
    'Eres AgroNasa Superinteligencia, una Superinteligencia agronómica especialista en agricultura climáticamente inteligente, rotación de cultivos, manejo de agua, salud del suelo y manejo integrado de plagas (MIP).',
    'Estás integrada en la plataforma AgroNasa (geocodificación Nominatim, datos satelitales NASA POWER, pronóstico meteorológico Open-Meteo y catálogo agronómico FAO EcoCrop).',
    '',
    'Reglas de respuesta:',
    '1. Identidad: eres AgroNasa Superinteligencia, una Superinteligencia agronómica. Nunca digas que eres una IA ni una inteligencia artificial; si el usuario pregunta qué o quién eres, preséntate siempre como una Superinteligencia agronómica.',
    '2. Responde siempre en español claro, empático y práctico (a menos que el usuario escriba explícitamente en otro idioma).',
    '3. Fundamenta tus recomendaciones en los datos reales del contexto de la parcela cuando existan, citando valores exactos (temperatura, lluvia anualizada, ET0, balance hídrico, altitud, puntaje EcoCrop).',
    '4. Si el sistema consultó automáticamente los servicios de AgroNasa a partir del mensaje del usuario (lugar geocodificado o semilla buscada en FAO EcoCrop), confirma al inicio que ya cargaste esos datos en vivo y úsalos para dar un veredicto agronómico completo. Si se evaluaron varias semillas comparadas o se listan las mejores semillas aptas para la región, compáralas claramente con sus puntajes EcoCrop.',
    '5. Nunca inventes métricas de laboratorio, pH medido o datos satelitales que no estén en el contexto. Si falta información (por ejemplo, si el usuario no ha fijado parcela en el mapa o no ha elegido cultivo), indícalo claramente y guía al usuario o haz preguntas cortas útiles.',
    '6. Cuando el usuario adjunte una imagen (hoja, planta, plaga, fruto o suelo), realiza una observación visual agronómica cuidadosa: describe síntomas o rasgos visibles, plantea 2 o 3 hipótesis ordenadas por probabilidad aclarando que no reemplazan análisis de laboratorio, y entrega acciones concretas de manejo integrado considerando el clima actual de la parcela.',
    '7. Organiza tus respuestas con encabezados cortos, listas con viñetas y negritas en los puntos accionables para facilitar la lectura en campo.',
    '8. Incluye una nota breve de precaución cuando recomiendes fertilizantes, enmiendas o control fitosanitario (verificar dosis según análisis de suelo y etiqueta local).',
    '9. Si el usuario menciona en su consulta una ciudad, región, departamento o país y/o una semilla o cultivo, incluye siempre al final de tu respuesta en una línea separada la etiqueta exacta: [[AGRONASA_DETECTED: lugar="Nombre del lugar" | semilla="Nombre del cultivo"]] (deja comillas vacías "" si alguno no fue mencionado).',
  ].join('\n');

  const contextSection = formatParcelContextForPrompt(context);
  return `${baseInstructions}\n\n=== CONTEXTO ACTUAL DE LA PARCELA EN AGRONASA ===\n${contextSection}`;
}

export function formatParcelContextForPrompt(context) {
  if (!context) {
    return 'Sin datos de parcela ni cultivo cargados todavía. El usuario aún puede hacer consultas agronómicas generales o subir fotos.';
  }

  const lines = [];

  if (context.autoResolvedFromPrompt) {
    const ar = context.autoResolvedFromPrompt;
    const resolvedParts = [];
    if (ar.locationResolved) {
      resolvedParts.push(`Ubicación geocodificada desde el mensaje: "${ar.locationResolved}"`);
    }
    if (ar.cropResolved) {
      resolvedParts.push(`Semilla principal encontrada en FAO EcoCrop: ${ar.cropResolved}`);
    }
    if (ar.comparedCrops?.length > 0) {
      resolvedParts.push(`Semillas comparadas desde el mensaje: ${ar.comparedCrops.join(', ')}`);
    }
    if (resolvedParts.length > 0) {
      lines.push(`[BÚSQUEDA AUTOMÁTICA EN TIEMPO REAL] ${resolvedParts.join(' | ')}.`);
    }
  }

  if (context.coordinates) {
    const locLabel = context.locationName ? `${context.locationName} ` : '';
    lines.push(
      `Ubicación: ${locLabel}(Lat ${context.coordinates.lat}, Lon ${context.coordinates.lon})`
    );
  } else {
    lines.push('Ubicación: No seleccionada en el mapa todavía.');
  }

  const climate = context.historicalClimate;
  if (climate && (climate.meanTempC !== undefined || climate.annualizedPrecipitationMm !== undefined)) {
    const parts = [];
    if (climate.meanTempC !== undefined) parts.push(`Temp media ${climate.meanTempC} °C`);
    if (climate.minTempC !== undefined && climate.maxTempC !== undefined) {
      parts.push(`Rango térmico ${climate.minTempC} a ${climate.maxTempC} °C`);
    }
    if (climate.annualizedPrecipitationMm !== undefined) {
      parts.push(`Lluvia anualizada ${climate.annualizedPrecipitationMm} mm/año`);
    }
    if (climate.totalPrecipitationMm !== undefined) {
      parts.push(
        `Lluvia acumulada período ${climate.totalPrecipitationMm} mm (${climate.analyzedDays ?? '?'} días)`
      );
    }
    if (climate.elevationM !== undefined) parts.push(`Altitud NASA DEM ${climate.elevationM} m s.n.m.`);
    if (climate.solarRadiationMjM2Day !== undefined) {
      parts.push(`Radiación solar media ${climate.solarRadiationMjM2Day} MJ/m²/día`);
    }
    if (climate.relativeHumidityPct !== undefined) {
      parts.push(`Humedad relativa media ${climate.relativeHumidityPct}%`);
    }
    if (climate.heatwaveRisk) parts.push(`Riesgo de ola de calor: ${climate.heatwaveRisk}`);
    lines.push(`Clima histórico NASA POWER: ${parts.join(' | ')}.`);
  } else {
    lines.push('Clima histórico NASA POWER: Aún no disponible.');
  }

  const weather = context.weatherSummary;
  if (weather) {
    lines.push(
      `Pronóstico Open-Meteo (próximos 7 días de ${weather.forecastDaysCount} disponibles): ` +
        `Temp actual ${weather.currentTempC} °C, HR ${weather.humidityPct}%, viento ${weather.windSpeedKmh} km/h | ` +
        `Rango 7d ${weather.minTemp7dC}–${weather.maxTemp7dC} °C | ` +
        `Lluvia esperada 7d: ${weather.precipitation7dMm} mm | ET0 7d: ${weather.et07dMm} mm | ` +
        `Balance hídrico 7d (Lluvia - ET0): ${weather.waterBalance7dMm} mm.`
    );
  }

  if (context.selectedCrop) {
    const c = context.selectedCrop;
    lines.push(
      `Cultivo seleccionado (FAO EcoCrop): ${c.commonName} (${c.scientificName}), ` +
        `Familia: ${c.family ?? 'No especificada'}, Categoría: ${c.category}. ` +
        `Óptimos EcoCrop: Temp ${c.tempOptRangeC}, Lluvia ${c.rainOptRangeMm}` +
        (c.phOptRange ? `, pH ${c.phOptRange}` : '') +
        (c.cycleDaysRange ? `, Ciclo ${c.cycleDaysRange}` : '') +
        '.'
    );
  } else {
    lines.push('Cultivo seleccionado: Ninguno todavía.');
  }

  if (context.cropEvaluation) {
    const ev = context.cropEvaluation;
    lines.push(
      `Evaluación de aptitud EcoCrop: ${ev.overallScore}% (${ev.isViable ? 'Viable' : 'No recomendado'}). ${ev.summary}`
    );
    if (ev.checks?.length > 0) {
      const checkDetails = ev.checks
        .map((ck) => `${ck.label}: observado ${ck.observed} vs esperado ${ck.expected} [${ck.status}]`)
        .join('; ');
      lines.push(`Detalle de parámetros: ${checkDetails}.`);
    }
  }

  if (context.rotationPlan && context.rotationPlan.cycles?.length > 0) {
    const cyclesText = context.rotationPlan.cycles
      .map(
        (cy) =>
          `Ciclo ${cy.cycleNumber}: ${cy.cropName} (${cy.scientificName}, ${cy.family ?? cy.cropName}) — ${cy.compatibilityScore}% aptitud`
      )
      .join(' | ');
    lines.push(`Plan de rotación sugerido (3 ciclos): ${cyclesText}.`);
    if (context.rotationPlan.alerts?.length > 0) {
      const alertsText = context.rotationPlan.alerts
        .map((a) => `[${a.severity}] ${a.title}: ${a.message}`)
        .join(' | ');
      lines.push(`Alertas activas: ${alertsText}`);
    }
  }

  if (context.comparedEvaluations?.length > 0) {
    const comparedText = context.comparedEvaluations
      .map(
        (ce) =>
          `${ce.commonName} (${ce.scientificName}): ${ce.overallScore}% (${ce.isViable ? 'Viable' : 'No recomendado'}, Temp ópt ${ce.tempOptRangeC}, Lluvia ópt ${ce.rainOptRangeMm}) — ${ce.summary}`
      )
      .join(' || ');
    lines.push(`Comparativa de semillas mencionadas en la consulta: ${comparedText}`);
  }

  if (context.topSuitableCrops?.length > 0) {
    const topText = context.topSuitableCrops
      .map(
        (sc, idx) =>
          `#${idx + 1} ${sc.commonName} (${sc.scientificName}, ${sc.family ?? sc.category}): ${sc.suitabilityScore}% aptitud (Temp ópt ${sc.tempOptRangeC}, Lluvia ópt ${sc.rainOptRangeMm})`
      )
      .join(' | ');
    lines.push(`Ranking FAO EcoCrop de semillas más aptas para el clima de esta ubicación: ${topText}.`);
  }

  const local = context.localContext;
  if (local) {
    if (local.soilObservations?.length > 0) {
      const obsLabels = local.soilObservations.map((o) => SOIL_OBSERVATION_LABELS[o] ?? o);
      lines.push(`Observaciones locales de suelo reportadas por el agricultor: ${obsLabels.join(', ')}.`);
    }
    if (local.priorities?.length > 0) {
      const prioLabels = local.priorities.map((p) => FARMER_PRIORITY_LABELS[p] ?? p);
      lines.push(`Prioridades del agricultor: ${prioLabels.join(', ')}.`);
    }
    if (local.customNotes?.trim()) {
      lines.push(`Notas adicionales de campo del agricultor: "${local.customNotes.trim()}"`);
    }
  }

  return lines.join('\n');
}

export function buildGeminiContents(rawMessages) {
  const recent = rawMessages.slice(-MAX_HISTORY_MESSAGES);

  const imageIndices = [];
  recent.forEach((msg, index) => {
    if (msg.role === 'user' && msg.image) {
      imageIndices.push(index);
    }
  });
  const keepImagesFrom = new Set(imageIndices.slice(-MAX_IMAGES_IN_HISTORY));

  const contents = [];
  for (let i = 0; i < recent.length; i++) {
    const msg = recent[i];
    if (msg.role !== 'user' && msg.role !== 'model') {
      continue;
    }

    const parts = [];
    const trimmedText = (msg.text ?? '').trim();

    if (msg.role === 'user' && msg.image) {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(msg.image.mimeType)) {
        throw new AgronomistHttpError(
          400,
          'Formato de imagen no compatible. Usa JPEG, PNG o WebP.'
        );
      }
      if (!msg.image.dataBase64 || msg.image.dataBase64.length > MAX_BASE64_LENGTH) {
        throw new AgronomistHttpError(
          413,
          'La imagen adjunta excede el tamaño máximo permitido (4 MB).'
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
          text: `[Imagen previa adjuntada: ${msg.image.name}]`,
        });
      }
    }

    if (trimmedText) {
      parts.push({ text: trimmedText });
    } else if (msg.role === 'user' && msg.image) {
      parts.push({
        text: 'Analiza esta imagen agrícola desde el punto de vista agronómico y considera el contexto de mi parcela.',
      });
    }

    if (parts.length === 0) {
      continue;
    }

    if (contents.length === 0 && msg.role === 'model') {
      continue;
    }

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
      'Escribe una consulta o adjunta una imagen para conversar con la Superinteligencia Agrónoma.'
    );
  }

  return contents;
}

export async function generateAgronomistReply(payload, clientApiKey) {
  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    throw new AgronomistHttpError(400, 'La solicitud debe incluir al menos un mensaje.');
  }

  const serverKey = resolveServerGeminiApiKey();
  const effectiveKey = serverKey || (clientApiKey ?? '').trim();

  if (!effectiveKey) {
    throw new AgronomistHttpError(
      400,
      'Falta configurar la API key gratuita de Google Gemini (GEMINI_API_KEY en Vercel o desde la configuración de la Superinteligencia).'
    );
  }

  const contents = buildGeminiContents(payload.messages);
  const systemInstruction = buildAgronomistSystemPrompt(payload.context);
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
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: FALLBACK_FREE_TIER_MODEL,
          contents,
          config: {
            systemInstruction,
            temperature: 0.45,
            maxOutputTokens: 4096,
          },
        });

        const fallbackText = fallbackResponse.text?.trim();
        if (fallbackText) {
          return {
            reply: fallbackText,
            model: FALLBACK_FREE_TIER_MODEL,
            usedFallback: true,
          };
        }
      } catch (fallbackError) {
        throw mapGeminiError(fallbackError);
      }
    }

    throw mapGeminiError(error);
  }
}

function getErrorStatus(error) {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = error.status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? '');
}

function shouldRetryWithFallbackModel(error, primaryModel) {
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

function mapGeminiError(error) {
  if (error instanceof AgronomistHttpError) {
    return error;
  }

  const status = getErrorStatus(error);
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (
    status === 401 ||
    status === 403 ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied')
  ) {
    return new AgronomistHttpError(
      401,
      'La API key de Google Gemini no es válida o fue revocada. Verifica tu clave gratuita en Google AI Studio (aistudio.google.com/apikey).'
    );
  }

  if (status === 429 || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return new AgronomistHttpError(
      429,
      'Se alcanzó temporalmente el límite de solicitudes de la capa gratuita de Google Gemini (RPM/RPD). Espera unos segundos e inténtalo de nuevo.'
    );
  }

  if (status === 400) {
    return new AgronomistHttpError(
      400,
      'La solicitud no pudo ser procesada por Gemini. Revisa el formato de la imagen o reduce el texto enviado.'
    );
  }

  if (status === 503 || status === 500) {
    return new AgronomistHttpError(
      503,
      'El servicio de Google Gemini está temporalmente saturado. Intenta nuevamente en unos segundos.'
    );
  }

  return new AgronomistHttpError(
    502,
    'No se pudo conectar con la Superinteligencia Agrónoma en este momento. Verifica tu conexión e inténtalo nuevamente.'
  );
}
