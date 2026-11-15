import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'en' | 'es';

const ENGLISH_TRANSLATIONS: Record<string, string> = {
  'Información satelital para planificar mejor tus cultivos.':
    'Satellite insights for smarter crop planning.',
  'Flujo de análisis agronómico': 'Agronomic analysis workflow',
  'Ver ubicación en el mapa': 'View location on map',
  'Parcela activa': 'Active plot',
  'Ver cultivo y rotación': 'View crop and rotation',
  completado: 'completed',
  'conversación activa': 'active conversation',
  Mapa: 'Map',
  'Mapa Regional (OSM)': 'Regional map (OSM)',
  'Vista Satelital (Esri)': 'Satellite view (Esri)',
  'Selección de Región o Parcela': 'Select a region or plot',
  'Mapa interactivo de selección de parcela': 'Interactive plot selection map',
  Cultivos: 'Crops',
  Recomendaciones: 'Recommendations',
  Superinteligencia: 'Superintelligence',
  'Paso 01 / Encuentra tu zona': 'Step 01 / Find your area',
  '¿Dónde quieres cultivar?': 'Where would you like to grow?',
  'Busca un lugar o haz clic sobre el mapa. Al fijar tu parcela te llevaremos a sus cultivos.':
    'Search for a place or click on the map. Once you set your plot, we’ll show its crops.',
  'Paso 02 / Explora cultivos': 'Step 02 / Explore crops',
  'Cultivos de tu zona': 'Crops in your area',
  'tu parcela': 'your plot',
  'Catálogo disponible para': 'Catalog available for',
  '. Selecciona uno para continuar.': '. Select one to continue.',
  'Aún no has seleccionado una ubicación.': 'You have not selected a location yet.',
  'Primero elige una ubicación': 'Choose a location first',
  'Selecciona un punto en el mapa para ver los cultivos disponibles.':
    'Select a point on the map to see available crops.',
  'Ir al mapa': 'Go to map',
  'Paso 03 / Planifica con información': 'Step 03 / Plan with data',
  'Información para tu cultivo': 'Information for your crop',
  'Parcela seleccionada': 'Selected plot',
  'Aún no has elegido un cultivo.': 'You have not chosen a crop yet.',
  'Ficha de cultivo': 'Crop profile',
  'Consultar Superinteligencia': 'Ask Superintelligence',
  'Cambiar cultivo': 'Change crop',
  'Vista de recomendaciones': 'Recommendation view',
  Pronóstico: 'Forecast',
  'Analizando datos de NASA POWER...': 'Analyzing NASA POWER data...',
  'Elige un cultivo': 'Choose a crop',
  'Selecciona o busca un cultivo para ver sus recomendaciones y el pronóstico de tu parcela.':
    'Select or search for a crop to see recommendations and your plot forecast.',
  'Ir a cultivos': 'Go to crops',
  'Necesitamos tu parcela para calcular las recomendaciones con datos de la NASA.':
    'We need your plot to calculate recommendations using NASA data.',
  'Paso 04 / Consultoría agronómica con Superinteligencia':
    'Step 04 / Agronomic consulting with Superintelligence',
  'Superinteligencia Agrónoma': 'Agronomic Superintelligence',
  'Conversa sobre aptitud climática, balance hídrico, manejo del suelo o sube una foto de tu cultivo con Gemini.':
    'Discuss climate suitability, water balance, soil management, or upload a crop photo with Gemini.',
  'Abrir Superinteligencia Agrónoma en panel lateral':
    'Open Agronomic Superintelligence in side panel',
  'Panel rápido de la Superinteligencia Agrónoma': 'Agronomic Superintelligence quick panel',
  '¿Confirmas esta ubicación?': 'Confirm this location?',
  No: 'No',
  Sí: 'Yes',
  'Datos climáticos:': 'Climate data:',
  'Datos de cultivos:': 'Crop data:',
  y: 'and',
  'Gemini Superinteligencia solo interpreta los datos de estas fuentes y ofrece recomendaciones; no genera datos meteorológicos ni de cultivos.':
    'Gemini Superintelligence only interprets data from these sources and provides recommendations; it does not generate weather or crop data.',
  'Cultivos recomendados': 'Recommended crops',
  'Catálogo de Cultivos FAO EcoCrop': 'FAO EcoCrop catalog',
  'Recomendaciones ordenadas por compatibilidad con el clima histórico de la parcela.':
    'Recommendations ranked by compatibility with the plot’s historical climate.',
  'Busca por nombre común, científico o familia botánica para evaluar compatibilidad climática y rotación.':
    'Search by common name, scientific name, or botanical family to assess climate suitability and rotation.',
  Todos: 'All',
  Recomendados: 'Recommended',
  Seleccionado: 'Selected',
  'Buscar cultivo por nombre o familia': 'Search crops by name or family',
  'Buscar cultivo (ej. frijol, Phaseolus, maíz, papa, arroz)...':
    'Search crops (e.g. beans, Phaseolus, corn, potato, rice)...',
  'Limpiar búsqueda de cultivos': 'Clear crop search',
  'Filtrar por categoría botánica': 'Filter by botanical category',
  'Todas las categorías': 'All categories',
  'Cereales y granos': 'Cereals and grains',
  'Leguminosas (Fijadoras N)': 'Legumes (nitrogen-fixing)',
  'Hortalizas y vegetales': 'Vegetables',
  'Raíces y tubérculos': 'Roots and tubers',
  'Frutas y nueces': 'Fruits and nuts',
  'Forraje y cobertura': 'Forage and cover crops',
  'Solo rangos óptimos de temperatura y precipitación':
    'Only optimal temperature and precipitation ranges',
  'Cargando catálogo de cultivos': 'Loading crop catalog',
  'Obteniendo datos climáticos para preparar las recomendaciones…':
    'Getting climate data to prepare recommendations…',
  'No hay datos de temperatura o precipitación disponibles para generar recomendaciones.':
    'No temperature or precipitation data is available to generate recommendations.',
  'No se encontraron cultivos compatibles con los datos climáticos de esta parcela.':
    'No crops were found that match this plot’s climate data.',
  'No se encontraron cultivos con ese criterio de búsqueda.':
    'No crops matched those search criteria.',
  'Restablecer filtros': 'Reset filters',
  'Lista de cultivos disponibles': 'Available crops',
  Compatibilidad: 'Suitability',
  compatible: 'compatible',
  'Rango térmico óptimo': 'Optimal temperature range',
  'Precipitación óptima': 'Optimal precipitation',
  'Duración del ciclo': 'Growing cycle duration',
  'Ver recomendaciones': 'View recommendations',
  'Paginación de cultivos': 'Crop pagination',
  'Página anterior': 'Previous page',
  Anterior: 'Previous',
  'Página siguiente': 'Next page',
  Siguiente: 'Next',
  'Busca un país, estado o ciudad, o haz clic directamente sobre el terreno en el mapa.':
    'Search for a country, state, or city, or click directly on the map.',
  'Buscar ubicación': 'Search location',
  'Ej. Sinaloa, México, Iowa, Bogotá...': 'E.g. Sinaloa, Mexico, Iowa, Bogotá...',
  'Buscando...': 'Searching...',
  Buscar: 'Search',
  'Usar mi ubicación actual': 'Use my current location',
  'Mi ubicación': 'My location',
  'Resultados de ubicación encontrados': 'Location search results',
  'Paginación de resultados de ubicación': 'Location results pagination',
  Ubicación: 'Location',
  Lat: 'Lat',
  Lon: 'Lon',
  'Sin coordenadas seleccionadas aún': 'No coordinates selected yet',
  'Compatibilidad Ecoclimática': 'Ecoclimatic suitability',
  'Diagnóstico de Aptitud —': 'Suitability assessment —',
  Óptimo: 'Optimal',
  Viable: 'Viable',
  'No recomendado': 'Not recommended',
  'NASA POWER:': 'NASA POWER:',
  'Requerido EcoCrop:': 'EcoCrop requirement:',
  'Alertas climáticas y de manejo': 'Climate and management alerts',
  'Alertas Climáticas y de Manejo': 'Climate and management alerts',
  'Plan de Rotación Recomendado (Ciclo 1 → Ciclo 2 → Ciclo 3)':
    'Recommended rotation plan (Cycle 1 → Cycle 2 → Cycle 3)',
  Ciclo: 'Cycle',
  aptitud: 'suitability',
  'Recomendación de Rotación y Aptitud': 'Rotation and suitability recommendation',
  'Selecciona primero un': 'First select a',
  'lugar en el mapa': 'location on the map',
  '(para obtener datos reales de NASA POWER)': '(to get real NASA POWER data)',
  'y un': 'and a',
  'cultivo del catálogo': 'crop from the catalog',
  'para generar el diagnóstico de aptitud y el plan de rotación de 3 ciclos.':
    'to generate the suitability assessment and 3-cycle rotation plan.',
  'Condiciones Meteorológicas de la Parcela': 'Plot weather conditions',
  'Lectura en tiempo real y proyección diaria de precipitación y evapotranspiración (ET₀)':
    'Current conditions and daily precipitation and evapotranspiration (ET₀) forecast',
  'Actualizando...': 'Updating...',
  Actualizar: 'Refresh',
  'Consultando pronóstico meteorológico': 'Loading weather forecast',
  'No fue posible obtener los datos meteorológicos de Open-Meteo.':
    'Could not retrieve weather data from Open-Meteo.',
  Reintentar: 'Retry',
  'Sensación térmica': 'Feels like',
  'Humedad relativa': 'Relative humidity',
  'Precipitación actual': 'Current precipitation',
  'Velocidad del viento': 'Wind speed',
  'Pronóstico Diario': 'Daily forecast',
  'Temperatura, lluvia esperada y demanda hídrica (ET₀)':
    'Temperature, expected rainfall, and water demand (ET₀)',
  'Filtrar días': 'Filter days',
  'Todos los días': 'All days',
  'Días lluviosos': 'Rainy days',
  'Horizonte de pronóstico': 'Forecast range',
  Hoy: 'Today',
  'Día anterior': 'Previous day',
  'Día siguiente': 'Next day',
  Día: 'Day',
  'Pronóstico extendido': 'Extended forecast',
  Mínima: 'Low',
  'Lluvia esperada': 'Expected rainfall',
  Probabilidad: 'Probability',
  'Demanda hídrica (ET₀)': 'Water demand (ET₀)',
  'Día y condición': 'Day and conditions',
  'Lluvia / Prob.': 'Rain / Prob.',
  'Rango térmico': 'Temperature range',
  'Días del pronóstico': 'Forecast days',
  'Calendario del pronóstico': 'Forecast calendar',
  'No hay días con lluvia significativa en el horizonte seleccionado.':
    'There are no days with significant rainfall in the selected forecast range.',
  'Balance hídrico estimado': 'Estimated water balance',
  'Precipitación acumulada − ET₀ de los próximos 7 días':
    'Accumulated precipitation − ET₀ over the next 7 days',
  'Los datos representan pronósticos meteorológicos y pueden variar conforme se actualizan los modelos. La incertidumbre aumenta conforme se amplía el horizonte de predicción.':
    'These are weather forecasts and may change as models are updated. Uncertainty increases with longer forecast ranges.',
  'Última consulta:': 'Last retrieved:',
  'Fuente:': 'Source:',
  'Gemini capa gratuita activo (.env)': 'Gemini free tier active (.env)',
  'API Key de sesión activa': 'Session API key active',
  'Falta API Key gratuita de Google': 'Google free API key required',
  Ocultar: 'Hide',
  Cambiar: 'Change',
  Configurar: 'Set up',
  'Usa una clave gratuita de': 'Use a free key from',
  en: 'in',
  'o pégala aquí para esta sesión.': 'or paste it here for this session.',
  'API Key gratuita de Google Gemini': 'Google Gemini free API key',
  Usar: 'Use',
  'Reverificar .env del servidor': 'Check server .env again',
  'Quitar key de sesión': 'Remove session key',
  'Contexto y suelo': 'Context and soil',
  'Contexto agronómico de la parcela': 'Plot agronomic context',
  'Contexto en vivo': 'Live context',
  'Datos enviados a la Superinteligencia': 'Data sent to Superintelligence',
  Parcela: 'Plot',
  'Ubicación seleccionada': 'Selected location',
  'Temp media': 'Avg. temp',
  'Lluvia anual': 'Annual rainfall',
  'Balance 7d': '7-day balance',
  'Cultivo y aptitud': 'Crop and suitability',
  'Con reservas': 'Caution',
  'Elegir cultivo para diagnóstico': 'Choose a crop for assessment',
  'Aún no fijas una parcela. Puedes preguntar dudas generales o elegir un punto en el mapa.':
    'You have not set a plot yet. Ask general questions or choose a point on the map.',
  'Observación local': 'Local observations',
  'Suelo y prioridades': 'Soil and priorities',
  'Estado del suelo': 'Soil condition',
  'Prioridades del ciclo': 'Cycle priorities',
  'Notas de campo (opcional)': 'Field notes (optional)',
  'Ej. Riego por goteo, cultivo anterior fue frijol...':
    'E.g. Drip irrigation, previous crop was beans...',
  'Conversación con la Superinteligencia Agrónoma': 'Chat with Agronomic Superintelligence',
  'Reiniciar conversación': 'Reset conversation',
  'Abrir vista completa': 'Open full view',
  'Abrir vista completa de la Superinteligencia': 'Open full Superintelligence view',
  'Cerrar panel': 'Close panel',
  'Cerrar panel de la Superinteligencia': 'Close Superintelligence panel',
  'Mensajes de la Superinteligencia': 'Superintelligence messages',
  'Sincronizado en la App · NASA POWER · FAO EcoCrop':
    'Synced in the app · NASA POWER · FAO EcoCrop',
  'Semilla activa:': 'Active crop:',
  'Parcela activa:': 'Active plot:',
  'Lluvia:': 'Rainfall:',
  'Rotación 3 ciclos:': '3-cycle rotation:',
  'Ver Ficha y Rotación (Paso 03)': 'View profile and rotation (Step 03)',
  'Ver en Mapa (01)': 'View on map (01)',
  'Ver Cultivo (02)': 'View crop (02)',
  respaldo: 'fallback',
  Copiado: 'Copied',
  Copiar: 'Copy',
  'La Superinteligencia está analizando': 'Superintelligence is analyzing',
  'Analizando datos de parcela y cultivo...': 'Analyzing plot and crop data...',
  'Analizando consulta...': 'Analyzing question...',
  'Generando recomendación con Superinteligencia Gemini...':
    'Generating a recommendation with Gemini Superintelligence...',
  'Suelta aquí la foto de tu cultivo o suelo para analizarla':
    'Drop a photo of your crop or soil here to analyze it',
  'Consultas rápidas sugeridas': 'Suggested quick questions',
  'Quitar imagen adjunta': 'Remove attached image',
  'Adjuntar foto de hoja, plaga o suelo': 'Attach a photo of a leaf, pest, or soil',
  'Adjuntar foto de cultivo o suelo': 'Attach a crop or soil photo',
  'Escribe tu consulta agronómica': 'Write your agronomic question',
  'Enviar consulta a la Superinteligencia Agrónoma': 'Send question to Agronomic Superintelligence',
  Enviar: 'Send',
  Compactado: 'Compacted',
  Arenoso: 'Sandy',
  'Baja retención': 'Low water retention',
  'Propenso a erosión': 'Prone to erosion',
  Salino: 'Saline',
  'Suelo sano': 'Healthy soil',
  'Conservar agua': 'Conserve water',
  'Regenerar suelo': 'Regenerate soil',
  'Resiliencia térmica': 'Heat resilience',
  'Recuperar nitrógeno': 'Restore nitrogen',
  'Estabilidad de rendimiento': 'Yield stability',
  'Sin parcela': 'No plot',
  'Falta API Key': 'API key required',
  'Consulta general (sin parcela fijada)': 'General question (no plot selected)',
  'Selecciona un archivo de imagen válido (JPG, PNG o WebP).':
    'Select a valid image file (JPG, PNG, or WebP).',
  'La imagen seleccionada supera 15 MB. Prueba con una foto más liviana.':
    'The selected image is larger than 15 MB. Try a smaller photo.',
  'No se pudo procesar la imagen en este navegador.':
    'The image could not be processed in this browser.',
  'No se pudo codificar la imagen para enviarla a la Superinteligencia.':
    'The image could not be encoded for Agronomic Superintelligence.',
  'No se pudo cargar la imagen.': 'The image could not be loaded.',
  'No se pudo inicializar Leaflet.': 'Leaflet could not be initialized.',
  'No se pudo contactar al servidor de AgroHelper para consultar a Gemini. Verifica que el servidor SSR esté activo.':
    'Could not reach the AgroHelper server to query Gemini. Check that the SSR server is running.',
  'Ocurrió un error al consultar a la Superinteligencia Agrónoma. Intenta de nuevo en unos segundos.':
    'An error occurred while querying Agronomic Superintelligence. Please try again in a few seconds.',
  'N/D': 'N/A',
  'Escribe un lugar y una semilla (ej. maíz en Comayagua), pregunta sobre riego o pega una foto...':
    'Enter a place and crop (e.g. corn in Comayagua), ask about irrigation, or attach a photo...',
  'Diagnostica posibles plagas, enfermedades o deficiencias nutricionales en esta foto considerando el clima de mi parcela.':
    'Diagnose possible pests, diseases, or nutrient deficiencies in this photo based on my plot’s climate.',
  'Analiza los riesgos principales para ': 'Analyze the main risks for ',
  ' con el pronóstico de 7 días y NASA POWER.': ' based on the 7-day forecast and NASA POWER.',
  '¿Qué acciones inmediatas de manejo integrado recomiendas según lo que se ve y el pronóstico de 7 días?':
    'What immediate integrated management actions do you recommend based on the photo and 7-day forecast?',
  '¿Podría ser estrés hídrico o térmico según los datos de NASA POWER?':
    'Could this be water or heat stress based on NASA POWER data?',
  '¿Cómo debo ajustar el riego y la cobertura del suelo con el balance hídrico actual?':
    'How should I adjust irrigation and soil cover based on the current water balance?',
  'Dame un calendario práctico de siembra, manejo y fertilización orgánica para este plan de rotación.':
    'Give me a practical planting, management, and organic fertilization calendar for this rotation plan.',
  '¿Por qué esta secuencia de 3 ciclos protege el nitrógeno y reduce plagas en mi parcela?':
    'Why does this 3-cycle sequence protect nitrogen and reduce pests on my plot?',
  '¿Qué semilla del catálogo FAO EcoCrop me recomiendas para esta parcela?':
    'Which crop from the FAO EcoCrop catalog do you recommend for this plot?',
  '¿Cómo le iría a la semilla de maíz o frijol en esta ubicación?':
    'How would corn or beans do at this location?',
  'Evalúa el riesgo térmico e hídrico de esta ubicación y cómo proteger el suelo.':
    'Assess heat and water risk at this location and how to protect the soil.',
  'Quiero sembrar maíz en Comayagua, Honduras, ¿me lo recomiendas?':
    'I want to grow corn in Comayagua, Honduras. Do you recommend it?',
  '¿Qué semilla me recomiendas sembrar en Sinaloa, México?':
    'What crop do you recommend planting in Sinaloa, Mexico?',
  'Evalúa la semilla de frijol en Boyacá, Colombia con NASA POWER':
    'Assess beans in Boyacá, Colombia using NASA POWER.',
  '¿Qué síntomas en hojas diferencian déficit de nitrógeno vs estrés hídrico?':
    'What leaf symptoms distinguish nitrogen deficiency from water stress?',
  'No se pudieron obtener los datos climáticos de NASA POWER para puntuar el cultivo.':
    'Could not retrieve NASA POWER climate data to score the crop.',
  'Haz clic en el mapa o busca un país, región o ciudad':
    'Click on the map or search for a country, region, or city',
  'No se pudo consultar el buscador de ubicaciones.': 'Could not search for locations.',
  'No se encontraron resultados para esa búsqueda.': 'No results found for that search.',
  'La geolocalización no está disponible en este navegador.':
    'Geolocation is not available in this browser.',
  'No se pudo obtener tu ubicación actual.': 'Could not get your current location.',
  'Región seleccionada': 'Selected region',
  Despejado: 'Clear',
  'Parcialmente nublado': 'Partly cloudy',
  'Nublado o neblina': 'Cloudy or foggy',
  Llovizna: 'Drizzle',
  Lluvia: 'Rain',
  Nieve: 'Snow',
  Chubascos: 'Showers',
  'Nieve intensa': 'Heavy snow',
  Tormenta: 'Thunderstorm',
  'Sin descripción': 'No description',
  'Sin lluvia': 'No rain',
  'Lluvia ligera': 'Light rain',
  'Lluvia moderada': 'Moderate rain',
  'Lluvia fuerte': 'Heavy rain',
  'La lluvia esperada': 'Expected rainfall',
  'supera la demanda hídrica': 'exceeds water demand',
  'Se recomienda suspender el riego programado.': 'Scheduled irrigation should be paused.',
  'La lluvia cubre parcialmente la demanda hídrica. Se recomienda un riego complementario de aprox.':
    'Rainfall partially meets water demand. Supplemental irrigation of approx.',
  'La lluvia esperada no cubre la demanda hídrica. Se recomienda regar aprox.':
    'Expected rainfall does not meet water demand. Irrigate approx.',
  'mm para compensar el ET₀.': 'mm to compensate for ET₀.',
};

const ENGLISH_PHRASES: Record<string, string> = {
  'Temperatura Media (T2M)': 'Mean Temperature (T2M)',
  'Precipitación Equivalente Anual': 'Annualized Precipitation',
  'Temperatura Mínima / Riesgo de Helada': 'Minimum Temperature / Frost Risk',
  'Temperatura Mínima Observada': 'Observed Minimum Temperature',
  'Altitud de la Parcela (NASA DEM)': 'Plot Elevation (NASA DEM)',
  'Duración del Ciclo (GMIN–GMAX)': 'Growing Cycle Duration (GMIN–GMAX)',
  'Óptimo ': 'Optimal ',
  ' (Abs: ': ' (absolute: ',
  ' días seleccionados': ' days selected',
  ' días requeridos': ' days required',
  ' m s.n.m.': ' m above sea level',
  'Sin restricción registrada en EcoCrop': 'No restriction recorded in EcoCrop',
  ' presenta condiciones óptimas': ' has optimal conditions',
  ' en esta ubicación según los registros de NASA POWER.':
    ' at this location according to NASA POWER records.',
  ' es viable con reservas': ' is viable with caution',
  ': revisa los parámetros en rango aceptable para ajustar riego o manejo.':
    ': review parameters in the acceptable range to adjust irrigation or management.',
  ' tiene baja compatibilidad': ' has low suitability',
  ' con las condiciones climáticas/altitudinales observadas; revisa el plan de rotación sugerido.':
    ' with the observed climate and elevation; review the suggested rotation plan.',
  'Cultivo base seleccionado por el agricultor': 'Base crop selected by the farmer',
  ' de aptitud climática NASA POWER': ' climate suitability according to NASA POWER',
  'Mejor ajuste climático directo para ': 'Best direct climate match for ',
  ' y ': ' and ',
  'Alternancia botánica (': 'Botanical rotation (',
  ') para cortar ciclos de plagas.': ') to interrupt pest cycles.',
  'Leguminosa fijadora de nitrógeno seleccionada para reponer fertilidad tras el Ciclo 1.':
    'Nitrogen-fixing legume selected to restore fertility after Cycle 1.',
  'Alta compatibilidad (': 'High suitability (',
  '%) con ': '%) with ',
  'Cierra la secuencia con familia distinta (': 'Complete the sequence with a different family (',
  ') aprovechando los nutrientes fijados.': ') to use the fixed nutrients.',
  'Puntaje de adaptación NASA POWER: ': 'NASA POWER suitability score: ',
  'Secuencia diversificada (': 'Diversified sequence (',
  ') diseñada para romper ciclos de patógenos, proteger la humedad del suelo y balancear la extracción de nitrógeno.':
    ') designed to break pathogen cycles, protect soil moisture, and balance nitrogen removal.',
  'Selecciona una ubicación y un cultivo para calcular el impacto en la salud del suelo.':
    'Select a location and crop to calculate the impact on soil health.',
  'Familia ': 'Family ',
  'Familia no especificada': 'Family not specified',
  'ciclo de ': 'growing cycle of ',
  ' días': ' days',
  'ciclo variable': 'variable-length cycle',
  ' — ': ' — ',
  'Incorporar rastrojo al final del ciclo para maximizar el aporte de nitrógeno al suelo.':
    'Incorporate crop residue at the end of the cycle to maximize nitrogen added to the soil.',
  'Evitar sembrar la misma familia botánica en el lote inmediatamente después de la cosecha.':
    'Avoid planting the same botanical family in the field immediately after harvest.',
  'La lluvia anualizada (': 'Annualized rainfall (',
  ' mm) está por debajo del óptimo (': ' mm) is below the optimal level (',
  ' mm): se recomienda cobertura (mulch) o riego complementario.':
    ' mm): ground cover (mulch) or supplemental irrigation is recommended.',
  'Precipitación elevada (': 'High precipitation (',
  ' mm/año): asegurar buen drenaje en camas o curvas a nivel.':
    ' mm/year): ensure good drainage in beds or contour rows.',
  'Riesgo Alto de Estrés Térmico': 'High Heat Stress Risk',
  'NASA POWER registra picos de hasta ': 'NASA POWER recorded peaks up to ',
  ' °C. Prioriza variedades tolerantes al calor y cobertura vegetal.':
    ' °C. Prioritize heat-tolerant varieties and plant cover.',
  'Picos Térmicos Moderados': 'Moderate Heat Peaks',
  'Se observaron temperaturas máximas de ': 'Maximum temperatures of ',
  ' °C en el período analizado.': ' °C were observed during the analysis period.',
  'BajaDisponibilidad Hídrica Anualizada': 'Low Annualized Water Availability',
  'La precipitación anualizada es de ': 'Annualized precipitation is ',
  ' mm/año. Prioriza cultivos de baja demanda hídrica y abonos verdes de cobertura.':
    ' mm/year. Prioritize low-water-demand crops and cover-crop green manure.',
  'Riesgo de Helada / Temperatura Letal': 'Frost / Lethal Temperature Risk',
  'La mínima registrada (': 'The recorded minimum (',
  ' °C) alcanza el umbral letal de ': ' °C) reaches the lethal threshold for ',
  ' (umbral letal)': ' (lethal threshold)',
  ' ≥ ': ' ≥ ',
  ' ≤ ': ' ≤ ',
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly language = signal<AppLanguage>('en');

  constructor() {
    if (typeof window !== 'undefined') {
      const savedLanguage = window.localStorage.getItem('agro-nasa-language');
      if (savedLanguage === 'en' || savedLanguage === 'es') {
        this.language.set(savedLanguage);
      }
      this.updateDocumentLanguage();
    }
  }

  toggle(): void {
    this.setLanguage(this.language() === 'en' ? 'es' : 'en');
  }

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agro-nasa-language', language);
      this.updateDocumentLanguage();
    }
  }

  t(source: string): string {
    if (this.language() !== 'en') {
      return source;
    }

    const exactTranslation = ENGLISH_TRANSLATIONS[source];
    if (exactTranslation) {
      return exactTranslation;
    }

    return Object.entries(ENGLISH_PHRASES).reduce(
      (translated, [spanish, english]) => translated.split(spanish).join(english),
      source,
    );
  }

  private updateDocumentLanguage(): void {
    document.documentElement.lang = this.language();
    document.title =
      this.language() === 'en'
        ? 'AgroHelper — Climate Analysis and Crop Rotation'
        : 'AgroHelper — Diagnóstico Climático y Rotación de Cultivos';
  }
}
