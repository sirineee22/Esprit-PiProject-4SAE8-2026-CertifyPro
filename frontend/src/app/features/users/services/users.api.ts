import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../../core/api/api.config';
import { User } from '../../../shared/models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = API_ENDPOINTS.users;

    constructor(private http: HttpClient) { }

    /** Upload profile image (file from PC). Returns updated user. */
    uploadProfileImage(userId: number, file: File): Observable<User> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<User>(`${this.apiUrl}/${userId}/profile-image`, formData);
    }

    getAll(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl);
    }

    getById(id: number): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${id}`);
    }

    getByIds(ids: number[]): Observable<User[]> {
        if (!ids?.length) return of([]);
        return this.http.get<User[]>(`${this.apiUrl}/batch`, {
            params: { ids: ids.join(',') },
        });
    }

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
}
