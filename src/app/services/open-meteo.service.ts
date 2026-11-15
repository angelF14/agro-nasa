
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';

import {
  Coordinates,
  WeatherForecast,
} from '@models/index';

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;

  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
  };

  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: (number | null)[];
    et0_fao_evapotranspiration: number[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class OpenMeteoService {
  private readonly http = inject(HttpClient);

  private readonly forecastUrl =
    'https://api.open-meteo.com/v1/forecast';
  private readonly forecastCache = new Map<string, Observable<WeatherForecast>>();

  /**
   * Obtiene las condiciones actuales y el pronóstico
   * meteorológico de hasta 16 días, reutilizando caché en memoria por coordenada.
   */
  getForecast(coords: Coordinates, forceRefresh = false): Observable<WeatherForecast> {
    const cacheKey = `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
    if (!forceRefresh) {
      const cached = this.forecastCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const params = new HttpParams()
      .set('latitude', coords.lat.toString())
      .set('longitude', coords.lon.toString())
      .set('current', [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'precipitation',
        'wind_speed_10m',
        'weather_code',
      ].join(','))
      .set('daily', [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'precipitation_probability_max',
        'et0_fao_evapotranspiration',
      ].join(','))
      .set('forecast_days', '16')
      .set('timezone', 'auto');

    const request$ = this.http
      .get<OpenMeteoResponse>(this.forecastUrl, { params })
      .pipe(
        map(response => ({
          latitude: response.latitude,
          longitude: response.longitude,
          timezone: response.timezone,

          current: {
            time: response.current.time,
            temperature: response.current.temperature_2m,
            apparentTemperature: response.current.apparent_temperature,
            relativeHumidity: response.current.relative_humidity_2m,
            precipitation: response.current.precipitation,
            windSpeed: response.current.wind_speed_10m,
            weatherCode: response.current.weather_code,
          },

          daily: response.daily.time.map((date, index) => ({
            date,
            weatherCode: response.daily.weather_code[index],
            temperatureMax: response.daily.temperature_2m_max[index],
            temperatureMin: response.daily.temperature_2m_min[index],
            precipitationMm: response.daily.precipitation_sum[index],
            precipitationProbability:
              response.daily.precipitation_probability_max[index],
            et0Mm: response.daily.et0_fao_evapotranspiration[index],
          })),

          generatedAt: new Date().toISOString(),
        })),
        catchError((err) => {
          this.forecastCache.delete(cacheKey);
          return throwError(() => err);
        }),
        shareReplay(1)
      );

    this.forecastCache.set(cacheKey, request$);
    return request$;
  }
}
