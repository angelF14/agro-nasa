import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Directive, effect, ElementRef, inject, input, PLATFORM_ID } from '@angular/core';

/**
 * Anima el texto del host desde el valor anterior hasta el nuevo (efecto "conteo").
 * Solo presentación: el valor final mostrado es el mismo número recibido.
 */
@Directive({
  selector: '[appCountUp]',
})
export class CountUp {
  readonly appCountUp = input<number | null | undefined>();
  readonly countUpDuration = input<number>(900);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private current = 0;
  private frameId = 0;

  constructor() {
    effect(() => this.animateTo(this.appCountUp()));

    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frameId));
  }

  private animateTo(target: number | null | undefined): void {
    const el = this.host.nativeElement;

    if (target === null || target === undefined || Number.isNaN(target)) {
      el.textContent = '—';
      return;
    }

    const decimals = Math.min((String(target).split('.')[1] ?? '').length, 2);
    const reduceMotion =
      this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!this.isBrowser || reduceMotion) {
      this.current = target;
      el.textContent = target.toFixed(decimals);
      return;
    }

    cancelAnimationFrame(this.frameId);
    const from = this.current;
    const duration = this.countUpDuration();
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      this.current = from + (target - from) * eased;
      el.textContent = this.current.toFixed(decimals);
      if (t < 1) {
        this.frameId = requestAnimationFrame(tick);
      } else {
        this.current = target;
      }
    };

    this.frameId = requestAnimationFrame(tick);
  }
}
