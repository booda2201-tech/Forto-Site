import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';

import { BehaviorTrackerService } from './behavior-tracker.service';

/** Angular swallows errors thrown inside components; this still logs them and reports them too. */
@Injectable()
export class TrackedErrorHandler extends ErrorHandler {
  // Looked up on demand: the router (which the tracker needs) itself depends on ErrorHandler.
  private readonly injector = inject(Injector);

  override handleError(error: unknown): void {
    try {
      this.injector.get(BehaviorTrackerService).reportError(error);
    } catch {
      /* reporting must never break the page */
    }
    super.handleError(error);
  }
}
