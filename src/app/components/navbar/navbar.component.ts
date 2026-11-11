import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageStateService } from '../../core/page-state.service';
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

  private readonly onScroll = (): void => {
    const y = window.scrollY;

    // Reading-progress hairline (direct DOM write: no change detection per scroll event).
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.progress.nativeElement.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // Only re-enter Angular when a value actually flips.
    const isScrolled = y > 24;
    const delta = y - this.lastY;
    let isHidden = this.hidden();
    if (y < 160) isHidden = false;
    else if (delta > 8) isHidden = true;
    else if (delta < -8) isHidden = false;
    if (Math.abs(delta) > 8 || y < 160) this.lastY = y;

    const contact = document.getElementById('contact');
    const reached =
      (max > 0 && y >= max - 4) ||
      (!!contact && contact.getBoundingClientRect().top <= window.innerHeight * 0.4);

    if (isScrolled !== this.scrolled() || isHidden !== this.hidden() || reached !== this.atContact()) {
      this.zone.run(() => {
        this.scrolled.set(isScrolled);
        this.hidden.set(isHidden);
        this.atContact.set(reached);
      });
    }
  };

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
    });
    this.onScroll();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
