// src/app/features/pages/jobs/pages/admin/admin-stats/admin-stats.component.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { JobStatisticsService, DashboardStats } from '../../../services/statistics.service';
import { API_ENDPOINTS } from '../../../../../core/api/api.config';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="admin-stats-page">
  <div class="page-header">
    <div>
      <h4>Statistiques — Module Emploi</h4>
      <p class="subtitle">Vue d'ensemble des offres, candidatures et recrutements</p>
    </div>
    <div class="header-actions">
      <button class="btn-refresh" (click)="load()">🔄 Actualiser</button>
      <a routerLink="/jobs" class="btn-refresh">🔍 Offres</a>
      <a routerLink="/jobs/employer/applications" class="btn-refresh">📋 Candidatures</a>
    </div>
  </div>

  <!-- Loading -->
  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <ng-container *ngIf="stats && !loading">
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon blue"><i class="bi bi-file-earmark-check-fill"></i></div>
        <div class="kpi-content">
          <p class="kpi-label">Candidatures totales</p>
          <p class="kpi-val">{{ stats.totalApplications | number }}</p>
          <span class="kpi-trend" [class.up]="stats.applicationGrowthPercent > 0" [class.down]="stats.applicationGrowthPercent <= 0">
            {{ stats.applicationGrowthPercent > 0 ? '↑' : '↓' }} {{ stats.applicationGrowthPercent | number:'1.1-1' }}% ce mois
          </span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon purple"><i class="bi bi-camera-video-fill"></i></div>
        <div class="kpi-content">
          <p class="kpi-label">Entretiens conduits</p>
          <p class="kpi-val">{{ stats.totalInterviewed | number }}</p>
          <span class="kpi-trend up">↑ {{ stats.interviewedGrowthPercent | number:'1.1-1' }}%</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon green"><i class="bi bi-check-circle-fill"></i></div>
        <div class="kpi-content">
          <p class="kpi-label">Recrutements réussis</p>
          <p class="kpi-val">{{ stats.totalHired | number }}</p>
          <span class="kpi-trend up">↑ {{ stats.hiredGrowthPercent | number:'1.1-1' }}%</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon red"><i class="bi bi-x-circle-fill"></i></div>
        <div class="kpi-content">
          <p class="kpi-label">Candidatures rejetées</p>
          <p class="kpi-val">{{ stats.totalRejected | number }}</p>
          <span class="kpi-trend down">↓ {{ stats.rejectedGrowthPercent | number:'1.1-1' }}%</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon orange"><i class="bi bi-briefcase-fill"></i></div>
        <div class="kpi-content">
          <p class="kpi-label">Offres publiées</p>
          <p class="kpi-val">{{ stats.totalPublishedJobs | number }}</p>
          <span class="kpi-trend neutral">Actives</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon cyan"><i class="bi bi-building-fill"></i></div>
        <div class="kpi-content">
          <p class="kpi-label">Entreprises actives</p>
          <p class="kpi-val">{{ stats.totalCompanies | number }}</p>
          <span class="kpi-trend neutral">Enregistrées</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon teal"><i class="bi bi-person-fill"></i></div>
        <div class="kpi-content">
          <p class="kpi-label">Candidats inscrits</p>
          <p class="kpi-val">{{ stats.totalCandidates | number }}</p>
          <span class="kpi-trend neutral">Profils</span>
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="charts-row">
      <!-- Monthly trend -->
      <div class="chart-card large">
        <div class="chart-header">
          <h6>Évolution mensuelle {{ selectedYear }}</h6>
        </div>
        <div class="chart-area">
          <div class="bar-chart">
            <div class="bars-area">
              <div class="month-group" *ngFor="let m of monthlyData()">
                <div class="bar-group">
                  <div class="bar bar-blue"   [style.height.%]="getBarPct(m.apps)"       [title]="'Candidatures: ' + m.apps"></div>
                  <div class="bar bar-purple" [style.height.%]="getBarPct(m.interviews)" [title]="'Entretiens: ' + m.interviews"></div>
                  <div class="bar bar-green"  [style.height.%]="getBarPct(m.hired)"      [title]="'Recrutés: ' + m.hired"></div>
                  <div class="bar bar-red"    [style.height.%]="getBarPct(m.rejected)"   [title]="'Rejetés: ' + m.rejected"></div>
                </div>
                <span class="month-label">{{ m.month }}</span>
              </div>
            </div>
          </div>
          <div class="chart-legend">
            <span><span class="dot" style="background:#4f8ef7"></span> Candidatures</span>
            <span><span class="dot" style="background:#845ef7"></span> Entretiens</span>
            <span><span class="dot" style="background:#20c997"></span> Recrutés</span>
            <span><span class="dot" style="background:#f06548"></span> Rejetés</span>
          </div>
        </div>
      </div>

      <!-- By Status donut -->
      <div class="chart-card small">
        <h6 class="chart-header">Candidatures par statut</h6>
        <div class="donut-wrap">
          <div class="donut-chart">
            <svg viewBox="0 0 36 36" class="donut-svg">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f3f3f9" stroke-width="3"/>
              <circle cx="18" cy="18" r="15.9155" fill="none"
                stroke="#4f8ef7" stroke-width="3"
                [attr.stroke-dasharray]="'25 75'"
                stroke-dashoffset="25"/>
            </svg>
            <div class="donut-center">
              <p>{{ stats.totalApplications }}</p>
              <span>total</span>
            </div>
          </div>
        </div>
        <div class="status-list">
          <div class="status-row" *ngFor="let s of statusEntries()">
            <span class="dot" [style.background]="s.color"></span>
            <span class="status-name">{{ s.label }}</span>
            <span class="status-count">{{ s.count }}</span>
            <span class="status-pct">{{ s.pct | number:'1.0-0' }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Second row -->
    <div class="charts-row">
      <!-- Jobs by type -->
      <div class="chart-card small">
        <h6 class="chart-header">Offres par type de contrat</h6>
        <div class="hbar-list">
          <div class="hbar-item" *ngFor="let t of typeEntries()">
            <div class="hbar-label-row">
              <span class="hbar-name">{{ t.label }}</span>
              <span class="hbar-val">{{ t.count }}</span>
            </div>
            <div class="hbar-track">
              <div class="hbar-fill" [style.width.%]="t.pct" [style.background]="t.color"></div>
            </div>
          </div>
          <div *ngIf="typeEntries().length === 0" style="color:#878a99;font-size:13px">Aucune donnée</div>
        </div>
      </div>

      <!-- Jobs by country -->
      <div class="chart-card medium">
        <h6 class="chart-header">Top pays — Offres publiées</h6>
        <div class="country-table">
          <div class="country-row" *ngFor="let c of countryEntries(); let i = index">
            <span class="rank">{{ i + 1 }}</span>
            <span class="country-name">{{ c.name }}</span>
            <div class="country-bar-wrap">
              <div class="country-bar" [style.width.%]="c.pct"></div>
            </div>
            <span class="country-count">{{ c.count }}</span>
          </div>
        </div>
      </div>

      <!-- Jobs by category -->
      <div class="chart-card medium">
        <h6 class="chart-header">Offres par catégorie</h6>
        <div class="cat-table">
          <div class="cat-row" *ngFor="let c of categoryEntries(); let i = index">
            <span class="cat-rank"
              [style.background]="i < 3 ? '#4f8ef7' : '#f3f3f9'"
              [style.color]="i < 3 ? '#fff' : '#878a99'">{{ i + 1 }}</span>
            <span class="cat-name">{{ c.name }}</span>
            <span class="cat-count">{{ c.count }} offres</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent applications table -->
    <div class="table-card">
      <div class="table-header">
        <h6>Candidatures récentes</h6>
        <button class="btn-export" (click)="export()">📥 Exporter CSV</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>CANDIDAT</th>
            <th>OFFRE</th>
            <th>ENTREPRISE</th>
            <th>DATE</th>
            <th>STATUT</th>
            <th>SCORE</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let app of stats.recentApplications">
            <td>
              <div class="cand-cell">
                <div class="cand-av">{{ app.candidateName[0] }}</div>
                <div>
                  <p class="cand-n">{{ app.candidateName }}</p>
                  <p class="cand-e">{{ app.candidateEmail }}</p>
                </div>
              </div>
            </td>
            <td class="td-job">{{ app.jobTitle }}</td>
            <td class="td-co">{{ app.companyName }}</td>
            <td class="td-date">{{ app.applyDate | date:'d MMM y' }}</td>
            <td>
              <span class="status-badge" [class]="'st-' + app.status.toLowerCase()">
                {{ statusFr(app.status) }}
              </span>
            </td>
            <td><span class="score-chip none">—</span></td>
          </tr>
          <tr *ngIf="!stats.recentApplications || stats.recentApplications.length === 0">
            <td colspan="6" class="empty-td">Aucune donnée disponible</td>
          </tr>
        </tbody>
      </table>
    </div>
  </ng-container>
</div>
  `,
  styles: [`
    .admin-stats-page {
      padding: 2.5rem;
      animation: fadeIn 0.4s ease-out;
      background: #f0ece4;
      min-height: 100vh;
    }
    @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

    /* ── HEADER ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 2.5rem;
    }
    .page-header h4 {
      font-size: 2rem; font-weight: 800; color: #1a1a2e;
      margin: 0 0 0.4rem; letter-spacing: -0.02em;
    }
    .subtitle { font-size: 1rem; color: #6b7280; margin: 0; font-weight: 500; }
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .btn-refresh {
      display: flex; align-items: center; gap: 8px;
      padding: 0.75rem 1.5rem; background: white;
      border: 2px solid #e8e0d0; border-radius: 12px;
      font-weight: 700; color: #1a1a2e; cursor: pointer;
      transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      text-decoration: none; font-size: 0.875rem;
    }
    .btn-refresh:hover {
      border-color: #f59e0b; color: #f59e0b;
      background: #fffbeb; transform: translateY(-2px);
    }

    /* ── LOADING ── */
    .loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 5rem; gap: 1.5rem;
    }
    .spinner {
      width: 48px; height: 48px; border: 4px solid #e8e0d0;
      border-top-color: #f59e0b; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── KPI GRID ── */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem; margin-bottom: 2rem;
    }
    .kpi-card {
      background: white; padding: 1.75rem; border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      border: 1px solid #e8e0d0;
      display: flex; align-items: center; gap: 1.25rem;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .kpi-icon {
      width: 64px; height: 64px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; flex-shrink: 0; color: #1a1a2e;
    }
    .kpi-icon.blue    { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .kpi-icon.purple  { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .kpi-icon.green   { background: linear-gradient(135deg, #10b981, #059669); }
    .kpi-icon.red     { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .kpi-icon.orange  { background: #1a1a2e; }
    .kpi-icon.cyan    { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    .kpi-icon.teal    { background: linear-gradient(135deg, #14b8a6, #0d9488); }
    .kpi-content { flex: 1; }
    .kpi-label {
      font-size: 0.8rem; font-weight: 700; color: #6b7280;
      text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.5rem;
    }
    .kpi-val { font-size: 2rem; font-weight: 800; color: #1a1a2e; line-height: 1; margin: 0 0 0.5rem; }
    .kpi-trend {
      font-size: 0.75rem; font-weight: 700;
      padding: 0.3rem 0.7rem; border-radius: 6px; display: inline-block;
    }
    .kpi-trend.up   { background: #d1fae5; color: #065f46; }
    .kpi-trend.down { background: #fee2e2; color: #991b1b; }
    .kpi-trend.neutral { background: #dbeafe; color: #1e40af; }

    /* ── CHARTS ROW ── */
    .charts-row { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .chart-card {
      background: white; border-radius: 16px; padding: 1.75rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e8e0d0;
    }
    .chart-card.large { flex: 2; min-width: 400px; }
    .chart-card.small { flex: 1; min-width: 260px; }
    .chart-card.medium { flex: 1.4; min-width: 300px; }
    .chart-header {
      font-size: 1.1rem; font-weight: 700; color: #1a1a2e;
      margin: 0 0 1.25rem; padding-bottom: 1rem;
      border-bottom: 1px solid #f0ece4;
    }

    /* Bar chart */
    .bar-chart { height: 180px; display: flex; align-items: flex-end; }
    .bars-area { flex: 1; display: flex; align-items: flex-end; gap: 4px; }
    .month-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bar-group { display: flex; gap: 2px; align-items: flex-end; height: 140px; width: 100%; }
    .bar { flex: 1; border-radius: 4px 4px 0 0; min-height: 2px; transition: height 0.4s ease; }
    .bar-blue   { background: linear-gradient(180deg, #3b82f6, #2563eb); }
    .bar-purple { background: linear-gradient(180deg, #8b5cf6, #7c3aed); }
    .bar-green  { background: linear-gradient(180deg, #10b981, #059669); }
    .bar-red    { background: linear-gradient(180deg, #ef4444, #dc2626); }
    .month-label { font-size: 10px; color: #9ca3af; font-weight: 600; }
    .chart-legend { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
    .chart-legend span { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280; font-weight: 600; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

    /* Donut */
    .donut-wrap { display: flex; justify-content: center; margin-bottom: 16px; }
    .donut-chart { position: relative; width: 110px; height: 110px; }
    .donut-svg { transform: rotate(-90deg); }
    .donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .donut-center p { font-size: 22px; font-weight: 800; color: #1a1a2e; margin: 0; }
    .donut-center span { font-size: 11px; color: #9ca3af; font-weight: 600; }
    .status-list { display: flex; flex-direction: column; gap: 10px; }
    .status-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .status-name { flex: 1; color: #374151; font-weight: 500; }
    .status-count { font-weight: 700; color: #1a1a2e; min-width: 28px; text-align: right; }
    .status-pct { color: #9ca3af; min-width: 38px; text-align: right; font-size: 12px; }

    /* Horizontal bars */
    .hbar-list { display: flex; flex-direction: column; gap: 14px; }
    .hbar-label-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
    .hbar-name { color: #374151; font-weight: 600; }
    .hbar-val { font-weight: 700; color: #1a1a2e; }
    .hbar-track { height: 10px; background: #f0ece4; border-radius: 5px; overflow: hidden; }
    .hbar-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease; }

    /* Country / Category tables */
    .country-table, .cat-table { display: flex; flex-direction: column; gap: 12px; }
    .country-row, .cat-row { display: flex; align-items: center; gap: 10px; }
    .rank { font-size: 12px; font-weight: 700; color: #9ca3af; min-width: 18px; }
    .country-name, .cat-name { font-size: 13px; color: #374151; font-weight: 600; min-width: 80px; flex: 1; }
    .country-bar-wrap { flex: 1; height: 8px; background: #f0ece4; border-radius: 4px; overflow: hidden; }
    .country-bar { height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 4px; }
    .country-count { font-size: 13px; font-weight: 700; color: #1a1a2e; min-width: 28px; text-align: right; }
    .cat-rank {
      width: 24px; height: 24px; border-radius: 50%; font-size: 11px;
      font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .cat-count { font-size: 12px; color: #9ca3af; min-width: 60px; text-align: right; }

    /* Recent table */
    .table-card {
      background: white; border-radius: 16px; padding: 1.75rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e8e0d0;
    }
    .table-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid #f0ece4;
    }
    .table-header h6 { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .btn-export {
      display: flex; align-items: center; gap: 6px;
      background: white; border: 2px solid #e8e0d0; border-radius: 10px;
      padding: 0.5rem 1rem; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: all 0.2s; color: #374151;
    }
    .btn-export:hover { border-color: #10b981; color: #10b981; background: #f0fdf4; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      font-size: 11px; font-weight: 700; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 10px 14px; text-align: left; border-bottom: 2px solid #f0ece4;
    }
    .data-table td { padding: 14px 14px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f0ece4; }

    .cand-cell { display: flex; align-items: center; gap: 12px; }
    .cand-av {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #3b82f6, #10b981);
      color: #fff; font-size: 14px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .cand-n { font-size: 13.5px; font-weight: 700; color: #1a1a2e; margin: 0 0 2px; }
    .cand-e { font-size: 12px; color: #9ca3af; margin: 0; }
    .td-job  { font-size: 13px; font-weight: 600; color: #374151; }
    .td-co   { font-size: 12.5px; color: #6b7280; }
    .td-date { font-size: 12.5px; color: #9ca3af; white-space: nowrap; }

    .status-badge { font-size: 11px; padding: 4px 10px; border-radius: 8px; font-weight: 700; }
    .st-new       { background: #dbeafe; color: #1e40af; }
    .st-pending   { background: #fef3c7; color: #92400e; }
    .st-reviewed  { background: #e0f2fe; color: #0369a1; }
    .st-interview { background: #ede9fe; color: #5b21b6; }
    .st-approved  { background: #d1fae5; color: #065f46; }
    .st-rejected  { background: #fee2e2; color: #991b1b; }
    .st-withdrawn { background: #f0ece4; color: #64748b; }

    .score-chip { font-size: 12px; font-weight: 700; color: #16a34a; background: #d1fae5; padding: 3px 9px; border-radius: 6px; }
    .score-chip.none { color: #9ca3af; background: #f0ece4; }
    .empty-td { text-align: center; color: #9ca3af; padding: 40px; font-size: 14px; }

    @media (max-width: 1024px) { .charts-row { flex-direction: column; } .chart-card.large, .chart-card.small, .chart-card.medium { min-width: unset; flex: none; width: 100%; } }
    @media (max-width: 768px) { .admin-stats-page { padding: 1.5rem; } .kpi-grid { grid-template-columns: repeat(2,1fr); } }
  `]
})
export class AdminStatsComponent implements OnInit {
  private statSvc = inject(JobStatisticsService);
  private http    = inject(HttpClient);
  private cdr     = inject(ChangeDetectorRef);

  stats: DashboardStats | null = null;
  loading = false;
  selectedYear = new Date().getFullYear();
  years = [2026, 2025, 2024, 2023];
  maxBarVal = 1;

  readonly MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  readonly STATUS_COLORS: Record<string, string> = {
    NEW: '#4f8ef7', PENDING: '#f7b731', REVIEWED: '#17a2b8',
    INTERVIEW: '#845ef7', APPROVED: '#20c997', REJECTED: '#f06548', WITHDRAWN: '#6c757d',
  };
  readonly STATUS_FR: Record<string, string> = {
    NEW: 'Nouveau', PENDING: 'En attente', REVIEWED: 'Examiné',
    INTERVIEW: 'Entretien', APPROVED: 'Accepté', REJECTED: 'Rejeté', WITHDRAWN: 'Retiré',
  };
  readonly TYPE_COLORS = ['#4f8ef7','#845ef7','#20c997','#f7b731','#f06548','#17a2b8'];
  readonly TYPE_LABELS: Record<string, string> = {
    FULL_TIME:'Full Time', PART_TIME:'Part Time', FREELANCE:'Freelance',
    INTERNSHIP:'Stage', CONTRACT:'Contract', REMOTE:'Remote',
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<any>(API_ENDPOINTS['statisticsDashboard']).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.stats = data;
        this.computeMaxBar(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.buildMock();
        this.cdr.detectChanges();
      }
    });
  }

  computeMaxBar(s: DashboardStats): void {
    const vals = [
      ...(s.monthlyApplications || []),
      ...(s.monthlyInterviews   || []),
      ...(s.monthlyHired        || []),
      ...(s.monthlyRejected     || []),
    ];
    this.maxBarVal = Math.max(...vals, 1);
  }

  getBarPct(val: number): number {
    return Math.round((val / this.maxBarVal) * 100);
  }

  monthlyData(): { month: string; apps: number; interviews: number; hired: number; rejected: number }[] {
    if (!this.stats) return [];
    return this.MONTHS.map((m, i) => ({
      month:     m,
      apps:      (this.stats!.monthlyApplications || [])[i] ?? 0,
      interviews:(this.stats!.monthlyInterviews   || [])[i] ?? 0,
      hired:     (this.stats!.monthlyHired        || [])[i] ?? 0,
      rejected:  (this.stats!.monthlyRejected     || [])[i] ?? 0,
    }));
  }

  statusEntries(): { label: string; count: number; pct: number; color: string }[] {
    if (!this.stats?.applicationsByStatus) return [];
    const total = this.stats.totalApplications || 1;
    return Object.entries(this.stats.applicationsByStatus)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({
        label: this.STATUS_FR[k] || k,
        count: v,
        pct:   Math.round((v / total) * 100),
        color: this.STATUS_COLORS[k] || '#878a99',
      }));
  }

  typeEntries(): { label: string; count: number; pct: number; color: string }[] {
    if (!this.stats?.jobsByContractType) return [];
    const entries = Object.entries(this.stats.jobsByContractType).filter(([, v]) => v > 0);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([k, v], i) => ({
      label: this.TYPE_LABELS[k] || k,
      count: v,
      pct:   Math.round((v / max) * 100),
      color: this.TYPE_COLORS[i % this.TYPE_COLORS.length],
    }));
  }

  countryEntries(): { name: string; count: number; pct: number }[] {
    if (!this.stats?.jobsByCountry) return [];
    const entries = Object.entries(this.stats.jobsByCountry).sort(([, a], [, b]) => b - a).slice(0, 8);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([k, v]) => ({ name: k, count: v, pct: Math.round((v / max) * 100) }));
  }

  categoryEntries(): { name: string; count: number }[] {
    if (!this.stats?.jobsByCategory) return [];
    return Object.entries(this.stats.jobsByCategory)
      .sort(([, a], [, b]) => b - a).slice(0, 8)
      .map(([k, v]) => ({ name: k, count: v }));
  }

  statusFr(s: string): string { return this.STATUS_FR[s] || s; }

  export(): void {
    if (!this.stats?.recentApplications?.length) return;
    const header = 'Candidat,Email,Offre,Entreprise,Date,Statut\n';
    const rows = this.stats.recentApplications.map(a =>
      `"${a.candidateName}","${a.candidateEmail}","${a.jobTitle}","${a.companyName}","${a.applyDate}","${a.status}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `candidatures_${this.selectedYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  private buildMock(): void {
    this.stats = {
      totalApplications: 124, applicationGrowthPercent: 16.34,
      totalInterviewed: 38, interviewedGrowthPercent: 34.24,
      totalHired: 12, hiredGrowthPercent: 4.63,
      totalRejected: 28, rejectedGrowthPercent: -3.24,
      totalPublishedJobs: 18, totalCompanies: 6, totalCandidates: 45,
      monthlyApplications: [5,8,12,15,18,22,10,8,6,9,7,4],
      monthlyInterviews:   [2,3,4,5,6,8,4,3,2,3,2,1],
      monthlyHired:        [1,1,2,2,2,3,1,1,1,1,1,0],
      monthlyRejected:     [1,2,3,4,5,6,3,2,1,2,2,1],
      applicationsByStatus: { NEW:30, PENDING:20, REVIEWED:15, INTERVIEW:12, APPROVED:12, REJECTED:28, WITHDRAWN:7 },
      jobsByContractType: { FULL_TIME:8, PART_TIME:3, FREELANCE:4, INTERNSHIP:2, REMOTE:1 },
      jobsByCountry: { Tunisie:10, France:4, Maroc:2, Algérie:2 },
      jobsByCategory: { 'IT & Software':8, 'Design':4, 'Marketing':3, 'Finance':3 },
      recentApplications: [],
    };
    this.computeMaxBar(this.stats);
  }
}
