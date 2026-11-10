import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';

import { NAV_LINKS, SITE, whatsappLink } from '../../core/site.config';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The host is a zero-height sticky rail so the floating bar overlays the hero
  // instead of pushing it down.
  host: { class: 'sticky top-0 z-50 block h-0' },
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);

  protected readonly links = NAV_LINKS;
  protected readonly brand = SITE.name;
  protected readonly descriptor = SITE.descriptor;
  protected readonly bookingUrl = whatsappLink();

  protected readonly phone = SITE.phoneDisplay;
  protected readonly phoneHref = SITE.phoneHref;

  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);
  /** The bar slides away while reading downwards and returns on any upward scroll. */
  protected readonly hidden = signal(false);
  /** Href of the section currently in view (scroll-spy). */
  protected readonly active = signal<string>('#home');

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

    const nextActive = this.findActive(max, y);

    if (isScrolled !== this.scrolled() || isHidden !== this.hidden() || nextActive !== this.active()) {
      this.zone.run(() => {
        this.scrolled.set(isScrolled);
        this.hidden.set(isHidden);
        this.active.set(nextActive);
      });
    }
  };

  /** The last section whose top has crossed 40% of the viewport. */
  private findActive(max: number, y: number): string {
    if (max > 0 && y >= max - 4) return this.links[this.links.length - 1]!.href;
    const line = window.innerHeight * 0.4;
    let current = this.links[0]!.href;
    for (const link of this.links) {
      const el = document.querySelector(link.href);
      if (el && el.getBoundingClientRect().top <= line) current = link.href;
    }
    return current;
  }

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
