import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Evaluation } from '../../../shared/models/evaluation.model';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EvaluationService {
    private http = inject(HttpClient);

    private evaluationsSignal = signal<Evaluation[]>([]);
    evaluations = this.evaluationsSignal.asReadonly();

    constructor() {
        this.loadEvaluations();
    }

    async loadEvaluations() {
        try {
            const data = await firstValueFrom(this.http.get<Evaluation[]>(API_ENDPOINTS.evaluations));
            this.evaluationsSignal.set(data);
        } catch (error) {
            console.error('Failed to load evaluations', error);
        }
    }

    addEvaluation(evaluation: Evaluation) {
        return this.http.post<Evaluation>(API_ENDPOINTS.evaluations, evaluation).pipe(
            tap(newEval => {
                this.evaluationsSignal.update(current => [newEval, ...current]);
            })
        );
    }

    deleteEvaluation(id: number) {
        return this.http.delete(`${API_ENDPOINTS.evaluations}/${id}`).pipe(
            tap(() => {
                this.evaluationsSignal.update(current => current.filter(e => e.id !== id));
            })
        );
    }

    getEvaluationById(id: number) {
        return this.http.get<Evaluation>(`${API_ENDPOINTS.evaluations}/${id}`);
    }

    async loadMyEvaluations() {
        try {
            const data = await firstValueFrom(this.http.get<Evaluation[]>(`${API_ENDPOINTS.evaluations}/me`));
            this.evaluationsSignal.set(data);
        } catch (error) {
            console.error('Failed to load my evaluations', error);
        }
    }

    getMyEvaluations() {
        return this.http.get<Evaluation[]>(`${API_ENDPOINTS.evaluations}/me`);
    }

    getEvaluationsByStudent(studentId: number) {
        return this.http.get<Evaluation[]>(`${API_ENDPOINTS.evaluations}/student/${studentId}`);
    }

    getEvaluationsByFormation(formationId: number) {
        return this.http.get<Evaluation[]>(`${API_ENDPOINTS.evaluations}/formation/${formationId}`);
    }

    generateAiFeedback(score: number, formationTitle: string, shortKeywords: string) {
        return this.http.post<{ generatedFeedback: string }>(`${API_ENDPOINTS.evaluations}/ai-feedback`, {
            score,
            formationTitle,
            shortKeywords
        });
    }
}
