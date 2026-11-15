import { ClimateSummary, Coordinates, FarmerPriority, SoilObservation } from './farm-environment.model';

export type AgronomistRole = 'user' | 'model';

export interface AgronomistImagePayload {
  name: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Base64 encoded bytes without data URL prefix */
  dataBase64: string;
}

export interface AgronomistChatMessageDto {
  role: AgronomistRole;
  text: string;
  image?: AgronomistImagePayload;
}

export interface AgronomistMessage {
  id: string;
  role: AgronomistRole;
  text: string;
  createdAt: string;
  imagePreview?: {
    name: string;
    mimeType: string;
    dataUrl: string;
  };
  model?: string;
  usedFallback?: boolean;
  isError?: boolean;
}

export interface AgronomistCropSummary {
  id: string;
  commonName: string;
  scientificName: string;
  family: string | null;
  category: string;
  tempOptRangeC: string;
  rainOptRangeMm: string;
  phOptRange: string | null;
  cycleDaysRange: string | null;
}

export interface AgronomistParcelContext {
  coordinates?: Coordinates | null;
  locationName?: string;
  historicalClimate?: Partial<ClimateSummary> | null;
  weatherSummary?: {
    currentTempC: number;
    humidityPct: number;
    windSpeedKmh: number;
    waterBalance7dMm: number;
    precipitation7dMm: number;
    et07dMm: number;
    maxTemp7dC: number;
    minTemp7dC: number;
    forecastDaysCount: number;
  } | null;
  selectedCrop?: AgronomistCropSummary | null;
  cropEvaluation?: {
    overallScore: number;
    isViable: boolean;
    summary: string;
    checks: {
      label: string;
      observed: string;
      expected: string;
      status: string;
      score: number | null;
    }[];
  } | null;
  rotationPlan?: {
    soilHealthImpactSummary: string;
    alerts: { severity: string; title: string; message: string }[];
    cycles: {
      cycleNumber: number;
      cropName: string;
      scientificName: string;
      family: string | null;
      compatibilityScore: number;
      reasons: string[];
      agronomicNotes: string[];
    }[];
  } | null;
  localContext: {
    soilObservations: SoilObservation[];
    priorities: FarmerPriority[];
    customNotes?: string;
  };
}

export interface AgronomistChatRequest {
  messages: AgronomistChatMessageDto[];
  context?: AgronomistParcelContext;
}

export interface AgronomistChatResponse {
  reply: string;
  model: string;
  usedFallback?: boolean;
}

export interface AgronomistStatusResponse {
  configured: boolean;
  defaultModel: string;
  fallbackModel: string;
}
