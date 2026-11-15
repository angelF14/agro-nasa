import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AgronomistParcelContext } from '@models/index';
import { buildAgronomistContext } from '@utils/agronomist-context.utils';
import { parseMarkdownBlocks } from '@utils/markdown-blocks.utils';
import { AgronomistAiService } from './agronomist-ai.service';

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
});
