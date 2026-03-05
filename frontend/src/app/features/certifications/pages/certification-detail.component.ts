import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/api/api.config';

/** Shape returned by GET /api/certifications/{id} */
interface ApiCertification {
  id: number;
  code: string;
  name: string;
  description: string;
  validityMonths: number | null;
  requiredScore: number | null;
  criteriaDescription: string | null;   // stored as JSON string
  isActive: boolean;
  status: string;
  createdAt: string;
  trainerId: number | null;
  trainerName: string | null;
}

/** Parsed criteriaDescription JSON */
interface CriteriaJson {
  level?: string;
  category?: string;
  duration?: string;
  price?: string;
  examQuestions?: number;
  examDurationMinutes?: number;
  examFormat?: string;
  topics?: string;
  skills?: string;
  prerequisites?: string;
  nextExamDate?: string;
  language?: string;
  fullDescription?: string;
  quizQuestions?: any[];
}

/** Internal view-model used by the template */
interface CertView {
  id: number;
  code: string;
  name: string;
  description: string;
  fullDescription: string;
  level: string;
  category: string;
  duration: string;
  price: string;
  validityMonths: number | null;
  requiredScore: number | null;
  trainerName: string | null;
  topics: string[];
  skills: string[];
  prerequisites: string[];
  examQuestions: number | null;
  examDurationMinutes: number | null;
  examFormat: string;
  nextExamDate: string;
  language: string;
  cardColor: string;
  cardIcon: string;
}

@Component({
  selector: 'app-certification-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Loading -->
    <div class="state-center" *ngIf="isLoading">
      <div class="spinner"></div>
      <p>Loading certification details…</p>
    </div>

    <!-- Error -->
    <div class="state-center error-state" *ngIf="errorMessage && !isLoading">
      <i class="bi bi-exclamation-circle"></i>
      <h2>{{ errorMessage }}</h2>
      <a routerLink="/certifications" class="btn-back">← Back to Catalog</a>
    </div>

    <!-- Detail Page -->
    <div class="cert-detail-page" *ngIf="cert && !isLoading && !errorMessage">

      <!-- Hero Banner -->
      <div class="cert-hero" [style.background]="cert.cardColor">
        <div class="hero-overlay">
          <div class="hero-inner">
            <a routerLink="/certifications" class="back-link">
              <i class="bi bi-arrow-left"></i> All Certifications
            </a>
            <div class="hero-content">
              <div class="cert-icon-large">
                <i [class]="'bi ' + cert.cardIcon"></i>
              </div>
              <div class="hero-text">
                <div class="hero-badges">
                  <span class="cert-code-badge">{{ cert.code }}</span>
                  <span class="badge-level" [ngClass]="cert.level.toLowerCase()">{{ cert.level }}</span>
                  <span class="badge-category" *ngIf="cert.category">{{ cert.category }}</span>
                </div>
                <h1>{{ cert.name }}</h1>
                <p class="hero-provider" *ngIf="cert.trainerName">
                  by <strong>{{ cert.trainerName }}</strong>
                </p>
                <p class="hero-desc">{{ cert.description }}</p>
                <div class="hero-stats">
                  <div class="stat" *ngIf="cert.duration">
                    <i class="bi bi-clock"></i>
                    <span>{{ cert.duration }}</span>
                  </div>
                  <div class="stat" *ngIf="cert.language">
                    <i class="bi bi-globe"></i>
                    <span>{{ cert.language }}</span>
                  </div>
                  <div class="stat" *ngIf="cert.validityMonths">
                    <i class="bi bi-shield-check"></i>
                    <span>Valid {{ cert.validityMonths }} months</span>
                  </div>
                  <div class="stat" *ngIf="cert.nextExamDate">
                    <i class="bi bi-calendar-event"></i>
                    <span>Next: {{ cert.nextExamDate }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="detail-layout">

        <!-- Left Column -->
        <div class="detail-main">

          <!-- About -->
          <section class="detail-section" *ngIf="cert.fullDescription">
            <h2><i class="bi bi-info-circle"></i> About This Certification</h2>
            <p class="long-desc">{{ cert.fullDescription }}</p>
          </section>

          <!-- Topics -->
          <section class="detail-section" *ngIf="cert.topics.length > 0">
            <h2><i class="bi bi-journal-bookmark"></i> Topics Covered</h2>
            <ul class="topics-list">
              <li *ngFor="let topic of cert.topics">
                <i class="bi bi-check-circle-fill"></i> {{ topic }}
              </li>
            </ul>
          </section>

          <!-- Skills -->
          <section class="detail-section" *ngIf="cert.skills.length > 0">
            <h2><i class="bi bi-lightning-charge"></i> Skills You'll Gain</h2>
            <div class="skills-grid">
              <span class="skill-chip" *ngFor="let skill of cert.skills">{{ skill }}</span>
            </div>
          </section>

          <!-- Prerequisites -->
          <section class="detail-section" *ngIf="cert.prerequisites.length > 0">
            <h2><i class="bi bi-list-check"></i> Prerequisites</h2>
            <ul class="prereq-list">
              <li *ngFor="let prereq of cert.prerequisites">
                <i class="bi bi-dot"></i> {{ prereq }}
              </li>
            </ul>
          </section>

          <!-- Exam Format -->
          <section class="detail-section">
            <h2><i class="bi bi-clipboard-data"></i> Exam Format</h2>
            <div class="exam-grid">
              <div class="exam-stat-card" *ngIf="cert.examQuestions">
                <i class="bi bi-question-circle"></i>
                <span class="exam-value">{{ cert.examQuestions }}</span>
                <span class="exam-label">Questions</span>
              </div>
              <div class="exam-stat-card" *ngIf="cert.examDurationMinutes">
                <i class="bi bi-hourglass-split"></i>
                <span class="exam-value">{{ cert.examDurationMinutes }} min</span>
                <span class="exam-label">Duration</span>
              </div>
              <div class="exam-stat-card" *ngIf="cert.requiredScore">
                <i class="bi bi-graph-up"></i>
                <span class="exam-value">{{ cert.requiredScore }}%</span>
                <span class="exam-label">Passing Score</span>
              </div>
              <div class="exam-stat-card" *ngIf="cert.examFormat">
                <i class="bi bi-display"></i>
                <span class="exam-value-sm">{{ cert.examFormat }}</span>
                <span class="exam-label">Format</span>
              </div>
            </div>
          </section>

        </div>

        <!-- Right Sidebar -->
        <aside class="detail-sidebar">
          <div class="sidebar-card sticky-card">

            <!-- Price block -->
            <div class="price-block" *ngIf="cert.price">
              <p class="sidebar-label">Exam Fee</p>
              <p class="sidebar-price">{{ cert.price }}</p>
            </div>

            <button class="btn-register" (click)="registerForExam()">
              <i class="bi bi-pencil-square"></i>
              Register for Exam
            </button>

            <div class="sidebar-divider"></div>

            <!-- Key Info -->
            <ul class="sidebar-info-list">
              <li>
                <i class="bi bi-award"></i>
                <div>
                  <span class="info-label">Certification Code</span>
                  <span class="info-value">{{ cert.code }}</span>
                </div>
              </li>
              <li *ngIf="cert.trainerName">
                <i class="bi bi-person-badge"></i>
                <div>
                  <span class="info-label">Created by</span>
                  <span class="info-value">{{ cert.trainerName }}</span>
                </div>
              </li>
              <li *ngIf="cert.level">
                <i class="bi bi-bar-chart-steps"></i>
                <div>
                  <span class="info-label">Level</span>
                  <span class="info-value">{{ cert.level }}</span>
                </div>
              </li>
              <li *ngIf="cert.validityMonths">
                <i class="bi bi-clock-history"></i>
                <div>
                  <span class="info-label">Validity</span>
                  <span class="info-value">{{ cert.validityMonths }} months</span>
                </div>
              </li>
              <li *ngIf="cert.nextExamDate">
                <i class="bi bi-calendar-check"></i>
                <div>
                  <span class="info-label">Next Exam Date</span>
                  <span class="info-value">{{ cert.nextExamDate }}</span>
                </div>
              </li>
              <li *ngIf="cert.category">
                <i class="bi bi-tag"></i>
                <div>
                  <span class="info-label">Category</span>
                  <span class="info-value">{{ cert.category }}</span>
                </div>
              </li>
            </ul>

            <!-- Success badge after register -->
            <div class="registered-badge" *ngIf="registered">
              <i class="bi bi-patch-check-fill"></i>
              <p>You're registered! Check your email for details.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f8fafc; min-height: 100vh; }

    /* ======= STATES ======= */
    .state-center {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 60vh; gap: 1rem; color: #94a3b8;
    }
    .spinner {
      width: 48px; height: 48px; border: 4px solid #e2e8f0;
      border-top-color: #3b82f6; border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-state i { font-size: 3.5rem; color: #f87171; }
    .error-state h2 { font-size: 1.4rem; color: #475569; }

    /* ======= HERO ======= */
    .cert-hero { position: relative; overflow: hidden; }
    .hero-overlay {
      background: linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 100%);
      padding: 3rem 2rem 4rem;
    }
    .hero-inner { max-width: 1200px; margin: 0 auto; }
    .back-link {
      display: inline-flex; align-items: center; gap: 0.5rem;
      color: rgba(255,255,255,0.85); text-decoration: none;
      font-size: 0.9rem; font-weight: 600; margin-bottom: 2rem; transition: color 0.2s;
    }
    .back-link:hover { color: white; }
    .hero-content { display: flex; align-items: flex-start; gap: 2rem; }
    .cert-icon-large {
      background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.25); border-radius: 20px;
      width: 100px; height: 100px; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .cert-icon-large i { font-size: 3rem; color: white; }
    .hero-text { flex: 1; }
    .hero-badges { display: flex; gap: 0.6rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .cert-code-badge {
      padding: 0.3rem 0.75rem; border-radius: 6px;
      background: rgba(255,255,255,0.2); color: white;
      font-size: 0.72rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.35);
    }
    .badge-level {
      padding: 0.3rem 0.9rem; border-radius: 20px;
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .badge-level.beginner { background: #dcfce7; color: #166534; }
    .badge-level.intermediate { background: #fef9c3; color: #854d0e; }
    .badge-level.advanced { background: #fee2e2; color: #991b1b; }
    .badge-category {
      padding: 0.3rem 0.9rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);
    }
    .hero-text h1 { font-size: 2.4rem; font-weight: 800; color: white; margin: 0 0 0.5rem; line-height: 1.2; }
    .hero-provider { color: rgba(255,255,255,0.8); font-size: 1rem; margin-bottom: 1rem; }
    .hero-provider strong { color: white; }
    .hero-desc { color: rgba(255,255,255,0.85); font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.75rem; max-width: 680px; }
    .hero-stats { display: flex; flex-wrap: wrap; gap: 1.5rem; }
    .stat { display: flex; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.9); font-size: 0.9rem; font-weight: 500; }

    /* ======= LAYOUT ======= */
    .detail-layout {
      max-width: 1200px; margin: 0 auto; padding: 3rem 2rem;
      display: grid; grid-template-columns: 1fr 360px; gap: 2.5rem; align-items: start;
    }

    /* ======= SECTIONS ======= */
    .detail-section {
      background: white; border-radius: 16px; padding: 2rem;
      margin-bottom: 1.5rem; border: 1px solid #f1f5f9;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .detail-section h2 {
      font-size: 1.2rem; font-weight: 700; color: #1e293b;
      margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem;
    }
    .detail-section h2 i { color: #3b82f6; font-size: 1.1rem; }
    .long-desc { color: #475569; line-height: 1.85; font-size: 1rem; }

    /* Topics */
    .topics-list {
      list-style: none; padding: 0; margin: 0;
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem;
    }
    .topics-list li {
      display: flex; align-items: center; gap: 0.75rem;
      color: #334155; font-size: 0.93rem;
      padding: 0.6rem 0.75rem; border-radius: 8px;
      background: #f8fafc; border: 1px solid #e2e8f0;
    }
    .topics-list li i { color: #10b981; font-size: 1rem; flex-shrink: 0; }

    /* Skills */
    .skills-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .skill-chip {
      background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #1d4ed8;
      border: 1px solid #bfdbfe; padding: 0.45rem 1rem;
      border-radius: 20px; font-size: 0.85rem; font-weight: 600;
    }

    /* Prerequisites */
    .prereq-list { list-style: none; padding: 0; margin: 0; }
    .prereq-list li {
      display: flex; align-items: center; color: #475569; font-size: 0.93rem;
      padding: 0.4rem 0; border-bottom: 1px dashed #e2e8f0;
    }
    .prereq-list li:last-child { border-bottom: none; }
    .prereq-list li i { color: #6366f1; font-size: 1.5rem; }

    /* Exam Grid */
    .exam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 1rem; }
    .exam-stat-card {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;
      text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    }
    .exam-stat-card i { font-size: 1.5rem; color: #3b82f6; }
    .exam-value { font-size: 1.4rem; font-weight: 800; color: #1e293b; }
    .exam-value-sm { font-size: 0.95rem; font-weight: 700; color: #1e293b; line-height: 1.3; }
    .exam-label { font-size: 0.78rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

    /* ======= SIDEBAR ======= */
    .detail-sidebar { position: relative; }
    .sticky-card {
      position: sticky; top: 80px; background: white; border-radius: 20px;
      border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }
    .price-block { text-align: center; margin-bottom: 1.5rem; }
    .sidebar-label { font-size: 0.78rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem; }
    .sidebar-price { font-size: 2.5rem; font-weight: 900; color: #0f172a; line-height: 1; margin-bottom: 0.5rem; }

    .btn-register {
      width: 100%; background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      color: white; border: none; padding: 1rem; border-radius: 12px;
      font-size: 1rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      transition: all 0.3s ease; margin-bottom: 0.75rem;
      box-shadow: 0 4px 15px rgba(59,130,246,0.35);
    }
    .btn-register:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59,130,246,0.45); }

    .sidebar-divider { height: 1px; background: #e2e8f0; margin: 1.5rem 0; }

    .sidebar-info-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
    .sidebar-info-list li { display: flex; align-items: flex-start; gap: 0.85rem; }
    .sidebar-info-list li > i { font-size: 1.1rem; color: #3b82f6; margin-top: 0.1rem; flex-shrink: 0; }
    .sidebar-info-list li > div { display: flex; flex-direction: column; }
    .info-label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
    .info-value { font-size: 0.9rem; color: #1e293b; font-weight: 600; }

    .registered-badge {
      margin-top: 1.5rem; background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 1px solid #86efac; border-radius: 12px; padding: 1rem;
      text-align: center; animation: fadeIn 0.4s ease;
    }
    .registered-badge i { font-size: 2rem; color: #16a34a; display: block; margin-bottom: 0.5rem; }
    .registered-badge p { color: #15803d; font-weight: 600; font-size: 0.9rem; margin: 0; }

    .btn-back {
      display: inline-block; padding: 0.75rem 2rem; background: #1e3a8a;
      color: white; border-radius: 10px; text-decoration: none; font-weight: 600;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 900px) {
      .detail-layout { grid-template-columns: 1fr; }
      .sticky-card { position: static; }
      .hero-text h1 { font-size: 1.8rem; }
      .hero-content { flex-direction: column; }
      .cert-icon-large { width: 70px; height: 70px; }
      .cert-icon-large i { font-size: 2rem; }
    }
    @media (max-width: 600px) {
      .hero-overlay { padding: 2rem 1rem 3rem; }
      .detail-layout { padding: 1.5rem 1rem; }
    }
  `]
})
export class CertificationDetailComponent implements OnInit {
  cert: CertView | null = null;
  isLoading = true;
  errorMessage = '';
  registered = false;

  private readonly cardColors = [
    'linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)',
    'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
    'linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  ];
  private readonly cardIcons = [
    'bi-patch-check', 'bi-award', 'bi-mortarboard', 'bi-journal-check',
    'bi-trophy', 'bi-star', 'bi-bookmark-star', 'bi-lightning-charge',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage = 'Invalid certification ID.';
      this.isLoading = false;
      return;
    }
    this.loadCertification(id);
  }

  loadCertification(id: number) {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<ApiCertification>(`${API_ENDPOINTS.certifications}/${id}`).subscribe({
      next: (data) => {
        console.log('[CertDetail] API response:', data);
        this.cert = this.mapToCertView(data);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[CertDetail] Error loading certification:', err);
        this.errorMessage = err.status === 404
          ? 'Certification not found.'
          : 'Could not load certification. Make sure the backend is running.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Map the raw API object + parsed criteriaDescription → CertView */
  private mapToCertView(api: ApiCertification): CertView {
    // Parse the criteriaDescription JSON field safely
    let c: CriteriaJson = {};
    if (api.criteriaDescription) {
      try {
        c = JSON.parse(api.criteriaDescription);
      } catch {
        console.warn('[CertDetail] Could not parse criteriaDescription JSON');
      }
    }

    // Split comma/newline-separated strings into arrays
    const splitList = (val: string | undefined): string[] =>
      val ? val.split(/[\n,]/).map(s => s.trim()).filter(Boolean) : [];

    const idx = api.id % this.cardColors.length;

    return {
      id: api.id,
      code: api.code,
      name: api.name,
      description: api.description || '',
      fullDescription: c.fullDescription || api.description || '',
      level: c.level || 'Beginner',
      category: c.category || '',
      duration: c.duration || '',
      price: c.price || '',
      validityMonths: api.validityMonths,
      requiredScore: api.requiredScore,
      trainerName: api.trainerName,
      topics: splitList(c.topics),
      skills: splitList(c.skills),
      prerequisites: splitList(c.prerequisites),
      examQuestions: c.examQuestions ?? (c.quizQuestions ? c.quizQuestions.length : null),
      examDurationMinutes: c.examDurationMinutes ?? null,
      examFormat: c.examFormat || (c.quizQuestions ? 'Multiple Choice' : ''),
      nextExamDate: c.nextExamDate || '',
      language: c.language || '',
      cardColor: this.cardColors[idx],
      cardIcon: this.cardIcons[idx],
    };
  }

  registerForExam() {
    if (this.cert) {
      this.router.navigate(['/certifications', this.cert.id, 'exam']);
    }
  }
}
