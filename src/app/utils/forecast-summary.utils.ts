import { ClimateSummary, WeatherForecast } from '@models/index';
import { calculateWaterBalance } from './water-balance.utils';

const round = (value: number): number => Number(value.toFixed(2));

/**
 * Convierte el pronóstico diario de Open-Meteo (WeatherForecast) en un
 * resumen parcial compatible con FarmEnvironmentProfile.forecastClimate.
 *
 * Solo llena lo que Open-Meteo realmente entrega en el pronóstico
 * (temperatura, precipitación y ET0). Radiación solar, humedad y riesgo
 * de calor quedan sin definir, por eso el tipo es Partial<ClimateSummary>.
 */
export function forecastToClimateSummary(
  forecast: WeatherForecast,
  days = 7
): Partial<ClimateSummary> {
  const period = forecast.daily.slice(0, days);

  if (period.length === 0) {
    return {};
  }

  const totalPrecipitationMm = period.reduce((sum, d) => sum + (d.precipitationMm ?? 0), 0);
  const evapotranspirationMm = period.reduce((sum, d) => sum + (d.et0Mm ?? 0), 0);
  const meanTempC =
    period.reduce((sum, d) => sum + (d.temperatureMax + d.temperatureMin) / 2, 0) / period.length;

  return {
    meanTempC: round(meanTempC),
    maxTempC: Math.max(...period.map((d) => d.temperatureMax)),
    minTempC: Math.min(...period.map((d) => d.temperatureMin)),
    totalPrecipitationMm: round(totalPrecipitationMm),
    evapotranspirationMm: round(evapotranspirationMm),
    waterBalanceMm: calculateWaterBalance(totalPrecipitationMm, evapotranspirationMm),
  };
}
