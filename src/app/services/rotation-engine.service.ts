import { Injectable } from '@angular/core';
import cropsCatalog from '@data/crops.json';
import { Crop, CropRequirements, FarmEnvironmentProfile, RotationPlan } from '@models/index';

export interface CropFilterCriteria {
  lifeSpan?: string;
  category?: string;
  temperature?: number;
  minTempObserved?: number; // Checked against killing temperature thresholds
  rainfall?: number;
  ph?: number;
  latitude?: number;
  altitude?: number;
  climateZone?: string;
  lightIntensity?: string;
  photoperiod?: string;
  soilDepth?: string;
  soilTexture?: string;
  soilFertility?: string;
  alToxicity?: string;
  salinity?: string;
  drainage?: string;
  availableDays?: number; // Fits if availableDays >= cycleDays.min
  abioticTolerance?: string;
  excludeAbioticSusceptibility?: string;
  productionSystem?: string;
  /** When true, requires optimal ranges instead of absolute survival ranges */
  strictOptimal?: boolean;
}

export interface ScoredCrop {
  crop: Crop;
  suitabilityScore: number; // 0 to 100
}

@Injectable({
  providedIn: 'root',
})
export class RotationEngineService {
  private readonly catalog: Crop[] = cropsCatalog as unknown as Crop[];

  /**
   * 1. Returns all available crops from the curated local catalog for UI listing.
   */
  getAllCrops(): Crop[] {
    return this.catalog;
  }

  /**
   * 2. Finds suitable crops matching any combination of provided environmental/agronomic parameters,
   * sorted by suitability score (0–100).
   */
  findSuitableCrops(criteria: CropFilterCriteria): ScoredCrop[] {
    const strict = criteria.strictOptimal ?? false;
    const results: ScoredCrop[] = [];

    for (const crop of this.catalog) {
      if (criteria.lifeSpan && !this.matchesText(crop.lifeSpan, criteria.lifeSpan)) continue;
      if (criteria.category && !this.matchesText(crop.category, criteria.category)) continue;

      // Temperature & frost/killing checks
      if (criteria.temperature !== undefined) {
        const minT = strict ? crop.temp.optMin : crop.temp.min;
        const maxT = strict ? crop.temp.optMax : crop.temp.max;
        if (criteria.temperature < minT || criteria.temperature > maxT) continue;
      }
      if (criteria.minTempObserved !== undefined) {
        const killTemp = crop.temp.killingEarlyGrowth ?? crop.temp.killingRest;
        if (killTemp !== null && criteria.minTempObserved <= killTemp) continue;
      }

      // Rainfall check
      if (criteria.rainfall !== undefined) {
        const minR = strict ? crop.rain.optMin : crop.rain.min;
        const maxR = strict ? crop.rain.optMax : crop.rain.max;
        if (criteria.rainfall < minR || criteria.rainfall > maxR) continue;
      }

      // Soil pH check (passes if crop has no pH constraint recorded)
      if (criteria.ph !== undefined) {
        const minPh = strict ? (crop.ph.optMin ?? crop.ph.min) : (crop.ph.min ?? crop.ph.optMin);
        const maxPh = strict ? (crop.ph.optMax ?? crop.ph.max) : (crop.ph.max ?? crop.ph.optMax);
        if (minPh !== null && criteria.ph < minPh) continue;
        if (maxPh !== null && criteria.ph > maxPh) continue;
      }

      // Geography: Latitude & Altitude
      if (criteria.latitude !== undefined) {
        const absLat = Math.abs(criteria.latitude);
        const minLat = strict
          ? (crop.geography.latOptMin ?? crop.geography.latMin)
          : crop.geography.latMin;
        const maxLat = strict
          ? (crop.geography.latOptMax ?? crop.geography.latMax)
          : crop.geography.latMax;
        if (minLat !== null && absLat < Math.abs(minLat)) continue;
        if (maxLat !== null && absLat > Math.abs(maxLat)) continue;
      }
      if (
        criteria.altitude !== undefined &&
        crop.geography.altMax !== null &&
        criteria.altitude > crop.geography.altMax
      ) {
        continue;
      }
      if (
        criteria.climateZone &&
        crop.geography.climateZones.length > 0 &&
        !this.matchesAny(crop.geography.climateZones, criteria.climateZone)
      ) {
        continue;
      }

      // Light & Photoperiod
      if (criteria.lightIntensity) {
        const allowedLights = strict
          ? [crop.light.optMin, crop.light.optMax]
          : [crop.light.min, crop.light.optMin, crop.light.optMax, crop.light.max];
        const validLights = allowedLights.filter((v): v is string => v !== null);
        if (validLights.length > 0 && !this.matchesAny(validLights, criteria.lightIntensity))
          continue;
      }
      if (
        criteria.photoperiod &&
        crop.light.photoperiod.length > 0 &&
        !this.matchesAny(crop.light.photoperiod, criteria.photoperiod)
      ) {
        continue;
      }

      // Soil properties (checks optimal array if strict, otherwise optimal + absolute)
      if (!this.matchesSoilTrait(crop.soil.depth, criteria.soilDepth, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.texture, criteria.soilTexture, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.fertility, criteria.soilFertility, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.alToxicity, criteria.alToxicity, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.salinity, criteria.salinity, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.drainage, criteria.drainage, strict)) continue;

      // Agronomy: Growing window & tolerances
      if (
        criteria.availableDays !== undefined &&
        crop.agronomy.cycleDays.min !== null &&
        criteria.availableDays < crop.agronomy.cycleDays.min
      ) {
        continue;
      }
      if (
        criteria.abioticTolerance &&
        !this.matchesAny(crop.agronomy.abioticTolerance, criteria.abioticTolerance)
      ) {
        continue;
      }
      if (
        criteria.excludeAbioticSusceptibility &&
        this.matchesAny(crop.agronomy.abioticSusceptibility, criteria.excludeAbioticSusceptibility)
      ) {
        continue;
      }
      if (
        criteria.productionSystem &&
        crop.agronomy.productionSystem.length > 0 &&
        !this.matchesAny(crop.agronomy.productionSystem, criteria.productionSystem)
      ) {
        continue;
      }

      results.push({
        crop,
        suitabilityScore: this.calculateSuitabilityScore(crop, criteria),
      });
    }

    return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  /**
   * 3. Retrieves requirements for a crop matching by scientific or common name.
   * Prioritizes exact matches first, followed by partial case-insensitive matches.
   */
  getCropRequirements(query: string): CropRequirements | null {
    const matches = this.searchCropRequirements(query);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Helper returning all matching crops (exact matches first, then partial matches)
   * useful for autocomplete or disambiguating common names (e.g., "bean").
   */
  searchCropRequirements(query: string): CropRequirements[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const exactMatches: Crop[] = [];
    const partialMatches: Crop[] = [];

    for (const crop of this.catalog) {
      const sciName = crop.scientificName.toLowerCase();
      const commonNames = crop.commonNames.map((n) => n.toLowerCase());

      const isExact = sciName === normalized || commonNames.includes(normalized);
      if (isExact) {
        exactMatches.push(crop);
        continue;
      }

      const isPartial =
        sciName.includes(normalized) || commonNames.some((n) => n.includes(normalized));
      if (isPartial) {
        partialMatches.push(crop);
      }
    }

    return [...exactMatches, ...partialMatches];
  }

  /**
   * Generates a 3-cycle crop rotation plan based on climate, soil, and farmer priorities.
   */
  generatePlan(profile: FarmEnvironmentProfile): RotationPlan {
    return {
      profile,
      cycles: [],
      alerts: [],
      soilHealthImpactSummary: '',
    };
  }

  // --- Private Helpers ---

  private calculateSuitabilityScore(crop: Crop, criteria: CropFilterCriteria): number {
    const scores: number[] = [];

    if (criteria.temperature !== undefined) {
      scores.push(
        this.trapezoidScore(
          criteria.temperature,
          crop.temp.min,
          crop.temp.optMin,
          crop.temp.optMax,
          crop.temp.max,
        ),
      );
    }

    if (criteria.rainfall !== undefined) {
      scores.push(
        this.trapezoidScore(
          criteria.rainfall,
          crop.rain.min,
          crop.rain.optMin,
          crop.rain.optMax,
          crop.rain.max,
        ),
      );
    }

    if (
      criteria.ph !== undefined &&
      crop.ph.min !== null &&
      crop.ph.optMin !== null &&
      crop.ph.optMax !== null &&
      crop.ph.max !== null
    ) {
      scores.push(
        this.trapezoidScore(criteria.ph, crop.ph.min, crop.ph.optMin, crop.ph.optMax, crop.ph.max),
      );
    }

    if (scores.length === 0) return 100;
    const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    return Math.round(avg);
  }

  /**
   * Standard FAO EcoCrop 0-100 suitability curve:
   * 100 inside [optMin, optMax], linearly interpolated to 0 at [min, max].
   */
  private trapezoidScore(
    val: number,
    min: number,
    optMin: number,
    optMax: number,
    max: number,
  ): number {
    if (val < min || val > max) return 0;
    if (val >= optMin && val <= optMax) return 100;
    if (val < optMin) {
      return optMin === min ? 100 : ((val - min) / (optMin - min)) * 100;
    }
    return max === optMax ? 100 : ((max - val) / (max - optMax)) * 100;
  }

  private matchesSoilTrait(
    trait: { optimal: string[]; absolute: string[] },
    input: string | undefined,
    strict: boolean,
  ): boolean {
    if (!input) return true;
    const pool = strict ? trait.optimal : [...trait.optimal, ...trait.absolute];
    if (pool.length === 0) return true; // Ignore constraint if crop has no data for it
    return this.matchesAny(pool, input);
  }

  private matchesAny(values: string[], target: string): boolean {
    const t = target.trim().toLowerCase();
    return values.some((v) => v.toLowerCase().includes(t) || t.includes(v.toLowerCase()));
  }

  private matchesText(source: string, target: string): boolean {
    return source.trim().toLowerCase().includes(target.trim().toLowerCase());
  }
}
