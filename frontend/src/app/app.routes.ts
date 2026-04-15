import { Routes } from '@angular/router';
import { UserLayoutComponent } from './core/layout/user-layout/user-layout.component';
import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';
import { HomeComponent } from './features/home/pages/home/home.component';
import { ProfileComponent } from './features/profile/pages/profile.component';
import { CoursesListComponent } from './features/courses/pages/courses-list.component';
import { CertificationsListComponent } from './features/certifications/pages/certifications-list.component';
import { CertificationDetailComponent } from './features/certifications/pages/certification-detail.component';
import { CreateCertificationComponent } from './features/certifications/pages/create-certification.component';
import { ExamQuizComponent } from './features/certifications/pages/exam-quiz.component';
import { ExamModeSelectComponent } from './features/certifications/pages/exam-mode-select.component';
import { MyCoursesComponent } from './features/my-courses/pages/my-courses.component';
import { AboutComponent } from './features/about/pages/about.component';
import { authRoutes } from './features/auth/auth.routes';
import { adminRoutes } from './features/admin/admin.routes';
import { authGuard } from './core/guards/auth.guard';
import { nonAdminGuard } from './core/guards/non-admin.guard';
import { adminGuard } from './core/guards/admin.guard';
import { trainerGuard } from './core/guards/trainer.guard';

export const routes: Routes = [
    // Auth routes (no layout - no navbar/footer)
    ...authRoutes,

    // User routes (with navbar/footer)
    {
        path: '',
        component: UserLayoutComponent,
        children: [
            { path: '', component: HomeComponent },
            { path: 'profile', component: ProfileComponent, canActivate: [authGuard, nonAdminGuard] },
            { path: 'courses', component: CoursesListComponent },
            { path: 'certifications', component: CertificationsListComponent },
            { path: 'certifications/:id', component: CertificationDetailComponent },
            { path: 'certifications/:id/exam', component: ExamModeSelectComponent, canActivate: [authGuard] },
            { path: 'certifications/:id/exam/:mode', component: ExamQuizComponent, canActivate: [authGuard] },
            { path: 'trainer/create-certification', component: CreateCertificationComponent, canActivate: [authGuard, trainerGuard] },
            { path: 'my-courses', component: MyCoursesComponent, canActivate: [authGuard, nonAdminGuard] },
            { path: 'my-certifications', component: CertificationsListComponent, canActivate: [authGuard, nonAdminGuard] },
            { path: 'my-progress', redirectTo: '', pathMatch: 'full' },
            { path: 'trainings', component: CoursesListComponent },
            { path: 'help', redirectTo: '', pathMatch: 'full' },
            { path: 'about', component: AboutComponent },
            { path: 'how-it-works', redirectTo: '', pathMatch: 'full' },
            { path: 'community', redirectTo: '', pathMatch: 'full' },
            { path: 'forum', redirectTo: '', pathMatch: 'full' }
        ]
    },

    // Admin routes (with sidebar)
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard, adminGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            ...adminRoutes
        ]
    }
];
