import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Crop, FarmEnvironmentProfile } from '@models/index';
import { RotationEngineService } from './rotation-engine.service';

const SAMPLE_CROPS: Crop[] = [
  {
    id: '1668',
    scientificName: 'Phaseolus vulgaris',
    commonNames: ['common bean', 'frijol'],
    family: 'Fabaceae',
    category: 'pulses (grain legumes), vegetables',
    lifeSpan: 'annual',
    temp: { min: 7, optMin: 16, optMax: 25, max: 32, killingEarlyGrowth: 0, killingRest: null },
    rain: { min: 300, optMin: 500, optMax: 2000, max: 4300 },
    ph: { min: 4, optMin: 5.5, optMax: 7.5, max: 9 },
    geography: {
      latMin: 20,
      latOptMin: null,
      latOptMax: null,
      latMax: 60,
      altMax: 3000,
      climateZones: [],
    },
    light: { min: null, optMin: null, optMax: null, max: null, photoperiod: [] },
    soil: {
      depth: { optimal: ['medium (50-150 cm)'], absolute: [] },
      texture: { optimal: ['medium'], absolute: [] },
      fertility: { optimal: [], absolute: [] },
      alToxicity: { optimal: [], absolute: [] },
      salinity: { optimal: [], absolute: [] },
      drainage: { optimal: [], absolute: [] },
    },
    agronomy: {
      cycleDays: { min: 50, max: 270 },
      abioticTolerance: [],
      abioticSusceptibility: [],
      introductionRisk: [],
      productionSystem: [],
    },
  },
  {
    id: '238663',
    scientificName: 'Zea mays ssp. mays',
    commonNames: ['corn', 'maize'],
    family: 'Poaceae',
    category: 'cereals & pseudocereals',
    lifeSpan: 'annual',
    temp: { min: 10, optMin: 18, optMax: 33, max: 47, killingEarlyGrowth: 0, killingRest: null },
    rain: { min: 400, optMin: 600, optMax: 1200, max: 1800 },
    ph: { min: 4.5, optMin: 5, optMax: 7, max: 8.5 },
    geography: {
      latMin: 40,
      latOptMin: null,
      latOptMax: null,
      latMax: 48,
      altMax: 4000,
      climateZones: [],
    },
    light: { min: null, optMin: null, optMax: null, max: null, photoperiod: [] },
    soil: {
      depth: { optimal: [], absolute: [] },
      texture: { optimal: ['wide'], absolute: [] },
      fertility: { optimal: [], absolute: [] },
      alToxicity: { optimal: [], absolute: [] },
      salinity: { optimal: [], absolute: [] },
      drainage: { optimal: [], absolute: [] },
    },
    agronomy: {
      cycleDays: { min: 65, max: 365 },
      abioticTolerance: [],
      abioticSusceptibility: [],
      introductionRisk: [],
      productionSystem: [],
    },
  },
  {
    id: '1990',
    scientificName: 'Solanum tuberosum',
    commonNames: ['potato', 'papa'],
    family: 'Solanaceae',
    category: 'roots & tubers',
    lifeSpan: 'annual',
    temp: { min: 7, optMin: 15, optMax: 20, max: 28, killingEarlyGrowth: -1, killingRest: null },
    rain: { min: 400, optMin: 500, optMax: 800, max: 1500 },
    ph: { min: 4.2, optMin: 5, optMax: 6.2, max: 8.5 },
    geography: {
      latMin: null,
      latOptMin: null,
      latOptMax: null,
      latMax: null,
      altMax: 4000,
      climateZones: [],
    },
    light: { min: null, optMin: null, optMax: null, max: null, photoperiod: [] },
    soil: {
      depth: { optimal: [], absolute: [] },
      texture: { optimal: ['medium'], absolute: [] },
      fertility: { optimal: [], absolute: [] },
      alToxicity: { optimal: [], absolute: [] },
      salinity: { optimal: [], absolute: [] },
      drainage: { optimal: [], absolute: [] },
    },
    agronomy: {
      cycleDays: { min: 90, max: 160 },
      abioticTolerance: [],
      abioticSusceptibility: [],
      introductionRisk: [],
      productionSystem: [],
    },
  },
];

describe('RotationEngineService', () => {
  let service: RotationEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient()],
    });
    service = TestBed.inject(RotationEngineService);
    service.setCatalogForTesting(SAMPLE_CROPS);
  });

  it('evaluates a crop against NASA POWER parameters', () => {
    const potato = SAMPLE_CROPS[2];
    const evaluation = service.evaluateCrop(potato, {
      meanTempC: 17.8,
      minTempC: 10.5,
      maxTempC: 23.0,
      totalPrecipitationMm: 720,
      annualizedPrecipitationMm: 720,
      analyzedDays: 365,
      elevationM: 1850,
    });

    expect(evaluation.isViable).toBeTrue();
    expect(evaluation.overallScore).toBeGreaterThanOrEqual(80);
  });

  it('limits suitable crops to optimal temperature and rainfall when strictOptimal is enabled', () => {
    const standardResults = service.findSuitableCrops({ temperature: 15, rainfall: 500 });
    const strictResults = service.findSuitableCrops({
      temperature: 15,
      rainfall: 500,
      strictOptimal: true,
    });

    expect(standardResults.length).toBe(3);
    expect(strictResults.map(({ crop }) => crop.id)).toEqual(['1990']);
  });

  it('generates a 3-cycle rotation alternating botanical families and including a legume', () => {
    const potato = SAMPLE_CROPS[2];
    const profile: FarmEnvironmentProfile = {
      coordinates: { lat: 14.3167, lon: -88.1833 },
      localContext: { soilObservations: [], priorities: [] },
      historicalClimate: {
        meanTempC: 18.5,
        maxTempC: 24.0,
        minTempC: 11.0,
        totalPrecipitationMm: 750,
        annualizedPrecipitationMm: 750,
        analyzedDays: 365,
        elevationM: 1800,
        solarRadiationMjM2Day: 18,
        relativeHumidityPct: 75,
        evapotranspirationMm: 0,
        waterBalanceMm: 0,
        heatwaveRisk: 'low',
      },
      soil: {
        ph: 6.0,
        organicCarbonGKg: 0,
        nitrogenGKg: 0,
        texture: { sandPct: 33, siltPct: 34, clayPct: 33 },
        bulkDensityKgDm3: 1.3,
        source: 'soilgrids',
      },
      generatedAt: new Date().toISOString(),
    };

    const plan = service.generatePlan(profile, potato);
    expect(plan.cycles.length).toBe(3);
    expect(plan.cycles[0].crop.id).toBe('1990'); // Solanaceae
    expect(plan.cycles[1].crop.family).toBe('Fabaceae'); // Legume prioritized in Cycle 2
    expect(plan.cycles[2].crop.family).toBe('Poaceae'); // Distinct family in Cycle 3
  });
});
