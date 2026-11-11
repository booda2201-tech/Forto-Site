import { Injectable, NgZone, inject } from '@angular/core';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Inertial smooth scrolling (Lenis) wired into GSAP's ticker so ScrollTrigger,
 * pinned sections and WebGL scroll uniforms all share one clock.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private readonly zone = inject(NgZone);
  private lenis?: Lenis;

  readonly reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  init(): void {
    gsap.registerPlugin(ScrollTrigger);
    // Phones: the URL bar sliding in/out resizes the viewport while scrolling. Don't rebuild every
    // pinned timeline for it (that is what makes the hero stutter and jump on mobile).
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (this.reducedMotion || this.lenis) return;

    // Phones / touch: native scrolling already has the right inertia. Layering Lenis' wheel
    // smoothing on top of the scrubbed hero film is what made it feel laggy and "floaty".
    if (window.matchMedia('(max-width: 767px), (pointer: coarse)').matches) {
      document.addEventListener('click', (event) => {
        const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
        const hash = anchor?.getAttribute('href');
        if (!anchor || !hash || hash.length < 2) return;
        const target = document.querySelector<HTMLElement>(hash);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    this.zone.runOutsideAngular(() => {
      const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, anchors: false });
      this.lenis = lenis;

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      // Hash links glide instead of jumping.
      document.addEventListener('click', (event) => {
        const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
        const hash = anchor?.getAttribute('href');
        if (!anchor || !hash || hash.length < 2) return;
        const target = document.querySelector<HTMLElement>(hash);
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
      });
    });
  }

  /**
   * Scrolls to a CSS selector or to a Y position, gliding unless `immediate` is set.
   * Works with or without Lenis (phones and reduced-motion use the browser's own scrolling).
   */
  scrollTo(target: string | number, immediate = false): void {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : null;
    if (typeof target === 'string' && !el) return;

    if (this.lenis) {
      const to = el ?? (target as number);
      this.lenis.scrollTo(
        to,
        immediate
          ? { immediate: true, force: true }
          : { duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) },
      );
      return;
    }
    const behavior: ScrollBehavior = immediate ? 'auto' : 'smooth';
    if (el) el.scrollIntoView({ behavior, block: 'start' });
    else window.scrollTo({ top: target as number, behavior });
  }

  stop(): void {
    this.lenis?.stop();
  }

  start(): void {
    this.lenis?.start();
  }
}
