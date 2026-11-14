export interface CropRequirements {
  lifeSpan: string;
  temp: {
    min: number;
    optMin: number;
    optMax: number;
    max: number;
    killingEarlyGrowth: number | null;
    killingRest: number | null;
  };
  rain: {
    min: number;
    optMin: number;
    optMax: number;
    max: number;
  };
  ph: {
    min: number | null;
    optMin: number | null;
    optMax: number | null;
    max: number | null;
  };
  geography: {
    latMin: number | null;
    latOptMin: number | null;
    latOptMax: number | null;
    latMax: number | null;
    altMax: number | null;
    climateZones: string[];
  };
  light: {
    min: string | null;
    optMin: string | null;
    optMax: string | null;
    max: string | null;
    photoperiod: string[];
  };
  soil: {
    depth: { optimal: string[]; absolute: string[] };
    texture: { optimal: string[]; absolute: string[] };
    fertility: { optimal: string[]; absolute: string[] };
    alToxicity: { optimal: string[]; absolute: string[] };
    salinity: { optimal: string[]; absolute: string[] };
    drainage: { optimal: string[]; absolute: string[] };
  };
  agronomy: {
    cycleDays: { min: number | null; max: number | null };
    abioticTolerance: string[];
    abioticSusceptibility: string[];
    introductionRisk: string[];
    productionSystem: string[];
  };
}

export interface Crop extends CropRequirements {
  id: string;
  scientificName: string;
  commonNames: string[];
  family: string | null;
  category: string;
}
