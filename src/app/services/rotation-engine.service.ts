import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  ClimateSummary,
  Crop,
  CropEvaluation,
  EnvironmentAlert,
  FarmEnvironmentProfile,
  ParameterCheck,
  RotationCycleSuggestion,
  RotationPlan,
} from '@models/index';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';

export interface CropFilterCriteria {
  lifeSpan?: string;
  category?: string;
  temperature?: number;
  minTempObserved?: number;
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
  availableDays?: number;
  abioticTolerance?: string;
  excludeAbioticSusceptibility?: string;
  productionSystem?: string;
  strictOptimal?: boolean;
}

export interface ScoredCrop {
  crop: Crop;
  suitabilityScore: number;
}

@Injectable({
  providedIn: 'root',
})
export class RotationEngineService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private catalog: Crop[] = [];
  private catalogRequest$: Observable<Crop[]> | null = null;
  readonly catalogSignal = signal<Crop[]>([]);

  /**
   * Loads the minified EcoCrop catalog from /data/crops.json once and caches it in memory.
   */
  loadCatalog(): Observable<Crop[]> {
    if (this.catalog.length > 0) {
      return of(this.catalog);
    }
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }
    if (!this.catalogRequest$) {
      this.catalogRequest$ = this.http.get<Crop[]>('/data/crops.json').pipe(
        tap((crops) => {
          this.catalog = crops;
          this.catalogSignal.set(crops);
        }),
        catchError(() => {
          this.catalogRequest$ = null;
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.catalogRequest$;
  }

  /**
   * Allows setting the catalog directly (useful for unit tests).
   */
  setCatalogForTesting(crops: Crop[]): void {
    this.catalog = crops;
    this.catalogSignal.set(crops);
  }

  /**
   * 1. Returns all available crops currently loaded in memory.
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

      if (criteria.temperature !== undefined) {
        const minT = strict ? crop.temp.optMin : crop.temp.min;
        const maxT = strict ? crop.temp.optMax : crop.temp.max;
        if (criteria.temperature < minT || criteria.temperature > maxT) continue;
      }
      if (criteria.minTempObserved !== undefined) {
        const killTemp = crop.temp.killingEarlyGrowth ?? crop.temp.killingRest;
        if (killTemp !== null && criteria.minTempObserved <= killTemp) continue;
      }

      if (criteria.rainfall !== undefined) {
        const minR = strict ? crop.rain.optMin : crop.rain.min;
        const maxR = strict ? crop.rain.optMax : crop.rain.max;
        if (criteria.rainfall < minR || criteria.rainfall > maxR) continue;
      }

      if (criteria.ph !== undefined) {
        const minPh = strict ? (crop.ph.optMin ?? crop.ph.min) : (crop.ph.min ?? crop.ph.optMin);
        const maxPh = strict ? (crop.ph.optMax ?? crop.ph.max) : (crop.ph.max ?? crop.ph.optMax);
        if (minPh !== null && criteria.ph < minPh) continue;
        if (maxPh !== null && criteria.ph > maxPh) continue;
      }

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

      if (criteria.lightIntensity) {
        const allowedLights = strict
          ? [crop.light.optMin, crop.light.optMax]
          : [crop.light.min, crop.light.optMin, crop.light.optMax, crop.light.max];
        const validLights = allowedLights.filter((v): v is string => v !== null);
        if (validLights.length > 0 && !this.matchesAny(validLights, criteria.lightIntensity)) {
          continue;
        }
      }
      if (
        criteria.photoperiod &&
        crop.light.photoperiod.length > 0 &&
        !this.matchesAny(crop.light.photoperiod, criteria.photoperiod)
      ) {
        continue;
      }

      if (!this.matchesSoilTrait(crop.soil.depth, criteria.soilDepth, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.texture, criteria.soilTexture, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.fertility, criteria.soilFertility, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.alToxicity, criteria.alToxicity, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.salinity, criteria.salinity, strict)) continue;
      if (!this.matchesSoilTrait(crop.soil.drainage, criteria.drainage, strict)) continue;

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
   * 3. Retrieves a crop matching by scientific or common name.
   */
  getCropRequirements(query: string): Crop | null {
    const matches = this.searchCropRequirements(query);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Returns all matching crops (exact matches first, then partial matches).
   */
  searchCropRequirements(query: string): Crop[] {
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
   * 4. Evaluates how suitable a specific selected crop is for the given NASA POWER climate data.
   */
  evaluateCrop(crop: Crop, climate: Partial<ClimateSummary>): CropEvaluation {
    const checks: ParameterCheck[] = [];
    const weightedScores: number[] = [];
    let hardFailure = false;

    // 1. Temperature check (T2M vs EcoCrop temp)
    if (climate.meanTempC !== undefined) {
      const tScore = Math.round(
        this.trapezoidScore(
          climate.meanTempC,
          crop.temp.min,
          crop.temp.optMin,
          crop.temp.optMax,
          crop.temp.max
        )
      );
      weightedScores.push(tScore);
      if (tScore === 0) hardFailure = true;

      checks.push({
        label: 'Temperatura Media (T2M)',
        observed: `${climate.meanTempC} °C`,
        expected: `Óptimo ${crop.temp.optMin}–${crop.temp.optMax} °C (Abs: ${crop.temp.min}–${crop.temp.max} °C)`,
        status: tScore >= 80 ? 'optimal' : tScore > 0 ? 'acceptable' : 'out-of-range',
        score: tScore,
      });
    }

    // 2. Annualized Rainfall check (PRECTOTCORR annualized vs EcoCrop rain)
    const rainToCompare = climate.annualizedPrecipitationMm ?? climate.totalPrecipitationMm;
    if (rainToCompare !== undefined) {
      const rScore = Math.round(
        this.trapezoidScore(
          rainToCompare,
          crop.rain.min,
          crop.rain.optMin,
          crop.rain.optMax,
          crop.rain.max
        )
      );
      weightedScores.push(rScore);
      if (rScore === 0) hardFailure = true;

      checks.push({
        label: 'Precipitación Equivalente Anual',
        observed: `${rainToCompare} mm/año (${climate.totalPrecipitationMm ?? 0} mm en el período)`,
        expected: `Óptimo ${crop.rain.optMin}–${crop.rain.optMax} mm/año (Abs: ${crop.rain.min}–${crop.rain.max} mm)`,
        status: rScore >= 80 ? 'optimal' : rScore > 0 ? 'acceptable' : 'out-of-range',
        score: rScore,
      });
    }

    // 3. Frost / Killing Temperature check (T2M_MIN vs KTMP / KTMPR)
    if (climate.minTempC !== undefined) {
      const killTemp = crop.temp.killingEarlyGrowth ?? crop.temp.killingRest;
      if (killTemp !== null) {
        const survives = climate.minTempC > killTemp;
        const margin = climate.minTempC - killTemp;
        const fScore = !survives ? 0 : margin >= 4 ? 100 : Math.round((margin / 4) * 100);
        weightedScores.push(fScore);
        if (!survives) hardFailure = true;

        checks.push({
          label: 'Temperatura Mínima / Riesgo de Helada',
          observed: `${climate.minTempC} °C`,
          expected: `> ${killTemp} °C (umbral letal)`,
          status: fScore >= 80 ? 'optimal' : fScore > 0 ? 'acceptable' : 'out-of-range',
          score: fScore,
        });
      } else {
        const safeMin = climate.minTempC >= crop.temp.min;
        checks.push({
          label: 'Temperatura Mínima Observada',
          observed: `${climate.minTempC} °C`,
          expected: `≥ ${crop.temp.min} °C (mínimo absoluto)`,
          status: safeMin ? 'optimal' : 'acceptable',
          score: safeMin ? 100 : 60,
        });
      }
    }

    // 4. Altitude check (NASA geometry elevation vs ALTMX)
    if (climate.elevationM !== undefined) {
      if (crop.geography.altMax !== null) {
        const fitsAlt = climate.elevationM <= crop.geography.altMax;
        const aScore = fitsAlt ? 100 : 0;
        weightedScores.push(aScore);
        if (!fitsAlt) hardFailure = true;

        checks.push({
          label: 'Altitud de la Parcela (NASA DEM)',
          observed: `${climate.elevationM} m s.n.m.`,
          expected: `≤ ${crop.geography.altMax} m s.n.m.`,
          status: fitsAlt ? 'optimal' : 'out-of-range',
          score: aScore,
        });
      } else {
        checks.push({
          label: 'Altitud de la Parcela (NASA DEM)',
          observed: `${climate.elevationM} m s.n.m.`,
          expected: 'Sin restricción registrada en EcoCrop',
          status: 'unknown',
          score: null,
        });
      }
    }

    // 5. Growing Cycle Window check (analyzedDays vs GMIN..GMAX)
    if (climate.analyzedDays !== undefined && crop.agronomy.cycleDays.min !== null) {
      const minDays = crop.agronomy.cycleDays.min;
      const maxDays = crop.agronomy.cycleDays.max ?? minDays;
      const fitsWindow = climate.analyzedDays >= minDays;

      checks.push({
        label: 'Duración del Ciclo (GMIN–GMAX)',
        observed: `${climate.analyzedDays} días seleccionados`,
        expected: `${minDays}–${maxDays} días requeridos`,
        status: fitsWindow ? 'optimal' : 'acceptable',
        score: fitsWindow ? 100 : 50,
      });
    }

    const avgScore =
      weightedScores.length > 0
        ? Math.round(weightedScores.reduce((acc, s) => acc + s, 0) / weightedScores.length)
        : 0;
    const overallScore = hardFailure ? Math.min(avgScore, 35) : avgScore;
    const isViable = !hardFailure && overallScore >= 50;

    const displayName = crop.commonNames[0]
      ? `${crop.commonNames[0]} (${crop.scientificName})`
      : crop.scientificName;

    let summary: string;
    if (overallScore >= 80 && !hardFailure) {
      summary = `${displayName} presenta condiciones óptimas (${overallScore}%) en esta ubicación según los registros de NASA POWER.`;
    } else if (isViable) {
      summary = `${displayName} es viable con reservas (${overallScore}%): revisa los parámetros en rango aceptable para ajustar riego o manejo.`;
    } else {
      summary = `${displayName} tiene baja compatibilidad (${overallScore}%) con las condiciones climáticas/altitudinales observadas; revisa el plan de rotación sugerido.`;
    }

    return {
      crop,
      overallScore,
      isViable,
      summary,
      checks,
    };
  }

  /**
   * 5. Generates a 3-cycle crop rotation plan based on NASA POWER climate, soil, and the user's selected crop.
   */
  generatePlan(profile: FarmEnvironmentProfile, selectedCrop?: Crop): RotationPlan {
    const climate = profile.historicalClimate;
    const rainAnnual = climate.annualizedPrecipitationMm ?? climate.totalPrecipitationMm;

    const criteria: CropFilterCriteria = {
      temperature: climate.meanTempC,
      minTempObserved: climate.minTempC,
      rainfall: rainAnnual,
      altitude: climate.elevationM,
    };

    const candidates = this.findSuitableCrops(criteria);
    const cycles: RotationCycleSuggestion[] = [];
    const usedIds = new Set<string>();

    // Cycle 1: user-selected crop (or top candidate if none provided)
    const cycle1Crop = selectedCrop ?? candidates[0]?.crop;
    if (cycle1Crop) {
      const eval1 = this.evaluateCrop(cycle1Crop, climate);
      usedIds.add(cycle1Crop.id);

      cycles.push({
        cycleNumber: 1,
        crop: cycle1Crop,
        compatibilityScore: eval1.overallScore,
        reasons: [
          selectedCrop
            ? `Cultivo base seleccionado por el agricultor (${eval1.overallScore}% de aptitud climática NASA POWER).`
            : `Mejor ajuste climático directo para ${climate.meanTempC} °C y ${rainAnnual} mm/año.`,
          this.describeFamilyAndCategory(cycle1Crop),
        ],
        agronomicNotes: this.buildAgronomicNotes(cycle1Crop, climate),
      });
    }

    // Cycle 2: prioritize nitrogen-fixing legume (Fabaceae / pulses) from a different family than Cycle 1
    const prevFamily1 = cycle1Crop?.family ?? null;
    const cycle1IsLegume = cycle1Crop ? this.isLegume(cycle1Crop) : false;

    const cycle2Candidate = this.pickNextRotationCrop(candidates, {
      usedIds,
      avoidFamily: prevFamily1,
      preferLegume: !cycle1IsLegume,
    });

    if (cycle2Candidate) {
      usedIds.add(cycle2Candidate.crop.id);
      cycles.push({
        cycleNumber: 2,
        crop: cycle2Candidate.crop,
        compatibilityScore: cycle2Candidate.suitabilityScore,
        reasons: [
          this.isLegume(cycle2Candidate.crop)
            ? 'Leguminosa fijadora de nitrógeno seleccionada para reponer fertilidad tras el Ciclo 1.'
            : `Alternancia botánica (${cycle2Candidate.crop.family ?? cycle2Candidate.crop.category}) para cortar ciclos de plagas.`,
          `Alta compatibilidad (${cycle2Candidate.suitabilityScore}%) con ${climate.meanTempC} °C y ${rainAnnual} mm/año.`,
        ],
        agronomicNotes: this.buildAgronomicNotes(cycle2Candidate.crop, climate),
      });
    }

    // Cycle 3: pick a complementary family distinct from Cycle 2 (and ideally Cycle 1)
    const prevFamily2 = cycle2Candidate?.crop.family ?? prevFamily1;
    const cycle2IsLegume = cycle2Candidate ? this.isLegume(cycle2Candidate.crop) : false;

    const cycle3Candidate = this.pickNextRotationCrop(candidates, {
      usedIds,
      avoidFamily: prevFamily2,
      secondaryAvoidFamily: prevFamily1,
      preferLegume: !cycle1IsLegume && !cycle2IsLegume,
    });

    if (cycle3Candidate) {
      usedIds.add(cycle3Candidate.crop.id);
      cycles.push({
        cycleNumber: 3,
        crop: cycle3Candidate.crop,
        compatibilityScore: cycle3Candidate.suitabilityScore,
        reasons: [
          `Cierra la secuencia con familia distinta (${cycle3Candidate.crop.family ?? 'diversificada'}) aprovechando los nutrientes fijados.`,
          `Puntaje de adaptación NASA POWER: ${cycle3Candidate.suitabilityScore}%.`,
        ],
        agronomicNotes: this.buildAgronomicNotes(cycle3Candidate.crop, climate),
      });
    }

    const alerts = this.buildEnvironmentAlerts(climate, selectedCrop);
    const familiesUsed = cycles
      .map((c) => c.crop.family ?? c.crop.category)
      .filter(Boolean)
      .join(' → ');

    return {
      profile,
      cycles,
      alerts,
      soilHealthImpactSummary: familiesUsed
        ? `Secuencia diversificada (${familiesUsed}) diseñada para romper ciclos de patógenos, proteger la humedad del suelo y balancear la extracción de nitrógeno.`
        : 'Selecciona una ubicación y un cultivo para calcular el impacto en la salud del suelo.',
    };
  }

  // --- Private Helpers ---

  private pickNextRotationCrop(
    candidates: ScoredCrop[],
    options: {
      usedIds: Set<string>;
      avoidFamily: string | null;
      secondaryAvoidFamily?: string | null;
      preferLegume: boolean;
    }
  ): ScoredCrop | null {
    const available = candidates.filter((c) => !options.usedIds.has(c.crop.id));
    if (available.length === 0) return null;

    const differentFamily = available.filter((c) => {
      if (!options.avoidFamily || !c.crop.family) return true;
      if (c.crop.family.toLowerCase() === options.avoidFamily.toLowerCase()) return false;
      if (
        options.secondaryAvoidFamily &&
        c.crop.family.toLowerCase() === options.secondaryAvoidFamily.toLowerCase()
      ) {
        return false;
      }
      return true;
    });

    const pool = differentFamily.length > 0 ? differentFamily : available;

    if (options.preferLegume) {
      const legumeMatch = pool.find((c) => this.isLegume(c.crop) && c.suitabilityScore >= 60);
      if (legumeMatch) return legumeMatch;
    } else {
      const nonLegumeMatch = pool.find((c) => !this.isLegume(c.crop) && c.suitabilityScore >= 60);
      if (nonLegumeMatch) return nonLegumeMatch;
    }

    return pool[0] ?? null;
  }

  private isLegume(crop: Crop): boolean {
    const fam = (crop.family ?? '').toLowerCase();
    const cat = crop.category.toLowerCase();
    return fam === 'fabaceae' || fam.includes('legum') || cat.includes('legume') || cat.includes('pulse');
  }

  private describeFamilyAndCategory(crop: Crop): string {
    const fam = crop.family ? `Familia ${crop.family}` : 'Familia no especificada';
    const cycle =
      crop.agronomy.cycleDays.min && crop.agronomy.cycleDays.max
        ? `ciclo de ${crop.agronomy.cycleDays.min}–${crop.agronomy.cycleDays.max} días`
        : 'ciclo variable';
    return `${fam} (${crop.category}) — ${cycle}.`;
  }

  private buildAgronomicNotes(crop: Crop, climate: Partial<ClimateSummary>): string[] {
    const notes: string[] = [];
    if (this.isLegume(crop)) {
      notes.push('Incorporar rastrojo al final del ciclo para maximizar el aporte de nitrógeno al suelo.');
    } else {
      notes.push('Evitar sembrar la misma familia botánica en el lote inmediatamente después de la cosecha.');
    }

    const rainAnnual = climate.annualizedPrecipitationMm ?? climate.totalPrecipitationMm ?? 0;
    if (rainAnnual < crop.rain.optMin) {
      notes.push(
        `La lluvia anualizada (${rainAnnual} mm) está por debajo del óptimo (${crop.rain.optMin} mm): se recomienda cobertura (mulch) o riego complementario.`
      );
    } else if (rainAnnual > crop.rain.optMax) {
      notes.push(
        `Precipitación elevada (${rainAnnual} mm/año): asegurar buen drenaje en camas o curvas a nivel.`
      );
    }

    return notes;
  }

  private buildEnvironmentAlerts(
    climate: Partial<ClimateSummary>,
    selectedCrop?: Crop
  ): EnvironmentAlert[] {
    const alerts: EnvironmentAlert[] = [];

    if (climate.heatwaveRisk === 'high') {
      alerts.push({
        id: 'heat-high',
        severity: 'critical',
        category: 'heat',
        title: 'Riesgo Alto de Estrés Térmico',
        message: `NASA POWER registra picos de hasta ${climate.maxTempC} °C. Prioriza variedades tolerantes al calor y cobertura vegetal.`,
      });
    } else if (climate.heatwaveRisk === 'moderate') {
      alerts.push({
        id: 'heat-moderate',
        severity: 'warning',
        category: 'heat',
        title: 'Picos Térmicos Moderados',
        message: `Se observaron temperaturas máximas de ${climate.maxTempC} °C en el período analizado.`,
      });
    }

    const rainAnnual = climate.annualizedPrecipitationMm ?? climate.totalPrecipitationMm ?? 0;
    if (rainAnnual > 0 && rainAnnual < 500) {
      alerts.push({
        id: 'water-low',
        severity: 'warning',
        category: 'water',
        title: 'BajaDisponibilidad Hídrica Anualizada',
        message: `La precipitación anualizada es de ${rainAnnual} mm/año. Prioriza cultivos de baja demanda hídrica y abonos verdes de cobertura.`,
      });
    }

    if (selectedCrop && climate.minTempC !== undefined) {
      const killTemp = selectedCrop.temp.killingEarlyGrowth ?? selectedCrop.temp.killingRest;
      if (killTemp !== null && climate.minTempC <= killTemp) {
        alerts.push({
          id: 'frost-kill',
          severity: 'critical',
          category: 'heat',
          title: 'Riesgo de Helada / Temperatura Letal',
          message: `La mínima registrada (${climate.minTempC} °C) alcanza el umbral letal de ${selectedCrop.scientificName} (${killTemp} °C).`,
        });
      }
    }

    return alerts;
  }

  private calculateSuitabilityScore(crop: Crop, criteria: CropFilterCriteria): number {
    const scores: number[] = [];

    if (criteria.temperature !== undefined) {
      scores.push(
        this.trapezoidScore(
          criteria.temperature,
          crop.temp.min,
          crop.temp.optMin,
          crop.temp.optMax,
          crop.temp.max
        )
      );
    }

    if (criteria.rainfall !== undefined) {
      scores.push(
        this.trapezoidScore(
          criteria.rainfall,
          crop.rain.min,
          crop.rain.optMin,
          crop.rain.optMax,
          crop.rain.max
        )
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
        this.trapezoidScore(criteria.ph, crop.ph.min, crop.ph.optMin, crop.ph.optMax, crop.ph.max)
      );
    }

    if (scores.length === 0) return 100;
    const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    return Math.round(avg);
  }

  private trapezoidScore(
    val: number,
    min: number,
    optMin: number,
    optMax: number,
    max: number
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
    strict: boolean
  ): boolean {
    if (!input) return true;
    const pool = strict ? trait.optimal : [...trait.optimal, ...trait.absolute];
    if (pool.length === 0) return true;
    if (pool.some((v) => v.toLowerCase() === 'wide')) return true;
    return this.matchesAny(pool, input);
  }

  private matchesAny(values: string[], target: string): boolean {
    const t = target.trim().toLowerCase();
    return values.some((v) => v.toLowerCase().includes(t));
  }

  private matchesText(source: string, target: string): boolean {
    return source.trim().toLowerCase().includes(target.trim().toLowerCase());
  }
}
