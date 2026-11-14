import { Crop } from './crop.model';
import { FarmEnvironmentProfile } from './farm-environment.model';

export interface ParameterCheck {
  label: string;
  observed: string;
  expected: string;
  status: 'optimal' | 'acceptable' | 'out-of-range' | 'unknown';
  score: number | null;
}

export interface CropEvaluation {
  crop: Crop;
  overallScore: number;
  isViable: boolean;
  summary: string;
  checks: ParameterCheck[];
}

export interface EnvironmentAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'water' | 'heat' | 'soil';
  title: string;
  message: string;
}

export interface RotationCycleSuggestion {
  cycleNumber: 1 | 2 | 3;
  crop: Crop;
  compatibilityScore: number;
  reasons: string[];
  agronomicNotes: string[];
}

export interface RotationPlan {
  profile: FarmEnvironmentProfile;
  cycles: RotationCycleSuggestion[];
  alerts: EnvironmentAlert[];
  soilHealthImpactSummary: string;
}
