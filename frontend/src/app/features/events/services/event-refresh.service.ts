import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventRefreshService {
  private readonly refresh$ = new Subject<void>();

  readonly refreshed = this.refresh$.asObservable();

  triggerRefresh(): void {
    this.refresh$.next();
  }
}
