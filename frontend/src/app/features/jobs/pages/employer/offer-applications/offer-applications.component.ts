import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApplicationService } from '../../../services/application.service';
import { API_BASE_URL, API_ENDPOINTS } from '../../../../../core/api/api.config';
import {
  JobApplication, ApplicationStatus, ApplicationFilterRequest, PageResponse,
  UpdateApplicationStatusRequest
} from '../../../models/job.models';

@Component({
  selector: 'app-offer-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="apps-page">

  <!-- HERO -->
  <div class="page-hero">
    <div class="page-hero-inner">
      <div>
        <p class="hero-eyebrow">Application Management</p>
        <h2 class="page-title">Received Applications</h2>
        <p class="page-sub">Manage applications for your job offers</p>
      </div>
      <div class="header-actions">
        <a class="btn-back" routerLink="/jobs/employer/jobs">Back</a>
        <button class="btn-matching" (click)="toggleMatching()">Suggested Candidates</button>
      </div>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-grid">
    <div class="stat-card">
      <p class="sc-label">Total</p>
      <p class="sc-val">{{ summaryCards[0].count }}</p>
    </div>
    <div class="stat-card">
      <p class="sc-label">Nouveaux</p>
      <p class="sc-val sc-blue">{{ summaryCards[1].count }}</p>
    </div>
    <div class="stat-card">
      <p class="sc-label">Entretiens</p>
      <p class="sc-val sc-purple">{{ summaryCards[2].count }}</p>
    </div>
    <div class="stat-card">
      <p class="sc-label">Acceptés</p>
      <p class="sc-val sc-green">{{ summaryCards[3].count }}</p>
    </div>
    <div class="stat-card">
      <p class="sc-label">Refusés</p>
      <p class="sc-val sc-red">{{ summaryCards[4].count }}</p>
    </div>
  </div>

  <!-- TOOLBAR -->
  <div class="toolbar-row">
    <div class="search-wrap">
      <input [(ngModel)]="filter.keyword" (keyup.enter)="load()" placeholder="Search a candidate..." class="search-input"/>
    </div>
    <div class="filter-tabs">
      <button class="ftab" [class.active]="activeTab===''" (click)="setTab('')">All</button>
      <button class="ftab" [class.active]="activeTab==='NEW'" (click)="setTab('NEW')">New</button>
      <button class="ftab" [class.active]="activeTab==='INTERVIEW'" (click)="setTab('INTERVIEW')">Interviews</button>
      <button class="ftab" [class.active]="activeTab==='APPROVED'" (click)="setTab('APPROVED')">Accepted</button>
      <button class="ftab" [class.active]="activeTab==='REJECTED'" (click)="setTab('REJECTED')">Rejected</button>
    </div>
    <span class="results-pill">{{ displayedApplications.length }} application{{ displayedApplications.length !== 1 ? 's' : '' }}</span>
  </div>

  <!-- LOADING -->
  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div>
    <p class="loading-text">Chargement...</p>
  </div>

  <!-- CARDS -->
  <div class="candidates-grid" *ngIf="!loading && displayedApplications.length > 0">
    <div class="cand-card" *ngFor="let app of displayedApplications"
         [class]="'cc-' + app.status.toLowerCase()">

      <div class="cc-header">
        <div class="cc-avatar">{{ (app.candidateName || '?').charAt(0).toUpperCase() }}</div>
        <div class="cc-info">
          <h6 class="cc-name">{{ app.candidateName }}</h6>
          <p class="cc-date" *ngIf="app.applyDate">{{ app.applyDate | date:'d MMM y' }}</p>
        </div>
        <span class="cc-badge" [class]="'badge-' + app.status.toLowerCase()">
          {{ statusLabel(app.status) }}
        </span>
      </div>

      <p class="cc-cover" *ngIf="app.coverLetter">"{{ app.coverLetter | slice:0:110 }}..."</p>

      <div class="cc-actions">
        <button class="ca-btn ca-cv" *ngIf="app.resumeUrl" (click)="downloadResume(app)">CV</button>
        <button class="ca-btn ca-accept" (click)="updateStatus(app, 'APPROVED')">Accept</button>
        <button class="ca-btn ca-interview" (click)="openInterviewModal(app)">Interview</button>
        <button class="ca-btn ca-reject" (click)="updateStatus(app, 'REJECTED')">Reject</button>
      </div>

      <div class="cc-interview" *ngIf="app.interviewDate">
        <span class="iv-label">Scheduled Interview</span>
        <span class="iv-date">{{ app.interviewDate | date:'d MMM y, HH:mm' }}</span>
        <a *ngIf="app.interviewLink" [href]="app.interviewLink" target="_blank" class="iv-link">Join</a>
      </div>

    </div>
  </div>

  <div class="empty" *ngIf="!loading && displayedApplications.length === 0">
    <p>Aucune candidature</p>
  </div>

  <!-- MATCHING PANEL -->
  <div class="matching-panel" *ngIf="showMatching">
    <div class="mp-header">
      <h4 class="mp-title">Suggested Candidates</h4>
      <button class="mp-close" (click)="showMatching = false">&#10005;</button>
    </div>
    <div class="loading-wrap" *ngIf="loadingMatching"><div class="loader"></div></div>
    <div class="mp-grid" *ngIf="!loadingMatching">
      <div class="mp-card" *ngFor="let c of matchingCandidates">
        <div class="mp-score" [class]="scoreClass(c.matchScore)">{{ c.matchScore }}%</div>
        <div class="mp-info">
          <p class="mp-name">{{ c.fullName }}</p>
          <p class="mp-sub">{{ c.jobTitle }}</p>
          <div class="mp-skills">
            <span class="mp-skill" *ngFor="let s of c.matchedSkills?.slice(0,4)">{{ s }}</span>
          </div>
        </div>
        <a *ngIf="c.resumeUrl" [href]="c.resumeUrl" target="_blank" class="mp-cv">CV</a>
      </div>
      <div class="mp-empty" *ngIf="matchingCandidates.length === 0">No candidates found.</div>
    </div>
  </div>

</div>

<!-- INTERVIEW MODAL -->
<div class="modal-overlay" *ngIf="interviewApp" (click)="closeInterviewModal()">
  <div class="modal-box" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <div>
        <h5 class="modal-title">Schedule an Interview</h5>
        <p class="modal-sub">{{ interviewApp?.candidateName }}</p>
      </div>
      <button class="modal-close" (click)="closeInterviewModal()">&#10005;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Date and time</label>
        <input type="datetime-local" [(ngModel)]="interviewForm.date" class="modal-input" />
      </div>
      <div class="form-group">
        <label>Meeting link</label>
        <input type="url" [(ngModel)]="interviewForm.link" placeholder="https://zoom.us/j/..." class="modal-input" />
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea [(ngModel)]="interviewForm.notes" rows="3" class="modal-input"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="mf-cancel" (click)="closeInterviewModal()">Cancel</button>
      <button class="mf-submit" (click)="scheduleInterview()" [disabled]="!interviewForm.date">Confirm</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    :host {
      --bg:      #f8f8f6;
      --surface: #ffffff;
      --border:  #ebebeb;
      --text:    #111111;
      --muted:   #888888;
      --accent:  #c9a84c;
      --danger:  #c0392b;
      --radius:  12px;
      --shadow:  0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
    }

    .apps-page { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter','Segoe UI',system-ui,sans-serif; padding: 0 0 80px; }

    /* HERO */
    .page-hero { background: #111; padding: 40px 40px 36px; margin-bottom: 28px; }
    .page-hero-inner { display: flex; justify-content: space-between; align-items: center; }
    .hero-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin: 0 0 10px; }
    .page-title { font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 6px; letter-spacing: -0.3px; }
    .page-sub { font-size: 14px; color: #888; margin: 0; }
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .btn-back { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); border-radius: var(--radius); padding: 10px 18px; font-size: 13px; text-decoration: none; transition: all .15s; } .btn-back:hover { border-color: rgba(255,255,255,0.5); color: #fff; }
    .btn-matching { background: var(--accent); border: none; color: #111; border-radius: var(--radius); padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity .15s; } .btn-matching:hover { opacity: .88; }

    /* STATS */
    .stats-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin: 0 40px 24px; }
    .stat-card { background: var(--surface); padding: 20px 18px; }
    .sc-label { font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin: 0 0 6px; }
    .sc-val { font-size: 32px; font-weight: 700; color: var(--text); line-height: 1; margin: 0; letter-spacing: -1px; }
    .sc-blue   { color: #2563eb !important; }
    .sc-purple { color: #7c3aed !important; }
    .sc-green  { color: #16a34a !important; }
    .sc-red    { color: var(--danger) !important; }

    /* TOOLBAR */
    .toolbar-row { display: flex; align-items: center; gap: 10px; padding: 0 40px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-wrap { flex: 1; min-width: 200px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 14px; transition: border-color .15s; } .search-wrap:focus-within { border-color: var(--accent); }
    .search-input { background: none; border: none; color: var(--text); font-size: 13.5px; outline: none; width: 100%; }
    .search-input::placeholder { color: #ccc; }
    .filter-tabs { display: flex; gap: 4px; }
    .ftab { background: var(--surface); border: 1px solid var(--border); color: var(--muted); border-radius: 8px; padding: 7px 14px; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all .15s; } .ftab:hover { border-color: var(--accent); color: var(--text); } .ftab.active { background: var(--text); border-color: var(--text); color: #fff; font-weight: 600; }
    .results-pill { font-size: 12px; color: var(--muted); padding: 0 4px; white-space: nowrap; }

    /* LOADING */
    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; }
    .loader { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 13px; color: var(--muted); }

    /* CANDIDATES GRID */
    .candidates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; padding: 0 40px; }

    /* CANDIDATE CARD */
    .cand-card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); border-left: 3px solid var(--border); box-shadow: var(--shadow); padding: 18px; transition: box-shadow .2s, transform .2s; animation: fadeUp .3s ease both; }
    .cand-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.09); transform: translateY(-2px); }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .cc-new      { border-left-color: #2563eb; }
    .cc-pending, .cc-reviewed { border-left-color: var(--accent); }
    .cc-interview{ border-left-color: #7c3aed; }
    .cc-approved { border-left-color: #16a34a; }
    .cc-rejected { border-left-color: var(--danger); }

    .cc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .cc-avatar { width: 38px; height: 38px; border-radius: 50%; background: #f0f0f0; color: var(--text); font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border); }
    .cc-new      .cc-avatar { background: #eff6ff; color: #2563eb; }
    .cc-interview .cc-avatar { background: #f5f3ff; color: #7c3aed; }
    .cc-approved .cc-avatar { background: #f0fdf4; color: #16a34a; }
    .cc-rejected .cc-avatar { background: #fdf3f2; color: var(--danger); }
    .cc-info { flex: 1; min-width: 0; }
    .cc-name { font-size: 14px; font-weight: 600; color: var(--text); margin: 0 0 2px; }
    .cc-date { font-size: 12px; color: var(--muted); margin: 0; }

    /* Status badge */
    .cc-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; border: 1px solid; white-space: nowrap; flex-shrink: 0; }
    .badge-new, .badge-pending, .badge-reviewed { color: #b8860b; background: #fdf6e3; border-color: #f0d080; }
    .badge-interview { color: #7c3aed; background: #f5f3ff; border-color: #ddd6fe; }
    .badge-approved  { color: #16a34a; background: #f0fdf4; border-color: #c3e6cb; }
    .badge-rejected  { color: var(--danger); background: #fdf3f2; border-color: #f5c6c2; }

    /* Cover letter */
    .cc-cover { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin: 0 0 12px; font-style: italic; padding: 8px 10px; background: var(--bg); border-radius: 6px; }

    /* Actions */
    .cc-actions { display: flex; gap: 6px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--border); }
    .ca-btn { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 7px; padding: 5px 11px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all .15s; }
    .ca-btn:hover { background: var(--bg); border-color: #bbb; }
    .ca-cv       { color: #2563eb; border-color: #bfdbfe; background: #eff6ff; } .ca-cv:hover { background: #dbeafe; }
    .ca-accept   { color: #16a34a; border-color: #c3e6cb; background: #f0fdf4; } .ca-accept:hover { background: #dcfce7; }
    .ca-interview{ color: #7c3aed; border-color: #ddd6fe; background: #f5f3ff; } .ca-interview:hover { background: #ede9fe; }
    .ca-reject   { color: var(--danger); border-color: #f5c6c2; background: #fdf3f2; } .ca-reject:hover { background: #ffe4e6; }

    /* Interview info */
    .cc-interview-info, .cc-interview { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 10px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 7px; font-size: 12px; }
    .iv-label { font-size: 10px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; }
    .iv-date { color: var(--text); font-weight: 500; }
    .iv-link { color: var(--accent); text-decoration: none; margin-left: auto; font-weight: 600; font-size: 12px; }

    .empty { color: var(--muted); padding: 60px; text-align: center; font-size: 14px; }

    /* MATCHING PANEL */
    .matching-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin: 20px 40px 0; box-shadow: var(--shadow); }
    .mp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .mp-title { font-size: 15px; font-weight: 600; color: var(--text); margin: 0; }
    .mp-close { background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; padding: 4px; } .mp-close:hover { color: var(--text); }
    .mp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .mp-card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; display: flex; gap: 12px; align-items: flex-start; transition: box-shadow .15s; } .mp-card:hover { box-shadow: var(--shadow); }
    .mp-score { width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--accent); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; color: var(--accent); }
    .mp-score.excellent { border-color: #16a34a; color: #16a34a; }
    .mp-score.bon { border-color: var(--accent); color: var(--accent); }
    .mp-score.moyen { border-color: #888; color: #888; }
    .mp-info { flex: 1; min-width: 0; }
    .mp-name { font-size: 13.5px; font-weight: 600; color: var(--text); margin: 0 0 2px; }
    .mp-sub { font-size: 12px; color: var(--muted); margin: 0 0 6px; }
    .mp-skills { display: flex; flex-wrap: wrap; gap: 4px; }
    .mp-skill { font-size: 11px; padding: 2px 7px; border-radius: 4px; background: var(--surface); color: var(--muted); border: 1px solid var(--border); }
    .mp-cv { color: var(--accent); font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap; }
    .mp-empty { color: var(--muted); text-align: center; padding: 20px; grid-column: 1/-1; font-size: 13px; }

    /* MODAL */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: var(--surface); border-radius: 16px; width: 480px; max-width: 95vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 24px 18px; border-bottom: 1px solid var(--border); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 3px; }
    .modal-sub { font-size: 12px; color: var(--muted); margin: 0; }
    .modal-close { background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; padding: 2px; } .modal-close:hover { color: var(--text); }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group label { font-size: 12px; font-weight: 600; color: var(--muted); }
    .modal-input { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-size: 13px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; transition: border-color .15s; } .modal-input:focus { border-color: var(--accent); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border); }
    .mf-cancel { background: var(--surface); border: 1px solid var(--border); color: var(--muted); border-radius: var(--radius); padding: 9px 18px; font-size: 13px; cursor: pointer; transition: all .15s; } .mf-cancel:hover { border-color: #aaa; color: var(--text); }
    .mf-submit { background: var(--text); color: #fff; border: none; border-radius: var(--radius); padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity .15s; } .mf-submit:hover { opacity: .85; } .mf-submit:disabled { opacity: .4; cursor: not-allowed; }

    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(3,1fr); } .candidates-grid, .matching-panel { padding-left: 16px; padding-right: 16px; } .toolbar-row { padding: 0 16px; } }
    @media (max-width: 640px) { .apps-page { padding-bottom: 40px; } .stats-grid { grid-template-columns: 1fr 1fr; margin: 0 16px 20px; } .filter-tabs { display: none; } }
  `]
})
export class OfferApplicationsComponent implements OnInit {
  private appSvc = inject(ApplicationService);
  private route  = inject(ActivatedRoute);
  private http   = inject(HttpClient);
  private cdr    = inject(ChangeDetectorRef);

  applications: JobApplication[] = [];
  page: PageResponse<JobApplication> | null = null;
  loading = false;
  jobId: number | null = null;
  activeTab = '';
  filter: ApplicationFilterRequest = { page: 0, size: 100 };

  summaryCards = [
    { label: 'Total',      count: 0 },
    { label: 'New',        count: 0 },
    { label: 'Interviews', count: 0 },
    { label: 'Accepted',   count: 0 },
    { label: 'Rejected',   count: 0 },
  ];

  // Feature 1 — Interview
  interviewApp: any = null;
  interviewForm = { date: '', link: '', notes: '' };

  // Feature 3 — Matching
  showMatching      = false;
  loadingMatching   = false;
  matchingCandidates: any[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.jobId = +id; this.filter.jobId = +id; }
    this.load();
  }

  load(): void {
    this.loading = true;
    let params = new HttpParams()
      .set('page', String(this.filter.page ?? 0))
      .set('size', String(this.filter.size ?? 100));
    if (this.filter.keyword) params = params.set('keyword', this.filter.keyword);
    if (this.activeTab)      params = params.set('status', this.activeTab);

    const url = this.jobId
      ? `${API_ENDPOINTS['adminApplications']}/job/${this.jobId}`
      : `${API_ENDPOINTS['adminApplications']}/search`;

    this.http.get<any>(url, { params }).subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res;
        this.applications = raw?.content ?? [];
        this.loading = false;
        this.buildSummary(this.applications);
        this.cdr.detectChanges();
      },
      error: () => { this.applications = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  buildSummary(apps: JobApplication[]): void {
    this.summaryCards[0].count = apps.length;
    this.summaryCards[1].count = apps.filter(a => a.status === 'NEW').length;
    this.summaryCards[2].count = apps.filter(a => a.status === 'INTERVIEW').length;
    this.summaryCards[3].count = apps.filter(a => a.status === 'APPROVED').length;
    this.summaryCards[4].count = apps.filter(a => a.status === 'REJECTED').length;
  }

  setTab(tab: string): void { this.activeTab = tab; this.filter.page = 0; this.load(); }

  get displayedApplications(): JobApplication[] {
    if (!this.activeTab) return this.applications;
    return this.applications.filter(a => a.status === this.activeTab);
  }

  updateStatus(app: JobApplication, status: ApplicationStatus): void {
    this.http.patch<any>(`${API_ENDPOINTS['adminApplications']}/${app.id}/status`, { status })
      .subscribe({
        next: (res: any) => {
          const updated = res?.data ?? res;
          const idx = this.applications.findIndex(a => a.id === app.id);
          if (idx !== -1) this.applications[idx] = { ...this.applications[idx], ...updated };
          this.buildSummary(this.applications);
          this.cdr.detectChanges();
        }
      });
  }

  // ── Feature 1 : Interview ─────────────────────────────────────────────
  openInterviewModal(app: any): void {
    this.interviewApp = app;
    this.interviewForm = {
      date:  app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0, 16) : '',
      link:  app.interviewLink  ?? '',
      notes: app.interviewNotes ?? '',
    };
  }

  closeInterviewModal(): void { this.interviewApp = null; }

  scheduleInterview(): void {
    if (!this.interviewApp || !this.interviewForm.date) return;
    const payload = {
      status:        'INTERVIEW',
      interviewDate: this.interviewForm.date,
      interviewLink: this.interviewForm.link  || null,
      interviewNotes: this.interviewForm.notes || null,
    };
    this.http.patch<any>(`${API_ENDPOINTS['adminApplications']}/${this.interviewApp.id}/status`, payload)
      .subscribe({
        next: (res: any) => {
          const updated = res?.data ?? res;
          const idx = this.applications.findIndex((a: any) => a.id === this.interviewApp.id);
          if (idx !== -1) this.applications[idx] = { ...this.applications[idx], ...updated };
          this.closeInterviewModal();
          this.buildSummary(this.applications);
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('Interview error:', err)
      });
  }

  // ── Feature 3 : Matching bidirectionnel ──────────────────────────────
  toggleMatching(): void {
    this.showMatching = !this.showMatching;
    if (this.showMatching && this.matchingCandidates.length === 0) {
      this.loadMatchingCandidates();
    }
  }

  loadMatchingCandidates(): void {
    // Si pas de jobId, prendre le premier jobId des candidatures chargées
    const targetJobId = this.jobId
      ?? (this.applications.length > 0 ? (this.applications[0] as any).jobOfferId : null);

    if (!targetJobId) {
      this.matchingCandidates = [];
      this.loadingMatching = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingMatching = true;
    this.http.get<any>(`${API_ENDPOINTS['employerJobs']}/${targetJobId}/matching-candidates?limit=12`)
      .subscribe({
        next: (res: any) => {
          this.matchingCandidates = res?.data ?? [];
          this.loadingMatching = false;
          this.cdr.detectChanges();
        },
        error: () => { this.matchingCandidates = []; this.loadingMatching = false; this.cdr.detectChanges(); }
      });
  }

  scoreClass(score: number): string {
    if (score >= 75) return 'excellent';
    if (score >= 50) return 'bon';
    return 'moyen';
  }

  downloadResume(app: JobApplication): void {
    if (!app.resumeUrl) return;
    const url = app.resumeUrl.startsWith('http') ? app.resumeUrl : `${API_BASE_URL}/${app.resumeUrl}`;
    window.open(url, '_blank', 'noopener');
  }

  statusLabel(s: ApplicationStatus): string {
    const labels: Record<string, string> = {
      NEW: 'New', PENDING: 'Pending', REVIEWED: 'Reviewed',
      INTERVIEW: 'Interview', APPROVED: 'Accepted', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn'
    };
    return labels[s] || s;
  }

  changePage(p: number): void {
    if (!this.page || p < 0 || p >= this.page.totalPages) return;
    this.filter.page = p;
    this.load();
  }
}
