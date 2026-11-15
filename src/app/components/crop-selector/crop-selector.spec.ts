import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Crop } from '@models/index';
import { RotationEngineService } from '@services/rotation-engine.service';
import { CropSelector } from './crop-selector';

function createCrop(index: number, hasOptimalRainfall: boolean): Crop {
  return {
    id: `${index}`,
    scientificName: `Crop ${index}`,
    commonNames: [`Crop ${index}`],
    family: 'Poaceae',
    category: 'cereals',
    lifeSpan: 'annual',
    temp: {
      min: 0,
      optMin: 15,
      optMax: 25,
      max: 40,
      killingEarlyGrowth: null,
      killingRest: null,
    },
    rain: hasOptimalRainfall
      ? { min: 100, optMin: 400, optMax: 600, max: 1000 }
      : { min: 100, optMin: 700, optMax: 900, max: 1000 },
    ph: { min: 4, optMin: 5, optMax: 7, max: 9 },
    geography: {
      latMin: null,
      latOptMin: null,
      latOptMax: null,
      latMax: null,
      altMax: null,
      climateZones: [],
    },
    light: { min: null, optMin: null, optMax: null, max: null, photoperiod: [] },
    soil: {
      depth: { optimal: [], absolute: [] },
      texture: { optimal: [], absolute: [] },
      fertility: { optimal: [], absolute: [] },
      alToxicity: { optimal: [], absolute: [] },
      salinity: { optimal: [], absolute: [] },
      drainage: { optimal: [], absolute: [] },
    },
    agronomy: {
      cycleDays: { min: 60, max: 120 },
      abioticTolerance: [],
      abioticSusceptibility: [],
      introductionRisk: [],
      productionSystem: [],
    },
  };
}

describe('CropSelector pagination', () => {
  let fixture: ComponentFixture<CropSelector>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CropSelector],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const service = TestBed.inject(RotationEngineService);
    service.setCatalogForTesting(
      Array.from({ length: 20 }, (_, index) => createCrop(index + 1, index < 5))
    );

    fixture = TestBed.createComponent(CropSelector);
    fixture.componentRef.setInput('climate', {
      meanTempC: 20,
      annualizedPrecipitationMm: 500,
    });
    fixture.detectChanges();
  });

  it('paginates both lists and resets the page when strict-optimal filtering changes the result count', () => {
    const clickButton = (text: string): void => {
      const button = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
      ).find((candidate) => candidate.textContent?.includes(text));
      expect(button).toBeDefined();
      button?.click();
      fixture.detectChanges();
    };
    const cropNames = (): string[] =>
      Array.from(
        fixture.nativeElement.querySelectorAll('.crop-item__name') as NodeListOf<HTMLElement>
      ).map((element) => element.textContent?.trim() ?? '');

    expect(cropNames().length).toBe(9);
    clickButton('Siguiente');
    expect(fixture.nativeElement.textContent).toContain('2 / 3');
    expect(cropNames()[0]).toBe('Crop 10');

    clickButton('Recomendados');
    expect(fixture.nativeElement.textContent).toContain('1 / 3');
    clickButton('Siguiente');
    expect(fixture.nativeElement.textContent).toContain('2 / 3');

    const strictToggle = fixture.nativeElement.querySelector(
      '.crop-optimal-filter input'
    ) as HTMLInputElement;
    strictToggle.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cultivos recomendados (5)');
    expect(cropNames()).toEqual(['Crop 1', 'Crop 2', 'Crop 3', 'Crop 4', 'Crop 5']);
    expect(fixture.nativeElement.textContent).toContain('1 / 1');
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('.list-pagination button') as NodeListOf<HTMLButtonElement>
      ).every((button) => button.disabled)
    ).toBeTrue();
  });
});
