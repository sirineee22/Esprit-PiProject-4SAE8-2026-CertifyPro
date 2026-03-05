import { Routes } from '@angular/router';
import { UserLayoutComponent } from './core/layout/user-layout/user-layout.component';
import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';
import { HomeComponent } from './features/home/pages/home/home.component';
import { ProfileComponent } from './features/profile/pages/profile.component';
import { CoursesListComponent } from './features/courses/pages/courses-list.component';
import { CertificationsListComponent } from './features/certifications/pages/certifications-list.component';
import { MyCoursesComponent } from './features/my-courses/pages/my-courses.component';
import { AboutComponent } from './features/about/pages/about.component';
import { authRoutes } from './features/auth/auth.routes';
import { adminRoutes } from './features/admin/admin.routes';
import { authGuard } from './core/guards/auth.guard';
import { nonAdminGuard } from './core/guards/non-admin.guard';
import { adminGuard } from './core/guards/admin.guard';

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
            { path: 'my-courses', component: MyCoursesComponent, canActivate: [authGuard, nonAdminGuard] },
            { path: 'my-certifications', component: CertificationsListComponent, canActivate: [authGuard, nonAdminGuard] },
            { path: 'my-progress', redirectTo: '', pathMatch: 'full' },
            { path: 'trainings', component: CoursesListComponent },
            { path: 'help', redirectTo: '', pathMatch: 'full' },
            { path: 'about', component: AboutComponent },
            { path: 'events', loadChildren: () => import('./features/events/events.routes').then(m => m.eventsRoutes) },
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
