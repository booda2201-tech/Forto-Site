import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { DepartmentPhoto } from '../../core/departments';

gsap.registerPlugin(ScrollTrigger);

/**
 * A grid of photos with captions. Used on the department pages for the department's own
 * space and for its finished work. Photos live under `public/brand`; swap in real ones
 * with the same file names.
 */
@Component({
  selector: 'app-gallery',
  standalone: true,
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class GalleryComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private mm?: gsap.MatchMedia;

  @Input({ required: true }) items: readonly DepartmentPhoto[] = [];
  /** Small label above the heading. */
  @Input() kicker = '';
  /** Heading: plain lead + orange accent word. */
  @Input() titleLead = '';
  @Input() titleAccent = '';

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const root = this.host.nativeElement;
      this.mm = gsap.matchMedia(root);
      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Photos drift inside their frames as you scroll: cheap depth without 3D.
        gsap.utils.toArray<HTMLElement>('.gallery-tile', root).forEach((tile) => {
          const img = tile.querySelector('.tile-img');
          if (!img) return;
          gsap.fromTo(
            img,
            { yPercent: -7, scale: 1.18 },
            {
              yPercent: 7,
              ease: 'none',
              scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        });

        gsap.from('.gallery-title-inner', {
          yPercent: 125,
          skewY: 5,
          transformOrigin: '100% 100%',
          duration: 1.5,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.gallery-head', start: 'top 80%', once: true },
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.mm?.revert();
  }
}
