import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Coordinates, SoilProfile } from '@models/index';

@Injectable({
  providedIn: 'root',
})
export class SoilGridsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://rest.isric.org/soilgrids/v2.0/properties/query';

  /**
   * Fetches soil properties (phh2o, soc, nitrogen, clay, sand, silt, bdod) from ISRIC SoilGrids v2.0.
   * TODO: Implement SoilGrids API call and unit normalization.
   */
  getSoilProfile(_coords: Coordinates): Observable<Partial<SoilProfile>> {
    return of({});
  }
}
