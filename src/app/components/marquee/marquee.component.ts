import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Two counter-moving ticker rows that speed up (and flip) with scroll velocity. */
@Component({
  selector: 'app-marquee',
  standalone: true,
  templateUrl: './marquee.component.html',
  styleUrl: './marquee.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class MarqueeComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private mm?: gsap.MatchMedia;
  private trigger?: ScrollTrigger;

  protected readonly latin = ['Forto Car Care', 'Forto Service', 'Forto Protection', 'Detailing', 'Nano Ceramic'];
  protected readonly arabic = ['الميكانيكا', 'السمكرة', 'الدهان', 'النانو سيراميك', 'الغسيل', 'التلميع'];
  /** Rendered twice so the loop is seamless. */
  protected readonly copies = [0, 1];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.mm = gsap.matchMedia(this.host.nativeElement);
      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        const rows = gsap.utils.toArray<HTMLElement>('.marquee-track', this.host.nativeElement);
        const tweens = rows.map((row, i) =>
          gsap.fromTo(
            row,
            { xPercent: i % 2 ? -50 : 0 },
            { xPercent: i % 2 ? 0 : -50, duration: 38, ease: 'none', repeat: -1 },
          ),
        );

        this.trigger = ScrollTrigger.create({
          trigger: this.host.nativeElement,
          start: 'top bottom',
          end: 'bottom top',
          // No point animating text nobody can see.
          onToggle: (self) => tweens.forEach((t) => (self.isActive ? t.resume() : t.pause())),
          onUpdate: (self) => {
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 260, 6);
            tweens.forEach((t) => {
              t.timeScale(boost * (self.direction === 1 ? 1 : -1));
              gsap.to(t, { timeScale: 1, duration: 1.2, overwrite: true });
            });
          },
        });
        if (!this.trigger.isActive) tweens.forEach((t) => t.pause());
      });
    });
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
    this.mm?.revert();
  }
}
