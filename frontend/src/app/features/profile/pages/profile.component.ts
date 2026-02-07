import { Component, OnInit, signal, WritableSignal, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../users/services/users.api';
import { ThemeService } from '../../../core/services/theme.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page animate-fade-in">
      <!-- Premium Header Section -->
      <div class="profile-header">
        <div class="cover-photo">
          <img src="/C:/Users/sirine/.gemini/antigravity/brain/28efc598-ed87-4a9c-8208-16021bca294f/profile_cover_abstract_1770224040804.png" alt="Cover Photo">
        </div>
        <div class="header-content">
          <div class="avatar-container">
            <div class="avatar-circle">
              <i class="bi bi-person-fill"></i>
            </div>
          </div>
          <div class="profile-meta">
            <h1 class="user-name">{{currentUser()?.firstName}} {{currentUser()?.lastName}}</h1>
            <p class="user-role-text">
              <span class="role-indicator" [ngClass]="currentUser()?.role?.name?.toLowerCase()"></span>
              {{currentUser()?.role?.name}} Account
            </p>
          </div>
          <div class="header-actions">
            <button class="btn-premium" (click)="toggleEdit()" *ngIf="!isEditMode()">
              <i class="bi bi-pencil-square"></i>
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      <div class="profile-main">
        <!-- Sidebar Navigation -->
        <aside class="profile-sidebar">
          <nav class="side-nav">
            <button [class.active]="activeTab === 'general'" (click)="activeTab = 'general'">
              <i class="bi bi-person"></i> General
            </button>
            <button [class.active]="activeTab === 'security'" (click)="activeTab = 'security'">
              <i class="bi bi-shield-lock"></i> Security
            </button>
            <button [class.active]="activeTab === 'appearance'" (click)="activeTab = 'appearance'">
              <i class="bi bi-palette"></i> Appearance
            </button>
          </nav>
        </aside>

        <!-- Dynamic Content Area -->
        <main class="content-area">
          <div class="glass-card animate-slide-up" *ngIf="activeTab === 'general'">
            <div class="card-header">
              <h3>Account Settings</h3>
              <p>Manage your public profile and personal information</p>
            </div>

            <div class="card-body">
              <!-- View Mode -->
              <div class="info-grid" *ngIf="!isEditMode() && currentUser()">
                <div class="info-item">
                  <label>First Name</label>
                  <p>{{currentUser()?.firstName}}</p>
                </div>
                <div class="info-item">
                  <label>Last Name</label>
                  <p>{{currentUser()?.lastName}}</p>
                </div>
                <div class="info-item">
                  <label>Email Address</label>
                  <p>{{currentUser()?.email}}</p>
                </div>
                <div class="info-item">
                  <label>Phone Number</label>
                  <p>{{currentUser()?.phoneNumber || 'Not provided'}}</p>
                </div>
              </div>

              <!-- Edit Mode -->
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" *ngIf="isEditMode()" class="edit-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>First Name</label>
                    <input type="text" formControlName="firstName" class="premium-input">
                  </div>
                  <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" formControlName="lastName" class="premium-input">
                  </div>
                </div>
                <div class="form-group">
                  <label>Email Address (ReadOnly)</label>
                  <input type="email" [value]="currentUser()?.email" class="premium-input" disabled>
                </div>
                <div class="form-group">
                  <label>Phone Number</label>
                  <input type="tel" formControlName="phoneNumber" class="premium-input">
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-secondary" (click)="toggleEdit()">Cancel</button>
                  <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || isSaving()">
                    {{ isSaving() ? 'Saving...' : 'Save Changes' }}
                  </button>
                  <!-- Subtle Emergency Failsafe -->
                  <button type="button" class="btn-link-danger" 
                          *ngIf="isSaving()" (click)="isSaving.set(false)">
                    Force Unlock
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div class="glass-card animate-slide-up" *ngIf="activeTab === 'security'">
            <div class="card-header">
               <h3>Security & Password</h3>
               <p>Update your password and maintain account security</p>
            </div>
            <div class="card-body">
               <form [formGroup]="securityForm" (ngSubmit)="updatePassword()" class="edit-form">
                 <div class="form-group">
                   <label>Current Password</label>
                   <input type="password" formControlName="currentPassword" class="premium-input" placeholder="••••••••">
                 </div>
                 <div class="form-row">
                   <div class="form-group">
                     <label>New Password</label>
                     <input type="password" formControlName="newPassword" class="premium-input" placeholder="New Password">
                   </div>
                   <div class="form-group">
                     <label>Confirm New Password</label>
                     <input type="password" formControlName="confirmPassword" class="premium-input" placeholder="Confirm Password">
                   </div>
                 </div>
                 <div class="form-actions">
                   <button type="submit" class="btn-primary" [disabled]="securityForm.invalid || isSavingSecurity()">
                     {{ isSavingSecurity() ? 'Updating...' : 'Update Password' }}
                   </button>
                   <!-- Hidden Emergency Link for Password tab -->
                   <button type="button" class="btn-link-danger" 
                           *ngIf="isSavingSecurity()" (click)="isSavingSecurity.set(false)">
                     Force Unlock
                   </button>
                 </div>
               </form>

               <div class="security-divider"></div>

               <div class="security-list">
                 <div class="security-item">
                    <div class="sec-info">
                      <strong>Two-Factor Authentication</strong>
                      <span class="status-badge inactive">Not Enabled</span>
                      <p>Add an extra layer of security to your account by requiring more than just a password to log in.</p>
                    </div>
                    <button class="btn-outline">Enable</button>
                 </div>
               </div>
            </div>
          </div>

          <div class="glass-card animate-slide-up" *ngIf="activeTab === 'appearance'">
            <div class="card-header">
               <h3>Appearance Preferences</h3>
               <p>Customize how CertifyPro looks on your device</p>
            </div>
            <div class="card-body">
               <div class="appearance-section">
                 <label class="section-label-alt">Theme Mode</label>
                 <div class="theme-grid">
                   <div class="theme-option" [class.active]="themeService.getTheme() === 'light'" (click)="themeService.setTheme('light')">
                     <div class="theme-preview light"></div>
                     <span>Light Mode</span>
                     <i class="bi bi-check-circle-fill" *ngIf="themeService.getTheme() === 'light'"></i>
                   </div>
                   <div class="theme-option" [class.active]="themeService.getTheme() === 'dark'" (click)="themeService.setTheme('dark')">
                     <div class="theme-preview dark"></div>
                     <span>Dark Mode</span>
                     <i class="bi bi-check-circle-fill" *ngIf="themeService.getTheme() === 'dark'"></i>
                   </div>
                   <div class="theme-option" [class.active]="themeService.getTheme() === 'system'" (click)="themeService.setTheme('system')">
                     <div class="theme-preview system"></div>
                     <span>System Default</span>
                     <i class="bi bi-check-circle-fill" *ngIf="themeService.getTheme() === 'system'"></i>
                   </div>
                 </div>
               </div>

               <div class="appearance-divider"></div>

               <div class="appearance-section">
                 <label class="section-label-alt">Accent Color</label>
                 <div class="color-options">
                   <div class="color-dot blue" [class.active]="themeService.getAccentColor() === 'blue'" (click)="themeService.setAccentColor('blue')"></div>
                   <div class="color-dot orange" [class.active]="themeService.getAccentColor() === 'orange'" (click)="themeService.setAccentColor('orange')"></div>
                   <div class="color-dot green" [class.active]="themeService.getAccentColor() === 'green'" (click)="themeService.setAccentColor('green')"></div>
                   <div class="color-dot purple" [class.active]="themeService.getAccentColor() === 'purple'" (click)="themeService.setAccentColor('purple')"></div>
                   <div class="color-dot rose" [class.active]="themeService.getAccentColor() === 'rose'" (click)="themeService.setAccentColor('rose')"></div>
                 </div>
               </div>
            </div>
          </div>

          <!-- Toast Notification -->
          <div class="toast" [class.show]="showToast" [class.error]="isToastError">
            <i class="bi" [ngClass]="isToastError ? 'bi-exclamation-circle' : 'bi-check-circle-fill'"></i>
            {{toastMessage}}
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 100px 1.5rem 2rem;
      min-height: 100vh;
      color: #1f2937;
    }

    /* Premium Header */
    .profile-header {
      background: var(--card-bg);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px -5px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
      position: relative;
      border: 1px solid var(--border-color);
    }

    .cover-photo {
      height: 240px;
      overflow: hidden;
    }

    .cover-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-content {
      padding: 0 3rem 2rem;
      display: flex;
      align-items: flex-end;
      gap: 2rem;
      position: relative;
      margin-top: -60px;
    }

    .avatar-container {
      position: relative;
    }

    .avatar-circle {
      width: 140px;
      height: 140px;
      background: var(--muted);
      border: 6px solid var(--card-bg);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .avatar-circle i {
      font-size: 4rem;
      color: #9ca3af;
    }

    .profile-meta {
      flex: 1;
      padding-bottom: 1rem;
    }

    .user-name {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--foreground);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .user-role-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      font-weight: 600;
      margin-top: 0.25rem;
    }

    .role-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #9ca3af;
    }
    .role-indicator.admin { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
    .role-indicator.trainer { background: #10b981; box-shadow: 0 0 10px #10b981; }
    .role-indicator.learner { background: #3b82f6; box-shadow: 0 0 10px #3b82f6; }

    .header-actions {
      padding-bottom: 1.5rem;
    }

    /* Main Layout */
    .profile-main {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
    }

    .side-nav {
      background: var(--card-bg);
      padding: 1rem;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      position: sticky;
      top: 100px;
      border: 1px solid var(--border-color);
    }

    .side-nav button {
      width: 100%;
      text-align: left;
      padding: 1rem 1.5rem;
      border: none;
      background: none;
      border-radius: 10px;
      font-weight: 600;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 0.5rem;
    }

    .side-nav button:hover {
      background: #f9fafb;
      color: #111827;
    }

    .side-nav button.active {
      background: #0f172a;
      color: white;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);
    }

    /* Cards */
    .glass-card {
      background: var(--card-bg);
      border-radius: 20px;
      border: 1px solid var(--border-color);
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    .card-header {
      padding: 2rem 2.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .card-header h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: #111827;
    }

    .card-header p {
      color: #6b7280;
      margin: 0.5rem 0 0;
      font-size: 0.95rem;
    }

    .card-body {
      padding: 2.5rem;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    .info-item label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      margin-bottom: 0.5rem;
    }

    .info-item p {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    /* Buttons */
    .btn-premium {
      background: #0f172a;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

    .btn-primary {
      background: var(--accent, #2563eb);
      color: white;
      border: none;
      padding: 0.8rem 2rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
    .btn-primary:disabled { 
      opacity: 0.7; 
      cursor: not-allowed; 
      filter: grayscale(0.2);
    }

    .btn-secondary {
       background: #f3f4f6;
       color: #1f2937;
       border: none;
       padding: 0.8rem 2rem;
       border-radius: 8px;
       font-weight: 700;
       cursor: pointer;
    }

    .btn-outline {
      border: 1px solid #e5e7eb;
      background: white;
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      color: #1f2937;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-outline:hover { background: #f9fafb; border-color: #d1d5db; }

    /* Forms */
    .edit-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .premium-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--muted);
      border: 2px solid var(--border-color);
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.2s;
      color: var(--foreground);
    }
    .premium-input:focus { outline: none; border-color: #2563eb; background: white; }
    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }

    /* Security & Appearance Details */
    .security-divider, .appearance-divider {
      height: 1px;
      background: #f3f4f6;
      margin: 2.5rem 0;
    }

    .status-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      font-weight: 700;
      text-transform: uppercase;
      margin-left: 0.5rem;
    }
    .status-badge.inactive { background: #fee2e2; color: #991b1b; }

    .section-label-alt {
      display: block;
      font-size: 0.9rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1.5rem;
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .theme-option {
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      background: var(--card-bg);
      color: var(--foreground);
    }
    .theme-option:hover { border-color: #d1d5db; }
    .theme-option.active { border-color: #2563eb; background: #eff6ff; }
    .theme-option i { position: absolute; top: 0.5rem; right: 0.5rem; color: #2563eb; }

    .theme-preview {
      height: 60px;
      border-radius: 6px;
      margin-bottom: 0.75rem;
      border: 1px solid #e5e7eb;
    }
    .theme-preview.light { background: #f9fafb; }
    .theme-preview.dark { background: #111827; }
    .theme-preview.system { background: linear-gradient(135deg, #f9fafb 50%, #111827 50%); }

    .color-options {
      display: flex;
      gap: 1.5rem;
    }

    .color-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s;
      border: 3px solid transparent;
    }
    .color-dot:hover { transform: scale(1.2); }
    .color-dot.active { border-color: #111827; }
    .color-dot.blue { background: #3b82f6; }
    .color-dot.orange { background: #f59e0b; }
    .color-dot.green { background: #10b981; }
    .color-dot.purple { background: #8b5cf6; }
    .color-dot.rose { background: #f43f5e; }

    /* Security items */
    .security-list { display: flex; flex-direction: column; gap: 2rem; }
    .security-item { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 1.5rem; }
    .security-item:last-child { border: none; }
    .sec-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .sec-info strong { font-size: 1.1rem; color: #111827; }
    .sec-info span { font-size: 0.9rem; color: #6b7280; line-height: 1.4; max-width: 400px; }

    /* Animations & Feedback */
    .animate-fade-in { animation: fadeIn 0.8s ease-out; }
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #065f46;
      color: white;
      padding: 1rem 2rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      transform: translateY(150%);
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 1000;
    }
    .toast.show { transform: translateY(0); }
    .toast.error { background: #991b1b; }

    .btn-link-danger {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0 0.5rem;
      text-decoration: underline;
    }
    .btn-link-danger:hover { color: #dc2626; }

    @media (max-width: 900px) {
      .profile-main { grid-template-columns: 1fr; }
      .header-content { flex-direction: column; align-items: center; text-align: center; }
      .avatar-circle { margin-bottom: 1rem; }
      .info-grid { grid-template-columns: 1fr; }
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
      phoneNumber: ['']
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadUser();
    // Debug helper: allows you to check state in browser console via 'window.profileComp'
    (window as any).profileComp = this;
  }

  loadUser() {
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || ''
      });
    }
  }

  toggleEdit() {
    console.log('[Profile] Toggling edit mode to:', !this.isEditMode());
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

    console.log('[Profile] DISPATCH:', this.profileForm.value);

    this.userService.update(current.id, { ...current, ...this.profileForm.value } as User).subscribe({
      next: (user: User) => {
        console.log('[Profile] API Success - Received:', user);

        // Unlock button immediately
        this.isSaving.set(false);
        this.cd.detectChanges();

        // Background session sync
        setTimeout(() => {
          try {
            this.authService.setSession(user);
            this.currentUser.set(user);
            console.log('[Profile] Data synced to memory');
          } catch (e) {
            console.error('[Profile] Sync Error:', e);
          }
        }, 50);

        this.notify('Profile updated successfully!');

        // Wait for user to see the success toast before closing edit mode
        setTimeout(() => {
          this.isEditMode.set(false);
          this.cd.detectChanges();
        }, 500);
      },
      error: (err) => {
        console.error('[Profile] API Error:', err);
        this.isSaving.set(false);
        this.notify('Update failed. Please check backend.', true);
        this.cd.detectChanges();
      }
    });

    // 10 second absolute failsafe
    setTimeout(() => {
      if (this.isSaving()) {
        console.log('[Profile] 10s Failsafe Triggered');
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

    console.log('[Security] START PASSWORD UPDATE');

    // In a real app, you'd verify currentPassword first. 
    // Here we use the generic update endpoint which handles the password field.
    const updatedData = {
      ...current,
      password: newPassword
    };

    this.userService.update(current.id, updatedData as User).subscribe({
      next: (user: User) => {
        console.log('[Security] SUCCESS');
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

