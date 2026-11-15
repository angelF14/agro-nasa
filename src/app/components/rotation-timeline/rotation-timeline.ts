import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Crop, CropEvaluation, RotationPlan } from '@models/index';
import { LanguageService } from '@services/language.service';
import { getLocalizedCropName } from '@utils/agronomist-query-parser.utils';

@Component({
  selector: 'app-rotation-timeline',
  imports: [],
  templateUrl: './rotation-timeline.html',
  styleUrl: './rotation-timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RotationTimeline {
  protected readonly i18n = inject(LanguageService);
  readonly cropEvaluation = input<CropEvaluation | null>(null);
  readonly rotationPlan = input<RotationPlan | null>(null);

  protected primaryName(crop: Crop): string {
    return getLocalizedCropName(crop, this.i18n.language());
  }
}
