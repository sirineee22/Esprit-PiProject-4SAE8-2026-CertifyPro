import { Routes } from '@angular/router';
import { BookSessionComponent } from './pages/book-session/book-session.component';
import { authGuard } from '../../core/guards/auth.guard';
import { rolesGuard } from '../../core/auth/roles.guard';

export const sessionsRoutes: Routes = [
    {
        path: 'book-session',
        component: BookSessionComponent,
        canActivate: [authGuard, rolesGuard(['TRAINER'])]
    },
    {
        path: 'my-sessions',
        loadComponent: () => import('./pages/my-sessions/my-sessions.component').then(m => m.MySessionsComponent),
        canActivate: [authGuard, rolesGuard(['TRAINER'])]
    }
];
