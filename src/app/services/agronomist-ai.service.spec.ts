import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AgronomistParcelContext } from '@models/index';
import { buildAgronomistContext } from '@utils/agronomist-context.utils';
import { parseMarkdownBlocks } from '@utils/markdown-blocks.utils';
import { AgronomistAiService } from './agronomist-ai.service';
import { AgronomistQueryResolverService } from './agronomist-query-resolver.service';

describe('AgronomistAiService & Agronomist Utils', () => {
  let service: AgronomistAiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AgronomistAiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('toggles soil observations and farmer priorities', () => {
    expect(service.soilObservations()).toEqual([]);
    service.toggleSoilObservation('compacted');
    expect(service.soilObservations()).toEqual(['compacted']);
    service.toggleSoilObservation('compacted');
    expect(service.soilObservations()).toEqual([]);

    service.togglePriority('heat-resilience');
    expect(service.priorities()).toContain('heat-resilience');
  });

  it('sends a message to /api/agronomist/chat and appends the assistant reply', async () => {
    const context: AgronomistParcelContext = {
      coordinates: { lat: 14.5, lon: -87.2 },
      locationName: 'Comayagua, Honduras',
      localContext: {
        soilObservations: ['compacted'],
        priorities: ['water-conservation'],
      },
    };

    const sendPromise = service.sendMessage('¿Qué cultivo recomiendas?', context);

    const req = httpMock.expectOne('/api/agronomist/chat');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.context.locationName).toBe('Comayagua, Honduras');

    req.flush({
      reply: 'Recomiendo **frijol** (*Phaseolus vulgaris*) para fijar nitrógeno.',
      model: 'gemini-3.6-flash',
    });

    await sendPromise;

    const msgs = service.messages();
    expect(msgs.length).toBe(3); // welcome + user + model
    expect(msgs[1].role).toBe('user');
    expect(msgs[2].role).toBe('model');
    expect(msgs[2].text).toContain('Phaseolus vulgaris');
  });

  it('auto-resolves place and seed via AgronomistQueryResolverService and syncs DashboardStateBridge', async () => {
    const resolver = TestBed.inject(AgronomistQueryResolverService);
    let appliedLocation = '';

    service.registerDashboardBridge({
      getState: () => ({
        coordinates: null,
        locationName: '',
        climateSummary: null,
        weatherForecast: null,
        selectedCrop: null,
      }),
      applyState: (updated) => {
        appliedLocation = updated.locationName;
      },
    });

    spyOn(resolver, 'resolveFromMessage').and.resolveTo({
      context: {
        coordinates: { lat: 14.46, lon: -87.64 },
        locationName: 'Comayagua, Honduras',
        localContext: { soilObservations: [], priorities: [] },
        autoResolvedFromPrompt: {
          locationResolved: 'Comayagua, Honduras (14.46, -87.64)',
          cropResolved: 'maíz (Zea mays ssp. mays)',
        },
      },
      stateChanged: true,
      updatedState: {
        coordinates: { lat: 14.46, lon: -87.64 },
        locationName: 'Comayagua, Honduras',
        climateSummary: { meanTempC: 24.5, annualizedPrecipitationMm: 980 },
        weatherForecast: null,
        selectedCrop: null,
      },
      resolvedCard: {
        locationName: 'Comayagua, Honduras',
        coordinates: { lat: 14.46, lon: -87.64 },
        cropName: 'maíz',
        scientificName: 'Zea mays ssp. mays',
        overallScore: 92,
        isViable: true,
        meanTempC: 24.5,
        annualRainMm: 980,
      },
    });

    const sendPromise = service.sendMessage('Quiero sembrar maíz en Comayagua, Honduras', {
      localContext: { soilObservations: [], priorities: [] },
    });

    // Wait a microtask for resolveFromMessage promise to settle before HTTP post is issued
    await Promise.resolve();

    const req = httpMock.expectOne('/api/agronomist/chat');
    expect(req.request.body.context.autoResolvedFromPrompt.cropResolved).toContain('Zea mays');

    req.flush({
      reply: 'El **maíz** tiene 92% de aptitud en Comayagua.',
      model: 'gemini-3.6-flash',
    });

    await sendPromise;

    expect(appliedLocation).toBe('Comayagua, Honduras');
    const lastMsg = service.messages()[service.messages().length - 1];
    expect(lastMsg.resolvedCard?.overallScore).toBe(92);
    expect(lastMsg.resolvedCard?.cropName).toBe('maíz');
  });

  it('parses markdown headings, bold/italic runs, and lists safely', () => {
    const md = [
      '### Diagnóstico Rápido',
      'El balance es de **-12 mm** con *riesgo moderado*.',
      '- Aplicar cobertura vegetal',
      '- Ajustar riego por goteo',
    ].join('\n');

    const blocks = parseMarkdownBlocks(md);
    expect(blocks.length).toBe(3);
    expect(blocks[0].type).toBe('heading');
    expect(blocks[1].type).toBe('paragraph');
    expect(blocks[2].type).toBe('list');
  });

  it('builds a compact AgronomistParcelContext with 7-day water balance', () => {
    const ctx = buildAgronomistContext({
      coordinates: { lat: 20.1, lon: -101.2 },
      locationName: 'Guanajuato',
      climateSummary: { meanTempC: 19.4, annualizedPrecipitationMm: 680 },
      weatherForecast: {
        latitude: 20.1,
        longitude: -101.2,
        timezone: 'America/Mexico_City',
        current: {
          time: '2026-11-15T10:00',
          temperature: 22,
          apparentTemperature: 21,
          relativeHumidity: 55,
          precipitation: 0,
          windSpeed: 12,
          weatherCode: 1,
        },
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: `2026-11-${15 + i}`,
          weatherCode: 1,
          temperatureMax: 26,
          temperatureMin: 12,
          precipitationMm: 2,
          precipitationProbability: 30,
          et0Mm: 4,
        })),
        generatedAt: '2026-11-15T10:00:00Z',
      },
      selectedCrop: null,
      cropEvaluation: null,
      rotationPlan: null,
      soilObservations: ['sandy'],
      priorities: ['water-conservation'],
      customNotes: 'Lote norte',
    });

    expect(ctx.weatherSummary?.precipitation7dMm).toBe(14);
    expect(ctx.weatherSummary?.et07dMm).toBe(28);
    expect(ctx.weatherSummary?.waterBalance7dMm).toBe(-14);
    expect(ctx.localContext.customNotes).toBe('Lote norte');
  });

  it('keeps English language context when sending an image-only follow-up after an English turn', async () => {
    const context: AgronomistParcelContext = {
      localContext: {
        soilObservations: [],
        priorities: ['water-conservation'],
      },
    };

    const firstTurn = service.sendMessage('What crops grow best in Iowa?', context);
    const req1 = httpMock.expectOne('/api/agronomist/chat');
    req1.flush({ reply: 'In Iowa, corn and soybeans fit well.', model: 'gemini-3.6-flash' });
    await firstTurn;

    const imageTurn = service.sendMessage('', context, {
      name: 'leaf.jpg',
      mimeType: 'image/jpeg',
      dataBase64: 'AAAA',
      dataUrl: 'data:image/jpeg;base64,AAAA',
    });

    const req2 = httpMock.expectOne('/api/agronomist/chat');
    expect(req2.request.body.messages[req2.request.body.messages.length - 1].text).toBe(
      'Analyze this agricultural image considering my parcel context.'
    );
    req2.flush({ reply: 'The leaf shows signs of nitrogen deficiency.', model: 'gemini-3.6-flash' });
    await imageTurn;
  });

  it('ignores non-geographic language names like "Ingles" or "English" in resolveExplicitEntities', async () => {
    const resolver = TestBed.inject(AgronomistQueryResolverService);
    const emptyState = {
      coordinates: null,
      locationName: '',
      climateSummary: null,
      weatherForecast: null,
      selectedCrop: null,
      soilObservations: [],
      priorities: [],
      customNotes: '',
    };

    const resultPromise = resolver.resolveExplicitEntities('Ingles', undefined, emptyState, 'en');
    const catalogReq = httpMock.expectOne((req) => req.url.includes('crops.json'));
    catalogReq.flush([]);

    const resolved = await resultPromise;
    expect(resolved).toBeNull();
    expect(httpMock.match((req) => req.url.includes('nominatim')).length).toBe(0);
  });
});
