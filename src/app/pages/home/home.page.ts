import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

import { CenterComponent } from '../../components/center/center.component';
import { CtaComponent } from '../../components/cta/cta.component';
import { HeroStoryComponent } from '../../components/hero-story/hero-story.component';
import { MarqueeComponent } from '../../components/marquee/marquee.component';
import { ServicesComponent } from '../../components/services/services.component';

/** Home: the hero, then straight to the three departments, the place and how to reach us. */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HeroStoryComponent, MarqueeComponent, ServicesComponent, CenterComponent, CtaComponent],
  template: `
    <app-hero-story />
    <app-marquee />
    <app-services />
    <app-center />
    <app-cta />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HomePage implements OnInit {
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.meta.updateTag({
      name: 'description',
      content:
        'فورتو لخدمة السيارات في الهرم، الجيزة: غسيل وتلميع (كار كير)، ميكانيكا وصيانة (سيرفيس)، وسمكرة ودهان ونانو سيراميك (بروتكشن). احجز موعدك الآن.',
    });
  }
}
