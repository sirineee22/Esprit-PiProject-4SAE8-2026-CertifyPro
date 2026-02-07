import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const nonAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  // If user is admin, redirect to admin dashboard
  if (currentUser?.role?.name === 'ADMIN') {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  // Allow access for non-admin users
  return true;
};
