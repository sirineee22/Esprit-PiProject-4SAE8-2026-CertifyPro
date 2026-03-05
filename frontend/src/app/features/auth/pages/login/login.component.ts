import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, LoginResponse } from '../../../../core/auth/auth.service';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-login',
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
            <h2 class="welcome-title">Welcome back to CertifyPro. We are ready to help you achieve your next professional milestone.</h2>
            <p class="welcome-tagline">Your expertise, verified with precision and integrity.</p>
          </div>

          <!-- Active Batch Card -->
          <div class="active-batch-card">
            <div class="batch-header">
              <div class="batch-dots">
                <span class="dot">A</span>
                <span class="dot">B</span>
                <span class="dot">C</span>
                <span class="dot active">D</span>
              </div>
              <span class="batch-label">ACTIVE BATCH</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: 78.2%"></div>
              </div>
            </div>
            <div class="batch-footer">
              <span class="footer-label">SUCCESS RATING</span>
              <span class="footer-value">98.2%</span>
            </div>
          </div>
        </div>

        <!-- Right Panel: Form -->
        <div class="right-panel">
          <div class="form-wrapper">
            <h2 class="form-title">Identity Access</h2>
            <p class="form-subtitle">
              New to the platform? 
              <a routerLink="/register" class="accent-link">Register now</a>
            </p>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
              <div class="form-group">
                <label class="input-label">WORK EMAIL ADDRESS</label>
                <div class="input-container">
                  <i class="bi bi-envelope"></i>
                  <input type="email" formControlName="email" placeholder="sirine@organization.com" class="auth-input">
                </div>
              </div>

              <div class="form-group">
                <label class="input-label">SECURE CREDENTIAL</label>
                <div class="input-container">
                  <i class="bi bi-shield-lock"></i>
                  <input type="password" formControlName="password" placeholder="••••••••••••" class="auth-input">
                </div>
                <button type="button" class="forgot-btn">FORGOT ACCESS?</button>
              </div>

              <button type="submit" class="submit-btn" [disabled]="loginForm.invalid || isSubmitting">
                <span *ngIf="!isSubmitting">Access Portal <i class="bi bi-chevron-right"></i></span>
                <span *ngIf="isSubmitting">Signing in…</span>
              </button>

              <div class="divider">
                <span>ENTERPRISE AUTHENTICATION</span>
              </div>

              <div class="social-grid">
                <button type="button" class="social-btn">
                  <i class="bi bi-linkedin color-linkedin"></i> LinkedIn
                </button>
                <button type="button" class="social-btn">
                  <i class="bi bi-microsoft color-microsoft"></i> Microsoft
                </button>
              </div>
            </form>
          </div>
          
          <div class="copyright">
             © 2024 CERTIFYPRO GLOBAL ENTERPRISE
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-dark: #0B0F1A;
      --accent-orange: #f59e0b;
      --text-muted: #6B7280;
      --border-color: #E5E7EB;
    }

    .page-container {
      min-height: 100vh;
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      z-index: 10000;
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
      height: 650px;
      max-height: 90vh;
      background: white;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      display: flex;
      overflow: hidden;
      margin: auto;
    }

    /* Left Panel */
    .left-panel {
      flex: 1.1;
      background: #0b1120;
      padding: 3.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: white;
      position: relative;
      overflow-y: auto;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

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
    
    .brand-tagline {
      font-size: 0.65rem;
      letter-spacing: 0.3em;
      opacity: 0.5;
      margin: 0;
    }

    .welcome-title {
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 1.5rem;
    }

    .welcome-tagline {
      color: #94a3b8;
      font-size: 1.1rem;
    }

    /* Active Batch card in left panel */
    .active-batch-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .batch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .batch-dots {
      display: flex;
      gap: 0.4rem;
    }

    .dot {
      width: 24px;
      height: 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 800;
    }

    .dot.active { background: #f59e0b; color: #000; }

    .batch-label {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #f59e0b;
    }

    .progress-bar {
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      margin: 1.5rem 0;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #f59e0b;
      border-radius: 10px;
    }

    .batch-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }

    .footer-label { opacity: 0.4; letter-spacing: 0.05em; font-weight: 600; }
    .footer-value { font-weight: 700; font-size: 0.85rem; }

    /* Right Panel */
    .right-panel {
      flex: 1;
      padding: 3.5rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
    }

    .form-wrapper { width: 100%; margin: auto; }

    .form-title {
      font-size: 2rem;
      font-weight: 800;
      color: #0b1f3b;
      margin-bottom: 0.5rem;
    }

    .form-subtitle { color: #6b7280; margin-bottom: 2.5rem; font-weight: 500; }
    
    .accent-link {
      color: #f59e0b;
      font-weight: 700;
      text-decoration: none;
    }

    .accent-link:hover { text-decoration: underline; }

    .form-group { margin-bottom: 1.5rem; position: relative; }

    .input-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #9ca3af;
      margin-bottom: 0.6rem;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-container i {
      position: absolute;
      left: 1rem;
      color: #9ca3af;
      font-size: 1.1rem;
    }

    .auth-input {
      width: 100%;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 0.8rem 1rem 0.8rem 2.8rem;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .auth-input:focus {
      outline: none;
      border-color: #f59e0b;
      background: white;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
    }

    .forgot-btn {
      position: absolute;
      right: 0;
      bottom: -1.4rem;
      background: none;
      border: none;
      font-size: 0.7rem;
      font-weight: 800;
      color: #9ca3af;
      cursor: pointer;
    }

    .forgot-btn:hover { color: #f59e0b; }

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
      margin-top: 2.5rem;
      cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.25);
      transition: all 0.2s;
    }

    .submit-btn:hover:not(:disabled) {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.3);
    }

    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .divider {
      text-align: center;
      margin: 2rem 0;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      left: 0; top: 50%; width: 100%; height: 1px;
      background: #e5e7eb;
    }

    .divider span {
      position: relative;
      background: white;
      padding: 0 1rem;
      font-size: 0.65rem;
      font-weight: 800;
      color: #9ca3af;
      letter-spacing: 0.1em;
    }

    .social-grid { display: flex; gap: 1rem; }

    .social-btn {
      flex: 1;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 0.75rem;
      font-weight: 600;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .social-btn:hover { background: #f9fafb; border-color: #d1d5db; }

    .color-linkedin { color: #0077b5; }
    .color-microsoft { color: #5e5e5e; }

    .copyright {
      position: absolute;
      bottom: 2rem;
      left: 0;
      width: 100%;
      text-align: center;
      font-size: 0.7rem;
      font-weight: 800;
      color: #d1d5db;
      letter-spacing: 0.1em;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out;
    }

    .animate-slide-up {
      animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Mobile handling */
    @media (max-width: 900px) {
      .auth-card { flex-direction: column; height: auto; max-width: 500px; }
      .left-panel { padding: 2.5rem; }
      .right-panel { padding: 2.5rem 2.5rem 5rem; }
      .welcome-title { font-size: 1.7rem; }
      .page-container { padding: 1rem; }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (!this.loginForm.valid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const { email, password } = this.loginForm.value as { email: string; password: string };
    this.authService.login(email, password).subscribe({
      next: (response: LoginResponse) => {
        this.authService.setSession(response.user, response.token);
        if (response.user.role?.name === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (e: unknown) => {
        this.isSubmitting = false;
        if (e instanceof HttpErrorResponse && e.status === 401) {
          alert('Invalid email or password.');
          return;
        }
        if (e instanceof HttpErrorResponse && e.status === 500) {
          alert('Server error. Please try again or contact support.');
          return;
        }
        alert('Login failed. Please try again.');
      }
    });
  }
}
