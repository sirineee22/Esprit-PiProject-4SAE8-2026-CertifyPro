import { Routes } from '@angular/router';
import { UserLayoutComponent } from './core/layout/user-layout/user-layout.component';
import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';
import { HomeComponent } from './features/home/pages/home/home.component';
import { ProfileComponent } from './features/profile/pages/profile.component';
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
            { path: 'courses', redirectTo: '', pathMatch: 'full' },
            { path: 'certifications', redirectTo: '', pathMatch: 'full' },
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
