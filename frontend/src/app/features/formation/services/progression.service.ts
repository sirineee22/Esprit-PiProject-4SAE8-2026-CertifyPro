import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { Progression, ProgressStatus } from '../../../shared/models/formation.model';

@Injectable({
    providedIn: 'root'
})
export class ProgressionService {
    private http = inject(HttpClient);

    getProgression(formationId: number, userId: number) {
        return this.http.get<Progression>(`${API_ENDPOINTS.progression}/${formationId}/user/${userId}`);
    }

    updateStatus(formationId: number, userId: number, status: ProgressStatus) {
        return this.http.patch<Progression>(`${API_ENDPOINTS.progression}/${formationId}/status`, null, {
            params: { userId: userId.toString(), status }
        });
    }

    getUserProgressions(userId: number) {
        return this.http.get<Progression[]>(`${API_ENDPOINTS.progression}/user/${userId}`);
    }
}
