export interface Coordinates {
  lat: number;
  lon: number;
}

export type FarmerPriority =
  | 'water-conservation'
  | 'soil-regeneration'
  | 'heat-resilience'
  | 'nitrogen-recovery'
  | 'yield-stability';

export type SoilObservation =
  | 'compacted'
  | 'sandy'
  | 'low-retention'
  | 'erosion-prone'
  | 'saline'
  | 'healthy';

export interface FarmLocalContext {
  previousCropId?: string;
  soilObservations: SoilObservation[];
  priorities: FarmerPriority[];
}

export interface ClimateSummary {
  /** Mean temperature at 2m (°C) */
  meanTempC: number;
  /** Maximum temperature at 2m (°C) */
  maxTempC: number;
  /** Minimum temperature at 2m (°C) */
  minTempC: number;
  /** Total precipitation over analyzed period (mm) */
  totalPrecipitationMm: number;
  /** Annualized precipitation scaled to 365 days (mm/year) for EcoCrop comparison */
  annualizedPrecipitationMm?: number;
  /** Number of valid days in the analyzed period */
  analyzedDays?: number;
  /** Site elevation above sea level from NASA POWER geometry (m) */
  elevationM?: number;
  /** Mean solar radiation (MJ/m²/day) */
  solarRadiationMjM2Day: number;
  /** Mean relative humidity (%) */
  relativeHumidityPct: number;
  /** Reference evapotranspiration ET0 (mm) */
  evapotranspirationMm: number;
  /** Net water balance: precipitation - ET0 (mm) */
  waterBalanceMm: number;
  /** Estimated heatwave risk level */
  heatwaveRisk: 'low' | 'moderate' | 'high';
}

export interface SoilProfile {
  /** Soil pH in H2O */
  ph: number;
  /** Soil organic carbon (g/kg) */
  organicCarbonGKg: number;
  /** Nitrogen content (g/kg) */
  nitrogenGKg: number;
  /** Sand, silt, clay percentages */
  texture: {
    sandPct: number;
    siltPct: number;
    clayPct: number;
  };
  /** Bulk density (kg/dm³) */
  bulkDensityKgDm3: number;
  /** Data source indicator */
  source: 'soilgrids' | 'local-override' | 'combined';
}

export interface FarmEnvironmentProfile {
  coordinates: Coordinates;
  locationName?: string;
  localContext: FarmLocalContext;
  historicalClimate: ClimateSummary;
  forecastClimate?: Partial<ClimateSummary>;
  soil: SoilProfile;
  generatedAt: string;
}
