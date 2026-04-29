// offer-form.component.ts
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

  <!-- ERROR BANNER -->
  <div class="api-banner" *ngIf="apiBanner">&#9888; {{ apiBanner }}</div>

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
          {{ isEdit ? 'EDIT OFFER' : 'NEW OFFER' }}
        </div>
        <h2 class="page-title">{{ isEdit ? 'Edit offer' : 'New job offer' }}</h2>
        <p class="page-sub">{{ isEdit ? 'Update your offer information' : 'Fill in the details to publish your offer' }}</p>
      </div>
      <a class="btn-back" routerLink="/jobs/employer/jobs">&#8592; Back to offers</a>
    </div>
  </div>

  <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">

    <!-- SECTION 1 -->
    <div class="form-card">
      <div class="section-title">&#128196; General information</div>
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
          <label>Experience level</label>
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
      <div class="form-group span2">
        <label>Description <span class="req">*</span></label>
        <textarea formControlName="description" rows="5" placeholder="Describe the position, responsibilities and expectations..." [class.invalid]="inv('description')"></textarea>
        <span class="err" *ngIf="inv('description')">Required field</span>
      </div>
      <div class="form-group span2">
        <label>Responsibilities</label>
        <textarea formControlName="responsibilities" rows="3" placeholder="List of key responsibilities..."></textarea>
      </div>
      <div class="form-group span2">
        <label>Required skills</label>
        <textarea formControlName="skillsRequired" rows="2" placeholder="e.g. Angular, Java, SQL, Docker..."></textarea>
      </div>
    </div>

    <!-- SECTION 2 -->
    <div class="form-card">
      <div class="section-title">&#128205; Location &amp; Salary</div>
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
          <label>Min salary (k$)</label>
          <input type="number" formControlName="startSalary" placeholder="e.g. 35" />
        </div>
        <div class="form-group">
          <label>Max salary (k$)</label>
          <input type="number" formControlName="lastSalary" placeholder="e.g. 55" />
        </div>
        <div class="form-group">
          <label>Required qualification</label>
          <input formControlName="qualification" placeholder="e.g. Master Degree" />
        </div>
      </div>
    </div>

    <!-- SECTION 3 -->
    <div class="form-card">
      <div class="section-title">&#128197; Dates &amp; Options</div>
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

      <div class="form-group span2">
        <label>Tags <span class="hint">(press Enter to add)</span></label>
        <div class="tags-wrap">
          <input #tagInput placeholder="e.g. Angular, Java, Spring..."
            (keyup.enter)="addTag(tagInput.value); tagInput.value = ''" />
          <div class="tags-list">
            <span class="tag" *ngFor="let t of tags; let i = index">
              {{ t }} <button type="button" (click)="removeTag(i)">&#10005;</button>
            </span>
          </div>
        </div>
      </div>

      <div class="options-row">
        <label class="toggle-label">
          <input type="checkbox" formControlName="isUrgent" />
          <span class="toggle-text">&#128308; Mark as Urgent</span>
        </label>
        <label class="toggle-label">
          <input type="checkbox" formControlName="isFeatured" />
          <span class="toggle-text">&#11088; Featured offer</span>
        </label>
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="form-actions">
      <a class="btn-cancel" routerLink="/jobs/employer/jobs">Cancel</a>
      <button type="submit" class="btn-publish" [disabled]="submitting">
        <span *ngIf="!submitting">{{ isEdit ? '&#10003; Update offer' : '&#128640; Publish offer' }}</span>
        <span *ngIf="submitting" class="saving"><span class="btn-loader"></span> Saving...</span>
      </button>
    </div>

  </form>
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
    }

    .form-page { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter','Segoe UI',system-ui,sans-serif; padding: 0 0 80px; }

    /* API BANNER */
    .api-banner { background: #fee2e2; color: #dc2626; border: 1.5px solid #fecaca; border-radius: 10px; padding: 12px 16px; margin: 16px 32px; font-size: 13.5px; font-weight: 600; }

    /* HERO */
    .page-hero { background: linear-gradient(135deg,#0f0c29,#1a1a2e 60%,#24243e); padding: 36px 32px 32px; margin-bottom: 28px; border-bottom: 3px solid var(--accent); position: relative; overflow: hidden; }
    .hero-bg-shapes { position: absolute; inset: 0; pointer-events: none; }
    .shape { position: absolute; border-radius: 50%; opacity: 0.07; }
    .shape.s1 { width: 280px; height: 280px; background: #f59e0b; top: -70px; right: -50px; }
    .shape.s2 { width: 160px; height: 160px; background: #7c3aed; bottom: -50px; left: 35%; }
    .page-hero-inner { display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; }
    .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.12); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; display: inline-block; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
    .page-title { font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -0.5px; }
    .page-sub { font-size: 14px; color: rgba(255,255,255,0.55); margin: 0; }
    .btn-back { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1.5px solid rgba(255,255,255,0.25); color: rgba(255,255,255,0.75); border-radius: 12px; padding: 10px 18px; font-size: 13px; font-weight: 600; text-decoration: none; transition: all .2s; }
    .btn-back:hover { border-color: rgba(255,255,255,0.6); color: #fff; background: rgba(255,255,255,0.08); }

    /* FORM BODY */
    .form-body { padding: 0 32px; display: flex; flex-direction: column; gap: 20px; }

    /* FORM CARD */
    .form-card { background: #fff; border: 1.5px solid var(--border); border-radius: 18px; padding: 24px 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .section-title { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent); margin: 0 0 20px; padding-bottom: 12px; border-bottom: 2px solid #fef3c7; }

    /* FORM GRID */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.span2 { grid-column: span 2; margin-bottom: 14px; }
    label { font-size: 12.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; }
    .req { color: var(--danger); }
    .hint { font-size: 11px; color: #9ca3af; font-weight: 400; text-transform: none; letter-spacing: 0; }
    .err { font-size: 11.5px; color: var(--danger); font-weight: 600; }

    input, select, textarea { background: #fafaf7; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: 13.5px; color: var(--text); outline: none; transition: border-color .2s, box-shadow .2s; font-family: inherit; }
    input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    input.invalid, select.invalid, textarea.invalid { border-color: var(--danger); }
    textarea { resize: vertical; }

    /* TAGS */
    .tags-wrap { background: #fafaf7; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; min-height: 52px; transition: border-color .2s; }
    .tags-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    .tags-wrap input { border: none; outline: none; width: 100%; background: transparent; color: var(--text); font-size: 13.5px; padding: 0; }
    .tags-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .tag { background: #fef3c7; color: #d97706; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid rgba(245,158,11,0.3); }
    .tag button { background: none; border: none; color: #d97706; cursor: pointer; font-size: 12px; padding: 0; line-height: 1; }

    /* OPTIONS */
    .options-row { display: flex; gap: 24px; flex-wrap: wrap; }
    .toggle-label { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .toggle-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; }
    .toggle-text { font-size: 13.5px; font-weight: 600; color: var(--text); }

    /* ACTIONS */
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 4px 0 20px; }
    .btn-cancel { display: inline-flex; align-items: center; background: #fff; border: 1.5px solid var(--border); color: var(--muted); border-radius: 12px; padding: 11px 22px; font-size: 13.5px; font-weight: 600; text-decoration: none; transition: all .15s; }
    .btn-cancel:hover { border-color: var(--accent); color: var(--text); }
    .btn-publish { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); border: none; color: #1a1a2e; border-radius: 12px; padding: 12px 28px; font-size: 14px; font-weight: 800; cursor: pointer; transition: all .2s; box-shadow: 0 4px 20px rgba(245,158,11,0.4); }
    .btn-publish:hover:not(:disabled) { background: var(--accent-dark); color: #fff; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(245,158,11,0.5); }
    .btn-publish:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .saving { display: flex; align-items: center; gap: 8px; }
    .btn-loader { width: 16px; height: 16px; border: 2px solid rgba(26,26,46,0.3); border-top-color: #1a1a2e; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 900px) { .form-body { padding: 0 16px; } .form-grid { grid-template-columns: 1fr; } .form-group.span2 { grid-column: span 1; } .options-row { flex-direction: column; } }
    @media (max-width: 640px) { .page-hero { padding: 24px 20px 20px; } .form-actions { flex-direction: column; } }
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
    position: [''],
    contractType: ['', Validators.required],
    categoryId: [''],
    experienceLevel: [''],
    numberOfVacancy: [1],
    description: ['', Validators.required],
    responsibilities: [''],
    skillsRequired: [''],
    country: ['', Validators.required],
    state: [''],
    startSalary: [null as number | null],
    lastSalary: [null as number | null],
    qualification: [''],
    lastDateToApply: [''],
    closeDate: [''],
    isUrgent: [false],
    isFeatured: [false],
  });

  ngOnInit(): void {
    this.apiBanner = null;
    this.catSvc.getAll().pipe(catchError(() => { this.apiBanner = 'Cannot load categories.'; return of([]); })).subscribe(c => (this.categories = c));
    this.coSvc.getMyCompany().pipe(catchError(() => of(null))).subscribe(c => (this.myCompany = c));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.editId = +id;
      this.jobSvc.getById(+id).pipe(catchError(() => of(null as Job | null))).subscribe(job => {
        if (!job) return;
        this.tags = [...(job.tags || [])];
        this.form.patchValue({
          title: job.title, position: job.position || '', contractType: job.contractType || '',
          categoryId: job.category?.id?.toString() || '', experienceLevel: job.experienceLevel || '',
          numberOfVacancy: job.numberOfVacancy ?? 1, description: job.description,
          country: job.country || '', state: job.state || '',
          startSalary: job.startSalary ?? null, lastSalary: job.lastSalary ?? null,
          lastDateToApply: job.lastDateToApply || '', closeDate: job.closeDate || '',
          isUrgent: job.isUrgent ?? false, isFeatured: job.isFeatured ?? false,
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
      title: v.title!, description: v.description!, contractType: v.contractType as ContractType,
      country: v.country!, position: v.position?.trim() || '',
      categoryId: v.categoryId ? +v.categoryId : undefined,
      experienceLevel: v.experienceLevel ? (v.experienceLevel as ExperienceLevel) : undefined,
      numberOfVacancy: v.numberOfVacancy ?? 1, state: v.state?.trim() || undefined,
      startSalary: v.startSalary ?? undefined, lastSalary: v.lastSalary ?? undefined,
      isUrgent: !!v.isUrgent, isFeatured: !!v.isFeatured, tags: this.tags ?? [],
      ...(v.lastDateToApply ? { lastDateToApply: v.lastDateToApply } : {}),
      ...(v.closeDate ? { closeDate: v.closeDate } : {}),
    };
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.apiBanner = null;
    const obs = this.isEdit && this.editId ? this.jobSvc.update(this.editId, this.buildPayload()) : this.jobSvc.create(this.buildPayload());
    obs.subscribe({
      next: () => { this.submitting = false; this.router.navigate(['/jobs/employer/jobs']); },
      error: (err: HttpErrorResponse) => { this.submitting = false; this.apiBanner = err.error?.message ?? err.message ?? 'Error saving the offer.'; }
    });
  }
}
