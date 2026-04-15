import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EvaluationService } from '../../services/evaluation.service';
import { TrainingService } from '../../../formation/services/training.service';
import { UserService } from '../../../users/services/users.api';
import { User } from '../../../../shared/models/user.model';
import { Training } from '../../../../shared/models/formation.model';
import { EvaluationType } from '../../../../shared/models/evaluation.model';

@Component({
    selector: 'app-evaluation-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="form-container">
      <div class="form-card animate-slide-up">
        <header>
          <h1>New Evaluation</h1>
          <p>Assign a score and remarks to a student's performance.</p>
        </header>

        <form [formGroup]="evalForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="field">
              <label>Evaluation Type</label>
              <select formControlName="type">
                <option value="QUIZ">Quiz</option>
                <option value="QUESTION_ANSWER">Question & Answer</option>
              </select>
            </div>

            <div class="field">
              <label>Score (0-100)</label>
              <input type="number" formControlName="score" min="0" max="100">
            </div>

            <div class="field">
              <label>Student</label>
              <select formControlName="studentId">
                <option *ngFor="let student of students()" [value]="student.id">
                  {{ student.firstName }} {{ student.lastName }} ({{ student.email }})
                </option>
              </select>
            </div>

            <div class="field">
              <label>Training / Course</label>
              <select formControlName="formationId">
                <option *ngFor="let training of trainings()" [value]="training.id">
                  {{ training.title }}
                </option>
              </select>
            </div>

            <div class="field full-width">
              <label style="display: flex; justify-content: space-between; align-items: center;">
                <span>Remarks / Keywords</span>
                <button type="button" class="btn-ai" (click)="generateFeedback()" [disabled]="isGeneratingAi() || !evalForm.get('formationId')?.value">
                  ✨ {{ isGeneratingAi() ? 'AI thinking...' : 'Generate with AI' }}
                </button>
              </label>
              <textarea formControlName="remarks" rows="5" placeholder="Enter bullet points or short keywords, then click Generate with AI..."></textarea>
            </div>
          </div>

          <div class="actions">
            <button type="button" class="btn-cancel" (click)="onCancel()">Cancel</button>
            <button type="submit" class="btn-submit" [disabled]="evalForm.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Saving...' : 'Create Evaluation' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .form-container {
      padding: 2rem;
      background: #f1f5f9;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .form-card {
      background: white;
      padding: 2.5rem;
      border-radius: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 700px;
    }
    header { margin-bottom: 2rem; }
    h1 { color: #0f172a; margin: 0; font-weight: 800; }
    p { color: #64748b; margin: 0.5rem 0 0 0; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .full-width { grid-column: span 2; }

    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    label { font-size: 0.875rem; font-weight: 600; color: #334155; }
    input, select, textarea {
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-family: inherit;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .actions {
      margin-top: 2rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
    .btn-cancel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
    }
    .btn-submit {
      background: #0f172a;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-ai {
      background: linear-gradient(135deg, #8b5cf6, #d946ef);
      color: white;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 0.4rem;
      font-size: 0.75rem;
      font-weight: bold;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-ai:hover { opacity: 0.9; }
    .btn-ai:disabled { opacity: 0.5; cursor: not-allowed; animation: pulse 1.5s infinite; }

    .animate-slide-up { animation: slideUp 0.5s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
  `]
})
export class EvaluationFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private evalService = inject(EvaluationService);
    private trainingService = inject(TrainingService);
    private userService = inject(UserService);

    evalForm: FormGroup;
    isSubmitting = signal(false);
    isGeneratingAi = signal(false);
    students = signal<User[]>([]);
    trainings = signal<Training[]>([]);

    constructor() {
        this.evalForm = this.fb.group({
            type: [EvaluationType.QUIZ, Validators.required],
            score: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
            studentId: ['', Validators.required],
            formationId: ['', Validators.required],
            remarks: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.userService.getAll().subscribe(users => {
            // Filter for roles that are likely students (id 2 or 3 usually in this project)
            // For now, list all users to be sure
            this.students.set(users);
        });

        this.trainingService.loadTrainings().then(() => {
            this.trainings.set(this.trainingService.trainings());
        });
    }

    onSubmit() {
        if (this.evalForm.valid) {
            this.isSubmitting.set(true);
            const formValue = this.evalForm.value;

            const evaluation: any = {
                type: formValue.type,
                score: formValue.score,
                remarks: formValue.remarks,
                student: { id: formValue.studentId },
                formation: { id: formValue.formationId }
            };

            this.evalService.addEvaluation(evaluation).subscribe({
                next: () => {
                    this.router.navigate(['/evaluations']);
                },
                error: (err) => {
                    console.error(err);
                    this.isSubmitting.set(false);
                }
            });
        }
    }

    onCancel() {
        this.router.navigate(['/evaluations']);
    }

    generateFeedback() {
        const score = this.evalForm.get('score')?.value || 0;
        const formationId = this.evalForm.get('formationId')?.value;
        const currentRemarks = this.evalForm.get('remarks')?.value || '';
        
        if (!formationId) return;

        const formation = this.trainings().find(t => t.id == formationId);
        const title = formation ? formation.title : 'Formation';

        this.isGeneratingAi.set(true);
        this.evalService.generateAiFeedback(score, title, currentRemarks).subscribe({
            next: (res) => {
                this.evalForm.patchValue({ remarks: res.generatedFeedback });
                this.isGeneratingAi.set(false);
            },
            error: (err) => {
                console.error('AI Generation failed', err);
                this.isGeneratingAi.set(false);
                alert("L'IA n'a pas pu générer le feedback.");
            }
        });
    }
}
