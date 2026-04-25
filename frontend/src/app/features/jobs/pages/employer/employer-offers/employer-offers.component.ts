// employer-offers.component.ts — Version complète avec styles
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
    <div class="page-hero-inner">
      <div>
        <p class="hero-eyebrow">Dashboard</p>
        <h2 class="page-title">My Job Offers</h2>
        <p class="page-sub">Manage and track all your published offers</p>
      </div>
      <a class="btn-new" routerLink="/jobs/employer/jobs/new">+ Nouvelle offre</a>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-grid">
    <div class="stat-card">
      <p class="sc-label">Total</p>
      <p class="sc-val">{{ jobs.length }}</p>
      <p class="sc-sub">offers created</p>
    </div>
    <div class="stat-card">
      <p class="sc-label">Active</p>
      <p class="sc-val sc-accent">{{ countByStatus('ACTIVE') }}</p>
      <p class="sc-sub">{{ totalNonExpired ? ((countByStatus('ACTIVE') / totalNonExpired * 100) | number:'1.0-0') : 0 }}% of total</p>
    </div>
    <div class="stat-card">
      <p class="sc-label">Drafts</p>
      <p class="sc-val">{{ countByStatus('DRAFT') }}</p>
      <p class="sc-sub">to publish</p>
    </div>
    <div class="stat-card">
      <p class="sc-label">Applications</p>
      <p class="sc-val">{{ totalApplicants() }}</p>
      <p class="sc-sub">total</p>
    </div>
  </div>

  <!-- TOOLBAR -->
  <div class="toolbar-row">
    <div class="search-wrap">
      <span class="search-icon">&#9906;</span>
      <input [(ngModel)]="keyword" (ngModelChange)="filterJobs()"
             placeholder="Search a job offer..." class="search-input"/>
    </div>
    <div class="filter-tabs">
      <button class="ftab" [class.active]="statusFilter===''" (click)="statusFilter='';filterJobs()">All</button>
      <button class="ftab" [class.active]="statusFilter==='ACTIVE'" (click)="statusFilter='ACTIVE';filterJobs()">Active</button>
      <button class="ftab" [class.active]="statusFilter==='DRAFT'" (click)="statusFilter='DRAFT';filterJobs()">Drafts</button>
      <button class="ftab" [class.active]="statusFilter==='CLOSED'" (click)="statusFilter='CLOSED';filterJobs()">Closed</button>
      <button class="ftab" [class.active]="statusFilter==='EXPIRED'" (click)="statusFilter='EXPIRED';filterJobs()">Expired</button>
    </div>
    <span class="results-pill">{{ filtered.length }} offer{{ filtered.length !== 1 ? 's' : '' }}</span>
  </div>

  <!-- LOADING -->
  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div>
    <p class="loading-text">Chargement...</p>
  </div>

  <!-- CARDS GRID -->
  <div class="offers-grid" *ngIf="!loading && filtered.length > 0">
    <div class="offer-card" *ngFor="let job of filtered; let i = index"
         [class]="'oc-' + (job.expired ? 'expired' : (job.status || 'draft').toLowerCase())"
         [style.animation-delay]="i * 0.04 + 's'">
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
          <span class="meta-chip" *ngIf="job.country">{{ job.country }}{{ job.state ? ', ' + job.state : '' }}</span>
          <span class="meta-chip" *ngIf="job.postDate">{{ job.postDate | date:'d MMM y' }}</span>
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
          <a class="oa-btn oa-cand" [routerLink]="['/jobs/employer/jobs', job.id, 'applications']">Applications</a>
          <a class="oa-btn oa-edit" [routerLink]="['/jobs/employer/jobs/edit', job.id]">Edit</a>
          <button class="oa-btn oa-del" (click)="confirmDelete(job)">Delete</button>
        </div>

      </div>
    </div>
  </div>

  <!-- EMPTY STATE -->
  <div class="empty-state" *ngIf="!loading && filtered.length === 0">
    <div class="empty-icon">&#9993;</div>
    <p class="empty-title">No offers found</p>
    <p class="empty-sub" *ngIf="keyword || statusFilter">Try adjusting your filters</p>
    <p class="empty-sub" *ngIf="!keyword && !statusFilter">Start by creating your first offer</p>
    <a routerLink="/jobs/employer/jobs/new" class="empty-cta">Create an offer</a>
  </div>

  <!-- DELETE MODAL -->
  <div class="modal-overlay" *ngIf="deleteJob" (click)="deleteJob = null">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-icon-wrap">&#128465;</div>
      <h5 class="modal-title">Delete offer</h5>
      <p class="modal-msg">Are you sure you want to delete <strong>{{ deleteJob.title }}</strong>? This action is irreversible.</p>
      <div class="modal-actions">
        <button class="mf-cancel" (click)="deleteJob = null">Cancel</button>
        <button class="mf-danger" (click)="doDelete()" [disabled]="deleting">
          {{ deleting ? 'Deleting...' : 'Yes, delete' }}
        </button>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    :host { display: block; }

    /* ── DESIGN TOKENS ── */
    :host {
      --bg:      #f8f8f6;
      --surface: #ffffff;
      --border:  #ebebeb;
      --text:    #111111;
      --muted:   #888888;
      --accent:  #c9a84c;
      --accent-light: #fdf6e3;
      --danger:  #c0392b;
      --radius:  12px;
      --shadow:  0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
    }

    /* ── PAGE ── */
    .employer-page {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      padding: 0 0 80px;
    }

    /* ── HERO ── */
    .page-hero {
      background: #111111;
      padding: 40px 40px 36px;
      margin-bottom: 32px;
    }
    .page-hero-inner { display: flex; justify-content: space-between; align-items: center; }
    .hero-eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--accent);
      margin: 0 0 10px;
    }
    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 6px;
      letter-spacing: -0.3px;
    }
    .page-sub { font-size: 14px; color: #888; margin: 0; }

    .btn-new {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accent);
      color: #111;
      border: none;
      border-radius: var(--radius);
      padding: 12px 22px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
      transition: opacity .15s, transform .15s;
      letter-spacing: 0.2px;
    }
    .btn-new:hover { opacity: .88; transform: translateY(-1px); }

    /* ── STATS ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      margin: 0 40px 28px;
    }
    .stat-card {
      background: var(--surface);
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sc-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0;
    }
    .sc-val {
      font-size: 36px;
      font-weight: 700;
      color: var(--text);
      line-height: 1;
      margin: 4px 0 2px;
      letter-spacing: -1px;
    }
    .sc-sub { font-size: 12px; color: var(--muted); margin: 0; }
    .sc-accent { color: var(--accent) !important; }

    /* ── TOOLBAR ── */
    .toolbar-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 40px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .search-wrap {
      flex: 1;
      min-width: 200px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 10px 14px;
      transition: border-color .15s;
    }
    .search-wrap:focus-within { border-color: var(--accent); }
    .search-icon { font-size: 14px; color: var(--muted); }
    .search-input {
      background: none;
      border: none;
      color: var(--text);
      font-size: 13.5px;
      outline: none;
      width: 100%;
    }
    .search-input::placeholder { color: #ccc; }

    .filter-tabs { display: flex; gap: 4px; }
    .ftab {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--muted);
      border-radius: 8px;
      padding: 7px 14px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all .15s;
    }
    .ftab:hover { border-color: var(--accent); color: var(--text); }
    .ftab.active {
      background: var(--text);
      border-color: var(--text);
      color: #fff;
      font-weight: 600;
    }

    .results-pill {
      font-size: 12px;
      color: var(--muted);
      white-space: nowrap;
      padding: 0 4px;
    }

    /* ── LOADING ── */
    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; }
    .loader { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 13px; color: var(--muted); }

    /* ── OFFERS GRID ── */
    .offers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      padding: 0 40px;
    }

    /* ── OFFER CARD ── */
    .offer-card {
      background: var(--surface);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      overflow: hidden;
      transition: box-shadow .2s, transform .2s;
      animation: fadeUp .3s ease both;
    }
    .offer-card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

    /* Thin left accent line per status */
    .offer-card { border-left: 3px solid var(--border); }
    .oc-active  { border-left-color: #27ae60; }
    .oc-draft   { border-left-color: var(--accent); }
    .oc-closed  { border-left-color: #e74c3c; }
    .oc-expired { border-left-color: #bbb; }
    .oc-urgent  { border-left-color: #8e44ad; }

    .oc-body { padding: 20px; }

    /* Header */
    .oc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .oc-logo {
      width: 42px; height: 42px;
      border-radius: 8px;
      border: 1px solid var(--border);
      overflow: hidden;
      flex-shrink: 0;
    }
    .oc-logo img { width: 100%; height: 100%; object-fit: cover; }
    .oc-logo-ph {
      width: 100%; height: 100%;
      background: var(--accent-light);
      color: var(--accent);
      font-size: 16px;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .oc-title-wrap { flex: 1; min-width: 0; }
    .oc-title { font-size: 14.5px; font-weight: 600; color: var(--text); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .oc-company { font-size: 12px; color: var(--muted); margin: 0; }

    /* Status badge — minimal */
    .oc-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 20px;
      white-space: nowrap;
      flex-shrink: 0;
      border: 1px solid;
    }
    .oc-active  .oc-status-badge { color: #27ae60; background: #f0faf4; border-color: #c3e6cb; }
    .oc-draft   .oc-status-badge { color: #b8860b; background: var(--accent-light); border-color: #f0d080; }
    .oc-closed  .oc-status-badge { color: #c0392b; background: #fdf3f2; border-color: #f5c6c2; }
    .oc-expired .oc-status-badge { color: #888; background: #f5f5f5; border-color: #ddd; }
    .oc-urgent  .oc-status-badge { color: #8e44ad; background: #f9f0ff; border-color: #d7b8f0; }
    .sb-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

    /* Meta row */
    .oc-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
    .meta-chip {
      font-size: 11.5px;
      color: var(--muted);
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 3px 9px;
      white-space: nowrap;
    }
    .chip-contract { color: var(--text); font-weight: 500; }

    /* Candidats */
    .oc-cand-row { margin-bottom: 16px; }
    .cand-count-wrap { display: flex; align-items: baseline; gap: 5px; margin-bottom: 6px; }
    .cand-num { font-size: 20px; font-weight: 700; color: var(--text); line-height: 1; }
    .cand-txt { font-size: 12px; color: var(--muted); }
    .cand-progress { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .cand-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width .5s ease; min-width: 3px; }

    /* Actions */
    .oc-actions {
      display: flex;
      gap: 6px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }
    .oa-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      transition: all .15s;
    }
    .oa-btn:hover { background: var(--bg); border-color: #ccc; }
    .oa-cand { flex: 1; justify-content: center; }
    .oa-edit { flex: 1; justify-content: center; }
    .oa-del  { color: var(--danger); border-color: #f5c6c2; }
    .oa-del:hover { background: #fdf3f2; }

    /* ── EMPTY STATE ── */
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; gap: 8px; }
    .empty-icon { font-size: 40px; margin-bottom: 8px; opacity: .4; }
    .empty-title { font-size: 16px; font-weight: 600; color: var(--text); margin: 0; }
    .empty-sub { font-size: 13px; color: var(--muted); margin: 0; }
    .empty-cta {
      margin-top: 16px;
      background: var(--text);
      color: #fff;
      border-radius: var(--radius);
      padding: 10px 22px;
      font-size: 13.5px;
      font-weight: 600;
      text-decoration: none;
      transition: opacity .15s;
    }
    .empty-cta:hover { opacity: .85; }

    /* ── MODAL ── */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: var(--surface); border-radius: 16px; padding: 36px 32px; width: 420px; max-width: 95vw; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .modal-icon-wrap { font-size: 28px; width: 60px; height: 60px; background: #fdf3f2; border: 1px solid #f5c6c2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .modal-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0 0 8px; }
    .modal-msg { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin: 0 0 24px; }
    .modal-msg strong { color: var(--text); }
    .modal-actions { display: flex; gap: 10px; justify-content: center; }
    .mf-cancel { background: var(--surface); border: 1px solid var(--border); color: var(--muted); border-radius: var(--radius); padding: 10px 22px; font-size: 13.5px; cursor: pointer; transition: all .15s; } .mf-cancel:hover { border-color: #aaa; color: var(--text); }
    .mf-danger { background: var(--danger); border: none; color: #fff; border-radius: var(--radius); padding: 10px 22px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: opacity .15s; } .mf-danger:hover { opacity: .88; } .mf-danger:disabled { opacity: .4; cursor: not-allowed; }

    /* ── RESPONSIVE ── */
    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .page-hero { padding: 28px 20px; }
      .stats-grid, .toolbar-row, .offers-grid { margin-left: 0; margin-right: 0; padding-left: 16px; padding-right: 16px; }
      .offers-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .filter-tabs { display: none; }
    }
    .page-hero { background:linear-gradient(135deg,#0f0c29,#1a1a2e 60%,#24243e); padding:36px 32px 32px; margin-bottom:28px; border-bottom:3px solid #f59e0b; position:relative; overflow:hidden; }
    .hero-bg-shapes { position:absolute; inset:0; pointer-events:none; }
    .shape { position:absolute; border-radius:50%; opacity:0.07; }
    .shape.s1 { width:300px; height:300px; background:#f59e0b; top:-80px; right:-60px; }
    .shape.s2 { width:180px; height:180px; background:#7c3aed; bottom:-60px; left:40%; }
    .page-hero-inner { display:flex; justify-content:space-between; align-items:flex-end; position:relative; z-index:1; }
    .header-badge { display:inline-flex; align-items:center; gap:8px; border:1px solid rgba(245,158,11,0.4); background:rgba(245,158,11,0.12); color:#f59e0b; font-size:11px; font-weight:700; letter-spacing:1.2px; padding:4px 14px; border-radius:20px; margin-bottom:12px; }
    .pulse-dot { width:6px; height:6px; border-radius:50%; background:#f59e0b; animation:pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
    .page-title { font-size:28px; font-weight:800; color:#fff; margin:0 0 6px; letter-spacing:-0.5px; }
    .page-sub { font-size:14px; color:rgba(255,255,255,0.55); margin:0; }
    .btn-new { display:inline-flex; align-items:center; gap:8px; background:#f59e0b; color:#1a1a2e; border:none; border-radius:12px; padding:12px 24px; font-size:14px; font-weight:800; cursor:pointer; text-decoration:none; white-space:nowrap; transition:all .2s; box-shadow:0 4px 20px rgba(245,158,11,0.4); }
    .btn-new:hover { background:#d97706; color:#fff; transform:translateY(-2px); box-shadow:0 8px 24px rgba(245,158,11,0.5); }
    .btn-plus { font-size:20px; font-weight:300; line-height:1; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; padding:0 32px; margin-bottom:24px; }
    .stat-card { border-radius:16px; padding:20px 20px 16px; display:flex; align-items:flex-start; gap:14px; position:relative; overflow:hidden; transition:transform .2s,box-shadow .2s; cursor:default; }
    .stat-card:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(0,0,0,0.12); }
    .sc-blue   { background:linear-gradient(135deg,#1e3a5f,#1d4ed8); }
    .sc-green  { background:linear-gradient(135deg,#064e3b,#059669); }
    .sc-amber  { background:linear-gradient(135deg,#78350f,#d97706); }
    .sc-purple { background:linear-gradient(135deg,#3b1f6e,#7c3aed); }
    .sc-icon { font-size:26px; flex-shrink:0; margin-top:2px; }
    .sc-body { flex:1; }
    .sc-label { font-size:10px; font-weight:700; color:rgba(255,255,255,0.6); letter-spacing:1.4px; margin:0 0 4px; }
    .sc-val { font-size:32px; font-weight:800; color:#fff; margin:0 0 2px; line-height:1; }
    .sc-sub { font-size:12px; color:rgba(255,255,255,0.5); margin:0; }
    .sc-bar { position:absolute; bottom:0; left:0; right:0; height:3px; background:rgba(255,255,255,0.2); border-radius:0 0 14px 14px; }
    .toolbar-row { display:flex; align-items:center; gap:12px; padding:0 32px; margin-bottom:20px; flex-wrap:wrap; }
    .search-wrap { flex:1; min-width:220px; display:flex; align-items:center; gap:10px; background:#fff; border:1.5px solid var(--border); border-radius:12px; padding:10px 16px; transition:border-color .2s; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
    .search-wrap:focus-within { border-color:#f59e0b; box-shadow:0 0 0 3px rgba(245,158,11,0.1); }
    .search-icon { font-size:15px; opacity:.5; }
    .search-input { background:none; border:none; color:var(--text); font-size:13.5px; outline:none; width:100%; }
    .search-input::placeholder { color:#c4c9d4; }
    .filter-tabs { display:flex; gap:6px; flex-wrap:wrap; }
    .ftab { background:#fff; border:1.5px solid var(--border); color:var(--muted); border-radius:20px; padding:6px 14px; font-size:12.5px; font-weight:600; cursor:pointer; transition:all .15s; }
    .ftab:hover { border-color:#f59e0b; color:#f59e0b; }
    .ftab.active { background:#1a1a2e; border-color:#1a1a2e; color:#fff; }
    .ftab-green.active { background:#059669; border-color:#059669; }
    .ftab-amber.active { background:#d97706; border-color:#d97706; }
    .ftab-red.active   { background:#dc2626; border-color:#dc2626; }
    .ftab-gray.active  { background:#6b7280; border-color:#6b7280; }
    .results-pill { background:#fef3c7; border:1px solid rgba(245,158,11,0.3); color:#d97706; border-radius:20px; padding:6px 14px; font-size:12.5px; font-weight:700; white-space:nowrap; }
    .loading-wrap { display:flex; flex-direction:column; align-items:center; gap:14px; padding:80px; }
    .loader { width:40px; height:40px; border:3px solid #e5e9f2; border-top-color:#f59e0b; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .loading-text { font-size:13px; color:var(--muted); }
    .offers-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:18px; padding:0 32px; }
    .offer-card { background:#fff; border-radius:18px; border:1.5px solid var(--border); box-shadow:0 2px 12px rgba(0,0,0,0.06); overflow:hidden; transition:transform .2s,box-shadow .2s; animation:fadeUp .35s ease both; }
    .offer-card:hover { transform:translateY(-4px); box-shadow:0 16px 36px rgba(0,0,0,0.1); }
    @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .oc-bar { height:5px; width:100%; }
    .oc-active  .oc-bar { background:linear-gradient(90deg,#059669,#34d399); }
    .oc-draft   .oc-bar { background:linear-gradient(90deg,#d97706,#fcd34d); }
    .oc-closed  .oc-bar { background:linear-gradient(90deg,#dc2626,#f87171); }
    .oc-expired .oc-bar { background:linear-gradient(90deg,#6b7280,#d1d5db); }
    .oc-urgent  .oc-bar { background:linear-gradient(90deg,#7c3aed,#a78bfa); }
    .oc-body { padding:18px 20px 16px; }
    .oc-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:14px; }
    .oc-logo { width:46px; height:46px; border-radius:12px; border:1.5px solid var(--border); overflow:hidden; flex-shrink:0; }
    .oc-logo img { width:100%; height:100%; object-fit:cover; }
    .oc-logo-ph { width:100%; height:100%; background:linear-gradient(135deg,#f59e0b,#f97316); color:#fff; font-size:18px; font-weight:800; display:flex; align-items:center; justify-content:center; }
    .oc-title-wrap { flex:1; min-width:0; }
    .oc-title { font-size:15px; font-weight:700; color:var(--text); margin:0 0 3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .oc-company { font-size:12.5px; color:var(--muted); margin:0; }
    .oc-status-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
    .oc-active  .oc-status-badge { background:#d1fae5; color:#059669; }
    .oc-draft   .oc-status-badge { background:#fef3c7; color:#d97706; }
    .oc-closed  .oc-status-badge { background:#fee2e2; color:#dc2626; }
    .oc-expired .oc-status-badge { background:#f3f4f6; color:#6b7280; }
    .oc-urgent  .oc-status-badge { background:#ede9fe; color:#7c3aed; }
    .sb-dot { width:6px; height:6px; border-radius:50%; background:currentColor; flex-shrink:0; }
    .oc-meta { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
    .meta-chip { font-size:11.5px; font-weight:600; padding:4px 10px; border-radius:8px; border:1px solid; white-space:nowrap; }
    .chip-loc  { background:#f0f9ff; color:#0369a1; border-color:#bae6fd; }
    .chip-date { background:#f5f3ff; color:#7c3aed; border-color:#ddd6fe; }
    .cc-full_time  { background:#fef3c7; color:#d97706; border-color:#fde68a; }
    .cc-part_time  { background:#fef9c3; color:#ca8a04; border-color:#fef08a; }
    .cc-freelance  { background:#dcfce7; color:#16a34a; border-color:#bbf7d0; }
    .cc-internship { background:#ede9fe; color:#7c3aed; border-color:#ddd6fe; }
    .cc-remote     { background:#e0f2fe; color:#0284c7; border-color:#bae6fd; }
    .cc-contract   { background:#fff1f2; color:#e11d48; border-color:#fecdd3; }
    .oc-cand-row { margin-bottom:14px; }
    .cand-count-wrap { display:flex; align-items:baseline; gap:5px; margin-bottom:6px; }
    .cand-num { font-size:22px; font-weight:800; color:var(--text); line-height:1; }
    .cand-txt { font-size:12px; color:var(--muted); }
    .cand-progress { height:5px; background:#f0f0f0; border-radius:3px; overflow:hidden; }
    .cand-fill { height:100%; background:linear-gradient(90deg,#f59e0b,#f97316); border-radius:3px; transition:width .6s ease; min-width:4px; }
    .oc-actions { display:flex; gap:8px; padding-top:14px; border-top:1px solid #f3f4f6; }
    .oa-btn { display:inline-flex; align-items:center; gap:5px; border-radius:9px; padding:7px 13px; font-size:12.5px; font-weight:600; cursor:pointer; text-decoration:none; border:1.5px solid; transition:all .15s; }
    .oa-cand { background:#eff6ff; border-color:#bfdbfe; color:#2563eb; flex:1; justify-content:center; } .oa-cand:hover { background:#dbeafe; }
    .oa-edit { background:#f0fdf4; border-color:#bbf7d0; color:#16a34a; flex:1; justify-content:center; } .oa-edit:hover { background:#dcfce7; }
    .oa-del  { background:#fff1f2; border-color:#fecdd3; color:#e11d48; padding:7px 11px; } .oa-del:hover { background:#ffe4e6; }
    .empty-state { display:flex; flex-direction:column; align-items:center; padding:80px 20px; gap:10px; }
    .empty-icon { font-size:52px; margin-bottom:8px; }
    .empty-title { font-size:18px; font-weight:700; color:var(--text); margin:0; }
    .empty-sub { font-size:13.5px; color:var(--muted); margin:0; }
    .empty-cta { margin-top:16px; background:#f59e0b; color:#1a1a2e; border-radius:12px; padding:11px 24px; font-size:14px; font-weight:700; text-decoration:none; box-shadow:0 4px 14px rgba(245,158,11,0.35); transition:all .2s; } .empty-cta:hover { background:#d97706; color:#fff; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal-box { background:#fff; border-radius:20px; padding:36px 32px; width:440px; max-width:95vw; text-align:center; box-shadow:0 24px 64px rgba(0,0,0,0.15); }
    .modal-icon-wrap { font-size:36px; width:68px; height:68px; background:#fff1f2; border:1.5px solid #fecdd3; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; }
    .modal-title { font-size:20px; font-weight:800; color:var(--text); margin:0 0 10px; }
    .modal-msg { font-size:14px; color:var(--muted); line-height:1.6; margin:0 0 26px; }
    .modal-msg strong { color:var(--text); }
    .modal-actions { display:flex; gap:12px; justify-content:center; }
    .mf-cancel { background:#fff; border:1.5px solid var(--border); color:var(--muted); border-radius:12px; padding:11px 26px; font-size:14px; cursor:pointer; transition:all .15s; } .mf-cancel:hover { border-color:#f59e0b; color:var(--text); }
    .mf-danger { background:#fff1f2; border:1.5px solid #fecdd3; color:#e11d48; border-radius:12px; padding:11px 26px; font-size:14px; font-weight:700; cursor:pointer; transition:all .15s; } .mf-danger:hover { background:#ffe4e6; } .mf-danger:disabled { opacity:.5; cursor:not-allowed; }
    @media (max-width:1024px) { .stats-grid { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:768px) { .page-hero { padding:24px 20px 20px; } .stats-grid,.toolbar-row,.offers-grid { padding:0 16px; } .offers-grid { grid-template-columns:1fr; } }
    @media (max-width:600px) { .stats-grid { grid-template-columns:1fr 1fr; } .filter-tabs { display:none; } }
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

  ngOnInit(): void {
    this.loadJobs();
  }

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
        console.error('❌ Error loading jobs:', err);
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
    && (
      !this.statusFilter
      || (this.statusFilter === 'EXPIRED' ? j.expired
          : this.statusFilter === 'ACTIVE' ? j.status === 'ACTIVE' && !j.expired
          : j.status === this.statusFilter
         )
    )
  );
}
  confirmDelete(job: Job): void {
    this.deleteJob = job;
  }

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
      error: (err) => {
        console.error('❌ Error deleting job:', err);
        this.deleting = false;
      }
    });
  }

countByStatus(status: string): number {
  if (status === 'ACTIVE') {
    // Exclure les offres expirées
    return this.jobs.filter(j => j.status === status && !j.expired).length;
  }
  return this.jobs.filter(j => j.status === status).length;
}
get totalNonExpired(): number {
  return this.jobs.filter(j => !j.expired).length;
}
  totalApplicants(): number {
    return this.jobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0);
  }

  getLabel(type?: string): string {
    return type ? JOB_TYPE_LABELS[type] || type : '—';
  }

  statusLabel(s?: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      DRAFT: 'Draft',
      CLOSED: 'Closed',
      EXPIRED: 'Expired',
      URGENT: 'Urgent'
    };
    return s ? labels[s] || s : '—';
  }

  getCandPercent(job: Job): number {
    const max = Math.max(...this.jobs.map(j => j.applicationCount || 0), 1);
    return Math.round(((job.applicationCount || 0) / max) * 100);
  }
}