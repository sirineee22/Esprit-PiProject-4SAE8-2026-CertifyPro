// my-applications.component.ts
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

  <!-- HERO -->
  <div class="page-hero">
    <div class="hero-bg-shapes">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    <div class="page-hero-inner">
      <div>
        <div class="header-badge"><span class="pulse-dot"></span>MY APPLICATIONS</div>
        <h2 class="page-title">My Applications</h2>
        <p class="page-sub">Track the status of all your applications in real time</p>
      </div>
      <a class="btn-search" routerLink="/jobs">&#128269; Search offers</a>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-grid">
    <div class="stat-card" *ngFor="let s of statusSummary"
         [style.border-color]="s.borderColor">
      <div class="sc-icon-wrap" [style.background]="s.iconBg">{{ s.icon }}</div>
      <div class="sc-body">
        <p class="sc-val" [style.color]="s.color">{{ s.count }}</p>
        <p class="sc-label">{{ s.label }}</p>
      </div>
    </div>
  </div>

  <!-- FILTER TABS -->
  <div class="toolbar-row">
    <div class="filter-tabs">
      <button class="ftab" [class.active]="activeTab === ''" (click)="setTab('')">All</button>
      <button class="ftab ftab-amber" [class.active]="activeTab === 'NEW'" (click)="setTab('NEW')">New</button>
      <button class="ftab ftab-purple" [class.active]="activeTab === 'INTERVIEW'" (click)="setTab('INTERVIEW')">&#128197; Interviews</button>
      <button class="ftab ftab-green" [class.active]="activeTab === 'APPROVED'" (click)="setTab('APPROVED')">&#9989; Accepted</button>
      <button class="ftab ftab-red" [class.active]="activeTab === 'REJECTED'" (click)="setTab('REJECTED')">Rejected</button>
    </div>
    <span class="results-pill">{{ applications.length }} application{{ applications.length !== 1 ? 's' : '' }}</span>
  </div>

  <!-- LOADING -->
  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div>
    <p class="loading-text">Loading applications...</p>
  </div>

  <!-- APPLICATIONS LIST -->
  <ng-container *ngIf="!loading">
    <div class="apps-list">
      <div class="app-card" *ngFor="let app of applications; trackBy: trackById"
           [class]="'ac-' + app.status.toLowerCase()">

        <div class="ac-top-bar"></div>

        <div class="ac-body">
          <div class="ac-header">
            <div class="ac-avatar">{{ (app.jobOffer?.title || '?').charAt(0).toUpperCase() }}</div>
            <div class="ac-info">
              <h4 class="ac-title">{{ app.jobOffer?.title }}</h4>
              <p class="ac-company">{{ app.companyName }}</p>
            </div>
            <span class="status-badge" [class]="'badge-' + app.status.toLowerCase()">
              <span class="badge-dot"></span>
              {{ statusLabel(app.status) }}
            </span>
          </div>

          <!-- TIMELINE -->
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

          <!-- INTERVIEW BANNER -->
          <div class="interview-banner" *ngIf="app.interviewDate">
            <span class="iv-icon">&#128197;</span>
            <div class="iv-body">
              <p class="iv-title">Scheduled Interview</p>
              <p class="iv-date">{{ app.interviewDate | date:'EEEE d MMMM y, HH:mm' }}</p>
              <p class="iv-notes" *ngIf="app.interviewNotes">{{ app.interviewNotes }}</p>
            </div>
            <a *ngIf="app.interviewLink" (click)="openLink(app.interviewLink)" class="iv-join">
              &#128279; Join
            </a>
          </div>

          <!-- ACTIONS -->
          <div class="ac-actions">
            <button class="btn-withdraw"
              *ngIf="app.status !== 'REJECTED' && app.status !== 'APPROVED' && app.status !== 'WITHDRAWN'"
              (click)="withdraw(app)">
              &#10005; Withdraw
            </button>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div class="empty-state" *ngIf="applications.length === 0">
        <div class="empty-icon">&#128203;</div>
        <p class="empty-title">No applications yet</p>
        <p class="empty-sub">Start applying to offers to track your progress here</p>
        <a routerLink="/jobs" class="empty-cta">&#128269; Browse offers</a>
      </div>
    </div>

    <!-- PAGINATION -->
    <div class="pagination" *ngIf="page && page.totalPages > 1">
      <button (click)="changePage(page!.page - 1)" [disabled]="page.first">&#8249; Prev</button>
      <button *ngFor="let p of pageNumbers()" (click)="changePage(p)" [class.active]="p === page!.page">{{ p+1 }}</button>
      <button (click)="changePage(page!.page + 1)" [disabled]="page.last">Next &#8250;</button>
    </div>
  </ng-container>

</div>
  `,
  styles: [`
    :host { display: block; }
    :host {
      --bg:         #f5f3eb;
      --surface:    #ffffff;
      --border:     #e8e4d9;
      --text:       #1a1a2e;
      --muted:      #6b7280;
      --accent:     #f59e0b;
      --accent-dark:#d97706;
      --danger:     #dc2626;
      --radius:     14px;
      --shadow:     0 2px 12px rgba(0,0,0,0.06);
    }

    .apps-page { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter','Segoe UI',system-ui,sans-serif; padding: 0 0 80px; }

    /* HERO */
    .page-hero { background: linear-gradient(135deg,#0f0c29,#1a1a2e 60%,#24243e); padding: 36px 32px 32px; margin-bottom: 28px; border-bottom: 3px solid var(--accent); position: relative; overflow: hidden; }
    .hero-bg-shapes { position: absolute; inset: 0; pointer-events: none; }
    .shape { position: absolute; border-radius: 50%; opacity: 0.07; }
    .shape.s1 { width: 280px; height: 280px; background: #f59e0b; top: -70px; right: -50px; }
    .shape.s2 { width: 160px; height: 160px; background: #7c3aed; bottom: -50px; left: 35%; }
    .page-hero-inner { display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; }
    .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.12); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; display: inline-block; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
    .page-title { font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -0.5px; }
    .page-sub { font-size: 14px; color: rgba(255,255,255,0.55); margin: 0; }
    .btn-search { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); border: none; color: #1a1a2e; border-radius: 12px; padding: 11px 20px; font-size: 13.5px; font-weight: 800; text-decoration: none; transition: all .2s; box-shadow: 0 4px 20px rgba(245,158,11,0.4); }
    .btn-search:hover { background: var(--accent-dark); color: #fff; transform: translateY(-2px); }

    /* STATS */
    .stats-grid { display: flex; gap: 14px; padding: 0 32px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat-card { flex: 1; min-width: 140px; background: #fff; border: 1.5px solid; border-radius: 16px; padding: 18px 16px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow); transition: transform .2s; }
    .stat-card:hover { transform: translateY(-2px); }
    .sc-icon-wrap { width: 44px; height: 44px; border-radius: 12px; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sc-val { font-size: 26px; font-weight: 800; margin: 0 0 2px; line-height: 1; }
    .sc-label { font-size: 10px; color: var(--muted); font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin: 0; }

    /* TOOLBAR */
    .toolbar-row { display: flex; align-items: center; gap: 12px; padding: 0 32px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .ftab { background: #fff; border: 1.5px solid var(--border); color: var(--muted); border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .ftab:hover { border-color: var(--accent); color: var(--accent); }
    .ftab.active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; }
    .ftab-amber.active  { background: #d97706; border-color: #d97706; }
    .ftab-purple.active { background: #7c3aed; border-color: #7c3aed; }
    .ftab-green.active  { background: #059669; border-color: #059669; }
    .ftab-red.active    { background: #dc2626; border-color: #dc2626; }
    .results-pill { background: #fef3c7; border: 1px solid rgba(245,158,11,0.3); color: #d97706; border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 700; white-space: nowrap; }

    /* LOADING */
    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 80px; }
    .loader { width: 40px; height: 40px; border: 3px solid #e5e9f2; border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 13px; color: var(--muted); }

    /* APPS LIST */
    .apps-list { display: flex; flex-direction: column; gap: 16px; padding: 0 32px; }

    /* APP CARD */
    .app-card { background: #fff; border-radius: 18px; border: 1.5px solid var(--border); box-shadow: var(--shadow); overflow: hidden; transition: transform .2s, box-shadow .2s; animation: fadeUp .3s ease both; }
    .app-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.1); }
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

    /* Top bar per status */
    .ac-top-bar { height: 5px; width: 100%; }
    .ac-new      .ac-top-bar { background: linear-gradient(90deg,#d97706,#fcd34d); }
    .ac-pending  .ac-top-bar, .ac-reviewed .ac-top-bar { background: linear-gradient(90deg,#0891b2,#67e8f9); }
    .ac-interview .ac-top-bar { background: linear-gradient(90deg,#7c3aed,#a78bfa); }
    .ac-approved .ac-top-bar { background: linear-gradient(90deg,#059669,#34d399); }
    .ac-rejected .ac-top-bar { background: linear-gradient(90deg,#dc2626,#f87171); }
    .ac-withdrawn .ac-top-bar { background: linear-gradient(90deg,#6b7280,#d1d5db); }

    .ac-body { padding: 18px 20px 16px; }
    .ac-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .ac-avatar { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#f97316); color: #fff; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ac-info { flex: 1; min-width: 0; }
    .ac-title { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ac-company { font-size: 12.5px; color: var(--muted); margin: 0; }

    /* Status badge */
    .status-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
    .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
    .badge-new, .badge-pending, .badge-reviewed { color: #d97706; background: #fef3c7; }
    .badge-interview { color: #7c3aed; background: #ede9fe; }
    .badge-approved  { color: #059669; background: #d1fae5; }
    .badge-rejected  { color: #dc2626; background: #fee2e2; }
    .badge-withdrawn { color: #6b7280; background: #f3f4f6; }

    /* TIMELINE */
    .timeline { display: flex; align-items: center; background: #fafaf7; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; }
    .tl-step { display: flex; flex-direction: column; align-items: center; gap: 5px; flex-shrink: 0; }
    .tl-step span { font-size: 10.5px; color: var(--muted); white-space: nowrap; font-weight: 500; }
    .tl-dot { width: 12px; height: 12px; border-radius: 50%; background: #e8e4d9; border: 2px solid #e8e4d9; }
    .tl-step.done .tl-dot { background: var(--accent); border-color: var(--accent); }
    .tl-step.current .tl-dot { background: #1a1a2e; border-color: #1a1a2e; box-shadow: 0 0 0 4px rgba(26,26,46,0.15); }
    .tl-step.rejected .tl-dot { background: #dc2626; border-color: #dc2626; }
    .tl-step.done span, .tl-step.current span { color: var(--text); font-weight: 700; }
    .tl-line { flex: 1; height: 2px; background: #e8e4d9; min-width: 20px; }
    .tl-line.done { background: var(--accent); }

    /* INTERVIEW BANNER */
    .interview-banner { display: flex; align-items: flex-start; gap: 12px; background: #ede9fe; border: 1.5px solid #ddd6fe; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
    .iv-icon { font-size: 20px; flex-shrink: 0; }
    .iv-body { flex: 1; }
    .iv-title { font-size: 11px; font-weight: 700; color: #7c3aed; margin: 0 0 3px; text-transform: uppercase; letter-spacing: 0.5px; }
    .iv-date { font-size: 13.5px; font-weight: 700; color: var(--text); margin: 0 0 4px; }
    .iv-notes { font-size: 12px; color: var(--muted); margin: 0; }
    .iv-join { display: inline-flex; align-items: center; gap: 5px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 10px; padding: 7px 14px; font-size: 12.5px; font-weight: 700; white-space: nowrap; flex-shrink: 0; cursor: pointer; transition: all .15s; }
    .iv-join:hover { background: #6d28d9; }

    /* ACTIONS */
    .ac-actions { display: flex; gap: 8px; }
    .btn-withdraw { display: inline-flex; align-items: center; gap: 5px; background: #fff1f2; border: 1.5px solid #fecdd3; color: #dc2626; border-radius: 9px; padding: 6px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .btn-withdraw:hover { background: #fee2e2; }

    /* EMPTY STATE */
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; gap: 10px; }
    .empty-icon { font-size: 52px; margin-bottom: 8px; }
    .empty-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-sub { font-size: 13.5px; color: var(--muted); margin: 0; }
    .empty-cta { margin-top: 16px; display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #1a1a2e; border-radius: 12px; padding: 11px 24px; font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(245,158,11,0.35); transition: all .2s; }
    .empty-cta:hover { background: var(--accent-dark); color: #fff; }

    /* PAGINATION */
    .pagination { display: flex; justify-content: center; gap: 6px; margin-top: 24px; padding: 0 32px; }
    .pagination button { background: #fff; border: 1.5px solid var(--border); color: var(--muted); border-radius: 9px; padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .pagination button.active { background: var(--accent); color: #1a1a2e; border-color: var(--accent); font-weight: 800; }
    .pagination button:disabled { opacity: .3; cursor: not-allowed; }

    @media (max-width: 900px) { .stats-grid { padding: 0 16px; } .apps-list { padding: 0 16px; } .toolbar-row { padding: 0 16px; } }
    @media (max-width: 640px) { .stats-grid { flex-wrap: wrap; } .stat-card { min-width: calc(50% - 7px); } .filter-tabs { display: none; } .page-hero { padding: 24px 20px 20px; } }
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
    { label: 'TOTAL',       count: 0, icon: '📋', iconBg: 'rgba(26,26,46,0.1)',    color: '#1a1a2e', borderColor: 'rgba(26,26,46,0.15)' },
    { label: 'IN PROGRESS', count: 0, icon: '⏳', iconBg: 'rgba(245,158,11,0.12)', color: '#d97706', borderColor: 'rgba(245,158,11,0.2)' },
    { label: 'INTERVIEWS',  count: 0, icon: '📅', iconBg: 'rgba(124,58,237,0.12)', color: '#7c3aed', borderColor: 'rgba(124,58,237,0.2)' },
    { label: 'ACCEPTED',    count: 0, icon: '✅', iconBg: 'rgba(5,150,105,0.12)',  color: '#059669', borderColor: 'rgba(5,150,105,0.2)' },
    { label: 'REJECTED',    count: 0, icon: '✖',  iconBg: 'rgba(220,38,38,0.12)',  color: '#dc2626', borderColor: 'rgba(220,38,38,0.2)' },
  ];

  readonly STATUS_ORDER = ['NEW','PENDING','REVIEWED','INTERVIEW','APPROVED','REJECTED'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.detectChanges();
    let params = new HttpParams().set('page', String(this.currentPage)).set('size', '10');
    if (this.activeTab) params = params.set('status', this.activeTab);
    this.http.get<any>(API_ENDPOINTS['candidateApplications'], { params }).subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res;
        const content: JobApplication[] = (raw?.content ?? []);
        this.applications = content;
        this.page = { content, number: raw?.number ?? 0, page: raw?.number ?? 0, size: raw?.size ?? 10, totalElements: raw?.totalElements ?? 0, totalPages: raw?.totalPages ?? 0, first: raw?.first ?? true, last: raw?.last ?? true, empty: content.length === 0 };
        this.buildSummary(content);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.applications = []; this.loading = false; this.cdr.detectChanges(); }
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

  setTab(tab: string): void { this.activeTab = tab; this.currentPage = 0; this.load(); }

  withdraw(app: JobApplication): void {
    if (!confirm('Withdraw your application?')) return;
    this.appSvc.deleteApplication(app.id).subscribe({
      next: () => { this.applications = this.applications.filter(a => a.id !== app.id); this.buildSummary(this.applications); this.cdr.detectChanges(); },
      error: () => alert('Unable to withdraw the application')
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
    window.open(url.startsWith('http') ? url : 'https://' + url, '_blank', 'noopener,noreferrer');
  }

  changePage(p: number): void {
    if (!this.page || p < 0 || p >= this.page.totalPages) return;
    this.currentPage = p; this.load();
  }

  pageNumbers(): number[] {
    if (!this.page) return [];
    return Array.from({ length: this.page.totalPages }, (_, i) => i);
  }
}
