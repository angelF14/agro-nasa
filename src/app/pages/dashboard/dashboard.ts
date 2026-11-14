import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FarmMap } from '@components/farm-map/farm-map';
import { RotationTimeline } from '@components/rotation-timeline/rotation-timeline';

@Component({
  selector: 'app-dashboard',
  imports: [FarmMap, RotationTimeline],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {}
