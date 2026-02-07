import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.getCurrentUser();

    if (user && user.role?.name === 'ADMIN') {
        return true;
    }

    // If not admin, redirect to home or access denied
    router.navigate(['/']);
    return false;
};
