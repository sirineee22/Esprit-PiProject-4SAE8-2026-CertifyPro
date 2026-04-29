import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../../core/api/api.config';

@Component({
  selector: 'app-my-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="page">

  <!-- TOP HEADER -->
  <div class="page-header">
    <div>
      <div class="header-badge"><span class="pulse-dot"></span>MY COMPANY</div>
      <h2 class="page-title">Company Profile</h2>
      <p class="page-sub">Complete your profile to publish job offers</p>
    </div>
    <a routerLink="/jobs/employer/jobs" class="btn-back">My offers</a>
  </div>

  <div class="alert success" *ngIf="successMsg">{{ successMsg }}</div>
  <div class="alert error"   *ngIf="errorMsg">{{ errorMsg }}</div>

  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div><p>Loading...</p>
  </div>

  <div *ngIf="!loading">
    <!-- COMPANY BANNER dark horizontal -->
    <div class="profile-banner">
      <div class="banner-left">
        <div class="logo-wrap">
          <img *ngIf="logoPreview || company?.logo"
               [src]="logoPreview || resolveLogoUrl(company?.logo)" class="logo-img" />
          <div class="logo-ph" *ngIf="!logoPreview && !company?.logo">
            {{ form.get('name')?.value?.charAt(0)?.toUpperCase() || '?' }}
          </div>
        </div>
        <div class="banner-info">
          <p class="banner-name">{{ form.get('name')?.value || 'Nom entreprise' }}</p>
          <p class="banner-title">{{ form.get('industryType')?.value || 'Sector not defined' }}</p>
          <div class="banner-stats">
            <div class="bstat"><span class="bstat-val">{{ company?.vacancyCount || 0 }}</span><span class="bstat-lbl">Positions</span></div>
            <div class="bstat-div"></div>
            <div class="bstat"><span class="bstat-val">{{ company?.rating?.toFixed(1) || '---' }}</span><span class="bstat-lbl">Rating</span></div>
            <div class="bstat-div"></div>
            <div class="bstat"><span class="bstat-val">{{ employeeRange }}</span><span class="bstat-lbl">Employees</span></div>
          </div>
        </div>
      </div>
      <div class="banner-right">
        <label class="btn-upload" *ngIf="company?.id">
          <input type="file" accept="image/*" (change)="onLogoChange($event)" hidden />
          Change logo
        </label>
        <p class="logo-hint" *ngIf="!company?.id">Save first to upload a logo</p>
      </div>
    </div>

    <!-- FORM -->
    <form [formGroup]="form" (ngSubmit)="save()">

      <div class="form-card">
        <div class="section-title">General information</div>
        <div class="form-grid">
          <div class="form-group"><label>Company name *</label><input formControlName="name" placeholder="e.g. Tech Solutions" [class.invalid]="inv('name')" /><span class="err" *ngIf="inv('name')">Required</span></div>
          <div class="form-group"><label>Industry</label><input formControlName="industryType" placeholder="e.g. IT, Finance, Healthcare..." /></div>
          <div class="form-group span2"><label>Description</label><textarea formControlName="description" rows="4" placeholder="Describe your company..."></textarea></div>
        </div>
      </div>

      <div class="form-card">
        <div class="section-title">Location & Contact</div>
        <div class="form-grid">
          <div class="form-group"><label>Country</label><input formControlName="country" placeholder="e.g. Tunisia" /></div>
          <div class="form-group"><label>City / Address</label><input formControlName="location" placeholder="e.g. Lac Berges, Tunis" /></div>
          <div class="form-group"><label>Contact email</label><input type="email" formControlName="contactEmail" placeholder="contact@company.com" /></div>
          <div class="form-group"><label>Phone</label><input formControlName="phone" placeholder="+216 ..." /></div>
          <div class="form-group span2"><label>Website</label><input formControlName="website" placeholder="https://www.mysite.com" /></div>
        </div>
      </div>

      <div class="form-card">
        <div class="section-title">Additional details</div>
        <div class="form-grid">
          <div class="form-group"><label>Min employees</label><input type="number" formControlName="employeeMin" min="0" /></div>
          <div class="form-group"><label>Max employees</label><input type="number" formControlName="employeeMax" min="0" /></div>
          <div class="form-group"><label>Founded date</label><input type="date" formControlName="foundedIn" /></div>
          <div class="form-group"><label>Department</label><input formControlName="department" placeholder="e.g. R&D, Marketing..." /></div>
        </div>
      </div>

      <div class="form-card">
        <div class="section-title">Social networks</div>
        <div class="form-grid">
          <div class="form-group"><label>LinkedIn</label><input formControlName="linkedinUrl" placeholder="https://linkedin.com/company/..." /></div>
          <div class="form-group"><label>Twitter / X</label><input formControlName="twitterUrl" placeholder="https://twitter.com/..." /></div>
          <div class="form-group"><label>Facebook</label><input formControlName="facebookUrl" placeholder="https://facebook.com/..." /></div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-save" [disabled]="submitting">
          <span *ngIf="!submitting">{{ company?.id ? 'Update' : 'Create company' }}</span>
          <span *ngIf="submitting" class="saving"><span class="btn-loader"></span> Saving...</span>
        </button>
      </div>
    </form>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    :host { --bg: #f0ece4; --card: #ffffff; --border: #e8e0d0; --text: #1a1a2e; --text-muted: #6b7280; --accent: #f59e0b; --accent-light: #fef3c7; }
    .page { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; padding: 28px 28px 60px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; display: inline-block; margin-right: 4px; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
    .page-title { font-size: 26px; font-weight: 800; color: var(--text); margin: 0 0 4px; }
    .page-sub { font-size: 13.5px; color: var(--text-muted); margin: 0; }
    .btn-back { background: var(--card); border: 1px solid var(--border); color: var(--text-muted); border-radius: 12px; padding: 9px 18px; font-size: 13px; text-decoration: none; white-space: nowrap; }
    .btn-back:hover { border-color: #f59e0b; color: #f59e0b; }
    .alert { padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 13.5px; font-weight: 600; border: 1px solid; }
    .alert.success { background: rgba(22,163,74,0.1); color: #16a34a; border-color: rgba(22,163,74,0.3); }
    .alert.error   { background: rgba(240,101,72,0.1); color: #f06548; border-color: rgba(240,101,72,0.3); }
    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 80px; color: var(--text-muted); }
    .loader { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: #f59e0b; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    /* BANNER */
    .profile-banner { background: #1a1a2e; border-radius: 16px; padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; box-shadow: 0 4px 24px rgba(26,26,46,0.25); }
    .banner-left { display: flex; align-items: center; gap: 20px; }
    .logo-wrap { width: 72px; height: 72px; border-radius: 14px; border: 3px solid #f59e0b; background: rgba(245,158,11,0.15); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    .logo-img { width: 100%; height: 100%; object-fit: cover; }
    .logo-ph { font-size: 26px; font-weight: 800; color: #f59e0b; }
    .banner-info { display: flex; flex-direction: column; gap: 4px; }
    .banner-name { font-size: 18px; font-weight: 800; color: #ffffff; margin: 0; }
    .banner-title { font-size: 13px; color: rgba(255,255,255,0.6); margin: 0; }
    .banner-stats { display: flex; align-items: center; margin-top: 10px; }
    .bstat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0 16px; }
    .bstat:first-child { padding-left: 0; }
    .bstat-val { font-size: 18px; font-weight: 800; color: #f59e0b; }
    .bstat-lbl { font-size: 10px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .bstat-div { width: 1px; height: 32px; background: rgba(255,255,255,0.15); }
    .banner-right { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .btn-upload { display: inline-flex; align-items: center; gap: 6px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); color: #f59e0b; border-radius: 12px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-upload:hover { background: rgba(245,158,11,0.25); }
    .logo-hint { font-size: 11px; color: rgba(255,255,255,0.4); margin: 0; text-align: center; }
    /* FORM */
    .form-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 16px; }
    .section-title { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f59e0b; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 2px solid #fef3c7; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.span2 { grid-column: span 2; }
    label { font-size: 12.5px; font-weight: 600; color: var(--text-muted); }
    .err { font-size: 11px; color: #f06548; }
    input, textarea, select { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 10px 13px; font-size: 13.5px; color: var(--text); outline: none; transition: border-color .2s; font-family: inherit; }
    input:focus, textarea:focus, select:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    input.invalid { border-color: #f06548; }
    textarea { resize: vertical; }
    .form-actions { display: flex; justify-content: flex-end; padding-top: 4px; }
    .btn-save { background: #1a1a2e; color: #fff; border: none; border-radius: 12px; padding: 12px 32px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all .2s; box-shadow: 0 4px 20px rgba(26,26,46,0.2); }
    .btn-save:hover:not(:disabled) { transform: translateY(-1px); background: #2d2d4e; }
    .btn-save:disabled { opacity: .5; cursor: not-allowed; }
    .saving { display: flex; align-items: center; gap: 8px; }
    .btn-loader { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
    @media (max-width: 768px) { .profile-banner { flex-direction: column; gap: 16px; } .banner-left { flex-direction: column; text-align: center; } .form-grid { grid-template-columns: 1fr; } .form-group.span2 { grid-column: span 1; } .page { padding: 16px 14px 40px; } }
  `]
})
export class MyCompanyComponent implements OnInit {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  form!: FormGroup;
  company: any = null;
  loading    = true;
  submitting = false;
  successMsg = '';
  errorMsg   = '';
  logoPreview: string | null = null;
  private logoFile: File | null = null;

  private readonly base = API_ENDPOINTS['companies'];

  ngOnInit(): void { this.buildForm(); this.loadCompany(); }

  buildForm(): void {
    this.form = this.fb.group({
      name:         ['', Validators.required],
      industryType: [''],
      description:  [''],
      country:      [''],
      location:     [''],
      contactEmail: ['', [Validators.email]],
      phone:        [''],
      website:      [''],
      employeeMin:  [null],
      employeeMax:  [null],
      foundedIn:    [''],
      department:   [''],
      linkedinUrl:  [''],
      twitterUrl:   [''],
      facebookUrl:  [''],
    });
  }

  inv(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  get employeeRange(): string {
    const min = this.company?.employeeMin;
    const max = this.company?.employeeMax;
    if (min && max) return `${min}-${max}`;
    if (min) return `${min}+`;
    return '---';
  }

  resolveLogoUrl(logo?: string): string {
    if (!logo) return '';
    if (logo.startsWith('http')) return logo;
    return `${API_BASE_URL}${logo.startsWith('/') ? '' : '/'}${logo}`;
  }

  loadCompany(): void {
    this.loading = true;
    this.http.get<any>(`${this.base}/my`).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.company = data;
        if (data) this.patchForm(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        if (err?.status !== 404) { this.errorMsg = 'Error loading data.'; setTimeout(() => { this.errorMsg = ''; this.cdr.detectChanges(); }, 5000); }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  patchForm(c: any): void {
    this.form.patchValue({ name: c.name ?? '', industryType: c.industryType ?? '', description: c.description ?? '', country: c.country ?? '', location: c.location ?? '', contactEmail: c.contactEmail ?? '', phone: c.phone ?? '', website: c.website ?? '', employeeMin: c.employeeMin ?? null, employeeMax: c.employeeMax ?? null, foundedIn: c.foundedIn ?? '', department: c.department ?? '', linkedinUrl: c.linkedinUrl ?? '', twitterUrl: c.twitterUrl ?? '', facebookUrl: c.facebookUrl ?? '' });
  }

  onLogoChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.logoPreview = reader.result as string; this.cdr.detectChanges(); };
    reader.readAsDataURL(file);
    if (this.company?.id) this.uploadLogo(file);
  }

  uploadLogo(file: File): void {
    const fd = new FormData();
    fd.append('logo', file);
    this.http.post<any>(`${this.base}/${this.company.id}/logo`, fd).subscribe({
      next: (res: any) => { const data = res?.data ?? res; if (data?.logo) this.company.logo = data.logo; this.showSuccess('Logo updated!'); },
      error: () => this.showError('Error uploading logo.')
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.errorMsg = '';
    this.successMsg = '';
    const payload = { name: this.form.value.name, industryType: this.form.value.industryType || null, description: this.form.value.description || null, country: this.form.value.country || null, location: this.form.value.location || null, contactEmail: this.form.value.contactEmail || null, phone: this.form.value.phone || null, website: this.form.value.website || null, employeeMin: this.form.value.employeeMin || null, employeeMax: this.form.value.employeeMax || null, foundedIn: this.form.value.foundedIn || null, department: this.form.value.department || null, linkedinUrl: this.form.value.linkedinUrl || null, twitterUrl: this.form.value.twitterUrl || null, facebookUrl: this.form.value.facebookUrl || null };
    const req$ = this.company?.id ? this.http.put<any>(`${this.base}/${this.company.id}`, payload) : this.http.post<any>(this.base, payload);
    req$.subscribe({
      next: (res: any) => {
        this.company = res?.data ?? res;
        this.patchForm(this.company);
        this.submitting = false;
        this.showSuccess(this.company?.id ? 'Company updated!' : 'Company created!');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.submitting = false;
        this.showError(err?.error?.message || 'Error saving.');
        this.cdr.detectChanges();
      }
    });
  }

  private showSuccess(msg: string): void { this.successMsg = msg; setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 4000); }
  private showError(msg: string): void { this.errorMsg = msg; setTimeout(() => { this.errorMsg = ''; this.cdr.detectChanges(); }, 6000); }
}
