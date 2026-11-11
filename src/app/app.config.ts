import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { TrackedErrorHandler } from './core/tracked-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: TrackedErrorHandler },
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Scrolling (to the top of a page, or to a section) is done by AppComponent so it can go
    // through Lenis; "reload" lets a second click on the same section link scroll again.
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
  ],
};
