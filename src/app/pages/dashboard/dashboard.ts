import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FarmMap } from '@components/farm-map/farm-map';
import { RotationTimeline } from '@components/rotation-timeline/rotation-timeline';
import { Coordinates } from '@models/index';

@Component({
  selector: 'app-dashboard',
  imports: [FarmMap, RotationTimeline],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly selectedCoordinates = signal<Coordinates | null>(null);
  protected readonly selectedLocationName = signal<string>('');

  protected onCoordinatesChange(coords: Coordinates): void {
    this.selectedCoordinates.set(coords);
  }

  protected onLocationNameChange(name: string): void {
    this.selectedLocationName.set(name);
  }
}
