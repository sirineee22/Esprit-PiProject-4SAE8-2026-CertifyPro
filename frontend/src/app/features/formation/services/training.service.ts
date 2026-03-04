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

export interface PaginationInfo {
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

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

    pagination = signal<PaginationInfo>({ totalElements: 0, totalPages: 0, currentPage: 0 });

    constructor() {
        this.loadTrainings();
    }

    private sanitizeUrl(url: string | undefined): string | undefined {
        if (!url || url === '#') return url;
        // If it's a relative API path, prepend the Base URL
        if (url.startsWith('/api')) {
            return `${API_BASE_URL}${url}`;
        }
        // If it's an absolute URL but points to an old service port (8083 or 8084), redirect to Gateway (8082)
        if (url.includes('localhost:8083') || url.includes('localhost:8084')) {
            return url.replace(/localhost:8083|localhost:8084/i, 'localhost:8082');
        }
        return url;
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

            if (user?.id && (user.role?.name === 'STUDENT' || user.role?.name === 'LEARNER' || user.role?.name === 'TRAINER')) {
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
                    contentUrl: this.sanitizeUrl(t.contentUrl),
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

    async fetchTrainingById(id: number): Promise<Training | undefined> {
        try {
            const training = await firstValueFrom(this.http.get<Training>(`${API_ENDPOINTS.formations}/${id}`));
            if (training) {
                training.contentUrl = this.sanitizeUrl(training.contentUrl);
            }
            return training;
        } catch (error) {
            console.error('Failed to fetch training by id', error);
            return undefined;
        }
    }
}
