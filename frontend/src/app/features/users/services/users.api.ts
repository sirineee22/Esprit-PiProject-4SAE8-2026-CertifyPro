import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
<<<<<<< HEAD
import { Observable, of } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../../core/api/api.config';
import { User, UserProgress } from '../../../shared/models/user.model';

export interface AppNotification {
    id: number;
    userId: number;
    type: string;
    title: string;
    message: string;
    eventId?: number;
    read: boolean;
    createdAt: string;
}
=======
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { User } from '../../../shared/models/user.model';
>>>>>>> origin/Trainings-Evaluation

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = API_ENDPOINTS.users;

    constructor(private http: HttpClient) { }

<<<<<<< HEAD
    /** Upload profile image (file from PC). Returns updated user. */
    uploadProfileImage(userId: number, file: File): Observable<User> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<User>(`${this.apiUrl}/${userId}/profile-image`, formData);
    }

=======
>>>>>>> origin/Trainings-Evaluation
    getAll(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl);
    }

    getById(id: number): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${id}`);
    }

<<<<<<< HEAD
    getByIds(ids: number[]): Observable<User[]> {
        if (!ids?.length) return of([]);
        return this.http.get<User[]>(`${this.apiUrl}/batch`, {
            params: { ids: ids.join(',') },
        });
    }

    setup2fa(userId: number): Observable<{ secret: string, qrCodeUrl: string }> {
        return this.http.post<{ secret: string, qrCodeUrl: string }>(`${this.apiUrl}/${userId}/2fa/setup`, {});
    }

    enable2fa(userId: number, secret: string, code: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/${userId}/2fa/enable`, { secret, code });
    }

    disable2fa(userId: number): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/${userId}/2fa/disable`, {});
    }

=======
>>>>>>> origin/Trainings-Evaluation
    create(user: User): Observable<User> {
        return this.http.post<User>(this.apiUrl, user);
    }

    update(id: number, user: User): Observable<User> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.put<User>(url, user);
    }

    delete(id: number): Observable<void> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.delete<void>(url);
    }
<<<<<<< HEAD

    getMyNotifications(): Observable<AppNotification[]> {
        return this.http.get<AppNotification[]>(`${this.apiUrl}/notifications/my`);
    }

    markNotificationAsRead(notificationId: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/notifications/${notificationId}/read`, {});
    }

    getMyProgress(): Observable<UserProgress> {
        return this.http.get<UserProgress>(`${this.apiUrl}/progress/my`);
    }
=======
>>>>>>> origin/Trainings-Evaluation
}
