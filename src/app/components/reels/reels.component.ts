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

import { SITE } from '../../core/site.config';

gsap.registerPlugin(ScrollTrigger);

interface Reel {
  /** Instagram shortcode, from instagram.com/reel/<code>. */
  code: string;
  title: string;
  /** View count as displayed on Instagram (snapshot). */
  views: string;
  poster: string;
  /** Self-hosted clip (public/brand/reels). */
  video: string;
}

interface Stat {
  value: number;
  decimals: number;
  suffix: string;
  label: string;
}

@Component({
  selector: 'app-reels',
  standalone: true,
  templateUrl: './reels.component.html',
  styleUrl: './reels.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ReelsComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private observer?: IntersectionObserver;
  private disposeVideos?: () => void;
  private mm?: gsap.MatchMedia;
  private disposeDrag?: () => void;

  protected readonly instagram = SITE.social.instagram;

  // Real reels from instagram.com/forto.car.care – view counts are a snapshot.
  protected readonly reels: readonly Reel[] = [
    { code: 'DUiIG4mCKLx', title: 'إعلان افتتاح فورتو', views: '733K', poster: 'brand/reels/DUiIG4mCKLx.jpg', video: 'brand/reels/DUiIG4mCKLx.mp4' },
    { code: 'DfU20ZosxTV', title: 'داخل غرفة الدهان', views: '111K', poster: 'brand/reels/DfU20ZosxTV.jpg', video: 'brand/reels/DfU20ZosxTV.mp4' },
    { code: 'DUkvIOhjvh1', title: 'أمام المركز', views: '104K', poster: 'brand/reels/DUkvIOhjvh1.jpg', video: 'brand/reels/DUkvIOhjvh1.mp4' },
    { code: 'DfNFLvHCG3s', title: 'ورشة فورتو من الداخل', views: '102K', poster: 'brand/reels/DfNFLvHCG3s.jpg', video: 'brand/reels/DfNFLvHCG3s.mp4' },
    { code: 'Dew3IJYij8h', title: 'فريق فورتو', views: '55.7K', poster: 'brand/reels/Dew3IJYij8h.jpg', video: 'brand/reels/Dew3IJYij8h.mp4' },
  ];

  protected readonly stats: readonly Stat[] = [
    { value: 15.3, decimals: 1, suffix: 'K', label: 'متابع على إنستجرام' },
    { value: 5.6, decimals: 1, suffix: 'K', label: 'متابع على فيسبوك' },
    { value: 733, decimals: 0, suffix: 'K', label: 'مشاهدة لأقوى ريل' },
  ];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const root = this.host.nativeElement;
      this.mm = gsap.matchMedia(root);

      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.reels-title-inner', {
          yPercent: 125,
          skewY: 5,
          transformOrigin: '100% 100%',
          duration: 1.5,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.reels-head', start: 'top 80%', once: true },
        });

        // Count-up for the social proof numbers.
        gsap.utils.toArray<HTMLElement>('.stat-value', root).forEach((el) => {
          const to = Number(el.dataset['to']);
          const decimals = Number(el.dataset['decimals']);
          const counter = { v: 0 };
          el.textContent = (0).toFixed(decimals);
          gsap.to(counter, {
            v: to,
            duration: 2.2,
            ease: 'power3.out',
            onUpdate: () => (el.textContent = counter.v.toFixed(decimals)),
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          });
        });

        // Gentle parallax on the reel cards.
        gsap.utils.toArray<HTMLElement>('.reel-card', root).forEach((card, i) => {
          gsap.fromTo(
            card,
            { yPercent: i % 2 ? 4 : -2 },
            {
              yPercent: i % 2 ? -4 : 2,
              ease: 'none',
              scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        });
      });

      this.enableDrag(root.querySelector<HTMLElement>('.reel-track'));
      this.setupVideos(root);
    });
  }

  ngOnDestroy(): void {
    this.mm?.revert();
    this.disposeDrag?.();
    this.disposeVideos?.();
  }

  /**
   * Lazy-loads each clip when it nears the viewport, autoplays it muted while mostly in view
   * and pauses it when it leaves. Click a card to turn its sound on (only one at a time).
   */
  private setupVideos(root: HTMLElement): void {
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.reel-card'));
    const videoOf = (card: Element): HTMLVideoElement => card.querySelector('video')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const load = (video: HTMLVideoElement): void => {
      if (video.src || !video.dataset['src']) return;
      video.src = video.dataset['src'];
      video.load();
    };
    const play = (video: HTMLVideoElement): void => {
      load(video);
      void video.play().catch(() => undefined);
    };
    const mute = (card: HTMLElement): void => {
      videoOf(card).muted = true;
      card.classList.remove('is-unmuted');
    };

    const cleanups: Array<() => void> = [];

    cards.forEach((card) => {
      const video = videoOf(card);
      const bar = card.querySelector<HTMLElement>('.reel-progress__bar');
      video.muted = true; // set as a property: Angular's attribute binding doesn't reliably do it.
      video.defaultMuted = true;

      const onTime = (): void => {
        if (bar && video.duration) bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
      };
      const hit = card.querySelector<HTMLElement>('.reel-hit');
      const onToggle = (): void => {
        const turningOn = video.muted;
        cards.forEach(mute);
        if (turningOn) {
          video.muted = false;
          card.classList.add('is-unmuted');
        }
        if (video.paused) play(video);
      };
      video.addEventListener('timeupdate', onTime);
      hit?.addEventListener('click', onToggle);
      cleanups.push(() => {
        video.removeEventListener('timeupdate', onTime);
        hit?.removeEventListener('click', onToggle);
      });
    });

    // Warm up (download) a little before a card scrolls into view.
    // Phones download one clip at a time as it comes close (5 clips are ~17 MB on mobile data).
    const touch = window.matchMedia('(hover: none)').matches;
    const preload = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && load(videoOf(e.target))),
      { rootMargin: touch ? '0px 120px 250px 120px' : '0px 600px 600px 600px' },
    );
    // Play only while mostly visible.
    this.observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const video = videoOf(e.target);
          const visible =
            e.isIntersecting &&
            (e.intersectionRatio >= 0.55 || e.intersectionRect.height >= window.innerHeight * 0.55) &&
            e.intersectionRect.width >= e.boundingClientRect.width * 0.5;
          if (visible && !reduced) {
            play(video);
          } else {
            video.pause();
            if (!visible) mute(e.target as HTMLElement);
          }
        }),
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    cards.forEach((c) => {
      preload.observe(c);
      this.observer!.observe(c);
    });

    // Pause everything when the tab is hidden.
    const onVisibility = (): void => {
      if (document.hidden) cards.forEach((c) => videoOf(c).pause());
    };
    document.addEventListener('visibilitychange', onVisibility);

    this.disposeVideos = () => {
      preload.disconnect();
      this.observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      cleanups.forEach((fn) => fn());
    };
  }
  /** Click-and-drag scrolling for the reel rail (mouse); touch keeps native swipe. */
  private enableDrag(track: HTMLElement | null): void {
    if (!track) return;
    let down = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const onDown = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return;
      down = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
    };
    const onMove = (e: PointerEvent): void => {
      if (!down) return;
      const dx = e.clientX - startX;
      // Only a real drag switches the rail to "dragging". Doing it on press would turn pointer
      // events off for the cards mid-click, so the click never reached the sound button.
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        track.classList.add('is-dragging');
      }
      // scrollLeft grows rightwards in LTR but runs negative in RTL.
      const dir = getComputedStyle(track).direction === 'rtl' ? 1 : -1;
      track.scrollLeft = startScroll + dir * dx;
    };
    const onUp = (): void => {
      down = false;
      track.classList.remove('is-dragging');
    };
    // Swallow the click that ends a drag so it doesn't start a video.
    const onClick = (e: Event): void => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };

    track.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    track.addEventListener('click', onClick, true);

    this.disposeDrag = () => {
      track.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      track.removeEventListener('click', onClick, true);
    };
  }
}
