import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../../core/api/api.config';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
<div class="page">
  <div class="page-header">
    <div>
      <div class="header-badge"><span class="pulse-dot"></span>MY CANDIDATE PROFILE</div>
      <h2 class="page-title">Candidate Profile</h2>
      <p class="page-sub">Complete your profile to improve your recommendations</p>
    </div>
    <a routerLink="/jobs/candidate/applications" class="btn-back">My applications</a>
  </div>

  <div class="alert success" *ngIf="successMsg">{{ successMsg }}</div>
  <div class="alert error"   *ngIf="errorMsg">{{ errorMsg }}</div>

  <div class="loading-wrap" *ngIf="loading">
    <div class="loader"></div><p>Chargement...</p>
  </div>

  <div *ngIf="!loading">
    <div class="profile-banner">
      <div class="banner-left">
        <div class="avatar-wrap">
          <img *ngIf="avatarPreview || profile?.profilePicture"
               [src]="avatarPreview || resolveUrl(profile?.profilePicture)" class="avatar-img" />
          <div class="avatar-ph" *ngIf="!avatarPreview && !profile?.profilePicture">{{ initials }}</div>
        </div>
        <div class="banner-info">
          <p class="banner-name">{{ form.get('firstName')?.value || 'Prenom' }} {{ form.get('lastName')?.value || 'Nom' }}</p>
          <p class="banner-title">{{ form.get('jobTitle')?.value || 'Title not defined' }}</p>
          <div class="banner-stats">
            <div class="bstat"><span class="bstat-val">{{ skills.length }}</span><span class="bstat-lbl">Skills</span></div>
            <div class="bstat-div"></div>
            <div class="bstat"><span class="bstat-val">{{ certifications.length }}</span><span class="bstat-lbl">Certifications</span></div>
            <div class="bstat-div"></div>
            <div class="bstat"><span class="bstat-val">{{ profile?.rating?.toFixed(1) || '---' }}</span><span class="bstat-lbl">Rating</span></div>
          </div>
        </div>
      </div>
      <div class="banner-right">
        <div class="completion-circle">
          <svg viewBox="0 0 36 36" class="circle-svg">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" stroke-width="3"
              [attr.stroke-dasharray]="completionPct + ' ' + (100 - completionPct)"
              stroke-dashoffset="25" stroke-linecap="round"/>
          </svg>
          <div class="circle-center"><span class="circle-pct">{{ completionPct }}%</span></div>
        </div>
        <p class="completion-lbl">Profil complete</p>
      </div>
    </div>

    <form [formGroup]="form" (ngSubmit)="save()">
      <div class="form-card">
        <div class="section-title">Personal information</div>
        <div class="form-grid">
          <div class="form-group"><label>First name *</label><input formControlName="firstName" placeholder="Your first name" [class.invalid]="inv('firstName')" /><span class="err" *ngIf="inv('firstName')">Required</span></div>
          <div class="form-group"><label>Last name *</label><input formControlName="lastName" placeholder="Your last name" [class.invalid]="inv('lastName')" /><span class="err" *ngIf="inv('lastName')">Required</span></div>
          <div class="form-group"><label>Job title</label><input formControlName="jobTitle" placeholder="e.g. Full Stack Developer" /></div>
          <div class="form-group"><label>Phone</label><input formControlName="phone" placeholder="+216 ..." /></div>
          <div class="form-group"><label>Country</label><input formControlName="country" placeholder="e.g. Tunisia" /></div>
          <div class="form-group"><label>City</label><input formControlName="location" placeholder="e.g. Tunis" /></div>
          <div class="form-group span2"><label>Bio / Summary</label><textarea formControlName="bio" rows="4" placeholder="Describe your background..."></textarea></div>
        </div>
      </div>

      <div class="form-card">
        <div class="section-title">Skills</div>
        <div class="skills-input-row">
          <input [(ngModel)]="newSkill" [ngModelOptions]="{standalone: true}" placeholder="Add a skill (e.g. Angular, Java...)" class="skill-input" (keyup.enter)="addSkill()" />
          <button type="button" class="btn-add" (click)="addSkill()">+ Add</button>
        </div>
        <div class="skills-list">
          <div class="skill-chip" *ngFor="let s of skills; let i = index"><span>{{ s }}</span><button type="button" class="chip-del" (click)="removeSkill(i)">x</button></div>
          <p class="empty-chips" *ngIf="skills.length === 0">No skills added</p>
        </div>
      </div>

      <div class="form-card">
        <div class="section-title">Professional links</div>
        <div class="form-grid">
          <div class="form-group"><label>LinkedIn</label><input formControlName="linkedinUrl" placeholder="https://linkedin.com/in/..." /></div>
          <div class="form-group"><label>Portfolio</label><input formControlName="portfolioUrl" placeholder="https://myportfolio.com" /></div>
          <div class="form-group span2"><label>Resume URL</label><input formControlName="resumeUrl" placeholder="https://... or leave empty" /></div>
        </div>
      </div>

      <div class="form-card">
        <div class="section-title">Certifications</div>
        <div class="skills-input-row">
          <input [(ngModel)]="newCert" [ngModelOptions]="{standalone: true}" placeholder="Add a certification (e.g. AWS, PMP...)" class="skill-input" (keyup.enter)="addCert()" />
          <button type="button" class="btn-add" (click)="addCert()">+ Add</button>
        </div>
        <div class="skills-list">
          <div class="skill-chip cert-chip" *ngFor="let c of certifications; let i = index"><span>{{ c }}</span><button type="button" class="chip-del" (click)="removeCert(i)">x</button></div>
          <p class="empty-chips" *ngIf="certifications.length === 0">No certifications added</p>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-save" [disabled]="submitting">
          <span *ngIf="!submitting">Save profile</span>
          <span *ngIf="submitting" class="saving"><span class="btn-loader"></span> Saving...</span>
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
    :host { --bg: #f0ece4; --card: #ffffff; --border: #e8e0d0; --text: #1a1a2e; --text-muted: #6b7280; --accent: #f59e0b; --accent-light: #fef3c7; }
    .page { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; padding: 28px 28px 60px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; }
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
    .profile-banner { background: #1a1a2e; border-radius: 16px; padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; box-shadow: 0 4px 24px rgba(26,26,46,0.25); }
    .banner-left { display: flex; align-items: center; gap: 20px; }
    .avatar-wrap { width: 72px; height: 72px; border-radius: 50%; border: 3px solid #f59e0b; background: rgba(245,158,11,0.15); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-ph { font-size: 26px; font-weight: 800; color: #f59e0b; }
    .banner-info { display: flex; flex-direction: column; gap: 4px; }
    .banner-name { font-size: 18px; font-weight: 800; color: #ffffff; margin: 0; }
    .banner-title { font-size: 13px; color: rgba(255,255,255,0.6); margin: 0; }
    .banner-stats { display: flex; align-items: center; margin-top: 10px; }
    .bstat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0 16px; }
    .bstat:first-child { padding-left: 0; }
    .bstat-val { font-size: 18px; font-weight: 800; color: #f59e0b; }
    .bstat-lbl { font-size: 10px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .bstat-div { width: 1px; height: 32px; background: rgba(255,255,255,0.15); }
    .banner-right { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .completion-circle { position: relative; width: 72px; height: 72px; }
    .circle-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
    .circle-center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .circle-pct { font-size: 16px; font-weight: 800; color: #f59e0b; }
    .completion-lbl { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
    .form-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 16px; }
    .section-title { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f59e0b; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 2px solid #fef3c7; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.span2 { grid-column: span 2; }
    label { font-size: 12.5px; font-weight: 600; color: var(--text-muted); }
    .err { font-size: 11px; color: #f06548; }
    input, textarea { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 10px 13px; font-size: 13.5px; color: var(--text); outline: none; transition: border-color .2s; font-family: inherit; }
    input:focus, textarea:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    input.invalid { border-color: #f06548; }
    textarea { resize: vertical; }
    .skills-input-row { display: flex; gap: 10px; margin-bottom: 12px; }
    .skill-input { flex: 1; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 10px 13px; font-size: 13.5px; color: var(--text); outline: none; }
    .skill-input:focus { border-color: #f59e0b; }
    .btn-add { background: #fef3c7; border: 1px solid rgba(245,158,11,0.4); color: #f59e0b; border-radius: 12px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-add:hover { background: #fde68a; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-chip { display: inline-flex; align-items: center; gap: 6px; background: #fef3c7; border: 1px solid rgba(245,158,11,0.3); color: #1a1a2e; border-radius: 20px; padding: 5px 12px; font-size: 13px; font-weight: 600; }
    .cert-chip { color: #f59e0b; }
    .chip-del { background: none; border: none; color: inherit; cursor: pointer; font-size: 11px; padding: 0; opacity: .7; }
    .chip-del:hover { opacity: 1; }
    .empty-chips { font-size: 12px; color: #d1d5db; margin: 0; }
    .form-actions { display: flex; justify-content: flex-end; padding-top: 4px; }
    .btn-save { background: #1a1a2e; color: #fff; border: none; border-radius: 12px; padding: 12px 32px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all .2s; box-shadow: 0 4px 20px rgba(26,26,46,0.2); }
    .btn-save:hover:not(:disabled) { transform: translateY(-1px); background: #2d2d4e; }
    .btn-save:disabled { opacity: .5; cursor: not-allowed; }
    .saving { display: flex; align-items: center; gap: 8px; }
    .btn-loader { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
    @media (max-width: 768px) { .profile-banner { flex-direction: column; gap: 16px; } .banner-left { flex-direction: column; text-align: center; } .form-grid { grid-template-columns: 1fr; } .form-group.span2 { grid-column: span 1; } .page { padding: 16px 14px 40px; } }
  `]
})
export class CandidateProfileComponent implements OnInit {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  form!: FormGroup;
  profile: any = null;
  loading    = true;
  submitting = false;
  successMsg = '';
  errorMsg   = '';
  avatarPreview: string | null = null;

  skills: string[]         = [];
  certifications: string[] = [];
  newSkill = '';
  newCert  = '';

  private readonly base = API_ENDPOINTS['candidateProfile'];

  ngOnInit(): void { this.buildForm(); this.loadProfile(); }

  buildForm(): void {
    this.form = this.fb.group({
      firstName:    ['', Validators.required],
      lastName:     ['', Validators.required],
      phone:        [''],
      jobTitle:     [''],
      country:      [''],
      location:     [''],
      bio:          [''],
      resumeUrl:    [''],
      linkedinUrl:  [''],
      portfolioUrl: [''],
    });
  }

  inv(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  get initials(): string {
    const f = this.form.get('firstName')?.value?.charAt(0)?.toUpperCase() || '';
    const l = this.form.get('lastName')?.value?.charAt(0)?.toUpperCase() || '';
    return (f + l) || '?';
  }

  get completionPct(): number {
    const fields = ['firstName', 'lastName', 'jobTitle', 'bio', 'location', 'resumeUrl', 'linkedinUrl'];
    const filled = fields.filter(f => !!this.form.get(f)?.value).length;
    const skillBonus = this.skills.length > 0 ? 1 : 0;
    return Math.round(((filled + skillBonus) / (fields.length + 1)) * 100);
  }

  resolveUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  loadProfile(): void {
    this.loading = true;
    this.http.get<any>(this.base).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.profile = data;
        if (data) {
          this.form.patchValue({ firstName: data.firstName ?? '', lastName: data.lastName ?? '', phone: data.phone ?? '', jobTitle: data.jobTitle ?? '', country: data.country ?? '', location: data.location ?? '', bio: data.bio ?? '', resumeUrl: data.resumeUrl ?? '', linkedinUrl: data.linkedinUrl ?? '', portfolioUrl: data.portfolioUrl ?? '' });
          this.skills         = Array.isArray(data.skills)         ? [...data.skills]         : [];
          this.certifications = Array.isArray(data.certifications) ? [...data.certifications] : [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        if (err?.status !== 404) { this.errorMsg = 'Erreur lors du chargement.'; setTimeout(() => { this.errorMsg = ''; this.cdr.detectChanges(); }, 5000); }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  addSkill(): void { const s = this.newSkill.trim(); if (s && !this.skills.includes(s)) this.skills = [...this.skills, s]; this.newSkill = ''; }
  removeSkill(i: number): void { this.skills = this.skills.filter((_, idx) => idx !== i); }
  addCert(): void { const c = this.newCert.trim(); if (c && !this.certifications.includes(c)) this.certifications = [...this.certifications, c]; this.newCert = ''; }
  removeCert(i: number): void { this.certifications = this.certifications.filter((_, idx) => idx !== i); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.errorMsg = '';
    this.successMsg = '';
    const payload = { ...this.form.value, skills: this.skills, certifications: this.certifications };
    this.http.post<any>(this.base, payload).subscribe({
      next: (res: any) => {
        this.profile = res?.data ?? res;
        this.submitting = false;
        this.successMsg = 'Profile saved successfully!';
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 4000);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.submitting = false;
        this.errorMsg = err?.error?.message || 'Error saving.';
        setTimeout(() => { this.errorMsg = ''; this.cdr.detectChanges(); }, 6000);
        this.cdr.detectChanges();
      }
    });
  }
}
