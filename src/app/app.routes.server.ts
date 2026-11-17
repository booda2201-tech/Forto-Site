import { RenderMode, ServerRoute } from '@angular/ssr';

import { DEPARTMENTS } from './core/departments';

/**
 * Static site generation: every real page is rendered to its own HTML file at build time
 * ("/", "/car-care", "/service", "/protection"), each with its own title and head tags.
 * Anything else is not a page: it falls back to the client-rendered shell (index.csr.html).
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  ...DEPARTMENTS.map((d): ServerRoute => ({ path: d.slug, renderMode: RenderMode.Prerender })),
  { path: '**', renderMode: RenderMode.Client },
];
