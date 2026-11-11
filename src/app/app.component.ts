import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import AOS from 'aos';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subscription, filter } from 'rxjs';

import { BookingDockComponent } from './components/booking-dock/booking-dock.component';
import { CursorComponent } from './components/cursor/cursor.component';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PreloaderComponent } from './components/preloader/preloader.component';
import { AnalyticsService } from './core/analytics.service';
import { BehaviorTrackerService } from './core/behavior-tracker.service';
import { LoaderService } from './core/loader.service';
import { PageStateService } from './core/page-state.service';
import { SmoothScrollService } from './core/smooth-scroll.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PreloaderComponent, CursorComponent, NavbarComponent, RouterOutlet, FooterComponent, BookingDockComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly smoothScroll = inject(SmoothScrollService);
  private readonly router = inject(Router);
  private readonly loader = inject(LoaderService);
  private readonly pageState = inject(PageStateService);
  private readonly analytics = inject(AnalyticsService);
  private readonly behavior = inject(BehaviorTrackerService);
  private navigation?: Subscription;

  ngOnInit(): void {
    this.smoothScroll.init();
    this.analytics.init();
    this.behavior.start();

    AOS.init({
      duration: 1000,
      easing: 'ease-out-cubic',
      offset: 80,
      once: true,
      // Respect users who prefer reduced motion.
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });

    let first = true;
    this.navigation = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const [path, fragment] = e.urlAfterRedirects.split('#');
        this.pageState.path.set(path!.split('?')[0] || '/');

        const isFirst = first;
        first = false;
        // Wait for the new page to render, then re-measure everything and scroll.
        setTimeout(() => {
          ScrollTrigger.refresh();
          AOS.refreshHard();
          if (fragment) {
            const go = (): void => this.smoothScroll.scrollTo(`#${fragment}`, isFirst);
            if (isFirst) void this.loader.ready.then(() => setTimeout(go, 50));
            else go();
          } else if (!isFirst) {
            this.smoothScroll.scrollTo(0, true);
          }
        }, 80);
      });
  }

  ngAfterViewInit(): void {
    // Child views are rendered now; make sure AOS has measured every [data-aos] node.
    AOS.refreshHard();
  }

  ngOnDestroy(): void {
    this.navigation?.unsubscribe();
  }
}
