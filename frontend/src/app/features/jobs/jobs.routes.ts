import { Routes } from '@angular/router';
import { JobSearchComponent } from '../../pages/jobs/pages/job-search/job-search.component';
import { EmployerOffersComponent } from '../../pages/jobs/pages/employer/employer-offers/employer-offers.component';
import { OfferFormComponent } from '../../pages/jobs/pages/employer/offer-form/offer-form.component';
import { OfferApplicationsComponent } from '../../pages/jobs/pages/employer/offer-applications/offer-applications.component';
import { MyApplicationsComponent } from '../../pages/jobs/pages/candidate/my-applications/my-applications.component';
import { AdminStatsComponent } from '../../pages/jobs/pages/admin/admin-stats/admin-stats.component';

export const jobsRoutes: Routes = [
    // ─── Public ───────────────────────────────────────────
    { path: '', component: JobSearchComponent },

    // ─── Employer ─────────────────────────────────────────
    { path: 'employer/jobs', component: EmployerOffersComponent },
    { path: 'employer/jobs/new', component: OfferFormComponent },
    { path: 'employer/jobs/edit/:id', component: OfferFormComponent },
    { path: 'employer/jobs/:id/applications', component: OfferApplicationsComponent },

    // ─── Employer : toutes les candidatures reçues ─────────
    // (réutilise MyApplications côté employeur ou crée un composant dédié)
    { path: 'employer/applications', component: OfferApplicationsComponent },

    // ─── Candidate ────────────────────────────────────────
    { path: 'candidate/applications', component: MyApplicationsComponent },

    // ─── Admin ────────────────────────────────────────────
    { path: 'admin/stats', component: AdminStatsComponent },
];