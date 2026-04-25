import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../models/user.model';
import { API_BASE_URL } from '../../../core/api/api.config';

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="user-sidebar-content" [class.collapsed]="isCollapsed">
      <!-- Top Section -->
      <div class="sidebar-top">
        <a routerLink="/" class="sidebar-logo-section" title="CertifyPro">
          <div class="sidebar-logo-icon">
            <div class="sidebar-logo-glow"></div>
            <i class="bi bi-mortarboard-fill sidebar-logo-icon-inner"></i>
          </div>
          <div class="sidebar-logo-text" *ngIf="!isCollapsed">
            <span class="sidebar-brand-name">CERTIFY<span>PRO</span></span>
            <p class="sidebar-brand-tagline">GLOBAL STANDARD</p>
          </div>
        </a>
        <button class="sidebar-toggle-btn" (click)="toggleSidebar()" [title]="isCollapsed ? 'Expand' : 'Collapse'">
          <i [class]="isCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
        </button>
      </div>

      <!-- Search Bar -->
      <div class="sidebar-search" *ngIf="!isCollapsed">
        <div class="search-input-wrapper">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="Search modules...">
        </div>
      </div>

      <nav class="sidebar-nav">
        <!-- Main Navigation -->
        <div class="nav-section">
          <span class="section-label" *ngIf="!isCollapsed">NAVIGATION</span>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" [title]="isCollapsed ? 'Home' : ''">
            <i class="bi bi-house-door"></i>
            <span>Home</span>
          </a>
          <a routerLink="/about" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'About Us' : ''">
            <i class="bi bi-info-circle"></i>
            <span>About Us</span>
          </a>
        </div>

        <!-- My Learning Section -->
        <div class="nav-section">
          <span class="section-label" *ngIf="!isCollapsed">MY LEARNING</span>
          <div class="nav-link disabled" [title]="isCollapsed ? 'My Courses' : ''">
            <i class="bi bi-book"></i>
            <span>My Courses</span>
          </div>
          <div class="nav-link disabled" [title]="isCollapsed ? 'Certifications' : ''">
            <i class="bi bi-award"></i>
            <span>Certifications</span>
          </div>
          <div class="nav-link disabled" [title]="isCollapsed ? 'Progress' : ''">
            <i class="bi bi-graph-up"></i>
            <span>Progress</span>
          </div>
          <a routerLink="/events" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'Ã‰vÃ©nements' : ''">
            <i class="bi bi-calendar-event"></i>
            <span>Event</span>
          </a>
         <a routerLink="/chat" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'Messagerie' : ''">
  <i class="bi bi-chat-dots"></i>
  <span>Messagerie</span>
</a>
          <div class="nav-link disabled" [title]="isCollapsed ? 'E-commerce' : ''">
            <i class="bi bi-cart"></i>
            <span>E-commerce</span>
          </div>
        </div>

        <!-- Jobs Section -->
        <div class="nav-section">
          <span class="section-label" *ngIf="!isCollapsed">JOBS</span>
          <a routerLink="/jobs" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" [title]="isCollapsed ? 'Job Search' : ''">
            <i class="bi bi-search"></i>
            <span>Job Search</span>
          </a>

          <!-- CANDIDATE links -->
          <a routerLink="/jobs/candidate/applications" routerLinkActive="active" class="nav-link" *ngIf="isCandidate" [title]="isCollapsed ? 'My Applications' : ''">
            <i class="bi bi-file-earmark-check"></i>
            <span>My Applications</span>
          </a>
          <a routerLink="/jobs/candidate/saved" routerLinkActive="active" class="nav-link" *ngIf="isCandidate" [title]="isCollapsed ? 'Saved Jobs' : ''">
            <i class="bi bi-bookmark-heart"></i>
            <span>Saved Jobs</span>
          </a>
          <a routerLink="/jobs/candidate/recommendations" routerLinkActive="active" class="nav-link" *ngIf="isCandidate" [title]="isCollapsed ? 'Recommendations' : ''">
            <i class="bi bi-stars"></i>
            <span>Recommendations</span>
          </a>
          <a routerLink="/jobs/candidate/profile" routerLinkActive="active" class="nav-link" *ngIf="isCandidate" [title]="isCollapsed ? 'Candidate Profile' : ''">
            <i class="bi bi-person-badge"></i>
            <span>Candidate Profile</span>
          </a>

          <!-- EMPLOYER links -->
          <a routerLink="/jobs/employer/my-company" routerLinkActive="active" class="nav-link" *ngIf="isEmployer" [title]="isCollapsed ? 'My Company' : ''">
            <i class="bi bi-building"></i>
            <span>My Company</span>
          </a>
          <a routerLink="/jobs/employer/jobs" routerLinkActive="active" class="nav-link" *ngIf="isEmployer" [title]="isCollapsed ? 'My Job Offers' : ''">
            <i class="bi bi-briefcase"></i>
            <span>My Job Offers</span>
          </a>
          <a routerLink="/jobs/employer/jobs/new" routerLinkActive="active" class="nav-link" *ngIf="isEmployer" [title]="isCollapsed ? 'Create Job Offer' : ''">
            <i class="bi bi-plus-circle"></i>
            <span>Create Job Offer</span>
          </a>
          <a routerLink="/jobs/employer/applications" routerLinkActive="active" class="nav-link" *ngIf="isEmployer" [title]="isCollapsed ? 'Offer Applications' : ''">
            <i class="bi bi-people-fill"></i>
            <span>Offer Applications</span>
          </a>

          <!-- ADMIN links -->
          <a routerLink="/jobs/admin/stats" routerLinkActive="active" class="nav-link" *ngIf="isAdmin" [title]="isCollapsed ? 'Jobs Stats' : ''">
            <i class="bi bi-bar-chart"></i>
            <span>Jobs Stats</span>
          </a>
        </div>
        
        <!-- Trainer Section (only for trainers) -->
        <div class="nav-section" *ngIf="isTrainer">
          <span class="section-label" *ngIf="!isCollapsed">TRAINER</span>
          <div class="nav-link disabled" [title]="isCollapsed ? 'My Trainings' : ''">
            <i class="bi bi-easel"></i>
            <span>My Trainings</span>
          </div>
          <div class="nav-link disabled" [title]="isCollapsed ? 'My Students' : ''">
            <i class="bi bi-people"></i>
            <span>My Students</span>
          </div>
        </div>

        </nav>

      <!-- Single user panel (click = profile, Settings + Logout on the right) -->
      <div class="user-profile-section">
        <div class="profile-card" [class.collapsed-card]="isCollapsed">
          <a routerLink="/profile" routerLinkActive="active" class="profile-card-link" title="My Profile">
            <div class="user-avatar-wrapper">
              <div class="user-avatar">
                <img *ngIf="avatarUrl()" [src]="avatarUrl()" alt="" (error)="avatarImgError = true">
                <span *ngIf="(!avatarUrl() || avatarImgError) && initials()" class="avatar-initials">{{ initials() }}</span>
                <i *ngIf="(!avatarUrl() || avatarImgError) && !initials()" class="bi bi-person-fill"></i>
              </div>
              <div class="status-indicator online"></div>
            </div>
            <div class="user-info" *ngIf="!isCollapsed">
              <p class="user-name">{{currentUser?.firstName}} {{currentUser?.lastName}}</p>
              <p class="user-role">{{currentUser?.role?.name}}</p>
            </div>
          </a>
          <div class="profile-card-actions" *ngIf="!isCollapsed">
            <a routerLink="/profile" routerLinkActive="active" class="action-btn" title="Settings">
              <i class="bi bi-gear"></i>
            </a>
            <button type="button" class="action-btn logout-btn" (click)="logout()" title="Logout">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
          <div class="profile-card-actions collapsed-actions" *ngIf="isCollapsed">
            <a routerLink="/profile" class="action-btn" title="Settings"><i class="bi bi-gear"></i></a>
            <button type="button" class="action-btn logout-btn" (click)="logout()" title="Logout"><i class="bi bi-box-arrow-right"></i></button>
          </div>
          <div class="nav-item">
 
</div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
  .nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  color: #6c7a9c;
  text-decoration: none;
  transition: all 0.3s;
}

.nav-link.active {
  color: #4f8ef7;
  background: rgba(79, 142, 247, 0.1);
  border-radius: 8px;
}

.badge-new {
  background: linear-gradient(135deg, #4f8ef7, #00d4b4);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
  font-weight: bold;
  text-transform: uppercase;
}
    :host {
      --sidebar-bg: #0f172a;
      --sidebar-border: rgba(255,255,255,0.05);
      --primary: #f59e0b;
      --primary-light: rgba(245,158,11,0.15);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #f59e0b;
      --transition-speed: 0.35s;
      --transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
    }

    .user-sidebar-content {
      width: 280px;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
      padding: 0;
      z-index: 1000;
      transition: width var(--transition-speed) var(--transition-ease);
      box-shadow: 4px 0 24px rgba(0,0,0,0.3);
    }

    .user-sidebar-content.collapsed {
      width: 80px;
    }

    /* Top Section */
    .sidebar-top {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 80px;
    }

    .collapsed .sidebar-top {
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 0.5rem;
      min-height: auto;
    }

    .collapsed .sidebar-logo-section {
      flex: none;
    }

    .sidebar-logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      animation: fadeIn 0.5s ease-out;
    }

    .sidebar-logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #4a3427, #8b6e4e);
      border-radius: 10px;
      border: 1px solid rgba(245,158,11,0.3);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(74,52,39,0.2);
    }

    .sidebar-logo-glow {
      position: absolute;
      inset: -1px;
      background: linear-gradient(135deg, #f59e0b, transparent);
      border-radius: 11px;
      opacity: 0.6;
    }

    .sidebar-logo-icon-inner {
      color: white;
      font-size: 1.4rem;
      z-index: 1;
    }

    .sidebar-logo-text {
      display: flex;
      flex-direction: column;
    }

    .sidebar-brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.02em;
      line-height: 1;
    }

    .sidebar-brand-name span {
      color: #f59e0b;
    }

    .sidebar-brand-tagline {
      font-size: 0.6rem;
      letter-spacing: 0.25em;
      font-weight: 800;
      color: #475569;
      margin: 3px 0 0 0;
      text-transform: uppercase;
    }

    .sidebar-toggle-btn {
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }

    .sidebar-toggle-btn:hover {
      background: rgba(255,255,255,0.1);
      color: #f59e0b;
      border-color: rgba(245,158,11,0.3);
    }

    /* Search Bar */
    .sidebar-search {
      padding: 0 1.5rem 1.5rem;
    }

    .search-input-wrapper {
      position: relative;
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      transition: all 0.2s;
    }

    .search-input-wrapper:focus-within {
      background: rgba(255,255,255,0.08);
      border-color: rgba(245,158,11,0.4);
      box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
    }

    .search-input-wrapper i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .search-input-wrapper input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.5rem;
      background: transparent;
      border: none;
      font-size: 0.85rem;
      color: var(--text-main);
      outline: none;
    }

    .search-input-wrapper input::placeholder {
      color: #475569;
    }

    /* Nav Section */
    .sidebar-nav {
      flex: 1;
      padding: 0 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .sidebar-nav::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-nav::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .section-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.15em;
      padding: 0 0.75rem;
      margin-bottom: 0.5rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      text-decoration: none;
      color: var(--text-muted);
      border-radius: 12px;
      transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
      font-weight: 500;
      font-size: 0.9rem;
      position: relative;
    }

    .nav-link i {
      width: 24px;
      font-size: 1.2rem;
      text-align: center;
      transition: transform 0.2s;
    }

    .nav-link:hover:not(.disabled) {
      background: rgba(255,255,255,0.05);
      color: white;
      transform: translateX(4px);
    }

    .nav-link:hover i {
      transform: scale(1.1);
    }

    .nav-link.active {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #27324B;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(39, 50, 75, 0.08);
    }

    .nav-link.disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .collapsed .nav-link {
      justify-content: center;
      padding: 0.75rem;
    }

    .collapsed .nav-link span {
      display: none;
    }

    /* Single user panel */
    .user-profile-section {
      padding: 1rem 0.75rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    .profile-card {
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      padding: 0.65rem 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s;
      border: 1px solid rgba(255,255,255,0.05);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      min-height: 52px;
    }

    .profile-card:hover {
      background: rgba(255,255,255,0.06);
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }

    .profile-card:has(.profile-card-link.active) {
      background: rgba(255,255,255,0.06);
      border-color: rgba(39, 50, 75, 0.08);
    }

    .profile-card-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
      text-decoration: none;
      color: inherit;
      border-radius: 10px;
      padding: 2px 0;
    }

    .profile-card-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }

    .profile-card-actions.collapsed-actions {
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: rgba(255,255,255,0.05);
      color: #94a3b8;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      
      text-decoration: none;
      font-size: 1.1rem;
    }

    .action-btn:hover {
      background: rgba(255,255,255,0.1);
      color: #f59e0b;
    }

    .action-btn.logout-btn {
      color: #ef4444;
    }

    .action-btn.logout-btn:hover {
      background: rgba(239,68,68,0.15);
      color: #ef4444;
    }

    .collapsed-card {
      padding: 0.75rem 0;
      background: transparent;
      flex-direction: column;
      gap: 0.75rem;
      border: none;
      box-shadow: none;
      min-height: auto;
    }

    .collapsed-card .profile-card-link {
      flex: none;
    }

    .user-avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #334155, #1e293b);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f59e0b;
      font-size: 1.15rem;
      overflow: hidden;
    }
    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .user-avatar .avatar-initials {
      font-size: 0.85rem;
      font-weight: 700;
    }

    .status-indicator {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid #0f172a;
      background: #22c55e;
    }

    .status-indicator.online {
      background: #22c55e;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }

    .user-role {
      font-size: 0.7rem;
      color: #f59e0b;
      margin: 0.25rem 0 0;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .user-sidebar-content {
        position: fixed;
        left: -100%;
        transition: left 0.3s ease;
      }
      .user-sidebar-content.active {
        left: 0;
      }
    }
  `]

})
export class UserSidebarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isCollapsed = false;
  avatarImgError = false;
  @Output() sidebarToggled = new EventEmitter<boolean>();
  private sub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.sub = this.authService.currentUser$.subscribe((u) => {
      this.currentUser = u;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  avatarUrl(): string | null {
    const url = this.currentUser?.profileImageUrl;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return API_BASE_URL + url;
  }

  initials(): string {
    const u = this.currentUser;
    if (!u?.firstName && !u?.lastName) return '';
    const f = (u.firstName || '').trim().charAt(0).toUpperCase();
    const l = (u.lastName || '').trim().charAt(0).toUpperCase();
    return (f + l) || '';
  }

  get isTrainer(): boolean {
    return this.currentUser?.role?.name === 'TRAINER';
  }

  get isEmployer(): boolean {
    return this.currentUser?.role?.name === 'EMPLOYER';
  }

  get isCandidate(): boolean {
    return this.currentUser?.role?.name === 'LEARNER';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role?.name === 'ADMIN';
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggled.emit(this.isCollapsed);
  }

  logout() {
    this.authService.clearSession();
    this.router.navigate(['/login']);
  }
}

