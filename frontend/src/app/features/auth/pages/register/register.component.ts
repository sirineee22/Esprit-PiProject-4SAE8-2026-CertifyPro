import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../users/services/users.api';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../shared/models/user.model';
import { catchError, finalize, switchMap, throwError, timeout } from 'rxjs';
import { TrainerRequestService } from '../../../trainer-requests/services/trainer-request.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">
      <!-- Back to Home -->
      <a routerLink="/" class="back-home-btn animate-fade-in">
        <i class="bi bi-arrow-left"></i>
        <span>Back to Home</span>
      </a>

      <div class="auth-card animate-slide-up">
        <!-- Left Panel: Brand & Info -->
        <div class="left-panel">
          <div class="brand-section">
            <div class="logo-box">
               <div class="logo-glow"></div>
               <i class="bi bi-mortarboard-fill logo-icon-auth"></i>
            </div>
            <div class="brand-text-group">
                <h1 class="brand-name">CERTIFY<span>PRO</span></h1>
                <p class="brand-tagline">GLOBAL STANDARD</p>
            </div>
          </div>

          <div class="welcome-section">
            <h2 class="welcome-title">Join our global community of professionals today.</h2>
            <p class="welcome-tagline">Start your journey toward industry-recognized certifications.</p>
          </div>

          <!-- Decorative element -->
          <div class="registration-info-badge">
             <i class="bi bi-shield-check"></i>
             <div>
               <strong>VERIFIED TRUST</strong>
               <span>Trusted by 100K+ learners</span>
             </div>
          </div>
        </div>

        <!-- Right Panel: Form -->
        <div class="right-panel">
          <div class="form-wrapper">
            <h2 class="form-title">Create Account</h2>
            <p class="form-subtitle">
              Already have an account? 
              <a routerLink="/login" class="accent-link">Sign in</a>
            </p>

            <!-- Role Selection -->
            <div class="role-selection" *ngIf="!selectedRole">
              <h3 class="role-title">I want to join as:</h3>
              <div class="role-cards">
                <div class="role-card" (click)="selectRole('LEARNER')">
                  <i class="bi bi-book"></i>
                  <h4>Learner</h4>
                  <p>Access courses and earn certifications</p>
                </div>
                <div class="role-card" (click)="selectRole('TRAINER')">
                  <i class="bi bi-person-workspace"></i>
                  <h4>Trainer</h4>
                  <p>Share your expertise and teach others</p>
                </div>
              </div>
            </div>

            <!-- Registration Form -->
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form" *ngIf="selectedRole && !showSuccessModal">
              <div class="selected-role-badge">
                <i class="bi" [ngClass]="selectedRole === 'LEARNER' ? 'bi-book' : 'bi-person-workspace'"></i>
                <span>Registering as {{ selectedRole === 'LEARNER' ? 'Learner' : 'Trainer' }}</span>
                <button type="button" class="change-role-btn" (click)="changeRole()">Change</button>
              </div>

              <!-- Basic Info Section -->
              <div *ngIf="selectedRole === 'LEARNER' || (selectedRole === 'TRAINER' && trainerStep === 1)">
                <div class="row gx-3">
                    <div class="col-6">
                      <div class="form-group">
                        <label class="input-label">FIRST NAME</label>
                        <input type="text" formControlName="firstName" placeholder="sirine" class="auth-input no-icon" [class.is-invalid]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched">
                        <div class="error-msg" *ngIf="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched">Prénom requis</div>
                      </div>
                   </div>
                   <div class="col-6">
                      <div class="form-group">
                        <label class="input-label">LAST NAME</label>
                        <input type="text" formControlName="lastName" placeholder="Dah" class="auth-input no-icon" [class.is-invalid]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched">
                        <div class="error-msg" *ngIf="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched">Nom requis</div>
                      </div>
                   </div>
                </div>

                <div class="form-group">
                  <label class="input-label">EMAIL ADDRESS</label>
                  <div class="input-container">
                    <i class="bi bi-envelope"></i>
                    <input type="email" formControlName="email" placeholder="sirine@example.com" class="auth-input" [class.is-invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
                  </div>
                  <div class="error-msg" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">Email invalide</div>
                </div>

                <div class="form-group">
                  <label class="input-label">PHONE NUMBER</label>
                  <div class="input-container">
                    <i class="bi bi-telephone"></i>
                    <input type="tel" formControlName="phoneNumber" placeholder="+216 12 345 678" class="auth-input" [class.is-invalid]="registerForm.get('phoneNumber')?.invalid && registerForm.get('phoneNumber')?.touched">
                  </div>
                  <div class="error-msg" *ngIf="registerForm.get('phoneNumber')?.invalid && registerForm.get('phoneNumber')?.touched">Format invalide</div>
                </div>

                <div class="form-group">
                  <label class="input-label">SET PASSWORD</label>
                  <div class="input-container">
                    <i class="bi bi-shield-lock"></i>
                    <input type="password" formControlName="password" placeholder="••••••••••••" class="auth-input" [class.is-invalid]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                  </div>
                  <div class="error-msg" *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">8 caractères minimum</div>
                </div>

                <!-- Next Button (Trainer Step 1) -->
                <button type="button" class="submit-btn next-btn" *ngIf="selectedRole === 'TRAINER'" (click)="nextStep()">
                  <span>Next Step</span>
                  <i class="bi bi-arrow-right"></i>
                </button>

                <!-- Submit Button (Learner) -->
                <button type="submit" class="submit-btn" *ngIf="selectedRole === 'LEARNER'" [disabled]="registerForm.invalid || isSubmitting">
                  <span *ngIf="!isSubmitting">Get Started</span>
                  <span *ngIf="isSubmitting">Processing...</span>
                  <i class="bi bi-chevron-right" *ngIf="!isSubmitting"></i>
                </button>
              </div>

              <!-- Trainer-specific fields (Step 2) -->
              <div *ngIf="selectedRole === 'TRAINER' && trainerStep === 2" class="trainer-fields animate-slide-up">
                <div class="step-header">
                  <h3 class="section-title">Trainer Qualifications</h3>
                  <span class="step-indicator">Step 2 of 2</span>
                </div>
                
                <div class="form-group">
                  <label class="input-label">SUBJECTS YOU CAN TEACH</label>
                  <input type="text" formControlName="subjects" placeholder="e.g., Java, Python, Web Development" class="auth-input no-icon" [class.is-invalid]="registerForm.get('subjects')?.invalid && registerForm.get('subjects')?.touched">
                  <small class="field-hint">Separate multiple subjects with commas</small>
                  <div class="error-msg" *ngIf="registerForm.get('subjects')?.invalid && registerForm.get('subjects')?.touched">Sujets requis</div>
                </div>

                <div class="form-group">
                  <label class="input-label">YEARS OF EXPERIENCE</label>
                  <input type="text" formControlName="experience" placeholder="e.g., 5 years" class="auth-input no-icon" [class.is-invalid]="registerForm.get('experience')?.invalid && registerForm.get('experience')?.touched">
                  <div class="error-msg" *ngIf="registerForm.get('experience')?.invalid && registerForm.get('experience')?.touched">Expérience requise</div>
                </div>

                <div class="form-group">
                  <label class="input-label">LINKEDIN PROFILE (optional) </label>
                  <input type="url" formControlName="certificatesLink" placeholder="https://..." class="auth-input no-icon">
                </div>

                <div class="form-group">
                  <label class="input-label">WHY DO YOU WANT TO BE A TRAINER?</label>
                  <textarea formControlName="message" rows="4" placeholder="Tell us about your motivation and teaching experience..." class="auth-textarea" [class.is-invalid]="registerForm.get('message')?.invalid && registerForm.get('message')?.touched"></textarea>
                  <div class="error-msg" *ngIf="registerForm.get('message')?.invalid && registerForm.get('message')?.touched">Précisez votre motivation (20 chars min)</div>
                </div>

                <div class="step-actions">
                  <button type="button" class="back-link-btn" (click)="prevStep()">
                    <i class="bi bi-arrow-left"></i>
                    <span>Back</span>
                  </button>
                  <button type="submit" class="submit-btn" [disabled]="registerForm.invalid || isSubmitting">
                    <span *ngIf="!isSubmitting">Submit Application</span>
                    <span *ngIf="isSubmitting">Submitting...</span>
                    <i class="bi bi-check2-circle" *ngIf="!isSubmitting"></i>
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          <div class="copyright">
             © 2024 CERTIFYPRO GLOBAL ENTERPRISE
          </div>
        </div>
      </div>

      <!-- Success Modal for Trainers -->
      <div class="modal-overlay" *ngIf="showSuccessModal" (click)="closeSuccessModal()">
        <div class="success-modal" (click)="$event.stopPropagation()">
          <div class="success-icon">
            <i class="bi bi-check-circle"></i>
          </div>
          <h2>Application Submitted!</h2>
          <p>Thank you for applying to become a trainer on CertifyPro.</p>
          <p class="modal-message">Your application is now under review by our admin team. You'll receive an email notification once your account is approved.</p>
          <p class="modal-note"><strong>Note:</strong> You won't be able to log in until your trainer application is approved.</p>
          <button class="modal-btn" (click)="closeSuccessModal()">Got it</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-dark: #0B0F1A;
      --accent-orange: #f59e0b;
      --text-muted: #6B7280;
    }

    .page-container {
      min-height: 100vh;
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      overflow-y: auto;
    }

    .back-home-btn {
      position: absolute;
      top: 2rem;
      left: 2rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
      z-index: 10;
    }

    .back-home-btn:hover {
      color: #0b1120;
      transform: translateX(-4px);
    }

    .auth-card {
      width: 100%;
      max-width: 1000px;
      background: white;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      display: flex;
      overflow: hidden;
      margin: auto;
    }

    .left-panel {
      flex: 1.1;
      background: #0b1120;
      padding: 3.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: white;
      overflow-y: auto;
    }

    .brand-section { display: flex; align-items: center; gap: 1rem; }

    .logo-box {
      width: 44px;
      height: 44px;
      background: #1e1e2d;
      border-radius: 12px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .logo-glow {
      position: absolute;
      inset: -2px;
      background: linear-gradient(135deg, #f59e0b, transparent);
      border-radius: 13px;
      opacity: 0.5;
    }

    .logo-icon-auth {
      color: white;
      font-size: 1.5rem;
      z-index: 1;
    }

    .brand-text-group .brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.05em;
    }
    .brand-text-group .brand-name span { color: #f59e0b; }
    .brand-tagline { font-size: 0.65rem; letter-spacing: 0.3em; opacity: 0.5; margin: 0; }

    .welcome-title { font-size: 2.2rem; font-weight: 700; line-height: 1.1; margin-bottom: 1.5rem; }
    .welcome-tagline { color: #94a3b8; font-size: 1.1rem; }

    .registration-info-badge {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #f59e0b;
    }

    .registration-info-badge i { font-size: 1.5rem; }
    .registration-info-badge strong { display: block; font-size: 0.75rem; letter-spacing: 0.1em; color: white; }
    .registration-info-badge span { font-size: 0.8rem; color: #94a3b8; }

    .right-panel {
      flex: 1;
      padding: 3.5rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow-y: auto;
    }

    .form-wrapper { width: 100%; margin: auto; }
    .form-title { font-size: 2rem; font-weight: 800; color: #0b1f3b; margin-bottom: 0.5rem; }
    .form-subtitle { color: #6b7280; margin-bottom: 2rem; font-weight: 500; }
    .accent-link { color: #f59e0b; font-weight: 700; text-decoration: none; }
    .accent-link:hover { text-decoration: underline; }

    /* Role Selection */
    .role-selection { margin-top: 1rem; }
    .role-title { font-size: 1.1rem; font-weight: 700; color: #0b1f3b; margin-bottom: 1.5rem; }
    .role-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .role-card {
      padding: 2rem 1.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .role-card:hover {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.05);
      transform: translateY(-2px);
    }
    .role-card i {
      font-size: 2.5rem;
      color: #f59e0b;
      margin-bottom: 1rem;
    }
    .role-card h4 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0b1f3b;
      margin-bottom: 0.5rem;
    }
    .role-card p {
      font-size: 0.85rem;
      color: #6b7280;
      margin: 0;
    }

    .selected-role-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-weight: 600;
      color: #0b1f3b;
    }
    .selected-role-badge i { color: #f59e0b; }
    .change-role-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: #f59e0b;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0b1f3b;
      margin: 1.5rem 0 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .trainer-fields {
      background: rgba(245, 158, 11, 0.03);
      padding: 1.5rem;
      border-radius: 12px;
      margin-top: 1rem;
    }

    .form-group { margin-bottom: 1.25rem; }
    .input-label { display: block; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 0.6rem; }

    .input-container { position: relative; display: flex; align-items: center; }
    .input-container i { position: absolute; left: 1rem; color: #9ca3af; font-size: 1.1rem; }

    .auth-input, .auth-textarea {
      width: 100%;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 0.8rem 1rem 0.8rem 2.8rem;
      font-size: 0.95rem;
      transition: all 0.2s;
      font-family: inherit;
    }

    .auth-input.no-icon, .auth-textarea { padding-left: 1rem; }
    
    .auth-input.is-invalid, .auth-textarea.is-invalid {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .error-msg {
      color: #ef4444;
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 0.25rem;
    }

    .auth-input:focus, .auth-textarea:focus {
      outline: none;
      border-color: #f59e0b;
      background: white;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
    }

    .field-hint {
      display: block;
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }

    .submit-btn {
      width: 100%;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 1.1rem;
      font-weight: 700;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.25);
      transition: all 0.2s;
    }

    .submit-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .next-btn {
      background: #f59e0b;
      box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.25);
    }
    .next-btn:hover:not(:disabled) { background: #d97706; }

    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .step-indicator {
      font-size: 0.75rem;
      font-weight: 700;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
    }

    .step-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .back-link-btn {
      background: none;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-link-btn:hover {
      color: #0b1120;
      transform: translateX(-4px);
    }

    .trainer-fields .section-title {
      border-top: none;
      margin: 0;
      padding-top: 0;
    }

    .copyright {
      padding-top: 2rem;
      text-align: center;
      font-size: 0.7rem;
      font-weight: 800;
      color: #d1d5db;
      letter-spacing: 0.1em;
    }

    /* Success Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20000;
      animation: fadeIn 0.3s;
    }

    .success-modal {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      max-width: 500px;
      text-align: center;
      animation: slideUp 0.3s;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: rgba(34, 197, 94, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .success-icon i {
      font-size: 3rem;
      color: #22c55e;
    }

    .success-modal h2 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0b1f3b;
      margin-bottom: 1rem;
    }

    .success-modal p {
      color: #6b7280;
      margin-bottom: 1rem;
      line-height: 1.6;
    }

    .modal-message {
      font-weight: 500;
    }

    .modal-note {
      background: rgba(245, 158, 11, 0.1);
      border-left: 3px solid #f59e0b;
      padding: 1rem;
      border-radius: 8px;
      text-align: left;
      margin-top: 1.5rem;
    }

    .modal-btn {
      margin-top: 2rem;
      padding: 0.875rem 2rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .modal-btn:hover {
      background: #1d4ed8;
    }

    .animate-fade-in { animation: fadeIn 0.8s ease-out; }
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 900px) {
      .auth-card { flex-direction: column; height: auto; max-width: 500px; }
      .right-panel { padding: 2.5rem; }
      .role-cards { grid-template-columns: 1fr; }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  selectedRole: 'LEARNER' | 'TRAINER' | null = null;
  trainerStep: number = 1;
  isSubmitting = false;
  showSuccessModal = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private trainerRequestService: TrainerRequestService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      // Trainer-specific fields
      subjects: [''],
      experience: [''],
      certificatesLink: [''],
      message: ['']
    });
  }

  selectRole(role: 'LEARNER' | 'TRAINER') {
    this.selectedRole = role;
    this.trainerStep = 1;

    // Add validators for trainer fields
    if (role === 'TRAINER') {
      this.registerForm.get('subjects')?.setValidators([Validators.required]);
      this.registerForm.get('experience')?.setValidators([Validators.required]);
      this.registerForm.get('message')?.setValidators([Validators.required, Validators.minLength(20)]);
    } else {
      this.registerForm.get('subjects')?.clearValidators();
      this.registerForm.get('experience')?.clearValidators();
      this.registerForm.get('message')?.clearValidators();
    }

    this.registerForm.get('subjects')?.updateValueAndValidity();
    this.registerForm.get('experience')?.updateValueAndValidity();
    this.registerForm.get('message')?.updateValueAndValidity();
  }

  changeRole() {
    this.selectedRole = null;
    this.trainerStep = 1;
    this.registerForm.reset();
  }

  nextStep() {
    // Only proceed if basic info fields are valid
    const basicFields = ['firstName', 'lastName', 'email', 'password'];
    let isValid = true;

    basicFields.forEach(field => {
      const control = this.registerForm.get(field);
      if (control && control.invalid) {
        control.markAsTouched();
        isValid = false;
      }
    });

    if (isValid) {
      this.trainerStep = 2;
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    this.trainerStep = 1;
  }

  onSubmit() {
    if (this.registerForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.cdr.detectChanges();

    if (this.selectedRole === 'LEARNER') {
      this.registerAsLearner();
    } else {
      this.registerAsTrainer();
    }
  }

  private registerAsLearner() {
    const user: User = {
      ...this.registerForm.value,
      active: true
    };

    this.userService.create(user).subscribe({
      next: (createdUser: User) => {
        console.log('Learner registered successfully:', createdUser);
        this.authService.setSession(createdUser);
        this.router.navigate(['/']);
      },
      error: (e: unknown) => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        console.error('Registration failed', e);
        if (e instanceof HttpErrorResponse && e.status === 409) {
          alert('Email already exists. Please use a different email.');
          return;
        }
        alert('Registration failed. Please try again.');
      }
    });
  }

  private registerAsTrainer() {
    const user: User = {
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      email: this.registerForm.value.email,
      phoneNumber: this.registerForm.value.phoneNumber,
      password: this.registerForm.value.password,
      active: false
    };


    this.userService.create(user).subscribe({
      next: (createdUser: User) => {

        if (!createdUser?.id) {
          console.error('ERROR: No user ID in response');
          this.isSubmitting = false;
          this.cdr.detectChanges();
          alert('Registration failed. Please try again.');
          return;
        }

        // Show success after submit click has completed
        this.isSubmitting = false;
        this.showSuccessModal = true;
        this.cdr.detectChanges();

        const request = {
          userId: createdUser.id,
          subjects: this.registerForm.value.subjects,
          message: this.registerForm.value.message,
          experience: this.registerForm.value.experience,
          certificatesLink: this.registerForm.value.certificatesLink
        };

        // Trainer request requires JWT; obtain session then submit
        this.authService
          .login(this.registerForm.value.email, this.registerForm.value.password)
          .pipe(
            switchMap((loginRes) => {
              if (loginRes.user && loginRes.token) {
                this.authService.setSession(loginRes.user, loginRes.token);
              }
              return this.trainerRequestService.submitRequest(request);
            })
          )
          .subscribe({
            next: (response) => {
              console.log('Trainer request submitted', response);
            },
            error: (e: unknown) => {
              console.error('Trainer request or login failed', e);
            }
          });
      },
      error: (e: unknown) => {
        console.error('Trainer registration failed', e);
        this.isSubmitting = false;
        this.cdr.detectChanges();
        if (e instanceof HttpErrorResponse && e.status === 409) {
          alert('Email already exists. Please use a different email.');
          return;
        }
        alert('Registration failed. Please try again.');
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/login']);
  }
}
