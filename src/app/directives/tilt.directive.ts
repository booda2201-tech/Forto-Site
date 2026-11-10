import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { gsap } from 'gsap';

/**
 * 3D tilt + a cursor-following spotlight. Exposes `--mx` / `--my` (px) as CSS
 * variables so the stylesheet decides how the light looks.
 */
@Directive({ selector: '[appTilt]', standalone: true })
export class TiltDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private cleanup?: () => void;

  ngOnInit(): void {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    this.zone.runOutsideAngular(() => {
      const rotX = gsap.quickTo(this.el, 'rotationX', { duration: 0.5, ease: 'power3' });
      const rotY = gsap.quickTo(this.el, 'rotationY', { duration: 0.5, ease: 'power3' });
      gsap.set(this.el, { transformPerspective: 900, transformOrigin: 'center' });

      const move = (e: PointerEvent): void => {
        const r = this.el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        this.el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        this.el.style.setProperty('--my', `${e.clientY - r.top}px`);
        rotY((px - 0.5) * 10);
        rotX((0.5 - py) * 10);
      };
      const leave = (): void => {
        rotX(0);
        rotY(0);
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
