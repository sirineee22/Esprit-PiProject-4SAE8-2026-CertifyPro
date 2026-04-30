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
import { AdminStatsComponent } from '../jobs/pages/admin/admin-stats/admin-stats.component';
import { OfferApplicationsComponent } from '../jobs/pages/employer/offer-applications/offer-applications.component';
import { JobSearchComponent } from '../jobs/pages/job-search/job-search.component';
import { EmployerOffersComponent } from '../jobs/pages/employer/employer-offers/employer-offers.component';
import { MyCompanyComponent } from '../jobs/pages/employer/my-company/my-company.component';
import { OfferFormComponent } from '../jobs/pages/employer/offer-form/offer-form.component';
import { CandidateProfileComponent } from '../jobs/pages/candidate/candidate-profile/candidate-profile.component';
import { MyApplicationsComponent } from '../jobs/pages/candidate/my-applications/my-applications.component';
import { SavedJobsComponent } from '../jobs/pages/candidate/saved-jobs/saved-jobs.component';
import { JobDetailComponent } from '../jobs/pages/job-detail/job-detail.component';

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

  // ── Jobs module under admin layout (sidebar noire) ──────────────────
  { path: 'jobs',                              component: JobSearchComponent },
  { path: 'jobs/detail/:id',                  component: JobDetailComponent },
  { path: 'jobs/admin/stats',                 component: AdminStatsComponent },
  { path: 'jobs/employer/applications',       component: OfferApplicationsComponent },
  { path: 'jobs/employer/jobs',               component: EmployerOffersComponent },
  { path: 'jobs/employer/jobs/new',           component: OfferFormComponent },
  { path: 'jobs/employer/jobs/edit/:id',      component: OfferFormComponent },
  { path: 'jobs/employer/jobs/:id/applications', component: OfferApplicationsComponent },
  { path: 'jobs/employer/my-company',         component: MyCompanyComponent },
  { path: 'jobs/candidate/profile',           component: CandidateProfileComponent },
  { path: 'jobs/candidate/applications',      component: MyApplicationsComponent },
  { path: 'jobs/candidate/saved',             component: SavedJobsComponent },
];
