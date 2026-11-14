/**
 * Calculates net water balance (Precipitation - Reference Evapotranspiration ET0) in mm.
 */
export function calculateWaterBalance(precipitationMm: number, evapotranspirationMm: number): number {
  return Number((precipitationMm - evapotranspirationMm).toFixed(2));
}
