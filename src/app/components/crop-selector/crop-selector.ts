import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Crop } from '@models/index';
import { RotationEngineService } from '@services/rotation-engine.service';
import {
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

  readonly externalSelectedCrop = input<Crop | null>(null);
  readonly cropChange = output<Crop>();

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

  protected readonly allCrops = this.rotationEngine.catalogSignal;

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

  protected readonly visibleCrops = computed(() => {
    return this.filteredCrops().slice(0, this.pageSize());
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
}
