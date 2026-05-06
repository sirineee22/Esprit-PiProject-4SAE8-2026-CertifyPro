import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * On 401, clear session only when the request was to an auth endpoint
 * (login / verify-2fa / register). A 401 from any other service (e.g. the
 * event-service returning 401 because the user lacks a required role) must
 * NOT log the user out — the token is still valid.
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const isAuthEndpoint = req.url.includes('/api/auth/');
        if (isAuthEndpoint) {
          auth.clearSession();
        }
      }
      return throwError(() => err);
    })
  );
};
