import { Component, OnDestroy, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_ENDPOINTS } from '../../../core/api/api.config';

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  [key: string]: any; // Allow indexing for fallback keys like ['question']
}

@Component({
  selector: 'app-exam-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quiz-container">
      <div class="loader" *ngIf="isLoading; else quizContent">
        <div class="loader-inner">
          <i class="bi bi-cpu-fill spinning"></i>
          <p>Preparing your exam questions...</p>
        </div>
      </div>

      <ng-template #quizContent>
        <div class="error-state" *ngIf="errorMessage">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <h2>Exam Unavailable</h2>
          <p>{{ errorMessage }}</p>
          <button class="btn-primary" (click)="goBack()">Return to Certification</button>
        </div>

        <ng-container *ngIf="!errorMessage && !examCompleted">
          <div class="quiz-header">
            <button class="btn-close" (click)="goBack()"><i class="bi bi-x-lg"></i> Exit</button>
            <h1>{{ examTitle }}</h1>
            <div class="exam-mode-chip" [class.practice]="isPracticeMode()">
              <i class="bi" [ngClass]="isPracticeMode() ? 'bi-lightbulb' : 'bi-award'"></i>
              {{ isPracticeMode() ? 'Practice Mode' : 'Real Exam' }}
            </div>
            <div class="timer-chip" *ngIf="isPracticeMode() && timeRemainingSeconds !== null">
              <i class="bi bi-clock-history"></i>
              {{ formatTime(timeRemainingSeconds) }}
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="((currentQuestionIndex + 1) / questions.length) * 100"></div>
            </div>
            <span class="progress-text">Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</span>
          </div>

          <div class="question-card" *ngIf="questions.length > 0">
            <h2 class="question-text">{{ questions[currentQuestionIndex].questionText || questions[currentQuestionIndex]['question'] }}</h2>
            
            <div class="options-container">
              <label class="option-row" 
                    *ngFor="let opt of questions[currentQuestionIndex].options; let i = index"
                    [class.selected]="selectedAnswers[currentQuestionIndex] === i"
                    [class.correct]="isPracticeMode() && selectedAnswers[currentQuestionIndex] !== undefined && i === questions[currentQuestionIndex].correctOptionIndex"
                    [class.incorrect]="isPracticeMode() && selectedAnswers[currentQuestionIndex] === i && i !== questions[currentQuestionIndex].correctOptionIndex"
                    (click)="selectOption(i)">
                <input type="radio" 
                      [name]="'q' + currentQuestionIndex" 
                      [value]="i" 
                      [(ngModel)]="selectedAnswers[currentQuestionIndex]"
                      style="display:none">
                <div class="option-bubble">{{ getLetter(i) }}</div>
                <span class="option-text">{{ opt }}</span>
              </label>
            </div>

            <div class="practice-feedback" *ngIf="isPracticeMode() && selectedAnswers[currentQuestionIndex] !== undefined">
              <p *ngIf="selectedAnswers[currentQuestionIndex] === questions[currentQuestionIndex].correctOptionIndex" class="ok">
                <i class="bi bi-check-circle-fill"></i> Correct answer.
              </p>
              <p *ngIf="selectedAnswers[currentQuestionIndex] !== questions[currentQuestionIndex].correctOptionIndex" class="ko">
                <i class="bi bi-exclamation-circle-fill"></i>
                Not correct. Right answer: <strong>{{ getLetter(questions[currentQuestionIndex].correctOptionIndex) }}</strong>
              </p>
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
              <i class="bi bi-flag-fill"></i> {{ isPracticeMode() ? 'Finish Practice' : 'Submit Exam' }}
            </button>
          </div>
        </ng-container>

        <div class="results-container" *ngIf="examCompleted">
          <div class="score-card" [class.passed]="passed" [class.failed]="!passed">
            <div class="score-circle">
              <span class="score-value">{{ finalScore | number:'1.0-0' }}%</span>
            </div>
            <h2 *ngIf="isPracticeMode()">Practice Completed</h2>
            <h2 *ngIf="!isPracticeMode() && passed">Congratulations! You Passed!</h2>
            <h2 *ngIf="!isPracticeMode() && !passed">Exam Failed. Please try again.</h2>
            
            <div class="score-details">
              <p *ngIf="!isPracticeMode()">Required Score: <strong>{{ requiredScore }}%</strong></p>
              <p>Correct Answers: <strong>{{ correctCount }} / {{ questions.length }}</strong></p>
              <p *ngIf="isPracticeMode()">This mode is for learning only and does not affect certification status.</p>
            </div>
            
            <button class="btn-primary" (click)="goBack()">Return to Certification</button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .quiz-container { min-height: 100vh; background: #f1f5f9; padding: 2rem 1rem; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; }
    .loader { display: flex; align-items: center; justify-content: center; min-height: 50vh; color: #3b82f6; text-align: center; }
    .loader-inner i { font-size: 3.5rem; margin-bottom: 1rem; display: block; }
    .loader-inner p { font-size: 1.2rem; font-weight: 500; color: #64748b; }
    .spinning { animation: spin 2s linear infinite; display: inline-block; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .error-state { background: white; padding: 3rem; border-radius: 16px; text-align: center; max-width: 500px; margin: 3rem auto; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .error-state i { font-size: 4rem; color: #ef4444; margin-bottom: 1rem; display: inline-block; }
    
    .quiz-header { width: 100%; max-width: 800px; margin: 0 auto 2rem; position: relative; }
    .btn-close { position: absolute; right: 0; top: 0; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 1rem; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: background 0.2s; font-weight: 600; z-index: 10; }
    .btn-close:hover { background: #f8fafc; color: #ef4444; }
    .quiz-header h1 { color: #1e293b; font-size: 1.5rem; margin-bottom: 1.5rem; padding-right: 120px; }
    .exam-mode-chip, .timer-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      margin: 0 0.6rem 0.75rem 0;
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
    }
    .exam-mode-chip.practice { background: #ffedd5; color: #b45309; }
    .timer-chip { background: #dbeafe; color: #1d4ed8; }
    
    .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
    .progress-fill { height: 100%; background: #3b82f6; transition: width 0.3s ease; }
    .progress-text { font-size: 0.85rem; color: #64748b; font-weight: 600; }

    .question-card { background: white; width: 100%; max-width: 800px; padding: 2.5rem; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); margin: 0 auto 2rem; }
    .question-text { font-size: 1.25rem; color: #0f172a; margin-bottom: 2rem; line-height: 1.5; font-weight: 600; }
    
    .options-container { display: flex; flex-direction: column; gap: 1rem; }
    .option-row { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; background: white; }
    .option-row:hover { border-color: #93c5fd; background: #f0f9ff; }
    .option-row.selected { border-color: #3b82f6; background: #eff6ff; }
    .option-row.selected .option-bubble { background: #3b82f6; color: white; border-color: #3b82f6; }
    .option-row.correct { border-color: #10b981; background: #f0fdf4; }
    .option-row.correct .option-bubble { border-color: #10b981; color: #065f46; }
    .option-row.incorrect { border-color: #ef4444; background: #fef2f2; }
    .option-row.incorrect .option-bubble { border-color: #ef4444; color: #991b1b; }
    
    .option-bubble { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #64748b; transition: all 0.2s; flex-shrink: 0; }
    .option-text { font-size: 1.05rem; color: #334155; }
    .practice-feedback { margin-top: 1rem; }
    .practice-feedback p { margin: 0; display: flex; align-items: center; gap: 0.45rem; font-weight: 600; }
    .practice-feedback .ok { color: #047857; }
    .practice-feedback .ko { color: #b91c1c; }

    .quiz-footer { width: 100%; max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin: 0 auto; }
    .btn-nav, .btn-primary, .btn-submit { padding: 0.85rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; border: none; font-size: 1rem; }
    .btn-nav { background: white; color: #475569; border: 1px solid #cbd5e1; }
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
export class ExamQuizComponent implements OnInit, OnDestroy {
  certId!: number;
  isLoading = true;
  errorMessage = '';
  examMode: 'practice' | 'real' = 'real';

  examTitle = 'Certification Exam';
  requiredScore = 0;
  durationMinutes = 0;
  timeRemainingSeconds: number | null = null;
  questions: QuizQuestion[] = [];

  // State
  currentQuestionIndex = 0;
  selectedAnswers: { [key: number]: number } = {};
  examCompleted = false;

  // Results
  passed = false;
  finalScore = 0;
  correctCount = 0;
  private timerRef: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngOnInit() {
    this.certId = Number(this.route.snapshot.paramMap.get('id'));
    const mode = this.route.snapshot.paramMap.get('mode');
    this.examMode = mode === 'practice' ? 'practice' : 'real';
    if (!this.certId) {
      this.errorMessage = 'Invalid Exam Context.';
      this.isLoading = false;
      return;
    }

    this.loadExamData();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  loadExamData() {
    console.log('[ExamQuiz] Fetching data for certId:', this.certId);

    this.http.get<any>(`${API_ENDPOINTS.certifications}/${this.certId}`).subscribe({
      next: (cert) => {
        this.examTitle = cert.name + (this.isPracticeMode() ? ' Practice' : ' Exam');
        if (this.isPracticeMode() && this.tryPracticeMetadataQuestions(cert)) {
          return;
        }
        const certCode = cert.code;
        console.log('[ExamQuiz] Step 1: Loaded cert', certCode);

        this.http.get<any[]>(`${API_ENDPOINTS.certificationExams}?certificationCode=${certCode}`).subscribe({
          next: (exams) => {
            console.log('[ExamQuiz] Step 2: Found exams list:', exams);
            const activeExam = (exams || []).find(e => e.isActive);

            if (activeExam) {
              console.log('[ExamQuiz] Active Exam found:', activeExam.id);
              if (activeExam.questionsJson) {
                try {
                  const parsed = JSON.parse(activeExam.questionsJson);
                  console.log('[ExamQuiz] Questions parsed successfully. First question:', parsed[0]);

                  this.zone.run(() => {
                    this.questions = parsed;
                    this.selectedAnswers = {}; // reset
                    this.requiredScore = activeExam.passingScore || cert.requiredScore || 70;
                    this.durationMinutes = activeExam.durationMinutes || 0;
                    if (this.isPracticeMode() && this.durationMinutes > 0) {
                      this.startTimer(this.durationMinutes);
                    }
                    this.isLoading = false;
                    this.errorMessage = '';
                    this.cdr.detectChanges();
                    console.log(`[ExamQuiz] UI State Updated. Questions: ${this.questions.length}, Loading: ${this.isLoading}`);
                  });
                } catch (e) {
                  console.error('[ExamQuiz] JSON Parse Error for DB questions:', e);
                  this.tryMetadataFallback(cert, 'DB Parse Error');
                }
              } else {
                console.warn('[ExamQuiz] Active Exam questonsJson is NULL/Empty');
                this.tryMetadataFallback(cert, 'DB field null');
              }
            } else {
              console.warn('[ExamQuiz] No active exam found in DB for', certCode);
              this.tryMetadataFallback(cert, 'No active record');
            }
          },
          error: (err) => {
            console.error('[ExamQuiz] DB Fetch Error:', err);
            this.tryMetadataFallback(cert, 'API Error');
          }
        });
      },
      error: (err) => {
        console.error('[ExamQuiz] Cert Load Error:', err);
        this.errorMessage = 'Could not load certification details.';
        this.isLoading = false;
      }
    });
  }

  private tryMetadataFallback(cert: any, reason: string) {
    console.log(`[ExamQuiz] FALLBACK Triggered (Reason: ${reason})`);
    try {
      const criteria = cert.criteriaDescription ? JSON.parse(cert.criteriaDescription) : {};
      const metaQuestions = this.isPracticeMode() ? criteria.practiceQuizQuestions : criteria.quizQuestions;

      this.zone.run(() => {
        if (Array.isArray(metaQuestions) && metaQuestions.length > 0) {
          this.questions = metaQuestions;
          this.selectedAnswers = {};
          this.requiredScore = this.isPracticeMode() ? 0 : (cert.requiredScore || 70);
          this.durationMinutes = criteria.examDurationMinutes || 0;
          if (this.isPracticeMode() && this.durationMinutes > 0) {
            this.startTimer(this.durationMinutes);
          }
          this.isLoading = false;
          this.errorMessage = '';
          this.cdr.detectChanges();
          console.log(`[ExamQuiz] Fallback SUCCESS: Loaded ${this.questions.length} questions.`);
        } else {
          console.error('[ExamQuiz] FALLBACK FAILED: Metadata empty.');
          this.errorMessage = 'No exam questions found for this certification.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } catch (e) {
      this.zone.run(() => {
        console.error('[ExamQuiz] FALLBACK FAILED: Meta JSON invalid.', e);
        this.errorMessage = 'Exam is not properly configured.';
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  getLetter(index: number): string {
    return String.fromCharCode(65 + index); // 0 -> A, 1 -> B, etc.
  }

  isPracticeMode(): boolean {
    return this.examMode === 'practice';
  }

  selectOption(index: number): void {
    this.selectedAnswers[this.currentQuestionIndex] = index;
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
    if (this.isPracticeMode()) {
      this.clearTimer();
    }
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

  private startTimer(minutes: number): void {
    this.clearTimer();
    this.timeRemainingSeconds = Math.max(0, minutes * 60);
    this.timerRef = setInterval(() => {
      if (this.timeRemainingSeconds === null) {
        return;
      }
      if (this.timeRemainingSeconds <= 1) {
        this.timeRemainingSeconds = 0;
        this.clearTimer();
        this.submitExam();
        return;
      }
      this.timeRemainingSeconds -= 1;
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  goBack() {
    this.router.navigate(['/certifications', this.certId]);
  }

  private tryPracticeMetadataQuestions(cert: any): boolean {
    try {
      const criteria = cert.criteriaDescription ? JSON.parse(cert.criteriaDescription) : {};
      const practiceQuestions = criteria.practiceQuizQuestions;
      if (!Array.isArray(practiceQuestions) || practiceQuestions.length === 0) {
        return false;
      }

      this.zone.run(() => {
        this.questions = practiceQuestions;
        this.selectedAnswers = {};
        this.requiredScore = 0;
        this.durationMinutes = criteria.examDurationMinutes || 0;
        if (this.durationMinutes > 0) {
          this.startTimer(this.durationMinutes);
        }
        this.isLoading = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
      });
      return true;
    } catch (e) {
      console.error('[ExamQuiz] Practice metadata parse failed.', e);
      return false;
    }
  }
}
