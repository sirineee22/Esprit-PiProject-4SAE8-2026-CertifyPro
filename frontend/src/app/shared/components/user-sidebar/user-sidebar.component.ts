import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../models/user.model';
import { API_BASE_URL } from '../../../core/api/api.config';
import { AppNotification, UserService } from '../../../features/users/services/users.api';

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
          <a routerLink="/trainings" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'Browse Trainings' : ''">
            <i class="bi bi-grid-view"></i>
            <span>Browse Trainings</span>
          </a>
          <a routerLink="/about" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'About Us' : ''">
            <i class="bi bi-info-circle"></i>
            <span>About Us</span>
          </a>
          <a routerLink="/posts" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'Forum' : ''">
            <i class="bi bi-chat-left-text"></i>
            <span>Posts</span>
          </a>
          <a routerLink="/shop/productss" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'Our products' : ''">
            <i class="bi bi-bag"></i>
            <span>Our products</span>
          </a>
        </div>

        <!-- My Learning Section -->
        <div class="nav-section">
          <span class="section-label" *ngIf="!isCollapsed">MY LEARNING</span>
          <a routerLink="/trainings/my-learning" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'My Courses' : ''">
            <i class="bi bi-book"></i>
            <span>My Courses</span>
          </a>
          <a routerLink="/evaluations/my-evals" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'My Results' : ''">
            <i class="bi bi-graph-up"></i>
            <span>My Results</span>
          </a>
          <a routerLink="/trainings/wishlist" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'My Wishlist' : ''">
            <i class="bi bi-heart"></i>
            <span>My Wishlist</span>
          </a>
          <a routerLink="/events" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'Événements' : ''">
            <i class="bi bi-calendar-event"></i>
            <span>Événements</span>
          </a>
          <div class="nav-link disabled" [title]="isCollapsed ? 'Messagerie' : ''">
            <i class="bi bi-chat-dots"></i>
            <span>Messagerie</span>
          </div>
          <div class="nav-link disabled" [title]="isCollapsed ? 'E-commerce' : ''">
            <i class="bi bi-cart"></i>
            <span>E-commerce</span>
          </div>
        </div>
        
        <!-- Trainer/Admin Section -->
        <div class="nav-section" *ngIf="isTrainer || isAdmin">
          <span class="section-label" *ngIf="!isCollapsed">{{ isAdmin ? 'ADMIN' : 'TRAINER' }}</span>
          <a routerLink="/evaluations/dashboard" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'Dashboard' : ''">
            <i class="bi bi-speedometer2"></i>
            <span>Analytics Dashboard</span>
          </a>
          <a routerLink="/trainings/add" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'Add Training' : ''">
            <i class="bi bi-journal-plus"></i>
            <span>Add New Training</span>
          </a>
          <a routerLink="/evaluations" routerLinkActive="active" class="nav-link" [title]="isCollapsed ? 'Evaluations' : ''">
            <i class="bi bi-clipboard-check"></i>
            <span>Student Evaluations</span>
          </a>
          <div class="nav-link disabled" [title]="isCollapsed ? 'My Students' : ''">
            <i class="bi bi-people"></i>
            <span>My Students</span>
          </div>
        </div>
      </nav>

      <!-- Single user panel -->
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
            <button type="button" class="action-btn bell-btn" (click)="toggleNotifications()" title="Notifications">
              <i class="bi bi-bell"></i>
              <span *ngIf="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>
            <a routerLink="/profile" routerLinkActive="active" class="action-btn" title="Settings">
              <i class="bi bi-gear"></i>
            </a>
            <button type="button" class="action-btn logout-btn" (click)="logout()" title="Logout">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
          <div class="profile-card-actions collapsed-actions" *ngIf="isCollapsed">
            <button type="button" class="action-btn bell-btn" (click)="toggleNotifications()" title="Notifications">
              <i class="bi bi-bell"></i>
              <span *ngIf="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>
            <a routerLink="/profile" class="action-btn" title="Settings"><i class="bi bi-gear"></i></a>
            <button type="button" class="action-btn logout-btn" (click)="logout()" title="Logout"><i class="bi bi-box-arrow-right"></i></button>
          </div>
        </div>
        <div class="notifications-panel" *ngIf="notificationsOpen">
          <div class="notifications-header">
            <strong>Notifications</strong>
            <span class="small text-muted">{{ unreadCount }} unread</span>
          </div>
          <div class="notifications-list" *ngIf="notifications.length > 0; else noNotif">
            <button type="button" class="notif-item" *ngFor="let n of notifications" (click)="openNotification(n)">
              <div class="notif-dot" [class.unread]="!n.read"></div>
              <div class="notif-content">
                <div class="notif-title">{{ n.title }}</div>
                <div class="notif-message">{{ n.message }}</div>
                <div class="notif-time">{{ formatNotifDate(n.createdAt) }}</div>
              </div>
            </button>
          </div>
          <ng-template #noNotif>
            <div class="text-muted small py-2">No notifications yet.</div>
          </ng-template>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      --sidebar-bg: #ffffff;
      --sidebar-border: #f0f0f0;
      --primary: hsl(222, 47%, 20%);
      --primary-light: hsla(222, 47%, 20%, 0.1);
      --text-main: #1a1c1e;
      --text-muted: #64748b;
      --accent: hsl(38, 92%, 50%);
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
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
    }

    .user-sidebar-content.collapsed {
      width: 80px;
    }

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

    .sidebar-logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .sidebar-logo-icon {
      width: 40px;
      height: 40px;
      background: #0b1120;
      border-radius: 10px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
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
      color: #0b1f3b;
    }

    .sidebar-brand-name span {
      color: #f59e0b;
    }

    .sidebar-brand-tagline {
      font-size: 0.6rem;
      letter-spacing: 0.25em;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .sidebar-toggle-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--sidebar-border);
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
    }

    .sidebar-search {
      padding: 0 1.5rem 1.5rem;
    }

    .search-input-wrapper {
      position: relative;
      background: #f8fafc;
      border-radius: 10px;
    }

    .search-input-wrapper i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }

    .search-input-wrapper input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.5rem;
      background: transparent;
      border: none;
      font-size: 0.85rem;
      outline: none;
    }

    .sidebar-nav {
      flex: 1;
      padding: 0 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      overflow-y: auto;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .section-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      padding: 0 0.75rem;
      margin-bottom: 0.5rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0.75rem;
      text-decoration: none;
      color: var(--text-muted);
      border-radius: 10px;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .nav-link i {
      width: 24px;
      font-size: 1.2rem;
      text-align: center;
    }

    .nav-link:hover:not(.disabled) {
      background: #F0F4F8;
      color: #27324B;
    }

    .nav-link.active {
      background: #F0F4F8;
      color: #27324B;
      font-weight: 700;
    }

    .nav-link.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .user-profile-section {
      padding: 1rem 0.75rem 1.5rem;
      border-top: 1px solid var(--sidebar-border);
    }

    .profile-card {
      background: #F2F5F9;
      border-radius: 12px;
      padding: 0.65rem 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: white;
      color: #64748b;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .action-btn.logout-btn { color: #ef4444; }

    .bell-btn { position: relative; }

    .notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 16px;
      height: 16px;
      background: #ef4444;
      color: white;
      font-size: 0.62rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notifications-panel {
      margin-top: 0.75rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.5rem;
      max-height: 280px;
      overflow-y: auto;
    }

    .notif-item {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
      padding: 0.4rem;
      display: flex;
      gap: 0.5rem;
      text-align: left;
      margin-bottom: 0.35rem;
    }

    .notif-dot.unread { background: #f59e0b; width: 8px; height: 8px; border-radius: 50%; }

    .notif-title { font-size: 0.8rem; font-weight: 700; }
    .notif-message { font-size: 0.75rem; color: #475569; }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .user-name { font-size: 0.9rem; font-weight: 700; margin: 0; }
    .user-role { font-size: 0.7rem; color: #64748b; margin: 0; }
  `]
})
export class UserSidebarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isCollapsed = false;
  avatarImgError = false;
  notifications: AppNotification[] = [];
  notificationsOpen = false;
  @Output() sidebarToggled = new EventEmitter<boolean>();
  private sub?: Subscription;
  private notificationsSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.sub = this.authService.currentUser$.subscribe((u) => {
      this.currentUser = u;
      if (u) {
        this.loadNotifications();
      }
    });

    if (this.currentUser) {
      this.loadNotifications();
      this.notificationsSub = interval(30000).subscribe(() => this.loadNotifications());
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.notificationsSub?.unsubscribe();
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

  get isAdmin(): boolean {
    return this.currentUser?.role?.name === 'ADMIN';
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggled.emit(this.isCollapsed);
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.loadNotifications();
    }
  }

  private loadNotifications() {
    this.userService.getMyNotifications().subscribe({
      next: (items) => this.notifications = items ?? [],
      error: () => this.notifications = []
    });
  }

  openNotification(n: AppNotification) {
    const targetRoute = this.resolveNotificationRoute(n);
    if (!n.read) {
      this.userService.markNotificationAsRead(n.id).subscribe({
        next: () => {
          n.read = true;
          if (targetRoute) this.router.navigate(targetRoute);
        },
        error: () => {
          if (targetRoute) this.router.navigate(targetRoute);
        }
      });
      return;
    }
    if (targetRoute) this.router.navigate(targetRoute);
  }

  private resolveNotificationRoute(n: AppNotification): any[] | null {
    if (!n.eventId) return null;
    if (['REGISTRATION_APPROVED', 'WAITLIST_PROMOTED'].includes(n.type)) {
      return ['/events', n.eventId, 'participants'];
    }
    return ['/events', n.eventId];
  }

  formatNotifDate(value: string): string {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  logout() {
    this.authService.clearSession();
    this.router.navigate(['/login']);
  }
}
