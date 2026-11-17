import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { injectIsBrowser } from '../../core/platform';
import { SITE, whatsappLink } from '../../core/site.config';

gsap.registerPlugin(ScrollTrigger);

/** Closing section: big headline, plain contact details, and the centre's location on a map. */
@Component({
  selector: 'app-cta',
  standalone: true,
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CtaComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly isBrowser = injectIsBrowser();
  private mm?: gsap.MatchMedia;

  /** WhatsApp link; department pages pass one that names the department. */
  @Input() bookingUrl = whatsappLink();
  protected readonly phone = SITE.phoneDisplay;
  protected readonly phoneHref = SITE.phoneHref;
  protected readonly address = SITE.address;
  protected readonly email = SITE.email;
  protected readonly mapsUrl = SITE.mapsUrl;

  /** Constant, trusted Google Maps embed for the centre's coordinates (29.9999656, 31.0997028). */
  protected readonly mapEmbed: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://maps.google.com/maps?q=29.9999656,31.0997028&z=17&hl=ar&output=embed',
  );

  /** True while the map may be dragged and zoomed. */
  protected readonly mapLive = signal(false);
  private mapTimer = 0;

  protected activateMap(event: MouseEvent): void {
    this.mapLive.set(true);
    // A finger has no "pointer leaves": hand the page back after a moment so it can scroll again.
    window.clearTimeout(this.mapTimer);
    if ((event as PointerEvent).pointerType === 'touch') {
      this.mapTimer = window.setTimeout(() => this.mapLive.set(false), 6000);
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.zone.runOutsideAngular(() => {
      const root = this.host.nativeElement;
      this.mm = gsap.matchMedia(root);

      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.cta-line-inner', {
          yPercent: 125,
          skewY: 6,
          transformOrigin: '100% 100%',
          duration: 1.6,
          stagger: 0.14,
          ease: 'expo.out',
          scrollTrigger: { trigger: root, start: 'top 65%', once: true },
        });
      });
    });
  }

  ngOnDestroy(): void {
    if (this.isBrowser) window.clearTimeout(this.mapTimer);
    this.mm?.revert();
  }
}
