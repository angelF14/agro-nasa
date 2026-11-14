import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ClimateSummary, Coordinates } from '@models/index';

@Injectable({
  providedIn: 'root',
})
export class OpenMeteoService {
  private readonly http = inject(HttpClient);
  private readonly forecastUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly climateUrl = 'https://climate-api.open-meteo.com/v1/climate';

  /**
   * Fetches 7-16 day weather forecast and ET0 evapotranspiration.
   * TODO: Implement Open-Meteo Forecast API call.
   */
  getForecast(_coords: Coordinates): Observable<Partial<ClimateSummary>> {
    return of({});
  }

  /**
   * Fetches CMIP6 climate projections for medium/long-term adaptation.
   * TODO: Implement Open-Meteo Climate Change API call.
   */
  getClimateProjection(_coords: Coordinates): Observable<Partial<ClimateSummary>> {
    return of({});
  }
}
