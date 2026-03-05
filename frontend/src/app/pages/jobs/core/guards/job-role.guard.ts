import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class JobRoleGuard implements CanActivate {

    constructor(private router: Router) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        // In a real application, inject the AuthenticationService and parse JWT claims
        // For now, we will inspect localStorage to grab the token (if available) 
        // or simulate based on the user object.

        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) {
            // User not logged in
            this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
            return false;
        }

        try {
            const user = JSON.parse(currentUserStr);
            // Optional: Check token validity

            // Check required role from route data
            if (route.data && route.data['role']) {
                const expectedRole = route.data['role'];
                if (user.role !== expectedRole) {
                    // Role mismatch
                    this.router.navigate(['/']); // or unauthorized page
                    return false;
                }
            }

            return true;
        } catch (e) {
            this.router.navigate(['/auth/login']);
            return false;
        }
    }
}
