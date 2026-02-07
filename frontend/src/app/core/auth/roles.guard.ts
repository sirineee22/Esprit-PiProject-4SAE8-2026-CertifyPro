import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const rolesGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  const roleName = user?.role?.name;

  if (roleName && allowedRoles.includes(roleName)) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
