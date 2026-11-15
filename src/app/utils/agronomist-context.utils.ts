import {
  AgronomistCropSummary,
  AgronomistParcelContext,
  ClimateSummary,
  Coordinates,
  Crop,
  CropEvaluation,
  FarmerPriority,
  RotationPlan,
  SoilObservation,
  WeatherForecast,
} from '@models/index';
import { calculateWaterBalance } from './water-balance.utils';

export interface AgronomistContextSource {
  coordinates: Coordinates | null;
  locationName: string;
  climateSummary: Partial<ClimateSummary> | null;
  weatherForecast: WeatherForecast | null;
  selectedCrop: Crop | null;
  cropEvaluation: CropEvaluation | null;
  rotationPlan: RotationPlan | null;
  soilObservations: SoilObservation[];
  priorities: FarmerPriority[];
  customNotes: string;
}

export function summarizeCropForAgronomist(crop: Crop): AgronomistCropSummary {
  const phRange =
    crop.ph.optMin !== null && crop.ph.optMax !== null
      ? `${crop.ph.optMin}–${crop.ph.optMax} (abs ${crop.ph.min ?? '?'}–${crop.ph.max ?? '?'})`
      : null;

  const cycleDaysRange =
    crop.agronomy.cycleDays.min !== null
      ? `${crop.agronomy.cycleDays.min}–${crop.agronomy.cycleDays.max ?? crop.agronomy.cycleDays.min} días`
      : null;

  return {
    id: crop.id,
    commonName: crop.commonNames[0] || crop.scientificName,
    scientificName: crop.scientificName,
    family: crop.family,
    category: crop.category,
    tempOptRangeC: `${crop.temp.optMin}–${crop.temp.optMax} °C (abs ${crop.temp.min}–${crop.temp.max} °C)`,
    rainOptRangeMm: `${crop.rain.optMin}–${crop.rain.optMax} mm/año (abs ${crop.rain.min}–${crop.rain.max} mm)`,
    phOptRange: phRange,
    cycleDaysRange,
  };
}

export function buildAgronomistContext(source: AgronomistContextSource): AgronomistParcelContext {
  const weather = source.weatherForecast;
  let weatherSummary: AgronomistParcelContext['weatherSummary'] = null;

  if (weather && weather.daily.length > 0) {
    const next7 = weather.daily.slice(0, 7);
    const rain7d = Number(next7.reduce((sum, d) => sum + d.precipitationMm, 0).toFixed(1));
    const et07d = Number(next7.reduce((sum, d) => sum + d.et0Mm, 0).toFixed(1));

    weatherSummary = {
      currentTempC: weather.current.temperature,
      humidityPct: weather.current.relativeHumidity,
      windSpeedKmh: weather.current.windSpeed,
      precipitation7dMm: rain7d,
      et07dMm: et07d,
      waterBalance7dMm: calculateWaterBalance(rain7d, et07d),
      maxTemp7dC: Math.max(...next7.map((d) => d.temperatureMax)),
      minTemp7dC: Math.min(...next7.map((d) => d.temperatureMin)),
      forecastDaysCount: weather.daily.length,
    };
  }

  return {
    coordinates: source.coordinates,
    locationName: source.locationName || undefined,
    historicalClimate: source.climateSummary,
    weatherSummary,
    selectedCrop: source.selectedCrop ? summarizeCropForAgronomist(source.selectedCrop) : null,
    cropEvaluation: source.cropEvaluation
      ? {
          overallScore: source.cropEvaluation.overallScore,
          isViable: source.cropEvaluation.isViable,
          summary: source.cropEvaluation.summary,
          checks: source.cropEvaluation.checks.map((c) => ({
            label: c.label,
            observed: c.observed,
            expected: c.expected,
            status: c.status,
            score: c.score,
          })),
        }
      : null,
    rotationPlan: source.rotationPlan
      ? {
          soilHealthImpactSummary: source.rotationPlan.soilHealthImpactSummary,
          alerts: source.rotationPlan.alerts.map((a) => ({
            severity: a.severity,
            title: a.title,
            message: a.message,
          })),
          cycles: source.rotationPlan.cycles.map((cy) => ({
            cycleNumber: cy.cycleNumber,
            cropName: cy.crop.commonNames[0] || cy.crop.scientificName,
            scientificName: cy.crop.scientificName,
            family: cy.crop.family,
            compatibilityScore: cy.compatibilityScore,
            reasons: cy.reasons,
            agronomicNotes: cy.agronomicNotes,
          })),
        }
      : null,
    localContext: {
      soilObservations: source.soilObservations,
      priorities: source.priorities,
      customNotes: source.customNotes.trim() || undefined,
    },
  };
}
