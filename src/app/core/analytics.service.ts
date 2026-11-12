import { Injectable, NgZone, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter } from 'rxjs';

import { ANALYTICS } from './analytics.config';
import { DEPARTMENTS, departmentBySlug } from './departments';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type EventParams = Record<string, string | number | boolean | undefined>;

interface QueuedEvent {
  name: string;
  ts: number;
  seq: number;
  vid: string;
  sid: string;
  params: Record<string, string | number | boolean>;
}

/** Where the visitor is right now. The behaviour tracker reads it and resets on every page change. */
export interface PageInfo {
  path: string;
  type: 'home' | 'department';
  department?: string;
  startedAt: number;
}

/**
 * The one place events are created and sent. It knows nothing about the DOM: clicks, scrolling,
 * errors and speed are collected by BehaviorTrackerService and handed over through `track()`.
 *
 * Nothing personal is ever collected (no form values, no phone numbers typed by visitors). Visitors
 * with Do-Not-Track on, and browsers where `?no_track=1` was opened once (use it on your own and
 * your staff's devices), send nothing.
 *
 * Events (all carry page_path, page_type, department, device_type, connection):
 *   session_start · page_view · page_exit · quick_exit
 *   contact_click { method: whatsapp|call|email|directions, location, department }
 *   generate_lead  (whatsapp, call or email: the "conversion", mark it as a key event in GA4)
 *   social_click · department_click · section_view · service_view · scroll_depth
 *   dead_click · rage_click · form_error · no_availability
 *   web_vital { metric_name, metric_value, metric_rating } · js_error · resource_error
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  readonly page: PageInfo = { path: '', type: 'home', startedAt: 0 };
  /** Emits after `page` was updated for a new page (not for #section jumps on the same page). */
  readonly pageChange$ = new Subject<void>();

  /** Pages seen in this tab session. */
  pagesViewed = 0;
  /** First page of the session, for LCP/CLS which belong to the landing page. */
  landingPath = '';

  private enabled = false;
  /** The gtag snippet in index.html is in charge of Google Analytics (and of its page views). */
  private pageOwnsGa = false;
  private visitorId = '';
  private sessionId = '';
  private seq = 0;
  private queue: QueuedEvent[] = [];
  private flushTimer = 0;
  private readonly debug = ANALYTICS.debug || this.readStorage(localStorage, 'forto_debug') === '1';

  init(): void {
    if (this.enabled) return;

    // ?no_track=1 switches tracking off on this browser for good; ?no_track=0 switches it back on.
    const flag = new URLSearchParams(location.search).get('no_track');
    if (flag === '1') this.writeStorage(localStorage, 'forto_no_track', '1');
    if (flag === '0') this.writeStorage(localStorage, 'forto_no_track', '');
    const optedOut = this.readStorage(localStorage, 'forto_no_track') === '1' || navigator.doNotTrack === '1';
    if (optedOut) return;

    this.enabled = true;
    this.visitorId = this.readStorage(localStorage, 'forto_vid') || this.uuid();
    this.writeStorage(localStorage, 'forto_vid', this.visitorId);

    let sid = this.readStorage(sessionStorage, 'forto_sid');
    const isNewSession = !sid;
    sid = sid || this.uuid();
    this.sessionId = sid;
    this.writeStorage(sessionStorage, 'forto_sid', sid);

    this.loadGa4();

    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      const path = e.urlAfterRedirects.split('#')[0]!.split('?')[0] || '/';
      // A click on a #section link of the page you are on re-fires NavigationEnd: not a new page.
      if (path === this.page.path) return;
      this.openPage(path, isNewSession && this.pagesViewed === 0);
    });

    // Send what is queued when the tab goes away (mobile browsers fire this instead of unload).
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
    window.addEventListener('pagehide', () => this.flush());
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Records one event. Safe to call from anywhere, any time; does nothing when tracking is off. */
  track(name: string, params: EventParams = {}): void {
    if (!this.enabled) return;

    const merged: Record<string, string | number | boolean> = {
      page_path: this.page.path,
      page_type: this.page.type,
      device_type: this.deviceType(),
    };
    if (this.page.department) merged['department'] = this.page.department;
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    if (connection?.effectiveType) merged['connection'] = connection.effectiveType;
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) merged[key] = typeof value === 'string' ? value.slice(0, 100) : value;
    }

    if (this.debug) console.debug('[analytics]', name, merged);

    if (ANALYTICS.ga4Id && window.gtag && !(this.pageOwnsGa && name === 'page_view')) window.gtag('event', name, merged);

    if (ANALYTICS.endpoint) {
      this.queue.push({ name, ts: Date.now(), seq: ++this.seq, vid: this.visitorId, sid: this.sessionId, params: merged });
      if (this.queue.length >= 20) this.flush();
      else if (!this.flushTimer) this.flushTimer = window.setTimeout(() => this.flush(), 5000);
    }
  }

  /** For when a booking form exists: a field the visitor got wrong ("phone", "invalid_format"). */
  trackFormError(form: string, field: string, reason: string): void {
    this.track('form_error', { form, field, reason });
  }

  /** For when online booking exists: a day or time the visitor asked for and could not get. */
  trackNoAvailability(detail: { service?: string; date?: string; time?: string }): void {
    this.track('no_availability', { ...detail });
  }

  /** Department the page belongs to, or the one a booking link is for (from its WhatsApp text). */
  departmentOfUrl(url: string): string | undefined {
    try {
      const text = new URL(url, location.href).searchParams.get('text');
      const match = DEPARTMENTS.find((d) => new URL(d.bookingUrl).searchParams.get('text') === text);
      if (match) return match.slug;
    } catch {
      /* not a URL */
    }
    return this.page.department;
  }

  private openPage(path: string, firstOfSession: boolean): void {
    const slug = path.replace(/^\//, '');
    const dept = departmentBySlug(slug);

    this.page.path = path;
    this.page.type = dept ? 'department' : 'home';
    this.page.department = dept?.slug;
    this.page.startedAt = performance.now();
    this.pagesViewed++;
    if (!this.landingPath) this.landingPath = path;

    this.pageChange$.next();

    if (firstOfSession) this.track('session_start', { landing_path: path, viewport: `${innerWidth}x${innerHeight}` });
    // The page title is set by the router a moment after NavigationEnd.
    window.setTimeout(() => this.track('page_view', { page_title: document.title, page_number: this.pagesViewed }), 50);
  }

  private deviceType(): string {
    const w = window.innerWidth;
    return w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  }

  private flush(): void {
    window.clearTimeout(this.flushTimer);
    this.flushTimer = 0;
    if (!this.queue.length || !ANALYTICS.endpoint) return;

    const body = JSON.stringify({ events: this.queue });
    this.queue = [];
    // text/plain keeps this a "simple" request: no CORS preflight, and it survives page close.
    const sent = navigator.sendBeacon?.(ANALYTICS.endpoint, new Blob([body], { type: 'text/plain' }));
    if (!sent) {
      void fetch(ANALYTICS.endpoint, { method: 'POST', body, keepalive: true, mode: 'no-cors' }).catch(() => undefined);
    }
  }

  private loadGa4(): void {
    const id = ANALYTICS.ga4Id;
    if (!id) return;

    // index.html already carries Google's own tag: reuse it instead of loading a second copy
    // (which would count every visit twice). Google then records page views itself.
    if (typeof window.gtag === 'function') {
      this.pageOwnsGa = true;
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(): void {
      // gtag.js only understands the `arguments` object, not an array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: false, transport_type: 'beacon' });

    // Fetch the library after the page is idle so it never competes with the first paint.
    const load = (): void => {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(s);
    };
    this.zone.runOutsideAngular(() => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(load, { timeout: 4000 });
      else window.setTimeout(load, 2000);
    });
  }

  private uuid(): string {
    return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private readStorage(store: Storage, key: string): string {
    try {
      return store.getItem(key) ?? '';
    } catch {
      return '';
    }
  }

  private writeStorage(store: Storage, key: string, value: string): void {
    try {
      store.setItem(key, value);
    } catch {
      /* private mode */
    }
  }
}
