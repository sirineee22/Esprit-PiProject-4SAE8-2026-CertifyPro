import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_ENDPOINTS } from '../api/api.config';
import { User } from '../../shared/models/user.model';

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userKey = 'currentUser';
  private readonly tokenKey = 'authToken';
  private readonly loginKey = 'isLoggedIn';
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_ENDPOINTS.auth}/login`, { email, password });
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(this.loginKey) === 'true';
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setSession(user: User, token?: string): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    localStorage.setItem(this.loginKey, 'true');
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }
    this.currentUserSubject.next(user);
  }

  clearSession(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.loginKey);
    this.currentUserSubject.next(null);
  }
}
