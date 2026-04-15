import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationService } from '../../services/evaluation.service';
import { QuizService } from '../../services/quiz.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-evaluation-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="evaluation-container">
      <div class="header">
        <div class="header-left">
          <h1>{{ isMyEvaluations ? 'My Results' : 'Evaluations' }}</h1>
          <div class="tabs" *ngIf="!isMyEvaluations">
            <button [class.active]="activeTab() === 'evals'" (click)="activeTab.set('evals')">Internal Grades</button>
            <button [class.active]="activeTab() === 'quizzes'" (click)="activeTab.set('quizzes')">Interactive Quizzes</button>
          </div>
        </div>
        <div class="header-actions">
          <button *ngIf="(isTrainer || isAdmin) && activeTab() === 'evals'" class="btn-add" (click)="navigateToAdd()">
            <i class="bi bi-plus-lg"></i> New Grade
          </button>
          <button *ngIf="(isTrainer || isAdmin) && activeTab() === 'quizzes'" class="btn-add btn-purple" (click)="navigateToNewQuiz()">
            <i class="bi bi-lightning-fill"></i> Create Quiz
          </button>
        </div>
      </div>

      <!-- Evaluations List (Visible if activeTab is evals) -->
      <div *ngIf="activeTab() === 'evals'">
        <div class="evaluation-grid" *ngIf="evaluationService.evaluations().length > 0; else noEvalData">
          <div class="evaluation-card animate-fade-in" *ngFor="let eval of evaluationService.evaluations()">
            <div class="card-header">
              <span class="badge" [ngClass]="eval.type">{{ eval.type }}</span>
              <span class="score" [ngClass]="getScoreClass(eval.score)">{{ eval.score }}/100</span>
            </div>
            <div class="card-body">
              <h3>{{ eval.formation?.title || 'Unknown Training' }}</h3>
              <p *ngIf="!isMyEvaluations" class="student-name">Student: {{ eval.student?.firstName }} {{ eval.student?.lastName }}</p>
              <p class="remarks">{{ eval.remarks }}</p>
            </div>
            <div class="card-footer" *ngIf="isTrainer || isAdmin">
              <button class="btn-delete" (click)="deleteEvaluation(eval.id!)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quizzes List (Visible if activeTab is quizzes or if it's MyEvaluations) -->
      <div *ngIf="activeTab() === 'quizzes' || isMyEvaluations">
        <h2 class="section-title" *ngIf="isMyEvaluations && quizService.quizzes().length > 0">Available Quizzes</h2>
        <div class="evaluation-grid quizz-grid" *ngIf="quizService.quizzes().length > 0; else noQuizData">
          <div class="evaluation-card quizz-card animate-fade-in" *ngFor="let quiz of quizService.quizzes()">
            <div class="card-header">
              <span class="badge quiz-badge">QUIZ</span>
              <span class="questions-count">{{ quiz.questions.length }} Questions</span>
            </div>
            <div class="card-body">
              <h3>{{ quiz.title }}</h3>
              <p class="training-info"><i class="bi bi-journal-text"></i> {{ quiz.formation?.title }}</p>
              <p class="remarks line-clamp">{{ quiz.description }}</p>
            </div>
            <div class="card-footer">
              <button *ngIf="!isTrainer && !isAdmin" class="btn-play" (click)="playQuiz(quiz.id!)">
                <i class="bi bi-play-fill"></i> Start Quiz
              </button>
              <button *ngIf="isTrainer || isAdmin" class="btn-delete" (click)="deleteQuiz(quiz.id!)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noEvalData>
        <div class="empty-state">
          <i class="bi bi-clipboard-x"></i>
          <p>{{ isMyEvaluations ? "You don't have any grades yet." : "No internal grades found." }}</p>
        </div>
      </ng-template>

      <ng-template #noQuizData>
        <div class="empty-state">
          <i class="bi bi-lightning-charge"></i>
          <p>No interactive quizzes available.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .evaluation-container { padding: 2rem; background: #f8fafc; min-height: 100vh; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
    .header-left { display: flex; flex-direction: column; gap: 1rem; }
    h1 { color: #0f172a; font-weight: 800; margin: 0; }
    
    .tabs { display: flex; gap: 0.5rem; background: #e2e8f0; padding: 0.25rem; border-radius: 0.75rem; width: fit-content; }
    .tabs button { border: none; padding: 0.5rem 1rem; border-radius: 0.6rem; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: #64748b; font-size: 0.85rem; }
    .tabs button.active { background: white; color: #0f172a; shadow: 0 2px 4px rgba(0,0,0,0.05); }

    .btn-add { background: #0f172a; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
    .btn-add:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .btn-purple { background: #7c3aed; }

    .section-title { font-size: 1.25rem; color: #1e293b; margin: 2rem 0 1.5rem; font-weight: 700; }
    .evaluation-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .evaluation-card { background: white; border-radius: 1.25rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); transition: all 0.2s; border: 1px solid #f1f5f9; }
    .evaluation-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    
    .quizz-card { border-left: 4px solid #7c3aed; }
    .quiz-badge { background: #f5f3ff; color: #7c3aed; }
    .questions-count { font-size: 0.8rem; font-weight: 600; color: #94a3b8; }
    .training-info { font-size: 0.85rem; color: #3b82f6; font-weight: 600; margin: 0.5rem 0; display: flex; align-items: center; gap: 0.4rem; }
    .line-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .badge.QUIZ { background: #dcfce7; color: #166534; }
    .badge.QUESTION_ANSWER { background: #fef9c3; color: #854d0e; }
    .score { font-weight: 800; font-size: 1.1rem; }
    .score.good { color: #166534; }
    .score.average { color: #854d0e; }
    .score.bad { color: #991b1b; }
    h3 { margin: 0 0 0.5rem 0; color: #1e293b; font-size: 1.1rem; font-weight: 700; }
    .student-name { font-size: 0.875rem; color: #64748b; margin-bottom: 1rem; }
    .remarks { font-size: 0.95rem; color: #475569; font-style: italic; }
    
    .card-footer { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; }
    .btn-delete { background: #fee2e2; color: #ef4444; border: none; width: 36px; height: 36px; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
    .btn-delete:hover { background: #fecaca; }
    .btn-play { background: #7c3aed; color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 0.6rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .btn-play:hover { background: #6d28d9; }

    .empty-state { text-align: center; padding: 4rem; color: #94a3b8; }
    .empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EvaluationListComponent implements OnInit {
  evaluationService = inject(EvaluationService);
  quizService = inject(QuizService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isMyEvaluations = false;
  activeTab = signal<'evals' | 'quizzes'>('evals');

  ngOnInit() {
    this.route.url.subscribe(url => {
      this.isMyEvaluations = url.some(segment => segment.path === 'my-evals');
      if (this.isMyEvaluations) {
        this.evaluationService.loadMyEvaluations();
        this.quizService.loadQuizzes(); // Show available quizzes for students
      } else {
        this.evaluationService.loadEvaluations();
        this.quizService.loadQuizzes();
      }
    });
  }

  get isTrainer(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role?.name === 'TRAINER';
  }

  get isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role?.name === 'ADMIN';
  }

  navigateToAdd() {
    this.router.navigate(['/evaluations/new']);
  }

  navigateToNewQuiz() {
    this.router.navigate(['/evaluations/quizzes/new']);
  }

  playQuiz(id: number) {
    console.log('Navigating to quiz:', id);
    this.router.navigate(['/evaluations', 'quizzes', id, 'play']);
  }

  deleteEvaluation(id: number) {
    if (confirm('Are you sure you want to delete this evaluation?')) {
      this.evaluationService.deleteEvaluation(id).subscribe();
    }
  }

  deleteQuiz(id: number) {
    if (confirm('Are you sure you want to delete this quiz?')) {
      this.quizService.deleteQuiz(id).subscribe();
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'good';
    if (score >= 50) return 'average';
    return 'bad';
  }
}
