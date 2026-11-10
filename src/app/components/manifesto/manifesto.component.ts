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

gsap.registerPlugin(ScrollTrigger);

interface Word {
  t: string;
  accent?: boolean;
}

interface Fact {
  value: string;
  label: string;
}

/** A statement whose words light up one by one as you scroll. Word-level only, so Arabic letters keep joining. */
@Component({
  selector: 'app-manifesto',
  standalone: true,
  templateUrl: './manifesto.component.html',
  styleUrl: './manifesto.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ManifestoComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private mm?: gsap.MatchMedia;

  protected readonly words: readonly Word[] = [
    ...'ميكانيكا. سمكرة. دهان.'.split(' ').map((t) => ({ t })),
    ...'نانو سيراميك. تلميع.'.split(' ').map((t) => ({ t, accent: true })),
    ...'كل اللي عربيتك محتاجاه، تحت سقف واحد على الدائري.'.split(' ').map((t) => ({ t })),
  ];

  protected readonly facts: readonly Fact[] = [
    { value: '3', label: 'أقسام متخصصة تحت سقف واحد' },
    { value: '733K', label: 'مشاهدة على أقوى فيديو لنا' },
    { value: '15K+', label: 'متابع على إنستجرام' },
  ];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const root = this.host.nativeElement;
      this.mm = gsap.matchMedia(root);

      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(root.querySelectorAll('.mw'), {
          opacity: 1,
          ease: 'none',
          stagger: 0.12,
          scrollTrigger: { trigger: '.manifesto-text', start: 'top 82%', end: 'bottom 52%', scrub: 0.5 },
        });

        gsap.from(root.querySelectorAll('.fact'), {
          y: 50,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.manifesto-facts', start: 'top 88%', once: true },
        });
      });

      this.mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(root.querySelectorAll('.mw'), { opacity: 1 });
      });
    });
  }

  ngOnDestroy(): void {
    this.mm?.revert();
  }
}
