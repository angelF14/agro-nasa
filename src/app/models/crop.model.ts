export type BotanicalFamily =
    | 'Fabaceae'
    | 'Poaceae'
    | 'Solanaceae'
    | 'Brassicaceae'
    | 'Asteraceae'
    | 'Cucurbitaceae';

export type RotationRole =
    | 'nitrogen-fixer'
    | 'high-extractor'
    | 'cover-crop'
    | 'pest-breaker';

export interface CropRequirements {
    minTempC: number;
    maxTempC: number;
    optimalPrecipitationMm: {
        min: number;
        max: number;
    };
    phRange: {
        min: number;
        max: number;
    };
    droughtTolerance: 'low' | 'moderate' | 'high';
    waterDemand: 'low' | 'moderate' | 'high';
}

export interface Crop {
    id: string;
    name: string;
    scientificName: string;
    family: BotanicalFamily;
    role: RotationRole;
    cycleDurationDays: number;
    requirements: CropRequirements;
    benefits: string[];
}

