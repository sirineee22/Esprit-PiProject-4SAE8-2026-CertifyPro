import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { AiService } from '../../../core/services/ai.service';
import { ToastService } from '../../../core/services/toast.service';
import { timeout, TimeoutError } from 'rxjs';

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

interface CreateCertificationForm {
  // --- Certification fields ---
  code: string;
  name: string;
  description: string;
  validityMonths: number | null;
  requiredScore: number | null;
  criteriaDescription: string;
  isActive: boolean;
  // Metadata packed into criteriaDescription as JSON
  level: string;
  category: string;
  duration: string;
  price: string;
  topics: string;
  skills: string;
  prerequisites: string;
  language: string;
  nextExamDate: string;   // date picker value (yyyy-mm-dd)

  // --- CertificationExam fields ---
  examTitle: string;
  examDurationMinutes: number | null;
  examPassingScore: number | null;
  examMaxAttempts: number | null;
  examIsActive: boolean;
  examPdfName: string | null;       // stores attached PDF filename
  quizQuestions: QuizQuestion[];    // array of quiz questions
  practiceQuizQuestions: QuizQuestion[]; // separate quiz set for practice mode
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

            <!-- Certification Code (required) -->
            <div class="field full-width">
              <label>Certification Code <span class="req">*</span></label>
              <div class="input-wrap" [class.input-error]="touched && !form.code">
                <i class="bi bi-hash"></i>
                <input
                  type="text"
                  placeholder="e.g. AWS-SAA, PMP-2026"
                  [(ngModel)]="form.code"
                  name="code"
                  (input)="form.code = form.code.toUpperCase()"
                >
              </div>
              <span class="error-msg" *ngIf="touched && !form.code">
                <i class="bi bi-exclamation-circle"></i> Certification code is required.
              </span>
              <span class="field-hint" *ngIf="!touched || form.code">A unique short code (stored uppercase)</span>
            </div>

            <!-- Certification Name (required) -->
            <div class="field full-width">
              <label>Certification Name <span class="req">*</span></label>
              <div class="input-wrap" [class.input-error]="touched && !form.name">
                <i class="bi bi-award"></i>
                <input
                  type="text"
                  placeholder="e.g. AWS Certified Solutions Architect"
                  [(ngModel)]="form.name"
                  name="name"
                >
              </div>
              <span class="error-msg" *ngIf="touched && !form.name">
                <i class="bi bi-exclamation-circle"></i> Certification name is required.
              </span>
            </div>

            <!-- Category -->
            <div class="field">
              <label>Category <span class="req">*</span></label>
              <div class="input-wrap" [class.input-error]="touched && !form.category">
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
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                </select>
              </div>
              <span class="error-msg" *ngIf="touched && !form.category">
                <i class="bi bi-exclamation-circle"></i> Please select a category.
              </span>
            </div>

            <!-- Level -->
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

            <!-- Duration (Value and Unit choice) -->
            <div class="field">
              <label>Duration</label>
              <div class="duration-group">
                <div class="input-wrap">
                  <i class="bi bi-clock"></i>
                  <input
                    type="number"
                    placeholder="Value"
                    [(ngModel)]="durationValue"
                    name="durationValue"
                    min="1"
                    (keypress)="onlyNumbers($event)"
                    (input)="updateDuration()"
                  >
                </div>
                <div class="input-wrap unit-select">
                  <select [(ngModel)]="durationUnit" name="durationUnit" (change)="updateDuration()">
                    <option value="Hours">Hours</option>
                    <option value="Days">Days</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Months">Months</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Price / Fee Selector -->
            <div class="field">
              <label>Price / Fee (USD)</label>
              <div class="price-type-toggle">
                <button type="button" 
                        class="btn-toggle" 
                        [class.active]="isFree" 
                        (click)="isFree = true; form.price = '0'">
                  <i class="bi bi-gift-fill"></i> Free
                </button>
                <button type="button" 
                        class="btn-toggle" 
                        [class.active]="!isFree" 
                        (click)="isFree = false">
                  <i class="bi bi-cash-stack"></i> Paid
                </button>
              </div>

              <div class="input-wrap animate-fade-in" *ngIf="!isFree">
                <i class="bi bi-currency-dollar"></i>
                <input
                  type="number"
                  placeholder="Enter amount (e.g. 299)"
                  [(ngModel)]="form.price"
                  name="price"
                  min="0" step="0.01"
                  (keypress)="onlyNumbers($event)"
                >
              </div>
              <span class="field-hint" *ngIf="isFree">Certification will be marked as <strong>FREE</strong> for all learners.</span>
              <span class="field-hint" *ngIf="!isFree">Set a registration fee for this certification.</span>
            </div>

            <!-- Validity months (numbers only) -->
            <div class="field">
              <label>Validity (months)</label>
              <div class="input-wrap">
                <i class="bi bi-calendar-check"></i>
                <input
                  type="number"
                  placeholder="e.g. 36"
                  [(ngModel)]="form.validityMonths"
                  name="validityMonths"
                  min="1" max="120"
                  (keypress)="onlyNumbers($event)"
                >
              </div>
              <span class="field-hint">Must be a whole number (1–120)</span>
            </div>

            <!-- Required Score (numbers only) -->
            <div class="field">
              <label>Required Score (%)</label>
              <div class="input-wrap">
                <i class="bi bi-graph-up"></i>
                <input
                  type="number"
                  placeholder="e.g. 70"
                  [(ngModel)]="form.requiredScore"
                  name="requiredScore"
                  min="0" max="100" step="0.5"
                  (keypress)="onlyNumbers($event)"
                >
              </div>
              <span class="field-hint">Minimum score to pass (0–100)</span>
            </div>

            <!-- Language dropdown -->
            <div class="field">
              <label>Language</label>
              <div class="input-wrap">
                <i class="bi bi-globe"></i>
                <select [(ngModel)]="form.language" name="language">
                  <option value="English">🇬🇧 English</option>
                  <option value="French">🇫🇷 French</option>
                  <option value="Arabic">🇸🇦 Arabic</option>
                  <option value="Spanish">🇪🇸 Spanish</option>
                  <option value="German">🇩🇪 German</option>
                  <option value="Italian">🇮🇹 Italian</option>
                  <option value="Portuguese">🇵🇹 Portuguese</option>
                  <option value="Dutch">🇳🇱 Dutch</option>
                  <option value="Chinese">🇨🇳 Chinese</option>
                  <option value="Japanese">🇯🇵 Japanese</option>
                  <option value="Korean">🇰🇷 Korean</option>
                  <option value="Russian">🇷🇺 Russian</option>
                  <option value="Turkish">🇹🇷 Turkish</option>
                  <option value="Hindi">🇮🇳 Hindi</option>
                  <option value="Indonesian">🇮🇩 Indonesian</option>
                </select>
              </div>
            </div>

            <!-- Next Exam Date (calendar picker) -->
            <div class="field">
              <label>Next Exam Date</label>
              <div class="input-wrap">
                <i class="bi bi-calendar-event"></i>
                <input
                  type="date"
                  [(ngModel)]="form.nextExamDate"
                  name="nextExamDate"
                  [min]="today"
                >
              </div>
              <span class="field-hint">Leave blank if exam date is not yet scheduled</span>
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
            <button class="btn-next" (click)="goNextStep1()">
              {{ isEditing ? 'Save & Return to Review' : 'Next: Content' }} 
              <i class="bi" [class.bi-arrow-right]="!isEditing" [class.bi-check-circle]="isEditing"></i>
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <label style="margin: 0;">Full Description / About</label>
              <button 
                type="button" 
                class="btn-ai-gen" 
                (click)="generateAiDescription()" 
                [disabled]="isGeneratingAi || !form.description"
                [title]="!form.description ? 'Enter a short description first' : 'Generate full description using AI'"
              >
                <i class="bi" [class.bi-magic]="!isGeneratingAi" [class.bi-hourglass-split]="isGeneratingAi" [class.spinning]="isGeneratingAi"></i>
                {{ isGeneratingAi ? 'Creating Magic...' : 'Generate with AI' }}
              </button>
            </div>
            <textarea rows="8" placeholder="Detailed description shown on the certification detail page..."
              [(ngModel)]="form.criteriaDescription" name="criteriaDescription"></textarea>
            <span class="field-hint" *ngIf="!form.criteriaDescription && !isGeneratingAi">
              <i class="bi bi-lightbulb"></i> Tip: Enter a short description above and click "Generate with AI" to get a detailed draft!
            </span>
          </div>

          <div class="field full-width">
            <label>Topics Covered</label>
            <div class="tags-container">
              <div class="tags-list" *ngIf="selectedTopics.length > 0">
                <span class="tag-chip" *ngFor="let t of selectedTopics">
                  {{ t }} <i class="bi bi-x-circle-fill" (click)="removeTopic(t)"></i>
                </span>
              </div>
              <div class="tag-input-row">
                <div class="input-wrap">
                  <i class="bi bi-journal-bookmark"></i>
                  <select #topicSelect (change)="addTopic(topicSelect.value); topicSelect.value=''">
                    <option value="">-- Select from suggestions --</option>
                    <option *ngFor="let s of suggestedTopics" [value]="s" [disabled]="selectedTopics.includes(s)">{{ s }}</option>
                  </select>
                </div>
                <div class="input-wrap custom-input">
                  <input type="text" #customTopic placeholder="Or type a custom topic..." (keyup.enter)="addTopic(customTopic.value); customTopic.value=''">
                  <button type="button" class="btn-add" (click)="addTopic(customTopic.value); customTopic.value=''">Add</button>
                </div>
              </div>
            </div>
          </div>

          <div class="field full-width">
            <label>Skills Learners Will Gain</label>
            <div class="tags-container">
              <div class="tags-list" *ngIf="selectedSkills.length > 0">
                <span class="tag-chip skill-color" *ngFor="let s of selectedSkills">
                  {{ s }} <i class="bi bi-x-circle-fill" (click)="removeSkill(s)"></i>
                </span>
              </div>
              <div class="tag-input-row">
                <div class="input-wrap">
                  <i class="bi bi-lightning-charge"></i>
                  <select #skillSelect (change)="addSkill(skillSelect.value); skillSelect.value=''">
                    <option value="">-- Select from suggestions --</option>
                    <option *ngFor="let s of suggestedSkills" [value]="s" [disabled]="selectedSkills.includes(s)">{{ s }}</option>
                  </select>
                </div>
                <div class="input-wrap custom-input">
                  <input type="text" #customSkill placeholder="Or type a custom skill..." (keyup.enter)="addSkill(customSkill.value); customSkill.value=''">
                  <button type="button" class="btn-add" (click)="addSkill(customSkill.value); customSkill.value=''">Add</button>
                </div>
              </div>
            </div>
          </div>

          <div class="field full-width">
            <label>Prerequisites</label>
            <div class="tags-container">
              <div class="tags-list" *ngIf="selectedPrereqs.length > 0">
                <span class="tag-chip prereq-color" *ngFor="let p of selectedPrereqs">
                  {{ p }} <i class="bi bi-x-circle-fill" (click)="removePrereq(p)"></i>
                </span>
              </div>
              <div class="tag-input-row">
                <div class="input-wrap">
                  <i class="bi bi-list-check"></i>
                  <select #prereqSelect (change)="addPrereq(prereqSelect.value); prereqSelect.value=''">
                    <option value="">-- Select from suggestions --</option>
                    <option *ngFor="let s of suggestedPrereqs" [value]="s" [disabled]="selectedPrereqs.includes(s)">{{ s }}</option>
                  </select>
                </div>
                <div class="input-wrap custom-input">
                  <input type="text" #customPrereq placeholder="Or type custom prerequisite..." (keyup.enter)="addPrereq(customPrereq.value); customPrereq.value=''">
                  <button type="button" class="btn-add" (click)="addPrereq(customPrereq.value); customPrereq.value=''">Add</button>
                </div>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-back" (click)="prevStep()">
              <i class="bi bi-arrow-left"></i> Back
            </button>
            <button class="btn-next" (click)="nextStep()">
              {{ isEditing ? 'Save & Return to Review' : 'Next: Exam Details' }} 
              <i class="bi" [class.bi-arrow-right]="!isEditing" [class.bi-check-circle]="isEditing"></i>
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
            <!-- CertificationExam.title (required) -->
            <div class="field full-width">
              <label>Exam Title <span class="req">*</span></label>
              <div class="input-wrap" [class.input-error]="touchedStep3 && !form.examTitle">
                <i class="bi bi-journal-check"></i>
                <input type="text" placeholder="e.g. AWS Solutions Architect Associate Exam"
                  [(ngModel)]="form.examTitle" name="examTitle">
              </div>
              <span class="error-msg" *ngIf="touchedStep3 && !form.examTitle">
                <i class="bi bi-exclamation-circle"></i> Exam title is required.
              </span>
              <span class="field-hint" *ngIf="!touchedStep3 || form.examTitle">A descriptive title for this exam session</span>
            </div>

            <!-- Exam Duration (Value and Unit choice) -->
            <div class="field">
              <label>Exam Duration</label>
              <div class="duration-group">
                <div class="input-wrap">
                  <i class="bi bi-hourglass-split"></i>
                  <input
                    type="number"
                    placeholder="Value"
                    [(ngModel)]="examDurationValue"
                    name="examDurationValue"
                    min="1"
                    (keypress)="onlyNumbers($event)"
                    (input)="updateExamDuration()"
                  >
                </div>
                <div class="input-wrap unit-select">
                  <select [(ngModel)]="examDurationUnit" name="examDurationUnit" (change)="updateExamDuration()">
                    <option value="Minutes">Minutes</option>
                    <option value="Hours">Hours</option>
                  </select>
                </div>
              </div>
              <span class="field-hint">Total time allowed for the exam</span>
            </div>

            <!-- Passing Score (numbers only) -->
            <div class="field">
              <label>Passing Score (%)</label>
              <div class="input-wrap">
                <i class="bi bi-graph-up"></i>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  [(ngModel)]="form.examPassingScore"
                  name="examPassingScore"
                  min="0" max="100" step="0.5"
                  (keypress)="onlyNumbers($event)"
                >
              </div>
              <span class="field-hint">0–100%</span>
            </div>

            <!-- Max Attempts (numbers only) -->
            <div class="field">
              <label>Max Attempts per User</label>
              <div class="input-wrap">
                <i class="bi bi-repeat"></i>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  [(ngModel)]="form.examMaxAttempts"
                  name="examMaxAttempts"
                  min="1" max="10"
                  (keypress)="onlyNumbers($event)"
                >
              </div>
              <span class="field-hint">Leave blank for unlimited attempts</span>
            </div>
          </div>

          <!-- PDF File Upload -->
          <div class="field full-width" style="margin-top: 1rem;">
            <label>Upload Exam Document (PDF) <span class="badge-optional">Optional</span></label>
            <div class="file-upload-box" 
                 [class.has-file]="form.examPdfName" 
                 [class.dragging]="isDragging"
                 (click)="fileInput.click()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)">
              <input type="file" #fileInput accept=".pdf" style="display: none" (change)="onFileSelected($event)">
              
              <div class="upload-content" *ngIf="!form.examPdfName">
                <i class="bi" [class.bi-cloud-arrow-up]="!isDragging" [class.bi-file-earmark-pdf-fill]="isDragging"></i>
                <p>{{ isDragging ? 'Drop it here!' : 'Click or Drag & Drop PDF file' }}</p>
                <span>Maximum size: 10MB</span>
              </div>
              
              <div class="upload-success" *ngIf="form.examPdfName">
                <i class="bi bi-file-earmark-pdf-fill"></i>
                <div class="file-info">
                  <strong>{{ form.examPdfName }}</strong>
                  <span>PDF Document attached successfully</span>
                </div>
                <button type="button" class="btn-remove-file" (click)="$event.stopPropagation(); removeFile()">
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Real Exam Quiz Builder -->
          <div class="field full-width" style="margin-top: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <label style="margin-bottom: 0;">Quiz / Exam Questions <span class="badge-optional">Optional</span></label>
                <span class="field-hint" style="display: block; margin-top: 0.2rem;">Add multiple-choice questions for the real exam</span>
              </div>
              <div style="display: flex; gap: 0.75rem;">
                <button 
                  type="button" 
                  class="btn-ai-gen quiz-ai-btn" 
                  (click)="generateAiQuiz()" 
                  [disabled]="isGeneratingQuiz || (!form.description && !form.criteriaDescription)"
                  title="Generate quiz questions using AI"
                >
                  <i class="bi" [class.bi-magic]="!isGeneratingQuiz" [class.bi-hourglass-split]="isGeneratingQuiz" [class.spinning]="isGeneratingQuiz"></i>
                  {{ isGeneratingQuiz ? 'Brainstorming...' : 'AI Generate Quiz' }}
                </button>
                <button class="btn-add-question" (click)="addQuizQuestion()">
                  <i class="bi bi-plus-circle"></i> Add Question
                </button>
              </div>
            </div>

            <div class="quiz-builder">
              <div class="no-questions" *ngIf="form.quizQuestions.length === 0">
                <i class="bi bi-clipboard2-x"></i>
                <p>No questions added yet. Click "Add Question" to build your exam.</p>
              </div>

              <!-- Question Form List -->
              <div class="question-card" *ngFor="let q of form.quizQuestions; let qIdx = index">
                <div class="q-header">
                  <strong>Question {{ qIdx + 1 }}</strong>
                  <button type="button" class="btn-delete-q" (click)="removeQuizQuestion(qIdx)" title="Remove Question">
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
                
                <div class="input-wrap full-width" style="margin-bottom: 1rem;">
                  <input type="text" placeholder="Enter your question here..." [(ngModel)]="q.questionText" [name]="'qtext' + qIdx">
                </div>

                <div class="options-list">
                  <div class="option-row" *ngFor="let opt of q.options; let oIdx = index; trackBy: trackByIndex">
                    <label class="custom-radio" title="Mark as correct answer">
                      <input type="radio" [name]="'correctOption_' + qIdx" [value]="oIdx" [(ngModel)]="q.correctOptionIndex">
                      <span class="radio-mark"></span>
                    </label>
                    <div class="input-wrap">
                      <input type="text" placeholder="Option text..." [(ngModel)]="q.options[oIdx]" [name]="'opt_' + qIdx + '_' + oIdx">
                    </div>
                    <button type="button" class="btn-remove-opt" (click)="removeQuizOption(qIdx, oIdx)" *ngIf="q.options.length > 2">
                      <i class="bi bi-x-circle"></i>
                    </button>
                  </div>
                </div>

                <button class="btn-add-opt" (click)="addQuizOption(qIdx)">
                  <i class="bi bi-plus"></i> Add Option
                </button>
              </div>
            </div>
          </div>

          <!-- Practice Mode Quiz Builder -->
          <div class="field full-width" style="margin-top: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <label style="margin-bottom: 0;">Practice Mode Questions <span class="badge-optional">Optional</span></label>
                <span class="field-hint" style="display: block; margin-top: 0.2rem;">
                  Add a dedicated quiz set used only in Practice Mode (instant correction, no grading).
                </span>
              </div>
              <div style="display: flex; gap: 0.75rem;">
                <button
                  type="button"
                  class="btn-ai-gen quiz-ai-btn"
                  (click)="generateAiPracticeQuiz()"
                  [disabled]="isGeneratingQuiz || (!form.description && !form.criteriaDescription)"
                  title="Generate practice questions using AI"
                >
                  <i class="bi" [class.bi-magic]="!isGeneratingQuiz" [class.bi-hourglass-split]="isGeneratingQuiz" [class.spinning]="isGeneratingQuiz"></i>
                  {{ isGeneratingQuiz ? 'Brainstorming...' : 'AI Generate Practice Quiz' }}
                </button>
                <button class="btn-add-question" (click)="addPracticeQuizQuestion()">
                  <i class="bi bi-plus-circle"></i> Add Practice Question
                </button>
              </div>
            </div>

            <div class="quiz-builder">
              <div class="no-questions" *ngIf="form.practiceQuizQuestions.length === 0">
                <i class="bi bi-clipboard2-x"></i>
                <p>No practice questions added yet.</p>
              </div>

              <div class="question-card" *ngFor="let q of form.practiceQuizQuestions; let qIdx = index">
                <div class="q-header">
                  <strong>Practice Question {{ qIdx + 1 }}</strong>
                  <button type="button" class="btn-delete-q" (click)="removePracticeQuizQuestion(qIdx)" title="Remove Question">
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>

                <div class="input-wrap full-width" style="margin-bottom: 1rem;">
                  <input type="text" placeholder="Enter your practice question..." [(ngModel)]="q.questionText" [name]="'practice_qtext' + qIdx">
                </div>

                <div class="options-list">
                  <div class="option-row" *ngFor="let opt of q.options; let oIdx = index; trackBy: trackByIndex">
                    <label class="custom-radio" title="Mark as correct answer">
                      <input type="radio" [name]="'practice_correctOption_' + qIdx" [value]="oIdx" [(ngModel)]="q.correctOptionIndex">
                      <span class="radio-mark"></span>
                    </label>
                    <div class="input-wrap">
                      <input type="text" placeholder="Option text..." [(ngModel)]="q.options[oIdx]" [name]="'practice_opt_' + qIdx + '_' + oIdx">
                    </div>
                    <button type="button" class="btn-remove-opt" (click)="removePracticeQuizOption(qIdx, oIdx)" *ngIf="q.options.length > 2">
                      <i class="bi bi-x-circle"></i>
                    </button>
                  </div>
                </div>

                <button class="btn-add-opt" (click)="addPracticeQuizOption(qIdx)">
                  <i class="bi bi-plus"></i> Add Option
                </button>
              </div>
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
            <button class="btn-next" (click)="goNextStep3()">
              {{ isEditing ? 'Save & Return to Review' : 'Review & Submit' }} 
              <i class="bi" [class.bi-arrow-right]="!isEditing" [class.bi-check-circle]="isEditing"></i>
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
              <div class="review-header">
                <h3><i class="bi bi-info-circle"></i> Basic Info</h3>
                <button type="button" class="btn-edit-section" (click)="editStep(1)">
                  <i class="bi bi-pencil-square"></i> Edit
                </button>
              </div>
              <div class="review-row"><span>Code</span><strong>{{ form.code }}</strong></div>
              <div class="review-row"><span>Name</span><strong>{{ form.name }}</strong></div>
              <div class="review-row"><span>Category</span><strong>{{ form.category || '—' }}</strong></div>
              <div class="review-row"><span>Level</span><strong>{{ form.level }}</strong></div>
              <div class="review-row"><span>Language</span><strong>{{ form.language }}</strong></div>
              <div class="review-row"><span>Duration</span><strong>{{ form.duration ? form.duration + ' hours' : '—' }}</strong></div>
              <div class="review-row"><span>Price</span><strong>{{ form.price ? '$' + form.price : '—' }}</strong></div>
              <div class="review-row"><span>Validity</span><strong>{{ form.validityMonths ? form.validityMonths + ' months' : '—' }}</strong></div>
              <div class="review-row"><span>Next Exam</span><strong>{{ form.nextExamDate || '—' }}</strong></div>
              <div class="review-row"><span>Status</span>
                <strong [class.active-badge]="form.isActive" [class.inactive-badge]="!form.isActive">
                  {{ form.isActive ? 'Active' : 'Inactive' }}
                </strong>
              </div>
            </div>

            <div class="review-section">
              <div class="review-header">
                <h3><i class="bi bi-clipboard-data"></i> Exam Info</h3>
                <button type="button" class="btn-edit-section" (click)="editStep(3)">
                  <i class="bi bi-pencil-square"></i> Edit
                </button>
              </div>
              <div class="review-row"><span>Exam Title</span><strong>{{ form.examTitle || '—' }}</strong></div>
              <div class="review-row"><span>Duration</span><strong>{{ form.examDurationMinutes ? form.examDurationMinutes + ' min' : '—' }}</strong></div>
              <div class="review-row"><span>Passing Score</span><strong>{{ form.examPassingScore ? form.examPassingScore + '%' : '—' }}</strong></div>
              <div class="review-row"><span>Max Attempts</span><strong>{{ form.examMaxAttempts || 'Unlimited' }}</strong></div>
              <div class="review-row"><span>Exam Active</span>
                <strong [class.active-badge]="form.examIsActive" [class.inactive-badge]="!form.examIsActive">
                  {{ form.examIsActive ? 'Active' : 'Inactive' }}
                </strong>
              </div>
              <div class="review-row"><span>PDF Attached</span><strong>{{ form.examPdfName || 'None' }}</strong></div>
              <div class="review-row"><span>Real Exam Questions</span><strong>{{ form.quizQuestions.length }} questions</strong></div>
              <div class="review-row"><span>Practice Questions</span><strong>{{ form.practiceQuizQuestions.length }} questions</strong></div>
            </div>

            <div class="review-section full-review">
              <div class="review-header">
                <h3><i class="bi bi-text-paragraph"></i> Description</h3>
                <button type="button" class="btn-edit-section" (click)="editStep(2)">
                  <i class="bi bi-pencil-square"></i> Edit
                </button>
              </div>
              <p>{{ form.description || '—' }}</p>
            </div>

            <div class="review-section full-review" *ngIf="selectedTopics.length">
              <div class="review-header">
                <h3><i class="bi bi-journal-bookmark"></i> Topics</h3>
                <button type="button" class="btn-edit-section" (click)="editStep(2)">
                  <i class="bi bi-pencil-square"></i> Edit
                </button>
              </div>
              <ul style="padding-left:1.5rem; margin:0.5rem 0 0"><li *ngFor="let t of selectedTopics">{{ t }}</li></ul>
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
      padding: 1.25rem clamp(0.75rem, 2.5vw, 2rem);
    }

    .progress-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      min-width: 620px;
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
      width: min(100%, 980px);
      margin: 2.5rem auto;
      padding: 0 clamp(0.75rem, 2.5vw, 2rem) 4rem;
    }

    /* ===== FORM CARD ===== */
    .form-card {
      background: white;
      border-radius: 20px;
      padding: clamp(1.25rem, 2.8vw, 2.5rem);
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
      animation: slideIn 0.3s ease;
      overflow-x: hidden;
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

    /* Duration Selector Styling */
    .duration-group {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 0.75rem;
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
      grid-template-columns: repeat(2, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    /* Price Toggle Styles */
    .price-type-toggle {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .btn-toggle {
      flex: 1;
      padding: 0.65rem 1rem;
      border: 1.5px solid #e2e8f0;
      background: white;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-toggle:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }

    .btn-toggle.active {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #3b82f6;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
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

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }

    .review-header h3 {
      border-bottom: none !important;
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
    }

    .btn-edit-section {
      background: transparent;
      border: 1px solid #e2e8f0;
      color: #3b82f6;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.2s;
    }

    .btn-edit-section:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
      transform: translateY(-1px);
    }

    .review-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 0.4rem 0;
      border-bottom: 1px dashed #e2e8f0;
    }

    .review-row:last-child { border-bottom: none; }
    .review-row span {
      font-size: 0.85rem;
      color: #94a3b8;
      flex: 0 0 40%;
      min-width: 100px;
    }
    .review-row strong {
      font-size: 0.9rem;
      color: #1e293b;
      text-align: right;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      flex: 1 1 auto;
      min-width: 0;
    }

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

    /* ===== AI GENERATION BUTTON ===== */
    .btn-ai-gen {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      border: none;
      padding: 0.5rem 1.25rem;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }

    .btn-ai-gen:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }

    .btn-ai-gen:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
    }

    .btn-ai-gen:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn-ai-gen i {
      font-size: 1rem;
    }

    /* ===== VALIDATION ===== */
    .error-msg {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      color: #ef4444;
      font-weight: 600;
      margin-top: 0.3rem;
      animation: fadeIn 0.2s ease;
    }
    .error-msg i { font-size: 0.85rem; }

    .input-wrap.input-error {
      border-color: #ef4444 !important;
      background: #fff5f5;
      box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

    /* Date input styling */
    input[type="date"] {
      border: none;
      outline: none;
      background: transparent;
      width: 100%;
      padding: 0.75rem 0;
      font-size: 0.95rem;
      color: #1e293b;
      cursor: pointer;
    }

    /* ===== CHIPS / TAGS ===== */
    .tags-container {
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .tags-list {
      display: flex; flex-wrap: wrap; gap: 0.4rem;
      padding: 0.5rem; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;
    }
    .tag-chip {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #e0e7ff; color: #3730a3; padding: 0.35rem 0.85rem;
      border-radius: 20px; font-size: 0.85rem; font-weight: 600;
    }
    .tag-chip.skill-color { background: #dbeafe; color: #1e40af; }
    .tag-chip.prereq-color { background: #ffedd5; color: #9a3412; }
    .tag-chip i { cursor: pointer; color: #818cf8; transition: color 0.2s; font-size: 1rem; }
    .tag-chip i:hover { color: #4338ca; }
    .skill-color i { color: #60a5fa; } .skill-color i:hover { color: #1d4ed8; }
    .prereq-color i { color: #fdba74; } .prereq-color i:hover { color: #c2410c; }

    .tag-input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .custom-input { display: flex; align-items: stretch; padding: 0 !important; overflow: hidden; border: 1px solid #cbd5e1; border-radius: 12px; }
    .custom-input input { padding: 0.75rem 1rem; flex-grow: 1; border: none; outline: none; }
    .btn-add {
      background: #f1f5f9; border: none; border-left: 1px solid #cbd5e1;
      padding: 0 1.25rem; font-weight: 600; color: #475569; cursor: pointer; transition: background 0.2s;
    }
    .btn-add:hover { background: #e2e8f0; color: #1e293b; }

    /* ===== PDF FILE UPLOAD ===== */
    .file-upload-box {
      border: 2px dashed #cbd5e1; border-radius: 16px; background: #f8fafc;
      padding: 2.5rem; text-align: center; cursor: pointer; transition: all 0.2s ease;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .file-upload-box:hover { border-color: #3b82f6; background: #f0f9ff; }
    .file-upload-box.dragging { border-color: #3b82f6; background: #eff6ff; border-width: 2px; transform: scale(1.01); box-shadow: 0 10px 20px rgba(59,130,246,0.1); }
    .file-upload-box.has-file { border-color: #10b981; background: #f0fdf4; border-style: solid; padding: 2rem; }
    
    .upload-content i { font-size: 3rem; color: #94a3b8; margin-bottom: 0.75rem; transition: color 0.2s; }
    .file-upload-box:hover .upload-content i { color: #3b82f6; }
    .upload-content p { color: #1e293b; font-weight: 600; font-size: 1.1rem; margin: 0 0 0.5rem 0; }
    .upload-content span { color: #64748b; font-size: 0.85rem; }

    .upload-success { display: flex; align-items: center; gap: 1rem; width: 100%; justify-content: center; }
    .upload-success i { font-size: 2.5rem; color: #ef4444; }
    .file-info { display: flex; flex-direction: column; text-align: left; }
    .file-info strong { color: #1e293b; font-size: 1rem; margin-bottom: 0.2rem; }
    .file-info span { color: #10b981; font-size: 0.85rem; font-weight: 600; }
    .btn-remove-file { 
      background: #fee2e2; color: #ef4444; border: none; width: 32px; height: 32px; 
      border-radius: 50%; display: flex; align-items: center; justify-content: center; 
      cursor: pointer; margin-left: 1rem; transition: all 0.2s;
    }
    .btn-remove-file:hover { background: #ef4444; color: white; }

    /* ===== QUIZ BUILDER ===== */
    .badge-optional { background: #e2e8f0; color: #475569; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-left: 0.5rem; }
    .btn-add-question { background: white; color: #3b82f6; border: 1.5px solid #bfdbfe; font-weight: 700; padding: 0.6rem 1.25rem; border-radius: 50px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.4rem; }
    .btn-add-question:hover { background: #eff6ff; border-color: #3b82f6; }
    
    .quiz-builder { display: flex; flex-direction: column; gap: 1.5rem; }
    .no-questions { text-align: center; padding: 3rem 2rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; color: #94a3b8; }
    .no-questions i { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
    .no-questions p { margin: 0; font-size: 0.95rem; }
    
    .question-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .q-header strong { font-size: 1.1rem; color: #1e3a8a; }
    .btn-delete-q { background: #fee2e2; color: #ef4444; border: none; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; }
    .btn-delete-q:hover { background: #fca5a5; }
    
    .options-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .option-row { display: flex; align-items: center; gap: 0.75rem; }
    .custom-radio { display: block; position: relative; padding-left: 28px; cursor: pointer; user-select: none; }
    .custom-radio input { position: absolute; opacity: 0; cursor: pointer; }
    .radio-mark { position: absolute; top: 0; left: 0; height: 22px; width: 22px; background-color: #f1f5f9; border: 2px solid #cbd5e1; border-radius: 50%; transition: all 0.2s; }
    .custom-radio:hover input ~ .radio-mark { background-color: #e2e8f0; }
    .custom-radio input:checked ~ .radio-mark { background-color: #10b981; border-color: #10b981; }
    .radio-mark:after { content: ""; position: absolute; display: none; }
    .custom-radio input:checked ~ .radio-mark:after { display: block; }
    .custom-radio .radio-mark:after { top: 5px; left: 5px; width: 8px; height: 8px; border-radius: 50%; background: white; }
    
    .btn-remove-opt { background: transparent; color: #94a3b8; border: none; font-size: 1.2rem; cursor: pointer; }
    .btn-remove-opt:hover { color: #ef4444; }
    
    .btn-add-opt { background: #f8fafc; color: #475569; border: 1px dashed #cbd5e1; width: 100%; border-radius: 8px; padding: 0.6rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-add-opt:hover { background: #f1f5f9; color: #1e293b; border-color: #94a3b8; }

    @media (max-width: 1024px) {
      .review-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 840px) {
      .progress-bar-wrap {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
    }

    @media (max-width: 700px) {
      .form-grid { grid-template-columns: 1fr; }
      .review-grid { grid-template-columns: 1fr; }
      .form-card { padding: 1.5rem; }
      .header-text h1 { font-size: 1.7rem; }
      .progress-inner { gap: 0.25rem; }
      .step-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }
      .step-actions button {
        width: 100%;
        justify-content: center;
      }
      .review-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
      }
      .review-row span { flex: 1; min-width: 0; }
      .review-row strong { text-align: left; }
      .tag-input-row { grid-template-columns: 1fr; }
      .duration-group { grid-template-columns: 1fr; }
    }
  `]
})
export class CreateCertificationComponent implements OnInit {
  currentStep = 1;
  isEditing = false;
  isSubmitting = false;
  isGeneratingAi = false;
  isGeneratingQuiz = false;
  errorMessage = '';
  successMessage = '';
  touched = false;   // becomes true when user tries to advance from step 1
  touchedStep3 = false; // validation for Step 3

  /** Today's date in yyyy-mm-dd format */
  today = new Date().toISOString().split('T')[0];

  // Suggestions
  suggestedTopics = [
    'Cloud Architecture', 'Security & Compliance', 'Database Design',
    'Machine Learning', 'API Development', 'CI/CD Pipelines',
    'Frontend Frameworks', 'UI/UX Principles', 'Agile Methodology'
  ];
  suggestedSkills = [
    'AWS', 'Azure', 'Python', 'Java', 'Docker', 'Kubernetes',
    'SQL', 'React', 'Angular', 'Node.js', 'Figma'
  ];
  suggestedPrereqs = [
    'No prior experience required',
    '1+ years of industry experience',
    'Basic understanding of programming',
    'Basic networking knowledge',
    'High school diploma or equivalent'
  ];

  selectedTopics: string[] = [];
  selectedSkills: string[] = [];
  selectedPrereqs: string[] = [];
  isFree = false;
  isDragging = false;
  durationValue: number = 40;
  durationUnit: string = 'Hours';
  examDurationValue: number = 120;
  examDurationUnit: string = 'Minutes';

  form: CreateCertificationForm = {
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
    nextExamDate: '',
    examTitle: '',
    examDurationMinutes: null,
    examPassingScore: null,
    examMaxAttempts: null,
    examIsActive: true,
    examPdfName: null,
    quizQuestions: [],
    practiceQuizQuestions: []
  };

  /** Used to prevent trackBy focus loss in ngFor inputs */
  trackByIndex(index: number, obj: any): any {
    return index;
  }

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private aiService: AiService,
    private toast: ToastService
  ) { }

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    if (!user || user.role?.name !== 'TRAINER') {
      this.router.navigate(['/']);
    }
    this.updateDuration(); // Set initial duration string
    this.updateExamDuration(); // Set initial exam duration
  }

  generateAiDescription() {
    if (!this.form.description || this.form.description.trim().length < 5) {
      this.errorMessage = 'Please provide a clearer short description for the AI to work with.';
      return;
    }

    this.isGeneratingAi = true;
    this.errorMessage = '';

    this.aiService.generateDescription(this.form.description).subscribe({
      next: (fullDesc) => {
        this.form.criteriaDescription = fullDesc;
        this.isGeneratingAi = false;
      },
      error: (err) => {
        console.error('AI Generation Error:', err);
        this.errorMessage = 'Failed to generate AI description. Please check your API key or network connection.';
        this.isGeneratingAi = false;
      }
    });
  }

  generateAiQuiz() {
    const context = this.form.criteriaDescription || this.form.description;
    if (!context || context.trim().length < 10) {
      this.errorMessage = 'Please provide a certification description first so the AI can generate relevant questions.';
      return;
    }

    this.isGeneratingQuiz = true;
    this.errorMessage = '';

    this.aiService.generateQuiz(context).subscribe({
      next: (jsonString) => {
        try {
          const questions = JSON.parse(jsonString);
          if (Array.isArray(questions)) {
            const validQuestions = this.filterUniqueQuestions(
              questions,
              this.form.quizQuestions,
              this.form.practiceQuizQuestions
            );
            this.form.quizQuestions = [...this.form.quizQuestions, ...validQuestions];
            const skipped = questions.length - validQuestions.length;
            this.successMessage = skipped > 0
              ? `✨ AI generated ${validQuestions.length} exam questions (${skipped} skipped as duplicates with practice/real sets).`
              : `✨ AI successfully generated ${validQuestions.length} questions for your exam!`;
            setTimeout(() => this.successMessage = '', 4000);
          }
        } catch (e) {
          console.error('Quiz Parsing Error:', e);
          this.errorMessage = 'Failed to parse the AI generated quiz. Please try again.';
        }
        this.isGeneratingQuiz = false;
      },
      error: (err) => {
        console.error('AI Quiz Error:', err);
        this.errorMessage = 'Failed to generate AI quiz. Please check your connection.';
        this.isGeneratingQuiz = false;
      }
    });
  }

  generateAiPracticeQuiz() {
    const context = this.form.criteriaDescription || this.form.description;
    if (!context || context.trim().length < 10) {
      this.errorMessage = 'Please provide a certification description first so the AI can generate relevant questions.';
      return;
    }

    this.isGeneratingQuiz = true;
    this.errorMessage = '';

    this.aiService.generateQuiz(context).subscribe({
      next: (jsonString) => {
        try {
          const questions = JSON.parse(jsonString);
          if (Array.isArray(questions)) {
            const validQuestions = this.filterUniqueQuestions(
              questions,
              this.form.practiceQuizQuestions,
              this.form.quizQuestions
            );
            this.form.practiceQuizQuestions = [...this.form.practiceQuizQuestions, ...validQuestions];
            const skipped = questions.length - validQuestions.length;
            this.successMessage = skipped > 0
              ? `✨ AI generated ${validQuestions.length} practice questions (${skipped} skipped as duplicates with exam/practice sets).`
              : `✨ AI successfully generated ${validQuestions.length} questions for practice mode!`;
            setTimeout(() => this.successMessage = '', 4000);
          }
        } catch (e) {
          console.error('Practice Quiz Parsing Error:', e);
          this.errorMessage = 'Failed to parse the AI generated practice quiz. Please try again.';
        }
        this.isGeneratingQuiz = false;
      },
      error: (err) => {
        console.error('AI Practice Quiz Error:', err);
        this.errorMessage = 'Failed to generate AI practice quiz. Please check your connection.';
        this.isGeneratingQuiz = false;
      }
    });
  }

  /** Validate Step 1 required fields before advancing */
  goNextStep1() {
    this.touched = true;
    if (!this.form.code.trim() || !this.form.name.trim() || !this.form.category) {
      return; // stop — errors will show via *ngIf
    }
    this.touched = false;
    if (this.isEditing) {
      this.currentStep = 4;
      this.isEditing = false;
    } else {
      this.currentStep++;
    }
  }

  /** Validate Step 3 required fields before advancing */
  goNextStep3() {
    this.touchedStep3 = true;
    if (!this.form.examTitle.trim()) {
      return; // stop — errors will show via *ngIf
    }
    this.touchedStep3 = false;
    if (this.isEditing) {
      this.currentStep = 4;
      this.isEditing = false;
    } else {
      this.currentStep++;
    }
  }

  nextStep() {
    if (this.isEditing) {
      this.currentStep = 4;
      this.isEditing = false;
    } else if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  editStep(batch: number) {
    this.isEditing = true;
    this.currentStep = batch;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  // ===== Tags / Suggestions Methods =====
  addTopic(v: string) {
    const val = v.trim();
    if (val && !this.selectedTopics.includes(val)) this.selectedTopics.push(val);
  }
  removeTopic(val: string) {
    this.selectedTopics = this.selectedTopics.filter(t => t !== val);
  }

  addSkill(v: string) {
    const val = v.trim();
    if (val && !this.selectedSkills.includes(val)) this.selectedSkills.push(val);
  }
  removeSkill(val: string) {
    this.selectedSkills = this.selectedSkills.filter(t => t !== val);
  }

  addPrereq(v: string) {
    const val = v.trim();
    if (val && !this.selectedPrereqs.includes(val)) this.selectedPrereqs.push(val);
  }
  removePrereq(val: string) {
    this.selectedPrereqs = this.selectedPrereqs.filter(t => t !== val);
  }

  /** Block non-numeric keypresses for number inputs */
  onlyNumbers(event: KeyboardEvent): boolean {
    const char = String.fromCharCode(event.which ?? event.keyCode);
    if (!/[0-9.]/.test(char)) {
      event.preventDefault(); return false;
    }
    return true;
  }

  updateDuration() {
    this.form.duration = `${this.durationValue} ${this.durationUnit}`;
  }

  updateExamDuration() {
    // Convert to minutes for storage if Hours is selected
    if (this.examDurationUnit === 'Hours') {
      this.form.examDurationMinutes = this.examDurationValue * 60;
    } else {
      this.form.examDurationMinutes = this.examDurationValue;
    }
  }

  // ===== PDF File Upload logic =====
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.processFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processFile(file);
    }
  }

  private processFile(file: File) {
    if (file && file.type === 'application/pdf') {
      this.form.examPdfName = file.name;
    } else if (file) {
      this.toast.warning('Please select a valid PDF file.');
    }
  }

  removeFile() {
    this.form.examPdfName = null;
  }

  // ===== Quiz Builder logic =====
  addQuizQuestion() {
    this.form.quizQuestions.push({
      questionText: '',
      options: ['', ''], // Minimum 2 options
      correctOptionIndex: 0
    });
  }

  removeQuizQuestion(index: number) {
    this.form.quizQuestions.splice(index, 1);
  }

  addQuizOption(qIndex: number) {
    this.form.quizQuestions[qIndex].options.push('');
  }

  removeQuizOption(qIndex: number, optIndex: number) {
    // Cannot delete if 2 or fewer options remain
    if (this.form.quizQuestions[qIndex].options.length <= 2) return;

    this.form.quizQuestions[qIndex].options.splice(optIndex, 1);

    // Fix correctOptionIndex if it exceeds bounds
    if (this.form.quizQuestions[qIndex].correctOptionIndex >= this.form.quizQuestions[qIndex].options.length) {
      this.form.quizQuestions[qIndex].correctOptionIndex = 0;
    }
  }

  addPracticeQuizQuestion() {
    this.form.practiceQuizQuestions.push({
      questionText: '',
      options: ['', ''],
      correctOptionIndex: 0
    });
  }

  removePracticeQuizQuestion(index: number) {
    this.form.practiceQuizQuestions.splice(index, 1);
  }

  addPracticeQuizOption(qIndex: number) {
    this.form.practiceQuizQuestions[qIndex].options.push('');
  }

  removePracticeQuizOption(qIndex: number, optIndex: number) {
    if (this.form.practiceQuizQuestions[qIndex].options.length <= 2) return;

    this.form.practiceQuizQuestions[qIndex].options.splice(optIndex, 1);
    if (this.form.practiceQuizQuestions[qIndex].correctOptionIndex >= this.form.practiceQuizQuestions[qIndex].options.length) {
      this.form.practiceQuizQuestions[qIndex].correctOptionIndex = 0;
    }
  }

  submit() {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.hasCrossModeDuplicates()) {
      this.errorMessage = 'Practice and real exam questions must be different. Please remove duplicate question text before publishing.';
      return;
    }

    const user = this.auth.getCurrentUser();
    if (!user?.id) {
      this.errorMessage = 'You must be logged in as a trainer to create a certification.';
      return;
    }

    this.isSubmitting = true;

    // Join arrays into strings using newlines (and commas for skills where appropriate)
    // The details page expects these formats based on the API JSON parsing.
    this.form.topics = this.selectedTopics.join('\n');
    this.form.skills = this.selectedSkills.join(',');
    this.form.prerequisites = this.selectedPrereqs.join('\n');

    // Build metadata JSON stored in criteriaDescription
    const metaJson = JSON.stringify({
      level: this.form.level,
      category: this.form.category,
      duration: this.form.duration,
      price: this.form.price,
      topics: this.form.topics,
      skills: this.form.skills,
      prerequisites: this.form.prerequisites,
      language: this.form.language,
      nextExamDate: this.form.nextExamDate || null,
      fullDescription: this.form.criteriaDescription,
      examPdfName: this.form.examPdfName,
      examDurationMinutes: this.form.examDurationMinutes,
      examQuestions: this.form.quizQuestions ? this.form.quizQuestions.length : 0,
      quizQuestions: this.form.quizQuestions,
      practiceQuestions: this.form.practiceQuizQuestions ? this.form.practiceQuizQuestions.length : 0,
      practiceQuizQuestions: this.form.practiceQuizQuestions
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
              isActive: this.form.examIsActive,
              questionsJson: JSON.stringify(this.form.quizQuestions)
            };

            console.log('[CreateCert] Sending Exam Payload:', examPayload);
            console.log('[CreateCert] Questions Count:', this.form.quizQuestions?.length);

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

  private normalizeQuestionText(text: string): string {
    return (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private filterUniqueQuestions(
    questions: any[],
    targetExisting: QuizQuestion[],
    otherModeExisting: QuizQuestion[]
  ): QuizQuestion[] {
    const existing = new Set<string>([
      ...targetExisting.map(q => this.normalizeQuestionText(q.questionText)),
      ...otherModeExisting.map(q => this.normalizeQuestionText(q.questionText))
    ]);

    return questions
      .filter(q => q.questionText && Array.isArray(q.options) && q.options.length >= 2)
      .filter((q: QuizQuestion) => {
        const key = this.normalizeQuestionText(q.questionText);
        if (!key || existing.has(key)) {
          return false;
        }
        existing.add(key);
        return true;
      });
  }

  private hasCrossModeDuplicates(): boolean {
    const real = new Set(this.form.quizQuestions.map(q => this.normalizeQuestionText(q.questionText)));
    return this.form.practiceQuizQuestions.some(q => real.has(this.normalizeQuestionText(q.questionText)));
  }
}
