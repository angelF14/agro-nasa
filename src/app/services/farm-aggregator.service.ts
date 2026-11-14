import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Coordinates, FarmEnvironmentProfile, FarmLocalContext } from '@models/index';
import { NasaPowerService } from './nasa-power.service';
import { OpenMeteoService } from './open-meteo.service';
import { SoilGridsService } from './soil-grids.service';

@Injectable({
  providedIn: 'root',
})
export class FarmAggregatorService {
  private readonly nasaPower = inject(NasaPowerService);
  private readonly openMeteo = inject(OpenMeteoService);
  private readonly soilGrids = inject(SoilGridsService);

  /**
   * Queries NASA POWER, Open-Meteo, and SoilGrids in parallel, then normalizes into a unified FarmEnvironmentProfile.
   * TODO: Combine observables with forkJoin and apply water balance + soil observation overrides.
   */
  buildEnvironmentProfile(
    coords: Coordinates,
    localContext: FarmLocalContext
  ): Observable<FarmEnvironmentProfile> {
    return of({
      coordinates: coords,
      localContext,
      historicalClimate: {
        meanTempC: 0,
        maxTempC: 0,
        minTempC: 0,
        totalPrecipitationMm: 0,
        solarRadiationMjM2Day: 0,
        relativeHumidityPct: 0,
        evapotranspirationMm: 0,
        waterBalanceMm: 0,
        heatwaveRisk: 'low',
      },
      soil: {
        ph: 6.5,
        organicCarbonGKg: 0,
        nitrogenGKg: 0,
        texture: { sandPct: 33, siltPct: 34, clayPct: 33 },
        bulkDensityKgDm3: 1.3,
        source: 'soilgrids',
      },
      generatedAt: new Date().toISOString(),
    });
  }
}
