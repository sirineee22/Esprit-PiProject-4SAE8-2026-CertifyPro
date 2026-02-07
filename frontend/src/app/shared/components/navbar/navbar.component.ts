import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
<nav class="certifynavbar fixed-top">
  <div class="container container-wide">
    <div class="navbar-wrapper">
      <!-- Logo and Brand -->
      <a class="navbar-brand-modern" routerLink="/">
        <div class="logo-box-modern">
          <div class="logo-glow"></div>
          <i class="bi bi-mortarboard-fill logo-icon-nav"></i>
        </div>
        <div class="brand-text-group-nav">
          <span class="brand-name-modern">CERTIFY<span>PRO</span></span>
          <p class="brand-tagline-nav">GLOBAL STANDARD</p>
        </div>
      </a>

      <!-- Desktop Navigation -->
      <div class="nav-links-desktop d-none d-md-flex">
        <a class="nav-link-modern" routerLink="/courses" routerLinkActive="active">Courses</a>
        <a class="nav-link-modern" routerLink="/certifications" routerLinkActive="active">Certifications</a>
        <a class="nav-link-modern" routerLink="/events" routerLinkActive="active">Events</a>
        <a class="nav-link-modern" routerLink="/jobs" routerLinkActive="active">Stage & Jobs</a>
        <a class="nav-link-modern" routerLink="/messages" routerLinkActive="active">Messagerie</a>
        <a class="nav-link-modern" routerLink="/community" routerLinkActive="active">Community</a>
      </div>
      
      <!-- Right Side Actions -->
      <div class="navbar-actions-modern d-none d-md-flex">
        <ng-container *ngIf="!isLoggedIn; else userLoggedIn">
          <a routerLink="/login" class="btn-ghost-modern">Sign In</a>
          <a routerLink="/register" class="btn-accent-modern">Get Started</a>
        </ng-container>
        
        <ng-template #userLoggedIn>
          <div class="user-profile-nav-wrapper">
            <div class="user-profile-nav-modern" (click)="toggleDropdown($event)">
               <i class="bi bi-person-circle"></i>
               <span class="user-name-modern">{{ currentUser?.firstName }}</span>
               <i class="bi bi-chevron-down dropdown-arrow" [class.rotate]="isDropdownOpen"></i>
            </div>

            <!-- Profile Dropdown Popup -->
            <div class="profile-dropdown-popup" [class.show]="isDropdownOpen">
                <div class="dropdown-header">
                   <p class="user-full-name">{{currentUser?.firstName}} {{currentUser?.lastName}}</p>
                   <p class="user-email">{{currentUser?.email}}</p>
                   <span class="user-role-badge" [class.admin]="isAdmin" [class.trainer]="isTrainer" [class.learner]="isLearner">
                     {{currentUser?.role?.name}}
                   </span>
                </div>
                <div class="dropdown-divider"></div>
                
                <!-- Admin Links -->
                <ng-container *ngIf="isAdmin">
                  <a routerLink="/admin/dashboard" class="dropdown-item" (click)="isDropdownOpen = false">
                    <i class="bi bi-speedometer2"></i> Admin Dashboard
                  </a>
                  <a routerLink="/admin/trainer-requests" class="dropdown-item" (click)="isDropdownOpen = false">
                    <i class="bi bi-person-check"></i> Trainer Requests
                  </a>
                  <a routerLink="/admin/users" class="dropdown-item" (click)="isDropdownOpen = false">
                    <i class="bi bi-people"></i> Users
                  </a>
                </ng-container>
                
                <!-- Regular User Links -->
                <ng-container *ngIf="!isAdmin">
                  <a routerLink="/profile" class="dropdown-item" (click)="isDropdownOpen = false">
                    <i class="bi bi-person"></i> My Profile
                  </a>
                </ng-container>
                
                <div class="dropdown-divider"></div>
                <button (click)="logout()" class="dropdown-item logout-item"><i class="bi bi-box-arrow-right"></i> Sign Out</button>
            </div>
          </div>
        </ng-template>
      </div>

      <!-- Mobile Menu Toggle -->
      <button class="mobile-toggle-btn d-md-none" (click)="isMenuOpen = !isMenuOpen">
        <i class="bi" [ngClass]="isMenuOpen ? 'bi-x-lg' : 'bi-list'"></i>
      </button>
    </div>

    <!-- Mobile Menu Overlay -->
    <div class="mobile-menu-overlay" [class.show]="isMenuOpen">
      <div class="mobile-nav-links">
        <a class="nav-link-modern" routerLink="/courses" (click)="isMenuOpen = false">Courses</a>
        <a class="nav-link-modern" routerLink="/certifications" (click)="isMenuOpen = false">Certifications</a>
        <a class="nav-link-modern" routerLink="/events" (click)="isMenuOpen = false">Events</a>
        <a class="nav-link-modern" routerLink="/jobs" (click)="isMenuOpen = false">Stage & Jobs</a>
        <a class="nav-link-modern" routerLink="/messages" (click)="isMenuOpen = false">Messagerie</a>
        <a class="nav-link-modern" routerLink="/community" (click)="isMenuOpen = false">Community</a>
        <hr class="mobile-divider">
        <ng-container *ngIf="!isLoggedIn; else mobileUserLoggedIn">
          <a routerLink="/login" class="btn-ghost-modern w-100 mb-2" (click)="isMenuOpen = false">Sign In</a>
          <a routerLink="/register" class="btn-accent-modern w-100" (click)="isMenuOpen = false">Get Started</a>
        </ng-container>
        <ng-template #mobileUserLoggedIn>
           <div class="d-flex flex-column gap-2">
             <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded shadow-sm">
               <div class="d-flex align-items-center gap-2">
                 <i class="bi bi-person-circle text-primary"></i>
                 <span class="fw-bold">{{ currentUser?.firstName }}</span>
               </div>
               <button (click)="logout()" class="btn btn-sm btn-outline-danger">Logout</button>
             </div>
           </div>
        </ng-template>
      </div>
    </div>
  </div>
</nav>
  `,
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnDestroy {
  isLoggedIn = false;
  isMenuOpen = false;
  isDropdownOpen = false;
  currentUser: User | null = null;
  private router = inject(Router);
  private readonly subscriptions = new Subscription();

  constructor(private authService: AuthService) {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
      })
    );
  }

  get isAdmin(): boolean {
    return this.currentUser?.role?.name === 'ADMIN';
  }

  get isTrainer(): boolean {
    return this.currentUser?.role?.name === 'TRAINER';
  }

  get isLearner(): boolean {
    return this.currentUser?.role?.name === 'LEARNER';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.isDropdownOpen = false;
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    this.authService.clearSession();
    this.isDropdownOpen = false;
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
