import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

import { CenterComponent } from '../../components/center/center.component';
import { CtaComponent } from '../../components/cta/cta.component';
import { HeroStoryComponent } from '../../components/hero-story/hero-story.component';
import { MarqueeComponent } from '../../components/marquee/marquee.component';
import { ReelsComponent } from '../../components/reels/reels.component';
import { ServicesComponent } from '../../components/services/services.component';
import { CENTER_REELS } from '../../core/departments';

/** Home: the hero, then straight to the three departments, the place, a tour video and how to reach us. */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HeroStoryComponent, MarqueeComponent, ServicesComponent, CenterComponent, ReelsComponent, CtaComponent],
  template: `
    <app-hero-story />
    <app-marquee />
    <app-services />
    <app-center />
    <app-reels [reels]="centerReels" kicker="فيديو المركز" titleLead="خد" titleAccent="جولة" titleTail="في المركز" />
    <app-cta />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HomePage implements OnInit {
  private readonly meta = inject(Meta);

  protected readonly centerReels = CENTER_REELS;

  ngOnInit(): void {
    this.meta.updateTag({
      name: 'description',
      content:
        'فورتو لخدمة السيارات في الهرم، الجيزة: غسيل وتلميع (كار كير)، ميكانيكا وصيانة (سيرفيس)، وسمكرة ودهان ونانو سيراميك (بروتكشن). احجز موعدك الآن.',
    });
  }
}
