/**
 * Where visitor-behaviour events go. Both are optional and independent; with both empty
 * nothing leaves the browser (events are only logged when `debug` is on).
 */
export const ANALYTICS = {
  /** Google Analytics 4 measurement ID ("G-XXXXXXXXXX"). Empty = GA4 is not loaded. */
  ga4Id: 'G-QDCKLCFM4D',

  /**
   * Your own collector. Events are POSTed in batches as JSON ({ events: [...] }) with
   * `navigator.sendBeacon`, so it needs no CORS preflight. Empty = off.
   */
  endpoint: '',

  /** Log every event to the console. Also on when localStorage has `forto_debug=1`. */
  debug: false,

  /** A visit that ends before this many seconds, with no click or scroll, is a "quick exit". */
  quickExitSeconds: 10,
} as const;
