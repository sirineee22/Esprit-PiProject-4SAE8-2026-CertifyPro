import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
<<<<<<< HEAD
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
=======

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
>>>>>>> origin/Trainings-Evaluation
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

<<<<<<< HEAD
  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        authService.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
=======
  return next(req);
>>>>>>> origin/Trainings-Evaluation
};
