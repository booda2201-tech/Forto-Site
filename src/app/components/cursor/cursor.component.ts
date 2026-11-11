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
import { gsap } from 'gsap';

/** Custom cursor: dot + trailing ring that morphs over interactive elements. Desktop only. */
@Component({
  selector: 'app-cursor',
  standalone: true,
  template: `
    <div #ring class="cursor-ring" aria-hidden="true"><span #label class="cursor-label"></span></div>
    <div #dot class="cursor-dot" aria-hidden="true"></div>
  `,
  styleUrl: './cursor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ring', { static: true }) private readonly ring!: ElementRef<HTMLElement>;
  @ViewChild('dot', { static: true }) private readonly dot!: ElementRef<HTMLElement>;
  @ViewChild('label', { static: true }) private readonly label!: ElementRef<HTMLElement>;

  private readonly zone = inject(NgZone);
  private cleanup?: () => void;

  ngAfterViewInit(): void {
    // No custom cursor on touch devices or phone-sized screens (also when a desktop browser emulates one).
    if (!window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)').matches) {
      this.ring.nativeElement.remove();
      this.dot.nativeElement.remove();
      return;
    }

    this.zone.runOutsideAngular(() => {
      const ring = this.ring.nativeElement;
      const dot = this.dot.nativeElement;
      const label = this.label.nativeElement;
      document.documentElement.classList.add('has-custom-cursor');

      gsap.set([ring, dot], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
      const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
      const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
      const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2' });
      const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2' });

      let visible = false;
      const move = (e: PointerEvent): void => {
        if (!visible) {
          visible = true;
          gsap.set([ring, dot], { x: e.clientX, y: e.clientY });
          gsap.to([ring, dot], { autoAlpha: 1, duration: 0.4 });
        }
        ringX(e.clientX);
        ringY(e.clientY);
        dotX(e.clientX);
        dotY(e.clientY);

        const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
          'a, button, [data-cursor], input, textarea',
        );
        const text = target?.dataset['cursor'] ?? '';
        const interactive = !!target;
        ring.classList.toggle('is-active', interactive);
        ring.classList.toggle('has-label', !!text);
        label.textContent = text;
        dot.classList.toggle('is-hidden', !!text);
      };
      const down = (): void => ring.classList.add('is-down');
      const up = (): void => ring.classList.remove('is-down');
      const leave = (): void => {
        visible = false;
        gsap.to([ring, dot], { autoAlpha: 0, duration: 0.3 });
      };

      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerdown', down);
      window.addEventListener('pointerup', up);
      document.documentElement.addEventListener('pointerleave', leave);

      this.cleanup = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerdown', down);
        window.removeEventListener('pointerup', up);
        document.documentElement.removeEventListener('pointerleave', leave);
        document.documentElement.classList.remove('has-custom-cursor');
      };
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
