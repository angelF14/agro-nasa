import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ClimateSummary, Coordinates } from '@models/index';

@Injectable({
  providedIn: 'root',
})
export class NasaPowerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point';

  /**
   * Fetches historical climate data (PRECTOTCORR, T2M, T2M_MAX, T2M_MIN, ALLSKY_SFC_SW_DWN, RH2M)
   * from NASA POWER Daily API.
   * TODO: Implement API call and clean -999 fill values using nasa-cleaner.utils.ts.
   */
  getHistoricalClimate(
    _coords: Coordinates,
    _startDate: string,
    _endDate: string
  ): Observable<Partial<ClimateSummary>> {
    return of({});
  }
}
