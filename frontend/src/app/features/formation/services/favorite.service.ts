import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { Training } from '../../../shared/models/formation.model';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FavoriteService {
    private http = inject(HttpClient);

    private favoritesSignal = signal<Training[]>([]);
    favorites = this.favoritesSignal.asReadonly();

    async loadFavorites(userId: number) {
        try {
            const data = await firstValueFrom(this.http.get<Training[]>(`${API_ENDPOINTS.favorites}/user/${userId}`));
            this.favoritesSignal.set(data);
            return data;
        } catch (error) {
            console.error('Failed to load favorites', error);
            return [];
        }
    }

    toggleFavorite(userId: number, formationId: number) {
        return this.http.post(`${API_ENDPOINTS.favorites}/toggle`, { userId, formationId }).pipe(
            tap(() => {
                // We might want to reload or emit an event
            })
        );
    }

    checkFavorite(userId: number, formationId: number) {
        return this.http.get<boolean>(`${API_ENDPOINTS.favorites}/check`, {
            params: { userId: userId.toString(), formationId: formationId.toString() }
        });
    }
}
