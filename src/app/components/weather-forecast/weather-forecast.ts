
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { OpenMeteoService } from '@services/open-meteo.service';

import {
  Coordinates,
  WeatherForecast,
} from '@models/index';

@Component({
  selector: 'app-weather-forecast',
  imports: [CommonModule],
  templateUrl: './weather-forecast.html',
  styleUrl: './weather-forecast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherForecastComponent implements OnChanges {

  private readonly openMeteo = inject(OpenMeteoService);

  @Input({ required: true }) coords!: Coordinates;

  readonly forecast = signal<WeatherForecast | null>(null);

  readonly loading = signal(true);
  readonly error = signal(false);

  readonly selectedPeriod = signal<7 | 16>(7);

  /**
   * Detecta cuando el usuario selecciona
   * una parcela diferente en el mapa.
   */
  ngOnChanges(changes: SimpleChanges): void {
  console.log('WeatherForecast: ngOnChanges ejecutado');
  console.log('Cambios recibidos:', changes);
  console.log('Coordenadas:', this.coords);

  if (changes['coords'] && this.coords) {
    console.log('Coordenadas recibidas correctamente. Consultando API...');
    this.loadForecast();
  }
}

  /**
   * Consulta las condiciones meteorológicas.
   */
  loadForecast(): void {
  console.log('WeatherForecast: loadForecast ejecutado');
  console.log('Coordenadas enviadas:', this.coords);


    this.loading.set(true);
    this.error.set(false);

    this.openMeteo.getForecast(this.coords).subscribe({
      next: (data) => {
        this.forecast.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(
          'Error obteniendo datos de Open-Meteo:',
          err
        );

        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /**
   * Devuelve los días según el período seleccionado.
   */
  get displayedDays() {
    return this.forecast()?.daily.slice(
      0,
      this.selectedPeriod()
    ) ?? [];
  }

  /**
   * Calcula el balance hídrico estimado
   * de los próximos siete días.
   */
  get waterBalance(): number {
    const forecast = this.forecast();
    if (!forecast) return 0;

    const nextSevenDays = forecast.daily.slice(0, 7);

    const precipitation = nextSevenDays.reduce(
      (sum, day) => sum + day.precipitationMm,
      0
    );

    const et0 = nextSevenDays.reduce(
      (sum, day) => sum + day.et0Mm,
      0
    );

    return precipitation - et0;
  }

  /**
   * Traduce los códigos meteorológicos WMO.
   */
  getWeatherDescription(code: number): string {

    if (code === 0) return 'Despejado';

    if (code <= 3) return 'Parcialmente nublado';

    if (code <= 48) return 'Nublado o neblina';

    if (code <= 57) return 'Llovizna';

    if (code <= 67) return 'Lluvia';

    if (code <= 77) return 'Nieve';

    if (code <= 82) return 'Chubascos';

    if (code <= 86) return 'Nieve intensa';

    if (code <= 99) return 'Tormenta';

    return 'Sin descripción';
  }

  /**
   * Devuelve un icono según el código meteorológico.
   */
  getWeatherIcon(code: number): string {

    if (code === 0) return '☀️';

    if (code <= 3) return '⛅';

    if (code <= 48) return '☁️';

    if (code <= 57) return '🌦️';

    if (code <= 67) return '🌧️';

    if (code <= 77) return '❄️';

    if (code <= 82) return '🌧️';

    if (code <= 86) return '❄️';

    if (code <= 99) return '⛈️';

    return '🌡️';
  }

  /**
   * Formatea las fechas para Honduras.
   */
  formatDate(date: string): string {

    const [year, month, day] = date
      .split('-')
      .map(Number);

    return new Intl.DateTimeFormat('es-HN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(
      new Date(Date.UTC(year, month - 1, day))
    );
  }
}
