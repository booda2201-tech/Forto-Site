import { Injectable, NgZone, inject } from '@angular/core';

import { ANALYTICS } from './analytics.config';
import { AnalyticsService } from './analytics.service';
import { DEPARTMENTS } from './departments';

/** Page area a click or a link belongs to, by the component it sits in (first match wins). */
const LOCATIONS: readonly (readonly [selector: string, name: string])[] = [
  ['app-navbar', 'navbar'],
  ['app-booking-dock', 'dock'],
  ['app-hero-story', 'hero'],
  ['app-services', 'services'],
  ['app-center', 'center'],
  ['.dept-hero', 'dept_hero'],
  ['.dept-contact', 'dept_contact'],
  ['.dept-other', 'other_departments'],
  ['app-reels', 'reels'],
  ['app-gallery', 'gallery'],
  ['app-cta', 'cta'],
  ['app-footer', 'footer'],
];

/** Parts of a page whose first appearance on screen is recorded as `section_view`. */
const SECTIONS: readonly (readonly [selector: string, name: string])[] = [
  ['#services', 'services'],
  ['#center', 'center'],
  ['#reels', 'reels'],
  ['app-gallery', 'gallery'],
  ['.dept-contact', 'dept_contact'],
  ['#contact', 'contact'],
  ['footer', 'footer'],
];

/** Things a visitor can reasonably expect to react when clicked. */
const INTERACTIVE =
  'a[href], button, input, select, textarea, label, summary, video, [role="button"], [role="link"], [role="tab"], [tabindex], [data-cursor]';

const SCROLL_STEPS = [25, 50, 75, 100] as const;
const MAX_DEAD_CLICKS = 20;
const MAX_ERRORS = 10;

/**
 * Watches how people use the site and reports it through AnalyticsService: which contact button
 * they used, how far they read, clicks that do nothing, angry repeated clicks, leaving fast,
 * page speed on their device, and things that break.
 *
 * Everything runs outside Angular's zone with passive listeners, so it never triggers change
 * detection and never touches scrolling.
 */
@Injectable({ providedIn: 'root' })
export class BehaviorTrackerService {
  private readonly analytics = inject(AnalyticsService);
  private readonly zone = inject(NgZone);

  private started = false;

  // Per session
  private interacted = false;
  private deadClicks = 0;
  private errors = 0;
  private readonly seenErrors = new Set<string>();
  private quickExitSent = false;

  // Per page
  private maxScroll = 0;
  private scrollSent = new Set<number>();
  private sectionObserver?: IntersectionObserver;
  private sectionsSeen = new Set<string>();
  private scanTimers: number[] = [];
  private exitSent = false;

  // Rage-click detection
  private recent: { t: number; x: number; y: number }[] = [];
  private lastRage = 0;

  private scrollFrame = 0;

  start(): void {
    if (this.started || !this.analytics.isEnabled) return;
    this.started = true;

    this.zone.runOutsideAngular(() => {
      document.addEventListener('click', this.onClick, { capture: true, passive: true });
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('keydown', this.markInteracted, { passive: true, once: true });
      window.addEventListener('touchstart', this.markInteracted, { passive: true, once: true });
      document.addEventListener('visibilitychange', this.onVisibility);
      window.addEventListener('pagehide', this.onLeave);
      // `true`: resource errors (a missing image or video) do not bubble.
      window.addEventListener('error', this.onError, true);
      window.addEventListener('unhandledrejection', this.onRejection);

      this.analytics.pageChange$.subscribe(() => this.onNewPage());
      this.onNewPage();
      this.startVitals();
    });
  }

  /** Called from the app's ErrorHandler for errors Angular catches itself. */
  reportError(error: unknown): void {
    const e = error instanceof Error ? error : new Error(String(error));
    this.sendError('js_error', e.message, e.stack?.split('\n')[1]?.trim());
  }

  // ---------- Clicks ----------

  private readonly onClick = (e: MouseEvent): void => {
    this.interacted = true;
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    this.detectRage(e, target);

    const link = target.closest<HTMLAnchorElement>('a[href]');
    if (link) {
      this.trackLink(link);
      return;
    }
    if (this.isInteractive(target)) return;

    // Selecting text is not a dead click.
    if (window.getSelection()?.toString()) return;
    if (this.deadClicks >= MAX_DEAD_CLICKS) return;
    this.deadClicks++;
    this.analytics.track('dead_click', {
      target: this.describe(target),
      location: this.locationOf(target),
      x_pct: Math.round((e.clientX / innerWidth) * 100),
      y_pct_page: Math.round(((scrollY + e.clientY) / document.documentElement.scrollHeight) * 100),
    });
  };

  private trackLink(a: HTMLAnchorElement): void {
    const href = a.getAttribute('href') ?? '';
    const where = this.locationOf(a);
    const label = (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim();

    let method: string | undefined;
    if (href.startsWith('tel:')) method = 'call';
    else if (href.startsWith('mailto:')) method = 'email';
    else {
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      const host = url.hostname.replace(/^www\./, '');
      if (host === 'wa.me' || host.endsWith('whatsapp.com')) method = 'whatsapp';
      else if (host === 'maps.app.goo.gl' || (host.startsWith('google.') && url.pathname.startsWith('/maps'))) method = 'directions';
      else if (host.endsWith('instagram.com') || host.endsWith('facebook.com')) {
        this.analytics.track('social_click', { network: host.split('.')[0], location: where });
        return;
      } else if (url.origin === window.location.origin) {
        const slug = url.pathname.replace(/^\//, '');
        const dept = DEPARTMENTS.find((d) => d.slug === slug);
        if (dept) this.analytics.track('department_click', { target_department: dept.slug, location: where });
        return;
      } else return;
    }

    const department = method === 'whatsapp' ? this.analytics.departmentOfUrl(a.href) : this.analytics.page.department;
    this.analytics.track('contact_click', { method, location: where, department, label });
    // Directions is useful to know about but is not someone asking for a service.
    if (method !== 'directions') this.analytics.track('generate_lead', { method, location: where, department });
  }

  /** 3+ clicks within a second, close together: something is not working or the visitor is annoyed. */
  private detectRage(e: MouseEvent, target: Element): void {
    const now = performance.now();
    this.recent = this.recent.filter((c) => now - c.t < 1000);
    this.recent.push({ t: now, x: e.clientX, y: e.clientY });
    if (this.recent.length < 3 || now - this.lastRage < 3000) return;
    const close = this.recent.every((c) => Math.hypot(c.x - e.clientX, c.y - e.clientY) < 50);
    if (!close) return;

    this.lastRage = now;
    const clicks = this.recent.length;
    this.recent = [];
    this.analytics.track('rage_click', {
      clicks,
      target: this.describe(target),
      location: this.locationOf(target),
      on_interactive: this.isInteractive(target),
    });
  }

  private isInteractive(el: Element): boolean {
    if (el.closest(INTERACTIVE)) return true;
    // Custom clickable things: the pointer cursor is the visitor's own hint that it is clickable.
    let node: Element | null = el;
    for (let i = 0; i < 4 && node; i++, node = node.parentElement) {
      if (getComputedStyle(node).cursor === 'pointer') return true;
    }
    return false;
  }

  // ---------- Pages, sections and scrolling ----------

  private onNewPage(): void {
    this.maxScroll = 0;
    this.scrollSent = new Set();
    this.sectionsSeen = new Set();
    this.exitSent = false;
    this.sectionObserver?.disconnect();
    this.scanTimers.forEach((t) => clearTimeout(t));

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          this.sectionObserver?.unobserve(el);
          this.sectionSeen(el);
        }
      },
      // A part counts as seen once its top passes 60% down the screen, however tall it is.
      { rootMargin: '0px 0px -40% 0px', threshold: 0 },
    );

    // The new page renders (and lazy parts appear) after the route changes: look a few times.
    this.scanTimers = [400, 1500, 4000].map((ms) => window.setTimeout(() => this.scanSections(), ms));
  }

  private scanSections(): void {
    for (const [selector] of SECTIONS) {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => this.observe(el));
    }
    document.querySelectorAll<HTMLElement>('.dept-service').forEach((el) => this.observe(el));
  }

  private readonly observed = new WeakSet<Element>();
  private observe(el: Element): void {
    if (this.observed.has(el)) return;
    this.observed.add(el);
    this.sectionObserver?.observe(el);
  }

  private sectionSeen(el: HTMLElement): void {
    if (el.classList.contains('dept-service')) {
      const service = el.querySelector('.text-lg')?.textContent?.trim();
      if (service && !this.sectionsSeen.has(`service:${service}`)) {
        this.sectionsSeen.add(`service:${service}`);
        this.analytics.track('service_view', { service });
      }
      return;
    }
    const name = SECTIONS.find(([selector]) => el.matches(selector))?.[1];
    if (!name || this.sectionsSeen.has(name)) return;
    this.sectionsSeen.add(name);
    this.analytics.track('section_view', { section: name });
  }

  private readonly onScroll = (): void => {
    if (this.scrollFrame) return;
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      // Right after a page change the old scroll position is still there for a moment.
      if (performance.now() - this.analytics.page.startedAt < 600) return;
      const doc = document.documentElement;
      const pct = Math.round(((scrollY + innerHeight) / doc.scrollHeight) * 100);
      if (scrollY > 8) this.interacted = true;
      if (pct <= this.maxScroll) return;
      this.maxScroll = Math.min(pct, 100);
      for (const step of SCROLL_STEPS) {
        // Allow a little slack so a page that ends at 99.6% still counts as 100.
        if (this.maxScroll >= step - 1 && !this.scrollSent.has(step)) {
          this.scrollSent.add(step);
          this.analytics.track('scroll_depth', { percent: step });
        }
      }
    });
  };

  private readonly markInteracted = (): void => {
    this.interacted = true;
  };

  // ---------- Leaving ----------

  private readonly onVisibility = (): void => {
    if (document.visibilityState === 'hidden') this.onLeave();
    else this.exitSent = false; // came back: the next time they leave counts again
  };

  private readonly onLeave = (): void => {
    if (this.exitSent) return;
    this.exitSent = true;

    const seconds = Math.round((performance.now() - this.analytics.page.startedAt) / 1000);
    this.analytics.track('page_exit', {
      time_on_page_s: seconds,
      max_scroll_pct: this.maxScroll,
      pages_in_session: this.analytics.pagesViewed,
      engaged: this.interacted,
    });

    // Gone within seconds of arriving, having done nothing, on the only page they saw.
    if (
      !this.quickExitSent &&
      this.analytics.pagesViewed === 1 &&
      !this.interacted &&
      seconds < ANALYTICS.quickExitSeconds
    ) {
      this.quickExitSent = true;
      this.analytics.track('quick_exit', { time_on_page_s: seconds });
    }
  };

  // ---------- Errors ----------

  private readonly onError = (e: Event): void => {
    if (e instanceof ErrorEvent) {
      if (e.message.startsWith('ResizeObserver loop')) return;
      this.sendError('js_error', e.message, `${this.shortSource(e.filename)}:${e.lineno}`);
      return;
    }
    // A resource that failed to load: image, video, stylesheet, script.
    const el = e.target;
    if (el instanceof HTMLElement && /^(IMG|VIDEO|SOURCE|LINK|SCRIPT)$/.test(el.tagName)) {
      const src = (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src || (el as HTMLLinkElement).href || '';
      this.sendError('resource_error', `${el.tagName.toLowerCase()} failed`, this.shortSource(src));
    }
  };

  private readonly onRejection = (e: PromiseRejectionEvent): void => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
    this.sendError('js_error', `Unhandled: ${reason}`);
  };

  private sendError(event: 'js_error' | 'resource_error', message: string, source?: string): void {
    const key = `${event}|${message}|${source ?? ''}`;
    if (this.errors >= MAX_ERRORS || this.seenErrors.has(key)) return;
    this.seenErrors.add(key);
    this.errors++;
    this.analytics.track(event, { message, source });
  }

  private shortSource(url: string): string {
    try {
      const u = new URL(url, location.href);
      return u.origin === location.origin ? u.pathname : u.hostname + u.pathname;
    } catch {
      return url;
    }
  }

  // ---------- Speed ----------

  /** Real-device speed (LCP, CLS, INP, FCP, TTFB), reported once the visitor is done with the page. */
  private startVitals(): void {
    const load = (): void => {
      void import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        const report = (m: { name: string; value: number; rating: string; navigationType?: string }): void => {
          this.analytics.track('web_vital', {
            metric_name: m.name,
            // Time metrics are milliseconds; CLS has no unit, so it is sent x1000 to keep decimals.
            metric_value: Math.round(m.name === 'CLS' ? m.value * 1000 : m.value),
            metric_rating: m.rating,
            nav_type: m.navigationType,
            landing_path: this.analytics.landingPath,
          });
        };
        onTTFB(report);
        onFCP(report);
        onLCP(report);
        onCLS(report);
        onINP(report);
      });
    };
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(load, { timeout: 5000 });
    else window.setTimeout(load, 3000);
  }

  // ---------- Helpers ----------

  private locationOf(el: Element): string {
    for (const [selector, name] of LOCATIONS) if (el.closest(selector)) return name;
    return 'page';
  }

  private describe(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const classes = [...el.classList]
      .filter((c) => !/[:[\]/]/.test(c))
      .slice(0, 2)
      .map((c) => `.${c}`)
      .join('');
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 30);
    return `${tag}${id}${classes}${text ? ` "${text}"` : ''}`;
  }
}
