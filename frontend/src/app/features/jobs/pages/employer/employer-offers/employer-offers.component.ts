// employer-offers.component.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { JobService } from '../../../services/job.service';
import { Job, JOB_TYPE_LABELS } from '../../../models/job.models';
import { API_ENDPOINTS } from '../../../../../core/api/api.config';

@Component({
  selector: 'app-employer-offers',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
<div class="employer-page">

  <!-- HERO -->
  <div class="page-hero">
    <div class="hero-bg-shapes">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    <div class="page-hero-inner">
      <div>
        <div class="header-badge">
          <span class="pulse-dot"></span>
          MY OFFERS
        </div>
        <h2 class="page-title">My Job Offers</h2>
        <p class="page-sub">Manage and track all your published offers</p>
      </div>
      <a class="btn-new" routerLink="/jobs/employer/jobs/new">
        <span class="btn-plus">+</span> New Offer
      </a>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-grid">
    <div class="stat-card sc-dark">
      <div class="sc-icon">&#128196;</div>
      <div class="sc-body">
        <p class="sc-label">Total</p>
        <p class="sc-val">{{ jobs.length }}</p>
        <p class="sc-sub">offers created</p>
      </div>
      <div class="sc-bar"></div>
    </div>
    <div class="stat-card sc-green">
      <div class="sc-icon">&#9989;</div>
      <div class="sc-body">
        <p class="sc-label">Active</p>
        <p class="sc-val">{{ countByStatus('ACTIVE') }}</p>
        <p class="sc-sub">{{ totalNonExpired ? ((countByStatus('ACTIVE') / totalNonExpired * 100) | number:'1.0-0') : 0 }}% of total</p>
      </div>
      <div class="sc-bar"></div>
    </div>
    <div class="stat-card sc-amber">
      <div class="sc-icon">&#9998;</div>
      <div class="sc-body">
        <p class="sc-label">Drafts</p>
        <p class="sc-val">{{ countByStatus('DRAFT') }}</p>
        <p class="sc-sub">to publish</p>
      </div>
      <div class="sc-bar"></div>
    </div>
    <div class="stat-card sc-blue">
      <div class="sc-icon">&#128101;</div>
      <div class="sc-body">
        <p class="sc-label">Applications</p>
        <p class="sc-val">{{ totalApplicants() }}</p>
        <p class="sc-sub">total received</p>
      </div>
      <div class="sc-bar"></div>
    </div>
  </div>

  <!-- TOOLBAR -->
  <div class="toolbar-row">
    <div class="search-wrap">
      <span class="search-icon">&#128269;</span>
      <input [(ngModel)]="keyword" (ngModelChange)="filterJobs()"
             placeholder="Search a job offer..." class="search-input"/>
    </div>
    <div class="filter-tabs">
      <button class="ftab" [class.active]="statusFilter===''" (click)="statusFilter='';filterJobs()">All</button>
      <button class="ftab ftab-green" [class.active]="statusFilter==='ACTIVE'" (click)="statusFilter='ACTIVE';filterJobs()">Active</button>
      <button class="ftab ftab-amber" [class.active]="statusFilter==='DRAFT'" (click)="statusFilter='DRAFT';filterJobs()">Drafts</button>
      <button class="ftab ftab-red" [class.active]="statusFilter==='CLOSED'" (click)="statusFilter='CLOSED';filterJobs()">Closed</button>
      <button class="ftab ftab-gray" [class.active]="statusFilter==='EXPIRED'" (click)="statusFilter='EXPIRED';filterJobs()">Expired</button>
    </div>
    <span class="results-pill">{{ filtered.length }} offer{{ filtered.length !== 1 ? 's' : '' }}</span>
  </div>

  <!-- LOADING -->
  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div>
    <p class="loading-text">Loading offers...</p>
  </div>

  <!-- CARDS GRID -->
  <div class="offers-grid" *ngIf="!loading && filtered.length > 0">
    <div class="offer-card" *ngFor="let job of filtered; let i = index"
         [class]="'oc-' + (job.expired ? 'expired' : (job.status || 'draft').toLowerCase())"
         [style.animation-delay]="i * 0.04 + 's'">

      <div class="oc-top-bar"></div>

      <div class="oc-body">
        <div class="oc-header">
          <div class="oc-logo">
            <img *ngIf="job.company?.logo" [src]="job.company.logo" alt="logo"/>
            <div class="oc-logo-ph" *ngIf="!job.company?.logo">{{ job.title.charAt(0) }}</div>
          </div>
          <div class="oc-title-wrap">
            <h4 class="oc-title">{{ job.title }}</h4>
            <p class="oc-company">{{ job.company?.name || '—' }}</p>
          </div>
          <span class="oc-status-badge">
            <span class="sb-dot"></span>
            {{ job.expired ? 'Expired' : statusLabel(job.status) }}
          </span>
        </div>

        <div class="oc-meta">
          <span class="meta-chip chip-contract">{{ getLabel(job.contractType) }}</span>
          <span class="meta-chip chip-loc" *ngIf="job.country">&#128205; {{ job.country }}{{ job.state ? ', ' + job.state : '' }}</span>
          <span class="meta-chip chip-date" *ngIf="job.postDate">&#128197; {{ job.postDate | date:'d MMM y' }}</span>
        </div>

        <div class="oc-cand-row">
          <div class="cand-count-wrap">
            <span class="cand-num">{{ job.applicationCount || 0 }}</span>
            <span class="cand-txt">application{{ (job.applicationCount || 0) !== 1 ? 's' : '' }}</span>
          </div>
          <div class="cand-progress">
            <div class="cand-fill" [style.width.%]="getCandPercent(job)"></div>
          </div>
        </div>

        <div class="oc-actions">
          <a class="oa-btn oa-cand" [routerLink]="['/jobs/employer/jobs', job.id, 'applications']">
            <span>&#128101;</span> Applications
          </a>
          <a class="oa-btn oa-edit" [routerLink]="['/jobs/employer/jobs/edit', job.id]">
            <span>&#9998;</span> Edit
          </a>
          <button class="oa-btn oa-del" (click)="confirmDelete(job)">
            <span>&#128465;</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- EMPTY STATE -->
  <div class="empty-state" *ngIf="!loading && filtered.length === 0">
    <div class="empty-icon">&#128196;</div>
    <p class="empty-title">No offers found</p>
    <p class="empty-sub" *ngIf="keyword || statusFilter">Try adjusting your filters</p>
    <p class="empty-sub" *ngIf="!keyword && !statusFilter">Start by creating your first offer</p>
    <a routerLink="/jobs/employer/jobs/new" class="empty-cta">
      <span>+</span> Create an offer
    </a>
  </div>

  <!-- DELETE MODAL -->
  <div class="modal-overlay" *ngIf="deleteJob" (click)="deleteJob = null">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-header-icon">&#128465;</div>
        <div class="modal-header-text">
          <h5 class="modal-title">Delete offer</h5>
          <p class="modal-sub">This action is irreversible</p>
        </div>
        <button class="modal-close" (click)="deleteJob = null">&#10005;</button>
      </div>
      <div class="modal-body">
        <p class="modal-msg">Are you sure you want to delete <strong>{{ deleteJob.title }}</strong>?</p>
      </div>
      <div class="modal-footer">
        <button class="mf-cancel" (click)="deleteJob = null">Cancel</button>
        <button class="mf-danger" (click)="doDelete()" [disabled]="deleting">
          {{ deleting ? 'Deleting...' : '&#128465; Yes, delete' }}
        </button>
      </div>
    </div>
  </div>

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
      --shadow:     0 2px 12px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04);
    }

    .employer-page { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter','Segoe UI',system-ui,sans-serif; padding: 0 0 80px; }

    /* HERO */
    .page-hero { background: linear-gradient(135deg,#0f0c29,#1a1a2e 60%,#24243e); padding: 36px 32px 32px; margin-bottom: 28px; border-bottom: 3px solid var(--accent); position: relative; overflow: hidden; }
    .hero-bg-shapes { position: absolute; inset: 0; pointer-events: none; }
    .shape { position: absolute; border-radius: 50%; opacity: 0.07; }
    .shape.s1 { width: 300px; height: 300px; background: #f59e0b; top: -80px; right: -60px; }
    .shape.s2 { width: 180px; height: 180px; background: #7c3aed; bottom: -60px; left: 40%; }
    .page-hero-inner { display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; }
    .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.12); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; display: inline-block; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
    .page-title { font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -0.5px; }
    .page-sub { font-size: 14px; color: rgba(255,255,255,0.55); margin: 0; }
    .btn-new { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #1a1a2e; border: none; border-radius: 12px; padding: 12px 24px; font-size: 14px; font-weight: 800; cursor: pointer; text-decoration: none; white-space: nowrap; transition: all .2s; box-shadow: 0 4px 20px rgba(245,158,11,0.4); }
    .btn-new:hover { background: var(--accent-dark); color: #fff; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(245,158,11,0.5); }
    .btn-plus { font-size: 20px; font-weight: 300; line-height: 1; }

    /* STATS */
    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; padding: 0 32px; margin-bottom: 24px; }
    .stat-card { border-radius: 16px; padding: 20px 18px 16px; display: flex; align-items: flex-start; gap: 14px; position: relative; overflow: hidden; transition: transform .2s, box-shadow .2s; cursor: default; }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.14); }
    .sc-dark  { background: linear-gradient(135deg,#1a1a2e,#2d2d4e); }
    .sc-green { background: linear-gradient(135deg,#064e3b,#059669); }
    .sc-amber { background: linear-gradient(135deg,#78350f,#d97706); }
    .sc-blue  { background: linear-gradient(135deg,#1e3a5f,#1d4ed8); }
    .sc-icon { font-size: 26px; flex-shrink: 0; margin-top: 2px; }
    .sc-body { flex: 1; }
    .sc-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.6); letter-spacing: 1.4px; text-transform: uppercase; margin: 0 0 4px; }
    .sc-val { font-size: 32px; font-weight: 800; color: #fff; margin: 0 0 2px; line-height: 1; }
    .sc-sub { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; }
    .sc-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.2); border-radius: 0 0 14px 14px; }

    /* TOOLBAR */
    .toolbar-row { display: flex; align-items: center; gap: 12px; padding: 0 32px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-wrap { flex: 1; min-width: 220px; display: flex; align-items: center; gap: 10px; background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 10px 16px; transition: border-color .2s; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .search-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    .search-icon { font-size: 15px; opacity: .5; }
    .search-input { background: none; border: none; color: var(--text); font-size: 13.5px; outline: none; width: 100%; }
    .search-input::placeholder { color: #c4c9d4; }
    .filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .ftab { background: #fff; border: 1.5px solid var(--border); color: var(--muted); border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .ftab:hover { border-color: var(--accent); color: var(--accent); }
    .ftab.active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; }
    .ftab-green.active { background: #059669; border-color: #059669; }
    .ftab-amber.active { background: #d97706; border-color: #d97706; }
    .ftab-red.active   { background: #dc2626; border-color: #dc2626; }
    .ftab-gray.active  { background: #6b7280; border-color: #6b7280; }
    .results-pill { background: #fef3c7; border: 1px solid rgba(245,158,11,0.3); color: #d97706; border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 700; white-space: nowrap; }

    /* LOADING */
    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 80px; }
    .loader { width: 40px; height: 40px; border: 3px solid #e5e9f2; border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 13px; color: var(--muted); }

    /* OFFERS GRID */
    .offers-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(340px,1fr)); gap: 18px; padding: 0 32px; }

    /* OFFER CARD */
    .offer-card { background: #fff; border-radius: 18px; border: 1.5px solid var(--border); box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; transition: transform .2s, box-shadow .2s; animation: fadeUp .35s ease both; }
    .offer-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(0,0,0,0.1); }
    @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

    /* Colored top bar per status */
    .oc-top-bar { height: 5px; width: 100%; }
    .oc-active  .oc-top-bar { background: linear-gradient(90deg,#059669,#34d399); }
    .oc-draft   .oc-top-bar { background: linear-gradient(90deg,#d97706,#fcd34d); }
    .oc-closed  .oc-top-bar { background: linear-gradient(90deg,#dc2626,#f87171); }
    .oc-expired .oc-top-bar { background: linear-gradient(90deg,#6b7280,#d1d5db); }
    .oc-urgent  .oc-top-bar { background: linear-gradient(90deg,#7c3aed,#a78bfa); }

    .oc-body { padding: 18px 20px 16px; }
    .oc-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
    .oc-logo { width: 46px; height: 46px; border-radius: 12px; border: 1.5px solid var(--border); overflow: hidden; flex-shrink: 0; }
    .oc-logo img { width: 100%; height: 100%; object-fit: cover; }
    .oc-logo-ph { width: 100%; height: 100%; background: linear-gradient(135deg,#f59e0b,#f97316); color: #fff; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
    .oc-title-wrap { flex: 1; min-width: 0; }
    .oc-title { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .oc-company { font-size: 12.5px; color: var(--muted); margin: 0; }

    /* Status badge */
    .oc-status-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
    .oc-active  .oc-status-badge { background: #d1fae5; color: #059669; }
    .oc-draft   .oc-status-badge { background: #fef3c7; color: #d97706; }
    .oc-closed  .oc-status-badge { background: #fee2e2; color: #dc2626; }
    .oc-expired .oc-status-badge { background: #f3f4f6; color: #6b7280; }
    .oc-urgent  .oc-status-badge { background: #ede9fe; color: #7c3aed; }
    .sb-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

    /* Meta chips */
    .oc-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
    .meta-chip { font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 8px; border: 1px solid; white-space: nowrap; }
    .chip-contract { background: #fef3c7; color: #d97706; border-color: #fde68a; }
    .chip-loc  { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
    .chip-date { background: #f5f3ff; color: #7c3aed; border-color: #ddd6fe; }

    /* Applications count */
    .oc-cand-row { margin-bottom: 14px; }
    .cand-count-wrap { display: flex; align-items: baseline; gap: 5px; margin-bottom: 6px; }
    .cand-num { font-size: 22px; font-weight: 800; color: var(--text); line-height: 1; }
    .cand-txt { font-size: 12px; color: var(--muted); }
    .cand-progress { height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
    .cand-fill { height: 100%; background: linear-gradient(90deg,#f59e0b,#f97316); border-radius: 3px; transition: width .6s ease; min-width: 4px; }

    /* Actions */
    .oc-actions { display: flex; gap: 8px; padding-top: 14px; border-top: 1px solid #f3f4f6; }
    .oa-btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 9px; padding: 7px 13px; font-size: 12.5px; font-weight: 600; cursor: pointer; text-decoration: none; border: 1.5px solid; transition: all .15s; }
    .oa-cand { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; flex: 1; justify-content: center; } .oa-cand:hover { background: #dbeafe; }
    .oa-edit { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; flex: 1; justify-content: center; } .oa-edit:hover { background: #dcfce7; }
    .oa-del  { background: #fff1f2; border-color: #fecdd3; color: #e11d48; padding: 7px 11px; } .oa-del:hover { background: #ffe4e6; }

    /* EMPTY STATE */
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; gap: 10px; }
    .empty-icon { font-size: 52px; margin-bottom: 8px; }
    .empty-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-sub { font-size: 13.5px; color: var(--muted); margin: 0; }
    .empty-cta { margin-top: 16px; display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #1a1a2e; border-radius: 12px; padding: 11px 24px; font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(245,158,11,0.35); transition: all .2s; } .empty-cta:hover { background: var(--accent-dark); color: #fff; }

    /* DELETE MODAL */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: #fff; border-radius: 20px; width: 460px; max-width: 95vw; box-shadow: 0 24px 64px rgba(0,0,0,0.15); overflow: hidden; }
    .modal-header { display: flex; align-items: center; gap: 14px; padding: 22px 24px 18px; background: linear-gradient(135deg,#1a1a2e,#24243e); }
    .modal-header-icon { font-size: 24px; width: 48px; height: 48px; background: rgba(220,38,38,0.2); border: 1.5px solid rgba(220,38,38,0.4); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .modal-header-text { flex: 1; }
    .modal-title { font-size: 16px; font-weight: 800; color: #fff; margin: 0 0 3px; }
    .modal-sub { font-size: 12.5px; color: rgba(255,255,255,0.6); margin: 0; }
    .modal-close { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer; padding: 6px 10px; border-radius: 8px; transition: all .15s; } .modal-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
    .modal-body { padding: 22px 24px; }
    .modal-msg { font-size: 14px; color: var(--muted); line-height: 1.6; margin: 0; } .modal-msg strong { color: var(--text); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #f3f4f6; background: #fafaf7; }
    .mf-cancel { background: #fff; border: 1.5px solid var(--border); color: var(--muted); border-radius: 12px; padding: 10px 20px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .15s; } .mf-cancel:hover { border-color: var(--accent); color: var(--text); }
    .mf-danger { background: #fee2e2; border: 1.5px solid #fecaca; color: #dc2626; border-radius: 12px; padding: 10px 22px; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: all .15s; } .mf-danger:hover { background: #fecaca; } .mf-danger:disabled { opacity: .5; cursor: not-allowed; }

    @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2,1fr); } .offers-grid { padding: 0 16px; } .toolbar-row { padding: 0 16px; } .stats-grid { padding: 0 16px; } }
    @media (max-width: 640px) { .employer-page { padding-bottom: 40px; } .stats-grid { grid-template-columns: 1fr 1fr; } .filter-tabs { display: none; } .page-hero { padding: 24px 20px 20px; } .offers-grid { grid-template-columns: 1fr; } }
  `]
})
export class EmployerOffersComponent implements OnInit {
  private jobSvc = inject(JobService);
  private http   = inject(HttpClient);
  private cdr    = inject(ChangeDetectorRef);

  jobs: Job[] = [];
  filtered: Job[] = [];
  loading = false;
  keyword = '';
  statusFilter = '';

  deleteJob: Job | null = null;
  deleting = false;

  ngOnInit(): void { this.loadJobs(); }

  loadJobs(): void {
    this.loading = true;
    const params = new HttpParams().set('page', '0').set('size', '100');
    this.http.get<any>(API_ENDPOINTS['employerJobs'], { params }).subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res;
        const content = (raw?.content ?? []).map((j: any) => this.jobSvc.normalizeJob(j));
        this.jobs = content;
        this.filtered = [...content];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading jobs:', err);
        this.jobs = [];
        this.filtered = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterJobs(): void {
    const kw = this.keyword.toLowerCase();
    this.filtered = this.jobs.filter(j =>
      (!kw || j.title?.toLowerCase().includes(kw) || (j.company?.name || '').toLowerCase().includes(kw))
      && (!this.statusFilter
          || (this.statusFilter === 'EXPIRED' ? j.expired
              : this.statusFilter === 'ACTIVE' ? j.status === 'ACTIVE' && !j.expired
              : j.status === this.statusFilter))
    );
  }

  confirmDelete(job: Job): void { this.deleteJob = job; }

  doDelete(): void {
    if (!this.deleteJob) return;
    this.deleting = true;
    this.jobSvc.delete(this.deleteJob.id).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j.id !== this.deleteJob!.id);
        this.filterJobs();
        this.deleteJob = null;
        this.deleting = false;
      },
      error: (err) => { console.error('Error deleting job:', err); this.deleting = false; }
    });
  }

  countByStatus(status: string): number {
    if (status === 'ACTIVE') return this.jobs.filter(j => j.status === status && !j.expired).length;
    return this.jobs.filter(j => j.status === status).length;
  }

  get totalNonExpired(): number { return this.jobs.filter(j => !j.expired).length; }

  totalApplicants(): number { return this.jobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0); }

  getLabel(type?: string): string { return type ? JOB_TYPE_LABELS[type] || type : '—'; }

  statusLabel(s?: string): string {
    const labels: Record<string, string> = { ACTIVE: 'Active', DRAFT: 'Draft', CLOSED: 'Closed', EXPIRED: 'Expired', URGENT: 'Urgent' };
    return s ? labels[s] || s : '—';
  }

  getCandPercent(job: Job): number {
    const max = Math.max(...this.jobs.map(j => j.applicationCount || 0), 1);
    return Math.round(((job.applicationCount || 0) / max) * 100);
  }
}
