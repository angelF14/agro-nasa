import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { Coordinates, FarmEnvironmentProfile, FarmLocalContext } from '@models/index';
import { calculateWaterBalance } from '@utils/water-balance.utils';
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
   */
  buildEnvironmentProfile(
    coords: Coordinates,
    localContext: FarmLocalContext
  ): Observable<FarmEnvironmentProfile> {
    return forkJoin({
      historical: this.nasaPower.getHistoricalClimate(coords),
      forecast: this.openMeteo.getForecast(coords),
      soil: this.soilGrids.getSoilProfile(coords),
    }).pipe(
      map(({ historical, forecast, soil }) => {
        const totalPrecipitationMm = historical.totalPrecipitationMm ?? 0;
        const evapotranspirationMm = forecast.evapotranspirationMm ?? 0;

        return {
          coordinates: coords,
          localContext,
          historicalClimate: {
            meanTempC: historical.meanTempC ?? 0,
            maxTempC: historical.maxTempC ?? 0,
            minTempC: historical.minTempC ?? 0,
            totalPrecipitationMm,
            annualizedPrecipitationMm: historical.annualizedPrecipitationMm,
            analyzedDays: historical.analyzedDays,
            elevationM: historical.elevationM,
            solarRadiationMjM2Day: historical.solarRadiationMjM2Day ?? 0,
            relativeHumidityPct: historical.relativeHumidityPct ?? 0,
            evapotranspirationMm,
            waterBalanceMm: calculateWaterBalance(totalPrecipitationMm, evapotranspirationMm),
            heatwaveRisk: historical.heatwaveRisk ?? 'low',
          },
          forecastClimate: forecast,
          soil: {
            ph: soil.ph ?? 6.5,
            organicCarbonGKg: soil.organicCarbonGKg ?? 0,
            nitrogenGKg: soil.nitrogenGKg ?? 0,
            texture: soil.texture ?? { sandPct: 33, siltPct: 34, clayPct: 33 },
            bulkDensityKgDm3: soil.bulkDensityKgDm3 ?? 1.3,
            source: soil.source ?? 'soilgrids',
          },
          generatedAt: new Date().toISOString(),
        };
      })
    );
  }
}
