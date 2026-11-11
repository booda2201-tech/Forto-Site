import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { gsap } from 'gsap';

import { CtaComponent } from '../../components/cta/cta.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { ReelsComponent } from '../../components/reels/reels.component';
import { DEPARTMENTS, Department, STATION_PHOTO, departmentBySlug } from '../../core/departments';
import { LoaderService } from '../../core/loader.service';
import { SITE } from '../../core/site.config';

/**
 * One page per department (Car Care, Service, Protection): what it does, its own space in the
 * station, its finished work and videos, then the map and phone like every other page.
 */
@Component({
  selector: 'app-department-page',
  standalone: true,
  imports: [RouterLink, GalleryComponent, ReelsComponent, CtaComponent],
  templateUrl: './department.page.html',
  styleUrl: './department.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class DepartmentPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly meta = inject(Meta);
  private readonly loader = inject(LoaderService);
  private mm?: gsap.MatchMedia;

  protected readonly dept: Department = departmentBySlug(
    inject(ActivatedRoute).snapshot.data['slug'],
  ) as Department;

  /** The other two departments, offered at the bottom of the page. */
  protected readonly others = DEPARTMENTS.filter((d) => d.slug !== this.dept.slug);

  /** The department's own space, plus the station all three shops share. */
  protected readonly place = [...this.dept.place, STATION_PHOTO];

  protected readonly phone = SITE.phoneDisplay;
  protected readonly phoneHref = SITE.phoneHref;
  protected readonly mapsUrl = SITE.mapsUrl;
  protected readonly address = SITE.address;
  protected readonly email = SITE.email;
  protected readonly instagram = SITE.social.instagram;

  protected readonly steps = [
    { title: 'كلمنا', text: 'ابعتلنا على واتساب أو اتصل بينا.' },
    { title: 'حدد موعدك', text: 'نحجزلك موعد في القسم المناسب.' },
    { title: 'تعالى المحطة', text: 'محطة فيول أب على الطريق الدائري، الهرم.' },
  ] as const;

  ngOnInit(): void {
    this.meta.updateTag({ name: 'description', content: this.dept.seoDescription });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.mm = gsap.matchMedia(this.host.nativeElement);
      this.mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set('.dh-in', { autoAlpha: 0, y: 28 });
        void this.loader.ready.then(() => {
          gsap.to('.dh-in', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out' });
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.mm?.revert();
  }
}
