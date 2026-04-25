import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const nonAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If not logged in at all, let authGuard handle the redirect
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const currentUser = authService.getCurrentUser();

  // currentUser may be null briefly during hydration — allow access
  // rather than redirect-looping. The user is authenticated (isLoggedIn = true).
  if (!currentUser) {
    return true;
  }

  // If user is admin, redirect to admin dashboard
  if (currentUser?.role?.name === 'ADMIN') {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  return true;
};
