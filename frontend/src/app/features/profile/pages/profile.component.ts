import { Component, OnInit, signal, WritableSignal, ChangeDetectorRef, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../users/services/users.api';
import { ThemeService } from '../../../core/services/theme.service';
import { User, UserProgress } from '../../../shared/models/user.model';
import { API_BASE_URL } from '../../../core/api/api.config';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="profile-premium-wrapper">
      <!-- Profile Header -->
      <section class="profile-header-section">
        <div class="profile-header-bg">
          <div class="profile-bg-shape shape-1"></div>
          <div class="profile-bg-shape shape-2"></div>
        </div>
        <div class="profile-container">
          <div class="profile-header-card">
            <div class="profile-header-avatar">
              <div class="avatar-circle clickable" [class.has-image]="avatarImageUrl() && !imgError" (click)="triggerFileInput()" title="Changer la photo">
                <input #fileInput type="file" accept="image/jpeg,image/png,image/gif,image/webp" (change)="onFileSelected($event)" class="avatar-file-input">
                <img *ngIf="avatarImageUrl() && !imgError" [src]="avatarImageUrl()" alt="Profile" (error)="imgError = true">
                <span *ngIf="(!avatarImageUrl() || imgError) && initials()" class="avatar-initials">{{ initials() }}</span>
                <i *ngIf="(!avatarImageUrl() || imgError) && !initials()" class="bi bi-person-fill"></i>
                <span class="avatar-overlay" *ngIf="!uploadingImage()"><i class="bi bi-camera"></i> Photo</span>
                <span class="avatar-overlay uploading" *ngIf="uploadingImage()">...</span>
              </div>
            </div>
            <div class="profile-header-info">
              <h1 class="profile-header-name">{{currentUser()?.firstName}} {{currentUser()?.lastName}}</h1>
              <div class="profile-header-meta">
                <span class="meta-item">
                   <i class="bi bi-envelope"></i>
                   {{currentUser()?.email}}
                </span>
                <span class="meta-item">
                  <i class="bi bi-geo-alt"></i>
                  Membre CertifyPro
                </span>
                <span class="meta-item">
                  <i class="bi bi-calendar3"></i>
                  Membre depuis 2026
                </span>
              </div>
              <div class="xp-strip" *ngIf="progress() as p">
                <div class="xp-top">
                  <span class="xp-level">Level {{ p.levelNumber }} - {{ p.levelLabel }}</span>
                  <span class="xp-points">{{ p.xpTotal }} XP</span>
                </div>
                <div class="xp-bar">
                  <div class="xp-fill" [style.width.%]="progressPercent()"></div>
                </div>
                <div class="xp-next" *ngIf="p.xpToNextLevel > 0">{{ p.xpToNextLevel }} XP to next level</div>
                <div class="badges-list" *ngIf="p.badges.length">
                  <span class="badge-pill" *ngFor="let b of p.badges | slice:0:4">{{ b.badgeLabel }}</span>
                </div>
              </div>
            </div>
            <div class="profile-header-actions">
              <button class="btn-modifier" (click)="toggleEdit()" *ngIf="!isEditMode()" type="button" title="Modifier">
                <i class="bi bi-pencil"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Content Section -->
      <section class="profile-content-section">
        <div class="profile-container">
          <div class="profile-content-header">
            <h2 class="section-title">Account Settings</h2>
            <p class="section-description">Manage your credentials, security, and preferences.</p>
            <!-- Horizontal tab bar -->
            <nav class="profile-tabs">
              <button type="button" class="tab-pill" [class.active]="activeTab === 'general'" (click)="activeTab = 'general'">
                <i class="bi bi-person"></i>
                <span>Account Info</span>
              </button>
              <button type="button" class="tab-pill" [class.active]="activeTab === 'security'" (click)="activeTab = 'security'">
                <i class="bi bi-shield-lock"></i>
                <span>Security</span>
              </button>
              <button type="button" class="tab-pill" [class.active]="activeTab === 'appearance'" (click)="activeTab = 'appearance'">
                <i class="bi bi-palette"></i>
                <span>Preferences</span>
              </button>
            </nav>
          </div>

          <main class="content-surface">
            <!-- General Settings Tab -->
            <div class="tab-content" *ngIf="activeTab === 'general'">
              <div class="content-card-premium">
                <header class="card-title-group">
                  <h3>Account Credentials</h3>
                  <p>Update your personal information to maintain account accuracy</p>
                </header>

                <div class="card-main-area">
                  <!-- View Mode -->
                  <div class="profile-details-grid" *ngIf="!isEditMode() && currentUser()">
                    <div class="detail-block">
                      <label>First Name</label>
                      <div class="detail-value">{{currentUser()?.firstName}}</div>
                    </div>
                    <div class="detail-block">
                      <label>Last Name</label>
                      <div class="detail-value">{{currentUser()?.lastName}}</div>
                    </div>
                    <div class="detail-block wide">
                      <label>Email Address</label>
                      <div class="detail-value email-value">
                        <i class="bi bi-envelope"></i> {{currentUser()?.email}}
                      </div>
                    </div>
                    <div class="detail-block">
                      <label>Phone Number</label>
                      <div class="detail-value">{{currentUser()?.phoneNumber || 'No verified number'}}</div>
                    </div>
                    <div class="detail-block wide">
                      <label>Profile Picture</label>
                      <div class="detail-value">{{currentUser()?.profileImageUrl ? 'Set' : 'Not set'}}</div>
                    </div>
                  </div>

                  <!-- Edit Mode -->
                  <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" *ngIf="isEditMode()" class="premium-form">
                    <div class="form-grid">
                      <div class="control-wrap">
                        <label>First Name</label>
                        <input type="text" formControlName="firstName" class="premium-field">
                      </div>
                      <div class="control-wrap">
                        <label>Last Name</label>
                        <input type="text" formControlName="lastName" class="premium-field">
                      </div>
                      <div class="control-wrap wide">
                        <label>Email Address</label>
                        <input type="email" [value]="currentUser()?.email" class="premium-field readonly" disabled>
                        <p class="field-hint">Email can only be changed via support for security reasons.</p>
                      </div>
                      <div class="control-wrap wide">
                        <label>Phone Number</label>
                        <input type="tel" formControlName="phoneNumber" class="premium-field">
                      </div>
                      <div class="control-wrap wide">
                        <label>Profile picture URL</label>
                        <input type="url" formControlName="profileImageUrl" class="premium-field" placeholder="https://example.com/your-photo.jpg">
                        <p class="field-hint">Paste a link to your profile image. Leave empty to use initials.</p>
                      </div>
                    </div>

                    <div class="form-footer-actions">
                      <button type="button" class="btn-cancel-flat" (click)="toggleEdit()">Discard Changes</button>
                      <button type="submit" class="btn-save-glow" [disabled]="profileForm.invalid || isSaving()">
                        <i class="bi bi-check-lg"></i> {{ isSaving() ? 'Syncing...' : 'Save Profile' }}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- Security Settings Tab -->
            <div class="tab-content" *ngIf="activeTab === 'security'">
              <div class="content-card-premium">
                <header class="card-title-group">
                  <h3>Login & Security</h3>
                  <p>Secure your account with multi-layered authentication</p>
                </header>

                <div class="card-main-area">
                  <form [formGroup]="securityForm" (ngSubmit)="updatePassword()" class="premium-form">
                    <div class="control-wrap">
                      <label>Current Password</label>
                      <div class="password-field-wrap">
                         <input type="password" formControlName="currentPassword" class="premium-field" placeholder="Enter current password">
                         <i class="bi bi-lock"></i>
                      </div>
                    </div>
                    <div class="password-row">
                      <div class="control-wrap">
                        <label>New Password</label>
                        <input type="password" formControlName="newPassword" class="premium-field" placeholder="At least 6 chars">
                      </div>
                      <div class="control-wrap">
                        <label>Confirm Password</label>
                        <input type="password" formControlName="confirmPassword" class="premium-field" placeholder="Repeat new password">
                      </div>
                    </div>
                    <div class="form-footer-actions">
                      <button type="submit" class="btn-save-glow" [disabled]="securityForm.invalid || isSavingSecurity()">
                        <i class="bi bi-shield-lock"></i> {{ isSavingSecurity() ? 'Updating...' : 'Update Password' }}
                      </button>
                    </div>
                  </form>

                  <div class="premium-divider"></div>

                  <div class="security-list-modern">
                    <div class="security-card-flat" [class.enabled]="currentUser()?.isTwoFactorEnabled">
                      <div class="sec-card-icon"><i class="bi bi-shield-shaded"></i></div>
                      <div class="sec-card-info">
                        <strong>Two-Factor Authentication</strong>
                        <div class="status-pill" [class.warning]="!currentUser()?.isTwoFactorEnabled" [class.success]="currentUser()?.isTwoFactorEnabled">
                          <span class="pulse-dot"></span> {{ currentUser()?.isTwoFactorEnabled ? 'ENABLED' : 'NOT ENABLED' }}
                        </div>
                        <p>Add an extra layer of protection by requiring a verification code in addition to your password.</p>
                      </div>
                      <button *ngIf="!currentUser()?.isTwoFactorEnabled" class="btn-action-outline" (click)="start2faSetup()">Enable Security</button>
                      <button *ngIf="currentUser()?.isTwoFactorEnabled" class="btn-action-outline text-danger" (click)="disable2fa()">Disable</button>
                    </div>

                    <!-- 2FA Setup Section -->
                    <div class="setup-2fa-section animate-slide-up" *ngIf="isSettingUp2fa()">
                      <div class="setup-header">
                        <h4>Setup Two-Factor Authentication</h4>
                        <button class="btn-close" (click)="isSettingUp2fa.set(false)"><i class="bi bi-x"></i></button>
                      </div>
                      <div class="setup-grid">
                        <div class="setup-instruction">
                          <span class="step-num">1</span>
                          <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).</p>
                        </div>
                        <div class="qr-box">
                          <img *ngIf="qrCodeUrl()" [src]="qrCodeUrl()" alt="QR Code">
                          <div *ngIf="!qrCodeUrl()" class="qr-placeholder">Generating...</div>
                        </div>
                        <div class="setup-instruction">
                          <span class="step-num">2</span>
                          <p>Enter the 6-digit code from your app to verify and activate.</p>
                        </div>
                        <div class="verify-code-box">
                          <input type="text" [(ngModel)]="verificationCode" placeholder="000 000" maxlength="6" class="verify-input">
                          <button class="btn-verify-enable" (click)="enable2fa()" [disabled]="verificationCode.length !== 6 || isEnabling()">
                            {{ isEnabling() ? 'Activating...' : 'Verify & Enable' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Appearance Tab -->
            <div class="tab-content" *ngIf="activeTab === 'appearance'">
              <div class="content-card-premium">
                <header class="card-title-group">
                  <h3>Interface Preferences</h3>
                  <p>Tailor your CertifyPro workspace to your workflow</p>
                </header>

                <div class="card-main-area">
                  <div class="pref-section">
                    <label class="pref-label">Display Theme</label>
                    <div class="theme-shelf">
                      <div class="theme-card-premium" [class.active]="themeService.getTheme() === 'light'" (click)="themeService.setTheme('light')">
                        <div class="theme-box-preview light"></div>
                        <div class="theme-meta">
                          <span>Studio Light</span>
                          <i class="bi bi-sun"></i>
                        </div>
                        <div class="active-check" *ngIf="themeService.getTheme() === 'light'"><i class="bi bi-check-circle-fill"></i></div>
                      </div>
                      <div class="theme-card-premium" [class.active]="themeService.getTheme() === 'dark'" (click)="themeService.setTheme('dark')">
                        <div class="theme-box-preview dark"></div>
                        <div class="theme-meta">
                          <span>Deep Slate</span>
                          <i class="bi bi-moon-stars"></i>
                        </div>
                        <div class="active-check" *ngIf="themeService.getTheme() === 'dark'"><i class="bi bi-check-circle-fill"></i></div>
                      </div>
                    </div>
                  </div>

                  <div class="premium-divider"></div>

                  <div class="pref-section">
                    <label class="pref-label">Accent Highlight</label>
                    <div class="accent-color-strip">
                      <button *ngFor="let color of ['blue', 'orange', 'green', 'purple', 'rose']" 
                              [class]="'accent-dot ' + color" 
                              [class.active]="themeService.getAccentColor() === color"
                              (click)="themeService.setAccentColor(color)">
                        <span class="inner-dot"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>

      <!-- Toast Feedback System -->
      <div class="toast-portal" [class.active]="showToast" [class.error]="isToastError">
        <div class="toast-box">
          <i class="bi" [ngClass]="isToastError ? 'bi-exclamation-triangle' : 'bi-check2-circle'"></i>
          <span class="toast-text">{{toastMessage}}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #1e3a5f;
      --primary-dark: #0b1f3b;
      --ocean: #0f172a;
      --accent-orange: #e67e00;
      --bg-cream: #fdfbf7;
      --bg-card: #ffffff;
      --bg-subtle: #f8f9fa;
      --text-main: #0b1f3b;
      --text-muted: #64748b;
      --shadow-premium: 0 15px 35px rgba(11, 31, 59, 0.08), 0 5px 15px rgba(0, 0, 0, 0.03);
      --border-soft: rgba(30, 58, 95, 0.08);
      --color-success: #10b981;
      --color-danger: #ef4444;
    }

    .profile-premium-wrapper {
      position: relative;
      min-height: 100vh;
      font-family: 'Inter', system-ui, sans-serif;
      overflow-x: hidden;
    }

    .profile-container {
      position: relative;
      z-index: 10;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    /* --- PROFILE HEADER --- */
    .profile-header-section {
      padding: calc(0.5rem + 72px) 0 1rem;
      background: var(--bg-cream);
      position: relative;
      overflow: hidden;
    }
    .profile-header-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
    .profile-bg-shape {
      display: none;
    }
    .profile-header-section .profile-container { z-index: 1; }
    .profile-header-card {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1.75rem 2.5rem;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.06);
      position: relative;
    }
    .profile-header-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--accent-orange);
      border-radius: 20px 20px 0 0;
    }
    .profile-header-avatar { flex-shrink: 0; }
    .profile-header-avatar .avatar-circle {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: #f2f5f9;
      border: 3px solid rgba(30, 58, 95, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      font-size: 2.5rem;
      overflow: hidden;
      position: relative;
    }
    .profile-header-avatar .avatar-circle.clickable {
      cursor: pointer;
    }
    .profile-header-avatar .avatar-file-input {
      display: none;
    }
    .profile-header-avatar .avatar-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .profile-header-avatar .avatar-initials {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--primary);
    }
    .profile-header-avatar .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      color: #fff;
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .profile-header-avatar .avatar-circle:hover .avatar-overlay:not(.uploading),
    .profile-header-avatar .avatar-overlay.uploading {
      opacity: 1;
    }
    .profile-header-info { flex: 1; min-width: 0; }
    .profile-header-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0b1f3b;
      margin: 0 0 0.6rem 0;
      letter-spacing: -0.02em;
    }
    .profile-header-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem 2rem;
      align-items: center;
    }
    .profile-header-meta .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #64748b;
    }
    .profile-header-meta .meta-item i {
      color: #1e3a5f;
      font-size: 1rem;
    }
    .xp-strip {
      margin-top: 1rem;
      max-width: 520px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem;
    }
    .xp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
    .xp-level { font-size: 0.85rem; font-weight: 700; color: #1e3a5f; }
    .xp-points { font-size: 0.8rem; font-weight: 700; color: #0f172a; }
    .xp-bar {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }
    .xp-fill {
      height: 100%;
      background: linear-gradient(90deg, #1e3a5f, #f59e0b);
    }
    .xp-next { margin-top: 0.35rem; font-size: 0.75rem; color: #64748b; }
    .badges-list { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.45rem; }
    .badge-pill {
      font-size: 0.7rem;
      font-weight: 700;
      background: #fff7ed;
      color: #9a3412;
      border: 1px solid #fed7aa;
      border-radius: 999px;
      padding: 0.15rem 0.55rem;
    }
    .profile-header-actions { flex-shrink: 0; }
    .btn-modifier {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 10px;
      color: var(--accent-orange);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-modifier:hover {
      color: var(--primary-dark);
      background: rgba(230, 126, 0, 0.08);
    }
    .btn-modifier i { font-size: 1.2rem; }

    /* --- CONTENT SECTION --- */
    .profile-content-section {
      background: var(--bg-cream);
      padding: 1rem 0 5rem;
      position: relative;
    }
    .profile-content-section .section-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--primary-dark);
      text-align: center;
      margin-bottom: 0.25rem;
      position: relative;
      padding-bottom: 0.6rem;
    }
    .profile-content-section .section-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background: var(--accent-orange);
      border-radius: 2px;
    }
    .profile-content-header {
      text-align: center;
      margin-bottom: 1.25rem;
    }
    .profile-content-section .section-description {
      font-size: 1.05rem;
      color: var(--text-muted);
      text-align: center;
      max-width: 480px;
      margin: 0.25rem auto 1rem;
    }

    /* --- HORIZONTAL TABS --- */
    .profile-tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .tab-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 50px;
      border: 2px solid transparent;
      background: white;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .tab-pill i { font-size: 1.1rem; opacity: 0.9; }
    .tab-pill:hover { background: #eef4fc; color: var(--primary); border-color: rgba(30, 58, 95, 0.15); }
    .tab-pill.active { background: #f2f5f9; color: var(--primary-dark); border-color: rgba(30, 58, 95, 0.2); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }
    .tab-pill.active i { color: var(--accent-orange); opacity: 1; }

    .content-surface { max-width: 800px; margin: 0 auto; }

    /* --- CONTENT CARD --- */
    .content-card-premium {
      background: white;
      border-radius: 20px;
      padding: 0;
      border: 1px solid var(--border-soft);
      box-shadow: 0 15px 35px rgba(30, 58, 95, 0.06);
      overflow: hidden;
      transition: box-shadow 0.3s ease;
    }
    .content-card-premium:hover { box-shadow: 0 25px 50px rgba(30, 58, 95, 0.1); }
    .card-title-group { padding: 2rem 2.5rem; border-bottom: 2px solid rgba(30, 58, 95, 0.12); position: relative; }
    .card-title-group h3 { font-size: 1.4rem; font-weight: 800; color: var(--primary-dark); margin: 0; }
    .card-title-group p { font-size: 0.95rem; color: #64748b; margin: 0.4rem 0 0; }

    .card-main-area { padding: 2.5rem 2.5rem; }

    /* View Grid */
    .profile-details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2.5rem 3rem; }
    .detail-block label { 
      display: block; font-size: 0.7rem; font-weight: 800; 
      text-transform: uppercase; letter-spacing: 0.1em; color: var(--primary); margin-bottom: 0.75rem;
    }
    .detail-value { font-size: 1.15rem; font-weight: 700; color: var(--primary-dark); }
    .detail-block.wide { grid-column: span 2; }

    /* Premium Form */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .password-row { display: flex; flex-direction: column; gap: 2rem; margin-top: 0.5rem; }
    .control-wrap { display: flex; flex-direction: column; gap: 0.75rem; }
    .control-wrap.wide { grid-column: span 2; }
    .control-wrap label { font-size: 0.85rem; font-weight: 700; color: var(--primary-dark); }
    
    .premium-field {
      width: 100%; padding: 0.9rem 1.25rem;
      background: var(--bg-subtle); border: 2px solid rgba(30, 58, 95, 0.08); border-radius: 14px;
      font-size: 1rem; font-weight: 500; transition: all 0.3s ease;
    }
    .premium-field:focus { outline: none; border-color: var(--primary); background: var(--bg-card); }
    
    .form-footer-actions { display: flex; justify-content: flex-end; align-items: center; gap: 1.5rem; margin-top: 3rem; }
    .btn-cancel-flat { background: none; border: none; font-weight: 700; color: var(--primary); cursor: pointer; }
    .btn-save-glow {
      background: var(--primary); color: white; border: none; padding: 0.875rem 2rem;
      border-radius: 0.5rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s ease;
    }
    .btn-save-glow:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(30, 58, 95, 0.3); }

    /* Security Settings */
    .password-field-wrap { position: relative; }
    .password-field-wrap i { position: absolute; right: 1.25rem; top: 50%; transform: translateY(-50%); color: var(--primary); opacity: 0.7; }
    
    .premium-divider { height: 1px; background: rgba(30, 58, 95, 0.08); margin: 3rem 0; }

    .security-card-flat {
      background: #f8f9fa; border: 1px solid #e2e8f0; padding: 2rem;
      border-radius: 16px; display: flex; align-items: center; gap: 2rem; position: relative;
    }
    .security-card-flat.enabled { border-color: var(--color-success); background: #f0fdf4; }
    
    .sec-card-icon {
      width: 56px; height: 56px; background: white; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #e67e00;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .sec-card-info { flex: 1; }
    .sec-card-info strong { display: block; font-size: 1.15rem; color: var(--primary-dark); margin-bottom: 0.5rem; }
    .status-pill { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.85rem; border-radius: 100px; font-size: 0.7rem; font-weight: 800; }
    .status-pill.warning { background: #fff1f2; color: #e11d48; }
    .status-pill.success { background: #dcfce7; color: #166534; }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s infinite; }
    .status-pill.warning .pulse-dot { background: #e11d48; }
    .status-pill.success .pulse-dot { background: #166534; animation: none; }

    .btn-action-outline {
      background: white; border: 2px solid #0b1f3b; padding: 0.75rem 1.5rem;
      border-radius: 0.5rem; font-weight: 600; color: #0b1f3b; cursor: pointer; transition: all 0.2s;
    }
    .btn-action-outline:hover { background: #0b1f3b; color: white; }
    .btn-action-outline.text-danger { border-color: var(--color-danger); color: var(--color-danger); }
    .btn-action-outline.text-danger:hover { background: var(--color-danger); color: white; }

    /* 2FA Setup Flow */
    .setup-2fa-section {
      margin-top: 1.5rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; 
      padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    .setup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .setup-header h4 { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--primary-dark); }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }
    
    .setup-grid { display: grid; grid-template-columns: 1fr 200px; gap: 2rem; align-items: center; }
    .setup-instruction { display: flex; gap: 1rem; align-items: flex-start; }
    .step-num { 
      width: 28px; height: 28px; background: var(--primary); color: white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0;
    }
    .qr-box { 
      grid-row: span 2; width: 200px; height: 200px; background: #f8f9fa; border: 1px solid #e2e8f0;
      border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .qr-box img { width: 100%; height: 100%; display: block; }
    .qr-placeholder { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }
    
    .verify-code-box { display: flex; gap: 1rem; }
    .verify-input { 
      flex: 1; padding: 0.75rem 1.25rem; border: 2px solid #e2e8f0; border-radius: 10px;
      font-size: 1.1rem; font-weight: 700; letter-spacing: 0.2em; text-align: center;
    }
    .btn-verify-enable { 
      background: var(--primary-dark); color: white; border: none; padding: 0.75rem 1.5rem;
      border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .btn-verify-enable:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Toast */
    .toast-portal { position: fixed; bottom: 2.5rem; right: 2.5rem; z-index: 1000; opacity: 0; transform: translateY(40px); transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .toast-portal.active { opacity: 1; transform: translateY(0); }
    .toast-box { background: var(--primary-dark); color: white; padding: 1rem 1.75rem; border-radius: 16px; display: flex; align-items: center; gap: 1rem; box-shadow: 0 15px 30px rgba(11, 31, 59, 0.25); }
    .toast-portal.error .toast-box { background: #991b1b; }

    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(225, 29, 72, 0); } 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); } }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProfileComponent implements OnInit {
  currentUser = signal<User | null>(null);
  progress = signal<UserProgress | null>(null);
  activeTab: string = 'general';
  isEditMode = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isSavingSecurity = signal<boolean>(false);
  profileForm: FormGroup;
  securityForm: FormGroup;
  imgError = false;
  uploadingImage = signal(false);
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  // 2FA Flow
  isSettingUp2fa = signal(false);
  isEnabling = signal(false);
  qrCodeUrl = signal<string | null>(null);
  twoFactorSecret = signal<string | null>(null);
  verificationCode = '';

  // Feedback
  showToast = false;
  toastMessage = '';
  isToastError = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    public themeService: ThemeService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: [''],
      profileImageUrl: ['']
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser.set(user);
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        profileImageUrl: user.profileImageUrl
      });
      this.userService.getMyProgress().subscribe({
        next: (p) => this.progress.set(p),
        error: () => this.progress.set(null)
      });
    }
  }

  progressPercent(): number {
    const p = this.progress();
    if (!p) return 0;
    const min = p.levelNumber === 1 ? 0 : (p.levelNumber === 2 ? 100 : (p.levelNumber === 3 ? 300 : 600));
    const max = p.levelNumber === 1 ? 100 : (p.levelNumber === 2 ? 300 : (p.levelNumber === 3 ? 600 : (p.xpTotal + Math.max(1, p.xpToNextLevel))));
    const range = Math.max(1, max - min);
    const value = Math.max(0, Math.min(range, p.xpTotal - min));
    return Math.round((value / range) * 100);
  }

  // --- 2FA Logic ---

  start2faSetup() {
    if (!this.currentUser()?.id) return;
    this.isSettingUp2fa.set(true);
    this.qrCodeUrl.set(null);
    this.verificationCode = '';

    this.userService.setup2fa(this.currentUser()!.id!).subscribe({
      next: (res) => {
        this.qrCodeUrl.set(res.qrCodeUrl);
        this.twoFactorSecret.set(res.secret);
      },
      error: (err) => {
        const msg = (err.status === 403 || err.status === 401) 
          ? 'Session expirée ou ID incorrect. Merci de vous déconnecter et reconnecter.' 
          : 'Erreur lors de la configuration 2FA';
        this.notify(msg, true);
        this.isSettingUp2fa.set(false);
      }
    });
  }

  enable2fa() {
    if (!this.currentUser()?.id || !this.twoFactorSecret() || !this.verificationCode) return;
    this.isEnabling.set(true);

    this.userService.enable2fa(this.currentUser()!.id!, this.twoFactorSecret()!, this.verificationCode).subscribe({
      next: () => {
        this.isEnabling.set(false);
        this.isSettingUp2fa.set(false);
        this.notify('Double authentification activée !');
        // Refresh user data
        this.userService.getById(this.currentUser()!.id!).subscribe(u => {
            this.currentUser.set(u);
            this.authService.setSession(u);
        });
      },
      error: (err) => {
        const msg = (err.status === 403 || err.status === 401)
          ? 'Session invalide (ID mismatch). Déconnectez-vous et reconnectez-vous.'
          : 'Code invalide ou erreur serveur';
        this.notify(msg, true);
        this.isEnabling.set(false);
      }
    });
  }

  disable2fa() {
    if (!confirm('Êtes-vous sûr de vouloir désactiver la 2FA ? Cela réduira la sécurité de votre compte.') || !this.currentUser()?.id) return;

    this.userService.disable2fa(this.currentUser()!.id!).subscribe({
      next: () => {
        this.notify('2FA désactivée.');
        this.userService.getById(this.currentUser()!.id!).subscribe(u => {
            this.currentUser.set(u);
            this.authService.setSession(u);
        });
      },
      error: () => this.notify('Erreur lors de la désactivation', true)
    });
  }

  // --- Original logic below ---

  toggleEdit() { this.isEditMode.update(v => !v); }

  saveProfile() {
    if (this.profileForm.invalid || !this.currentUser()?.id) return;
    this.isSaving.set(true);
    this.userService.update(this.currentUser()!.id!, this.profileForm.value).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.authService.setSession(user);
        this.isEditMode.set(false);
        this.isSaving.set(false);
        this.notify('Profil mis à jour !');
      },
      error: () => {
        this.isSaving.set(false);
        this.notify('Erreur lors de la mise à jour', true);
      }
    });
  }

  updatePassword() {
    if (this.securityForm.invalid || !this.currentUser()?.id) return;
    const { newPassword, confirmPassword } = this.securityForm.value;
    if (newPassword !== confirmPassword) {
      this.notify('Les mots de passe ne correspondent pas', true);
      return;
    }
    this.isSavingSecurity.set(true);
    this.userService.update(this.currentUser()!.id!, { password: newPassword } as any).subscribe({
      next: () => {
        this.isSavingSecurity.set(false);
        this.securityForm.reset();
        this.notify('Mot de passe mis à jour !');
      },
      error: () => {
        this.isSavingSecurity.set(false);
        this.notify('Erreur lors de la mise à jour', true);
      }
    });
  }

  notify(msg: string, isError = false) {
    this.toastMessage = msg;
    this.isToastError = isError;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  initials(): string {
    const u = this.currentUser();
    if (!u?.firstName && !u?.lastName) return '';
    return ((u.firstName || '').trim().charAt(0) + (u.lastName || '').trim().charAt(0)).toUpperCase();
  }

  avatarImageUrl(): string | null {
    const url = this.currentUser()?.profileImageUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : API_BASE_URL + url;
  }

  triggerFileInput(): void { this.fileInputRef?.nativeElement?.click(); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file || !this.currentUser()?.id) return;
    this.uploadingImage.set(true);
    this.userService.uploadProfileImage(this.currentUser()!.id!, file).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.authService.setSession(user);
        this.uploadingImage.set(false);
        this.notify('Photo mise à jour !');
      },
      error: () => {
        this.uploadingImage.set(false);
        this.notify('Erreur upload', true);
      }
    });
  }
}
