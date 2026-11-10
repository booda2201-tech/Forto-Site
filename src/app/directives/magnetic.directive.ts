import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject, input } from '@angular/core';
import { gsap } from 'gsap';

/** Element gently follows the pointer while hovered (desktop pointers only). */
@Directive({ selector: '[appMagnetic]', standalone: true })
export class MagneticDirective implements OnInit, OnDestroy {
  readonly strength = input(0.35, { alias: 'appMagnetic' });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private cleanup?: () => void;

  ngOnInit(): void {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    this.zone.runOutsideAngular(() => {
      const toX = gsap.quickTo(this.el, 'x', { duration: 0.6, ease: 'power3' });
      const toY = gsap.quickTo(this.el, 'y', { duration: 0.6, ease: 'power3' });
      const strength = Number(this.strength()) || 0.35;

      const move = (e: PointerEvent): void => {
        const r = this.el.getBoundingClientRect();
        toX((e.clientX - (r.left + r.width / 2)) * strength);
        toY((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const leave = (): void => {
        gsap.to(this.el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: true });
      };

      this.el.addEventListener('pointermove', move);
      this.el.addEventListener('pointerleave', leave);
      this.cleanup = () => {
        this.el.removeEventListener('pointermove', move);
        this.el.removeEventListener('pointerleave', leave);
        gsap.killTweensOf(this.el);
      };
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
