export interface CropRequirements {
  temp: { min: number; optMin: number; optMax: number; max: number };
  rain: { min: number; optMin: number; optMax: number; max: number };
  ph: { min: number | null; optMin: number | null; optMax: number | null; max: number | null };
  cycleDays: { min: number | null; max: number | null };
  soilTexture: string[];
  soilDepth: string | null;
}

export interface Crop extends CropRequirements {
  id: string;
  scientificName: string;
  commonNames: string[];
  category: string;
  lifeSpan: string;
}
