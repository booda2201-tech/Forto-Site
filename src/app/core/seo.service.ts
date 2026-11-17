import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

import { departmentBySlug } from './departments';
import { SITE } from './site.config';

export const HOME_SEO = {
  title: 'فورتو | مركز متكامل لخدمة السيارات - الهرم، الجيزة',
  description:
    'فورتو لخدمة السيارات في الهرم، الجيزة: غسيل وتلميع (كار كير)، ميكانيكا وصيانة (سيرفيس)، وسمكرة ودهان ونانو سيراميك (بروتكشن). احجز موعدك الآن.',
  /** Shorter line shown when the link is shared (Open Graph / Twitter). */
  social:
    'كار كير (الغسيل والتلميع)، سيرفيس (الميكانيكا)، وبروتكشن (النانو سيراميك والسمكرة والدهان) تحت سقف واحد على الدائري.',
} as const;

/**
 * Keeps the page-specific head tags (description, canonical, Open Graph, Twitter) in step with
 * the route. It runs while the pages are prerendered too, so every static HTML file ships with
 * its own tags instead of the home page's.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  /** `path` is the route without #section or ?query ("/", "/car-care"…). */
  apply(path: string): void {
    const dept = departmentBySlug(path.replace(/^\//, ''));
    const title = dept?.seoTitle ?? HOME_SEO.title;
    const description = dept?.seoDescription ?? HOME_SEO.description;
    const social = dept?.seoDescription ?? HOME_SEO.social;
    const url = `${SITE.url}${path === '/' ? '/' : path}`;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: social });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: social });
    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
