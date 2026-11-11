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

import { TiltDirective } from '../../directives/tilt.directive';

gsap.registerPlugin(ScrollTrigger);

/** One department of the Forto centre. Every department is named "Forto <name>". */
interface Department {
  /** What the department does, in plain Arabic, e.g. "الغسيل والتلميع". */
  title: string;
  /** Latin brand name, e.g. "Forto Car Care". */
  subtitle: string;
  /** Arabic brand name shown as the small tag above the title, e.g. "فورتو كار كير". */
  role: string;
  description: string;
  /** What is done in this department. */
  items: readonly string[];
  /** Photo revealed behind the card on hover. */
  image: string;
  /** CSS `object-position` used to frame the photo inside the card. */
  focus: string;
  /** SVG path data (24x24 stroke icon). */
  paths: readonly string[];
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [TiltDirective],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ServicesComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private mm?: gsap.MatchMedia;

  protected readonly intro =
    'كل اللي عربيتك محتاجاه في مكان واحد: غسيل وتلميع، ميكانيكا وصيانة، وسمكرة ودهان وحماية.';

  // The headline of each card says what the department does, in plain words.
  // The brand name ("Forto Car Care", …) sits above it as a small tag.
  protected readonly departments: readonly Department[] = [
    {
      title: 'الغسيل والتلميع',
      subtitle: 'Forto Car Care',
      role: 'فورتو كار كير',
      description: 'عربيتك تطلع من عندنا نضيفة ولمّاعة، من المحرك للجنوط للداخلية.',
      items: [
        'غسيل كيميائي كامل: محرك وداخلية وجنوط',
        'تلميع وإزالة الخدوش',
        'إزالة الأسمنت والقطران من الدهان',
      ],
      image: 'brand/detailing-coupe.jpg',
      focus: '40% 30%',
      paths: [
        'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
        'M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z',
      ],
    },
    {
      title: 'الميكانيكا والصيانة',
      subtitle: 'Forto Service',
      role: 'فورتو سيرفيس',
      description: 'بنكشف على عربيتك ونصلّحها على إيد فنيين متخصصين.',
      items: ['فحص وصيانة المحرك', 'العفشة ونظام التعليق'],
      image: 'brand/workshop.jpg',
      focus: '50% 38%',
      paths: [
        'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
      ],
    },
    {
      title: 'السمكرة والحماية',
      subtitle: 'Forto Protection',
      role: 'فورتو بروتكشن',
      description: 'نرجّع دهان عربيتك زي الجديد، وبعدها نحميه بطبقة نانو سيراميك.',
      items: [
        'سمكرة ودهان (دوكو)',
        'من الحادث لحد التسليم',
        'نانو سيراميك: لمعان عميق وحماية كل يوم',
      ],
      image: 'brand/paint-booth.jpg',
      focus: '50% 62%',
      paths: [
        'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
        'm9 12 2 2 4-4',
      ],
    },
  ];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.mm = gsap.matchMedia(this.host.nativeElement);
      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          defaults: { ease: 'expo.out' },
          scrollTrigger: { trigger: '.services-head', start: 'top 80%', once: true },
        });

        // Line-level reveal (never per-letter: that would break Arabic letter joining).
        tl.from('.services-kicker', { autoAlpha: 0, y: 16, duration: 0.9 })
          .from('.services-title-inner', { yPercent: 125, skewY: 5, transformOrigin: '100% 100%', duration: 1.5 }, '-=0.6')
          .from('.services-intro', { y: 26, autoAlpha: 0, duration: 1.1 }, '-=1');
      });
    });
  }

  ngOnDestroy(): void {
    this.mm?.revert();
  }
}
