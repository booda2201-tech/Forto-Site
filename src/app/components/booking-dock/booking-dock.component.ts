import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { departmentBySlug } from '../../core/departments';
import { PageStateService } from '../../core/page-state.service';
import { SITE, whatsappLink } from '../../core/site.config';

/**
 * A floating booking bar. Once the visitor has scrolled past the first screen it slides up
 * from the bottom edge with the three things they need: book on WhatsApp, call, find us.
 * It tucks away again when the contact section is on screen, since that already says it all.
 */
@Component({
  selector: 'app-booking-dock',
  standalone: true,
  templateUrl: './booking-dock.component.html',
  styleUrl: './booking-dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dock-host' },
})
export class BookingDockComponent implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly pageState = inject(PageStateService);

  protected readonly visible = signal(false);

  /** The department of the page being read, if any: the booking message then names it. */
  private readonly dept = computed(() => departmentBySlug(this.pageState.path().replace(/^\//, '')));

  protected readonly bookUrl = computed(() => this.dept()?.bookingUrl ?? whatsappLink());
  protected readonly subtitle = computed(() => this.dept()?.title ?? 'على واتساب');

  protected readonly phoneHref = SITE.phoneHref;
  protected readonly mapsUrl = SITE.mapsUrl;

  /** Same query the centre section uses to decide whether it pins. */
  private readonly pinnedLayout = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');

  private frame = 0;
  private readonly onScroll = (): void => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  };

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onScroll, { passive: true });
    });
    this.onScroll();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    cancelAnimationFrame(this.frame);
  }

  /**
   * The "see the station" section pins to the screen on desktop and its photo, counter and list
   * fill the bottom edge, exactly where the dock sits. Step aside while that section is on screen.
   */
  private overStage(vh: number): boolean {
    if (!this.pinnedLayout.matches) return false;
    const stage = document.getElementById('center');
    if (!stage) return false;
    const r = stage.getBoundingClientRect();
    return r.top < vh * 0.5 && r.bottom > vh * 0.5;
  }

  private update(): void {
    const vh = window.innerHeight;
    const pastIntro = window.scrollY > vh * 0.7;
    const contact = document.getElementById('contact');
    const contactInView = !!contact && contact.getBoundingClientRect().top < vh - 80;
    const next = pastIntro && !contactInView && !this.overStage(vh);
    if (next !== this.visible()) this.zone.run(() => this.visible.set(next));
  }
}
