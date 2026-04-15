import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TrainerRequestsComponent } from './pages/trainer-requests/trainer-requests.component';
import { AdminEventsComponent } from './pages/admin-events/admin-events.component';
import { usersRoutes } from '../users/users.routes';

export const adminRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'trainer-requests', component: TrainerRequestsComponent },
  { path: 'events', component: AdminEventsComponent },
  { path: 'events/:id/registrations', loadComponent: () => import('../events/pages/event-registrations/event-registrations.component').then(c => c.EventRegistrationsComponent) },
  { path: 'audit-logs', loadComponent: () => import('./pages/audit-logs/audit-logs.component').then(c => c.AuditLogsComponent) },
  ...usersRoutes,
];
