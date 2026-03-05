import { Routes } from '@angular/router';
import { JobSearchComponent } from '../../pages/jobs/pages/job-search/job-search.component';
import { EmployerOffersComponent } from '../../pages/jobs/pages/employer/employer-offers/employer-offers.component';
import { OfferFormComponent } from '../../pages/jobs/pages/employer/offer-form/offer-form.component';
import { OfferApplicationsComponent } from '../../pages/jobs/pages/employer/offer-applications/offer-applications.component';
import { MyApplicationsComponent } from '../../pages/jobs/pages/candidate/my-applications/my-applications.component';
import { AdminStatsComponent } from '../../pages/jobs/pages/admin/admin-stats/admin-stats.component';
import { JobRoleGuard } from '../../pages/jobs/core/guards/job-role.guard';

// Exported feature routes for Jobs Module
export const jobsRoutes: Routes = [
    // Public
    { path: '', component: JobSearchComponent },

    // Employer
    {
        path: 'employer/jobs',
        component: EmployerOffersComponent,
        // canActivate: [JobRoleGuard], data: { role: 'EMPLOYER' }  // Commented out to ease manual testing or use actual auth
    },
    {
        path: 'employer/jobs/new',
        component: OfferFormComponent,
        // canActivate: [JobRoleGuard], data: { role: 'EMPLOYER' }
    },
    {
        path: 'employer/jobs/edit/:id',
        component: OfferFormComponent,
        // canActivate: [JobRoleGuard], data: { role: 'EMPLOYER' }
    },
    {
        path: 'employer/jobs/:id/applications',
        component: OfferApplicationsComponent,
        // canActivate: [JobRoleGuard], data: { role: 'EMPLOYER' }
    },

    // Candidate
    {
        path: 'candidate/applications',
        component: MyApplicationsComponent,
        // canActivate: [JobRoleGuard], data: { role: 'LEARNER' }
    },

    // Admin
    {
        path: 'admin/stats',
        component: AdminStatsComponent,
        // canActivate: [JobRoleGuard], data: { role: 'ADMIN' }
    }
];
