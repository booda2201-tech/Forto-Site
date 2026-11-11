import { Injectable, signal } from '@angular/core';

/** The page being shown ("/", "/car-care"…), without the #section. Navbar and footer read it. */
@Injectable({ providedIn: 'root' })
export class PageStateService {
  readonly path = signal('/');
}
