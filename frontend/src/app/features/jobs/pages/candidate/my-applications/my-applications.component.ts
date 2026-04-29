import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApplicationService } from '../../../services/application.service';
import { JobApplication, ApplicationStatus, PageResponse } from '../../../models/job.models';
import { API_ENDPOINTS } from '../../../../../core/api/api.config';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
<div class="apps-page">
  <!-- DARK HERO BANNER -->
  <div class="page-hero">
    <div class="page-hero-inner">
      <div>
        <div class="header-badge"><span class="pulse-dot"></span>MY APPLICATIONS</div>
        <h2 class="page-title">My Applications</h2>
        <p class="page-sub">Track the status of all your applications in real time</p>
      </div>
      <a class="btn-search" routerLink="/jobs">Search offers</a>
    </div>
  </div>

  <div class="summary-grid">
    <div class="sum-card" *ngFor="let s of statusSummary" [style.border-color]="s.borderColor">
      <div class="sum-icon" [style.background]="s.iconBg">{{ s.icon }}</div>
      <div>
        <p class="sum-count" [style.color]="s.color">{{ s.count }}</p>
        <p class="sum-label">{{ s.label }}</p>
      </div>
    </div>
  </div>

  <div class="tabs-bar">
    <button class="tab" [class.active]="activeTab === ''" (click)="setTab('')">All</button>
    <button class="tab" [class.active]="activeTab === 'NEW'" (click)="setTab('NEW')">New</button>
    <button class="tab" [class.active]="activeTab === 'INTERVIEW'" (click)="setTab('INTERVIEW')">Interviews</button>
    <button class="tab" [class.active]="activeTab === 'APPROVED'" (click)="setTab('APPROVED')">Accepted ✅</button>
    <button class="tab" [class.active]="activeTab === 'REJECTED'" (click)="setTab('REJECTED')">Rejected</button>
  </div>

  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div>
  </div>

  <ng-container *ngIf="!loading">
    <div class="apps-list">
      <div class="app-card" *ngFor="let app of applications; trackBy: trackById">
        <div class="ac-body">
          <div class="ac-top">
            <div>
              <h4 class="ac-title">{{ app.jobOffer?.title }}</h4>
              <p class="ac-company">{{ app.companyName }}</p>
            </div>
            <span class="status-pill" [class]="'sp-' + app.status.toLowerCase()">
              {{ statusLabel(app.status) }}
              <span *ngIf="app.status === 'APPROVED'"> ✓</span>
            </span>
          </div>

          <div class="timeline">
            <div class="tl-step" [class.done]="isAfter(app.status,'NEW')" [class.current]="app.status==='NEW'">
              <div class="tl-dot"></div><span>Submitted</span>
            </div>
            <div class="tl-line" [class.done]="isAfter(app.status,'NEW')"></div>
            <div class="tl-step" [class.done]="isAfter(app.status,'REVIEWED')" [class.current]="app.status==='REVIEWED'">
              <div class="tl-dot"></div><span>Reviewed</span>
            </div>
            <div class="tl-line" [class.done]="isAfter(app.status,'REVIEWED')"></div>
            <div class="tl-step" [class.done]="isAfter(app.status,'INTERVIEW')" [class.current]="app.status==='INTERVIEW'">
              <div class="tl-dot"></div><span>Interview</span>
            </div>
            <div class="tl-line" [class.done]="app.status==='APPROVED'"></div>
            <div class="tl-step" [class.done]="app.status==='APPROVED'" [class.rejected]="app.status==='REJECTED'">
              <div class="tl-dot"></div>
              <span>{{ app.status === 'REJECTED' ? 'Rejected' : 'Decision' }}</span>
            </div>
          </div>

          <div class="ac-actions">
            <button class="btn-withdraw"
              *ngIf="app.status !== 'REJECTED' && app.status !== 'APPROVED' && app.status !== 'WITHDRAWN'"
              (click)="withdraw(app)">
              Withdraw application
            </button>
          </div>

          <!-- Interview info -->
          <div class="interview-banner" *ngIf="app.interviewDate">
            <span class="iv-icon">📅</span>
            <div class="iv-body">
              <p class="iv-title">Scheduled Interview</p>
              <p class="iv-date">{{ app.interviewDate | date:'EEEE d MMMM y à HH:mm' }}</p>
              <p class="iv-notes" *ngIf="app.interviewNotes">{{ app.interviewNotes }}</p>
            </div>
            <a *ngIf="app.interviewLink" (click)="openLink(app.interviewLink)" class="iv-join" style="cursor:pointer">
              🔗 Join
            </a>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="applications.length === 0">
        <div class="empty-icon">📋</div>
        <p>You haven't applied to any offers yet.</p>
        <a routerLink="/jobs" class="btn-go">View available offers →</a>
      </div>
    </div>

    <div class="pagination" *ngIf="page && page.totalPages > 1">
      <button (click)="changePage(page!.page - 1)" [disabled]="page.first">‹ Previous</button>
      <button *ngFor="let p of pageNumbers()" (click)="changePage(p)" [class.active]="p === page!.page">{{ p+1 }}</button>
      <button (click)="changePage(page!.page + 1)" [disabled]="page.last">Next ›</button>
    </div>
  </ng-container>
</div>
  `,
  styles: [`
    :host { display: block; }
    .page-hero { background: #1a1a2e; padding: 28px 28px 24px; margin: -28px -28px 24px; border-bottom: 3px solid #f59e0b; }
    .page-hero .page-title { color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 4px; }
    .page-hero .page-sub { color: rgba(255,255,255,0.6); font-size: 13.5px; margin: 0; }
    .page-hero .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; }
    .page-hero .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; display: inline-block; margin-right: 4px; }
    .page-hero-inner { display: flex; justify-content: space-between; align-items: flex-end; }
    :host {
      --bg: #f0ece4;
      --card: #ffffff;
      --border: #e8e0d0;
      --text: #1a1a2e;
      --text-muted: #6b7280;
      --accent: #f59e0b;
      --accent-light: #fef3c7;
      --radius: 16px;
    }
    .apps-page { min-height: 100vh; background: var(--bg); color: #1a1a2e; font-family: 'Segoe UI', system-ui, sans-serif; padding: 28px; padding-bottom: 60px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .page-title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin: 0 0 4px; }
    .page-sub { font-size: 14px; color: #9ca3af; margin: 0; }
    .btn-search { background: #f59e0b; color: #1a1a2e; text-decoration: none; border-radius: 12px; padding: 10px 20px; font-size: 13.5px; font-weight: 700; box-shadow: 0 4px 14px rgba(245,158,11,0.35); transition: all .2s; } .btn-search:hover { background: #d97706; color: #fff; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(245,158,11,0.45); }
    .summary-grid { display: flex; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
    .sum-card { flex: 1; min-width: 140px; background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .sum-icon { width: 44px; height: 44px; border-radius: 12px; font-size: 20px; display: flex; align-items: center; justify-content: center; }
    .sum-count { font-size: 26px; font-weight: 800; margin: 0 0 2px; }
    .sum-label { font-size: 11px; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; margin: 0; }
    .tabs-bar { display: flex; border-bottom: 1px solid #e8e0d0; margin-bottom: 20px; flex-wrap: wrap; }
    .tab { background: none; border: none; cursor: pointer; padding: 10px 18px; font-size: 13px; color: #9ca3af; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab:hover { color: #6b7280; }
    .tab.active { color: #f59e0b; border-bottom-color: #f59e0b; font-weight: 600; }
    .loading-wrap { display: flex; justify-content: center; padding: 60px; }
    .loader { width: 36px; height: 36px; border: 3px solid #e8e0d0; border-top-color: #f59e0b; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .apps-list { display: flex; flex-direction: column; gap: 14px; }
    .app-card { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; padding: 20px; display: flex; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .app-card:hover { border-color: rgba(245,158,11,0.4); }
    .ac-body { flex: 1; min-width: 0; }
    .ac-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .ac-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 3px; }
    .ac-company { font-size: 13px; color: #9ca3af; margin: 0; }
    .status-pill { font-size: 11.5px; font-weight: 700; padding: 4px 12px; border-radius: 20px; white-space: nowrap; }
    .sp-new      { background: #fef3c7; color: #f59e0b; }
    .sp-pending  { background: rgba(212,160,23,0.15); color: #d4a017; }
    .sp-reviewed { background: rgba(23,162,184,0.15); color: #17a2b8; }
    .sp-interview{ background: rgba(132,94,247,0.15); color: #845ef7; }
    .sp-approved { background: #dcfce7; color: #16a34a; }
    .sp-rejected { background: rgba(240,101,72,0.15); color: #f06548; }
    .sp-withdrawn{ background: rgba(255,255,255,0.05); color: #9ca3af; }
    .timeline { display: flex; align-items: center; background: var(--bg); border: 1px solid #e8e0d0; border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; }
    .tl-step { display: flex; flex-direction: column; align-items: center; gap: 5px; flex-shrink: 0; }
    .tl-step span { font-size: 10.5px; color: #9ca3af; white-space: nowrap; }
    .tl-dot { width: 12px; height: 12px; border-radius: 50%; background: #e8e0d0; }
    .tl-step.done .tl-dot { background: #f59e0b; }
    .tl-step.current .tl-dot { background: #1a1a2e; box-shadow: 0 0 0 4px rgba(26,26,46,0.15); }
    .tl-step.rejected .tl-dot { background: #f06548; }
    .tl-step.done span, .tl-step.current span { color: #1a1a2e; font-weight: 600; }
    .tl-line { flex: 1; height: 2px; background: #e8e0d0; min-width: 20px; }
    .tl-line.done { background: #f59e0b; }
    .ac-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-withdraw { background: none; color: #f06548; border: 1px solid rgba(240,101,72,0.3); border-radius: 7px; padding: 5px 12px; font-size: 12.5px; cursor: pointer; }
    .btn-withdraw:hover { background: rgba(240,101,72,0.1); }
    .interview-banner { display: flex; align-items: flex-start; gap: 12px; background: #fef3c7; border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 12px 14px; margin-top: 10px; }
    .iv-icon { font-size: 20px; flex-shrink: 0; }
    .iv-body { flex: 1; }
    .iv-title { font-size: 12px; font-weight: 700; color: #f59e0b; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .iv-date { font-size: 13.5px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
    .iv-notes { font-size: 12px; color: #6b7280; margin: 0; }
    .iv-join { background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 12px; padding: 7px 14px; font-size: 12.5px; font-weight: 700; white-space: nowrap; flex-shrink: 0; } .iv-join:hover { background: #2d2d4e; }
    .empty { text-align: center; padding: 60px; color: #9ca3af; }
    .empty-icon { font-size: 40px; margin-bottom: 12px; }
    .btn-go { color: #f59e0b; text-decoration: none; font-weight: 600; }
    .pagination { display: flex; justify-content: center; gap: 6px; margin-top: 20px; }
    .pagination button { background: #ffffff; border: 1px solid #e8e0d0; color: #6b7280; border-radius: 7px; padding: 7px 13px; font-size: 13px; cursor: pointer; } .pagination button.active { background: #f59e0b; color: #fff; border-color: #f59e0b; }
    .pagination button:disabled { opacity: .3; cursor: not-allowed; }
  `]
})
export class MyApplicationsComponent implements OnInit {
  private appSvc = inject(ApplicationService);
  private http   = inject(HttpClient);
  private cdr    = inject(ChangeDetectorRef);

  applications: JobApplication[] = [];
  page: PageResponse<JobApplication> | null = null;
  loading = true;
  activeTab = '';
  currentPage = 0;

  statusSummary = [
    { label: 'TOTAL',       count: 0, icon: '📋', iconBg: 'rgba(79,142,247,0.12)',  color: '#4f8ef7', borderColor: 'rgba(79,142,247,0.2)' },
    { label: 'IN PROGRESS', count: 0, icon: '⏳', iconBg: 'rgba(212,160,23,0.12)', color: '#d4a017', borderColor: 'rgba(212,160,23,0.2)' },
    { label: 'INTERVIEWS',  count: 0, icon: '📅', iconBg: 'rgba(132,94,247,0.12)', color: '#845ef7', borderColor: 'rgba(132,94,247,0.2)' },
    { label: 'ACCEPTED',    count: 0, icon: '✅', iconBg: 'rgba(0,212,180,0.12)',  color: '#00d4b4', borderColor: 'rgba(0,212,180,0.2)' },
    { label: 'REJECTED',    count: 0, icon: '✖',  iconBg: 'rgba(240,101,72,0.12)', color: '#f06548', borderColor: 'rgba(240,101,72,0.2)' },
  ];

  readonly STATUS_ORDER = ['NEW','PENDING','REVIEWED','INTERVIEW','APPROVED','REJECTED'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cdr.detectChanges();

    let params = new HttpParams()
      .set('page', String(this.currentPage))
      .set('size', '10');
    if (this.activeTab) params = params.set('status', this.activeTab);

    this.http.get<any>(API_ENDPOINTS['candidateApplications'], { params }).subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res;
        const content: JobApplication[] = (raw?.content ?? []);
        this.applications = content;
        this.page = {
          content,
          number:        raw?.number        ?? 0,
          page:          raw?.number        ?? 0,
          size:          raw?.size          ?? 10,
          totalElements: raw?.totalElements ?? 0,
          totalPages:    raw?.totalPages    ?? 0,
          first:         raw?.first         ?? true,
          last:          raw?.last          ?? true,
          empty:         content.length === 0,
        };
        this.buildSummary(content);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ ERROR my-applications:', err);
        this.applications = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buildSummary(apps: JobApplication[]): void {
    this.statusSummary[0].count = apps.length;
    this.statusSummary[1].count = apps.filter(a => ['NEW','PENDING','REVIEWED'].includes(a.status)).length;
    this.statusSummary[2].count = apps.filter(a => a.status === 'INTERVIEW').length;
    this.statusSummary[3].count = apps.filter(a => a.status === 'APPROVED').length;
    this.statusSummary[4].count = apps.filter(a => a.status === 'REJECTED').length;
  }

  trackById(_: number, app: JobApplication): number { return app.id; }

  setTab(tab: string): void {
    this.activeTab   = tab;
    this.currentPage = 0;
    this.load();
  }

// src/app/modules/job/components/my-applications/my-applications.component.ts

withdraw(app: JobApplication): void {
    if (!confirm('Withdraw your application?')) return;

    this.appSvc.deleteApplication(app.id).subscribe({
      next: () => {
        this.applications = this.applications.filter(a => a.id !== app.id);
        this.buildSummary(this.applications);
        this.cdr.detectChanges();
        alert('Application withdrawn successfully');
      },
      error: err => {
        console.error('Error withdrawing application:', err);
        alert('Unable to withdraw the application');
      }
    });
}

  isAfter(current: ApplicationStatus, target: ApplicationStatus): boolean {
    return this.STATUS_ORDER.indexOf(current) > this.STATUS_ORDER.indexOf(target);
  }

  statusLabel(s: ApplicationStatus): string {
    return ({ NEW:'New', PENDING:'Pending', REVIEWED:'Reviewed', INTERVIEW:'Interview', APPROVED:'Accepted', REJECTED:'Rejected', WITHDRAWN:'Withdrawn' } as any)[s] || s;
  }

  openLink(url: string): void {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : 'https://' + url;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }

  changePage(p: number): void {
    if (!this.page || p < 0 || p >= this.page.totalPages) return;
    this.currentPage = p;
    this.load();
  }

  pageNumbers(): number[] {
    if (!this.page) return [];
    return Array.from({ length: this.page.totalPages }, (_, i) => i);
  }
}