import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClimateSummary, Crop } from '@models/index';
import { LanguageService } from '@services/language.service';
import {
  CropFilterCriteria,
  RotationEngineService,
  ScoredCrop,
} from '@services/rotation-engine.service';
import {
  getLocalizedCropName,
  normalizeSearchText,
  searchCatalogWithAliases,
  SPANISH_CROP_ALIASES,
} from '@utils/agronomist-query-parser.utils';

const PRIORITIZED_SCIENTIFIC_NAMES = new Set(
  SPANISH_CROP_ALIASES.flatMap((a) => a.scientificTargets.map((s) => s.toLowerCase()))
);

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
  protected readonly i18n = inject(LanguageService);
  private readonly rotationEngine = inject(RotationEngineService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly externalSelectedCrop = input<Crop | null>(null);
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
  protected readonly cropsListType = signal<'all' | 'suggested'>('all');
  protected readonly strictOptimal = signal<boolean>(false);
  protected readonly currentPage = signal<number>(1);
  /** Escritorio: 3 filas × 3 columnas (9). Teléfono (≤720px): 6 por página. */
  protected readonly pageSize = signal<number>(9);

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
    const query = normalizeSearchText(this.searchQuery());
    const cat = this.selectedCategory().trim().toLowerCase();
    const list = this.allCrops();
    const active = this.selectedCrop();

    let baseList: Crop[];
    if (query) {
      baseList = searchCatalogWithAliases(query, list);
    } else {
      const stapleCrops: Crop[] = [];
      const otherCrops: Crop[] = [];
      for (const crop of list) {
        if (PRIORITIZED_SCIENTIFIC_NAMES.has(crop.scientificName.toLowerCase())) {
          stapleCrops.push(crop);
        } else {
          otherCrops.push(crop);
        }
      }
      baseList = [...stapleCrops, ...otherCrops];
    }

    const filtered = baseList.filter((crop) => {
      if (cat && !crop.category.toLowerCase().includes(cat)) {
        return false;
      }
      return true;
    });

    if (active && filtered.some((c) => c.id === active.id)) {
      return [active, ...filtered.filter((c) => c.id !== active.id)];
    }

    return filtered;
  });

  protected readonly activeCrops = computed<CropListItem[]>(() => {
    const filteredIds = new Set(this.filteredCrops().map((crop) => crop.id));
    return this.cropsListType() === 'suggested'
      ? this.suggestedCrops()
          .filter(({ crop }) => filteredIds.has(crop.id))
          .map(({ crop, suitabilityScore }) => ({ crop, suitabilityScore }))
      : this.filteredCrops().map((crop) => ({ crop }));
  });

  protected readonly activeCropCount = computed(() => this.activeCrops().length);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.activeCropCount() / this.pageSize())),
  );

  protected readonly page = computed(() => Math.min(this.currentPage(), this.totalPages()));

  protected readonly visibleCrops = computed(() => {
    const size = this.pageSize();
    const start = (this.page() - 1) * size;
    return this.activeCrops().slice(start, start + size);
  });

  constructor() {
    effect(() => {
      const ext = this.externalSelectedCrop();
      if (ext) {
        this.selectedCrop.set(ext);
      }
    });

    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.isLoading.set(true);
        this.rotationEngine.loadCatalog().subscribe(() => {
          this.isLoading.set(false);
        });

        const mobileQuery = window.matchMedia('(max-width: 720px)');
        const updatePageSize = () => this.pageSize.set(mobileQuery.matches ? 6 : 9);
        updatePageSize();
        mobileQuery.addEventListener('change', updatePageSize);
        this.destroyRef.onDestroy(() => mobileQuery.removeEventListener('change', updatePageSize));
      }
    });
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.currentPage.set(1);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.currentPage.set(1);
  }

  protected selectCrop(crop: Crop): void {
    this.selectedCrop.set(crop);
    this.cropChange.emit(crop);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  protected primaryName(crop: Crop): string {
    return getLocalizedCropName(crop, this.i18n.language());
  }

  //SUGGESTED CROPS
  protected onCropsListTypeChange(value: 'all' | 'suggested'): void {
    this.cropsListType.set(value);
    this.currentPage.set(1);
  }

  protected onStrictOptimalChange(value: boolean): void {
    this.strictOptimal.set(value);
    this.currentPage.set(1);
  }
}
