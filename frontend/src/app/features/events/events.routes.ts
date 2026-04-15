import { Routes } from '@angular/router';
import { EventsPageComponent } from './pages/events-page/events-page.component';
import { EventDetailComponent } from './pages/event-detail/event-detail.component';

import { authGuard } from '../../core/guards/auth.guard';
import { trainerGuard } from '../../core/guards/trainer.guard';
import { EventCreateComponent } from './pages/event-create/event-create';

export const eventsRoutes: Routes = [
  { path: '', component: EventsPageComponent },
  { path: 'create', component: EventCreateComponent, canActivate: [authGuard, trainerGuard] },
  { path: 'explorer', redirectTo: '', pathMatch: 'full' },
  { path: 'agenda', redirectTo: '', pathMatch: 'full' },
  { path: 'my-events', redirectTo: '', pathMatch: 'full' },
  {
    path: ':id',
    component: EventDetailComponent
  },
];
