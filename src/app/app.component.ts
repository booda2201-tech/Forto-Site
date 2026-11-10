import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import AOS from 'aos';

import { CenterComponent } from './components/center/center.component';
import { CtaComponent } from './components/cta/cta.component';
import { CursorComponent } from './components/cursor/cursor.component';
import { FooterComponent } from './components/footer/footer.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { HeroStoryComponent } from './components/hero-story/hero-story.component';
import { ManifestoComponent } from './components/manifesto/manifesto.component';
import { MarqueeComponent } from './components/marquee/marquee.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PreloaderComponent } from './components/preloader/preloader.component';
import { ReelsComponent } from './components/reels/reels.component';
import { ServicesComponent } from './components/services/services.component';
import { SmoothScrollService } from './core/smooth-scroll.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    PreloaderComponent,
    CursorComponent,
    NavbarComponent,
    HeroStoryComponent,
    MarqueeComponent,
    ManifestoComponent,
    ServicesComponent,
    CenterComponent,
    ReelsComponent,
    GalleryComponent,
    CtaComponent,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
  private readonly smoothScroll = inject(SmoothScrollService);

  ngOnInit(): void {
    this.smoothScroll.init();

    AOS.init({
      duration: 1000,
      easing: 'ease-out-cubic',
      offset: 80,
      once: true,
      // Respect users who prefer reduced motion.
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  }

  ngAfterViewInit(): void {
    // Child views are rendered now; make sure AOS has measured every [data-aos] node.
    AOS.refreshHard();
  }
}
