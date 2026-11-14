import { Injectable } from '@angular/core';
import cropsCatalog from '@data/crops.json';
import { Crop, FarmEnvironmentProfile, RotationPlan } from '@models/index';

@Injectable({
  providedIn: 'root',
})
export class RotationEngineService {
  private readonly catalog: Crop[] = cropsCatalog as Crop[];

  /**
   * Returns all available crops from the curated local catalog.
   */
  getCatalog(): Crop[] {
    return this.catalog;
  }

  /**
   * Generates a 3-cycle crop rotation plan based on climate, soil, and farmer priorities.
   * TODO: Implement agronomic scoring, botanical family alternation, and alert generation.
   */
  generatePlan(profile: FarmEnvironmentProfile): RotationPlan {
    return {
      profile,
      cycles: [],
      alerts: [],
      soilHealthImpactSummary: '',
    };
  }
}
