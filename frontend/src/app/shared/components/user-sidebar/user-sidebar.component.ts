import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="user-sidebar-content" [class.collapsed]="isCollapsed">

      <!-- Top -->
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

      <!-- Search -->
      <div class="sidebar-search" *ngIf="!isCollapsed">
        <div class="search-input-wrapper">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="Search modules...">
        </div>
      </div>

      <nav class="sidebar-nav">

        <!-- Navigation -->
        <div class="nav-section">
          <span class="section-label" *ngIf="!isCollapsed">NAVIGATION</span>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" [title]="isCollapsed ? 'Home' : ''">
            <i class="bi bi-house-door"></i><span>Home</span>
          </a>
          <a routerLink="/about" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'About Us' : ''">
            <i class="bi bi-info-circle"></i><span>About Us</span>
          </a>
        </div>

        <!-- My Learning -->
        <div class="nav-section">
          <span class="section-label" *ngIf="!isCollapsed">MY LEARNING</span>
          <div class="nav-link disabled"><i class="bi bi-book"></i><span>My Courses</span></div>
          <div class="nav-link disabled"><i class="bi bi-award"></i><span>Certifications</span></div>
          <div class="nav-link disabled"><i class="bi bi-graph-up"></i><span>Progress</span></div>
          <div class="nav-link disabled"><i class="bi bi-calendar-event"></i><span>Event</span></div>
          <a routerLink="/chat" routerLinkActive="active" class="nav-link">
            <i class="bi bi-chat-dots"></i><span>Messagerie</span>
          </a>
          <div class="nav-link disabled"><i class="bi bi-cart"></i><span>E-commerce</span></div>
        </div>

        <!-- Trainer -->
        <div class="nav-section" *ngIf="isTrainer">
          <span class="section-label" *ngIf="!isCollapsed">TRAINER</span>
          <div class="nav-link disabled"><i class="bi bi-easel"></i><span>My Trainings</span></div>
          <div class="nav-link disabled"><i class="bi bi-people"></i><span>My Students</span></div>
        </div>

        <!-- ─── EMPLOYER : routes sous /jobs/employer/... ─── -->
        <div class="nav-section jobs-section" *ngIf="isEmployer">
          <span class="section-label jobs-label" *ngIf="!isCollapsed">
            <i class="bi bi-briefcase-fill me-1"></i> EMPLOIS
          </span>

          <a routerLink="/jobs/employer/jobs"
             routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"
             class="nav-link nav-link-jobs"
             [title]="isCollapsed ? 'Mes Offres' : ''">
            <i class="bi bi-list-task"></i><span>Mes Offres</span>
          </a>

          <a routerLink="/jobs/employer/jobs/new"
             routerLinkActive="active"
             class="nav-link nav-link-jobs"
             [title]="isCollapsed ? 'Créer une offre' : ''">
            <i class="bi bi-plus-circle-fill"></i><span>Créer une offre</span>
          </a>

          <a routerLink="/jobs/employer/applications"
             routerLinkActive="active"
             class="nav-link nav-link-jobs"
             [title]="isCollapsed ? 'Candidatures reçues' : ''">
            <i class="bi bi-people-fill"></i><span>Candidatures reçues</span>
          </a>

          <a routerLink="/jobs"
             routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"
             class="nav-link nav-link-jobs"
             [title]="isCollapsed ? 'Explorer les offres' : ''">
            <i class="bi bi-search"></i><span>Explorer les offres</span>
          </a>
        </div>

        <!-- ─── CANDIDATE : routes sous /jobs/candidate/... ─── -->
        <div class="nav-section jobs-section" *ngIf="isCandidate">
          <span class="section-label jobs-label" *ngIf="!isCollapsed">
            <i class="bi bi-briefcase-fill me-1"></i> EMPLOIS
          </span>

          <a routerLink="/jobs"
             routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"
             class="nav-link nav-link-jobs"
             [title]="isCollapsed ? 'Chercher un emploi' : ''">
            <i class="bi bi-search"></i><span>Chercher un emploi</span>
          </a>

          <a routerLink="/jobs/candidate/applications"
             routerLinkActive="active"
             class="nav-link nav-link-jobs"
             [title]="isCollapsed ? 'Mes candidatures' : ''">
            <i class="bi bi-file-earmark-person-fill"></i><span>Mes candidatures</span>
          </a>
        </div>

      </nav>

      <!-- User Profile -->
      <div class="user-profile-section">
        <div class="profile-card" [class.collapsed-card]="isCollapsed">
          <a routerLink="/profile" routerLinkActive="active" class="profile-card-link" title="My Profile">
            <div class="user-avatar-wrapper">
              <div class="user-avatar"><i class="bi bi-person-fill"></i></div>
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
            <a routerLink="/profile" class="action-btn"><i class="bi bi-gear"></i></a>
            <button type="button" class="action-btn logout-btn" (click)="logout()"><i class="bi bi-box-arrow-right"></i></button>
          </div>
        </div>
      </div>

    </aside>
  `,
  styles: [`
    :host {
      --sidebar-bg: #ffffff;
      --sidebar-border: #f0f0f0;
      --primary: hsl(222, 47%, 20%);
      --text-main: #1a1c1e;
      --text-muted: #64748b;
      --jobs-accent: #7c3aed;
      --jobs-accent-light: rgba(124, 58, 237, 0.07);
      --jobs-accent-text: #6d28d9;
      --transition-speed: 0.35s;
      --transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
    }

    .user-sidebar-content {
      width: 280px; height: 100vh; position: fixed; left: 0; top: 0;
      background: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border);
      display: flex; flex-direction: column; padding: 0; z-index: 1000;
      transition: width var(--transition-speed) var(--transition-ease);
      box-shadow: 4px 0 24px rgba(0,0,0,0.02);
    }
    .user-sidebar-content.collapsed { width: 80px; }

    .sidebar-top {
      padding: 1.5rem; display: flex; align-items: center;
      justify-content: space-between; min-height: 80px; flex-shrink: 0;
    }
    .collapsed .sidebar-top {
      flex-direction: column; align-items: center;
      gap: 0.75rem; padding: 1rem 0.5rem; min-height: auto;
    }

    .sidebar-logo-section { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .sidebar-logo-icon {
      width: 40px; height: 40px; background: #0b1120; border-radius: 10px;
      border: 1px solid rgba(245,158,11,0.3); position: relative;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .sidebar-logo-glow {
      position: absolute; inset: -1px;
      background: linear-gradient(135deg,#f59e0b,transparent); border-radius: 11px; opacity: 0.6;
    }
    .sidebar-logo-icon-inner { color: white; font-size: 1.4rem; z-index: 1; }
    .sidebar-logo-text { display: flex; flex-direction: column; }
    .sidebar-brand-name { font-size: 1.25rem; font-weight: 800; color: #0b1f3b; letter-spacing: 0.02em; line-height: 1; }
    .sidebar-brand-name span { color: #f59e0b; }
    .sidebar-brand-tagline { font-size: 0.6rem; letter-spacing: 0.25em; font-weight: 800; color: #94a3b8; margin: 3px 0 0 0; text-transform: uppercase; }

    .sidebar-toggle-btn {
      width: 32px; height: 32px; border: 1px solid var(--sidebar-border);
      background: white; border-radius: 8px; display: flex; align-items: center;
      justify-content: center; color: var(--text-muted); cursor: pointer; transition: all 0.2s; flex-shrink: 0;
    }
    .sidebar-toggle-btn:hover { background: #f8fafc; color: var(--primary); }

    .sidebar-search { padding: 0 1.5rem 1.5rem; flex-shrink: 0; }
    .search-input-wrapper { position: relative; background: #f8fafc; border-radius: 10px; border: 1px solid transparent; }
    .search-input-wrapper:focus-within { background: white; border-color: #cbd5e1; box-shadow: 0 0 0 3px rgba(148,163,184,0.1); }
    .search-input-wrapper i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem; }
    .search-input-wrapper input { width: 100%; padding: 0.65rem 1rem 0.65rem 2.5rem; background: transparent; border: none; font-size: 0.85rem; color: var(--text-main); outline: none; }

    .sidebar-nav { flex: 1; padding: 0 0.75rem; display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; overflow-x: hidden; }
    .sidebar-nav::-webkit-scrollbar { width: 4px; }
    .sidebar-nav::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    .nav-section { display: flex; flex-direction: column; gap: 0.25rem; }
    .section-label { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.1em; padding: 0 0.75rem; margin-bottom: 0.5rem; }

    .nav-link {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem; text-decoration: none; color: var(--text-muted);
      border-radius: 10px; transition: all 0.2s; font-weight: 500; font-size: 0.9rem; cursor: pointer;
    }
    .nav-link i { width: 24px; font-size: 1.1rem; text-align: center; transition: transform 0.2s; }
    .nav-link:hover:not(.disabled) { background: #F0F4F8; color: #27324B; }
    .nav-link:hover i { transform: scale(1.1); }
    .nav-link.active { background: #F0F4F8; color: #27324B; font-weight: 700; box-shadow: 0 2px 8px rgba(39,50,75,0.08); }
    .nav-link.disabled { opacity: 0.4; cursor: not-allowed; }
    .collapsed .nav-link { justify-content: center; padding: 0.75rem; }
    .collapsed .nav-link span { display: none; }

    /* Jobs section */
    .jobs-section {
      background: var(--jobs-accent-light); border: 1px solid rgba(124,58,237,0.12);
      border-radius: 12px; padding: 0.75rem 0.5rem;
    }
    .jobs-label { color: var(--jobs-accent-text) !important; font-weight: 800; }
    .nav-link-jobs { color: #5b21b6; }
    .nav-link-jobs:hover:not(.disabled) { background: rgba(124,58,237,0.1); color: var(--jobs-accent); }
    .nav-link-jobs.active {
      background: linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.1));
      color: var(--jobs-accent); border-left: 3px solid var(--jobs-accent);
      padding-left: calc(0.75rem - 3px); font-weight: 700;
    }

    .user-profile-section { padding: 1rem 0.75rem 1.5rem; border-top: 1px solid var(--sidebar-border); flex-shrink: 0; }
    .profile-card { background: #F2F5F9; border-radius: 12px; padding: 0.65rem 0.75rem; display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s; border: 1px solid rgba(0,0,0,0.04); min-height: 52px; }
    .profile-card:hover { background: #EBEFF5; }
    .profile-card-link { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; text-decoration: none; color: inherit; border-radius: 10px; padding: 2px 0; }
    .profile-card-actions { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; }
    .profile-card-actions.collapsed-actions { flex-direction: column; gap: 0.5rem; }
    .action-btn { width: 36px; height: 36px; border: none; background: white; color: #64748b; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.06); text-decoration: none; font-size: 1.1rem; }
    .action-btn:hover { background: #e2e8f0; color: var(--primary); }
    .action-btn.logout-btn { color: #ef4444; }
    .action-btn.logout-btn:hover { background: #fee2e2; color: #dc2626; }
    .collapsed-card { padding: 0.75rem 0; background: transparent; flex-direction: column; gap: 0.75rem; border: none; box-shadow: none; min-height: auto; }
    .collapsed-card .profile-card-link { flex: none; }
    .user-avatar-wrapper { position: relative; flex-shrink: 0; }
    .user-avatar { width: 40px; height: 40px; background: white; border: 1px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #1e3a5f; font-size: 1.15rem; }
    .status-indicator { position: absolute; right: 0; bottom: 0; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #F2F5F9; }
    .status-indicator.online { background: #22c55e; }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 0.9rem; font-weight: 700; color: #27324B; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }
    .user-role { font-size: 0.7rem; color: #64748b; margin: 0.25rem 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }

    @media (max-width: 768px) {
      .user-sidebar-content { position: fixed; left: -100%; transition: left 0.3s ease; }
      .user-sidebar-content.active { left: 0; }
    }
  `]
})
export class UserSidebarComponent implements OnInit {
  currentUser: User | null = null;
  isCollapsed = false;
  @Output() sidebarToggled = new EventEmitter<boolean>();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() { this.currentUser = this.authService.getCurrentUser(); }

  get isTrainer(): boolean { return this.currentUser?.role?.name === 'TRAINER'; }
  get isEmployer(): boolean { return this.currentUser?.role?.name === 'EMPLOYER'; }

  // Tout utilisateur non-admin, non-employer, non-trainer = candidat
  get isCandidate(): boolean {
    const r = this.currentUser?.role?.name;
    return !!r && r !== 'ADMIN' && r !== 'EMPLOYER' && r !== 'TRAINER';
  }

  toggleSidebar() { this.isCollapsed = !this.isCollapsed; this.sidebarToggled.emit(this.isCollapsed); }
  logout() { this.authService.clearSession(); this.router.navigate(['/login']); }
}