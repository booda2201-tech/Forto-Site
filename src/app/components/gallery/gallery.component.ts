import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { SITE } from '../../core/site.config';

gsap.registerPlugin(ScrollTrigger);

interface GalleryItem {
  title: string;
  category: string;
  /** Layout classes for the bento grid. */
  span: string;
  /** Fallback placeholder tone, used only when `image` is not set. */
  tone: 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
  /** Image under `public/` (served from the site root). */
  image?: string;
  /** CSS `object-position` used to frame the crop. */
  focus?: string;
}

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

  protected readonly instagram = SITE.social.instagram;

  // Photos come from the brand's own Instagram / Facebook pages and the centre renders
  // (see `public/brand`). Swap in full-resolution originals using the same file names.
  protected readonly items: readonly GalleryItem[] = [
    {
      title: 'من الحادث للتسليم',
      category: 'سمكرة ودهان',
      span: 'col-span-2 row-span-2',
      tone: 'a',
      image: 'brand/accident-to-done.jpg',
      focus: '50% 40%',
    },
    {
      title: 'غرفة الدهان',
      category: 'دهان وحماية',
      span: 'col-span-1',
      tone: 'b',
      image: 'brand/paint-booth.jpg',
      focus: '50% 55%',
    },
    {
      title: 'تلميع وإزالة الخدوش',
      category: 'غسيل وتلميع',
      span: 'col-span-1',
      tone: 'c',
      image: 'brand/detailing-coupe.jpg',
      focus: '50% 80%',
    },
    {
      title: 'ورشة مجهّزة بالكامل',
      category: 'ميكانيكا وصيانة',
      span: 'col-span-1',
      tone: 'd',
      image: 'brand/workshop.jpg',
      focus: '50% 40%',
    },
    {
      title: 'مركز فورتو من الجو',
      category: 'مركز فورتو',
      span: 'col-span-1',
      tone: 'e',
      image: 'brand/place-aerial.jpg',
      focus: '50% 45%',
    },
  ];

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
