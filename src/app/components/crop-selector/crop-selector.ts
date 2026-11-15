import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClimateSummary, Crop } from '@models/index';
import {
  CropFilterCriteria,
  RotationEngineService,
  ScoredCrop,
} from '@services/rotation-engine.service';

interface CategoryOption {
  value: string;
  label: string;
}

interface CropListItem {
  crop: Crop;
  suitabilityScore?: number;
}

@Component({
  selector: 'app-crop-selector',
  imports: [FormsModule],
  templateUrl: './crop-selector.html',
  styleUrl: './crop-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropSelector {
  private readonly rotationEngine = inject(RotationEngineService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly cropChange = output<Crop>();
  readonly climate = input<Partial<ClimateSummary> | null>(null);
  readonly isLoadingClimate = input<boolean>(false);
  readonly climateError = input<string | null>(null);

  protected readonly categories: CategoryOption[] = [
    { value: '', label: 'Todas las categorías' },
    { value: 'cereals', label: 'Cereales y granos' },
    { value: 'legumes', label: 'Leguminosas (Fijadoras N)' },
    { value: 'vegetables', label: 'Hortalizas y vegetales' },
    { value: 'roots', label: 'Raíces y tubérculos' },
    { value: 'fruits', label: 'Frutas y nueces' },
    { value: 'forage', label: 'Forraje y cobertura' },
  ];

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedCategory = signal<string>('');
  protected readonly isLoading = signal<boolean>(false);
  protected readonly selectedCrop = signal<Crop | null>(null);
  protected readonly pageSize = signal<number>(24);
  protected readonly cropsListType = signal<'all' | 'suggested'>('all');
  protected readonly strictOptimal = signal<boolean>(false);

  protected readonly allCrops = this.rotationEngine.catalogSignal;
  protected readonly hasScoringClimate = computed(() => {
    const climate = this.climate();
    return (
      climate?.meanTempC !== undefined ||
      climate?.annualizedPrecipitationMm !== undefined ||
      climate?.totalPrecipitationMm !== undefined
    );
  });
  protected readonly suggestedCrops = computed<ScoredCrop[]>(() => {
    const climate = this.climate();
    if (!climate) {
      return [];
    }

    const criteria: CropFilterCriteria = {};
    if (climate.meanTempC !== undefined) {
      criteria.temperature = climate.meanTempC;
    }
    const rainfall = climate.annualizedPrecipitationMm ?? climate.totalPrecipitationMm;
    if (rainfall !== undefined) {
      criteria.rainfall = rainfall;
    }
    if (climate.minTempC !== undefined) {
      criteria.minTempObserved = climate.minTempC;
    }
    if (climate.elevationM !== undefined) {
      criteria.altitude = climate.elevationM;
    }
    if (climate.analyzedDays !== undefined) {
      criteria.availableDays = climate.analyzedDays;
    }
    criteria.strictOptimal = this.strictOptimal();

    return this.hasScoringClimate() ? this.rotationEngine.findSuitableCrops(criteria) : [];
  });

  protected readonly filteredCrops = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory().trim().toLowerCase();
    const list = this.allCrops();

    return list.filter((crop) => {
      if (cat && !crop.category.toLowerCase().includes(cat)) {
        return false;
      }
      if (!query) {
        return true;
      }
      const sciMatch = crop.scientificName.toLowerCase().includes(query);
      const commonMatch = crop.commonNames.some((n) => n.toLowerCase().includes(query));
      const famMatch = (crop.family ?? '').toLowerCase().includes(query);
      return sciMatch || commonMatch || famMatch;
    });
  });

  protected readonly visibleCrops = computed(() => {
    const filteredIds = new Set(this.filteredCrops().map((crop) => crop.id));
    const list: CropListItem[] =
      this.cropsListType() === 'suggested'
        ? this.suggestedCrops()
            .filter(({ crop }) => filteredIds.has(crop.id))
            .map(({ crop, suitabilityScore }) => ({ crop, suitabilityScore }))
        : this.filteredCrops().map((crop) => ({ crop }));
    return list.slice(0, this.pageSize());
  });

  protected readonly activeCropCount = computed(() => {
    if (this.cropsListType() !== 'suggested') {
      return this.filteredCrops().length;
    }
    const filteredIds = new Set(this.filteredCrops().map((crop) => crop.id));
    return this.suggestedCrops().filter(({ crop }) => filteredIds.has(crop.id)).length;
  });

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.isLoading.set(true);
        this.rotationEngine.loadCatalog().subscribe(() => {
          this.isLoading.set(false);
        });
      }
    });
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageSize.set(24);
  }

  protected onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.pageSize.set(24);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.pageSize.set(24);
  }

  protected selectCrop(crop: Crop): void {
    this.selectedCrop.set(crop);
    this.cropChange.emit(crop);
  }

  protected showMore(): void {
    this.pageSize.update((curr) => curr + 24);
  }

  protected primaryName(crop: Crop): string {
    return crop.commonNames[0] || crop.scientificName;
  }

  //SUGGESTED CROPS
  protected onCropsListTypeChange(value: 'all' | 'suggested'): void {
    this.cropsListType.set(value);
    this.pageSize.set(24);
  }

  protected onStrictOptimalChange(value: boolean): void {
    this.strictOptimal.set(value);
    this.pageSize.set(24);
  }
}
