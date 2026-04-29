import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import {
  isExamFeePaid,
  parseExamFeeFromCriteriaJson,
  setExamFeePaid,
} from '../utils/exam-payment.utils';

interface ApiCertLite {
  criteriaDescription: string | null;
}

@Component({
  selector: 'app-exam-mode-select',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mode-page">
      <div class="mode-card" *ngIf="!verifyingPayment">
        <a class="back-link" [routerLink]="['/certifications', certId]">
          <i class="bi bi-arrow-left"></i>
          Back to certification
        </a>

        <h1>Choose Exam Mode</h1>
        <p class="subtitle">
          Pick how you want to take the exam. Practice mode gives instant corrections and does not affect final certification results.
        </p>

        <div class="mode-grid">
          <button type="button" class="mode-btn practice" (click)="goToMode('practice')">
            <i class="bi bi-lightbulb"></i>
            <span class="title">Practice Mode</span>
            <span class="desc">No grading. Timed quiz with instant correction for each answer.</span>
          </button>

          <button type="button" class="mode-btn real" (click)="goToMode('real')">
            <i class="bi bi-award"></i>
            <span class="title">Real Exam</span>
            <span class="desc">Official graded attempt used for pass/fail result.</span>
          </button>
        </div>
      </div>

      <div class="mode-card verify-card" *ngIf="verifyingPayment">
        <div class="spinner"></div>
        <p>Confirming your payment…</p>
      </div>
    </div>
  `,
  styles: [`
    .mode-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: #f1f5f9;
    }
    .mode-card {
      width: 100%;
      max-width: 860px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 2rem;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    }
    .verify-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      text-align: center;
      color: #475569;
      font-weight: 600;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.85s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #475569;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    h1 {
      margin: 0;
      color: #0f172a;
      font-size: 1.8rem;
    }
    .subtitle {
      margin: 0.75rem 0 1.5rem;
      color: #64748b;
      line-height: 1.55;
    }
    .mode-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .mode-btn {
      text-align: left;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.2rem;
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .mode-btn i {
      font-size: 1.5rem;
    }
    .mode-btn .title {
      color: #0f172a;
      font-weight: 800;
      font-size: 1.05rem;
    }
    .mode-btn .desc {
      color: #64748b;
      font-size: 0.92rem;
      line-height: 1.45;
    }
    .mode-btn.practice i { color: #d97706; }
    .mode-btn.real i { color: #2563eb; }
    .mode-btn.practice:hover {
      border-color: #f59e0b;
      background: #fffbeb;
      transform: translateY(-1px);
    }
    .mode-btn.real:hover {
      border-color: #3b82f6;
      background: #eff6ff;
      transform: translateY(-1px);
    }
    @media (max-width: 760px) {
      .mode-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ExamModeSelectComponent implements OnInit {
  certId = 0;
  verifyingPayment = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.certId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.certId) {
      this.router.navigate(['/certifications']);
      return;
    }

    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      this.verifyingPayment = true;
      this.http
        .get<{ verified: boolean; certificationId: number }>(
          `${API_ENDPOINTS.payments}/verify-session`,
          { params: { sessionId } }
        )
        .subscribe({
          next: (r) => {
            this.verifyingPayment = false;
            if (r.verified && r.certificationId === this.certId) {
              setExamFeePaid(this.certId);
              this.router.navigate(['/certifications', this.certId, 'exam'], { replaceUrl: true });
            } else {
              this.router.navigate(['/certifications', this.certId]);
            }
          },
          error: () => {
            this.verifyingPayment = false;
            this.router.navigate(['/certifications', this.certId]);
          },
        });
      return;
    }

    this.ensurePaidAccessIfNeeded();
  }

  private ensurePaidAccessIfNeeded(): void {
    this.http.get<ApiCertLite>(`${API_ENDPOINTS.certifications}/${this.certId}`).subscribe({
      next: (api) => {
        const fee = parseExamFeeFromCriteriaJson(api.criteriaDescription);
        if (fee > 0 && !isExamFeePaid(this.certId)) {
          this.router.navigate(['/certifications', this.certId]);
        }
      },
      error: () => this.router.navigate(['/certifications']),
    });
  }

  goToMode(mode: 'practice' | 'real'): void {
    this.router.navigate(['/certifications', this.certId, 'exam', mode]);
  }
}
