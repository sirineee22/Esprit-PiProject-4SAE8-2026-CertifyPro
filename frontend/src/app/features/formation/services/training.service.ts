import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Training, Progression } from '../../../shared/models/formation.model';
import { PaginatedResponse } from '../../../shared/models/pagination.model';
import { API_ENDPOINTS, API_BASE_URL } from '../../../core/api/api.config';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { ProgressionService } from './progression.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FavoriteService } from './favorite.service';

@Injectable({
    providedIn: 'root'
})
export class TrainingService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private progressionService = inject(ProgressionService);
    private favoriteService = inject(FavoriteService);

    private trainingsSignal = signal<Training[]>([]);
    trainings = this.trainingsSignal.asReadonly();

    pagination = signal<{ totalElements: number; totalPages: number; currentPage: number }>({
        totalElements: 0,
        totalPages: 0,
        currentPage: 0
    });

    constructor() {
        this.loadTrainings();
    }

    async loadTrainings(page: number = 0, size: number = 6) {
        try {
            const response = await firstValueFrom(
                this.http.get<any>(API_ENDPOINTS.formations, {
                    params: { page: page.toString(), size: size.toString() }
                })
            );

            // Resilience: Handle both PaginatedResponse (Object with content) and legacy Array
            let data: Training[] = [];
            if (response && Array.isArray(response)) {
                data = response;
                this.pagination.set({
                    totalElements: data.length,
                    totalPages: 1,
                    currentPage: 0
                });
            } else if (response && response.content) {
                data = response.content;
                this.pagination.set({
                    totalElements: response.totalElements,
                    totalPages: response.totalPages,
                    currentPage: response.number
                });
            }

            // If logged in student, fetch their progressions and favorites
            const user = this.authService.getCurrentUser();

            let progressions: Progression[] = [];
            let favorites: Training[] = [];

            if (user?.id && (user.role?.name === 'STUDENT' || user.role?.name === 'LEARNER')) {
                try {
                    progressions = await firstValueFrom(this.progressionService.getUserProgressions(user.id));
                } catch (e) { console.error('Progression fetch failed', e); }

                try {
                    favorites = await this.favoriteService.loadFavorites(user.id);
                } catch (e) { console.error('Favorites fetch failed', e); }
            }

            const sanitizedData = data.map(t => {
                const prog = progressions.find(p => p.formation?.id === t.id);
                const isFav = favorites.some(f => f.id === t.id);
                return {
                    ...t,
                    contentUrl: t.contentUrl?.startsWith('/api') ? `${API_BASE_URL}${t.contentUrl}` : t.contentUrl,
                    progression: prog || { status: 'TO_DO' },
                    isFavorite: isFav
                };
            });
            this.trainingsSignal.set(sanitizedData);
        } catch (error) {
            console.error('Failed to load trainings', error);
            this.trainingsSignal.set([]); // Clear on error to stop spinner
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
