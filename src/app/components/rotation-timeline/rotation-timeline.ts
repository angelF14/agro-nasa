import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Crop, CropEvaluation, RotationPlan } from '@models/index';

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

  protected primaryName(crop: Crop): string {
    return crop.commonNames[0] || crop.scientificName;
  }
}
