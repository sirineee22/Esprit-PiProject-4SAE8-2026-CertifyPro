import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Training, Progression } from '../../../shared/models/formation.model';
import { API_ENDPOINTS, API_BASE_URL } from '../../../core/api/api.config';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { ProgressionService } from './progression.service';
import { AuthService } from '../../../core/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class TrainingService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private progressionService = inject(ProgressionService);

    private trainingsSignal = signal<Training[]>([]);
    trainings = this.trainingsSignal.asReadonly();

    constructor() {
        this.loadTrainings();
    }

    async loadTrainings() {
        try {
            const data = await firstValueFrom(this.http.get<Training[]>(API_ENDPOINTS.formations));

            // If logged in student, fetch their progressions
            const user = this.authService.getCurrentUser();

            let progressions: Progression[] = [];
            if (user?.id && (user.role?.name === 'STUDENT' || user.role?.name === 'LEARNER')) {
                progressions = await firstValueFrom(this.progressionService.getUserProgressions(user.id));
            }

            const sanitizedData = data.map(t => {
                const prog = progressions.find(p => p.formation?.id === t.id);
                return {
                    ...t,
                    contentUrl: t.contentUrl?.startsWith('/api') ? `${API_BASE_URL}${t.contentUrl}` : t.contentUrl,
                    progression: prog || { status: 'TO_DO' }
                };
            });
            this.trainingsSignal.set(sanitizedData);
        } catch (error) {
            console.error('Failed to load trainings', error);
        }
    }

    addTraining(training: Training, file: File) {
        const formData = new FormData();
        formData.append('title', training.title);
        formData.append('description', training.description);
        formData.append('level', training.level);
        formData.append('duration', training.duration);
        formData.append('trainingType', training.trainingType);
        formData.append('file', file);

        const user = this.authService.getCurrentUser();
        if (user?.id) {
            formData.append('trainerId', user.id.toString());
        }

        return this.http.post<Training>(API_ENDPOINTS.formations, formData).pipe(
            tap(newTraining => {
                // Fix relative URL for immediate display
                if (newTraining.contentUrl?.startsWith('/api')) {
                    newTraining.contentUrl = `${API_BASE_URL}${newTraining.contentUrl}`;
                }
                this.trainingsSignal.update(current => [newTraining, ...current]);
            })
        );
    }

    deleteTraining(id: number) {
        return this.http.delete(`${API_ENDPOINTS.formations}/${id}`).pipe(
            tap(() => {
                this.trainingsSignal.update(current => current.filter(t => t.id !== id));
            })
        );
    }

    fetchTrainingById(id: number) {
        return this.http.get<Training>(`${API_ENDPOINTS.formations}/${id}`);
    }

    updateTraining(id: number, training: Training, file?: File) {
        const formData = new FormData();
        formData.append('title', training.title);
        formData.append('description', training.description);
        formData.append('level', training.level);
        formData.append('duration', training.duration);
        formData.append('trainingType', training.trainingType);
        if (file) {
            formData.append('file', file);
        }

        const user = this.authService.getCurrentUser();
        if (user?.id) {
            formData.append('trainerId', user.id.toString());
        }

        return this.http.post<Training>(`${API_ENDPOINTS.formations}/${id}/update`, formData).pipe(
            tap(updatedTraining => {
                if (updatedTraining.contentUrl?.startsWith('/api')) {
                    updatedTraining.contentUrl = `${API_BASE_URL}${updatedTraining.contentUrl}`;
                }
                this.trainingsSignal.update(current =>
                    current.map(t => t.id === id ? updatedTraining : t)
                );
            })
        );
    }

    getTrainingById(id: number): Training | undefined {
        return this.trainingsSignal().find(t => t.id === id);
    }
}
