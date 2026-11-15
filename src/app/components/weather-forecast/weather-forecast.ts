import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Coordinates, DailyWeatherForecast, WeatherForecast } from '@models/index';
import { OpenMeteoService } from '@services/open-meteo.service';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';

export type WeatherIconKind =
  | 'sun'
  | 'partly-cloudy'
  | 'cloud'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'thermometer';

export type ForecastFilter = 'all' | 'rainy';

export interface ForecastDayView {
  day: DailyWeatherForecast;
  /** Posición original dentro del pronóstico (0 = hoy). */
  index: number;
}

@Component({
  selector: 'app-weather-forecast',
  imports: [CommonModule],
  templateUrl: './weather-forecast.html',
  styleUrl: './weather-forecast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherForecastComponent implements OnChanges {
  private readonly openMeteo = inject(OpenMeteoService);
  private readonly forecastRequest$ = new Subject<Coordinates>();

  @Input({ required: true }) coords!: Coordinates;

  readonly forecast = signal<WeatherForecast | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly selectedPeriod = signal<7 | 16>(7);
  readonly dayFilter = signal<ForecastFilter>('all');
  private readonly selectedDate = signal<string | null>(null);

  /** Umbral (mm) a partir del cual un día se considera lluvioso. */
  private readonly rainyThresholdMm = 1;
  /** Referencia (mm/día) para escalar la barra de ET₀. */
  private readonly et0ScaleMm = 8;

  /** Días visibles según horizonte y filtro, conservando su índice original. */
  readonly visibleDays = computed<ForecastDayView[]>(() => {
    const days = (this.forecast()?.daily ?? [])
      .slice(0, this.selectedPeriod())
      .map((day, index) => ({ day, index }));

    return this.dayFilter() === 'rainy'
      ? days.filter(({ day }) => day.precipitationMm >= this.rainyThresholdMm)
      : days;
  });

  /** Día seleccionado; si no está visible, se usa el primero de la lista. */
  readonly selectedDay = computed<ForecastDayView | null>(() => {
    const days = this.visibleDays();
    const date = this.selectedDate();
    return days.find(({ day }) => day.date === date) ?? days[0] ?? null;
  });

  readonly selectedPosition = computed(() => {
    const selected = this.selectedDay();
    return selected ? this.visibleDays().indexOf(selected) : -1;
  });

  readonly forecastSummary = computed(() => {
    const days = this.visibleDays().map(({ day }) => day);
    const count = days.length || 1;
    const maxPrecipitation = Math.max(1, ...days.map((d) => d.precipitationMm));
    const minTemp = days.length ? Math.min(...days.map((d) => d.temperatureMin)) : 0;
    const maxTemp = days.length ? Math.max(...days.map((d) => d.temperatureMax)) : 1;

    return {
      avgMax: days.reduce((sum, d) => sum + d.temperatureMax, 0) / count,
      totalPrecipitation: days.reduce((sum, d) => sum + d.precipitationMm, 0),
      avgEt0: days.reduce((sum, d) => sum + d.et0Mm, 0) / count,
      maxPrecipitation,
      minTemp,
      tempSpan: Math.max(1, maxTemp - minTemp),
    };
  });

  constructor() {
    this.forecastRequest$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(false);
        }),
        switchMap((coords) =>
          this.openMeteo.getForecast(coords).pipe(
            catchError(() => {
              this.error.set(true);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((data) => {
        if (data) {
          this.forecast.set(data);
        }
        this.loading.set(false);
      });
  }

  /**
   * Detecta cuando el usuario selecciona una parcela diferente en el mapa.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coords'] && this.coords) {
      this.loadForecast();
    }
  }

  /**
   * Consulta las condiciones meteorológicas cancelando peticiones previas en curso.
   */
  loadForecast(): void {
    if (!this.coords) {
      return;
    }
    this.forecastRequest$.next(this.coords);
  }

  selectDay(date: string): void {
    this.selectedDate.set(date);
  }

  /** Mueve la selección al día anterior (-1) o siguiente (+1) visible. */
  stepDay(direction: -1 | 1): void {
    const days = this.visibleDays();
    const target = days[this.selectedPosition() + direction];
    if (target) {
      this.selectedDate.set(target.day.date);
    }
  }

  /** Clasificación de la lluvia esperada del día. */
  getRainLabel(mm: number): string {
    if (mm < 0.1) return 'Sin lluvia';
    if (mm < 2.5) return 'Lluvia ligera';
    if (mm < 7.6) return 'Lluvia moderada';
    return 'Lluvia fuerte';
  }

  /** Porcentaje de la barra de lluvia relativo al día más lluvioso visible. */
  getRainPercent(mm: number): number {
    return Math.min(100, (mm / this.forecastSummary().maxPrecipitation) * 100);
  }

  getEt0Percent(mm: number): number {
    return Math.min(100, (mm / this.et0ScaleMm) * 100);
  }

  /** Posición de la barra de rango térmico dentro del rango visible. */
  getTempRange(day: DailyWeatherForecast): { left: number; width: number } {
    const { minTemp, tempSpan } = this.forecastSummary();
    const left = ((day.temperatureMin - minTemp) / tempSpan) * 100;
    const width = ((day.temperatureMax - day.temperatureMin) / tempSpan) * 100;
    return { left, width: Math.max(4, width) };
  }

  /** Recomendación de riego comparando lluvia esperada contra ET₀. */
  getIrrigationAdvice(day: DailyWeatherForecast): string {
    const rain = day.precipitationMm;
    const et0 = day.et0Mm;
    const deficit = Math.max(0, et0 - rain).toFixed(1);

    if (rain >= et0) {
      return `La lluvia esperada (${rain} mm) supera la demanda hídrica (${et0} mm). Se recomienda suspender el riego programado.`;
    }
    if (rain >= et0 / 2) {
      return `La lluvia cubre parcialmente la demanda hídrica. Se recomienda un riego complementario de aprox. ${deficit} mm.`;
    }
    return `La lluvia esperada no cubre la demanda hídrica. Se recomienda regar aprox. ${deficit} mm para compensar el ET₀.`;
  }

  /**
   * Devuelve los días según el período seleccionado.
   */
  get displayedDays() {
    return this.forecast()?.daily.slice(0, this.selectedPeriod()) ?? [];
  }

  /**
   * Calcula el balance hídrico estimado de los próximos siete días.
   */
  get waterBalance(): number {
    const forecast = this.forecast();
    if (!forecast) return 0;

    const nextSevenDays = forecast.daily.slice(0, 7);
    const precipitation = nextSevenDays.reduce((sum, day) => sum + day.precipitationMm, 0);
    const et0 = nextSevenDays.reduce((sum, day) => sum + day.et0Mm, 0);

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
   * Mapea códigos meteorológicos WMO a identificadores semánticos de icono SVG.
   */
  getWeatherKind(code: number): WeatherIconKind {
    if (code === 0) return 'sun';
    if (code <= 3) return 'partly-cloudy';
    if (code <= 48) return 'cloud';
    if (code <= 57) return 'drizzle';
    if (code <= 67 || (code >= 80 && code <= 82)) return 'rain';
    if (code <= 77 || (code >= 85 && code <= 86)) return 'snow';
    if (code <= 99) return 'storm';
    return 'thermometer';
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
    const [year, month, day] = date.split('-').map(Number);

    return new Intl.DateTimeFormat('es-HN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
}
