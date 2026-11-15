import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Coordinates } from '@models/index';
import { OpenMeteoService } from '../../src/app/services/open-meteo.service';

describe('OpenMeteoService', () => {
  let service: OpenMeteoService;
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
    service = TestBed.inject(OpenMeteoService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests all configured weather fields and maps every current and daily value', () => {
    let result: import('@models/index').WeatherForecast | undefined;
    service.getForecast(coordinates).subscribe((value) => {
      result = value;
    });

    const request = httpTestingController.expectOne(
      (req) => req.url === 'https://api.open-meteo.com/v1/forecast',
    );
    expect(request.request.params.get('latitude')).toBe('14.3167');
    expect(request.request.params.get('longitude')).toBe('-88.1833');
    expect(request.request.params.get('forecast_days')).toBe('16');
    expect(request.request.params.get('timezone')).toBe('auto');
    expect(request.request.params.get('current')).toBe(
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
    );
    expect(request.request.params.get('daily')).toBe(
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration',
    );

    request.flush({
      latitude: 14.32,
      longitude: -88.18,
      timezone: 'America/Tegucigalpa',
      current: {
        time: '2024-01-03T12:00',
        temperature_2m: 25.5,
        apparent_temperature: 27.1,
        relative_humidity_2m: 72,
        precipitation: 0.4,
        wind_speed_10m: 8.3,
        weather_code: 3,
      },
      daily: {
        time: ['2024-01-03', '2024-01-04'],
        weather_code: [3, 61],
        temperature_2m_max: [29, 27],
        temperature_2m_min: [18, 19],
        precipitation_sum: [0.4, 5.2],
        precipitation_probability_max: [20, null],
        et0_fao_evapotranspiration: [4.1, 3.7],
      },
    });

    expect(result).toEqual(
      jasmine.objectContaining({
        latitude: 14.32,
        longitude: -88.18,
        timezone: 'America/Tegucigalpa',
        current: {
          time: '2024-01-03T12:00',
          temperature: 25.5,
          apparentTemperature: 27.1,
          relativeHumidity: 72,
          precipitation: 0.4,
          windSpeed: 8.3,
          weatherCode: 3,
        },
        daily: [
          {
            date: '2024-01-03',
            weatherCode: 3,
            temperatureMax: 29,
            temperatureMin: 18,
            precipitationMm: 0.4,
            precipitationProbability: 20,
            et0Mm: 4.1,
          },
          {
            date: '2024-01-04',
            weatherCode: 61,
            temperatureMax: 27,
            temperatureMin: 19,
            precipitationMm: 5.2,
            precipitationProbability: null,
            et0Mm: 3.7,
          },
        ],
      }),
    );
    expect(result?.generatedAt).toEqual(jasmine.any(String));
  });
});
