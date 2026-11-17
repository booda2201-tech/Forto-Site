import { Injectable } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Scrolling is the browser's own. A JavaScript smooth scroller (Lenis) used to sit on top of it,
 * but it replaces the wheel with its own animation, and next to the pinned section, the scrubbed
 * parallax and the sticky bars that made the page feel detached and jittery. The browser's native
 * scrolling is already smooth and runs on the compositor, so ScrollTrigger just follows it.
 *
 * What is left here: ScrollTrigger setup, gliding to sections (anchors, route changes) and the lock
 * the preloader uses.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  readonly reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private ready = false;

  init(): void {
    if (typeof window === 'undefined' || this.ready) return; // prerendering: nothing to scroll
    this.ready = true;

    gsap.registerPlugin(ScrollTrigger);
    // Phones: the URL bar sliding in/out resizes the viewport while scrolling. Don't rebuild every
    // pinned timeline for it.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // In-page links (#services…) glide to their section.
    document.addEventListener('click', (event) => {
      const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = anchor?.getAttribute('href');
      if (!anchor || !hash || hash.length < 2) return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: this.reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /** Scrolls to a CSS selector or to a Y position, gliding unless `immediate` is set. */
  scrollTo(target: string | number, immediate = false): void {
    if (typeof window === 'undefined') return;
    const behavior: ScrollBehavior = immediate || this.reducedMotion ? 'auto' : 'smooth';
    if (typeof target === 'string') {
      document.querySelector<HTMLElement>(target)?.scrollIntoView({ behavior, block: 'start' });
    } else {
      window.scrollTo({ top: target, behavior });
    }
  }

  // The preloader holds the page still with the `is-loading` class; nothing else to pause.
  stop(): void {}
  start(): void {}
}
