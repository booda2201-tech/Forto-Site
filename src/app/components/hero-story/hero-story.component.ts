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

import { HERO_MASK_PATH, HERO_MASK_VIEWBOX } from '../../core/hero-mask.path';
import { LoaderService } from '../../core/loader.service';
import { SITE, whatsappLink } from '../../core/site.config';
import { MagneticDirective } from '../../directives/magnetic.directive';

interface WallClip {
  src: string;
  poster: string;
}

/**
 * Hero = one screen, no scroll story. Visitors come for the departments, the address and the
 * phone number, so the page opens with the brand moment (a wall of three real clips seen
 * through the giant "FORTO" letters), the headline, the two main buttons and the contact
 * details, and the very next scroll lands on the departments.
 */
@Component({
  selector: 'app-hero-story',
  standalone: true,
  imports: [MagneticDirective],
  templateUrl: './hero-story.component.html',
  styleUrl: './hero-story.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HeroStoryComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly loader = inject(LoaderService);
  private mm?: gsap.MatchMedia;
  private visibility?: IntersectionObserver;
  private disposePointer?: () => void;
  private disposeLayout?: () => void;

  protected readonly bookingUrl = whatsappLink();
  protected readonly description = SITE.description;
  protected readonly phone = SITE.phoneDisplay;
  protected readonly phoneHref = SITE.phoneHref;
  protected readonly mapsUrl = SITE.mapsUrl;
  protected readonly letters = ['F', 'O', 'R', 'T', 'O'] as const;
  protected readonly maskPath = HERO_MASK_PATH;
  protected readonly maskViewBox = HERO_MASK_VIEWBOX;

  protected readonly wall: readonly WallClip[] = [
    { src: 'brand/hero/wall-1.mp4', poster: 'brand/hero/wall-1.jpg' },
    { src: 'brand/hero/wall-2.mp4', poster: 'brand/hero/wall-2.jpg' },
    { src: 'brand/hero/wall-3.mp4', poster: 'brand/hero/wall-3.jpg' },
  ];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const root = this.host.nativeElement;
      const videos = Array.from(root.querySelectorAll<HTMLVideoElement>('.wall-vid'));
      videos.forEach((v) => {
        v.muted = true;
        v.defaultMuted = true;
      });

      this.mm = gsap.matchMedia(root);
      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        this.playIntro(videos);
      });
      this.mm.add('(prefers-reduced-motion: reduce)', () => {
        root.classList.add('is-static');
        videos.forEach((v) => v.pause());
        return () => root.classList.remove('is-static');
      });
    });
  }

  ngOnDestroy(): void {
    this.mm?.revert();
    this.visibility?.disconnect();
    this.disposePointer?.();
    this.disposeLayout?.();
  }

  /* ------------------------------------------------------------------ */

  private playIntro(videos: HTMLVideoElement[]): void {
    const root = this.host.nativeElement;
    const q = gsap.utils.selector(root);

    const letterIns = q('.mask-ch-in');
    const cols = q('.wall-col');
    const introLines = q('.intro-copy .ln-in');

    /* ---- Keep the video wall playing only while the hero is on screen ---- */
    // Phones only show one column of the wall: the hidden clips are never downloaded or decoded.
    const shown = (v: HTMLVideoElement): boolean => v.offsetParent !== null;
    const play = (): void =>
      videos.filter(shown).forEach((v) => {
        if (!v.getAttribute('src') && v.dataset['src']) v.src = v.dataset['src'];
        void v.play().catch(() => undefined);
      });
    play();
    this.visibility = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? play() : videos.forEach((v) => v.pause()))),
      { threshold: 0.05 },
    );
    this.visibility.observe(root);

    // Rotating the phone / resizing can reveal more columns: start those clips then.
    const layout = window.matchMedia('(max-width: 767px)');
    layout.addEventListener('change', play);
    this.disposeLayout = () => layout.removeEventListener('change', play);

    /* ---- Initial state (everything waits for the preloader curtain) ---- */
    gsap.set(letterIns, { yPercent: 108 });
    gsap.set(videos, { autoAlpha: 0 });
    gsap.set(introLines, { yPercent: 115, skewY: 4, transformOrigin: '100% 100%' });
    gsap.set('.kicker, .intro-sub, .intro-cta', { autoAlpha: 0, y: 24 });
    gsap.set('.hud-item, .hud .cue', { autoAlpha: 0 });

    // Once the letters have risen in, swap the blended text for its (cheaper) vector twin.
    const useVectorMask = (): void => root.classList.add('is-vec');

    void this.loader.ready.then(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' }, onComplete: useVectorMask })
        .to(videos, { autoAlpha: 1, duration: 1.6, stagger: 0.18, ease: 'power2.out' }, 0)
        .to(letterIns, { yPercent: 0, duration: 1.6, stagger: 0.09 }, 0.15)
        .to('.kicker', { autoAlpha: 1, y: 0, duration: 1 }, 0.6)
        .to(introLines, { yPercent: 0, skewY: 0, duration: 1.5, stagger: 0.14 }, 0.8)
        .to('.intro-sub', { autoAlpha: 1, y: 0, duration: 1.1 }, 1.1)
        .to('.intro-cta', { autoAlpha: 1, y: 0, duration: 1.1 }, 1.25)
        .to('.hud-item, .hud .cue', { autoAlpha: 1, duration: 1, stagger: 0.12 }, 1.5);
    });

    /* ---- Pointer parallax on the wall (mouse only, and only when several columns show) ----
       With a single column (phones) sliding it sideways just uncovers a black strip at the edge. */
    if (window.matchMedia('(pointer: fine)').matches) {
      const xTo = cols.map(
        (c) => gsap.quickTo(c, 'x', { duration: 1.2, ease: 'power3.out' }) as (v: number) => void,
      );
      const onMove = (e: PointerEvent): void => {
        const single = window.innerWidth < 768; // one column only: nothing to parallax
        const nx = single ? 0 : e.clientX / window.innerWidth - 0.5;
        xTo.forEach((fn, i) => fn(nx * (i - 1) * -26));
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      this.disposePointer = () => window.removeEventListener('pointermove', onMove);
    }
  }
}
