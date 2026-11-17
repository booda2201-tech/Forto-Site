import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

/**
 * True in the visitor's browser, false while the pages are prerendered at build time.
 * Call it in an injection context (a field initializer or constructor).
 * Everything that touches window, the DOM's layout, GSAP or observers sits behind it.
 */
export function injectIsBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}
