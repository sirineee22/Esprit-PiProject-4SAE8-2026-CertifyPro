import { Component, OnInit, signal, WritableSignal, ChangeDetectorRef, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../users/services/users.api';
import { ThemeService } from '../../../core/services/theme.service';
import { User } from '../../../shared/models/user.model';
import { API_BASE_URL } from '../../../core/api/api.config';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
                    <div class="security-card-flat">
                      <div class="sec-card-icon"><i class="bi bi-shield-shaded"></i></div>
                      <div class="sec-card-info">
                        <strong>Two-Factor Authentication</strong>
                        <div class="status-pill warning">
                          <span class="pulse-dot"></span> NOT ENABLED
                        </div>
                        <p>Add an extra layer of protection by requiring a verification code in addition to your password.</p>
                      </div>
                      <button class="btn-action-outline">Enable Security</button>
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

    /* --- PROFILE HEADER (neutral background) --- */
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

    /* --- CONTENT SECTION (cream + blue accent like home) --- */
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
    .tab-pill i {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    .tab-pill:hover {
      background: #eef4fc;
      color: var(--primary);
      border-color: rgba(30, 58, 95, 0.15);
    }
    .tab-pill.active {
      background: #f2f5f9;
      color: var(--primary-dark);
      border-color: rgba(30, 58, 95, 0.2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .tab-pill.active i {
      color: var(--accent-orange);
      opacity: 1;
    }

    .content-surface {
      max-width: 800px;
      margin: 0 auto;
    }

    /* --- CONTENT CARD (home step-card style) --- */
    .content-card-premium {
      background: white;
      border-radius: 20px;
      padding: 0;
      border: 1px solid var(--border-soft);
      box-shadow: 0 15px 35px rgba(30, 58, 95, 0.06);
      overflow: hidden;
      transition: box-shadow 0.3s ease;
    }
    .content-card-premium:hover {
      box-shadow: 0 25px 50px rgba(30, 58, 95, 0.1);
    }
    .card-title-group {
      padding: 2rem 2.5rem;
      border-bottom: 2px solid rgba(30, 58, 95, 0.12);
      position: relative;
    }
    .card-title-group::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 80px;
      height: 2px;
      background: var(--accent-orange);
      border-radius: 0 1px 0 0;
    }
    .card-title-group h3 { font-size: 1.4rem; font-weight: 800; color: var(--primary-dark); margin: 0; }
    .card-title-group p { font-size: 0.95rem; color: #64748b; margin: 0.4rem 0 0; }

    .card-main-area { padding: 2.5rem 2.5rem; }

    /* View Grid */
    .profile-details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2.5rem 3rem; }
    .detail-block label { 
      display: block; font-size: 0.7rem; font-weight: 800; 
      text-transform: uppercase; letter-spacing: 0.1em; color: var(--primary); margin-bottom: 0.75rem;
      opacity: 0.85;
    }
    .detail-value { font-size: 1.15rem; font-weight: 700; color: var(--primary-dark); }
    .detail-block.wide { grid-column: span 2; }
    .email-value { color: var(--primary); display: flex; align-items: center; gap: 0.5rem; }

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
    .premium-field.readonly { background: #eef4fc; cursor: not-allowed; opacity: 0.9; }
    
    .field-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; }

    .form-footer-actions { display: flex; justify-content: flex-end; align-items: center; gap: 1.5rem; margin-top: 3rem; }
    .btn-cancel-flat { background: none; border: none; font-weight: 700; color: var(--primary); cursor: pointer; }
    .btn-save-glow {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.875rem 2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-save-glow:hover:not(:disabled) {
      background: var(--primary-dark);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(30, 58, 95, 0.3);
    }

    /* Security Settings */
    .password-field-wrap { position: relative; }
    .password-field-wrap i { position: absolute; right: 1.25rem; top: 50%; transform: translateY(-50%); color: var(--primary); opacity: 0.7; }
    
    .premium-divider { height: 1px; background: rgba(30, 58, 95, 0.08); margin: 3rem 0; }

    .security-card-flat {
      background: #f8f9fa;
      border: 1px solid #e2e8f0;
      padding: 2rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    .sec-card-icon {
      width: 56px;
      height: 56px;
      background: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: #e67e00;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .sec-card-info { flex: 1; }
    .sec-card-info strong { display: block; font-size: 1.15rem; color: var(--primary-dark); margin-bottom: 0.5rem; }
    .sec-card-info p { font-size: 0.9rem; color: var(--text-muted); margin: 0.5rem 0 0; line-height: 1.6; }

    .status-pill {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em;
    }
    .status-pill.warning { background: #fff1f2; color: #e11d48; }
    .pulse-dot { width: 8px; height: 8px; background: #e11d48; border-radius: 50%; animation: pulse 2s infinite; }

    .btn-action-outline {
      background: white;
      border: 2px solid #0b1f3b;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      color: #0b1f3b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action-outline:hover {
      background: #0b1f3b;
      color: white;
    }

    /* Appearance Shelf */
    .theme-shelf { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .theme-card-premium {
      background: var(--bg-card); border: 2px solid var(--border-soft); padding: 1.25rem; 
      border-radius: 20px; cursor: pointer; position: relative; transition: all 0.3s ease;
    }
    .theme-card-premium.active { border-color: var(--primary); background: #eef4fc; }
    .theme-box-preview { height: 100px; border-radius: 12px; margin-bottom: 1.25rem; border: 1px solid rgba(0,0,0,0.04); }
    .theme-box-preview.light { background: #ffffff; }
    .theme-box-preview.dark { background: var(--ocean); }
    
    .theme-meta { display: flex; justify-content: space-between; align-items: center; }
    .theme-meta span { font-weight: 800; font-size: 0.9rem; color: var(--primary-dark); }
    .theme-meta i { font-size: 1.1rem; color: var(--text-muted); }
    .active-check { position: absolute; top: -10px; right: -10px; font-size: 1.5rem; color: var(--primary); background: white; border-radius: 50%; }

    .accent-color-strip { display: flex; gap: 1.25rem; }
    .accent-dot {
      width: 44px; height: 44px; border-radius: 50%; border: 4px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex; align-items: center; justify-content: center;
    }
    .accent-dot.active { transform: scale(1.2); border-color: var(--primary); }
    .accent-dot.blue { background: var(--primary); }
    .accent-dot.orange { background: #f59e0b; }
    .accent-dot.green { background: #10b981; }
    .accent-dot.purple { background: #8b5cf6; }
    .accent-dot.rose { background: #f43f5e; }

    /* Toast 2.0 */
    .toast-portal {
      position: fixed; bottom: 2.5rem; right: 2.5rem; z-index: 1000;
      pointer-events: none; opacity: 0; transform: translateY(40px);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .toast-portal.active { opacity: 1; transform: translateY(0); }
    .toast-box {
      background: var(--primary-dark); color: white; padding: 1rem 1.75rem;
      border-radius: 16px; display: flex; align-items: center; gap: 1rem;
      box-shadow: 0 15px 30px rgba(11, 31, 59, 0.25);
    }
    .toast-portal.error .toast-box { background: #991b1b; }
    .toast-box i { font-size: 1.5rem; color: var(--accent); }
    .toast-text { font-weight: 700; font-size: 1rem; }

    /* Keyframes */
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(225, 29, 72, 0); } 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); } }
    @keyframes float-slow { 0% { transform: translate(0,0); } 100% { transform: translate(40px, -40px); } }

    @media (max-width: 768px) {
      .profile-header-card {
        flex-direction: column;
        text-align: center;
        padding: 1.5rem;
      }
      .profile-header-meta { justify-content: center; }
      .profile-tabs {
        overflow-x: auto;
        justify-content: flex-start;
        padding-bottom: 0.5rem;
        -webkit-overflow-scrolling: touch;
      }
      .tab-pill { flex-shrink: 0; }
      .form-grid { grid-template-columns: 1fr; }
      .profile-content-section .section-title { font-size: 1.85rem; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  currentUser = signal<User | null>(null);
  activeTab: string = 'general';
  isEditMode = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isSavingSecurity = signal<boolean>(false);
  profileForm: FormGroup;
  securityForm: FormGroup;
  imgError = false;
  uploadingImage = signal(false);
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

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

  initials(): string {
    const u = this.currentUser();
    if (!u?.firstName && !u?.lastName) return '';
    const f = (u.firstName || '').trim().charAt(0).toUpperCase();
    const l = (u.lastName || '').trim().charAt(0).toUpperCase();
    return (f + l) || '';
  }

  /** Full URL for profile image (backend returns relative path). */
  avatarImageUrl(): string | null {
    const url = this.currentUser()?.profileImageUrl;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return API_BASE_URL + url;
  }

  triggerFileInput(): void {
    if (this.uploadingImage()) return;
    this.fileInputRef?.nativeElement?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file || !this.currentUser()?.id) return;
    this.uploadingImage.set(true);
    this.imgError = false;
    this.userService.uploadProfileImage(this.currentUser()!.id!, file).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.authService.setSession(user);
        this.profileForm.patchValue({ profileImageUrl: user.profileImageUrl || '' });
        this.uploadingImage.set(false);
        this.notify('Photo mise à jour !');
        this.cd.detectChanges();
      },
      error: (err) => {
        this.uploadingImage.set(false);
        const msg = err?.error ?? err?.message ?? 'Erreur lors de l\'upload';
        this.notify(typeof msg === 'string' ? msg : 'Upload impossible', true);
        this.cd.detectChanges();
      }
    });
    input.value = '';
  }

  loadUser() {
    this.imgError = false;
    const user = this.authService.getCurrentUser();
    if (!user?.id) {
      this.currentUser.set(user);
      return;
    }
    this.userService.getById(user.id).subscribe({
      next: (freshUser) => {
        this.currentUser.set(freshUser);
        this.authService.setSession(freshUser);
        this.profileForm.patchValue({
          firstName: freshUser.firstName,
          lastName: freshUser.lastName,
          phoneNumber: freshUser.phoneNumber || '',
          profileImageUrl: freshUser.profileImageUrl || ''
        });
        this.cd.detectChanges();
      },
      error: () => {
        this.currentUser.set(user);
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber || '',
          profileImageUrl: user.profileImageUrl || ''
        });
      }
    });
  }

  toggleEdit() {
    this.isEditMode.set(!this.isEditMode());
    this.isSaving.set(false); // ALWAYS reset saving flag on toggle

    if (!this.isEditMode()) {
      this.loadUser(); // Reset form on cancel
    }
    this.cd.detectChanges();
  }

  saveProfile() {
    const current = this.currentUser();
    if (this.profileForm.invalid || !current?.id || this.isSaving()) return;

    this.isSaving.set(true);
    this.cd.detectChanges();

    this.userService.update(current.id, { ...current, ...this.profileForm.value } as User).subscribe({
      next: (user: User) => {
        // Unlock button immediately
        this.isSaving.set(false);
        this.cd.detectChanges();

        // Background session sync
        this.imgError = false;
        setTimeout(() => {
          try {
            this.authService.setSession(user);
            this.currentUser.set(user);
          } catch (e) {
            console.error('[Profile] Sync Error:', e);
          }
        }, 50);

        // Defer toast and edit-mode change to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.notify('Profile updated successfully!');
          setTimeout(() => {
            this.isEditMode.set(false);
            this.cd.detectChanges();
          }, 500);
        }, 0);
      },
      error: (err) => {
        console.error('[Profile] API Error:', err);
        this.isSaving.set(false);
        this.cd.detectChanges();
        setTimeout(() => this.notify('Update failed. Please check backend.', true), 0);
      }
    });

    // 10 second absolute failsafe
    setTimeout(() => {
      if (this.isSaving()) {
        this.isSaving.set(false);
        this.cd.detectChanges();
      }
    }, 10000);
  }

  updatePassword() {
    const current = this.currentUser();
    if (this.securityForm.invalid || !current?.id || this.isSavingSecurity()) return;

    const { newPassword, confirmPassword } = this.securityForm.value;
    if (newPassword !== confirmPassword) {
      this.notify('Passwords do not match!', true);
      return;
    }

    this.isSavingSecurity.set(true);
    this.cd.detectChanges();

    // In a real app, you'd verify currentPassword first. 
    // Here we use the generic update endpoint which handles the password field.
    const updatedData = {
      ...current,
      password: newPassword
    };

    this.userService.update(current.id, updatedData as User).subscribe({
      next: () => {
        this.isSavingSecurity.set(false);
        this.securityForm.reset();
        this.notify('Mot de passe updated successfully!');
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('[Security] ERROR:', err);
        this.isSavingSecurity.set(false);
        this.notify('Update failed. Please try again.', true);
        this.cd.detectChanges();
      }
    });

    // Failsafe
    setTimeout(() => {
      if (this.isSavingSecurity()) {
        this.isSavingSecurity.set(false);
        this.cd.detectChanges();
      }
    }, 10000);
  }

  notify(message: string, isError = false) {
    this.toastMessage = message;
    this.isToastError = isError;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}

