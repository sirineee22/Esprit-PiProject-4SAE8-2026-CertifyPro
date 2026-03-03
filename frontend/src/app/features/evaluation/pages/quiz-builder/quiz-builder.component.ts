import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { TrainingService } from '../../../formation/services/training.service';
import { Training } from '../../../../shared/models/formation.model';

@Component({
  selector: 'app-quiz-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="builder-container">
      <div class="builder-card animate-slide-up">
        <header>
          <h1>Quiz Builder</h1>
          <p>Design a quiz to test your students' knowledge.</p>
        </header>

        <form [formGroup]="quizForm" (ngSubmit)="onSubmit()">
          <div class="main-info">
            <div class="field">
              <label>Quiz Title</label>
              <input type="text" formControlName="title" placeholder="e.g. Docker Fundamentals Quiz">
            </div>

            <div class="field">
              <label>Associated Training</label>
              <select formControlName="formationId">
                <option *ngFor="let t of trainings()" [value]="t.id">{{ t.title }}</option>
              </select>
            </div>

            <div class="field full-width">
              <label>Description</label>
              <textarea formControlName="description" rows="2" placeholder="Tell students what to expect..."></textarea>
            </div>
          </div>

          <div class="questions-section">
            <div class="section-header">
              <h2>Questions ({{ questions.length }})</h2>
              <button type="button" class="btn-secondary" (click)="addQuestion()">
                <i class="bi bi-plus-lg"></i> Add Question
              </button>
            </div>

            <div formArrayName="questions" class="questions-list">
              <div *ngFor="let q of questions.controls; let i = index" [formGroupName]="i" class="question-item animate-fade-in">
                <div class="question-top">
                  <span class="q-number">Q{{ i + 1 }}</span>
                  <input type="text" formControlName="content" placeholder="Type your question here...">
                  <button type="button" class="btn-remove" (click)="removeQuestion(i)" title="Remove Question">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>

                <div formArrayName="options" class="options-list">
                  <div *ngFor="let opt of getOptions(i).controls; let j = index" [formGroupName]="j" class="option-item">
                    <input type="radio" [name]="'correct-' + i" [checked]="opt.get('isCorrect')?.value" (change)="markCorrect(i, j)">
                    <input type="text" formControlName="text" placeholder="Option {{ j + 1 }}">
                    <button type="button" class="btn-mini-remove" (click)="removeOption(i, j)" *ngIf="getOptions(i).length > 2">
                      <i class="bi bi-dash"></i>
                    </button>
                  </div>
                  <button type="button" class="btn-add-option" (click)="addOption(i)" *ngIf="getOptions(i).length < 6">
                    <i class="bi bi-plus"></i> Add Option
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button type="button" class="btn-cancel" (click)="cancel()">Cancel</button>
            <button type="submit" class="btn-submit" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Publishing...' : 'Publish Quiz' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .builder-container { padding: 2rem; background: #f8fafc; min-height: 100vh; display: flex; justify-content: center; }
    .builder-card { background: white; width: 100%; max-width: 900px; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    
    header { margin-bottom: 2.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1.5rem; }
    h1 { margin: 0; color: #0f172a; font-weight: 800; }
    p { color: #64748b; margin: 0.5rem 0 0; }

    .main-info { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3rem; }
    .full-width { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    label { font-size: 0.875rem; font-weight: 600; color: #334155; }
    input, select, textarea { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; font-family: inherit; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

    .questions-section { margin-bottom: 3rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h2 { margin: 0; font-size: 1.25rem; color: #1e293b; }

    .questions-list { display: flex; flex-direction: column; gap: 2rem; }
    .question-item { padding: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 1rem; }
    .question-top { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
    .q-number { background: #0f172a; color: white; width: 40px; height: 40px; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .question-top input { flex: 1; font-weight: 600; font-size: 1.1rem; }
    
    .options-list { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding-left: 3.25rem; }
    .option-item { display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
    .option-item input[type="radio"] { width: 18px; height: 18px; cursor: pointer; }
    .option-item input[type="text"] { border: none; padding: 0.25rem; flex: 1; font-size: 0.95rem; }
    .option-item input[type="text"]:focus { box-shadow: none; }

    .btn-secondary { background: white; border: 1px solid #e2e8f0; color: #475569; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-remove { background: #fee2e2; color: #ef4444; border: none; width: 36px; height: 36px; border-radius: 0.5rem; cursor: pointer; }
    .btn-mini-remove { background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 0.25rem; }
    .btn-mini-remove:hover { color: #ef4444; }
    .btn-add-option { background: transparent; border: 1px dashed #cbd5e1; color: #64748b; border-radius: 0.5rem; padding: 0.5rem; cursor: pointer; font-size: 0.85rem; }
    .btn-add-option:hover { border-color: #3b82f6; color: #3b82f6; }

    .actions { display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 2rem; }
    .btn-cancel { background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 0.75rem; cursor: pointer; }
    .btn-submit { background: #0f172a; color: white; border: none; padding: 0.75rem 2.5rem; border-radius: 0.75rem; font-weight: 700; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    .animate-slide-up { animation: slideUp 0.5s ease-out; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class QuizBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private quizService = inject(QuizService);
  private trainingService = inject(TrainingService);
  private router = inject(Router);

  quizForm: FormGroup;
  trainings = signal<Training[]>([]);
  isSubmitting = signal(false);

  constructor() {
    this.quizForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      formationId: ['', [Validators.required]],
      questions: this.fb.array([])
    });
  }

  ngOnInit() {
    this.trainingService.loadTrainings().then(() => {
      this.trainings.set(this.trainingService.trainings());
    });
    this.addQuestion(); // Start with one question
  }

  get questions() {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptions(questionIndex: number) {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  addQuestion() {
    const questionForm = this.fb.group({
      content: ['', Validators.required],
      options: this.fb.array([
        this.createOption('Option 1', true),
        this.createOption('Option 2', false)
      ])
    });
    this.questions.push(questionForm);
  }

  createOption(text = '', isCorrect = false) {
    return this.fb.group({
      text: [text, Validators.required],
      isCorrect: [isCorrect]
    });
  }

  addOption(questionIndex: number) {
    this.getOptions(questionIndex).push(this.createOption(`Option ${this.getOptions(questionIndex).length + 1}`));
  }

  markCorrect(questionIndex: number, optionIndex: number) {
    const options = this.getOptions(questionIndex);
    options.controls.forEach((opt, idx) => {
      opt.get('isCorrect')?.setValue(idx === optionIndex);
    });
  }

  removeQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.getOptions(questionIndex).removeAt(optionIndex);
  }

  onSubmit() {
    if (this.quizForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.quizForm.value;
      const quiz: any = {
        title: formValue.title,
        description: formValue.description,
        formation: { id: formValue.formationId },
        questions: formValue.questions
      };

      console.log('Publishing quiz:', quiz);
      this.quizService.createQuiz(quiz).subscribe({
        next: (res) => {
          console.log('Quiz published successfully:', res);
          this.router.navigate(['/evaluations']);
        },
        error: (err) => {
          console.error('Failed to publish quiz:', err);
          alert('Erreur lors de la publication du quiz. Détails: ' + (err.error?.message || err.message));
          this.isSubmitting.set(false);
        }
      });
    } else {
      console.warn('Form is invalid:', this.quizForm.value);
      this.markFormGroupTouched(this.quizForm);
      alert('Veuillez remplir correctement tous les champs obligatoires (Titre, Formation, Questions et Options).');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }

  cancel() {
    this.router.navigate(['/evaluations']);
  }
}
