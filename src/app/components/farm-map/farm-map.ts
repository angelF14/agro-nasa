import {
   afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Coordinates } from '@models/index';
import type * as L from 'leaflet';
import { catchError, finalize, of } from 'rxjs';

type LeafletNamespace = typeof L;
type LeafletModule = LeafletNamespace & { default?: LeafletNamespace };

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
}

interface NominatimReverseResult {
  display_name?: string;
}

@Component({
  selector: 'app-farm-map',
  imports: [FormsModule],
  templateUrl: './farm-map.html',
  styleUrl: './farm-map.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmMap {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  /** Coordenadas iniciales opcionales (por defecto: centro de México) */
  readonly initialCoordinates = input<Coordinates>({ lat: 23.6345, lon: -102.5528 });
  readonly initialZoom = input<number>(5);

  /** Emite { lat, lon } cada vez que el usuario selecciona un área/punto o busca una región */
  readonly coordinatesChange = output<Coordinates>();
  /** Emite el nombre legible de la región/ciudad seleccionada */
  readonly locationNameChange = output<string>();

  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<NominatimSearchResult[]>([]);
  protected readonly isSearching = signal(false);
  protected readonly searchError = signal<string | null>(null);

  protected readonly selectedCoords = signal<Coordinates | null>(null);
  protected readonly selectedLocationName = signal<string>('Haz clic en el mapa o busca un país, región o ciudad');

  private leafletLib: LeafletNamespace | null = null;
  private map: L.Map | null = null;
  private selectionMarker: L.CircleMarker | null = null;
  private selectionAreaCircle: L.Circle | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isDestroyed = false;

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        void this.initMap();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.isDestroyed = true;
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
    });
  }

  private async initMap(): Promise<void> {
    const leafletModule = (await import('leaflet')) as LeafletModule;
    if (this.isDestroyed) {
      return;
    }

    // In production (esbuild), CommonJS Leaflet resolves under `.default`; in Vite dev, exports sit on the namespace.
    const leaflet =
      typeof leafletModule.tileLayer === 'function' ? leafletModule : leafletModule.default;

    if (!leaflet || typeof leaflet.tileLayer !== 'function') {
      throw new Error('No se pudo inicializar Leaflet.');
    }

    this.leafletLib = leaflet;

    const start = this.initialCoordinates();
    const mapEl = this.mapContainer().nativeElement;

    const osmLayer = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    const satelliteLayer = leaflet.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri',
      }
    );

    this.map = leaflet.map(mapEl, {
      center: [start.lat, start.lon],
      zoom: this.initialZoom(),
      layers: [osmLayer],
    });

    leaflet.control
      .layers(
        {
          'Mapa Regional (OSM)': osmLayer,
          'Vista Satelital (Esri)': satelliteLayer,
        },
        {},
        { position: 'topright' }
      )
      .addTo(this.map);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.map?.invalidateSize();
      });
      this.resizeObserver.observe(mapEl);
    }

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      const wrapped = event.latlng.wrap();
      const coords: Coordinates = {
        lat: this.roundCoord(wrapped.lat),
        lon: this.roundCoord(wrapped.lng),
      };
      this.setSelectionOnMap(coords, false);
      this.reverseGeocode(coords);
    });
  }

  protected onSearchSubmit(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      return;
    }

    this.isSearching.set(true);
    this.searchError.set(null);

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(query)}`;

    this.http
      .get<NominatimSearchResult[]>(url, {
        headers: { 'Accept-Language': 'es' },
      })
      .pipe(
        catchError(() => {
          this.searchError.set('No se pudo consultar el buscador de ubicaciones.');
          return of([]);
        }),
        finalize(() => this.isSearching.set(false))
      )
      .subscribe((results) => {
        this.searchResults.set(results);
        if (results.length === 0 && !this.searchError()) {
          this.searchError.set('No se encontraron resultados para esa búsqueda.');
          return;
        }
        if (results.length > 0) {
          this.selectSearchResult(results[0], results.length === 1);
        }
      });
  }

  protected selectSearchResult(result: NominatimSearchResult, closeList = true): void {
    const coords: Coordinates = {
      lat: this.roundCoord( parseFloat(result.lat)),
      lon: this.roundCoord(parseFloat(result.lon)),
    };

    if (closeList) {
      this.searchResults.set([]);
    }

    this.selectedLocationName.set(result.display_name);
    this.locationNameChange.emit(result.display_name);

    this.setSelectionOnMap(coords, true, result.boundingbox);
  }

  protected locateUser(): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) {
      this.searchError.set('La geolocalización no está disponible en este navegador.');
      return;
    }

    this.searchError.set(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          lat: this.roundCoord(position.coords.latitude),
          lon: this.roundCoord(position.coords.longitude),
        };
        this.setSelectionOnMap(coords, true);
        this.reverseGeocode(coords);
      },
      () => {
        this.searchError.set('No se pudo obtener tu ubicación actual.');
      }
    );
  }

  private setSelectionOnMap(
    coords: Coordinates,
    flyTo: boolean,
    boundingBox?: [string, string, string, string]
  ): void {
    this.selectedCoords.set(coords);
    this.coordinatesChange.emit(coords);

    if (!this.map || !this.leafletLib) {
      return;
    }

    const L = this.leafletLib;
    const latLng: L.LatLngExpression = [coords.lat, coords.lon];

    if (!this.selectionAreaCircle) {
      this.selectionAreaCircle = L.circle(latLng, {
        radius: 15000,
        color: '#16a34a',
        weight: 2,
        fillColor: '#22c55e',
        fillOpacity: 0.2,
      }).addTo(this.map);
    } else {
      this.selectionAreaCircle.setLatLng(latLng);
    }

    if (!this.selectionMarker) {
      this.selectionMarker = L.circleMarker(latLng, {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: '#15803d',
        fillOpacity: 1,
      }).addTo(this.map);
    } else {
      this.selectionMarker.setLatLng(latLng);
    }

    this.selectionMarker
      .bindPopup(`<strong>Lat:</strong> ${coords.lat}<br><strong>Lon:</strong> ${coords.lon}`)
      .openPopup();

    if (flyTo) {
      if (boundingBox && boundingBox.length === 4) {
        const south = parseFloat(boundingBox[0]);
        const north = parseFloat(boundingBox[1]);
        const west = parseFloat(boundingBox[2]);
        const east = parseFloat(boundingBox[3]);
        this.map.flyToBounds(
          [
            [south, west],
            [north, east],
          ],
          { maxZoom: 11, duration: 1.0 }
        );
      } else {
        this.map.flyTo(latLng, Math.max(this.map.getZoom(), 9), { duration: 1.0 });
      }
    }
  }

  private reverseGeocode(coords: Coordinates): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&zoom=10`;

    this.http
      .get<NominatimReverseResult>(url, {
        headers: { 'Accept-Language': 'es' },
      })
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        const name =
          res?.display_name ?? `Región seleccionada (${coords.lat}, ${coords.lon})`;
        this.selectedLocationName.set(name);
        this.locationNameChange.emit(name);
      });
  }

  private roundCoord(value: number): number {
    return Math.round(value * 100000) / 100000;
  }
}
