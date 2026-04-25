// ✅ CORRIGÉ — offer-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { JobService } from '../../../services/job.service';
import { CompanyService } from '../../../services/company.service';
import { CategoryService } from '../../../services/category.service';
import { Company, Job, JobCategory, CreateJobRequest, ContractType, ExperienceLevel } from '../../../models/job.models';
@Component({
  selector: 'app-offer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="form-page">
  <div class="api-banner" *ngIf="apiBanner">{{ apiBanner }}</div>

  <!-- DARK HERO BANNER -->
  <div class="page-hero">
    <div class="page-hero-inner">
      <div>
        <div class="header-badge"><span class="pulse-dot"></span>{{ isEdit ? "EDIT OFFER" : 'NEW OFFER' }}</div>
        <h2 class="page-title">{{ isEdit ? "Edit offer" : "New job offer" }}</h2>
        <p class="page-sub">{{ isEdit ? 'Update your offer information' : 'Fill in your offer information' }}</p>
      </div>
      <a class="btn-back" routerLink="/jobs/employer/jobs">← Back to offers</a>
    </div>
  </div>

  <div class="form-card">
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="section-title">General information</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Job title <span class="req">*</span></label>
          <input formControlName="title" placeholder="e.g. Senior Angular Developer" [class.invalid]="inv('title')" />
          <span class="err" *ngIf="inv('title')">Required field</span>
        </div>
        <div class="form-group">
          <label>Position / Grade</label>
          <input formControlName="position" placeholder="e.g. Senior Developer" />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select formControlName="categoryId">
            <option value="">Select a category</option>
            <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Contract type <span class="req">*</span></label>
          <select formControlName="contractType" [class.invalid]="inv('contractType')">
            <option value="">Select</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="FREELANCE">Freelance</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="CONTRACT">Contract</option>
            <option value="REMOTE">Remote</option>
          </select>
          <span class="err" *ngIf="inv('contractType')">Required field</span>
        </div>
        <div class="form-group">
          <label>Required experience</label>
          <select formControlName="experienceLevel">
            <option value="">Not specified</option>
            <option value="ENTRY_LEVEL">Entry Level</option>
            <option value="ONE_TO_TWO_YEARS">1 - 2 years</option>
            <option value="TWO_TO_FIVE_YEARS">2 - 5 years</option>
            <option value="FIVE_PLUS_YEARS">5+ years</option>
            <option value="SENIOR">Senior</option>
            <option value="EXECUTIVE">Executive</option>
          </select>
        </div>
        <div class="form-group">
          <label>Number of positions</label>
          <input type="number" formControlName="numberOfVacancy" min="1" />
        </div>
      </div>

      <div class="form-group full">
        <label>Description <span class="req">*</span></label>
        <textarea formControlName="description" rows="5" placeholder="Describe the position..." [class.invalid]="inv('description')"></textarea>
        <span class="err" *ngIf="inv('description')">Required field</span>
      </div>
      <div class="form-group full">
        <label>Responsibilities</label>
        <textarea formControlName="responsibilities" rows="4" placeholder="List of responsibilities..."></textarea>
      </div>
      <div class="form-group full">
        <label>Required skills</label>
        <textarea formControlName="skillsRequired" rows="3" placeholder="e.g. Angular, Java, SQL..."></textarea>
      </div>

      <div class="section-title">Location & Salary</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Country <span class="req">*</span></label>
          <input formControlName="country" placeholder="e.g. Tunisia" [class.invalid]="inv('country')" />
          <span class="err" *ngIf="inv('country')">Required field</span>
        </div>
        <div class="form-group">
          <label>City / Region</label>
          <input formControlName="state" placeholder="e.g. Tunis" />
        </div>
        <div class="form-group">
          <label>Minimum salary (k$)</label>
          <input type="number" formControlName="startSalary" placeholder="e.g. 35" />
        </div>
        <div class="form-group">
          <label>Maximum salary (k$)</label>
          <input type="number" formControlName="lastSalary" placeholder="e.g. 55" />
        </div>
        <div class="form-group">
          <label>Required qualification</label>
          <input formControlName="qualification" placeholder="e.g. Master Degree" />
        </div>
      </div>

      <div class="section-title">Dates & Options</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Application deadline</label>
          <input type="date" formControlName="lastDateToApply" />
        </div>
        <div class="form-group">
          <label>Closing date</label>
          <input type="date" formControlName="closeDate" />
        </div>
      </div>

      <div class="form-group full">
        <label>Tags (press Enter to add)</label>
        <div class="tags-wrap">
          <input #tagInput placeholder="e.g. Angular, Java, Spring..."
            (keyup.enter)="addTag(tagInput.value); tagInput.value = ''" />
          <div class="tags-list">
            <span class="tag" *ngFor="let t of tags; let i = index">
              {{ t }} <button type="button" (click)="removeTag(i)">×</button>
            </span>
          </div>
        </div>
      </div>

      <div class="options-row">
        <label class="toggle-label">
          <input type="checkbox" formControlName="isUrgent" />
          <span>Mark as Urgent 🔴</span>
        </label>
        <label class="toggle-label">
          <input type="checkbox" formControlName="isFeatured" />
          <span>Featured offer ⭐</span>
        </label>
      </div>

      <div class="form-actions">
  <button type="button" class="btn-cancel" routerLink="/jobs/employer/jobs">
    Cancel
  </button>

  <button type="submit" class="btn-publish" [disabled]="submitting">
    <ng-container *ngIf="!submitting">
      {{ isEdit ? 'Update' : 'Publish' }}
    </ng-container>
    <ng-container *ngIf="submitting">
      Saving...
      <span class="loader-btn"></span>
    </ng-container>
  </button>
</div>
    </form>
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

  /* ── PAGE ── */
  .form-page { min-height: 100vh; background: #f0ece4; color: #1a1a2e;
    font-family: 'Segoe UI', system-ui, sans-serif;
    padding: 28px 28px 60px;
  }

  /* ── HEADER ── */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
  }
  .page-header h4 { font-size: 24px; font-weight: 800; color: #ffffff;
    margin: 0 0 4px;
  }
  .subtitle {
    font-size: 13.5px;
    color: rgba(255,255,255,0.6);
    margin: 0;
  }
  .page-title { font-size: 26px; font-weight: 800; color: #ffffff; margin: 0 0 4px; }
  .page-sub { font-size: 13.5px; color: rgba(255,255,255,0.6); margin: 0; }
  .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; }
  .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; display: inline-block; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
  .btn-back { color: #f59e0b;
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 600;
    transition: opacity .2s;
  }
  .btn-back:hover { opacity: .8; }

  /* ── FORM CARD ── */
  .form-card { background: #ffffff; border: 1px solid #e8e0d0; border-radius: 16px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

  .section-title { font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: #f59e0b; margin: 24px 0 16px; padding-bottom: 8px; border-bottom: 2px solid rgba(245,158,11,0.2); }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 4px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-group.full { margin-bottom: 16px; }

  label { font-size: 13px; font-weight: 600; color: #1a1a2e; }
  .req { color: #f06548; }
  .err { font-size: 11.5px; color: #f06548; }

  input, select, textarea { border: 1px solid #e8e0d0; border-radius: 12px; padding: 10px 14px; font-size: 13.5px; background: #ffffff; color: #1a1a2e; outline: none; transition: border-color .2s, box-shadow .2s; } input:focus, select:focus, textarea:focus { border-color: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.2); }
  input.invalid, select.invalid, textarea.invalid {
    border-color: #f06548;
  }

  textarea { resize: vertical; }

  /* ── TAGS ── */
  .tags-wrap { border: 1px solid #e8e0d0; border-radius: 12px;
    padding: 8px 12px;
    min-height: 52px;
    display: flex;
    flex-direction: column;
  }
  .tags-wrap input { border: none; outline: none; width: 100%; background: transparent; color: #1a1a2e;
    font-size: 13px;
  }
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .tag { background: #fef3c7; color: #f59e0b;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .tag button { background: none; border: none; color: #f59e0b;
    cursor: pointer;
  }

  /* ── OPTIONS ROW ── */
  .options-row {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
  }
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    cursor: pointer;
  }

  /* ── BUTTONS ── */
  .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 20px; border-top: 1px solid #e8e0d0; }
  .btn-cancel { background: #ffffff; border: 1px solid #e8e0d0; color: #6b7280; border-radius: 12px; padding: 10px 22px; font-size: 13px; cursor: pointer; transition: all .2s; }
  .btn-cancel:hover { opacity: .8; }

  .btn-publish { background: #1a1a2e; color: #fff; border: none; border-radius: 12px; padding: 10px 28px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s; } .btn-publish:hover { opacity: .9; transform: translateY(-1px); } .btn-publish:disabled { opacity: .5; cursor: not-allowed; }

  /* ── API BANNER ── */
  .api-banner { background: rgba(239,68,68,0.08); color: #dc2626; border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 18px;
    font-size: 13px;
  }
.btn-publish { background: #1a1a2e; color: #fff; border: none; border-radius: 12px; padding: 10px 28px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; gap: 8px; }

.btn-publish:hover { opacity: .9; transform: translateY(-1px); }
.btn-publish:disabled { background: rgba(26,26,46,0.4);
  cursor: not-allowed;
  color: rgba(255,255,255,0.6);
}

.loader-btn {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin-btn 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin-btn { to { transform: rotate(360deg); } }
  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .form-grid { grid-template-columns: 1fr; }
    .options-row { flex-direction: column; }
    .form-actions { flex-direction: column; }
  }
`]
})
export class OfferFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private jobSvc = inject(JobService);
  private coSvc = inject(CompanyService);
  private catSvc = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = false;
  editId: number | null = null;
  submitting = false;
  categories: JobCategory[] = [];
  myCompany: Company | null = null;
  tags: string[] = [];
  apiBanner: string | null = null;

  form = this.fb.group({
    title: ['', Validators.required],
    position: [''],        // ✅ position (pas jobPosition)
    contractType: ['', Validators.required], // ✅ contractType (pas jobType)
    categoryId: [''],
    experienceLevel: [''],
    numberOfVacancy: [1],         // ✅ numberOfVacancy
    description: ['', Validators.required],
    responsibilities: [''],
    skillsRequired: [''],
    country: ['', Validators.required],
    state: [''],
    startSalary: [null as number | null],  // ✅ startSalary
    lastSalary: [null as number | null],  // ✅ lastSalary
    qualification: [''],
    lastDateToApply: [''],        // ✅ lastDateToApply
    closeDate: [''],
    isUrgent: [false],
    isFeatured: [false],
  });

  ngOnInit(): void {
    this.apiBanner = null;

    this.catSvc.getAll().pipe(
      catchError(() => { this.apiBanner = 'Impossible de charger les catégories.'; return of([]); })
    ).subscribe(c => (this.categories = c));

    this.coSvc.getMyCompany().pipe(
      catchError(() => of(null))
    ).subscribe(c => (this.myCompany = c));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.editId = +id;
      this.jobSvc.getById(+id).pipe(
        catchError(() => of(null as Job | null))
      ).subscribe(job => {
        if (!job) return;
        this.tags = [...(job.tags || [])];
      this.form.patchValue({
  title: job.title,

  position: job.position || '',

  contractType: job.contractType || '',

  categoryId: job.category?.id?.toString() || '',

  experienceLevel: job.experienceLevel || '',

  numberOfVacancy: job.numberOfVacancy ?? 1,

  description: job.description,



  country: job.country || '',
  state: job.state || '',

  startSalary: job.startSalary ?? null,
  lastSalary: job.lastSalary ?? null,


  lastDateToApply: job.lastDateToApply || '',
  closeDate: job.closeDate || '',

  isUrgent: job.isUrgent ?? false,
  isFeatured: job.isFeatured ?? false,
});
      });
    }
  }

  addTag(v: string): void { const t = v.trim(); if (t && !this.tags.includes(t)) this.tags.push(t); }
  removeTag(i: number): void { this.tags.splice(i, 1); }
  inv(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

buildPayload(): CreateJobRequest {
  const v = this.form.value;
  return {
    title:           v.title!,
    description:     v.description!,
    contractType:    v.contractType as ContractType,
    country:         v.country!,
    position:        v.position?.trim() || '',
    categoryId:      v.categoryId ? +v.categoryId : undefined,
    experienceLevel: v.experienceLevel ? (v.experienceLevel as ExperienceLevel) : undefined,
    numberOfVacancy: v.numberOfVacancy ?? 1,
    state:           v.state?.trim() || undefined,
    startSalary:     v.startSalary ?? undefined,
    lastSalary:      v.lastSalary ?? undefined,
    isUrgent:        !!v.isUrgent,
    isFeatured:      !!v.isFeatured,
    tags:            this.tags ?? [],
    ...(v.lastDateToApply ? { lastDateToApply: v.lastDateToApply } : {}),
    ...(v.closeDate       ? { closeDate:       v.closeDate       } : {}),
  };
}

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting = true;
    this.apiBanner = null;
    const obs = this.isEdit && this.editId
      ? this.jobSvc.update(this.editId, this.buildPayload())
      : this.jobSvc.create(this.buildPayload());
    obs.subscribe({
      next: () => { this.submitting = false; this.router.navigate(['/jobs/employer/jobs']); },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.apiBanner = err.error?.message ?? err.message ?? "Error saving the offer.";
      }
    });
  }
}