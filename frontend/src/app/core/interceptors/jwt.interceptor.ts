import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const userId = authService.getUserId(); // 👈 Assure-toi que cette méthode existe dans ton AuthService

  let headers = req.headers;

  // 1. On ajoute le Token JWT
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // 2. On ajoute le X-User-Id (Le sauveur pour ton erreur 500)
  if (userId) {
    headers = headers.set('X-User-Id', userId.toString());
  }

  // On clone la requête avec les nouveaux headers
  const authReq = req.clone({ headers });

  return next(authReq);
};