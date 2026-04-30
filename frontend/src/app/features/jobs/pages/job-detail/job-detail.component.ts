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

      <!-- Header -->
      <div class="modal-header">
        <div class="modal-logo">
          <img *ngIf="job?.company?.logo" [src]="job?.company?.logo" [alt]="job?.company?.name" />
          <div class="logo-ph" *ngIf="!job?.company?.logo">{{ (job?.company?.name || '?')[0] }}</div>
        </div>
        <div class="modal-header-info">
          <h6 class="modal-title">Apply — {{ job?.title || '' }}</h6>
          <p class="modal-sub">{{ job?.company?.name || 'Unknown company' }}</p>
        </div>
        <button class="modal-close" (click)="closeApply()" title="Close">✕</button>
      </div>

      <!-- ══ SUCCESS SCREEN ══ -->
      <ng-container *ngIf="applyOk">
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
            Your application for <strong>{{ job?.title }}</strong> at
            <strong>{{ job?.company?.name }}</strong> has been submitted successfully.
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
      <ng-container *ngIf="!applyOk && applyError && applyError.toLowerCase().includes('already')">
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
      <ng-container *ngIf="!applyOk && (!applyError || !applyError.toLowerCase().includes('already'))">
        <form [formGroup]="applyForm" (ngSubmit)="submit()">
          <div class="modal-body">
            <label class="modal-label">Cover letter <span class="required">*</span></label>
            <textarea formControlName="coverLetter" rows="5"
              placeholder="Describe your motivation, skills and why you're a great fit..."
              [class.input-error]="applyForm.controls['coverLetter'].invalid && applyForm.controls['coverLetter'].touched">
            </textarea>
            <p class="field-hint" *ngIf="applyForm.controls['coverLetter'].invalid && applyForm.controls['coverLetter'].touched">
              Cover letter is required.
            </p>

            <label class="modal-label">Resume <span class="label-hint">(PDF, DOC — max 5 MB)</span></label>
            <div class="file-drop" [class.file-selected]="resumeFile">
              <input type="file" accept=".pdf,.doc,.docx" (change)="onFile($event)" id="fileUploadDetail" />
              <label for="fileUploadDetail">
                <span class="file-icon">{{ resumeFile ? '✅' : '📎' }}</span>
                <span *ngIf="!resumeFile">Choose a file or drag & drop</span>
                <span *ngIf="resumeFile" class="file-name-ok">{{ resumeFile.name }}</span>
              </label>
            </div>
          </div>

          <div class="apply-error-msg" *ngIf="applyError && !applyError.toLowerCase().includes('already')">
            <span>⚠️</span> {{ applyError }}
          </div>

          <div class="modal-footer">
            <button type="button" class="mf-cancel" (click)="closeApply()">Cancel</button>
            <button type="submit" class="mf-submit" [disabled]="submitting || applyForm.invalid">
              <span *ngIf="!submitting">Send application</span>
              <span *ngIf="submitting" class="spinner-inline"></span>
            </button>
          </div>
        </form>
      </ng-container>

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
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-box { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 20px; width: 100%; max-width: 480px; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,0.18); overflow: hidden; animation: modalIn 0.22s cubic-bezier(0.16,1,0.3,1); }
@keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
.modal-header { display: flex; align-items: center; gap: 14px; padding: 20px 22px; border-bottom: 1px solid #e8e0d0; background: #fafafa; }
.modal-logo { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; flex-shrink: 0; border: 1px solid #e8e0d0; }
.modal-logo img { width: 100%; height: 100%; object-fit: cover; }
.logo-ph { width: 100%; height: 100%; background: linear-gradient(135deg,#f59e0b,#f97316); color:#fff; font-size:18px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.modal-header-info { flex: 1; min-width: 0; }
.modal-title { margin: 0 0 3px; font-size: 15px; font-weight: 700; color: #1a1a2e; }
.modal-sub { margin: 0; font-size: 12.5px; color: #9ca3af; }
.modal-close { background: none; border: none; color: #9ca3af; font-size: 18px; cursor: pointer; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background .15s; }
.modal-close:hover { background: #f1f5f9; color: #374151; }

.already-applied-banner { display: flex; gap: 14px; align-items: flex-start; margin: 20px 22px 4px; padding: 16px 18px; background: linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.06)); border: 1.5px solid rgba(245,158,11,0.35); border-radius: 14px; }
.aab-icon { flex-shrink: 0; margin-top: 2px; }
.aab-content { flex: 1; }
.aab-title { font-size: 14px; font-weight: 700; color: #b45309; margin: 0 0 5px; }
.aab-msg { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; }
.aab-msg strong { color: #374151; }

.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; }
.modal-label { font-size: 12.5px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; }
.required { color: #ef4444; margin-left: 2px; }
.label-hint { font-weight: 400; color: #9ca3af; font-size: 11.5px; }
textarea { border: 1.5px solid #e8e0d0; border-radius: 10px; padding: 10px 13px; font-size: 13.5px; background: #ffffff; color: #1a1a2e; width: 100%; box-sizing: border-box; outline: none; font-family: inherit; resize: vertical; min-height: 100px; transition: border-color .15s; }
textarea:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
textarea.input-error { border-color: #ef4444; }
.field-hint { font-size: 11.5px; color: #ef4444; margin: -6px 0 0; }
.file-drop { border: 1.5px dashed #d1d5db; border-radius: 10px; padding: 16px; text-align: center; cursor: pointer; background: #fafafa; transition: border-color .15s, background .15s; }
.file-drop:hover { border-color: #f59e0b; background: rgba(245,158,11,0.04); }
.file-drop.file-selected { border-color: #16a34a; background: rgba(22,163,74,0.04); border-style: solid; }
.file-drop input { display: none; }
.file-drop label { cursor: pointer; font-size: 13px; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 8px; }
.file-icon { font-size: 18px; }
.file-name-ok { color: #16a34a; font-weight: 600; }

.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #e8e0d0; background: #fafafa; }
.mf-cancel { background: none; border: 1.5px solid #e8e0d0; border-radius: 12px; padding: 9px 20px; font-size: 13px; color: #6b7280; cursor: pointer; transition: all .15s; }
.mf-cancel:hover { border-color: #9ca3af; color: #374151; }
.mf-submit { background: #1a1a2e; color: #fff; border: none; border-radius: 12px; padding: 9px 22px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background .2s; }
.mf-submit:hover:not(:disabled) { background: #2d2d4e; }
.mf-submit:disabled { opacity: .55; cursor: not-allowed; }
.mf-view-apps { background: #f59e0b; color: #1a1a2e; border: none; border-radius: 12px; padding: 9px 20px; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: background .2s; }
.mf-view-apps:hover { background: #e08e00; }
.spinner-inline { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
.apply-success { margin: 0 22px 4px; padding: 12px 16px; background: rgba(22,163,74,0.1); color: #16a34a; border: 1.5px solid rgba(22,163,74,0.25); border-radius: 10px; font-size: 13.5px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.apply-error-msg { margin: 0 22px 4px; padding: 12px 16px; background: rgba(240,101,72,0.08); color: #f06548; border: 1.5px solid rgba(240,101,72,0.25); border-radius: 10px; font-size: 13.5px; display: flex; align-items: center; gap: 8px; }

/* ── SUCCESS SCREEN ── */
.success-screen { display: flex; flex-direction: column; align-items: center; padding: 36px 28px 28px; text-align: center; gap: 12px; animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1); }
.success-icon-wrap { animation: successPop 0.4s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes successPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.success-title { font-size: 20px; font-weight: 800; color: #1a1a2e; margin: 4px 0 0; }
.success-msg { font-size: 14px; color: #374151; line-height: 1.6; margin: 0; max-width: 340px; }
.success-msg strong { color: #1a1a2e; }
.success-hint { font-size: 12.5px; color: #9ca3af; margin: 0; }
.success-actions { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
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