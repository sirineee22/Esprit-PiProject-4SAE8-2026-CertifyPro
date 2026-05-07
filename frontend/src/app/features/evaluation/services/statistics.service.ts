import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { Stats } from '../../../shared/models/stats.model';

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    private http = inject(HttpClient);

    getTrainerStats(trainerId: number) {
        return this.http.get<Stats>(`${API_ENDPOINTS.stats}/trainer/${trainerId}`);
    }
}
