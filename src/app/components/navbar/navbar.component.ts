import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { PageStateService } from '../../core/page-state.service';
import { injectIsBrowser } from '../../core/platform';
import { NAV_LINKS, SITE, whatsappLink } from '../../core/site.config';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The host is a zero-height sticky rail so the floating bar overlays the hero
  // instead of pushing it down.
  host: { class: 'sticky top-0 z-50 block h-0' },
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly pageState = inject(PageStateService);
  private readonly isBrowser = injectIsBrowser();

  constructor() {
    // With the phone menu open the page behind it must not scroll under the visitor's finger.
    effect(() => {
      const open = this.menuOpen();
      if (this.isBrowser) document.documentElement.classList.toggle('menu-open', open);
    });
  }

  protected readonly links = NAV_LINKS;
  protected readonly brand = SITE.name;
  protected readonly descriptor = SITE.descriptor;
  protected readonly bookingUrl = whatsappLink();

  protected readonly phone = SITE.phoneDisplay;
  protected readonly phoneHref = SITE.phoneHref;

  /** The page being read ("/", "/car-care"…). In-page links (contact) point back at it. */
  protected readonly path = this.pageState.path;

  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);
  /** The bar slides away while reading downwards and returns on any upward scroll. */
  protected readonly hidden = signal(false);
  /** True once the contact section has reached the reading line. */
  private readonly atContact = signal(false);

  /** Which link is lit: the contact link near the end of the page, otherwise the page itself. */
  protected readonly active = computed(() =>
    this.atContact() ? 'contact' : this.path() === '/' ? 'home' : this.path().slice(1),
  );

  @ViewChild('progress', { static: true }) private readonly progress!: ElementRef<HTMLElement>;

  private lastY = 0;
  private max = -1;
  private contactTop = -1;

  private readonly measure = (): void => {
    this.max = document.documentElement.scrollHeight - window.innerHeight;
    const contact = document.getElementById('contact');
    this.contactTop = contact ? contact.getBoundingClientRect().top + window.scrollY : -1;
  };

  private readonly invalidate = (): void => {
    this.max = -1;
  };

  private readonly onScroll = (): void => {
    const y = window.scrollY;

    // Reading-progress hairline (direct DOM write: no change detection per scroll event).
    // Page metrics are measured only when the layout changes (resize, ScrollTrigger refresh);
    // reading them on every scroll event forced a layout while the pin was moving things.
    if (this.max < 0) this.measure();
    const max = this.max;
    this.progress.nativeElement.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // Only re-enter Angular when a value actually flips.
    const isScrolled = y > 24;
    const delta = y - this.lastY;
    let isHidden = this.hidden();
    if (y < 160) isHidden = false;
    else if (delta > 8) isHidden = true;
    else if (delta < -8) isHidden = false;
    if (Math.abs(delta) > 8 || y < 160) this.lastY = y;

    const reached =
      (max > 0 && y >= max - 4) || (this.contactTop >= 0 && this.contactTop - y <= window.innerHeight * 0.4);

    if (isScrolled !== this.scrolled() || isHidden !== this.hidden() || reached !== this.atContact()) {
      this.zone.run(() => {
        this.scrolled.set(isScrolled);
        this.hidden.set(isHidden);
        this.atContact.set(reached);
      });
    }
  };

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.invalidate, { passive: true });
      ScrollTrigger.addEventListener('refresh', this.invalidate);
    });
    this.onScroll();
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.invalidate);
    ScrollTrigger.removeEventListener('refresh', this.invalidate);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
