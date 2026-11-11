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

import {
  LOGO_SHIELD_PATH,
  LOGO_SHIELD_VIEWBOX,
} from '../../core/logo-shield.path';
import { HERO_MASK_PATH, HERO_MASK_VIEWBOX } from '../../core/hero-mask.path';
import { LoaderService } from '../../core/loader.service';
import { SITE, whatsappLink } from '../../core/site.config';
import { MagneticDirective } from '../../directives/magnetic.directive';

gsap.registerPlugin(ScrollTrigger);

interface Chapter {
  /** Short label shown in the progress rail. */
  tag: string;
  /** Latin label shown next to the chapter number. */
  hud: string;
  /** Headline, one entry per masked line. */
  lines: readonly string[];
  /** Index of the line painted in brand orange. */
  accent: number;
  sub: string;
  /** Darkness (0 = lit, 1 = black) of each wall column while this chapter plays. */
  dim: readonly [number, number, number];
}

interface Step {
  num: string;
  title: string;
}

interface WallClip {
  src: string;
  poster: string;
}

/**
 * Hero = a short film driven by the scroll.
 *  1. A wall of three real clips from the centre, seen only through the giant "FORTO" letters.
 *  2. Scrolling dives into the letter T: the window grows until the wall fills the screen.
 *  3. Four chapters play over the open wall: Center → Forto → Departments → Book.
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
  private refreshHandler?: () => void;

  protected readonly bookingUrl = whatsappLink();
  protected readonly description = SITE.description;
  protected readonly phone = SITE.phoneDisplay;
  protected readonly phoneHref = SITE.phoneHref;
  protected readonly shieldPath = LOGO_SHIELD_PATH;
  protected readonly shieldViewBox = LOGO_SHIELD_VIEWBOX;
  protected readonly letters = ['F', 'O', 'R', 'T', 'O'] as const;
  protected readonly maskPath = HERO_MASK_PATH;
  protected readonly maskViewBox = HERO_MASK_VIEWBOX;

  protected readonly wall: readonly WallClip[] = [
    { src: 'brand/hero/wall-1.mp4', poster: 'brand/hero/wall-1.jpg' },
    { src: 'brand/hero/wall-2.mp4', poster: 'brand/hero/wall-2.jpg' },
    { src: 'brand/hero/wall-3.mp4', poster: 'brand/hero/wall-3.jpg' },
  ];

  protected readonly chapters: readonly Chapter[] = [
    {
      tag: 'المركز',
      hud: 'Center',
      lines: ['كل احتياجات عربيتك', 'في مكان واحد.'],
      accent: 1,
      sub: 'فورتو مركز متكامل على الطريق الدائري في الهرم.',
      dim: [0, 0.82, 0.82],
    },
    {
      tag: 'فورتو',
      hud: 'Forto',
      lines: ['عربيتك', 'في أمان.'],
      accent: 1,
      sub: 'فنيين متخصصين وإمكانيات كاملة، وعناية بكل تفصيلة في سيارتك.',
      dim: [0.72, 0.72, 0.72],
    },
    {
      tag: 'الأقسام',
      hud: 'Departments',
      lines: ['ثلاثة أقسام', 'متخصصة.'],
      accent: 1,
      sub: 'لكل قسم تخصصه:',
      dim: [0.82, 0.82, 0],
    },
    {
      tag: 'احجز',
      hud: 'Book',
      lines: ['احجز موعدك', 'وسيبها علينا.'],
      accent: 1,
      sub: 'فريق فورتو في انتظارك. كلمنا واحجز دلوقتي.',
      dim: [0, 0, 0],
    },
  ];

  protected readonly steps: readonly Step[] = [
    { num: '01', title: 'غسيل وتلميع' },
    { num: '02', title: 'ميكانيكا وعفشة وصيانة' },
    { num: '03', title: 'سمكرة ودهان ونانو سيراميك' },
  ];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const root = this.host.nativeElement;
      const videos = Array.from(
        root.querySelectorAll<HTMLVideoElement>('.wall-vid'),
      );
      videos.forEach((v) => {
        v.muted = true;
        v.defaultMuted = true;
      });

      this.mm = gsap.matchMedia(root);
      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        this.playFilm(videos);
        return () => this.resetInline();
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
    if (this.refreshHandler)
      ScrollTrigger.removeEventListener('refreshInit', this.refreshHandler);
  }

  /* ------------------------------------------------------------------ */

  private resetInline(): void {
    this.host.nativeElement.classList.remove('is-vec');
    const q = gsap.utils.selector(this.host.nativeElement);
    gsap.set(q('.mask-word'), { clearProps: 'all' });
  }

  private playFilm(videos: HTMLVideoElement[]): void {
    const root = this.host.nativeElement;
    const q = gsap.utils.selector(root);

    const word = root.querySelector<HTMLElement>('.mask-word')!;
    const letters = q('.mask-ch');
    const letterIns = q('.mask-ch-in');
    const cols = q('.wall-col');
    const dims = q('.dim');
    const caps = q('.cap');
    const capLines = caps.map((c) =>
      Array.from(c.querySelectorAll<HTMLElement>('.ln-in')),
    );
    const capExtras = caps.map((c) =>
      Array.from(
        c.querySelectorAll<HTMLElement>('.cap-num, .cap-sub, .steps, .cap-cta'),
      ),
    );
    const introLines = q('.intro-copy .ln-in');
    const introBits = q('.kicker, .intro-sub, .intro-cta');
    const steps = q('.step');
    const progItems = q('.prog-item');

    /* ---- Keep the video wall playing only while the hero is on screen ---- */
    // Phones only show one column of the wall: the hidden clips are never downloaded or decoded.
    const shown = (v: HTMLVideoElement): boolean => v.offsetParent !== null;
    const play = (): void =>
      videos.filter(shown).forEach((v) => {
        if (!v.getAttribute('src') && v.dataset['src'])
          v.src = v.dataset['src'];
        void v.play().catch(() => undefined);
      });
    play();
    this.visibility = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) =>
          e.isIntersecting ? play() : videos.forEach((v) => v.pause()),
        ),
      { threshold: 0.05 },
    );
    this.visibility.observe(root);

    // Rotating the phone / resizing can reveal more columns: start those clips then.
    const layout = window.matchMedia('(max-width: 767px)');
    layout.addEventListener('change', play);
    this.disposeLayout = () => layout.removeEventListener('change', play);

    /* ---- Zoom origin: the stem of the letter T, so we dive *through* a letter ---- */
    const place = (): void => {
      const t = letters[2]!; // the middle letter (R) = the true centre of the word
      gsap.set(word, {
        transformOrigin: `${t.offsetLeft + t.offsetWidth / 2}px ${t.offsetHeight * 0.55}px`,
      });
    };
    place();
    void document.fonts?.ready.then(() => {
      place();
      ScrollTrigger.refresh();
    });
    this.refreshHandler = place;
    ScrollTrigger.addEventListener('refreshInit', place);

    /* ---- Initial state (everything waits for the preloader curtain) ---- */
    gsap.set(letterIns, { yPercent: 108 });
    gsap.set(videos, { autoAlpha: 0 });
    gsap.set(introLines, {
      yPercent: 115,
      skewY: 4,
      transformOrigin: '100% 100%',
    });
    gsap.set(introBits, { autoAlpha: 0, y: 24 });
    gsap.set('.hud .cue, .hud .hud-phone', { autoAlpha: 0 });
    gsap.set(caps, { autoAlpha: 0 });
    gsap.set(capLines.flat(), { yPercent: 118 });
    gsap.set(capExtras.flat(), { autoAlpha: 0, y: 20 });
    gsap.set(steps, { autoAlpha: 0.28 });
    gsap.set(dims, { autoAlpha: 0 });

    // Once the letters have risen in, swap the blended text for its (cheaper) vector twin.
    const useVectorMask = (): void => root.classList.add('is-vec');

    this.loader.ready.then(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' }, onComplete: useVectorMask })
        .to(
          videos,
          { autoAlpha: 1, duration: 1.6, stagger: 0.18, ease: 'power2.out' },
          0,
        )
        .to(letterIns, { yPercent: 0, duration: 1.6, stagger: 0.09 }, 0.15)
        .to('.kicker', { autoAlpha: 1, y: 0, duration: 1 }, 0.6)
        .to(
          introLines,
          { yPercent: 0, skewY: 0, duration: 1.5, stagger: 0.14 },
          0.8,
        )
        .to('.intro-sub', { autoAlpha: 1, y: 0, duration: 1.1 }, 1.1)
        .to('.intro-cta', { autoAlpha: 1, y: 0, duration: 1.1 }, 1.25)
        .to(
          '.hud .cue, .hud .hud-phone',
          { autoAlpha: 1, duration: 1, stagger: 0.12 },
          1.5,
        );
    });

    /* ---- Pointer parallax on the wall (mouse only, and only when several columns show) ----
       With a single column (phones) sliding it sideways just uncovers a black strip at the edge. */
    if (window.matchMedia('(pointer: fine)').matches) {
      const xTo = cols.map(
        (c) =>
          gsap.quickTo(c, 'x', { duration: 1.2, ease: 'power3.out' }) as (
            v: number,
          ) => void,
      );
      const onMove = (e: PointerEvent): void => {
        const single = window.innerWidth < 768; // one column only: nothing to parallax
        const nx = single ? 0 : e.clientX / window.innerWidth - 0.5;
        xTo.forEach((fn, i) => fn(nx * (i - 1) * -26));
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      this.disposePointer = () =>
        window.removeEventListener('pointermove', onMove);
    }

    /* ---- The scroll film ---- */
    const Z = 1.7; // length of the dive
    const hold = 0.95; // how long each chapter rests
    const swap = 0.45; // crossfade between chapters
    const starts = this.chapters.map((_, i) => Z * 0.8 + i * (hold + swap));
    const total = starts[starts.length - 1]! + hold + 0.5;

    let wasScrolled = false;
    let activeIdx = 0;
    const fills: number[] = [];

    const maxScale = 28;
    const expoEase = (p: number): number =>
      (Math.exp(Math.log(maxScale) * p) - 1) / (maxScale - 1);

    // Runs on the timeline itself (not the ScrollTrigger) so the chapter rail also follows the
    // scrub while it catches up after the scrolling has stopped.
    const sync = (): void => {
      const t = tl.time();
      const scrolled = t > 0.04;
      if (scrolled !== wasScrolled) {
        wasScrolled = scrolled;
        root.classList.toggle('is-scrolled', scrolled);
      }
      if (t > 0.02) useVectorMask();
      let active = 0;
      starts.forEach((s, i) => {
        if (t >= s - 0.1) active = i;
      });
      // Touch the DOM only when something actually changed (each write forces a style recalc).
      progItems.forEach((el, i) => {
        const from = starts[i]!;
        const to = i < starts.length - 1 ? starts[i + 1]! : total;
        const fill =
          Math.round(gsap.utils.clamp(0, 1, (t - from) / (to - from)) * 400) /
          400;
        if (fills[i] !== fill) {
          fills[i] = fill;
          el.style.setProperty('--fill', String(fill));
        }
      });
      if (active !== activeIdx) {
        progItems[activeIdx]?.classList.remove('is-active');
        progItems[active]?.classList.add('is-active');
        activeIdx = active;
      }
    };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: sync,
      scrollTrigger: {
        trigger: root.querySelector('.hero-stage'),
        start: 'top top',
        // Phones: a shorter scroll for the same film, so the story moves along faster.
        end: () => `+=${Math.round(total * (window.innerWidth < 768 ? 55 : 78))}%`,
        pin: true,
        scrub: window.innerWidth < 768 ? 0.3 : 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // 1) Dive into the letter.
    // Distance from the dive point (stem of the T) to the exact centre of the screen.
    const stage = root.querySelector<HTMLElement>('.hero-stage')!;
    const diveOffset = (): { x: number; y: number } => {
      const t = letters[2]!;
      const px = word.offsetLeft + t.offsetLeft + t.offsetWidth / 2;
      const py = word.offsetTop + t.offsetHeight * 0.55;
      return { x: stage.clientWidth / 2 - px, y: stage.clientHeight / 2 - py };
    };

    // The T slides to the middle of the screen while the word grows, so the dive ends dead centre.
    tl.to(
      word,
      {
        x: () => diveOffset().x,
        y: () => diveOffset().y,
        duration: Z,
        ease: 'power2.inOut',
      },
      0,
    )
      .to(word, { scale: maxScale, duration: Z, ease: expoEase }, 0)
      .to('.intro-copy', { autoAlpha: 0, y: -70, duration: Z * 0.32 }, 0)
      .to('.wall', { scale: 1.1, duration: Z + 2 }, 0)
      .to('.mask', { autoAlpha: 0, duration: Z * 0.3 }, Z * 0.7)
      .fromTo(
        '.shade',
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: Z * 0.3 },
        Z * 0.7,
      )
      .fromTo(
        '.prog',
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.3 },
        Z * 0.85,
      );

    // The wall drifts: outer columns up, middle column down.
    cols.forEach((col, i) => {
      tl.fromTo(
        col,
        { yPercent: 0 },
        { yPercent: i === 1 ? 5 : -5, duration: total },
        0,
      );
    });

    // 2) Chapters.
    this.chapters.forEach((c, k) => {
      const s = starts[k]!;
      const e = s + hold;
      const last = k === this.chapters.length - 1;

      tl.set(caps[k]!, { autoAlpha: 1 }, s)
        .to(
          capLines[k]!,
          { yPercent: 0, duration: 0.42, stagger: 0.09, ease: 'power3.out' },
          s,
        )
        .to(
          capExtras[k]!,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.07,
            ease: 'power2.out',
          },
          s + 0.12,
        );

      dims.forEach((d, di) => {
        tl.to(d, { autoAlpha: c.dim[di]!, duration: 0.4 }, s);
      });

      if (!last) {
        tl.to(
          capLines[k]!,
          { yPercent: -118, duration: 0.3, stagger: 0.05, ease: 'power2.in' },
          e,
        )
          .to(capExtras[k]!, { autoAlpha: 0, y: -14, duration: 0.2 }, e)
          .set(caps[k]!, { autoAlpha: 0 }, e + 0.34);
      }
    });

    // Chapter 2: the fortress draws itself over the dimmed wall.
    const s2 = starts[1]!;
    tl.set('.mark', { autoAlpha: 1 }, s2)
      .fromTo(
        '.mark-path',
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: hold * 0.85, ease: 'power2.inOut' },
        s2,
      )
      .to(
        '.mark-path',
        { fill: 'rgba(247,147,30,0.18)', duration: 0.3 },
        s2 + hold * 0.7,
      )
      .to(
        '.mark',
        { autoAlpha: 0, scale: 1.15, duration: 0.35 },
        s2 + hold + 0.05,
      );

    // Chapter 3: the three workshop steps light up one by one.
    const s3 = starts[2]!;
    steps.forEach((el, i) => {
      tl.to(el, { autoAlpha: 1, duration: 0.15 }, s3 + 0.2 + i * 0.25);
    });

    // Rest on the final frame so the CTA stays on screen.
    tl.to({}, { duration: 0.0001 }, total);
  }
}
