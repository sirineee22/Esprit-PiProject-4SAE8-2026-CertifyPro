import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { Quiz, Question } from '../../../../shared/models/quiz.model';

@Component({
  selector: 'app-quiz-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-container">
      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="spinner"></div>
        <p>Chargement du quiz...</p>
      </div>

      <!-- Error State -->
      <div class="error-state animate-fade-in" *ngIf="error()">
        <i class="bi bi-exclamation-triangle"></i>
        <h2>Oups !</h2>
        <p>{{ error() }}</p>
        <button class="btn-done" (click)="finish()">Retour aux évaluations</button>
      </div>

      <!-- Quiz Player -->
      <div class="quiz-card animate-fade-in" *ngIf="quiz() && !isFinished() && !isLoading()">
        <ng-container *ngIf="quiz()?.questions?.length; else noQuestions">
          <header>
            <div class="progress-bar">
              <div class="progress" [style.width.%]="progress()"></div>
            </div>
            <div class="meta">
              <span class="step">Question {{ currentQuestionIndex() + 1 }} of {{ quiz()?.questions?.length }}</span>
              <h1>{{ quiz()?.title }}</h1>
            </div>
          </header>

          <main>
            <h2 class="question-text">{{ currentQuestion()?.content }}</h2>
            <div class="options-grid">
              <button 
                *ngFor="let option of currentQuestion()?.options" 
                class="option-btn"
                [class.selected]="selectedAnswers()[currentQuestion()!.id!] === option.id"
                (click)="selectOption(option.id!)">
                <span class="bullet">{{ getLetter(option.id!) }}</span>
                {{ option.text }}
              </button>
            </div>
          </main>

          <footer>
            <button class="btn-prev" [disabled]="currentQuestionIndex() === 0" (click)="prev()">Previous</button>
            <button class="btn-next" *ngIf="!isLastQuestion()" (click)="next()">Next</button>
            <button class="btn-submit" *ngIf="isLastQuestion()" (click)="submit()" [disabled]="!isAllAnswered()">Submit Quiz</button>
          </footer>
        </ng-container>
        <ng-template #noQuestions>
          <div class="empty-quiz">
            <i class="bi bi-folder-x"></i>
            <p>Ce quiz ne contient aucune question.</p>
            <button class="btn-done" (click)="finish()">Retour</button>
          </div>
        </ng-template>
      </div>

      <!-- Results -->
      <div class="result-card animate-slide-up" *ngIf="isFinished() && !isLoading()">
        <div class="icon-wrapper" [class.pass]="score() >= 50">
          <i [class]="score() >= 50 ? 'bi bi-award-fill' : 'bi bi-exclamation-circle-fill'"></i>
        </div>
        <h1>Quiz Completed!</h1>
        <div class="score-display">
          <span class="label">Your Score</span>
          <span class="value">{{ score() }}%</span>
        </div>
        <p class="feedback">{{ getFeedback() }}</p>
        <button class="btn-done" (click)="finish()">Back to Evaluations</button>
      </div>
    </div>
  `,
  styles: [`
    .quiz-container { padding: 3rem; background: #f1f5f9; min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; }
    .quiz-card, .result-card { background: white; width: 100%; max-width: 800px; border-radius: 1.5rem; padding: 2.5rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
    
    header { margin-bottom: 2.5rem; }
    .progress-bar { height: 6px; background: #e2e8f0; border-radius: 3px; margin-bottom: 1.5rem; overflow: hidden; }
    .progress { height: 100%; background: #3b82f6; transition: width 0.3s ease; }
    .meta { display: flex; flex-direction: column; gap: 0.5rem; }
    .step { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    h1 { margin: 0; color: #0f172a; font-weight: 800; }

    .question-text { font-size: 1.5rem; color: #1e293b; margin-bottom: 2rem; line-height: 1.4; }
    .options-grid { display: grid; gap: 1rem; }
    .option-btn {
      display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border: 2px solid #e2e8f0; border-radius: 1rem;
      font-size: 1.1rem; color: #475569; text-align: left; cursor: pointer; transition: all 0.2s;
    }
    .option-btn:hover { border-color: #cbd5e1; background: #f8fafc; }
    .option-btn.selected { border-color: #3b82f6; background: #eff6ff; color: #1e40af; }
    .bullet {
      width: 32px; height: 32px; background: #f1f5f9; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;
      font-weight: 700; color: #64748b; font-size: 0.9rem; transition: all 0.2s;
    }
    .selected .bullet { background: #3b82f6; color: white; }

    footer { margin-top: 3rem; display: flex; justify-content: space-between; gap: 1rem; }
    button { padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-prev { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
    .btn-next, .btn-submit { background: #0f172a; color: white; border: none; flex: 1; max-width: 200px; }
    .btn-submit { background: #16a34a; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .result-card { text-align: center; padding: 4rem; }
    .icon-wrapper { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; font-size: 2.5rem; }
    .icon-wrapper.pass { background: #dcfce7; color: #16a34a; }
    .icon-wrapper:not(.pass) { background: #fee2e2; color: #dc2626; }
    .score-display { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; }
    .score-display .label { text-transform: uppercase; color: #64748b; font-size: 0.9rem; font-weight: 700; }
    .score-display .value { font-size: 4rem; font-weight: 900; color: #0f172a; line-height: 1; }
    .feedback { color: #475569; font-size: 1.1rem; margin-bottom: 2rem; }
    .btn-done { background: #0f172a; color: white; border: none; padding: 1rem 2rem; width: 100%; border-radius: 0.75rem; }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .loading-state, .error-state, .empty-quiz { background: white; padding: 3rem; border-radius: 1.5rem; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); width: 100%; max-width: 500px; }
    .loading-state p, .error-state p { margin-top: 1rem; color: #64748b; font-weight: 600; }
    .error-state i { font-size: 3rem; color: #ef4444; }
    .empty-quiz i { font-size: 3rem; color: #94a3b8; }
    .spinner { border: 4px solid #e2e8f0; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class QuizPlayerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizService = inject(QuizService);

  quiz = signal<Quiz | null>(null);
  currentQuestionIndex = signal(0);
  selectedAnswers = signal<{ [key: number]: number }>({});
  isFinished = signal(false);
  score = signal(0);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    console.log('QuizPlayer initialized with ID:', id);
    if (id) {
      this.quizService.getQuizById(id).subscribe({
        next: (q) => {
          console.log('Quiz loaded:', q);
          if (!q) {
            this.error.set("Quiz introuvable.");
          } else {
            this.quiz.set(q);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load quiz:', err);
          const detail = err.status ? ` (Status: ${err.status} - ${err.statusText})` : ' (Erreur de connexion possible)';
          this.error.set("Impossible de charger le quiz." + detail);
          this.isLoading.set(false);
        }
      });
    } else {
      this.error.set("ID de quiz manquant.");
      this.isLoading.set(false);
    }
  }

  currentQuestion(): Question | undefined {
    return this.quiz()?.questions[this.currentQuestionIndex()];
  }

  progress(): number {
    if (!this.quiz()) return 0;
    return ((this.currentQuestionIndex() + 1) / this.quiz()!.questions.length) * 100;
  }

  selectOption(optionId: number) {
    const qId = this.currentQuestion()?.id;
    if (qId) {
      this.selectedAnswers.update(curr => ({ ...curr, [qId]: optionId }));
    }
  }

  next() {
    if (!this.isLastQuestion()) {
      this.currentQuestionIndex.update(i => i + 1);
    }
  }

  prev() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(i => i - 1);
    }
  }

  isLastQuestion(): boolean {
    return this.currentQuestionIndex() === (this.quiz()?.questions.length || 0) - 1;
  }

  isAllAnswered(): boolean {
    return Object.keys(this.selectedAnswers()).length === this.quiz()?.questions.length;
  }

  submit() {
    const quizId = this.quiz()?.id;
    if (quizId) {
      const answers = this.selectedAnswers();
      this.quizService.submitAttempt(quizId, answers).subscribe({
        next: (attempt) => {
          this.score.set(attempt.score);
          this.isFinished.set(true);
        },
        error: (err) => {
          console.error('Failed to submit attempt:', err);
          alert('Erreur lors de la soumission du quiz.');
        }
      });
    }
  }

  finish() {
    this.router.navigate(['/evaluations/my-evals']);
  }

  getLetter(id: number): string {
    const options = this.currentQuestion()?.options || [];
    const idx = options.findIndex(o => o.id === id);
    return String.fromCharCode(65 + idx); // A, B, C, D
  }

  getFeedback(): string {
    const s = this.score();
    if (s >= 80) return "Excellent work! You've mastered this topic.";
    if (s >= 50) return "Good job! You've passed the assessment.";
    return "Don't give up! Review the course material and try again.";
  }
}
