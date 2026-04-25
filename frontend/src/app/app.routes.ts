import { Routes } from '@angular/router';

import { UserLayoutComponent } from './core/layout/user-layout/user-layout.component';
import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';

import { HomeComponent } from './features/home/pages/home/home.component';
import { ProfileComponent } from './features/profile/pages/profile.component';
import { CoursesListComponent } from './features/courses/pages/courses-list.component';
import { CertificationsListComponent } from './features/certifications/pages/certifications-list.component';
import { MyCoursesComponent } from './features/my-courses/pages/my-courses.component';
import { AboutComponent } from './features/about/pages/about.component';
import { ChatComponent } from './chat/chat';

import { authRoutes } from './features/auth/auth.routes';
import { adminRoutes } from './features/admin/admin.routes';
import { jobsRoutes } from './features/jobs/jobs.routes';

import { authGuard } from './core/guards/auth.guard';
import { nonAdminGuard } from './core/guards/non-admin.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ================= AUTH =================
  ...authRoutes,

  // ================= USER LAYOUT =================
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      { path: '', component: HomeComponent },

      { path: 'chat', component: ChatComponent, canActivate: [authGuard, nonAdminGuard] },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard, nonAdminGuard] },

      { path: 'courses', component: CoursesListComponent },
      { path: 'certifications', component: CertificationsListComponent },

      { path: 'my-courses', component: MyCoursesComponent, canActivate: [authGuard, nonAdminGuard] },
      { path: 'my-certifications', component: CertificationsListComponent, canActivate: [authGuard, nonAdminGuard] },

      { path: 'about', component: AboutComponent },

      // ================= JOBS MODULE =================
      { path: 'jobs', children: jobsRoutes },
    ]
  },

  // ================= ADMIN LAYOUT =================
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