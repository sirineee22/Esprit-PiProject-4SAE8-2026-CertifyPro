import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/auth/jwt.interceptor';
import { unauthorizedInterceptor } from './core/auth/unauthorized.interceptor';
import { timeoutInterceptor } from './core/auth/timeout.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([timeoutInterceptor, jwtInterceptor, unauthorizedInterceptor])),
    provideAnimations()
  ]
};
