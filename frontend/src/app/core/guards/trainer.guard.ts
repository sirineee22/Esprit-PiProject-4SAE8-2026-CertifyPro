import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const trainerGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.getCurrentUser();
    if (user?.role?.name === 'TRAINER') {
        return true;
    }
    router.navigate(['/']);
    return false;
};
