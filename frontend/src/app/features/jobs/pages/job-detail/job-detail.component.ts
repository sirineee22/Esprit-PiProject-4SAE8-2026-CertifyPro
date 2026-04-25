import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobService } from '../../services/job.service';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Job, JOB_TYPE_LABELS } from '../../models/job.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
<div class="detail-page">
  <div class="loading-wrap" *ngIf="loading"><div class="loader"></div></div>

  <ng-container *ngIf="!loading && job">
    <!-- DARK HERO BANNER -->
    <div class="page-hero">
      <div class="page-hero-inner">
        <div>
          <div class="header-badge"><span class="pulse-dot"></span>JOB OFFER</div>
          <h1 class="page-title">{{ job!.title || 'Title unavailable' }}</h1>
          <p class="page-sub">{{ job!.company.name || 'Unknown company' }}</p>
        </div>
        <button type="button" class="btn-apply-hero" (click)="openApply()"
                *ngIf="!auth.isEmployer()"
                [disabled]="!auth.isLoggedIn()">
          {{ auth.isLoggedIn() ? 'Apply' : 'Login required' }}
        </button>
      </div>
    </div>

    <div class="detail-card">
      <a routerLink="/jobs" class="back">← Back to offers</a>

      <div class="meta">
        <span class="pill">{{ typeLabel(job!.contractType) }}</span>
        <span *ngIf="job!.country">📍 {{ job.country }}</span>
        <span *ngIf="job!.postDate">📅 {{ job.postDate | date:'d MMM y' }}</span>
        <span *ngIf="job!.isUrgent" class="urgent">Urgent</span>
      </div>

      <section *ngIf="job!.description">
        <h2>Description</h2>
        <p class="desc">{{ job.description }}</p>
      </section>
    </div>
  </ng-container>

  <div *ngIf="!loading && !job" class="error">
    <p>Offer not found.</p>
    <a routerLink="/jobs">Back to search</a>
  </div>

  <!-- Apply Modal -->
  <div class="modal-overlay" *ngIf="applyOpen" (click)="closeApply()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h6>Apply — {{ job?.title || '' }}</h6>
      <p class="sub">{{ job?.company?.name || 'Unknown company' }}</p>

      <form [formGroup]="applyForm" (ngSubmit)="submit()">
        <label>Cover letter</label>
        <textarea formControlName="coverLetter" rows="5" placeholder="Describe your motivation..."></textarea>
        <div class="error-msg" *ngIf="applyForm.controls['coverLetter'].invalid && applyForm.controls['coverLetter'].touched">
          Cover letter is required.
        </div>

        <label>Resume (PDF, max 5 MB)</label>
        <input type="file" (change)="onFile($event)" />
        <span class="fn" *ngIf="resumeFile">{{ resumeFile.name }}</span>

        <div class="actions">
          <button type="button" (click)="closeApply()">Cancel</button>
          <button type="submit" class="primary" [disabled]="submitting || applyForm.invalid">
            {{ submitting ? 'Sending...' : 'Send' }}
          </button>
        </div>

        <p class="ok" *ngIf="applyOk">Application submitted.</p>
        <p class="error-msg" *ngIf="applyError">{{ applyError }}</p>
      </form>
    </div>
  </div>
</div>
  `,
  styles: [`
.detail-page { min-height: 100vh; background: #f0ece4; color: #1a1a2e; font-family: 'Segoe UI', system-ui, sans-serif; padding: 28px; }
.page-hero { background: #1a1a2e; padding: 28px 28px 24px; margin: -28px -28px 24px; border-bottom: 3px solid #f59e0b; }
.page-hero-inner { display: flex; justify-content: space-between; align-items: flex-end; }
.header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; }
.pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; display: inline-block; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
.page-title { color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 4px; }
.page-sub { color: rgba(255,255,255,0.6); font-size: 14px; margin: 0; }
.btn-apply-hero { background: #f59e0b; color: #1a1a2e; border: none; border-radius: 12px; padding: 12px 24px; font-weight: 700; font-size: 14px; cursor: pointer; white-space: nowrap; }
.btn-apply-hero:disabled { opacity: 0.5; cursor: not-allowed; }
.detail-card { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.back { color: #f59e0b; text-decoration: none; font-size: 14px; display: inline-block; margin-bottom: 16px; }
.detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
h1 { font-size: 22px; margin: 0 0 6px; color: #1a1a2e; }
.co { margin: 0; color: #9ca3af; font-size: 15px; }
.btn-apply { background: #1a1a2e; color: #fff; border: none; border-radius: 12px; padding: 10px 20px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.btn-apply:disabled { opacity: 0.5; cursor: not-allowed; }
.meta { display: flex; flex-wrap: wrap; gap: 10px 16px; font-size: 13px; color: #6b7280; margin-bottom: 24px; }
.pill { background: #fef3c7; color: #f59e0b; padding: 2px 10px; border-radius: 20px; font-weight: 600; }
.urgent { color: #f06548; font-weight: 600; }
h2 { font-size: 16px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px; }
.desc { white-space: pre-wrap; line-height: 1.6; color: #1a1a2e; margin: 0; }
.loading-wrap { display: flex; justify-content: center; padding: 60px; }
.loader { width: 36px; height: 36px; border: 3px solid #e8e0d0; border-top-color: #f59e0b; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error { text-align: center; padding: 60px; color: #f06548; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-box { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; padding: 22px; width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-box h6 { margin: 0; font-size: 15px; color: #1a1a2e; }
.sub { margin: 0 0 8px; font-size: 13px; color: #9ca3af; }
label { font-size: 13px; font-weight: 600; color: #6b7280; }
textarea { border: 1px solid #e8e0d0; border-radius: 12px; padding: 8px 12px; font-size: 13px; background: #ffffff; color: #1a1a2e; width: 100%; box-sizing: border-box; outline: none; }
textarea:focus { border-color: #f59e0b; }
input[type="file"] { font-size: 13px; color: #6b7280; }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.actions button { border: 1px solid #e8e0d0; border-radius: 12px; padding: 8px 16px; cursor: pointer; background: #ffffff; color: #1a1a2e; }
.primary { background: #1a1a2e !important; color: #fff !important; border-color: #1a1a2e !important; }
.ok { color: #16a34a; font-weight: 600; margin: 0; }
.error-msg { color: #f06548; font-size: 12px; margin-top: 5px; }
.fn { font-size: 12px; color: #6b7280; }
  `]
})
export class JobDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobSvc = inject(JobService);
  private appSvc = inject(ApplicationService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  job: Job | null = null;
  loading = true;
  applyOpen = false;

  applyForm!: FormGroup;
  resumeFile: File | null = null;
  submitting = false;
  applyOk = false;
  applyError = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || isNaN(+id)) {
      this.loading = false;
      return;
    }

    this.initForm();
    this.loadJob(+id);
  }

  initForm(): void {
    this.applyForm = this.fb.group({
      coverLetter: ['', Validators.required]
    });
  }

  loadJob(id: number): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.jobSvc.getById(id).subscribe({
      next: j => {
        this.job = j;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.job = null;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  typeLabel(t?: string): string {
    return t ? JOB_TYPE_LABELS[t as keyof typeof JOB_TYPE_LABELS] || t : '';
  }

  openApply(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.applyOpen = true;
    this.applyForm.reset();
    this.resumeFile = null;
    this.applyOk = false;
    this.applyError = '';
  }

  closeApply(): void {
    if (!this.submitting) this.applyOpen = false;
  }

  onFile(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    this.resumeFile = f ?? null;
  }

  submit(): void {
    if (!this.job || this.applyForm.invalid) {
      this.applyForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.applyError = '';

    this.appSvc.apply(
      { jobOfferId: this.job.id, coverLetter: this.applyForm.value.coverLetter },
      this.resumeFile || undefined
    ).subscribe({
      next: () => {
        this.submitting = false;
        this.applyOk = true;
        setTimeout(() => this.applyOpen = false, 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.applyError = err.error?.message || 'Erreur lors de l’envoi.';
      }
    });
  }
}