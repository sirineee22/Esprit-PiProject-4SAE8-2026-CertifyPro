import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/api/api.config';

export interface JobMatch {
  jobId: number;
  title: string;
  company: string;
  location: string;
  country: string;
  contractType: string;
  isRemote: boolean;
  isUrgent: boolean;
  tags: string[];
  matchScore: number;
  postDate: string;
}

export interface ScoreDetail {
  score: number;
  level: 'EXCELLENT' | 'BON' | 'MOYEN' | 'FAIBLE';
  skillsMatched: string[];
  candidateSkills: string[];
  jobTags: string[];
}

export interface JobAlert {
  id: number;
  keyword: string;
  contractType: string;
  location: string;
  active: boolean;
  createdAt: string;
}

export interface JobNotification {
  alertId: number;
  jobId: number;
  title: string;
  company: string;
  keyword: string;
  postDate: string;
}

@Injectable({ providedIn: 'root' })
export class MatchingService {
  private http = inject(HttpClient);

  getRecommendations(limit = 10): Observable<JobMatch[]> {
    return this.http.get<any>(
      `${API_ENDPOINTS['candidateMatching']}?limit=${limit}`
    ).pipe(map(r => r.data));
  }

  getScoreForJob(jobId: number): Observable<ScoreDetail> {
    return this.http.get<any>(
      `${API_ENDPOINTS['candidateMatchScore']}/${jobId}`
    ).pipe(map(r => r.data));
  }

  getAlerts(): Observable<JobAlert[]> {
    return this.http.get<any>(API_ENDPOINTS['candidateAlerts'])
      .pipe(map(r => r.data));
  }

  createAlert(keyword: string, contractType?: string, location?: string): Observable<JobAlert> {
    return this.http.post<any>(API_ENDPOINTS['candidateAlerts'], {
      keyword, contractType, location
    }).pipe(map(r => r.data));
  }

  deleteAlert(id: number): Observable<void> {
    return this.http.delete<any>(`${API_ENDPOINTS['candidateAlerts']}/${id}`)
      .pipe(map(() => void 0));
  }

  toggleAlert(id: number): Observable<void> {
    return this.http.patch<any>(
      `${API_ENDPOINTS['candidateAlerts']}/${id}/toggle`, {}
    ).pipe(map(() => void 0));
  }

  getNotifications(): Observable<JobNotification[]> {
    return this.http.get<any>(API_ENDPOINTS['candidateNotifications'])
      .pipe(map(r => r.data));
  }
}