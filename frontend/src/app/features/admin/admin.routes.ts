import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TrainerRequestsComponent } from './pages/trainer-requests/trainer-requests.component';
import { usersRoutes } from '../users/users.routes';
import { ProductListComponent } from '../../product-list/product-list.component';
import { OrdersListComponent } from '../../product-list/orders-list.component';
import { ProductsListComponentAdmin } from '../../product-list/products-listadmin.component';
import { Forumadmin } from '../../forumadmin/forumadmin';
import { AdminEventsComponent } from './pages/admin-events/admin-events.component';
import { formationRoutes } from '../formation/formation.routes';
import { roomsRoutes } from '../rooms/rooms.routes';

export const adminRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'trainer-requests', component: TrainerRequestsComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'productss', component: ProductsListComponentAdmin },
  { path: 'orders', component: OrdersListComponent },
  { path: 'posts', component: Forumadmin },
  { path: 'events', component: AdminEventsComponent },
  { path: 'events/:id/registrations', loadComponent: () => import('../events/pages/event-registrations/event-registrations.component').then(c => c.EventRegistrationsComponent) },
  { path: 'audit-logs', loadComponent: () => import('./pages/audit-logs/audit-logs.component').then(c => c.AuditLogsComponent) },
  ...usersRoutes,
  { path: 'trainings', children: formationRoutes },
  ...roomsRoutes,
];
