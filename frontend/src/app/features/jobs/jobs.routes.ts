import { Routes } from '@angular/router';
import { JobSearchComponent } from './pages/job-search/job-search.component';
import { JobDetailComponent } from './pages/job-detail/job-detail.component';
import { EmployerOffersComponent } from './pages/employer/employer-offers/employer-offers.component';
import { OfferFormComponent } from './pages/employer/offer-form/offer-form.component';
import { OfferApplicationsComponent } from './pages/employer/offer-applications/offer-applications.component';
import { MyCompanyComponent } from './pages/employer/my-company/my-company.component';
import { MyApplicationsComponent } from './pages/candidate/my-applications/my-applications.component';
import { JobRecommendationsComponent } from './pages/candidate/my-applications/job-recommendations.component';
import { CandidateProfileComponent } from './pages/candidate/candidate-profile/candidate-profile.component';
import { SavedJobsComponent } from './pages/candidate/saved-jobs/saved-jobs.component';
import { AdminStatsComponent } from './pages/admin/admin-stats/admin-stats.component';
import { authGuard } from '../../core/guards/auth.guard';

export const jobsRoutes: Routes = [
  // ── Public ──────────────────────────────────────────────
  { path: '',           component: JobSearchComponent },
  { path: 'detail/:id', component: JobDetailComponent },

  // ── Candidate ───────────────────────────────────────────
  { path: 'candidate/profile',         component: CandidateProfileComponent,    canActivate: [authGuard] },
  { path: 'candidate/applications',    component: MyApplicationsComponent,       canActivate: [authGuard] },
  { path: 'candidate/saved',           component: SavedJobsComponent,            canActivate: [authGuard] },
  { path: 'candidate/recommendations', component: JobRecommendationsComponent,   canActivate: [authGuard] },

  // ── Employer ────────────────────────────────────────────
  { path: 'employer/my-company',              component: MyCompanyComponent,        canActivate: [authGuard] },
  { path: 'employer/jobs',                    component: EmployerOffersComponent,   canActivate: [authGuard] },
  { path: 'employer/jobs/new',                component: OfferFormComponent,        canActivate: [authGuard] },
  { path: 'employer/jobs/edit/:id',           component: OfferFormComponent,        canActivate: [authGuard] },
  { path: 'employer/jobs/:id/applications',   component: OfferApplicationsComponent, canActivate: [authGuard] },
  { path: 'employer/applications',            component: OfferApplicationsComponent, canActivate: [authGuard] },

  // ── Admin ────────────────────────────────────────────────
  { path: 'admin/stats', component: AdminStatsComponent, canActivate: [authGuard] },
];
