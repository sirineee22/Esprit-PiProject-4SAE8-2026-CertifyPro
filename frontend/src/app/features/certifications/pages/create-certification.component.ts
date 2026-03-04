import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { timeout, TimeoutError } from 'rxjs';

interface CreateCertificationForm {
  // --- Certification fields ---
  code: string;
  name: string;
  description: string;
  validityMonths: number | null;
  requiredScore: number | null;       // cert-level required score
  criteriaDescription: string;
  isActive: boolean;
  // Extra display-only metadata (packed into criteriaDescription as JSON)
  level: string;
  category: string;
  duration: string;
  price: string;
  topics: string;
  skills: string;
  prerequisites: string;
  language: string;

  // --- CertificationExam fields ---
  examTitle: string;               // CertificationExam.title
  examDurationMinutes: number | null; // CertificationExam.durationMinutes
  examPassingScore: number | null;    // CertificationExam.passingScore
  examMaxAttempts: number | null;     // CertificationExam.maxAttemptsPerUser
  examIsActive: boolean;              // CertificationExam.isActive
}

@Component({
  selector: 'app-create-certification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="create-cert-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-inner">
          <a routerLink="/certifications" class="back-link">
            <i class="bi bi-arrow-left"></i> Back to Certifications
          </a>
          <div class="header-text">
            <span class="trainer-badge">
              <i class="bi bi-person-badge"></i> Trainer Portal
            </span>
            <h1>Create New <span class="grad">Certification</span></h1>
            <p>Fill in the details below. Learners will see this on the certifications catalog.</p>
          </div>
        </div>
      </div>

      <!-- Progress Steps -->
      <div class="progress-bar-wrap">
        <div class="progress-inner">
          <div class="step" [class.active]="currentStep >= 1" [class.done]="currentStep > 1">
            <div class="step-circle">
              <i class="bi" [class]="currentStep > 1 ? 'bi-check-lg' : 'bi-info-circle'"></i>
            </div>
            <span>Basics</span>
          </div>
          <div class="step-line" [class.done]="currentStep > 1"></div>
          <div class="step" [class.active]="currentStep >= 2" [class.done]="currentStep > 2">
            <div class="step-circle">
              <i class="bi" [class]="currentStep > 2 ? 'bi-check-lg' : 'bi-journal-text'"></i>
            </div>
            <span>Content</span>
          </div>
          <div class="step-line" [class.done]="currentStep > 2"></div>
          <div class="step" [class.active]="currentStep >= 3" [class.done]="currentStep > 3">
            <div class="step-circle">
              <i class="bi" [class]="currentStep > 3 ? 'bi-check-lg' : 'bi-clipboard-data'"></i>
            </div>
            <span>Exam</span>
          </div>
          <div class="step-line" [class.done]="currentStep > 3"></div>
          <div class="step" [class.active]="currentStep >= 4">
            <div class="step-circle">
              <i class="bi bi-eye"></i>
            </div>
            <span>Review</span>
          </div>
        </div>
      </div>

      <div class="form-layout">

        <!-- ===== STEP 1: BASICS ===== -->
        <div class="form-card" *ngIf="currentStep === 1">
          <div class="card-title">
            <i class="bi bi-info-circle-fill"></i>
            <h2>Basic Information</h2>
          </div>

          <div class="form-grid">
            <div class="field full-width">
              <label>Certification Code <span class="req">*</span></label>
              <div class="input-wrap">
                <i class="bi bi-hash"></i>
                <input
                  type="text"
                  placeholder="e.g. AWS-SAA, PMP-2026"
                  [(ngModel)]="form.code"
                  name="code"
                  required
                  (input)="form.code = form.code.toUpperCase()"
                >
              </div>
              <span class="field-hint">A unique short code (will be stored uppercase)</span>
            </div>

            <div class="field full-width">
              <label>Certification Name <span class="req">*</span></label>
              <div class="input-wrap">
                <i class="bi bi-award"></i>
                <input
                  type="text"
                  placeholder="e.g. AWS Certified Solutions Architect"
                  [(ngModel)]="form.name"
                  name="name"
                  required
                >
              </div>
            </div>

            <div class="field">
              <label>Category</label>
              <div class="input-wrap">
                <i class="bi bi-tag"></i>
                <select [(ngModel)]="form.category" name="category">
                  <option value="">Select category...</option>
                  <option value="IT &amp; Cloud">IT &amp; Cloud</option>
                  <option value="Business">Business</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label>Level</label>
              <div class="input-wrap">
                <i class="bi bi-bar-chart-steps"></i>
                <select [(ngModel)]="form.level" name="level">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label>Duration</label>
              <div class="input-wrap">
                <i class="bi bi-clock"></i>
                <input type="text" placeholder="e.g. 40 hours, 12 weeks"
                  [(ngModel)]="form.duration" name="duration">
              </div>
            </div>

            <div class="field">
              <label>Price / Fee</label>
              <div class="input-wrap">
                <i class="bi bi-currency-dollar"></i>
                <input type="text" placeholder="e.g. $299, Free, $99/mo"
                  [(ngModel)]="form.price" name="price">
              </div>
            </div>

            <div class="field">
              <label>Validity (months)</label>
              <div class="input-wrap">
                <i class="bi bi-calendar-check"></i>
                <input type="number" placeholder="e.g. 36"
                  [(ngModel)]="form.validityMonths" name="validityMonths" min="1">
              </div>
            </div>

            <div class="field">
              <label>Language</label>
              <div class="input-wrap">
                <i class="bi bi-globe"></i>
                <input type="text" placeholder="e.g. English"
                  [(ngModel)]="form.language" name="language">
              </div>
            </div>
          </div>

          <div class="toggle-row">
            <div class="toggle-label">
              <i class="bi bi-toggle-on"></i>
              <div>
                <strong>Active &amp; Visible</strong>
                <p>Learners can see and enroll in this certification immediately</p>
              </div>
            </div>
            <label class="switch">
              <input type="checkbox" [(ngModel)]="form.isActive" name="isActive">
              <span class="slider"></span>
            </label>
          </div>

          <div class="step-actions">
            <span></span>
            <button class="btn-next" (click)="nextStep()" [disabled]="!form.code || !form.name">
              Next: Content <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- ===== STEP 2: CONTENT ===== -->
        <div class="form-card" *ngIf="currentStep === 2">
          <div class="card-title">
            <i class="bi bi-journal-text-fill"></i>
            <h2>Description &amp; Content</h2>
          </div>

          <div class="field full-width">
            <label>Short Description</label>
            <div class="input-wrap">
              <i class="bi bi-text-paragraph"></i>
              <input type="text" placeholder="One-line summary shown on the catalog card"
                [(ngModel)]="form.description" name="description">
            </div>
          </div>

          <div class="field full-width">
            <label>Full Description / About</label>
            <textarea rows="5" placeholder="Detailed description shown on the certification detail page..."
              [(ngModel)]="form.criteriaDescription" name="criteriaDescription"></textarea>
          </div>

          <div class="field full-width">
            <label>Topics Covered</label>
            <textarea rows="4"
              placeholder="Enter each topic on a new line:&#10;Design Resilient Architectures&#10;AWS Core Services (EC2, S3, VPC)&#10;Security &amp; Identity Management"
              [(ngModel)]="form.topics" name="topics"></textarea>
            <span class="field-hint">One topic per line — displayed as a checklist on the detail page</span>
          </div>

          <div class="field full-width">
            <label>Skills Learners Will Gain</label>
            <textarea rows="3"
              placeholder="Comma-separated: Cloud Architecture, AWS EC2, IAM Security, Lambda Functions"
              [(ngModel)]="form.skills" name="skills"></textarea>
            <span class="field-hint">Comma-separated list — shown as skill chips</span>
          </div>

          <div class="field full-width">
            <label>Prerequisites</label>
            <textarea rows="3"
              placeholder="Enter each prerequisite on a new line:&#10;1 year of AWS experience&#10;Basic networking knowledge"
              [(ngModel)]="form.prerequisites" name="prerequisites"></textarea>
            <span class="field-hint">One prerequisite per line</span>
          </div>

          <div class="step-actions">
            <button class="btn-back" (click)="prevStep()">
              <i class="bi bi-arrow-left"></i> Back
            </button>
            <button class="btn-next" (click)="nextStep()">
              Next: Exam Details <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- ===== STEP 3: EXAM ===== -->
        <div class="form-card" *ngIf="currentStep === 3">
          <div class="card-title">
            <i class="bi bi-clipboard-data-fill"></i>
            <h2>Exam Configuration</h2>
          </div>

          <div class="form-grid">
            <!-- CertificationExam.title -->
            <div class="field full-width">
              <label>Exam Title <span class="req">*</span></label>
              <div class="input-wrap">
                <i class="bi bi-journal-check"></i>
                <input type="text" placeholder="e.g. AWS Solutions Architect Associate Exam"
                  [(ngModel)]="form.examTitle" name="examTitle">
              </div>
              <span class="field-hint">A descriptive title for this exam session</span>
            </div>

            <!-- CertificationExam.durationMinutes -->
            <div class="field">
              <label>Duration (minutes)</label>
              <div class="input-wrap">
                <i class="bi bi-hourglass-split"></i>
                <input type="number" placeholder="e.g. 130"
                  [(ngModel)]="form.examDurationMinutes" name="examDurationMinutes" min="1">
              </div>
            </div>

            <!-- CertificationExam.passingScore -->
            <div class="field">
              <label>Passing Score (%)</label>
              <div class="input-wrap">
                <i class="bi bi-graph-up"></i>
                <input type="number" placeholder="e.g. 72"
                  [(ngModel)]="form.examPassingScore" name="examPassingScore" min="0" max="100">
              </div>
            </div>

            <!-- CertificationExam.maxAttemptsPerUser -->
            <div class="field">
              <label>Max Attempts per User</label>
              <div class="input-wrap">
                <i class="bi bi-repeat"></i>
                <input type="number" placeholder="e.g. 3 (leave blank for unlimited)"
                  [(ngModel)]="form.examMaxAttempts" name="examMaxAttempts" min="1">
              </div>
              <span class="field-hint">Leave blank for unlimited attempts</span>
            </div>

          </div>

          <!-- CertificationExam.isActive toggle -->
          <div class="toggle-row" style="margin-top: 1.25rem">
            <div class="toggle-label">
              <i class="bi bi-toggle-on"></i>
              <div>
                <strong>Exam Active</strong>
                <p>Learners can take this exam immediately after enrolling</p>
              </div>
            </div>
            <label class="switch">
              <input type="checkbox" [(ngModel)]="form.examIsActive" name="examIsActive">
              <span class="slider"></span>
            </label>
          </div>

          <!-- Exam preview cards -->
          <div class="exam-preview" *ngIf="form.examDurationMinutes || form.examPassingScore || form.examMaxAttempts">
            <p class="preview-label">Preview:</p>
            <div class="exam-cards-row">
              <div class="exam-mini-card" *ngIf="form.examDurationMinutes">
                <i class="bi bi-hourglass-split"></i>
                <span class="val">{{ form.examDurationMinutes }} min</span>
                <span class="lbl">Duration</span>
              </div>
              <div class="exam-mini-card" *ngIf="form.examPassingScore">
                <i class="bi bi-graph-up"></i>
                <span class="val">{{ form.examPassingScore }}%</span>
                <span class="lbl">Pass Score</span>
              </div>
              <div class="exam-mini-card" *ngIf="form.examMaxAttempts">
                <i class="bi bi-repeat"></i>
                <span class="val">{{ form.examMaxAttempts }}x</span>
                <span class="lbl">Max Attempts</span>
              </div>
              <div class="exam-mini-card">
                <i class="bi" [class.bi-check-circle-fill]="form.examIsActive" [class.bi-x-circle]="!form.examIsActive"
                   [style.color]="form.examIsActive ? '#10b981' : '#ef4444'"></i>
                <span class="val">{{ form.examIsActive ? 'Active' : 'Inactive' }}</span>
                <span class="lbl">Status</span>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-back" (click)="prevStep()">
              <i class="bi bi-arrow-left"></i> Back
            </button>
            <button class="btn-next" (click)="nextStep()">
              Review &amp; Submit <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- ===== STEP 4: REVIEW ===== -->
        <div class="form-card" *ngIf="currentStep === 4">
          <div class="card-title">
            <i class="bi bi-eye-fill"></i>
            <h2>Review &amp; Submit</h2>
          </div>

          <div class="review-grid">
            <div class="review-section">
              <h3><i class="bi bi-info-circle"></i> Basic Info</h3>
              <div class="review-row"><span>Code</span><strong>{{ form.code }}</strong></div>
              <div class="review-row"><span>Name</span><strong>{{ form.name }}</strong></div>
              <div class="review-row"><span>Category</span><strong>{{ form.category || '—' }}</strong></div>
              <div class="review-row"><span>Level</span><strong>{{ form.level }}</strong></div>
              <div class="review-row"><span>Duration</span><strong>{{ form.duration || '—' }}</strong></div>
              <div class="review-row"><span>Price</span><strong>{{ form.price || '—' }}</strong></div>
              <div class="review-row"><span>Validity</span><strong>{{ form.validityMonths ? form.validityMonths + ' months' : '—' }}</strong></div>
              <div class="review-row"><span>Status</span>
                <strong [class.active-badge]="form.isActive" [class.inactive-badge]="!form.isActive">
                  {{ form.isActive ? 'Active' : 'Inactive' }}
                </strong>
              </div>
            </div>

            <div class="review-section">
              <h3><i class="bi bi-clipboard-data"></i> Exam Info</h3>
              <div class="review-row"><span>Exam Title</span><strong>{{ form.examTitle || '—' }}</strong></div>
              <div class="review-row"><span>Duration</span><strong>{{ form.examDurationMinutes ? form.examDurationMinutes + ' min' : '—' }}</strong></div>
              <div class="review-row"><span>Passing Score</span><strong>{{ form.examPassingScore ? form.examPassingScore + '%' : '—' }}</strong></div>
              <div class="review-row"><span>Max Attempts</span><strong>{{ form.examMaxAttempts || 'Unlimited' }}</strong></div>
              <div class="review-row"><span>Exam Active</span>
                <strong [class.active-badge]="form.examIsActive" [class.inactive-badge]="!form.examIsActive">
                  {{ form.examIsActive ? 'Active' : 'Inactive' }}
                </strong>
              </div>
            </div>

            <div class="review-section full-review">
              <h3><i class="bi bi-text-paragraph"></i> Description</h3>
              <p>{{ form.description || '—' }}</p>
            </div>

            <div class="review-section full-review" *ngIf="form.topics">
              <h3><i class="bi bi-journal-bookmark"></i> Topics</h3>
              <p style="white-space: pre-line">{{ form.topics }}</p>
            </div>
          </div>

          <!-- Error / Success messages -->
          <div class="alert-error" *ngIf="errorMessage">
            <i class="bi bi-exclamation-triangle-fill"></i> {{ errorMessage }}
          </div>

          <div class="alert-success" *ngIf="successMessage">
            <i class="bi bi-patch-check-fill"></i> {{ successMessage }}
          </div>

          <div class="step-actions">
            <button class="btn-back" (click)="prevStep()" [disabled]="isSubmitting">
              <i class="bi bi-arrow-left"></i> Back
            </button>
            <button class="btn-submit" (click)="submit()" [disabled]="isSubmitting || !!successMessage">
              <span *ngIf="!isSubmitting">
                <i class="bi bi-cloud-upload"></i> Publish Certification
              </span>
              <span *ngIf="isSubmitting">
                <i class="bi bi-hourglass-split spinning"></i> Publishing...
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #f1f5f9;
      min-height: 100vh;
    }

    /* ===== HEADER ===== */
    .page-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #3b82f6 100%);
      padding: 3rem 2rem;
    }

    .header-inner {
      max-width: 900px;
      margin: 0 auto;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: white; }

    .trainer-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.9);
      padding: 0.3rem 0.9rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .header-text h1 {
      font-size: 2.2rem;
      font-weight: 800;
      color: white;
      margin: 0 0 0.5rem;
    }

    .grad {
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-text p {
      color: rgba(255,255,255,0.65);
      font-size: 1rem;
      margin: 0;
    }

    /* ===== PROGRESS BAR ===== */
    .progress-bar-wrap {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 1.25rem 2rem;
    }

    .progress-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      flex-shrink: 0;
    }

    .step-circle {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }

    .step.active .step-circle {
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      color: white;
      box-shadow: 0 4px 12px rgba(59,130,246,0.35);
    }

    .step.done .step-circle {
      background: #10b981;
      color: white;
    }

    .step span {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .step.active span,
    .step.done span { color: #1e293b; }

    .step-line {
      flex: 1;
      height: 2px;
      background: #e2e8f0;
      margin: 0 0.75rem;
      margin-bottom: 1.2rem;
      transition: background 0.3s;
    }

    .step-line.done { background: #10b981; }

    /* ===== LAYOUT ===== */
    .form-layout {
      max-width: 900px;
      margin: 2.5rem auto;
      padding: 0 2rem 4rem;
    }

    /* ===== FORM CARD ===== */
    .form-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .card-title i {
      font-size: 1.5rem;
      color: #3b82f6;
    }

    .card-title h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    /* ===== FORM FIELDS ===== */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .field.full-width {
      grid-column: 1 / -1;
    }

    label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }

    .req { color: #ef4444; }

    .input-wrap {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 0 1rem;
      transition: all 0.2s;
    }

    .input-wrap:focus-within {
      border-color: #3b82f6;
      background: white;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
    }

    .input-wrap i {
      color: #94a3b8;
      font-size: 1rem;
      margin-right: 0.75rem;
      flex-shrink: 0;
    }

    .input-wrap input,
    .input-wrap select {
      border: none;
      outline: none;
      background: transparent;
      width: 100%;
      padding: 0.75rem 0;
      font-size: 0.95rem;
      color: #1e293b;
    }

    textarea {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      font-size: 0.95rem;
      color: #1e293b;
      width: 100%;
      resize: vertical;
      font-family: inherit;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    textarea:focus {
      outline: none;
      border-color: #3b82f6;
      background: white;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
    }

    .field-hint {
      font-size: 0.78rem;
      color: #94a3b8;
      margin-top: 0.15rem;
    }

    /* ===== TOGGLE ===== */
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-top: 1.5rem;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .toggle-label > i {
      font-size: 1.4rem;
      color: #3b82f6;
    }

    .toggle-label strong { font-size: 0.95rem; color: #1e293b; }
    .toggle-label p { font-size: 0.8rem; color: #94a3b8; margin: 0.15rem 0 0; }

    /* Toggle Switch */
    .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
    .switch input { opacity: 0; width: 0; height: 0; }

    .slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: #cbd5e1;
      border-radius: 26px;
      transition: 0.3s;
    }

    .slider::before {
      content: '';
      position: absolute;
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    input:checked + .slider { background: #3b82f6; }
    input:checked + .slider::before { transform: translateX(24px); }

    /* ===== EXAM PREVIEW ===== */
    .exam-preview {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px dashed #cbd5e1;
    }

    .preview-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
    }

    .exam-cards-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .exam-mini-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      min-width: 90px;
    }

    .exam-mini-card i { color: #3b82f6; font-size: 1.2rem; }
    .exam-mini-card .val { font-weight: 800; color: #1e293b; font-size: 1.1rem; }
    .exam-mini-card .lbl { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; }

    /* ===== REVIEW ===== */
    .review-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .review-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
    }

    .review-section.full-review {
      grid-column: 1 / -1;
    }

    .review-section h3 {
      font-size: 0.9rem;
      font-weight: 700;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .review-section h3 i { color: #3b82f6; }

    .review-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.4rem 0;
      border-bottom: 1px dashed #e2e8f0;
    }

    .review-row:last-child { border-bottom: none; }
    .review-row span { font-size: 0.85rem; color: #94a3b8; }
    .review-row strong { font-size: 0.9rem; color: #1e293b; text-align: right; }

    .active-badge { color: #16a34a !important; }
    .inactive-badge { color: #dc2626 !important; }

    /* ===== ALERTS ===== */
    .alert-error, .alert-success {
      padding: 1rem 1.25rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      animation: fadeIn 0.3s ease;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
    }

    .alert-success {
      background: #f0fdf4;
      border: 1px solid #86efac;
      color: #16a34a;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ===== STEP ACTIONS ===== */
    .step-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-next {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      color: white;
      border: none;
      padding: 0.85rem 2rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(59,130,246,0.3);
    }

    .btn-next:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(59,130,246,0.4);
    }

    .btn-next:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      color: #475569;
      border: 1.5px solid #e2e8f0;
      padding: 0.85rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-back:hover:not(:disabled) { background: #f8fafc; }

    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      border: none;
      padding: 0.85rem 2rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16,185,129,0.4);
    }

    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    .spinning { animation: spin 1s linear infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 700px) {
      .form-grid { grid-template-columns: 1fr; }
      .review-grid { grid-template-columns: 1fr; }
      .form-card { padding: 1.5rem; }
      .header-text h1 { font-size: 1.7rem; }
      .progress-inner { gap: 0.25rem; }
    }
  `]
})
export class CreateCertificationComponent implements OnInit {
  currentStep = 1;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  form: CreateCertificationForm = {
    // Certification fields
    code: '',
    name: '',
    description: '',
    validityMonths: null,
    requiredScore: null,
    criteriaDescription: '',
    isActive: true,
    level: 'Intermediate',
    category: '',
    duration: '',
    price: '',
    topics: '',
    skills: '',
    prerequisites: '',
    language: 'English',
    // CertificationExam fields
    examTitle: '',
    examDurationMinutes: null,
    examPassingScore: null,
    examMaxAttempts: null,
    examIsActive: true
  };

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    if (!user || user.role?.name !== 'TRAINER') {
      this.router.navigate(['/']);
    }
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  submit() {
    this.errorMessage = '';
    this.successMessage = '';

    const user = this.auth.getCurrentUser();
    if (!user?.id) {
      this.errorMessage = 'You must be logged in as a trainer to create a certification.';
      return;
    }

    this.isSubmitting = true;

    // Build metadata blob to store display-only fields inside criteriaDescription
    const metaJson = JSON.stringify({
      level: this.form.level,
      category: this.form.category,
      duration: this.form.duration,
      price: this.form.price,
      topics: this.form.topics,
      skills: this.form.skills,
      prerequisites: this.form.prerequisites,
      language: this.form.language,
      fullDescription: this.form.criteriaDescription
    });

    // -- Step 1: Create the Certification --
    const certPayload = {
      code: this.form.code,
      name: this.form.name,
      description: this.form.description,
      validityMonths: this.form.validityMonths,
      requiredScore: this.form.requiredScore,
      criteriaDescription: metaJson,
      isActive: this.form.isActive,
      trainerId: user.id
    };

    this.http.post(API_ENDPOINTS.certifications, certPayload)
      .pipe(timeout(15000))
      .subscribe({
        next: (certRes: any) => {
          // -- Step 2: Create the CertificationExam (if exam title provided) --
          if (this.form.examTitle?.trim()) {
            const examPayload = {
              certificationCode: certRes.code ?? this.form.code.toUpperCase(),
              title: this.form.examTitle.trim(),
              durationMinutes: this.form.examDurationMinutes,
              passingScore: this.form.examPassingScore,
              maxAttemptsPerUser: this.form.examMaxAttempts,
              isActive: this.form.examIsActive
            };

            this.http.post(API_ENDPOINTS.certificationExams, examPayload)
              .pipe(timeout(10000))
              .subscribe({
                next: () => {
                  this.isSubmitting = false;
                  this.successMessage = `🎉 "${this.form.name}" and its exam have been published! Learners can now see it in the catalog.`;
                  setTimeout(() => this.router.navigate(['/certifications']), 2500);
                },
                error: (examErr) => {
                  // Certification was saved; exam failed — show partial success
                  this.isSubmitting = false;
                  this.successMessage = `✅ Certification "${this.form.name}" was saved, but the exam could not be created (${examErr.status ?? 'network error'}). You can add the exam later.`;
                  setTimeout(() => this.router.navigate(['/certifications']), 3500);
                }
              });
          } else {
            // No exam title — skip exam creation
            this.isSubmitting = false;
            this.successMessage = `🎉 "${this.form.name}" has been published successfully! Learners can now see it in the catalog.`;
            setTimeout(() => this.router.navigate(['/certifications']), 2500);
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          if (err instanceof TimeoutError || err.name === 'TimeoutError') {
            this.errorMessage = '⏱️ Request timed out. The backend server (port 8083) does not appear to be running. Please start it and try again.';
          } else if (err.status === 0) {
            this.errorMessage = '🔌 Cannot connect to the backend server. Please make sure the Spring Boot app is running on port 8083.';
          } else if (err.status === 409) {
            this.errorMessage = 'A certification with this code already exists. Please use a different code.';
          } else if (err.status === 403) {
            this.errorMessage = 'Only TRAINER accounts can create certifications.';
          } else {
            this.errorMessage = (typeof err.error === 'string' ? err.error : null)
              || `Server error (${err.status}). Please try again.`;
          }
        }
      });
  }
}
