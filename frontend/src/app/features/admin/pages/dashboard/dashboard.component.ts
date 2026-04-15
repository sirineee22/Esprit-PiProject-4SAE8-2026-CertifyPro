import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../../users/services/users.api';
import { TrainerRequestService } from '../../../trainer-requests/services/trainer-request.service';
import { EventsApiService } from '../../../events/services/events.api';
import { User } from '../../../../shared/models/user.model';
import { AuditLog } from '../../../../shared/models/audit.model';
import { API_ENDPOINTS } from '../../../../core/api/api.config';

interface DashboardStats {
    totalUsers: number;
    totalLearners: number;
    totalTrainers: number;
    pendingRequests: number;
    totalEvents: number;
    upcomingEvents: number;
    totalRegistrations: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's what's happening on CertifyPro today.</p>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" (click)="loadDashboardData()" [disabled]="isLoading">
            <i class="bi bi-arrow-clockwise" [class.spinning]="isLoading"></i>
            Refresh Data
          </button>
        </div>
      </header>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!isLoading">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon users">
              <i class="bi bi-people-fill"></i>
            </div>
            <div class="stat-details">
              <h3>Total Users</h3>
              <div class="value-row">
                <span class="value">{{stats.totalUsers}}</span>
                <span class="trend info">All Roles</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon learners">
              <i class="bi bi-book-fill"></i>
            </div>
            <div class="stat-details">
              <h3>Learners</h3>
              <div class="value-row">
                <span class="value">{{stats.totalLearners}}</span>
                <span class="trend positive">Active</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon trainers">
              <i class="bi bi-mortarboard-fill"></i>
            </div>
            <div class="stat-details">
              <h3>Trainers</h3>
              <div class="value-row">
                <span class="value">{{stats.totalTrainers}}</span>
                <span class="trend success">Approved</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon pending">
              <i class="bi bi-hourglass-split"></i>
            </div>
            <div class="stat-details">
              <h3>Pending Requests</h3>
              <div class="value-row">
                <span class="value">{{stats.pendingRequests}}</span>
                <span class="trend warning">Review</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon sessions">
              <i class="bi bi-calendar-check-fill"></i>
            </div>
            <div class="stat-details">
              <h3>Total Events</h3>
              <div class="value-row">
                <span class="value">{{stats.totalEvents}}</span>
                <span class="trend success">{{stats.upcomingEvents}} Upcoming</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-content">
          <!-- Recent Users -->
          <div class="recent-activity card">
            <div class="card-header">
              <h2>Recent Users</h2>
              <button class="btn-text" routerLink="/admin/users">View All</button>
            </div>
            <div class="activity-list">
              <div class="activity-item" *ngFor="let user of recentUsers">
                <div class="item-icon" [ngClass]="getRoleClass(user.role?.name)">
                  <i class="bi" [ngClass]="getRoleIcon(user.role?.name)"></i>
                </div>
                <div class="item-info">
                  <p class="text">
                    <strong>{{user.firstName}} {{user.lastName}}</strong>
                    <span class="role-badge" [ngClass]="user.role?.name?.toLowerCase()">
                      {{user.role?.name}}
                    </span>
                  </p>
                  <span class="email">{{user.email}}</span>
                </div>
              </div>
              <div class="empty-message" *ngIf="recentUsers.length === 0">
                <i class="bi bi-inbox"></i>
                <p>No users yet</p>
              </div>
            </div>
          </div>

          <!-- Recent Activity (Audit) -->
          <div class="card recent-audit">
            <div class="card-header">
              <h2>Recent Activity</h2>
              <button class="btn-text" routerLink="/admin/audit-logs">History</button>
            </div>
            <div class="activity-list">
              <div class="activity-item" *ngFor="let log of recentLogs">
                <div class="item-icon" [ngClass]="getActionClass(log.action)">
                   <i class="bi" [ngClass]="getActionIcon(log.action)"></i>
                </div>
                <div class="item-info">
                  <p class="text">
                    <strong>{{ log.actorEmail || 'System' }}</strong>
                    <span>{{ log.action }}</span>
                  </p>
                  <span class="email">{{ log.details }} — {{ formatTime(log.createdAt) }}</span>
                </div>
              </div>
              <div class="empty-message" *ngIf="recentLogs.length === 0">
                <i class="bi bi-clock-history"></i>
                <p>No recent activity</p>
              </div>
            </div>
          </div>

          <!-- User Distribution -->
          <div class="platform-health card">
            <div class="card-header">
              <h2>User Distribution</h2>
            </div>
            <div class="health-metrics">
              <div class="metric">
                <div class="metric-header">
                  <span class="metric-label">Learners</span>
                  <span class="metric-value">{{stats.totalLearners}}</span>
                </div>
                <div class="metric-bar">
                  <div class="bar-fill learner" [style.width.%]="getLearnerPercentage()"></div>
                </div>
              </div>

              <div class="metric">
                <div class="metric-header">
                  <span class="metric-label">Trainers</span>
                  <span class="metric-value">{{stats.totalTrainers}}</span>
                </div>
                <div class="metric-bar">
                  <div class="bar-fill trainer" [style.width.%]="getTrainerPercentage()"></div>
                </div>
              </div>

              <div class="metric">
                <div class="metric-header">
                  <span class="metric-label">Pending Approvals</span>
                  <span class="metric-value">{{stats.pendingRequests}}</span>
                </div>
                <div class="metric-bar">
                  <div class="bar-fill pending" [style.width.%]="getPendingPercentage()"></div>
                </div>
              </div>

              <div class="metric">
                <div class="metric-header">
                  <span class="metric-label">Event Activity</span>
                  <span class="metric-value">{{stats.totalRegistrations}} Reg.</span>
                </div>
                <div class="metric-bar">
                  <div class="bar-fill sessions" [style.width.%]="70"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .dashboard-container {
      padding: 2.5rem;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
    }

    .dashboard-header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #0b1120;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }

    .dashboard-header p {
      color: #6b7280;
      font-size: 1.125rem;
      font-weight: 500;
    }

    .btn-refresh {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1.5rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-weight: 700;
      color: #0b1120;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .btn-refresh:hover:not(:disabled) {
      border-color: #f59e0b;
      color: #f59e0b;
      background: #fffbeb;
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .btn-refresh:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 2rem;
      gap: 1.5rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .loading-state p {
      color: #6b7280;
      font-weight: 600;
      font-size: 1.125rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background: white;
      padding: 1.75rem;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      flex-shrink: 0;
    }

    .stat-icon.users { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
    .stat-icon.learners { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
    .stat-icon.trainers { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .stat-icon.pending { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
    .stat-icon.sessions { background: linear-gradient(135deg, #ec4899, #db2777); color: white; }

    .stat-details {
      flex: 1;
    }

    .stat-details h3 {
      font-size: 0.875rem;
      font-weight: 700;
      color: #6b7280;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .value-row {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
    }

    .value {
      font-size: 2rem;
      font-weight: 800;
      color: #0b1120;
      line-height: 1;
    }

    .trend {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
    }

    .trend.positive { background: #d1fae5; color: #065f46; }
    .trend.success { background: #d1fae5; color: #065f46; }
    .trend.warning { background: #fef3c7; color: #92400e; }
    .trend.info { background: #dbeafe; color: #1e40af; }

    /* Dashboard Content */
    .dashboard-content {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
    }

    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .card-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    }

    .card-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0b1120;
    }

    .btn-text {
      background: none;
      border: none;
      color: #2563eb;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.875rem;
      transition: color 0.2s;
    }

    .btn-text:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }

    /* Activity List */
    .activity-list {
      max-height: 480px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .activity-item:last-child { border-bottom: none; }

    .item-icon {
      width: 40px;
      height: 40px;
      background: #f1f5f9;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      color: #6b7280;
      flex-shrink: 0;
    }

    .item-icon.learner { background: #eff6ff; color: #3b82f6; }
    .item-icon.trainer { background: #d1fae5; color: #10b981; }
    .item-icon.admin { background: #fef3c7; color: #f59e0b; }

    .item-info {
      flex: 1;
      min-width: 0;
    }

    .item-info .text {
      font-size: 0.9375rem;
      color: #0b1120;
      margin: 0 0 0.25rem 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .role-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .role-badge.learner { background: #dbeafe; color: #1e40af; }
    .role-badge.trainer { background: #d1fae5; color: #065f46; }
    .role-badge.admin { background: #fef3c7; color: #92400e; }

    .item-info .email {
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .empty-message {
      text-align: center;
      padding: 3rem 2rem;
      color: #9ca3af;
    }

    /* Health Metrics */
    .health-metrics {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .metric-label { font-size: 0.875rem; font-weight: 600; color: #6b7280; }
    .metric-value { font-size: 1.125rem; font-weight: 800; color: #0b1120; }
    .metric-bar { height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 5px; }

    .bar-fill.learner { background: linear-gradient(90deg, #3b82f6, #2563eb); }
    .bar-fill.trainer { background: linear-gradient(90deg, #10b981, #059669); }
    .bar-fill.pending { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .bar-fill.sessions { background: linear-gradient(90deg, #ec4899, #db2777); }

    @media (max-width: 1024px) {
      .dashboard-content { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
    stats: DashboardStats = {
        totalUsers: 0,
        totalLearners: 0,
        totalTrainers: 0,
        pendingRequests: 0,
        totalEvents: 0,
        upcomingEvents: 0,
        totalRegistrations: 0
    };
    recentUsers: User[] = [];
    recentLogs: AuditLog[] = [];
    isLoading = true;

    constructor(
        private userService: UserService,
        private trainerRequestService: TrainerRequestService,
        private eventService: EventsApiService,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.isLoading = true;

        forkJoin({
            users: this.userService.getAll(),
            requests: this.trainerRequestService.getPendingRequests(),
            eventStats: this.eventService.adminStats()
        }).subscribe({
            next: ({ users, requests, eventStats }) => {
                this.stats.totalUsers = users.length;
                this.stats.totalLearners = users.filter(u => u.role?.name === 'LEARNER').length;
                this.stats.totalTrainers = users.filter(u => u.role?.name === 'TRAINER').length;
                this.stats.pendingRequests = requests.length;

                this.stats.totalEvents = eventStats.totalEvents;
                this.stats.upcomingEvents = eventStats.upcoming;
                this.stats.totalRegistrations = eventStats.totalRegistrations;

                this.recentUsers = users
                    .filter(u => u.role?.name !== 'ADMIN')
                    .slice(-3)
                    .reverse();

                this.http.get<AuditLog[]>(API_ENDPOINTS.audit).subscribe({
                    next: (logs) => {
                        this.recentLogs = logs.slice(0, 4);
                        this.cdr.detectChanges();
                    }
                });

                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load dashboard data', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    getRoleClass(roleName?: string): string {
        return roleName?.toLowerCase() || 'learner';
    }

    getRoleIcon(roleName?: string): string {
        switch (roleName) {
            case 'TRAINER': return 'bi-mortarboard-fill';
            case 'ADMIN': return 'bi-shield-fill-check';
            default: return 'bi-person-fill';
        }
    }

    getLearnerPercentage(): number {
        if (this.stats.totalUsers === 0) return 0;
        return (this.stats.totalLearners / this.stats.totalUsers) * 100;
    }

    getTrainerPercentage(): number {
        if (this.stats.totalUsers === 0) return 0;
        return (this.stats.totalTrainers / this.stats.totalUsers) * 100;
    }

    getPendingPercentage(): number {
        if (this.stats.totalUsers === 0) return 0;
        return (this.stats.pendingRequests / (this.stats.totalUsers + this.stats.pendingRequests)) * 100;
    }

    getActionClass(action: string) {
        if (action.includes('DELETE')) return 'admin';
        if (action.includes('UPDATE')) return 'trainer';
        return 'learner';
    }

    getActionIcon(action: string) {
        if (action.includes('DELETE')) return 'bi-trash';
        if (action.includes('UPDATE')) return 'bi-pencil-square';
        return 'bi-activity';
    }

    formatTime(d: string) {
        const date = new Date(d);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    }
}
