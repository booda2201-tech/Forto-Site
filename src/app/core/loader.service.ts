import { Injectable, signal } from '@angular/core';

/** Lets the hero (and other intros) wait until the preloader curtain has opened. */
@Injectable({ providedIn: 'root' })
export class LoaderService {
  private resolveReady!: () => void;

  readonly ready = new Promise<void>((resolve) => (this.resolveReady = resolve));
  readonly done = signal(false);

  complete(): void {
    if (this.done()) return;
    this.done.set(true);
    this.resolveReady();
  }
}
