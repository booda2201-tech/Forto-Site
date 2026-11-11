import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { DEPARTMENTS } from '../../core/departments';
import { PageStateService } from '../../core/page-state.service';
import { NAV_LINKS, SITE, whatsappLink } from '../../core/site.config';
import { SmoothScrollService } from '../../core/smooth-scroll.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class FooterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('word', { static: true }) private readonly word!: ElementRef<HTMLElement>;
  @ViewChild('card', { static: true }) private readonly card!: ElementRef<HTMLElement>;

  private readonly zone = inject(NgZone);
  private readonly smoothScroll = inject(SmoothScrollService);
  private cleanup?: () => void;

  protected readonly site = SITE;
  protected readonly brand = SITE.name.trim();
  protected readonly departments = DEPARTMENTS;
  protected readonly links = NAV_LINKS;
  /** The page being read: in-page links (contact) point back at it. */
  protected readonly path = inject(PageStateService).path;
  protected readonly whatsapp = whatsappLink();
  protected readonly year = new Date().getFullYear();

  protected toTop(event: Event): void {
    event.preventDefault();
    this.smoothScroll.scrollTo(0);
  }

  /** The glow layer follows the pointer: we only write two CSS variables, no re-render. */
  ngAfterViewInit(): void {
    const el = this.word.nativeElement;
    const card = this.card.nativeElement;

    this.zone.runOutsideAngular(() => {
      const move = (event: PointerEvent): void => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        el.style.setProperty('--my', `${event.clientY - rect.top}px`);
        el.classList.add('is-lit');
      };
      const leave = (): void => el.classList.remove('is-lit');

      card.addEventListener('pointermove', move, { passive: true });
      card.addEventListener('pointerdown', move, { passive: true });
      card.addEventListener('pointerleave', leave);
      card.addEventListener('pointercancel', leave);

      this.cleanup = (): void => {
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerdown', move);
        card.removeEventListener('pointerleave', leave);
        card.removeEventListener('pointercancel', leave);
      };
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
