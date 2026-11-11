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

interface Zone {
  label: string;
  title: string;
  description: string;
  image: string;
  focus: string;
}

/**
 * Scroll-driven tour of the centre. On desktop the section pins and the photo stage
 * wipes between zones as you scroll; on mobile it falls back to stacked cards.
 */
@Component({
  selector: 'app-center',
  standalone: true,
  templateUrl: './center.component.html',
  styleUrl: './center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CenterComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private mm?: gsap.MatchMedia;
  private railObserver?: IntersectionObserver;

  protected readonly zones: readonly Zone[] = [
    {
      label: 'Detailing Zone',
      title: 'منطقة التلميع',
      description: 'تلميع احترافي وإزالة للخدوش وعناية دقيقة بكل تفصيلة في طلاء سيارتك.',
      image: 'brand/place-angle.jpg',
      focus: '50% 38%',
    },
    {
      label: 'Wash Zone',
      title: 'منطقة الغسيل',
      description: 'غسيل كيميائي كامل للمحرك والداخلية والجنوط داخل مساحات مجهّزة لذلك.',
      image: 'brand/place-front.jpg',
      focus: '50% 40%',
    },
    {
      label: 'Accessories & Lounge',
      title: 'إكسسوارات ولاونج',
      description: 'إكسسوارات للسيارة ومساحة استقبال مريحة، كل شيء في مكان واحد على الدائري.',
      image: 'brand/place-aerial.jpg',
      focus: '50% 50%',
    },
  ];

  /** Brings card `index` of the mobile rail to the middle (works in RTL too). */
  protected goTo(index: number): void {
    const cards = this.host.nativeElement.querySelectorAll<HTMLElement>('.m-card');
    cards[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  /** Lights the dot of whichever mobile card is in the middle of the rail. */
  private trackMobileRail(root: HTMLElement): void {
    const rail = root.querySelector<HTMLElement>('.m-rail');
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>('.m-card'));
    const dots = Array.from(root.querySelectorAll<HTMLElement>('.m-dot'));
    const light = (index: number): void => dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
    light(0);

    this.railObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) light(cards.indexOf(e.target as HTMLElement));
        }),
      { root: rail, threshold: [0.6, 0.8] },
    );
    cards.forEach((c) => this.railObserver!.observe(c));
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const root = this.host.nativeElement;
      this.trackMobileRail(root);
      this.mm = gsap.matchMedia(root);

      this.mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const slides = gsap.utils.toArray<HTMLElement>('.stage-slide', root);
        const items = gsap.utils.toArray<HTMLElement>('.zone-item', root);
        const fill = root.querySelector<HTMLElement>('.progress-fill');
        const count = root.querySelector<HTMLElement>('.stage-count');

        const setActive = (index: number): void => {
          items.forEach((el, i) => el.classList.toggle('is-active', i === index));
          if (count) count.textContent = `0${index + 1}`;
        };
        setActive(0);

        gsap.set(slides.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
        gsap.set(slides.map((s) => s.querySelector('img')), { scale: 1.25 });
        gsap.set(slides[0]!.querySelector('img'), { scale: 1 });

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '.center-pin',
            start: 'top top',
            end: `+=${(slides.length - 1) * 85}%`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (fill) fill.style.transform = `scaleY(${self.progress})`;
              setActive(Math.min(slides.length - 1, Math.round(self.progress * (slides.length - 1))));
            },
          },
        });

        slides.slice(1).forEach((slide, i) => {
          const img = slide.querySelector('img');
          tl.to(slide, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, i)
            .to(img, { scale: 1, duration: 1 }, i)
            .to(slides[i]!.querySelector('img'), { scale: 1.12, duration: 1 }, i);
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.railObserver?.disconnect();
    this.mm?.revert();
  }
}
