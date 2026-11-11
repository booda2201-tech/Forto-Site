import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { DEPARTMENTS } from '../../core/departments';
import { TiltDirective } from '../../directives/tilt.directive';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, TiltDirective],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ServicesComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private mm?: gsap.MatchMedia;

  protected readonly intro =
    'ثلاثة أقسام متخصصة جنب بعض في محطة واحدة على الدائري. افتح القسم اللي محتاجه وشوف شغله وصور مكانه.';

  // Each card opens that department's own page.
  protected readonly departments = DEPARTMENTS;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.mm = gsap.matchMedia(this.host.nativeElement);
      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          defaults: { ease: 'expo.out' },
          scrollTrigger: { trigger: '.services-head', start: 'top 80%', once: true },
        });

        // Line-level reveal (never per-letter: that would break Arabic letter joining).
        tl.from('.services-kicker', { autoAlpha: 0, y: 16, duration: 0.9 })
          .from('.services-title-inner', { yPercent: 125, skewY: 5, transformOrigin: '100% 100%', duration: 1.5 }, '-=0.6')
          .from('.services-intro', { y: 26, autoAlpha: 0, duration: 1.1 }, '-=1');
      });
    });
  }

  ngOnDestroy(): void {
    this.mm?.revert();
  }
}
