import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_ENDPOINTS } from '../../../core/api/api.config';

interface QuizQuestion {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
}

@Component({
    selector: 'app-exam-quiz',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="quiz-container">
      <div class="loader" *ngIf="isLoading">
        <i class="bi bi-arrow-repeat spinning"></i> Loading Exam...
      </div>

      <div class="error-state" *ngIf="errorMessage && !isLoading">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <h2>Exam Unavailable</h2>
        <p>{{ errorMessage }}</p>
        <button class="btn-primary" (click)="goBack()">Return to Certification</button>
      </div>

      <ng-container *ngIf="!isLoading && !errorMessage && !examCompleted">
        <div class="quiz-header">
          <button class="btn-close" (click)="goBack()"><i class="bi bi-x-lg"></i> Exit</button>
          <h1>{{ examTitle }}</h1>
          <div class="progress-bar">
            <!-- Basic progress bar -->
            <div class="progress-fill" [style.width.%]="(currentQuestionIndex / questions.length) * 100"></div>
          </div>
          <span class="progress-text">Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</span>
        </div>

        <div class="question-card" *ngIf="questions.length > 0">
          <h2 class="question-text">{{ questions[currentQuestionIndex].questionText }}</h2>
          
          <div class="options-container">
            <label class="option-row" 
                   *ngFor="let opt of questions[currentQuestionIndex].options; let i = index"
                   [class.selected]="selectedAnswers[currentQuestionIndex] === i">
              <input type="radio" 
                     [name]="'q' + currentQuestionIndex" 
                     [value]="i" 
                     [(ngModel)]="selectedAnswers[currentQuestionIndex]"
                     style="display:none">
              <div class="option-bubble">{{ getLetter(i) }}</div>
              <span class="option-text">{{ opt }}</span>
            </label>
          </div>
        </div>

        <div class="quiz-footer">
          <button class="btn-nav" 
                  [disabled]="currentQuestionIndex === 0" 
                  (click)="prevQuestion()">
            <i class="bi bi-arrow-left"></i> Previous
          </button>
          
          <button class="btn-primary" 
                  *ngIf="currentQuestionIndex < questions.length - 1"
                  [disabled]="selectedAnswers[currentQuestionIndex] === undefined"
                  (click)="nextQuestion()">
            Next <i class="bi bi-arrow-right"></i>
          </button>
          
          <button class="btn-submit" 
                  *ngIf="currentQuestionIndex === questions.length - 1"
                  [disabled]="selectedAnswers[currentQuestionIndex] === undefined"
                  (click)="submitExam()">
            <i class="bi bi-flag-fill"></i> Submit Exam
          </button>
        </div>
      </ng-container>

      <div class="results-container" *ngIf="examCompleted">
        <div class="score-card" [class.passed]="passed" [class.failed]="!passed">
          <div class="score-circle">
            <span class="score-value">{{ finalScore | number:'1.0-1' }}%</span>
          </div>
          <h2 *ngIf="passed">Congratulations! You Passed!</h2>
          <h2 *ngIf="!passed">Exam Failed. Please try again.</h2>
          
          <div class="score-details">
            <p>Required Score: <strong>{{ requiredScore }}%</strong></p>
            <p>Correct Answers: <strong>{{ correctCount }} / {{ questions.length }}</strong></p>
          </div>
          
          <button class="btn-primary" (click)="goBack()">Return to Certification</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .quiz-container { min-height: 100vh; background: #f1f5f9; padding: 2rem 1rem; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; }
    .loader { text-align: center; font-size: 1.5rem; color: #3b82f6; margin-top: 5rem; }
    .spinning { animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .error-state { background: white; padding: 3rem; border-radius: 16px; text-align: center; max-width: 500px; margin-top: 5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .error-state i { font-size: 4rem; color: #ef4444; margin-bottom: 1rem; display: inline-block; }
    
    .quiz-header { width: 100%; max-width: 800px; margin-bottom: 2rem; position: relative; }
    .btn-close { position: absolute; right: 0; top: 0; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 1rem; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: background 0.2s; font-weight: 600; }
    .btn-close:hover { background: #f8fafc; color: #ef4444; }
    .quiz-header h1 { color: #1e293b; font-size: 1.5rem; margin-bottom: 1.5rem; padding-right: 100px; }
    
    .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
    .progress-fill { height: 100%; background: #3b82f6; transition: width 0.3s ease; }
    .progress-text { font-size: 0.85rem; color: #64748b; font-weight: 600; }

    .question-card { background: white; width: 100%; max-width: 800px; padding: 2.5rem; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); margin-bottom: 2rem; }
    .question-text { font-size: 1.25rem; color: #0f172a; margin-bottom: 2rem; line-height: 1.5; font-weight: 600; }
    
    .options-container { display: flex; flex-direction: column; gap: 1rem; }
    .option-row { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; background: white; }
    .option-row:hover { border-color: #93c5fd; background: #f0f9ff; }
    .option-row.selected { border-color: #3b82f6; background: #eff6ff; }
    .option-row.selected .option-bubble { background: #3b82f6; color: white; border-color: #3b82f6; }
    
    .option-bubble { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #64748b; transition: all 0.2s; flex-shrink: 0; }
    .option-text { font-size: 1.05rem; color: #334155; }

    .quiz-footer { width: 100%; max-width: 800px; display: flex; justify-content: space-between; align-items: center; }
    .btn-nav, .btn-primary, .btn-submit { padding: 0.85rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; border: none; font-size: 1rem; }
    .btn-nav { background: white; color: #475569; border: 1px solid #cbd5e1; }
    .btn-nav:hover:not(:disabled) { background: #f8fafc; }
    .btn-nav:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-primary { background: #3b82f6; color: white; box-shadow: 0 4px 10px rgba(59,130,246,0.25); }
    .btn-primary:hover:not(:disabled) { background: #2563eb; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(59,130,246,0.35); }
    .btn-primary:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; transform: none; }
    
    .btn-submit { background: #10b981; color: white; box-shadow: 0 4px 10px rgba(16,185,129,0.25); }
    .btn-submit:hover:not(:disabled) { background: #059669; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(16,185,129,0.35); }
    .btn-submit:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; transform: none; }

    /* Results */
    .results-container { width: 100%; display: flex; justify-content: center; align-items: center; min-height: 60vh; }
    .score-card { background: white; padding: 3rem; border-radius: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.08); max-width: 400px; width: 100%; }
    .score-circle { width: 150px; height: 150px; border-radius: 50%; border: 10px solid #cbd5e1; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; }
    .score-value { font-size: 2.5rem; font-weight: 800; color: #1e293b; }
    .passed .score-circle { border-color: #10b981; }
    .passed h2 { color: #059669; }
    .failed .score-circle { border-color: #ef4444; }
    .failed h2 { color: #dc2626; }
    
    .score-details { margin: 1.5rem 0 2rem; padding: 1rem; background: #f8fafc; border-radius: 12px; }
    .score-details p { margin: 0.5rem 0; color: #475569; }
    .score-details strong { color: #1e293b; }

    @media (max-width: 600px) {
      .question-card, .quiz-header, .quiz-footer { max-width: 100%; padding: 1.5rem; }
      .quiz-header h1 { padding-right: 0; margin-top: 3rem; }
      .btn-close { top: 0; left: 0; right: auto; width: 100%; justify-content: center; }
    }
  `]
})
export class ExamQuizComponent implements OnInit {
    certId!: number;
    isLoading = true;
    errorMessage = '';

    examTitle = 'Certification Exam';
    requiredScore = 0;
    questions: QuizQuestion[] = [];

    // State
    currentQuestionIndex = 0;
    selectedAnswers: { [key: number]: number } = {};
    examCompleted = false;

    // Results
    passed = false;
    finalScore = 0;
    correctCount = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient
    ) { }

    ngOnInit() {
        this.certId = Number(this.route.snapshot.paramMap.get('id'));
        if (!this.certId) {
            this.errorMessage = 'Invalid Exam Context.';
            this.isLoading = false;
            return;
        }

        this.loadExamData();
    }

    loadExamData() {
        this.http.get<any>(`${API_ENDPOINTS.certifications}/${this.certId}`).subscribe({
            next: (data: any) => {
                try {
                    const c = data.criteriaDescription ? JSON.parse(data.criteriaDescription) : {};
                    this.examTitle = data.name + ' Exam';
                    this.requiredScore = data.requiredScore || 70;

                    if (c.quizQuestions && Array.isArray(c.quizQuestions) && c.quizQuestions.length > 0) {
                        this.questions = c.quizQuestions;
                        this.isLoading = false;
                    } else {
                        this.errorMessage = 'No quiz questions have been configured for this certification yet.';
                        this.isLoading = false;
                    }
                } catch (e) {
                    this.errorMessage = 'Failed to parse exam configuration.';
                    this.isLoading = false;
                }
            },
            error: () => {
                this.errorMessage = 'Exam not found or server error.';
                this.isLoading = false;
            }
        });
    }

    getLetter(index: number): string {
        return String.fromCharCode(65 + index); // 0 -> A, 1 -> B, etc.
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        }
    }

    submitExam() {
        // Calculate Score
        this.correctCount = 0;
        this.questions.forEach((q, idx) => {
            if (this.selectedAnswers[idx] === q.correctOptionIndex) {
                this.correctCount++;
            }
        });

        this.finalScore = (this.correctCount / this.questions.length) * 100;
        this.passed = this.finalScore >= this.requiredScore;

        this.examCompleted = true;

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    goBack() {
        this.router.navigate(['/certifications', this.certId]);
    }
}
