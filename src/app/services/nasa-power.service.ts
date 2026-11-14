import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ClimateSummary, Coordinates } from '@models/index';
import { filterNasaFillValues, meanValidNasaValues } from '@utils/nasa-cleaner.utils';

export interface NasaPowerRawResponse {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
  properties: {
    parameter: {
      PRECTOTCORR?: Record<string, number>;
      T2M?: Record<string, number>;
      T2M_MAX?: Record<string, number>;
      T2M_MIN?: Record<string, number>;
      ALLSKY_SFC_SW_DWN?: Record<string, number>;
      RH2M?: Record<string, number>;
      [key: string]: Record<string, number> | undefined;
    };
  };
  header?: Record<string, unknown>;
  messages?: unknown[];
  parameters?: Record<string, unknown>;
  times?: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class NasaPowerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point';
  private readonly defaultParams = 'PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN,RH2M';

  /**
   * Computes a default YYYYMMDD date range (last 365 days, ending 7 days ago to avoid unprocessed lag).
   */
  getDefaultDateRange(daysBack = 365, lagDays = 7): { startDate: string; endDate: string } {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - lagDays);

    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - daysBack);

    return {
      startDate: this.formatUtcYyyymmdd(start),
      endDate: this.formatUtcYyyymmdd(end),
    };
  }

  /**
   * Returns the raw JSON response from NASA POWER Daily API for inspection/testing.
   * Dates default to the last 365 days ending 7 days ago if omitted.
   */
  getRawDailyData(
    coords: Coordinates,
    startDate?: string,
    endDate?: string
  ): Observable<NasaPowerRawResponse> {
    const defaults = this.getDefaultDateRange();
    const start = startDate ?? defaults.startDate;
    const end = endDate ?? defaults.endDate;

    const params = new HttpParams()
      .set('parameters', this.defaultParams)
      .set('community', 'AG')
      .set('longitude', coords.lon.toString())
      .set('latitude', coords.lat.toString())
      .set('start', start)
      .set('end', end)
      .set('format', 'JSON');

    return this.http.get<NasaPowerRawResponse>(this.baseUrl, { params });
  }

  /**
   * Fetches historical climate data and cleans -999 fill values into a ClimateSummary.
   */
  getHistoricalClimate(
    coords: Coordinates,
    startDate?: string,
    endDate?: string
  ): Observable<Partial<ClimateSummary>> {
    return this.getRawDailyData(coords, startDate, endDate).pipe(
      map((res) => {
        const param = res?.properties?.parameter ?? {};
        const t2m = Object.values(param.T2M ?? {});
        const t2mMax = filterNasaFillValues(Object.values(param.T2M_MAX ?? {}));
        const t2mMin = filterNasaFillValues(Object.values(param.T2M_MIN ?? {}));
        const precip = filterNasaFillValues(Object.values(param.PRECTOTCORR ?? {}));
        const solar = Object.values(param.ALLSKY_SFC_SW_DWN ?? {});
        const rh2m = Object.values(param.RH2M ?? {});

        const totalPrecipitationMm = Number(
          precip.reduce((sum, val) => sum + val, 0).toFixed(2)
        );
        const maxTempC = t2mMax.length ? Math.max(...t2mMax) : 0;
        const minTempC = t2mMin.length ? Math.min(...t2mMin) : 0;

        return {
          meanTempC: Number(meanValidNasaValues(t2m).toFixed(2)),
          maxTempC: Number(maxTempC.toFixed(2)),
          minTempC: Number(minTempC.toFixed(2)),
          totalPrecipitationMm,
          solarRadiationMjM2Day: Number(meanValidNasaValues(solar).toFixed(2)),
          relativeHumidityPct: Number(meanValidNasaValues(rh2m).toFixed(2)),
          heatwaveRisk: maxTempC >= 35 ? 'high' : maxTempC >= 30 ? 'moderate' : 'low',
        };
      })
    );
  }

  private formatUtcYyyymmdd(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
