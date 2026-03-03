import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Quiz, QuizAttempt } from '../../../shared/models/quiz.model';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class QuizService {
    private http = inject(HttpClient);

    private quizzesSignal = signal<Quiz[]>([]);
    quizzes = this.quizzesSignal.asReadonly();

    private attemptsSignal = signal<QuizAttempt[]>([]);
    attempts = this.attemptsSignal.asReadonly();

    async loadQuizzes() {
        try {
            const data = await firstValueFrom(this.http.get<Quiz[]>(API_ENDPOINTS.quizzes));
            this.quizzesSignal.set(data);
        } catch (error) {
            console.error('Failed to load quizzes', error);
        }
    }

    async loadMyAttempts() {
        try {
            const data = await firstValueFrom(this.http.get<QuizAttempt[]>(`${API_ENDPOINTS.quizzes}/attempts/me`));
            this.attemptsSignal.set(data);
        } catch (error) {
            console.error('Failed to load my attempts', error);
        }
    }

    createQuiz(quiz: Quiz) {
        return this.http.post<Quiz>(API_ENDPOINTS.quizzes, quiz).pipe(
            tap(newQuiz => {
                this.quizzesSignal.update(current => [newQuiz, ...current]);
            })
        );
    }

    submitAttempt(quizId: number, answers: { [questionId: number]: number }) {
        return this.http.post<QuizAttempt>(`${API_ENDPOINTS.quizzes}/${quizId}/attempt`, answers);
    }

    getQuizById(id: number) {
        return this.http.get<Quiz>(`${API_ENDPOINTS.quizzes}/${id}`);
    }

    getQuizzesByFormation(formationId: number) {
        return this.http.get<Quiz[]>(`${API_ENDPOINTS.quizzes}/formation/${formationId}`);
    }

    deleteQuiz(id: number) {
        return this.http.delete(`${API_ENDPOINTS.quizzes}/${id}`).pipe(
            tap(() => {
                this.quizzesSignal.update(current => current.filter(q => q.id !== id));
            })
        );
    }
}
