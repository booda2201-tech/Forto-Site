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

import { NAV_LINKS, SITE, whatsappLink } from '../../core/site.config';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class FooterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('word', { static: true }) private readonly word!: ElementRef<HTMLElement>;
  @ViewChild('card', { static: true }) private readonly card!: ElementRef<HTMLElement>;

  private readonly zone = inject(NgZone);
  private cleanup?: () => void;

  protected readonly site = SITE;
  protected readonly brand = SITE.name.trim();
  protected readonly departments = [
    { name: 'فورتو كار كير', latin: 'Forto Car Care' },
    { name: 'فورتو سيرفيس', latin: 'Forto Service' },
    { name: 'فورتو بروتكشن', latin: 'Forto Protection' },
  ] as const;
  protected readonly links = NAV_LINKS;
  protected readonly whatsapp = whatsappLink();
  protected readonly year = new Date().getFullYear();

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
