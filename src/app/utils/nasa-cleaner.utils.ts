export const NASA_FILL_VALUE = -999;

/**
 * Filters out NASA POWER fill values (-999) and non-finite numbers from a daily series.
 */
export function filterNasaFillValues(values: number[]): number[] {
  return values.filter((value) => Number.isFinite(value) && value !== NASA_FILL_VALUE);
}

/**
 * Computes the arithmetic mean of valid NASA POWER measurements.
 */
export function meanValidNasaValues(values: number[]): number {
  const valid = filterNasaFillValues(values);
  if (valid.length === 0) {
    return 0;
  }
  const sum = valid.reduce((acc, current) => acc + current, 0);
  return sum / valid.length;
}
