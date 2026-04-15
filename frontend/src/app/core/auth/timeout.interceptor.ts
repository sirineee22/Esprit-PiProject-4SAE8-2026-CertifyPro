import { HttpInterceptorFn } from '@angular/common/http';
import { timeout, catchError } from 'rxjs/operators';
import { throwError, TimeoutError } from 'rxjs';

const REQUEST_TIMEOUT_MS = 15000; // 15 seconds max for any HTTP request

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    timeout(REQUEST_TIMEOUT_MS),
    catchError((err) => {
      if (err instanceof TimeoutError) {
        console.error(`[Timeout] Request to ${req.url} timed out after ${REQUEST_TIMEOUT_MS}ms`);
        return throwError(() => ({
          status: 0,
          error: { message: 'Request timed out. Please check your server is running.' },
          message: 'Request timed out'
        }));
      }
      return throwError(() => err);
    })
  );
};
