import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ClimateSummary, Coordinates } from '@models/index';
import { NasaPowerRawResponse, NasaPowerService } from '../../src/app/services/nasa-power.service';

describe('NasaPowerService', () => {
  let service: NasaPowerService;
  let httpTestingController: HttpTestingController;

  const coordinates: Coordinates = { lat: 14.3167, lon: -88.1833 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NasaPowerService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests the selected point and derives climate values while excluding NASA fill values', () => {
    let result: Partial<ClimateSummary> | undefined;
    service.getHistoricalClimate(coordinates, '20240101', '20240103').subscribe((value) => {
      result = value;
    });

    const request = httpTestingController.expectOne(
      (req) => req.url === 'https://power.larc.nasa.gov/api/temporal/daily/point',
    );
    expect(request.request.params.get('latitude')).toBe('14.3167');
    expect(request.request.params.get('longitude')).toBe('-88.1833');
    expect(request.request.params.get('start')).toBe('20240101');
    expect(request.request.params.get('end')).toBe('20240103');
    expect(request.request.params.get('community')).toBe('AG');
    expect(request.request.params.get('format')).toBe('JSON');
    expect(request.request.params.get('parameters')).toBe(
      'PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN,RH2M',
    );

    request.flush({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-88.1833, 14.3167, 1850.4] },
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
    } satisfies NasaPowerRawResponse);

    expect(result).toEqual({
      meanTempC: 21,
      maxTempC: 35,
      minTempC: 10,
      totalPrecipitationMm: 5,
      annualizedPrecipitationMm: 912.5,
      analyzedDays: 2,
      elevationM: 1850,
      solarRadiationMjM2Day: 16,
      relativeHumidityPct: 65,
      heatwaveRisk: 'high',
    });
  });

  it('returns zero climate measurements when NASA has no valid values and omits fill elevation', () => {
    let result: Partial<ClimateSummary> | undefined;
    service.getHistoricalClimate(coordinates, '20240101', '20240101').subscribe((value) => {
      result = value;
    });

    const request = httpTestingController.expectOne(
      (req) => req.url === 'https://power.larc.nasa.gov/api/temporal/daily/point',
    );
    request.flush({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-88.1833, 14.3167, -999] },
      properties: {
        parameter: {
          PRECTOTCORR: { day1: -999 },
          T2M: { day1: -999 },
          T2M_MAX: { day1: -999 },
          T2M_MIN: { day1: -999 },
          ALLSKY_SFC_SW_DWN: { day1: -999 },
          RH2M: { day1: -999 },
        },
      },
    } satisfies NasaPowerRawResponse);

    expect(result?.meanTempC).toBe(0);
    expect(result?.totalPrecipitationMm).toBe(0);
    expect(result?.annualizedPrecipitationMm).toBe(0);
    expect(result?.analyzedDays).toBe(0);
    expect(result?.elevationM).toBeUndefined();
    expect(result?.heatwaveRisk).toBe('low');
  });
});
