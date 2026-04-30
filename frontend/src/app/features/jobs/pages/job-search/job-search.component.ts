import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { JobService } from '../../services/job.service';
import { CategoryService } from '../../services/category.service';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  Job,
  JobCategory,
  JobFilterRequest,
  PageResponse,
  JOB_TYPE_LABELS,
  ContractType,
  ExperienceLevel
} from '../../models/job.models';
import { API_ENDPOINTS } from '../../../../core/api/api.config';

@Component({
  selector: 'app-job-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="jobs-page">
  <div class="platform-alert" *ngIf="platformAlert" [class.success]="platformAlert.type === 'success'" [class.error]="platformAlert.type === 'error'">
    <span class="alert-icon">{{ platformAlert.type === 'success' ? '✅' : '⚠️' }}</span>
    <span class="alert-text">{{ platformAlert.message }}</span>
    <button type="button" class="alert-close" (click)="dismissPlatformAlert()">✕</button>
  </div>

  <!-- HERO -->
  <div class="hero">
    <div class="hero-badge">
      <span class="pulse-dot"></span>
      {{ page?.totalElements || 0 | number }} OFFRES ACTIVES
    </div>
    <h1 class="hero-title">Find your next challenge</h1>
    <p class="hero-sub">Explore the best opportunities tailored to your profile</p>

    <div class="hero-search">
      <input [(ngModel)]="filter.keyword" (keyup.enter)="load()"
        placeholder="Job title, skill..." class="hs-input" />
      <select [(ngModel)]="filter.contractType" (change)="load()" class="hs-select">
        <option value="">All types</option>
        <option value="FULL_TIME">Full Time</option>
        <option value="PART_TIME">Part Time</option>
        <option value="FREELANCE">Freelance</option>
        <option value="INTERNSHIP">Internship</option>
        <option value="REMOTE">Remote</option>
        <option value="CONTRACT">Contract</option>
      </select>
      <select [(ngModel)]="filter.categoryId" (change)="load()" class="hs-select">
        <option [ngValue]="undefined">All categories</option>
        <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
      </select>
      <button class="hs-btn" (click)="load()">🔍 Search</button>
    </div>

    <div class="hero-stats">
      <div class="hstat">
        <span class="hstat-val cyan">{{ page?.totalElements || 0 | number }}</span>
        <span class="hstat-lbl">OFFERS</span>
      </div>
      <div class="hstat-div"></div>
      <div class="hstat">
        <span class="hstat-val cyan">348</span>
        <span class="hstat-lbl">COMPANIES</span>
      </div>
      <div class="hstat-div"></div>
      <div class="hstat">
        <span class="hstat-val cyan">87</span>
        <span class="hstat-lbl">NEW / DAY</span>
      </div>
      <div class="hstat-div"></div>
      <div class="hstat">
        <span class="hstat-val cyan">94%</span>
        <span class="hstat-lbl">MATCH RATE</span>
      </div>
    </div>
  </div>

  <!-- LAYOUT -->
  <div class="results-layout">

    <!-- SIDEBAR -->
    <aside class="sidebar">
      <p class="sidebar-title">FILTERS</p>

      <div class="sf-group">
        <label class="sf-label">LOCATION</label>
        <input [(ngModel)]="filter.country" (keyup.enter)="load()"
          placeholder="Country, city..." class="sf-input" />
      </div>

      <div class="sf-group">
        <label class="sf-label">CONTRACT</label>
        <div class="chip-row">
          <button class="chip" [class.active]="filter.contractType === 'FULL_TIME'"
            (click)="toggleContractType('FULL_TIME')">Full Time</button>
          <button class="chip" [class.active]="filter.contractType === 'REMOTE'"
            (click)="toggleContractType('REMOTE')">Remote</button>
          <button class="chip" [class.active]="filter.contractType === 'FREELANCE'"
            (click)="toggleContractType('FREELANCE')">Freelance</button>
          <button class="chip" [class.active]="filter.contractType === 'INTERNSHIP'"
            (click)="toggleContractType('INTERNSHIP')">Internship</button>
        </div>
      </div>

   <div class="sf-group">
  <label class="sf-label">EXPERIENCE</label>
  <div class="chip-row">

    <button
      class="chip"
      [class.active]="filter.experienceLevel === 'ENTRY_LEVEL'"
      (click)="toggleExp('ENTRY_LEVEL')">
      Junior
    </button>

    <button
      class="chip"
      [class.active]="filter.experienceLevel === 'TWO_TO_FIVE_YEARS'"
      (click)="toggleExp('TWO_TO_FIVE_YEARS')">
      Mid
    </button>

    <button
      class="chip"
      [class.active]="filter.experienceLevel === 'SENIOR'"
      (click)="toggleExp('SENIOR')">
      Senior
    </button>

  </div>
</div>

      <div class="sf-group">
        <label class="sf-label">MIN SALARY (K$)</label>
        <input type="number" [(ngModel)]="filter.salaryMin" (keyup.enter)="load()"
          placeholder="e.g. 30" class="sf-input" />
      </div>

      <button class="btn-reset" (click)="resetFilters()">Reset</button>
    </aside>

    <!-- JOBS -->
    <div class="jobs-col">
      <div class="results-bar" *ngIf="page">
        <span class="results-count"><strong>{{ page.totalElements }}</strong> results found</span>
        <select [(ngModel)]="filter.sortBy" (change)="load()" class="sort-sel">
          <option value="createdAt">Most recent</option>
          <option value="applicationCount">Most popular</option>
          <option value="startSalary">Salary</option>
        </select>
      </div>

      <div class="loading-wrap" *ngIf="loading">
        <div class="loader"></div>
      </div>

      <div class="job-card" *ngFor="let job of jobs">
        <!-- Match bar -->
        <div class="match-bar-wrap" *ngIf="job.matchingScore">
          <div class="match-bar" [style.width.%]="job.matchingScore"></div>
          <span class="match-pct">{{ job.matchingScore }}%</span>
        </div>

        <div class="jc-inner">
          <div class="jc-logo">
            <img *ngIf="job.company.logo" [src]="job.company.logo" />
            <div class="logo-ph" *ngIf="!job.company.logo">{{ (job.company.name || '?')[0] }}</div>
          </div>

          <div class="jc-body">
            <div class="jc-top">
              <div>
                <div class="jc-badges">
                  <span class="badge-featured" *ngIf="job.isFeatured">FEATURED</span>
                  <span class="badge-urgent" *ngIf="job.isUrgent">URGENT</span>
                </div>
                <h3 class="jc-title" (click)="openDetail(job)">{{ job.title }}</h3>
                <p class="jc-company">{{ job.company.name }} · {{ job.country || 'Remote' }}</p>
              </div>
              <button class="btn-fav" (click)="toggleSave(job)">
                <span [style.color]="job.isSaved ? '#f7b731' : '#3a3f5c'">♥</span>
              </button>
            </div>

            <p class="jc-desc">{{ job.description | slice:0:130 }}...</p>

            <div class="jc-pills">
              <span class="type-pill" [class]="pillClass(job.contractType)">{{ getLabel(job.contractType) }}</span>
              <span class="salary-pill" *ngIf="job.startSalary">{{ job.startSalary }}k – {{ job.lastSalary }}k$</span>
              <span class="loc-pill" *ngIf="job.state">{{ job.state }}</span>
            </div>

            <div class="jc-meta">
              <span class="meta-item">👥 {{ job.applicationCount || 0 }} applicants</span>
              <span class="meta-item" *ngIf="job.postDate">📅 {{ job.postDate | date:'d MMM y' }}</span>
            </div>

            <div class="jc-tags">
              <span class="tag" *ngFor="let t of (job.tags || []).slice(0,4)">{{ t }}</span>
            </div>
          </div>

          <div class="jc-actions">
            <button class="btn-apply" (click)="apply(job)" *ngIf="!auth.isEmployer()">
              {{ auth.isLoggedIn() ? 'Apply' : 'Login' }}
            </button>
            <button class="btn-see" (click)="openDetail(job)">View offer</button>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="!loading && jobs.length === 0">
        <p>No offers found</p>
        <button (click)="resetFilters()" class="btn-reset-inline">Clear filters</button>
      </div>

      <div class="pagination" *ngIf="page && page.totalPages > 1">
        <button (click)="changePage(page!.page - 1)" [disabled]="page.first">‹</button>
        <button *ngFor="let p of pageNumbers()" (click)="changePage(p)" [class.active]="p === page!.page">{{ p+1 }}</button>
        <span *ngIf="page.totalPages > 6" class="pag-dots">...</span>
        <button *ngIf="page.totalPages > 6" (click)="changePage(page!.totalPages - 1)">{{ page.totalPages }}</button>
        <button (click)="changePage(page!.page + 1)" [disabled]="page.last">›</button>
      </div>
    </div>
  </div>

  <!-- APPLY MODAL -->
  <div class="modal-overlay" *ngIf="applyJob" (click)="closeApply()">
    <div class="modal-box" (click)="$event.stopPropagation()">

      <!-- Header -->
      <div class="modal-header">
        <div class="modal-logo">
          <img *ngIf="applyJob.company.logo" [src]="applyJob.company.logo" [alt]="applyJob.company.name" />
          <div class="logo-ph" *ngIf="!applyJob.company.logo">{{ (applyJob.company.name || '?')[0] }}</div>
        </div>
        <div class="modal-header-info">
          <h5 class="modal-title">Apply — {{ applyJob.title }}</h5>
          <p class="modal-sub">{{ applyJob.company.name }} · {{ applyJob.country }}</p>
        </div>
        <button class="modal-close" (click)="closeApply()" title="Close">✕</button>
      </div>

      <!-- ══ SUCCESS SCREEN ══ -->
      <ng-container *ngIf="applySuccess">
        <div class="success-screen">
          <div class="success-icon-wrap">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="rgba(22,163,74,0.12)"/>
              <circle cx="28" cy="28" r="20" fill="rgba(22,163,74,0.18)"/>
              <path d="M18 28l7 7 13-13" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h5 class="success-title">Application Sent!</h5>
          <p class="success-msg">
            Your application for <strong>{{ applyJob.title }}</strong> at
            <strong>{{ applyJob.company.name }}</strong> has been submitted successfully.
          </p>
          <p class="success-hint">The recruiter will review your profile and get back to you.</p>
          <div class="success-actions">
            <a routerLink="/jobs/candidate/applications" class="mf-view-apps" (click)="closeApply()">
              📋 View My Applications
            </a>
            <button class="mf-cancel" (click)="closeApply()">Close</button>
          </div>
        </div>
      </ng-container>

      <!-- ══ ALREADY APPLIED SCREEN ══ -->
      <ng-container *ngIf="!applySuccess && errorMessage && errorMessage.toLowerCase().includes('already')">
        <div class="already-applied-banner">
          <div class="aab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#f59e0b" opacity="0.15"/>
              <circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="1.5"/>
              <path d="M12 8v4m0 4h.01" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="aab-content">
            <p class="aab-title">Already Applied</p>
            <p class="aab-msg">You have already submitted an application for this position. Track its status in <strong>My Applications</strong>.</p>
          </div>
        </div>
        <div class="modal-footer">
          <a routerLink="/jobs/candidate/applications" class="mf-view-apps" (click)="closeApply()">View My Applications</a>
          <button class="mf-cancel" (click)="closeApply()">Close</button>
        </div>
      </ng-container>

      <!-- ══ FORM ══ -->
      <ng-container *ngIf="!applySuccess && (!errorMessage || !errorMessage.toLowerCase().includes('already'))">
        <div class="modal-body">
          <label class="modal-label">Cover letter <span class="required">*</span></label>
          <textarea [(ngModel)]="coverLetter" rows="5"
            placeholder="Describe your motivation, skills and why you're a great fit..."
            [class.input-error]="!coverLetter && submitting"></textarea>
          <p class="field-hint" *ngIf="!coverLetter && submitting">Cover letter is required.</p>

          <label class="modal-label">Resume <span class="label-hint">(PDF, DOC — max 5 MB)</span></label>
          <div class="file-drop" [class.file-selected]="resumeFile">
            <input type="file" accept=".pdf,.doc,.docx" (change)="onFileChange($event)" id="fileUpload" />
            <label for="fileUpload">
              <span class="file-icon">{{ resumeFile ? '✅' : '📎' }}</span>
              <span *ngIf="!resumeFile">Choose a file or drag & drop</span>
              <span *ngIf="resumeFile" class="file-name-ok">{{ resumeFile.name }}</span>
            </label>
          </div>
        </div>

        <!-- Generic error -->
        <div class="apply-error" *ngIf="errorMessage && !errorMessage.toLowerCase().includes('already')">
          <span>⚠️</span> {{ errorMessage }}
        </div>

        <div class="modal-footer">
          <button class="mf-cancel" (click)="closeApply()">Cancel</button>
          <button class="mf-submit" (click)="submitApply()" [disabled]="submitting">
            <span *ngIf="!submitting">Submit application</span>
            <span *ngIf="submitting" class="spinner-inline"></span>
          </button>
        </div>
      </ng-container>

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

    .jobs-page {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: 'Segoe UI', system-ui, sans-serif;
      padding-bottom: 60px;
    }

    .platform-alert {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1300;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 280px;
      max-width: 460px;
      border-radius: 12px;
      padding: 12px 14px;
      border: 1px solid;
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
      animation: slideInAlert 0.22s ease-out;
    }
    .platform-alert.success {
      background: rgba(22,163,74, 0.14);
      border-color: rgba(0, 212, 180, 0.35);
      color: #16a34a;
    }
    .platform-alert.error {
      background: rgba(240, 101, 72, 0.14);
      border-color: rgba(240, 101, 72, 0.35);
      color: #f06548;
    }
    .alert-icon { font-size: 15px; line-height: 1; }
    .alert-text { font-size: 13px; font-weight: 600; flex: 1; }
    .alert-close {
      border: none;
      background: transparent;
      color: inherit;
      font-size: 14px;
      cursor: pointer;
      opacity: 0.85;
      padding: 0 2px;
    }
    .alert-close:hover { opacity: 1; }
    @keyframes slideInAlert {
      from { opacity: 0; transform: translateY(-8px) translateX(12px); }
      to { opacity: 1; transform: translateY(0) translateX(0); }
    }

    /* ── HERO ── */
    .hero {
      background: #1a1a2e;
      padding: 40px 28px 0;
      border-bottom: 1px solid rgba(245,158,11,0.2);
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -100px; right: -150px;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 11px; font-weight: 700;
      letter-spacing: 1px; padding: 5px 14px; border-radius: 20px;
      margin-bottom: 18px;
    }
    .pulse-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #f59e0b;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }

    .hero-title {
      font-size: 38px; font-weight: 800; color: #ffffff; margin: 0 0 8px;
      letter-spacing: -0.5px;
    }
    .hero-sub { font-size: 15px; color: rgba(255,255,255,0.7); margin: 0 0 28px; }

    .hero-search {
      display: flex; gap: 10px; flex-wrap: wrap;
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 12px; margin-bottom: 0;
    }
    .hs-input {
      flex: 2; min-width: 180px;
      background: #fff; color: #1a1d2e;
      border: none; border-radius: 8px; padding: 10px 14px;
      font-size: 14px; outline: none;
    }
    .hs-select {
      flex: 1; min-width: 140px;
      background: #fff; color: #1a1d2e;
      border: none; border-radius: 8px; padding: 10px 12px;
      font-size: 13px; outline: none; cursor: pointer;
    }
    .hs-btn {
      background: #f59e0b; color: #1a1a2e;
      border: none; border-radius: 8px; padding: 10px 22px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      white-space: nowrap; transition: background .2s;
    }
    .hs-btn:hover { background: #e08e00; }

    .hero-stats {
      display: flex; align-items: center; gap: 0;
      padding: 24px 0 20px; margin-top: 16px;
    }
    .hstat { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
    .hstat-val { font-size: 28px; font-weight: 800; }
    .hstat-val.cyan { color: #f59e0b; }
    .hstat-lbl { font-size: 10px; color: rgba(255,255,255,0.6); letter-spacing: 1px; font-weight: 600; }
    .hstat-div { width: 1px; height: 40px; background: rgba(255,255,255,0.2); }

    /* ── LAYOUT ── */
    .results-layout { display: flex; gap: 20px; padding: 24px 28px 0; align-items: flex-start; }

    /* ── SIDEBAR ── */
    .sidebar { width: 200px; flex-shrink: 0; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; position: sticky; top: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .sidebar-title { font-size: 11px; font-weight: 800; color: #f59e0b;
      letter-spacing: 1.5px; margin: 0 0 18px;
    }
    .sf-group { margin-bottom: 20px; }
    .sf-label { font-size: 10px; font-weight: 700; color: #f59e0b;
      letter-spacing: 1px; display: block; margin-bottom: 8px;
    }
    .sf-input { width: 100%; background: #ffffff; border: 1px solid var(--border);
      border-radius: 7px; padding: 8px 10px;
      font-size: 13px; color: var(--text); outline: none; box-sizing: border-box; } .sf-input:focus { border-color: #f59e0b; }
    .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { background: #ffffff; border: 1px solid var(--border); color: var(--text-muted); border-radius: 20px;
      padding: 4px 11px; font-size: 12px; cursor: pointer;
      transition: all .15s;
    }
    .chip.active, .chip:hover { background: var(--accent-light); border-color: #f59e0b; color: #f59e0b; }
    .btn-reset { width: 100%; background: none; border: 1px solid var(--border);
      border-radius: 7px; padding: 8px; font-size: 12.5px;
      color: var(--text-muted); cursor: pointer; margin-top: 4px; transition: all .15s; } .btn-reset:hover { border-color: #ef4444; color: #ef4444; }

    /* ── JOBS COL ── */
    .jobs-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }

    .results-bar {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13.5px; color: #6b7280;
    }
    .results-count strong { color: var(--text); }
    .sort-sel { background: #ffffff; border: 1px solid var(--border); color: var(--text); border-radius: 7px; padding: 6px 12px;
      font-size: 13px; outline: none; cursor: pointer;
    }

    /* ── JOB CARD ── */
    .job-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; transition: border-color .2s, transform .15s; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .job-card:hover { border-color: rgba(245,158,11,0.4); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

    .match-bar-wrap { height: 3px; background: var(--border);
      position: relative;
    }
    .match-bar { height: 100%; background: linear-gradient(90deg, #f59e0b, #f97316); }
    .match-pct { position: absolute; right: 10px; top: 6px; font-size: 11px; color: #f59e0b; font-weight: 700; }

    .jc-inner { display: flex; gap: 14px; padding: 18px; align-items: flex-start; }

    .jc-logo { width: 46px; height: 46px; border-radius: 10px; border: 1px solid var(--border);
      overflow: hidden; flex-shrink: 0;
    }
    .jc-logo img { width: 100%; height: 100%; object-fit: cover; }
    .logo-ph { width: 100%; height: 100%; background: linear-gradient(135deg, #f59e0b, #f97316); color: #ffffff; font-size: 18px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }

    .jc-body { flex: 1; min-width: 0; }
    .jc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .jc-badges { display: flex; gap: 6px; margin-bottom: 4px; }
    .badge-featured { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; background: var(--accent-light); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .badge-urgent {
      font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
      padding: 2px 8px; border-radius: 4px;
      background: rgba(240,101,72,0.15); color: #f06548;
      border: 1px solid rgba(240,101,72,0.3);
    }
    .jc-title { font-size: 15px; font-weight: 700; color: var(--text);
      margin: 0 0 2px; cursor: pointer;
    }
    .jc-title:hover { color: #f59e0b; }
    .jc-company { font-size: 12.5px; color: #6b7280; margin: 0; }
    .btn-fav { background: none; border: none; cursor: pointer; font-size: 20px; padding: 4px; }

    .jc-desc { font-size: 13px; color: #6b7280; line-height: 1.5; margin: 8px 0; }

    .jc-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .type-pill {
      font-size: 12px; font-weight: 600; padding: 3px 10px;
      border-radius: 6px; border: 1px solid;
    }
    .pill-full_time   { background: #fef3c7;  color: #f59e0b; border-color: #f59e0b; }
    .pill-part_time   { background: rgba(212,160,23,0.1);  color: #d4a017; border-color: rgba(212,160,23,0.25); }
    .pill-freelance   { background: rgba(22,163,74,0.1);   color: #16a34a; border-color: rgba(5,150,105,0.25); }
    .pill-internship  { background: rgba(132,94,247,0.1);  color: #845ef7; border-color: rgba(132,94,247,0.25); }
    .pill-remote      { background: rgba(23,162,184,0.1);  color: #17a2b8; border-color: rgba(23,162,184,0.25); }
    .pill-contract    { background: rgba(240,101,72,0.1);  color: #f06548; border-color: rgba(240,101,72,0.25); }
    .pill-default     { background: rgba(255,255,255,0.05); color: #6b7280; border-color: #e8e0d0; }
    .salary-pill { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 6px; background: var(--accent-light); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .loc-pill { font-size: 12px; padding: 3px 10px; border-radius: 6px; background: #ffffff; color: var(--text-muted); border: 1px solid var(--border); }

    .jc-meta { display: flex; gap: 14px; font-size: 12px; color: #9ca3af; margin-bottom: 8px; }

    .jc-tags { display: flex; flex-wrap: wrap; gap: 5px; }
    .tag { font-size: 11px; padding: 2px 9px; border-radius: 20px; background: #ffffff; color: var(--text-muted); border: 1px solid var(--border); }

    .jc-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .btn-apply { background: #1a1a2e; color: #fff; border: none; border-radius: 12px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background .2s; } .btn-apply:hover { background: #2d2d4e; }
    .btn-apply:disabled { opacity: .5; cursor: not-allowed; }
    .btn-see { background: #ffffff; color: var(--text); border: 1px solid var(--border); border-radius: 12px; padding: 8px 18px; font-size: 13px; cursor: pointer; white-space: nowrap; transition: all .15s; } .btn-see:hover { border-color: #f59e0b; color: #f59e0b; }

    /* ── PAGINATION ── */
    .pagination {
      display: flex; justify-content: center; gap: 6px;
      margin-top: 8px; flex-wrap: wrap;
    }
    .pagination button { background: #ffffff; border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 7px 13px; font-size: 13px; cursor: pointer; transition: all .15s; } .pagination button:hover { border-color: #f59e0b; color: #f59e0b; } .pagination button.active { background: #f59e0b; color: #fff; border-color: #f59e0b; }
    .pagination button:disabled { opacity: .3; cursor: not-allowed; }
    .pag-dots { color: #9ca3af; line-height: 32px; }

    /* ── EMPTY ── */
    .empty { text-align: center; padding: 60px; color: #9ca3af; }
    .btn-reset-inline { margin-top: 12px; background: var(--accent-light); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); border-radius: 7px; padding: 8px 18px; font-size: 13px; cursor: pointer; }

    /* ── LOADING ── */
    .loading-wrap { display: flex; justify-content: center; padding: 60px; }
    .loader {
      width: 36px; height: 36px;
      border: 3px solid var(--border); border-top-color: #f59e0b;
      border-radius: 50%; animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── MODAL ── */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-box {
      background: #ffffff; border: 1px solid var(--border);
      border-radius: 20px; width: 540px; max-width: 95vw;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18);
      overflow: hidden;
      animation: modalIn 0.22s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }

    .modal-header {
      display: flex; align-items: center; gap: 14px;
      padding: 22px 24px; border-bottom: 1px solid var(--border);
      background: #fafafa;
    }
    .modal-logo { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; flex-shrink: 0; border: 1px solid var(--border); }
    .modal-logo img { width: 100%; height: 100%; object-fit: cover; }
    .logo-ph { width: 100%; height: 100%; background: linear-gradient(135deg,#f59e0b,#f97316); color:#fff; font-size:18px; font-weight:800; display:flex; align-items:center; justify-content:center; }
    .modal-header-info { flex: 1; min-width: 0; }
    .modal-title { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 3px; }
    .modal-sub { font-size: 12.5px; color: #6b7280; margin: 0; }
    .modal-close { margin-left: auto; background: none; border: none; color: #9ca3af; font-size: 18px; cursor: pointer; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:background .15s; flex-shrink:0; }
    .modal-close:hover { background: #f1f5f9; color: #374151; }

    /* Already applied banner */
    .already-applied-banner {
      display: flex; gap: 14px; align-items: flex-start;
      margin: 20px 24px 4px;
      padding: 16px 18px;
      background: linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.06));
      border: 1.5px solid rgba(245,158,11,0.35);
      border-radius: 14px;
    }
    .aab-icon { flex-shrink: 0; margin-top: 2px; }
    .aab-content { flex: 1; }
    .aab-title { font-size: 14px; font-weight: 700; color: #b45309; margin: 0 0 5px; }
    .aab-msg { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; }
    .aab-msg strong { color: #374151; }

    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
    .modal-label { font-size: 12.5px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; }
    .required { color: #ef4444; margin-left: 2px; }
    .label-hint { font-weight: 400; color: #9ca3af; font-size: 11.5px; }
    .modal-body textarea {
      background: #ffffff; border: 1.5px solid var(--border); border-radius: 10px;
      padding: 10px 13px; color: var(--text); font-size: 13.5px;
      resize: vertical; outline: none; font-family: inherit;
      width: 100%; box-sizing: border-box; transition: border-color .15s;
      min-height: 110px;
    }
    .modal-body textarea:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    .modal-body textarea.input-error { border-color: #ef4444; }
    .field-hint { font-size: 11.5px; color: #ef4444; margin: -6px 0 0; }

    .file-drop {
      border: 1.5px dashed #d1d5db; border-radius: 10px;
      padding: 16px; text-align: center; cursor: pointer;
      transition: border-color .15s, background .15s;
      background: #fafafa;
    }
    .file-drop:hover { border-color: #f59e0b; background: rgba(245,158,11,0.04); }
    .file-drop.file-selected { border-color: #16a34a; background: rgba(22,163,74,0.04); border-style: solid; }
    .file-drop input { display: none; }
    .file-drop label { cursor: pointer; font-size: 13px; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .file-icon { font-size: 18px; }
    .file-name-ok { color: #16a34a; font-weight: 600; }

    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px; border-top: 1px solid var(--border);
      background: #fafafa;
    }
    .mf-cancel { background: none; border: 1.5px solid var(--border); border-radius: 12px; padding: 9px 20px; font-size: 13px; color: var(--text-muted); cursor: pointer; transition: all .15s; }
    .mf-cancel:hover { border-color: #9ca3af; color: #374151; }
    .mf-submit {
      background: #1a1a2e; color: #fff; border: none; border-radius: 12px;
      padding: 9px 22px; font-size: 13px; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; gap: 8px; transition: background .2s;
    }
    .mf-submit:hover:not(:disabled) { background: #2d2d4e; }
    .mf-submit:disabled { opacity: .55; cursor: not-allowed; }
    .mf-view-apps {
      background: #f59e0b; color: #1a1a2e; border: none; border-radius: 12px;
      padding: 9px 20px; font-size: 13px; font-weight: 700; cursor: pointer;
      text-decoration: none; display: inline-flex; align-items: center;
      transition: background .2s;
    }
    .mf-view-apps:hover { background: #e08e00; }
    .spinner-inline {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite;
    }
    .apply-success {
      margin: 0 24px 4px; padding: 12px 16px;
      background: rgba(22,163,74,0.1); color: #16a34a;
      border: 1.5px solid rgba(22,163,74,0.25); border-radius: 10px;
      font-size: 13.5px; font-weight: 600; display: flex; align-items: center; gap: 8px;
    }
    .apply-error {
      margin: 0 24px 4px; padding: 12px 16px;
      background: rgba(240,101,72,0.08); color: #f06548;
      border: 1.5px solid rgba(240,101,72,0.25); border-radius: 10px;
      font-size: 13.5px; display: flex; align-items: center; gap: 8px;
    }

    /* ── SUCCESS SCREEN ── */
    .success-screen {
      display: flex; flex-direction: column; align-items: center;
      padding: 36px 28px 28px; text-align: center; gap: 12px;
      animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    .success-icon-wrap {
      animation: successPop 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes successPop {
      from { transform: scale(0.5); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
    .success-title {
      font-size: 20px; font-weight: 800; color: #1a1a2e; margin: 4px 0 0;
    }
    .success-msg {
      font-size: 14px; color: #374151; line-height: 1.6; margin: 0;
      max-width: 340px;
    }
    .success-msg strong { color: #1a1a2e; }
    .success-hint {
      font-size: 12.5px; color: #9ca3af; margin: 0;
    }
    .success-actions {
      display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; justify-content: center;
    }
  `]
})
export class JobSearchComponent implements OnInit {
  private jobSvc  = inject(JobService);
  private appSvc  = inject(ApplicationService);
  private catSvc  = inject(CategoryService);
  private router  = inject(Router);
  private http    = inject(HttpClient);
  private cdr     = inject(ChangeDetectorRef);
  auth             = inject(AuthService);

  readonly publicBase = API_ENDPOINTS['jobs'];

  jobs: Job[] = [];
  categories: JobCategory[] = [];
  page: PageResponse<Job> | null = null;
  loading = false;

  filter: JobFilterRequest = { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' };

  applyJob: Job | null = null;
  coverLetter = '';
  resumeFile: File | null = null;
  submitting = false;
  applySuccess = false;
  errorMessage: string | null = null;
  platformAlert: { type: 'success' | 'error'; message: string } | null = null;
  private platformAlertTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.catSvc.getAll().subscribe({ next: c => this.categories = Array.isArray(c) ? c : [], error: () => {} });
    this.load();
  }

  load(): void {
    this.loading = true;

    let params = new HttpParams();
    const f = this.filter;
    if (f.keyword)         params = params.set('keyword', f.keyword);
    if (f.contractType)    params = params.set('contractType', f.contractType);
    if (f.categoryId != null) params = params.set('categoryId', String(f.categoryId));
    if (f.country)         params = params.set('country', f.country);
    if (f.experienceLevel) params = params.set('experienceLevel', f.experienceLevel);
    params = params.set('page',    String(f.page    ?? 0));
    params = params.set('size',    String(f.size    ?? 10));
    params = params.set('sortBy',  f.sortBy  ?? 'createdAt');
    params = params.set('sortDir', f.sortDir ?? 'desc');

    this.http.get<any>(`${this.publicBase}`, { params }).subscribe({
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
      error: (err: any) => {
        console.error('[JobSearch] load error', err);
        this.jobs = [];
        this.page = null;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

toggleContractType(t: ContractType): void {
  this.filter.contractType =
    this.filter.contractType === t ? undefined : t;

  this.load();
}
toggleExp(level: 'ENTRY_LEVEL' | 'TWO_TO_FIVE_YEARS' | 'SENIOR'): void {
  this.filter.experienceLevel =
    this.filter.experienceLevel === level ? undefined : level;

  this.load();
}
  resetFilters(): void { this.filter = { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' }; this.load(); }
  toggleSave(job: Job): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    const obs = job.isSaved ? this.jobSvc.unsaveJob(job.id) : this.jobSvc.saveJob(job.id);
    obs.subscribe(() => job.isSaved = !job.isSaved);
  }
  openDetail(job: Job): void { this.router.navigate(['/jobs/detail', job.id]); }
  apply(job: Job): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    this.applyJob = job; this.coverLetter = ''; this.resumeFile = null; this.applySuccess = false; this.errorMessage = null;
  }
  closeApply(): void { if (!this.submitting) this.applyJob = null; }
  onFileChange(e: Event): void { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.resumeFile = f; }
submitApply(): void {
  if (!this.applyJob) return;

  this.submitting = true;
  this.errorMessage = null;
  this.applySuccess = false;

  this.appSvc
    .apply(
      {
        jobOfferId: this.applyJob.id,
        coverLetter: this.coverLetter
      },
      this.resumeFile || undefined
    )
    .subscribe({
      next: () => {
        this.submitting = false;
        this.applySuccess = true;
        this.showPlatformAlert('success', 'Application submitted successfully.');

        setTimeout(() => {
          this.applyJob = null;
          this.applySuccess = false;
        }, 2000);
      },

      error: (err) => {
        this.submitting = false;
        const status = Number(err?.status ?? err?.error?.status ?? 0);
        const backendMessage = this.extractBackendMessage(err);

        if (status === 409) {
          const conflictMessage = backendMessage || 'You have already applied to this offer.';
          this.errorMessage = conflictMessage;
          this.showPlatformAlert('error', conflictMessage);
        } else {
          const message = backendMessage || 'Error submitting application.';
          this.errorMessage = message;
          this.showPlatformAlert('error', message);
        }
      }
    });
}
  private extractBackendMessage(err: any): string | null {
    const rawError = err?.error;

    if (!rawError) return null;
    if (typeof rawError === 'string' && rawError.trim()) return rawError.trim();
    if (typeof rawError?.message === 'string' && rawError.message.trim()) return rawError.message.trim();
    if (typeof rawError?.error === 'string' && rawError.error.trim()) return rawError.error.trim();

    return null;
  }

  showPlatformAlert(type: 'success' | 'error', message: string): void {
    this.platformAlert = { type, message };
    if (this.platformAlertTimeoutId) {
      clearTimeout(this.platformAlertTimeoutId);
    }
    this.platformAlertTimeoutId = setTimeout(() => {
      this.platformAlert = null;
      this.platformAlertTimeoutId = null;
    }, 3500);
  }

  dismissPlatformAlert(): void {
    if (this.platformAlertTimeoutId) {
      clearTimeout(this.platformAlertTimeoutId);
      this.platformAlertTimeoutId = null;
    }
    this.platformAlert = null;
  }
  changePage(p: number): void {
    if (!this.page || p < 0 || p >= this.page.totalPages) return;
    this.filter.page = p; this.load(); window.scrollTo(0, 0);
  }
  pageNumbers(): number[] {
    if (!this.page) return [];
    const { totalPages, page: cur } = this.page;
    const start = Math.max(0, cur - 2); const end = Math.min(totalPages - 1, cur + 2);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
  getLabel(type: string | undefined): string { return type ? (JOB_TYPE_LABELS[type] || type) : '—'; }
  pillClass(t: string | undefined): string {
    if (!t) return 'pill-default';
    const k = t.toLowerCase();
    return ['full_time','part_time','freelance','internship','remote','contract'].includes(k) ? `pill-${k}` : 'pill-default';
  }
}