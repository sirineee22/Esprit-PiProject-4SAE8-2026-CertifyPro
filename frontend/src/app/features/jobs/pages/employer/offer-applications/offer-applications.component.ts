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
    <div class="hero-bg-shapes">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    <div class="page-hero-inner">
      <div>
        <div class="header-badge">
          <span class="pulse-dot"></span>
          APPLICATION MANAGEMENT
        </div>
        <h2 class="page-title">Received Applications</h2>
        <p class="page-sub">Review, filter and manage all candidate applications</p>
      </div>
      <div class="header-actions">
        <a class="btn-back" routerLink="/jobs/employer/jobs">
          <span>&#8592;</span> Back to Offers
        </a>
        <button class="btn-matching" (click)="toggleMatching()">
          <span class="btn-icon">&#10024;</span> Suggested Candidates
        </button>
      </div>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-grid">
    <div class="stat-card sc-dark">
      <div class="sc-icon">&#128196;</div>
      <div class="sc-body">
        <p class="sc-label">Total</p>
        <p class="sc-val">{{ summaryCards[0].count }}</p>
        <p class="sc-sub">applications received</p>
      </div>
      <div class="sc-bar"></div>
    </div>
    <div class="stat-card sc-blue">
      <div class="sc-icon">&#128276;</div>
      <div class="sc-body">
        <p class="sc-label">New</p>
        <p class="sc-val">{{ summaryCards[1].count }}</p>
        <p class="sc-sub">awaiting review</p>
      </div>
      <div class="sc-bar"></div>
    </div>
    <div class="stat-card sc-purple">
      <div class="sc-icon">&#128197;</div>
      <div class="sc-body">
        <p class="sc-label">Interviews</p>
        <p class="sc-val">{{ summaryCards[2].count }}</p>
        <p class="sc-sub">scheduled</p>
      </div>
      <div class="sc-bar"></div>
    </div>
    <div class="stat-card sc-green">
      <div class="sc-icon">&#9989;</div>
      <div class="sc-body">
        <p class="sc-label">Accepted</p>
        <p class="sc-val">{{ summaryCards[3].count }}</p>
        <p class="sc-sub">candidates hired</p>
      </div>
      <div class="sc-bar"></div>
    </div>
    <div class="stat-card sc-red">
      <div class="sc-icon">&#10060;</div>
      <div class="sc-body">
        <p class="sc-label">Rejected</p>
        <p class="sc-val">{{ summaryCards[4].count }}</p>
        <p class="sc-sub">not selected</p>
      </div>
      <div class="sc-bar"></div>
    </div>
  </div>

  <!-- TOOLBAR -->
  <div class="toolbar-row">
    <div class="search-wrap">
      <span class="search-icon">&#128269;</span>
      <input [(ngModel)]="filter.keyword" (keyup.enter)="load()" placeholder="Search a candidate..." class="search-input"/>
    </div>
    <div class="filter-tabs">
      <button class="ftab" [class.active]="activeTab===''" (click)="setTab('')">All</button>
      <button class="ftab ftab-blue" [class.active]="activeTab==='NEW'" (click)="setTab('NEW')">New</button>
      <button class="ftab ftab-purple" [class.active]="activeTab==='INTERVIEW'" (click)="setTab('INTERVIEW')">Interviews</button>
      <button class="ftab ftab-green" [class.active]="activeTab==='APPROVED'" (click)="setTab('APPROVED')">Accepted</button>
      <button class="ftab ftab-red" [class.active]="activeTab==='REJECTED'" (click)="setTab('REJECTED')">Rejected</button>
    </div>
    <span class="results-pill">{{ displayedApplications.length }} application{{ displayedApplications.length !== 1 ? 's' : '' }}</span>
  </div>

  <!-- LOADING -->
  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div>
    <p class="loading-text">Loading applications...</p>
  </div>

  <!-- CARDS -->
  <div class="candidates-grid" *ngIf="!loading && displayedApplications.length > 0">
    <div class="cand-card" *ngFor="let app of displayedApplications; let i = index"
         [class]="'cc-' + app.status.toLowerCase()"
         [style.animation-delay]="i * 0.04 + 's'">

      <div class="cc-top-bar"></div>

      <div class="cc-body">
        <div class="cc-header">
          <div class="cc-avatar">{{ (app.candidateName || '?').charAt(0).toUpperCase() }}</div>
          <div class="cc-info">
            <h6 class="cc-name">{{ app.candidateName }}</h6>
            <p class="cc-date" *ngIf="app.applyDate">Applied {{ app.applyDate | date:'d MMM y' }}</p>
          </div>
          <span class="cc-badge" [class]="'badge-' + app.status.toLowerCase()">
            <span class="badge-dot"></span>
            {{ statusLabel(app.status) }}
          </span>
        </div>

        <p class="cc-cover" *ngIf="app.coverLetter">"{{ app.coverLetter | slice:0:120 }}..."</p>

        <div class="cc-actions">
          <button class="ca-btn ca-cv" *ngIf="app.resumeUrl" (click)="downloadResume(app)">
            <span>&#128196;</span> CV
          </button>
          <button class="ca-btn ca-accept" (click)="updateStatus(app, 'APPROVED')">
            <span>&#10003;</span> Accept
          </button>
          <button class="ca-btn ca-interview" (click)="openInterviewModal(app)">
            <span>&#128197;</span> Interview
          </button>
          <button class="ca-btn ca-reject" (click)="updateStatus(app, 'REJECTED')">
            <span>&#10005;</span> Reject
          </button>
        </div>

        <div class="cc-interview-info" *ngIf="app.interviewDate">
          <span class="iv-label">&#128197; Scheduled</span>
          <span class="iv-date">{{ app.interviewDate | date:'d MMM y, HH:mm' }}</span>
          <a *ngIf="app.interviewLink" [href]="app.interviewLink" target="_blank" class="iv-link">Join &#8599;</a>
        </div>
      </div>

    </div>
  </div>

  <!-- EMPTY STATE -->
  <div class="empty-state" *ngIf="!loading && displayedApplications.length === 0">
    <div class="empty-icon">&#128203;</div>
    <p class="empty-title">No applications found</p>
    <p class="empty-sub" *ngIf="activeTab || filter.keyword">Try adjusting your filters</p>
    <p class="empty-sub" *ngIf="!activeTab && !filter.keyword">No candidates have applied yet</p>
  </div>

  <!-- MATCHING PANEL -->
  <div class="matching-panel" *ngIf="showMatching">
    <div class="mp-header">
      <div>
        <h4 class="mp-title">&#10024; Suggested Candidates</h4>
        <p class="mp-subtitle">AI-matched candidates for this position</p>
      </div>
      <button class="mp-close" (click)="showMatching = false">&#10005;</button>
    </div>
    <div class="loading-wrap" *ngIf="loadingMatching">
      <div class="loader"></div>
      <p class="loading-text">Finding best matches...</p>
    </div>
    <div class="mp-grid" *ngIf="!loadingMatching">
      <div class="mp-card" *ngFor="let c of matchingCandidates">
        <div class="mp-score-wrap">
          <div class="mp-score" [class]="scoreClass(c.matchScore)">
            <span class="mp-score-num">{{ c.matchScore }}</span>
            <span class="mp-score-pct">%</span>
          </div>
          <span class="mp-score-label">match</span>
        </div>
        <div class="mp-info">
          <p class="mp-name">{{ c.fullName }}</p>
          <p class="mp-sub">{{ c.jobTitle }}</p>
          <div class="mp-skills">
            <span class="mp-skill" *ngFor="let s of c.matchedSkills?.slice(0,4)">{{ s }}</span>
          </div>
        </div>
        <a *ngIf="c.resumeUrl" [href]="c.resumeUrl" target="_blank" class="mp-cv">CV &#8599;</a>
      </div>
      <div class="mp-empty" *ngIf="matchingCandidates.length === 0">
        <div class="empty-icon" style="font-size:32px">&#128269;</div>
        <p>No matching candidates found.</p>
      </div>
    </div>
  </div>

</div>

<!-- INTERVIEW MODAL -->
<div class="modal-overlay" *ngIf="interviewApp" (click)="closeInterviewModal()">
  <div class="modal-box" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <div class="modal-header-icon">&#128197;</div>
      <div class="modal-header-text">
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
      <button class="mf-submit" (click)="scheduleInterview()" [disabled]="!interviewForm.date">
        &#128197; Confirm Interview
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    :host {
      --bg:      #f5f3eb;
      --surface: #ffffff;
      --border:  #e8e4d9;
      --text:    #1a1a2e;
      --muted:   #6b7280;
      --accent:  #f59e0b;
      --accent-dark: #d97706;
      --danger:  #dc2626;
      --radius:  14px;
      --shadow:  0 2px 12px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04);
    }

    .apps-page { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter','Segoe UI',system-ui,sans-serif; padding: 0 0 80px; }

    /* HERO */
    .page-hero { background: linear-gradient(135deg,#0f0c29,#1a1a2e 60%,#24243e); padding: 36px 32px 32px; margin-bottom: 28px; border-bottom: 3px solid var(--accent); position: relative; overflow: hidden; }
    .hero-bg-shapes { position: absolute; inset: 0; pointer-events: none; }
    .shape { position: absolute; border-radius: 50%; opacity: 0.07; }
    .shape.s1 { width: 300px; height: 300px; background: #f59e0b; top: -80px; right: -60px; }
    .shape.s2 { width: 180px; height: 180px; background: #7c3aed; bottom: -60px; left: 40%; }
    .page-hero-inner { display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; }
    .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.12); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
    .page-title { font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -0.5px; }
    .page-sub { font-size: 14px; color: rgba(255,255,255,0.55); margin: 0; }
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .btn-back { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1.5px solid rgba(255,255,255,0.25); color: rgba(255,255,255,0.75); border-radius: 12px; padding: 10px 18px; font-size: 13px; font-weight: 600; text-decoration: none; transition: all .2s; }
    .btn-back:hover { border-color: rgba(255,255,255,0.6); color: #fff; background: rgba(255,255,255,0.08); }
    .btn-matching { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); border: none; color: #1a1a2e; border-radius: 12px; padding: 11px 20px; font-size: 13.5px; font-weight: 800; cursor: pointer; transition: all .2s; box-shadow: 0 4px 20px rgba(245,158,11,0.4); }
    .btn-matching:hover { background: var(--accent-dark); color: #fff; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(245,158,11,0.5); }
    .btn-icon { font-size: 14px; }

    /* STATS */
    .stats-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 16px; padding: 0 32px; margin-bottom: 24px; }
    .stat-card { border-radius: 16px; padding: 20px 18px 16px; display: flex; align-items: flex-start; gap: 14px; position: relative; overflow: hidden; transition: transform .2s, box-shadow .2s; cursor: default; }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.14); }
    .sc-dark   { background: linear-gradient(135deg,#1a1a2e,#2d2d4e); }
    .sc-blue   { background: linear-gradient(135deg,#1e3a5f,#1d4ed8); }
    .sc-purple { background: linear-gradient(135deg,#3b1f6e,#7c3aed); }
    .sc-green  { background: linear-gradient(135deg,#064e3b,#059669); }
    .sc-red    { background: linear-gradient(135deg,#7f1d1d,#dc2626); }
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
    .ftab-blue.active  { background: #1d4ed8; border-color: #1d4ed8; }
    .ftab-purple.active{ background: #7c3aed; border-color: #7c3aed; }
    .ftab-green.active { background: #059669; border-color: #059669; }
    .ftab-red.active   { background: #dc2626; border-color: #dc2626; }
    .results-pill { background: #fef3c7; border: 1px solid rgba(245,158,11,0.3); color: #d97706; border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 700; white-space: nowrap; }

    /* LOADING */
    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 80px; }
    .loader { width: 40px; height: 40px; border: 3px solid #e5e9f2; border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 13px; color: var(--muted); }

    /* CANDIDATES GRID */
    .candidates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; padding: 0 32px; }

    /* CANDIDATE CARD */
    .cand-card { background: #fff; border-radius: 18px; border: 1.5px solid var(--border); box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; transition: transform .2s, box-shadow .2s; animation: fadeUp .35s ease both; }
    .cand-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(0,0,0,0.1); }
    @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

    /* Colored top bar per status */
    .cc-top-bar { height: 5px; width: 100%; }
    .cc-new      .cc-top-bar { background: linear-gradient(90deg,#1d4ed8,#60a5fa); }
    .cc-pending  .cc-top-bar, .cc-reviewed .cc-top-bar { background: linear-gradient(90deg,#d97706,#fcd34d); }
    .cc-interview .cc-top-bar { background: linear-gradient(90deg,#7c3aed,#a78bfa); }
    .cc-approved .cc-top-bar { background: linear-gradient(90deg,#059669,#34d399); }
    .cc-rejected .cc-top-bar { background: linear-gradient(90deg,#dc2626,#f87171); }

    .cc-body { padding: 18px 20px 16px; }
    .cc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .cc-avatar { width: 42px; height: 42px; border-radius: 50%; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid; }
    .cc-new      .cc-avatar { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
    .cc-pending  .cc-avatar, .cc-reviewed .cc-avatar { background: #fef3c7; color: #d97706; border-color: #fde68a; }
    .cc-interview .cc-avatar { background: #ede9fe; color: #7c3aed; border-color: #ddd6fe; }
    .cc-approved .cc-avatar { background: #d1fae5; color: #059669; border-color: #a7f3d0; }
    .cc-rejected .cc-avatar { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
    .cc-info { flex: 1; min-width: 0; }
    .cc-name { font-size: 14.5px; font-weight: 700; color: var(--text); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cc-date { font-size: 12px; color: var(--muted); margin: 0; }

    /* Status badge */
    .cc-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
    .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
    .badge-new, .badge-pending, .badge-reviewed { color: #d97706; background: #fef3c7; }
    .badge-interview { color: #7c3aed; background: #ede9fe; }
    .badge-approved  { color: #059669; background: #d1fae5; }
    .badge-rejected  { color: #dc2626; background: #fee2e2; }

    /* Cover letter */
    .cc-cover { font-size: 12.5px; color: var(--muted); line-height: 1.6; margin: 0 0 14px; font-style: italic; padding: 10px 12px; background: #fafaf7; border-radius: 8px; border-left: 3px solid var(--border); }

    /* Actions */
    .cc-actions { display: flex; gap: 7px; flex-wrap: wrap; padding-top: 14px; border-top: 1px solid #f3f4f6; }
    .ca-btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 9px; padding: 7px 12px; font-size: 12.5px; font-weight: 600; cursor: pointer; border: 1.5px solid; transition: all .15s; }
    .ca-cv        { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; } .ca-cv:hover { background: #dbeafe; }
    .ca-accept    { background: #d1fae5; border-color: #a7f3d0; color: #059669; } .ca-accept:hover { background: #a7f3d0; }
    .ca-interview { background: #ede9fe; border-color: #ddd6fe; color: #7c3aed; } .ca-interview:hover { background: #ddd6fe; }
    .ca-reject    { background: #fee2e2; border-color: #fecaca; color: #dc2626; } .ca-reject:hover { background: #fecaca; }

    /* Interview info */
    .cc-interview-info { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 9px 12px; background: #ede9fe; border: 1.5px solid #ddd6fe; border-radius: 9px; font-size: 12px; flex-wrap: wrap; }
    .iv-label { font-size: 11px; font-weight: 700; color: #7c3aed; }
    .iv-date { color: var(--text); font-weight: 600; flex: 1; }
    .iv-link { color: var(--accent); text-decoration: none; font-weight: 700; font-size: 12px; white-space: nowrap; }
    .iv-link:hover { color: var(--accent-dark); }

    /* EMPTY STATE */
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; gap: 10px; }
    .empty-icon { font-size: 52px; margin-bottom: 8px; }
    .empty-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-sub { font-size: 13.5px; color: var(--muted); margin: 0; }

    /* MATCHING PANEL */
    .matching-panel { background: #fff; border: 1.5px solid var(--border); border-radius: 18px; padding: 24px; margin: 20px 32px 0; box-shadow: var(--shadow); }
    .mp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .mp-title { font-size: 16px; font-weight: 800; color: var(--text); margin: 0 0 3px; }
    .mp-subtitle { font-size: 12.5px; color: var(--muted); margin: 0; }
    .mp-close { background: #f3f4f6; border: none; color: var(--muted); font-size: 14px; cursor: pointer; padding: 6px 10px; border-radius: 8px; transition: all .15s; } .mp-close:hover { background: #e5e7eb; color: var(--text); }
    .mp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .mp-card { background: #fafaf7; border: 1.5px solid var(--border); border-radius: 14px; padding: 16px; display: flex; gap: 14px; align-items: flex-start; transition: box-shadow .15s, transform .15s; }
    .mp-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .mp-score-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
    .mp-score { width: 52px; height: 52px; border-radius: 50%; border: 3px solid; display: flex; align-items: center; justify-content: center; flex-direction: column; line-height: 1; }
    .mp-score-num { font-size: 14px; font-weight: 800; }
    .mp-score-pct { font-size: 9px; font-weight: 600; opacity: .7; }
    .mp-score-label { font-size: 10px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .mp-score.excellent { border-color: #059669; color: #059669; background: #d1fae5; }
    .mp-score.bon       { border-color: var(--accent); color: var(--accent-dark); background: #fef3c7; }
    .mp-score.moyen     { border-color: #9ca3af; color: #6b7280; background: #f3f4f6; }
    .mp-info { flex: 1; min-width: 0; }
    .mp-name { font-size: 13.5px; font-weight: 700; color: var(--text); margin: 0 0 2px; }
    .mp-sub { font-size: 12px; color: var(--muted); margin: 0 0 8px; }
    .mp-skills { display: flex; flex-wrap: wrap; gap: 4px; }
    .mp-skill { font-size: 11px; padding: 3px 8px; border-radius: 6px; background: #fff; color: var(--muted); border: 1px solid var(--border); font-weight: 500; }
    .mp-cv { color: var(--accent); font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; padding: 5px 10px; background: #fef3c7; border-radius: 8px; border: 1px solid rgba(245,158,11,0.3); transition: all .15s; }
    .mp-cv:hover { background: #fde68a; }
    .mp-empty { color: var(--muted); text-align: center; padding: 30px; grid-column: 1/-1; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px; }

    /* MODAL */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: #fff; border-radius: 20px; width: 500px; max-width: 95vw; box-shadow: 0 24px 64px rgba(0,0,0,0.15); overflow: hidden; }
    .modal-header { display: flex; align-items: center; gap: 14px; padding: 22px 24px 18px; border-bottom: 1px solid #f3f4f6; background: linear-gradient(135deg,#1a1a2e,#24243e); }
    .modal-header-icon { font-size: 24px; width: 48px; height: 48px; background: rgba(245,158,11,0.2); border: 1.5px solid rgba(245,158,11,0.4); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .modal-header-text { flex: 1; }
    .modal-title { font-size: 16px; font-weight: 800; color: #fff; margin: 0 0 3px; }
    .modal-sub { font-size: 12.5px; color: rgba(255,255,255,0.6); margin: 0; }
    .modal-close { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer; padding: 6px 10px; border-radius: 8px; transition: all .15s; } .modal-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
    .modal-body { padding: 22px 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .modal-input { background: #fafaf7; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; color: var(--text); font-size: 13.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; transition: border-color .15s, box-shadow .15s; }
    .modal-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #f3f4f6; background: #fafaf7; }
    .mf-cancel { background: #fff; border: 1.5px solid var(--border); color: var(--muted); border-radius: 12px; padding: 10px 20px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .15s; } .mf-cancel:hover { border-color: var(--accent); color: var(--text); }
    .mf-submit { background: var(--accent); border: none; color: #1a1a2e; border-radius: 12px; padding: 10px 22px; font-size: 13.5px; font-weight: 800; cursor: pointer; transition: all .2s; box-shadow: 0 4px 14px rgba(245,158,11,0.35); }
    .mf-submit:hover { background: var(--accent-dark); color: #fff; transform: translateY(-1px); }
    .mf-submit:disabled { opacity: .4; cursor: not-allowed; transform: none; }

    @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(3,1fr); } }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2,1fr); } .candidates-grid, .matching-panel { padding-left: 16px; padding-right: 16px; } .toolbar-row { padding: 0 16px; } .stats-grid { padding: 0 16px; } }
    @media (max-width: 640px) { .apps-page { padding-bottom: 40px; } .stats-grid { grid-template-columns: 1fr 1fr; } .filter-tabs { display: none; } .page-hero { padding: 24px 20px 20px; } }
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
