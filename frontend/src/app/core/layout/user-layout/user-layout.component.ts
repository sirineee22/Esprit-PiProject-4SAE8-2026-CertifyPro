import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { UserSidebarComponent } from '../../../shared/components/user-sidebar/user-sidebar.component';
import { AuthService } from '../../auth/auth.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-user-layout',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, FooterComponent, UserSidebarComponent, CommonModule],
    templateUrl: './user-layout.component.html',
    styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent implements OnInit {
    isLoggedIn = false;
    isHomePage = true;
    isSidebarCollapsed = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            this.isLoggedIn = !!user;
            this.cdr.detectChanges();
        });

        // Check if we're on home page
        this.checkIfHomePage(this.router.url);
        
        // Listen to route changes
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.checkIfHomePage(event.url);
        });
    }

    checkIfHomePage(url: string) {
        // Remove query params and trailing slash
        const cleanUrl = url.split('?')[0].replace(/\/$/, '');
        this.isHomePage = cleanUrl === '' || cleanUrl === '/';
    }

    get showSidebar(): boolean {
        return this.isLoggedIn && !this.isHomePage;
    }

    onSidebarToggled(isCollapsed: boolean) {
        this.isSidebarCollapsed = isCollapsed;
    }
}
