import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_ENDPOINTS } from '../api/api.config';
import { User } from '../../shared/models/user.model';

export interface LoginResponse {
  token?: string;
  user?: User;
  mfaRequired?: boolean;
  email?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
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

  // In-memory fallback for when localStorage is blocked (Edge tracking prevention)
  private _tokenMemory: string | null = null;

  constructor(private http: HttpClient) {
    try { this._tokenMemory = localStorage.getItem(this.tokenKey); } catch { }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_ENDPOINTS.auth}/login`, { email, password });
  }

  verify2fa(email: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_ENDPOINTS.auth}/verify-2fa`, { email, code });
  }

  /** Register with role: learner | employer */
  register(role: 'learner' | 'employer', body: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${API_ENDPOINTS.auth}/register/${role}`, body);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch { return null; }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    try {
      if (localStorage.getItem(this.loginKey) === 'true') return true;
      const raw = localStorage.getItem(this.userKey);
      if (raw) { const u = JSON.parse(raw) as User; return !!(u && u.id); }
    } catch { }
    return this.currentUserSubject.value !== null;
  }

  isEmployer(): boolean {
    return this.getCurrentUser()?.role?.name === 'EMPLOYER';
  }

  isCandidate(): boolean {
    const role = this.getCurrentUser()?.role?.name;
    return role === 'LEARNER' || role === 'USER';
  }

  getToken(): string | null {
    if (this._tokenMemory) return this._tokenMemory;
    try { return localStorage.getItem(this.tokenKey); } catch { return null; }
  }

  setSession(user: User, token?: string): void {
    if (token) this._tokenMemory = token;
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
      localStorage.setItem(this.loginKey, 'true');
      if (token) localStorage.setItem(this.tokenKey, token);
    } catch { }
    this.currentUserSubject.next(user);
  }

  clearSession(): void {
    this._tokenMemory = null;
    try {
      localStorage.removeItem(this.userKey);
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.loginKey);
    } catch { }
    this.currentUserSubject.next(null);
  }
}
