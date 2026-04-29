import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../../../core/api/api.config';

@Component({
  selector: 'app-job-recommendations',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
<div class="rec-page">

  <!-- Header -->
  <div class="page-hero"><div class="page-hero-inner"><div><div class="header-badge"><span class="pulse-dot"></span>RECOMMENDATIONS</div><h2 class="page-title">Recommended Offers</h2><p class="page-sub">Based on your profile and skills</p></div><div class="header-actions">
      <button class="btn-notif" (click)="showNotifs = !showNotifs">
        🔔
        <span class="badge" *ngIf="notifications.length > 0">{{ notifications.length }}</span>
      </button>
      <button class="btn-alert" (click)="showAlertForm = !showAlertForm">
        ＋ Create an alert
      </button>
    </div></div></div><!-- Notifications dropdown -->
  <div class="notif-panel" *ngIf="showNotifs && notifications.length > 0">
    <h4 class="notif-title">🔔 New matching offers</h4>
    <div class="notif-item" *ngFor="let n of notifications">
      <div class="notif-info">
        <span class="notif-job">{{ n.title }}</span>
        <span class="notif-company">{{ n.company }}</span>
      </div>
      <a [routerLink]="['/jobs/detail', n.jobId]" class="notif-link">View →</a>
    </div>
  </div>

  <!-- Alert Form -->
  <div class="alert-form" *ngIf="showAlertForm">
    <h4>New job alert</h4>
    <div class="form-row">
      <input [(ngModel)]="newAlert.keyword" placeholder="Keyword (e.g. Angular, React...)" class="inp" />
      <select [(ngModel)]="newAlert.contractType" class="sel">
        <option value="">All types</option>
        <option value="FULL_TIME">Full Time</option>
        <option value="PART_TIME">Part Time</option>
        <option value="FREELANCE">Freelance</option>
        <option value="INTERNSHIP">Internship</option>
        <option value="REMOTE">Remote</option>
      </select>
      <input [(ngModel)]="newAlert.location" placeholder="Country / City" class="inp" />
      <button class="btn-save" (click)="createAlert()">Create</button>
      <button class="btn-cancel" (click)="showAlertForm = false">Cancel</button>
    </div>
  </div>

  <!-- My alerts -->
  <div class="alerts-section" *ngIf="alerts.length > 0">
    <h4 class="section-title">📋 My active alerts</h4>
    <div class="alerts-list">
      <div class="alert-chip" *ngFor="let a of alerts" [class.inactive]="!a.active">
        <span class="chip-keyword">{{ a.keyword || 'All offers' }}</span>
        <span class="chip-meta" *ngIf="a.contractType">· {{ a.contractType }}</span>
        <span class="chip-meta" *ngIf="a.location">· {{ a.location }}</span>
        <button class="chip-toggle" (click)="toggleAlert(a)" [title]="a.active ? 'Disable' : 'Enable'">
          {{ a.active ? '🟢' : '⚪' }}
        </button>
        <button class="chip-del" (click)="deleteAlert(a.id)">✕</button>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div>
    <p>Analyzing your profile...</p>
  </div>

  <!-- ── FILTERS ── -->
  <div class="filters-bar" *ngIf="!loading">
    <div class="filter-group">
      <label class="filter-label">Contract</label>
      <select [(ngModel)]="filters.contractType" (change)="onFilterChange()" class="filter-sel">
        <option value="">All</option>
        <option value="FULL_TIME">Full Time</option>
        <option value="PART_TIME">Part Time</option>
        <option value="FREELANCE">Freelance</option>
        <option value="INTERNSHIP">Internship</option>
        <option value="REMOTE">Remote</option>
        <option value="CONTRACT">Contract</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label">Country / City</label>
      <input [(ngModel)]="filters.country" (keyup.enter)="onFilterChange()"
             placeholder="e.g. Tunisia, Paris..." class="filter-inp" />
    </div>

    <div class="filter-group">
      <label class="filter-label">Min score: <strong>{{ filters.minScore }}%</strong></label>
      <input type="range" [(ngModel)]="filters.minScore" (change)="onFilterChange()"
             min="0" max="90" step="10" class="filter-range" />
    </div>

    <div class="filter-group filter-check">
      <label class="check-label">
        <input type="checkbox" [(ngModel)]="filters.remoteOnly" (change)="onFilterChange()" />
        <span>Remote only 🌐</span>
      </label>
    </div>

    <div class="filter-group">
      <label class="filter-label">Sort by</label>
      <select [(ngModel)]="filters.sortBy" (change)="applySort()" class="filter-sel">
        <option value="score">Best match</option>
        <option value="recent">Most recent</option>
        <option value="urgent">Urgent first</option>
      </select>
    </div>

    <button class="btn-reset-filters" (click)="resetFilters()">↺ Reset</button>

    <div class="results-count">
      <strong>{{ filteredRecs.length }}</strong> offer(s) found
    </div>
  </div>

  <!-- Recommendations Grid -->
  <div class="jobs-grid" *ngIf="!loading">
    <div class="job-card" *ngFor="let job of filteredRecs"
         [class.top-match]="job.matchScore >= 75">
      
      <!-- Score badge -->
      <div class="score-badge" [class]="scoreClass(job.matchScore)">
        <span class="score-val">{{ job.matchScore }}%</span>
        <span class="score-lbl">match</span>
      </div>

      <div class="job-info">
        <h4 class="job-title">{{ job.title }}</h4>
        <p class="job-company">{{ job.company }}</p>
        <div class="job-meta">
          <span *ngIf="job.location">📍 {{ job.location }}</span>
          <span *ngIf="job.isRemote" class="remote-badge">🌐 Remote</span>
          <span *ngIf="job.isUrgent" class="urgent-badge">🔥 Urgent</span>
        </div>

        <!-- Score bar -->
        <div class="score-bar-wrap">
          <div class="score-bar">
            <div class="score-fill" [style.width.%]="job.matchScore"
                 [class]="scoreClass(job.matchScore)"></div>
          </div>
        </div>

        <!-- Tags -->
        <div class="tags-row" *ngIf="job.tags && job.tags.length">
          <span class="tag" *ngFor="let tag of job.tags.slice(0,4)">{{ tag }}</span>
        </div>
      </div>

      <div class="job-actions">
        <a [routerLink]="['/jobs/detail', job.jobId]" class="btn-view">View offer →</a>
      </div>
    </div>

    <div class="empty" *ngIf="filteredRecs.length === 0">
      <div class="empty-icon">🔍</div>
      <p *ngIf="recommendations.length === 0">Complete your profile with skills to get recommendations.</p>
      <p *ngIf="recommendations.length > 0">No offers match your filters.</p>
      <a routerLink="/jobs/candidate/profile" class="btn-go" *ngIf="recommendations.length === 0">Complete my profile →</a>
      <button class="btn-go" (click)="resetFilters()" *ngIf="recommendations.length > 0">Clear filters</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .page-hero { background: #1a1a2e; padding: 28px 28px 24px; margin: -28px -28px 24px; border-bottom: 3px solid #f59e0b; }
    .page-hero .page-title { color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 4px; }
    .page-hero .page-sub { color: rgba(255,255,255,0.6); font-size: 13.5px; margin: 0; }
    .page-hero .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; }
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
    .rec-page { min-height: 100vh; background: #f0ece4; color: #1a1a2e; font-family: 'Segoe UI', system-ui, sans-serif; padding: 28px; padding-bottom: 60px; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .page-title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin: 0 0 4px; }
    .page-sub { font-size: 14px; color: #9ca3af; margin: 0; }
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .btn-notif { position: relative; background: #ffffff; border: 1px solid #e8e0d0; color: #1a1a2e; border-radius: 10px; padding: 10px 14px; font-size: 18px; cursor: pointer; }
    .badge { position: absolute; top: -6px; right: -6px; background: #f06548; color: #fff; font-size: 10px; font-weight: 700; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
    .btn-alert { background: #f59e0b; color: #1a1a2e; border: none; border-radius: 12px; padding: 10px 20px; font-size: 13.5px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(245,158,11,0.35); transition: all .2s; } .btn-alert:hover { background: #d97706; color: #fff; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(245,158,11,0.45); }

    .notif-panel { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .notif-title { font-size: 14px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
    .notif-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e8e0d0; }
    .notif-item:last-child { border-bottom: none; }
    .notif-info { display: flex; flex-direction: column; gap: 2px; }
    .notif-job { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .notif-company { font-size: 12px; color: #9ca3af; }
    .notif-link { color: #f59e0b; font-size: 12.5px; font-weight: 600; text-decoration: none; }

    .alert-form { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .alert-form h4 { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 14px; }
    .form-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .inp { flex: 1; min-width: 150px; background: #ffffff; border: 1px solid #e8e0d0; border-radius: 12px; padding: 9px 14px; color: #1a1a2e; font-size: 13px; outline: none; }
    .inp::placeholder { color: #d1d5db; }
    .sel { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 12px; padding: 9px 14px; color: #1a1a2e; font-size: 13px; outline: none; cursor: pointer; }
    .btn-save { background: #1a1a2e; color: #fff; border: none; border-radius: 12px; padding: 9px 20px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-cancel { background: #ffffff; color: #6b7280; border: 1px solid #e8e0d0; border-radius: 12px; padding: 9px 16px; font-size: 13px; cursor: pointer; }

    .alerts-section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 800; color: #f59e0b; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; }
    .alerts-list { display: flex; gap: 10px; flex-wrap: wrap; }
    .alert-chip { display: flex; align-items: center; gap: 6px; background: #ffffff; border: 1px solid #e8e0d0; border-radius: 20px; padding: 6px 14px; font-size: 13px; }
    .alert-chip.inactive { opacity: 0.5; border-color: #e8e0d0; }
    .chip-keyword { color: #f59e0b; font-weight: 600; }
    .chip-meta { color: #9ca3af; }
    .chip-toggle { background: none; border: none; cursor: pointer; font-size: 14px; padding: 0; }
    .chip-del { background: none; border: none; color: #f06548; cursor: pointer; font-size: 12px; padding: 0 0 0 4px; }

    .loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 14px; color: #9ca3af; }
    .loader { width: 36px; height: 36px; border: 3px solid #e8e0d0; border-top-color: #f59e0b; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── FILTRES ── */
    .filters-bar { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .filter-group { display: flex; flex-direction: column; gap: 6px; }
    .filter-label { font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px; }
    .filter-sel, .filter-inp { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 12px; padding: 8px 12px; color: #1a1a2e;
      font-size: 13px; outline: none; min-width: 140px;
    }
    .filter-sel:focus, .filter-inp:focus { border-color: #f59e0b; }
    .filter-inp::placeholder { color: #d1d5db; }
    .filter-range { width: 140px; accent-color: #f59e0b; cursor: pointer;
      background: transparent; height: 4px;
    }
    .filter-check { justify-content: flex-end; padding-bottom: 4px; }
    .check-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6b7280; cursor: pointer; }
    .check-label input { accent-color: #f59e0b; width: 15px; height: 15px; cursor: pointer; }
    .btn-reset-filters { background: #ffffff; border: 1px solid #e8e0d0; color: #6b7280; border-radius: 12px; padding: 8px 14px; font-size: 12.5px; cursor: pointer; align-self: flex-end; } .btn-reset-filters:hover { border-color: #f59e0b; color: #f59e0b; }
    .results-count {
      align-self: flex-end; font-size: 13px; color: #9ca3af;
      padding-bottom: 6px; margin-left: auto;
    }
    .results-count strong { color: #1a1a2e; }

    .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .job-card { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .job-card.top-match { border-color: rgba(245,158,11,0.5); }
    .job-card.top-match::before { content: '⭐ Top Match'; position: absolute; top: 12px; right: -20px; background: #fef3c7; color: #f59e0b; font-size: 10px; font-weight: 700; padding: 3px 30px; transform: rotate(35deg); }

    .score-badge { display: flex; flex-direction: column; align-items: center; width: 56px; height: 56px; border-radius: 50%; border: 3px solid; justify-content: center; flex-shrink: 0; align-self: flex-start; }
    .score-badge.excellent { border-color: #f59e0b; }
    .score-badge.bon       { border-color: #6b7280; }
    .score-badge.moyen     { border-color: #d4a017; }
    .score-badge.faible    { border-color: #f06548; }
    .score-val { font-size: 14px; font-weight: 800; line-height: 1; }
    .score-lbl { font-size: 9px; color: #9ca3af; }

    .job-info { flex: 1; }
    .job-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
    .job-company { font-size: 13px; color: #9ca3af; margin: 0 0 8px; }
    .job-meta { display: flex; gap: 10px; font-size: 12px; color: #9ca3af; flex-wrap: wrap; margin-bottom: 10px; }
    .remote-badge { color: #f59e0b; font-weight: 600; }
    .urgent-badge { color: #f06548; font-weight: 600; }

    .score-bar-wrap { margin-bottom: 10px; }
    .score-bar { height: 4px; background: #e8e0d0; border-radius: 2px; overflow: hidden; }
    .score-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
    .score-fill.excellent { background: #f59e0b; }
    .score-fill.bon       { background: #6b7280; }
    .score-fill.moyen     { background: #d4a017; }
    .score-fill.faible    { background: #f06548; }

    .tags-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag { background: #fef3c7; color: #1a1a2e; border: 1px solid rgba(245,158,11,0.3); border-radius: 20px; padding: 2px 8px; font-size: 11px; }

    .job-actions { display: flex; justify-content: flex-end; }
    .btn-view { background: #1a1a2e; color: #ffffff; border: none; border-radius: 12px; padding: 7px 16px; font-size: 13px; font-weight: 600; text-decoration: none; } .btn-view:hover { background: #2d2d4e; }

    .empty { text-align: center; padding: 60px; color: #9ca3af; grid-column: 1/-1; }
    .empty-icon { font-size: 40px; margin-bottom: 12px; }
    .btn-go { color: #f59e0b; text-decoration: none; font-weight: 600; }
  `]
})
export class JobRecommendationsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  recommendations: any[]    = [];
  filteredRecs: any[]       = [];
  alerts: any[]             = [];
  notifications: any[]      = [];
  loading        = true;
  showAlertForm  = false;
  showNotifs     = false;
  newAlert       = { keyword: '', contractType: '', location: '' };

  // ── Filtres ───────────────────────────────────────────────
  filters = {
    contractType: '',
    country:      '',
    minScore:     0,
    remoteOnly:   false,
    sortBy:       'score'   // 'score' | 'recent' | 'urgent'
  };

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    this.loadRecommendations();
    this.http.get<any>(API_ENDPOINTS['candidateAlerts']).subscribe({
      next: (res: any) => { this.alerts = Array.isArray(res?.data) ? res.data : []; this.cdr.detectChanges(); },
      error: () => { this.alerts = []; }
    });
    this.notifications = [];
  }

  loadRecommendations(): void {
    this.loading = true;
    const f = this.filters;
    let url = `${API_ENDPOINTS['candidateMatching']}?limit=50`;
    if (f.contractType) url += `&contractType=${f.contractType}`;
    if (f.country)      url += `&country=${encodeURIComponent(f.country)}`;
    if (f.minScore > 0) url += `&minScore=${f.minScore}`;
    if (f.remoteOnly)   url += `&remoteOnly=true`;

    this.http.get<any>(url).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        this.recommendations = data;
        this.applySort();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.recommendations = [];
        this.filteredRecs = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applySort(): void {
    let sorted = [...this.recommendations];
    if (this.filters.sortBy === 'score') {
      sorted.sort((a, b) => b.matchScore - a.matchScore);
    } else if (this.filters.sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.postDate || 0).getTime() - new Date(a.postDate || 0).getTime());
    } else if (this.filters.sortBy === 'urgent') {
      sorted.sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0));
    }
    this.filteredRecs = sorted;
  }

  onFilterChange(): void {
    this.loadRecommendations();
  }

  resetFilters(): void {
    this.filters = { contractType: '', country: '', minScore: 0, remoteOnly: false, sortBy: 'score' };
    this.loadRecommendations();
  }

  createAlert(): void {
    if (!this.newAlert.keyword && !this.newAlert.location) return;
    this.http.post<any>(API_ENDPOINTS['candidateAlerts'], this.newAlert).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        if (data) this.alerts = [...this.alerts, data];
        this.newAlert = { keyword: '', contractType: '', location: '' };
        this.showAlertForm = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => { console.warn('[Alerts] create error:', err?.status); this.showAlertForm = false; }
    });
  }

  deleteAlert(id: number): void {
    this.http.delete(`${API_ENDPOINTS['candidateAlerts']}/${id}`).subscribe({
      next: () => { this.alerts = this.alerts.filter((a: any) => a.id !== id); this.cdr.detectChanges(); },
      error: (err: any) => console.warn('[Alerts] delete error:', err?.status)
    });
  }

  toggleAlert(alert: any): void {
    this.http.patch(`${API_ENDPOINTS['candidateAlerts']}/${alert.id}/toggle`, {}).subscribe({
      next: () => { alert.active = !alert.active; this.cdr.detectChanges(); },
      error: (err: any) => console.warn('[Alerts] toggle error:', err?.status)
    });
  }

  scoreClass(score: number): string {
    if (score >= 75) return 'excellent';
    if (score >= 50) return 'bon';
    if (score >= 25) return 'moyen';
    return 'faible';
  }
}