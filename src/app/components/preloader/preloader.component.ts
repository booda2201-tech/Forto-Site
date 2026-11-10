import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { gsap } from 'gsap';

import { LOGO_SHIELD_PATH } from '../../core/logo-shield.path';
import { LoaderService } from '../../core/loader.service';
import { SmoothScrollService } from '../../core/smooth-scroll.service';

/** Cinematic intro: logo draws itself, counter runs, then the curtains split open. */
@Component({
  selector: 'app-preloader',
  standalone: true,
  templateUrl: './preloader.component.html',
  styleUrl: './preloader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloaderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) private readonly root!: ElementRef<HTMLElement>;
  @ViewChild('count', { static: true }) private readonly count!: ElementRef<HTMLElement>;

  private readonly zone = inject(NgZone);
  private readonly loader = inject(LoaderService);
  private readonly smooth = inject(SmoothScrollService);

  protected readonly path = LOGO_SHIELD_PATH;
  /** Tight bounds of the full logo (shield + fortress) inside the 720x720 trace, with room for the stroke. */
  protected readonly viewBox = '176 148 368 424';
  private tl?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    const root = this.root.nativeElement;

    if (this.smooth.reducedMotion) {
      root.remove();
      this.loader.complete();
      return;
    }

    this.smooth.stop();
    document.documentElement.classList.add('is-loading');

    this.zone.runOutsideAngular(() => {
      const counter = { value: 0 };
      const countEl = this.count.nativeElement;

      // Wait for fonts + window load, but never block the visitor for more than 4s.
      const assets = Promise.race([
        Promise.all([
          document.fonts.ready,
          document.readyState === 'complete'
            ? Promise.resolve()
            : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true })),
        ]),
        new Promise<void>((r) => setTimeout(r, 4000)),
      ]);

      const intro = gsap.timeline();
      intro
        .fromTo('.pre-logo-path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0)
        .fromTo('.pre-logo-path', { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.9, ease: 'power2.out' }, 1.1)
        .to(counter, {
          value: 100,
          duration: 1.9,
          ease: 'power2.inOut',
          onUpdate: () => (countEl.textContent = String(Math.round(counter.value)).padStart(3, '0')),
        }, 0)
        .fromTo('.pre-meta', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.2);

      const introDone = new Promise<void>((r) => intro.eventCallback('onComplete', () => r()));

      Promise.all([introDone, assets]).then(() => {
        this.tl = gsap
          .timeline({ defaults: { ease: 'expo.inOut' } })
          .to('.pre-center', { scale: 0.86, autoAlpha: 0, duration: 0.7, ease: 'power3.in' })
          .to('.pre-curtain--top', { yPercent: -101, duration: 1.2 }, 0.45)
          .to('.pre-curtain--bottom', { yPercent: 101, duration: 1.2 }, 0.45)
          .add(() => {
            // Fire slightly early so the hero intro plays *as* the curtains open.
            this.loader.complete();
            this.smooth.start();
            document.documentElement.classList.remove('is-loading');
          }, 0.9)
          .add(() => root.remove());
      });
    });
  }

  ngOnDestroy(): void {
    this.tl?.kill();
  }
}
