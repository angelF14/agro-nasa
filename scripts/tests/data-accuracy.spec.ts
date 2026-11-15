import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Coordinates, Crop, FarmLocalContext } from '@models/index';
import { firstValueFrom } from 'rxjs';
import cropCatalog from '../../public/data/crops.json';
import { FarmAggregatorService } from '../../src/app/services/farm-aggregator.service';
import { NasaPowerRawResponse } from '../../src/app/services/nasa-power.service';
import { RotationEngineService } from '../../src/app/services/rotation-engine.service';

const AUDIT_CROP_IDS = new Set(['1668', '1971', '238663']);
const AUDIT_CROPS = (cropCatalog as Crop[]).filter((crop) => AUDIT_CROP_IDS.has(crop.id));

describe('data accuracy report', () => {
  let aggregator: FarmAggregatorService;
  let rotationEngine: RotationEngineService;
  let httpTestingController: HttpTestingController;

  const coordinates: Coordinates = { lat: 14.3167, lon: -88.1833 };
  const localContext: FarmLocalContext = {
    soilObservations: [],
    priorities: [],
  };
  const nasaResponse: NasaPowerRawResponse = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-88.1833, 14.3167, 1550] },
    properties: {
      parameter: {
        PRECTOTCORR: { day1: 2, day2: -999, day3: 3 },
        T2M: { day1: 20, day2: 22, day3: -999 },
        T2M_MAX: { day1: 30, day2: 35, day3: -999 },
        T2M_MIN: { day1: 12, day2: 10, day3: -999 },
        ALLSKY_SFC_SW_DWN: { day1: 15, day2: 17, day3: -999 },
        RH2M: { day1: 60, day2: 70, day3: -999 },
      },
    },
    header: { title: 'NASA POWER Daily API' },
    messages: [],
    parameters: { community: 'AG' },
    times: { data: 2 },
  };
  const openMeteoResponse = {
    latitude: 14.32,
    longitude: -88.18,
    timezone: 'America/Tegucigalpa',
    current_units: {
      time: 'iso8601',
      temperature_2m: '°C',
      apparent_temperature: '°C',
      relative_humidity_2m: '%',
      precipitation: 'mm',
      wind_speed_10m: 'km/h',
      weather_code: 'wmo code',
    },
    current: {
      time: '2024-01-03T12:00',
      temperature_2m: 25.5,
      apparent_temperature: 27.1,
      relative_humidity_2m: 72,
      precipitation: 0.4,
      wind_speed_10m: 8.3,
      weather_code: 3,
    },
    daily_units: {
      time: 'iso8601',
      weather_code: 'wmo code',
      temperature_2m_max: '°C',
      temperature_2m_min: '°C',
      precipitation_sum: 'mm',
      precipitation_probability_max: '%',
      et0_fao_evapotranspiration: 'mm',
    },
    daily: {
      time: [
        '2024-01-03',
        '2024-01-04',
        '2024-01-05',
        '2024-01-06',
        '2024-01-07',
        '2024-01-08',
        '2024-01-09',
      ],
      weather_code: [3, 61, 2, 3, 61, 2, 3],
      temperature_2m_max: [29, 27, 28, 29, 26, 28, 27],
      temperature_2m_min: [18, 19, 18, 19, 17, 18, 19],
      precipitation_sum: [0.4, 5.2, 0, 0.1, 4, 0, 0.3],
      precipitation_probability_max: [20, null, 0, 10, 55, 0, 15],
      et0_fao_evapotranspiration: [4.1, 3.7, 3.9, 4, 3.4, 3.8, 3.6],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    aggregator = TestBed.inject(FarmAggregatorService);
    rotationEngine = TestBed.inject(RotationEngineService);
    httpTestingController = TestBed.inject(HttpTestingController);
    rotationEngine.setCatalogForTesting(AUDIT_CROPS);
  });

  afterEach(() => httpTestingController.verify());

  it('emits a complete, inspectable API-to-crop-score report for real catalog rows', async () => {
    expect(AUDIT_CROPS.length).toBe(3);

    const profilePromise = firstValueFrom(
      aggregator.buildEnvironmentProfile(coordinates, localContext),
    );

    httpTestingController
      .expectOne(
        (request) => request.url === 'https://power.larc.nasa.gov/api/temporal/daily/point',
      )
      .flush(nasaResponse);
    httpTestingController
      .expectOne((request) => request.url === 'https://api.open-meteo.com/v1/forecast')
      .flush(openMeteoResponse);

    const profile = await profilePromise;
    const analyses = AUDIT_CROPS.map((crop) => {
      const evaluation = rotationEngine.evaluateCrop(crop, profile.historicalClimate);
      return {
        datasetRow: crop,
        finalScore: evaluation.overallScore,
        isViable: evaluation.isViable,
        analysis: {
          summary: evaluation.summary,
          checks: evaluation.checks,
        },
      };
    });

    const report = {
      report: 'Crop climate data accuracy audit',
      dataSourceNote:
        'API payloads below are deterministic test responses, not live measurements. Crop rows are loaded from the shipped EcoCrop catalog.',
      selectedLocation: {
        coordinates,
        localContext,
      },
      apiResponses: {
        nasaPower: nasaResponse,
        openMeteo: openMeteoResponse,
        soilGrids: {
          status:
            'No network request is implemented; FarmAggregatorService applies its documented defaults.',
        },
      },
      normalizedEnvironmentProfile: profile,
      cropAnalyses: analyses,
    };

    expect(profile.coordinates).toEqual(coordinates);
    expect(profile.historicalClimate).toEqual(
      jasmine.objectContaining({
        meanTempC: 21,
        maxTempC: 35,
        minTempC: 10,
        totalPrecipitationMm: 5,
        annualizedPrecipitationMm: 912.5,
        analyzedDays: 2,
        elevationM: 1550,
        solarRadiationMjM2Day: 16,
        relativeHumidityPct: 65,
        heatwaveRisk: 'high',
      }),
    );
    expect(profile.forecastClimate).toEqual(
      jasmine.objectContaining({
        totalPrecipitationMm: 10,
        evapotranspirationMm: 26.5,
        waterBalanceMm: -16.5,
      }),
    );
    expect(analyses.map(({ datasetRow, finalScore }) => [datasetRow.id, finalScore])).toEqual([
      ['1668', 100],
      ['1971', 98],
      ['238663', 100],
    ]);
    expect(
      analyses.every((analysis) => analysis.isViable && analysis.analysis.checks.length > 0),
    ).toBeTrue();
    expect(report.apiResponses.nasaPower).toBe(nasaResponse);
    expect(report.apiResponses.openMeteo).toBe(openMeteoResponse);

    console.info(`[DATA ACCURACY REPORT]\n${JSON.stringify(report, null, 2)}`);
  });
});
