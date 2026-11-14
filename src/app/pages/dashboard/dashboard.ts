import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CropSelector } from '@components/crop-selector/crop-selector';
import { FarmMap } from '@components/farm-map/farm-map';
import { RotationTimeline } from '@components/rotation-timeline/rotation-timeline';
import { WeatherForecastComponent } from '@components/weather-forecast/weather-forecast';
import {
  ClimateSummary,
  Coordinates,
  Crop,
  CropEvaluation,
  FarmEnvironmentProfile,
  RotationPlan,
} from '@models/index';
import { NasaPowerService } from '@services/nasa-power.service';
import { RotationEngineService } from '@services/rotation-engine.service';
import { catchError, of, Subject, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [FarmMap, CropSelector, RotationTimeline, WeatherForecastComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly nasaPowerService = inject(NasaPowerService);
  private readonly rotationEngine = inject(RotationEngineService);
  private readonly climateQuery$ = new Subject<Coordinates>();

  protected readonly selectedCoordinates = signal<Coordinates | null>(null);
  protected readonly selectedLocationName = signal<string>('');
  protected readonly selectedCrop = signal<Crop | null>(null);
  protected readonly climateSummary = signal<Partial<ClimateSummary> | null>(null);
  protected readonly isLoadingClimate = signal<boolean>(false);
  protected readonly climateError = signal<string | null>(null);

  protected readonly cropEvaluation = computed<CropEvaluation | null>(() => {
    const crop = this.selectedCrop();
    const climate = this.climateSummary();
    if (!crop || !climate) {
      return null;
    }
    return this.rotationEngine.evaluateCrop(crop, climate);
  });

  protected readonly rotationPlan = computed<RotationPlan | null>(() => {
    const coords = this.selectedCoordinates();
    const climate = this.climateSummary();
    const crop = this.selectedCrop();
    if (!coords || !climate || !crop) {
      return null;
    }

    const profile: FarmEnvironmentProfile = {
      coordinates: coords,
      locationName: this.selectedLocationName() || undefined,
      localContext: {
        previousCropId: crop.id,
        soilObservations: [],
        priorities: ['soil-regeneration', 'water-conservation'],
      },
      historicalClimate: {
        meanTempC: climate.meanTempC ?? 0,
        maxTempC: climate.maxTempC ?? 0,
        minTempC: climate.minTempC ?? 0,
        totalPrecipitationMm: climate.totalPrecipitationMm ?? 0,
        annualizedPrecipitationMm: climate.annualizedPrecipitationMm,
        analyzedDays: climate.analyzedDays,
        elevationM: climate.elevationM,
        solarRadiationMjM2Day: climate.solarRadiationMjM2Day ?? 0,
        relativeHumidityPct: climate.relativeHumidityPct ?? 0,
        evapotranspirationMm: 0,
        waterBalanceMm: 0,
        heatwaveRisk: climate.heatwaveRisk ?? 'low',
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
    };

    return this.rotationEngine.generatePlan(profile, crop);
  });

  constructor() {
    this.climateQuery$
      .pipe(
        tap(() => {
          this.isLoadingClimate.set(true);
          this.climateError.set(null);
        }),
        switchMap((coords) =>
          this.nasaPowerService.getHistoricalClimate(coords).pipe(
            catchError(() => {
              this.climateError.set(
                'No se pudieron obtener los datos climáticos de NASA POWER para puntuar el cultivo.'
              );
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((summary) => {
        this.climateSummary.set(summary);
        this.isLoadingClimate.set(false);
      });
  }

  protected onCoordinatesChange(coords: Coordinates): void {
    this.selectedCoordinates.set(coords);
    this.climateQuery$.next(coords);
  }

  protected onLocationNameChange(name: string): void {
    this.selectedLocationName.set(name);
  }

  protected onCropChange(crop: Crop): void {
    this.selectedCrop.set(crop);
  }
}
