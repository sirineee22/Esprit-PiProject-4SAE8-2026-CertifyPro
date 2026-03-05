import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/api/api.config';

export interface SessionRequest {
    topic: string;
    startTime: string; // ISO string: "2026-03-05T10:00:00"
    endTime: string;
    trainer: { id: number };
    room: { id: number };
    courseId?: number;
}

export interface SessionSchedule extends SessionRequest {
    id: number;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

@Injectable({ providedIn: 'root' })
export class SessionService {
    private url = API_ENDPOINTS.schedules;

    constructor(private http: HttpClient) { }

    createSession(session: SessionRequest): Observable<SessionSchedule> {
        return this.http.post<SessionSchedule>(this.url, session);
    }

    getSessionsByTrainer(trainerId: number): Observable<SessionSchedule[]> {
        return this.http.get<SessionSchedule[]>(`${this.url}/trainer/${trainerId}`);
    }

    getAllSessions(): Observable<SessionSchedule[]> {
        return this.http.get<SessionSchedule[]>(this.url);
    }
}
