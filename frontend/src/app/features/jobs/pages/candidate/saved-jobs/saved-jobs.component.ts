import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../../core/api/api.config';
import { Job, PageResponse } from '../../../models/job.models';
import { JobService } from '../../../services/job.service';

@Component({
  selector: 'app-saved-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">

  <!-- DARK HERO BANNER -->
  <div class="page-hero">
    <div class="page-hero-inner">
      <div>
        <div class="header-badge"><span class="pulse-dot"></span>SAVED OFFERS</div>
        <h2 class="page-title">My favorite offers</h2>
        <p class="page-sub">{{ page?.totalElements || 0 }} saved offer(s)</p>
      </div>
      <a routerLink="/jobs" class="btn-search">🔍 Search offers</a>
    </div>
  </div>

  <!-- LOADING -->
  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div><p>Loading...</p>
  </div>

  <!-- GRID -->
  <div class="jobs-grid" *ngIf="!loading">

    <div class="job-card" *ngFor="let job of jobs">
      <div class="jc-inner">

        <!-- Logo -->
        <div class="jc-logo">
          <img *ngIf="job.company.logo" [src]="resolveUrl(job.company.logo)" />
          <div class="logo-ph" *ngIf="!job.company.logo">{{ (job.company.name || '?')[0] }}</div>
        </div>

        <!-- Body -->
        <div class="jc-body">
          <div class="jc-top">
            <div>
              <div class="jc-badges">
                <span class="badge-featured" *ngIf="job.isFeatured">FEATURED</span>
                <span class="badge-urgent"   *ngIf="job.isUrgent">URGENT</span>
              </div>
              <h3 class="jc-title" (click)="openDetail(job)">{{ job.title }}</h3>
              <p class="jc-company">{{ job.company.name }} · {{ job.country || 'Remote' }}</p>
            </div>
            <button class="btn-unsave" (click)="unsave(job)" title="Retirer des favoris">♥</button>
          </div>

          <p class="jc-desc">{{ job.description | slice:0:120 }}...</p>

          <div class="jc-pills">
            <span class="type-pill" [class]="'pill-' + (job.contractType || '').toLowerCase()">
              {{ getLabel(job.contractType) }}
            </span>
            <span class="salary-pill" *ngIf="job.startSalary">
              {{ job.startSalary }}k – {{ job.lastSalary }}k$
            </span>
            <span class="loc-pill" *ngIf="job.state">{{ job.state }}</span>
          </div>

          <div class="jc-meta">
            <span>👥 {{ job.applicationCount || 0 }} applicants</span>
            <span *ngIf="job.postDate">📅 {{ job.postDate | date:'d MMM y' }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="jc-actions">
          <button class="btn-apply" (click)="openDetail(job)">View offer</button>
        </div>
      </div>
    </div>

    <!-- EMPTY -->
    <div class="empty" *ngIf="jobs.length === 0">
      <div class="empty-icon">🔖</div>
      <p>You haven't saved any offers yet.</p>
      <a routerLink="/jobs" class="btn-go">Browse offers →</a>
    </div>
  </div>

  <!-- PAGINATION -->
  <div class="pagination" *ngIf="page && page.totalPages > 1">
    <button (click)="changePage(currentPage - 1)" [disabled]="page.first">‹</button>
    <button *ngFor="let p of pageNumbers()" (click)="changePage(p)" [class.active]="p === currentPage">{{ p + 1 }}</button>
    <button (click)="changePage(currentPage + 1)" [disabled]="page.last">›</button>
  </div>

</div>
  `,
  styles: [`
    :host { display: block; }
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
    .page { min-height: 100vh; background: var(--bg); color: #1a1a2e; font-family: 'Segoe UI', system-ui, sans-serif; padding: 28px 28px 60px; }
    .page-hero { background: #1a1a2e; padding: 28px 28px 24px; margin: -28px -28px 24px; border-bottom: 3px solid #f59e0b; }
    .page-hero .page-title { color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 4px; }
    .page-hero .page-sub { color: rgba(255,255,255,0.6); font-size: 13.5px; margin: 0; }
    .page-hero .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; }
    .page-hero .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; display: inline-block; margin-right: 4px; }
    .page-hero-inner { display: flex; justify-content: space-between; align-items: flex-end; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
    .page-title { font-size: 26px; font-weight: 800; color: #ffffff; margin: 0 0 4px; }
    .page-sub { font-size: 13.5px; color: rgba(255,255,255,0.6); margin: 0; }
    .btn-search { background: #f59e0b; color: #1a1a2e; text-decoration: none; border-radius: 12px; padding: 10px 20px; font-size: 13.5px; font-weight: 700; white-space: nowrap; } .btn-search:hover { background: #fbbf24; }

    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 80px; color: #9ca3af; }
    .loader { width: 36px; height: 36px; border: 3px solid #e8e0d0; border-top-color: #f59e0b; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .jobs-grid { display: flex; flex-direction: column; gap: 12px; }

    .job-card { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; overflow: hidden; transition: border-color .2s, transform .15s; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .job-card:hover { border-color: rgba(245,158,11,0.5); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

    .jc-inner { display: flex; gap: 14px; padding: 18px; align-items: flex-start; }
    .jc-logo { width: 46px; height: 46px; border-radius: 10px; border: 1px solid #e8e0d0; overflow: hidden; flex-shrink: 0; }
    .jc-logo img { width: 100%; height: 100%; object-fit: cover; }
    .logo-ph { width: 100%; height: 100%; background: linear-gradient(135deg, #f59e0b, #f97316); color: #ffffff; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; }

    .jc-body { flex: 1; min-width: 0; }
    .jc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .jc-badges { display: flex; gap: 6px; margin-bottom: 4px; }
    .badge-featured { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #fef3c7; color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .badge-urgent   { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(240,101,72,0.15); color: #f06548; border: 1px solid rgba(240,101,72,0.3); }
    .jc-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 2px; cursor: pointer; } .jc-title:hover { color: #f59e0b; }
    .jc-company { font-size: 12.5px; color: #6b7280; margin: 0; }
    .btn-unsave { background: none; border: none; cursor: pointer; font-size: 22px; color: #f59e0b; padding: 4px; transition: transform .15s; }
    .btn-unsave:hover { transform: scale(1.2); }

    .jc-desc { font-size: 13px; color: #6b7280; line-height: 1.5; margin: 8px 0; }
    .jc-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .type-pill { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 6px; border: 1px solid; }
    .pill-full_time  { background: #fef3c7;  color: #f59e0b; border-color: #f59e0b; }
    .pill-part_time  { background: rgba(212,160,23,0.1);  color: #d4a017; border-color: rgba(212,160,23,0.25); }
    .pill-freelance  { background: rgba(22,163,74,0.1);   color: #16a34a; border-color: rgba(5,150,105,0.25); }
    .pill-internship { background: rgba(132,94,247,0.1);  color: #845ef7; border-color: rgba(132,94,247,0.25); }
    .pill-remote     { background: rgba(23,162,184,0.1);  color: #17a2b8; border-color: rgba(23,162,184,0.25); }
    .pill-contract   { background: rgba(240,101,72,0.1);  color: #f06548; border-color: rgba(240,101,72,0.25); }
    .salary-pill { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 6px; background: #fef3c7; color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .loc-pill { font-size: 12px; padding: 3px 10px; border-radius: 6px; background: #ffffff; color: #6b7280; border: 1px solid #e8e0d0; }
    .jc-meta { display: flex; gap: 14px; font-size: 12px; color: #9ca3af; }

    .jc-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .btn-apply { background: #1a1a2e; color: #ffffff; border: none; border-radius: 12px; padding: 9px 18px; font-size: 13px; cursor: pointer; white-space: nowrap; font-weight: 600; } .btn-apply:hover { background: #2d2d4e; }

    .empty { text-align: center; padding: 60px; color: #9ca3af; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .btn-go { color: #f59e0b; text-decoration: none; font-weight: 600; }

    .pagination { display: flex; justify-content: center; gap: 6px; margin-top: 20px; flex-wrap: wrap; }
    .pagination button { background: #ffffff; border: 1px solid #e8e0d0; color: #6b7280; border-radius: 8px; padding: 7px 13px; font-size: 13px; cursor: pointer; } .pagination button:hover { border-color: #f59e0b; color: #f59e0b; } .pagination button.active { background: #f59e0b; color: #fff; border-color: #f59e0b; }
    .pagination button:disabled { opacity: .3; cursor: not-allowed; }
  `]
})
export class SavedJobsComponent implements OnInit {
  private http    = inject(HttpClient);
  private router  = inject(Router);
  private jobSvc  = inject(JobService);
  private cdr     = inject(ChangeDetectorRef);

  jobs: Job[]                    = [];
  page: PageResponse<Job> | null = null;
  loading     = true;
  currentPage = 0;

  private readonly JOB_TYPE_LABELS: Record<string, string> = {
    FULL_TIME: 'Full Time', PART_TIME: 'Part Time', FREELANCE: 'Freelance',
    INTERNSHIP: 'Internship', CONTRACT: 'Contract', REMOTE: 'Remote',
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const params = new HttpParams()
      .set('page', String(this.currentPage))
      .set('size', '10');

    this.http.get<any>(API_ENDPOINTS['candidateSavedJobs'], { params }).subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res;
        const content: Job[] = (raw?.content ?? []).map((j: any) => this.jobSvc.normalizeJob(j));
        this.jobs = content;
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
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.jobs    = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  unsave(job: Job): void {
    this.http.delete(`${API_ENDPOINTS['candidateSavedJobs']}/${job.id}`).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j.id !== job.id);
        if (this.page) this.page.totalElements = Math.max(0, this.page.totalElements - 1);
        this.cdr.detectChanges();
      }
    });
  }

  openDetail(job: Job): void { this.router.navigate(['/jobs/detail', job.id]); }

  getLabel(type?: string): string {
    return type ? (this.JOB_TYPE_LABELS[type] || type) : '—';
  }

  resolveUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  changePage(p: number): void {
    if (!this.page || p < 0 || p >= this.page.totalPages) return;
    this.currentPage = p;
    this.load();
  }

  pageNumbers(): number[] {
    if (!this.page) return [];
    return Array.from({ length: Math.min(this.page.totalPages, 7) }, (_, i) => i);
  }
}
