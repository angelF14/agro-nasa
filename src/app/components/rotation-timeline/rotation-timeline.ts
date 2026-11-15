import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Crop, CropEvaluation, ParameterCheck, RotationPlan } from '@models/index';

type CheckKind = 'temp' | 'rain' | 'frost' | 'altitude' | 'cycle';
type CheckStatus = ParameterCheck['status'];

interface CheckCopy {
  title: string;
  meter: string;
  observedKey: string;
  expectedKey: string;
  advice: Record<CheckStatus, string>;
}

/** Textos amigables por parámetro (solo presentación, no alteran los datos). */
const CHECK_COPY: Record<CheckKind, CheckCopy> = {
  rain: {
    title: 'Cantidad de lluvia al año',
    meter: 'Nivel de agua',
    observedKey: 'En tu terreno',
    expectedKey: 'Ideal para cultivo',
    advice: {
      optimal: 'La lluvia de tu zona cubre lo que necesita el cultivo.',
      acceptable: 'La lluvia es algo justa; considera riego de apoyo en épocas secas.',
      'out-of-range': 'La lluvia está fuera de lo que tolera el cultivo; necesitará riego o manejo del agua.',
      unknown: 'No hay datos suficientes de lluvia para evaluar.',
    },
  },
  temp: {
    title: 'Temperatura del lugar',
    meter: 'Adecuación térmica',
    observedKey: 'Promedio actual',
    expectedKey: 'Ideal para cultivo',
    advice: {
      optimal: 'La temperatura es ideal para que el cultivo crezca bien.',
      acceptable: 'La temperatura no es la ideal; el cultivo crecerá más lento.',
      'out-of-range': 'La temperatura está fuera del rango que soporta el cultivo.',
      unknown: 'No hay datos suficientes de temperatura para evaluar.',
    },
  },
  frost: {
    title: 'Frío máximo registrado',
    meter: 'Tolerancia al frío',
    observedKey: 'Mínima en zona',
    expectedKey: 'Soporta hasta',
    advice: {
      optimal: 'No hay riesgo de heladas para este cultivo.',
      acceptable: 'Las heladas de invierno pueden dañar o secar el cultivo.',
      'out-of-range': 'Las heladas de la zona superan lo que el cultivo puede soportar.',
      unknown: 'No hay datos suficientes de temperatura mínima.',
    },
  },
  altitude: {
    title: 'Altura del terreno',
    meter: 'Compatibilidad',
    observedKey: 'Tu parcela',
    expectedKey: 'Ideal para cultivo',
    advice: {
      optimal: '¡Altura perfecta! El terreno está dentro del rango ideal.',
      acceptable: 'La altura está cerca del límite que tolera el cultivo.',
      'out-of-range': 'La altura del terreno está fuera del rango del cultivo.',
      unknown: 'No hay datos de altitud para evaluar.',
    },
  },
  cycle: {
    title: 'Tiempo de crecimiento',
    meter: 'Duración del ciclo',
    observedKey: 'Días disponibles',
    expectedKey: 'Necesita para crecer',
    advice: {
      optimal: 'Tiempo suficiente para que el cultivo complete su ciclo.',
      acceptable: 'El tiempo disponible es justo para completar el ciclo.',
      'out-of-range': 'El periodo no alcanza para que el cultivo complete su ciclo.',
      unknown: 'No hay datos suficientes del ciclo.',
    },
  },
};

@Component({
  selector: 'app-rotation-timeline',
  imports: [],
  templateUrl: './rotation-timeline.html',
  styleUrl: './rotation-timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RotationTimeline {
  readonly cropEvaluation = input<CropEvaluation | null>(null);
  readonly rotationPlan = input<RotationPlan | null>(null);

  /** Alterna entre textos sencillos y los nombres técnicos (NASA / EcoCrop). */
  protected readonly showTechnical = signal(false);

  /** Icono decorativo según el parámetro evaluado. */
  protected checkIcon(label: string): CheckKind {
    const l = label.toLowerCase();
    if (l.includes('precipit')) return 'rain';
    if (l.includes('mínima') || l.includes('helada')) return 'frost';
    if (l.includes('altitud')) return 'altitude';
    if (l.includes('ciclo')) return 'cycle';
    return 'temp';
  }

  protected checkCopy(check: ParameterCheck): CheckCopy {
    return CHECK_COPY[this.checkIcon(check.label)];
  }

  /** Texto de la etiqueta de estado (esquina superior de la tarjeta). */
  protected statusChip(check: ParameterCheck): string {
    if (check.status === 'optimal') return 'Óptimo';
    if (check.status === 'unknown') return 'Sin datos';
    if (this.checkIcon(check.label) === 'frost') return 'Riesgo helada';
    return check.status === 'acceptable' ? 'Regular' : 'Crítico';
  }

  /** Calificación textual del porcentaje de compatibilidad. */
  protected scoreLabel(score: number): string {
    if (score >= 80) return 'Ideal';
    if (score >= 50) return 'Aceptable';
    if (score > 0) return 'Bajo';
    return 'Muy bajo';
  }

  protected primaryName(crop: Crop): string {
    return crop.commonNames[0] || crop.scientificName;
  }
}
