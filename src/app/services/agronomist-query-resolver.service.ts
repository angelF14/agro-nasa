import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  AgronomistComparedCropEvaluation,
  AgronomistParcelContext,
  AgronomistResolvedServiceCard,
  AgronomistSuitableSeedSummary,
  ClimateSummary,
  Coordinates,
  Crop,
  CropEvaluation,
  FarmEnvironmentProfile,
  FarmerPriority,
  RotationPlan,
  SoilObservation,
  WeatherForecast,
} from '@models/index';
import { buildAgronomistContext } from '@utils/agronomist-context.utils';
import {
  normalizeSearchText,
  parseAgronomistQuery,
  searchCatalogWithAliases,
  SPANISH_CROP_ALIASES,
} from '@utils/agronomist-query-parser.utils';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import { NasaPowerService } from './nasa-power.service';
import { OpenMeteoService } from './open-meteo.service';
import { RotationEngineService, ScoredCrop } from './rotation-engine.service';

interface NominatimSearchItem {
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimReverseItem {
  display_name?: string;
}

export interface AgronomistDashboardLiveState {
  coordinates: Coordinates | null;
  locationName: string;
  climateSummary: Partial<ClimateSummary> | null;
  weatherForecast: WeatherForecast | null;
  selectedCrop: Crop | null;
  soilObservations: SoilObservation[];
  priorities: FarmerPriority[];
  customNotes: string;
}

export interface AgronomistResolutionResult {
  context: AgronomistParcelContext;
  stateChanged: boolean;
  updatedState: {
    coordinates: Coordinates | null;
    locationName: string;
    climateSummary: Partial<ClimateSummary> | null;
    weatherForecast: WeatherForecast | null;
    selectedCrop: Crop | null;
  };
  resolvedCard?: AgronomistResolvedServiceCard;
}

@Injectable({
  providedIn: 'root',
})
export class AgronomistQueryResolverService {
  private readonly http = inject(HttpClient);
  private readonly nasaPower = inject(NasaPowerService);
  private readonly openMeteo = inject(OpenMeteoService);
  private readonly rotationEngine = inject(RotationEngineService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async resolveFromMessage(
    rawText: string,
    currentState: AgronomistDashboardLiveState,
    onProgress?: (label: string) => void,
    recentUserMessages: string[] = [],
    onImmediateStateSync?: (updated: AgronomistResolutionResult['updatedState']) => void
  ): Promise<AgronomistResolutionResult> {
    let coordinates = currentState.coordinates;
    let locationName = currentState.locationName;
    let climateSummary = currentState.climateSummary;
    let weatherForecast = currentState.weatherForecast;
    let selectedCrop = currentState.selectedCrop;

    if (!this.isBrowser || !rawText.trim()) {
      return {
        context: this.composeContext({
          coordinates,
          locationName,
          climateSummary,
          weatherForecast,
          selectedCrop,
          soilObservations: currentState.soilObservations,
          priorities: currentState.priorities,
          customNotes: currentState.customNotes,
        }),
        stateChanged: false,
        updatedState: {
          coordinates,
          locationName,
          climateSummary,
          weatherForecast,
          selectedCrop,
        },
      };
    }

    const catalog = await firstValueFrom(this.rotationEngine.loadCatalog());
    const parsed = parseAgronomistQuery(rawText, catalog);

    // Multi-turn memory: if the user gave the place in an earlier message and the seed now (or vice versa),
    // and the dashboard state does not yet have one of them, check recent user messages.
    if (!parsed.locationQuery && !parsed.explicitCoordinates && !coordinates) {
      for (let i = recentUserMessages.length - 1; i >= 0; i--) {
        const prevParsed = parseAgronomistQuery(recentUserMessages[i], catalog);
        if (prevParsed.explicitCoordinates) {
          parsed.explicitCoordinates = prevParsed.explicitCoordinates;
          break;
        }
        if (prevParsed.locationQuery) {
          parsed.locationQuery = prevParsed.locationQuery;
          break;
        }
      }
    }

    if (parsed.matchedCrops.length === 0 && !selectedCrop) {
      for (let i = recentUserMessages.length - 1; i >= 0; i--) {
        const prevParsed = parseAgronomistQuery(recentUserMessages[i], catalog);
        if (prevParsed.matchedCrops.length > 0) {
          parsed.matchedCrops = prevParsed.matchedCrops;
          parsed.matchedCropTerms = prevParsed.matchedCropTerms;
          break;
        }
      }
    }

    let locationResolvedLabel: string | undefined;
    let cropResolvedLabel: string | undefined;
    let stateChanged = false;

    // 1. Resolve Location (Explicit coordinates or Place Name via Nominatim + NASA POWER + Open-Meteo)
    if (parsed.explicitCoordinates) {
      const coords = parsed.explicitCoordinates;
      const isDifferentCoords =
        !coordinates ||
        Math.abs(coordinates.lat - coords.lat) > 0.001 ||
        Math.abs(coordinates.lon - coords.lon) > 0.001;

      if (isDifferentCoords || !climateSummary) {
        onProgress?.(`Consultando ubicación (${coords.lat}, ${coords.lon})...`);
        const revName = await this.reverseGeocode(coords);
        coordinates = coords;
        locationName = revName || `Parcela (${coords.lat}, ${coords.lon})`;
        locationResolvedLabel = `${locationName} (${coords.lat}, ${coords.lon})`;
        stateChanged = true;

        onImmediateStateSync?.({
          coordinates,
          locationName,
          climateSummary,
          weatherForecast,
          selectedCrop,
        });

        onProgress?.('Consultando clima satelital NASA POWER y pronóstico Open-Meteo...');
        const envData = await this.fetchClimateAndForecast(coords);
        climateSummary = envData.climate;
        weatherForecast = envData.forecast;
      }
    } else if (parsed.locationQuery) {
      const alreadyLoadedLocation =
        Boolean(locationName) &&
        Boolean(climateSummary) &&
        normalizeSearchText(locationName).includes(normalizeSearchText(parsed.locationQuery));

      if (!alreadyLoadedLocation) {
        onProgress?.(`Buscando ubicación "${parsed.locationQuery}" en el mapa...`);
        const geo = await this.geocodePlace(parsed.locationQuery);
        if (geo) {
          coordinates = geo.coords;
          locationName = geo.displayName;
          const shortPlace = geo.displayName.split(',')[0]?.trim() || parsed.locationQuery;
          locationResolvedLabel = `${geo.displayName} (${geo.coords.lat}, ${geo.coords.lon})`;
          stateChanged = true;

          onImmediateStateSync?.({
            coordinates,
            locationName,
            climateSummary,
            weatherForecast,
            selectedCrop,
          });

          onProgress?.(
            `Consultando NASA POWER y Open-Meteo para ${shortPlace}...`
          );
          const envData = await this.fetchClimateAndForecast(geo.coords);
          climateSummary = envData.climate;
          weatherForecast = envData.forecast;
        }
      } else {
        locationResolvedLabel = locationName;
      }
    }

    // 2. Resolve Seed / Crop from FAO EcoCrop Catalog
    const suitableCandidates = climateSummary
      ? this.findTopSuitableSeeds(climateSummary)
      : [];

    if (parsed.matchedCrops.length > 0) {
      const chosen = parsed.matchedCrops[0];
      const displayName = this.primaryCropName(chosen);
      onProgress?.(`Evaluando semilla "${displayName}" en catálogo FAO EcoCrop...`);
      if (!selectedCrop || selectedCrop.id !== chosen.id) {
        stateChanged = true;
      }
      selectedCrop = chosen;
      cropResolvedLabel = `${displayName} (${chosen.scientificName})`;
    } else if (
      climateSummary &&
      suitableCandidates.length > 0 &&
      (Boolean(locationResolvedLabel) || parsed.asksForSeedRecommendation) &&
      (!selectedCrop || parsed.asksForSeedRecommendation)
    ) {
      onProgress?.('Seleccionando las mejores semillas en FAO EcoCrop para este clima...');
      const topSeed = suitableCandidates[0].crop;
      const displayName = this.primaryCropName(topSeed);
      if (!selectedCrop || selectedCrop.id !== topSeed.id) {
        stateChanged = true;
      }
      selectedCrop = topSeed;
      cropResolvedLabel = `${displayName} (${topSeed.scientificName}) [Preseleccionada por mayor aptitud climática]`;
    }

    if (stateChanged) {
      onImmediateStateSync?.({
        coordinates,
        locationName,
        climateSummary,
        weatherForecast,
        selectedCrop,
      });
    }

    // 3. Evaluate Crop & Generate 3-Cycle Rotation Plan
    const cropEvaluation: CropEvaluation | null =
      selectedCrop && climateSummary
        ? this.rotationEngine.evaluateCrop(selectedCrop, climateSummary)
        : null;

    const rotationPlan: RotationPlan | null =
      coordinates && climateSummary && selectedCrop
        ? this.rotationEngine.generatePlan(
            this.buildFarmProfile(
              coordinates,
              locationName,
              climateSummary,
              selectedCrop,
              currentState.soilObservations,
              currentState.priorities
            ),
            selectedCrop
          )
        : null;

    // 4. Evaluate multiple crops if user mentioned 2+ seeds to compare
    let comparedEvaluations: AgronomistComparedCropEvaluation[] | undefined;
    if (parsed.matchedCrops.length > 1 && climateSummary) {
      comparedEvaluations = parsed.matchedCrops.map((crop) => {
        const ev = this.rotationEngine.evaluateCrop(crop, climateSummary!);
        return {
          commonName: this.primaryCropName(crop),
          scientificName: crop.scientificName,
          overallScore: ev.overallScore,
          isViable: ev.isViable,
          summary: ev.summary,
          tempOptRangeC: `${crop.temp.optMin}–${crop.temp.optMax} °C`,
          rainOptRangeMm: `${crop.rain.optMin}–${crop.rain.optMax} mm/año`,
        };
      });
    }

    const topSuitableCrops: AgronomistSuitableSeedSummary[] | undefined =
      suitableCandidates.length > 0
        ? suitableCandidates.slice(0, 6).map((item) => ({
            commonName: this.primaryCropName(item.crop),
            scientificName: item.crop.scientificName,
            family: item.crop.family,
            category: item.crop.category,
            suitabilityScore: item.suitabilityScore,
            tempOptRangeC: `${item.crop.temp.optMin}–${item.crop.temp.optMax} °C`,
            rainOptRangeMm: `${item.crop.rain.optMin}–${item.crop.rain.optMax} mm/año`,
            cycleDaysRange:
              item.crop.agronomy.cycleDays.min && item.crop.agronomy.cycleDays.max
                ? `${item.crop.agronomy.cycleDays.min}–${item.crop.agronomy.cycleDays.max} días`
                : null,
          }))
        : undefined;

    const baseContext = buildAgronomistContext({
      coordinates,
      locationName,
      climateSummary,
      weatherForecast,
      selectedCrop,
      cropEvaluation,
      rotationPlan,
      soilObservations: currentState.soilObservations,
      priorities: currentState.priorities,
      customNotes: currentState.customNotes,
    });

    const enrichedContext: AgronomistParcelContext = {
      ...baseContext,
      autoResolvedFromPrompt:
        locationResolvedLabel || cropResolvedLabel
          ? {
              locationResolved: locationResolvedLabel,
              cropResolved: cropResolvedLabel,
              comparedCrops:
                parsed.matchedCrops.length > 1
                  ? parsed.matchedCrops.map((c) => `${this.primaryCropName(c)} (${c.scientificName})`)
                  : undefined,
            }
          : undefined,
      comparedEvaluations,
      topSuitableCrops,
    };

    const resolvedCard =
      locationResolvedLabel || cropResolvedLabel || parsed.asksForSeedRecommendation
        ? this.buildResolvedCard({
            coordinates,
            locationName,
            selectedCrop,
            cropEvaluation,
            climateSummary,
             enrichedContext,
            rotationPlan,
          })
        : undefined;

    return {
      context: enrichedContext,
      stateChanged,
      updatedState: {
        coordinates,
        locationName,
        climateSummary,
        weatherForecast,
        selectedCrop,
      },
      resolvedCard,
    };
  }

  async resolveExplicitEntities(
    detectedLocation: string | undefined,
    detectedSeed: string | undefined,
    currentState: AgronomistDashboardLiveState
  ): Promise<AgronomistResolutionResult | null> {
    if (!this.isBrowser || (!detectedLocation?.trim() && !detectedSeed?.trim())) {
      return null;
    }

    let coordinates = currentState.coordinates;
    let locationName = currentState.locationName;
    let climateSummary = currentState.climateSummary;
    let weatherForecast = currentState.weatherForecast;
    let selectedCrop = currentState.selectedCrop;
    let stateChanged = false;

    const catalog = await firstValueFrom(this.rotationEngine.loadCatalog());

    if (detectedLocation?.trim()) {
      const locNorm = normalizeSearchText(detectedLocation);
      const alreadySame =
        Boolean(locationName) &&
        Boolean(climateSummary) &&
        normalizeSearchText(locationName).includes(locNorm);

      if (!alreadySame) {
        const geo = await this.geocodePlace(detectedLocation.trim());
        if (geo) {
          coordinates = geo.coords;
          locationName = geo.displayName;
          const envData = await this.fetchClimateAndForecast(geo.coords);
          climateSummary = envData.climate;
          weatherForecast = envData.forecast;
          stateChanged = true;
        }
      }
    }

    if (detectedSeed?.trim()) {
      const matches = searchCatalogWithAliases(detectedSeed.trim(), catalog);
      if (matches.length > 0) {
        const chosen = matches[0];
        if (!selectedCrop || selectedCrop.id !== chosen.id) {
          selectedCrop = chosen;
          stateChanged = true;
        }
      }
    } else if (climateSummary && !selectedCrop) {
      const suitable = this.findTopSuitableSeeds(climateSummary);
      if (suitable.length > 0) {
        selectedCrop = suitable[0].crop;
        stateChanged = true;
      }
    }

    if (!stateChanged) {
      return null;
    }

    const cropEvaluation =
      selectedCrop && climateSummary
        ? this.rotationEngine.evaluateCrop(selectedCrop, climateSummary)
        : null;

    const rotationPlan =
      coordinates && climateSummary && selectedCrop
        ? this.rotationEngine.generatePlan(
            this.buildFarmProfile(
              coordinates,
              locationName,
              climateSummary,
              selectedCrop,
              currentState.soilObservations,
              currentState.priorities
            ),
            selectedCrop
          )
        : null;

    const enrichedContext = buildAgronomistContext({
      coordinates,
      locationName,
      climateSummary,
      weatherForecast,
      selectedCrop,
      cropEvaluation,
      rotationPlan,
      soilObservations: currentState.soilObservations,
      priorities: currentState.priorities,
      customNotes: currentState.customNotes,
    });

    const resolvedCard = this.buildResolvedCard({
      coordinates,
      locationName,
      selectedCrop,
      cropEvaluation,
      climateSummary,
      enrichedContext,
      rotationPlan,
    });

    return {
      context: enrichedContext,
      stateChanged: true,
      updatedState: {
        coordinates,
        locationName,
        climateSummary,
        weatherForecast,
        selectedCrop,
      },
      resolvedCard,
    };
  }

  private async geocodePlace(
    query: string
  ): Promise<{ coords: Coordinates; displayName: string } | null> {
    const candidates = [query.trim()];
    if (query.includes(',')) {
      const firstPart = query.split(',')[0].trim();
      if (firstPart.length >= 3 && !candidates.includes(firstPart)) {
        candidates.push(firstPart);
      }
    }
    const words = query.trim().split(/\s+/);
    if (words.length > 2) {
      const twoWords = words.slice(0, 2).join(' ');
      if (twoWords.length >= 3 && !candidates.includes(twoWords)) {
        candidates.push(twoWords);
      }
    }
    if (words.length > 1) {
      const oneWord = words[0].replace(/[,.;:]+$/, '');
      if (oneWord.length >= 4 && !candidates.includes(oneWord)) {
        candidates.push(oneWord);
      }
    }

    for (const candidate of candidates) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(
        candidate
      )}`;

      const results = await firstValueFrom(
        this.http
          .get<NominatimSearchItem[]>(url, {
            headers: { 'Accept-Language': 'es' },
          })
          .pipe(catchError(() => of([])))
      );

      if (results && results.length > 0) {
        const first = results[0];
        const lat = Math.round(parseFloat(first.lat) * 100000) / 100000;
        const lon = Math.round(parseFloat(first.lon) * 100000) / 100000;
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          return {
            coords: { lat, lon },
            displayName: first.display_name,
          };
        }
      }
    }

    return null;
  }

  private async reverseGeocode(coords: Coordinates): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&zoom=10`;
    const res = await firstValueFrom(
      this.http
        .get<NominatimReverseItem>(url, {
          headers: { 'Accept-Language': 'es' },
        })
        .pipe(catchError(() => of(null)))
    );
    return res?.display_name ?? null;
  }

  private async fetchClimateAndForecast(coords: Coordinates): Promise<{
    climate: Partial<ClimateSummary> | null;
    forecast: WeatherForecast | null;
  }> {
    return firstValueFrom(
      forkJoin({
        climate: this.nasaPower.getHistoricalClimate(coords).pipe(catchError(() => of(null))),
        forecast: this.openMeteo.getForecast(coords).pipe(catchError(() => of(null))),
      })
    );
  }

  private findTopSuitableSeeds(climate: Partial<ClimateSummary>): ScoredCrop[] {
    const rainAnnual = climate.annualizedPrecipitationMm ?? climate.totalPrecipitationMm;
    const allScored = this.rotationEngine.findSuitableCrops({
      temperature: climate.meanTempC,
      minTempObserved: climate.minTempC,
      rainfall: rainAnnual,
      altitude: climate.elevationM,
    });

    const knownScientificSet = new Set(
      SPANISH_CROP_ALIASES.flatMap((a) => a.scientificTargets.map((s) => s.toLowerCase()))
    );

    const prioritizedFoodCrops = allScored.filter(
      (item) =>
        knownScientificSet.has(item.crop.scientificName.toLowerCase()) &&
        item.suitabilityScore >= 65
    );

    if (prioritizedFoodCrops.length >= 3) {
      const usedIds = new Set(prioritizedFoodCrops.map((c) => c.crop.id));
      const rest = allScored.filter((c) => !usedIds.has(c.crop.id));
      return [...prioritizedFoodCrops, ...rest];
    }

    return allScored;
  }

  private composeContext(params: {
    coordinates: Coordinates | null;
    locationName: string;
    climateSummary: Partial<ClimateSummary> | null;
    weatherForecast: WeatherForecast | null;
    selectedCrop: Crop | null;
    soilObservations: SoilObservation[];
    priorities: FarmerPriority[];
    customNotes: string;
  }): AgronomistParcelContext {
    const cropEvaluation =
      params.selectedCrop && params.climateSummary
        ? this.rotationEngine.evaluateCrop(params.selectedCrop, params.climateSummary)
        : null;

    const rotationPlan =
      params.coordinates && params.climateSummary && params.selectedCrop
        ? this.rotationEngine.generatePlan(
            this.buildFarmProfile(
              params.coordinates,
              params.locationName,
              params.climateSummary,
              params.selectedCrop,
              params.soilObservations,
              params.priorities
            ),
            params.selectedCrop
          )
        : null;

    return buildAgronomistContext({
      coordinates: params.coordinates,
      locationName: params.locationName,
      climateSummary: params.climateSummary,
      weatherForecast: params.weatherForecast,
      selectedCrop: params.selectedCrop,
      cropEvaluation,
      rotationPlan,
      soilObservations: params.soilObservations,
      priorities: params.priorities,
      customNotes: params.customNotes,
    });
  }

  private buildFarmProfile(
    coords: Coordinates,
    locationName: string,
    climate: Partial<ClimateSummary>,
    crop: Crop,
    soilObservations: SoilObservation[],
    priorities: FarmerPriority[]
  ): FarmEnvironmentProfile {
    return {
      coordinates: coords,
      locationName: locationName || undefined,
      localContext: {
        previousCropId: crop.id,
        soilObservations,
        priorities,
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
  }

  private buildResolvedCard(params: {
    coordinates: Coordinates | null;
    locationName: string;
    selectedCrop: Crop | null;
    cropEvaluation: CropEvaluation | null;
    climateSummary: Partial<ClimateSummary> | null;
    enrichedContext: AgronomistParcelContext;
    rotationPlan: RotationPlan | null;
  }): AgronomistResolvedServiceCard | undefined {
    if (!params.coordinates && !params.selectedCrop) {
      return undefined;
    }

    const shortLocation = params.locationName
      ? params.locationName.split(',').slice(0, 2).join(',').trim()
      : undefined;

    const rotationSummary =
      params.rotationPlan && params.rotationPlan.cycles.length > 0
        ? params.rotationPlan.cycles
            .map((c) => `C${c.cycleNumber}: ${this.primaryCropName(c.crop)}`)
            .join(' → ')
        : undefined;

    return {
      locationName: shortLocation,
      coordinates: params.coordinates ?? undefined,
      cropName: params.selectedCrop ? this.primaryCropName(params.selectedCrop) : undefined,
      scientificName: params.selectedCrop?.scientificName,
      overallScore: params.cropEvaluation?.overallScore,
      isViable: params.cropEvaluation?.isViable,
      meanTempC: params.climateSummary?.meanTempC,
      annualRainMm:
        params.climateSummary?.annualizedPrecipitationMm ??
        params.climateSummary?.totalPrecipitationMm,
      waterBalance7dMm: params.enrichedContext.weatherSummary?.waterBalance7dMm,
      rotationSummary,
    };
  }

  private primaryCropName(crop: Crop): string {
    return crop.commonNames[0] || crop.scientificName;
  }
}
