import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { AuthService } from '../../../core/auth/auth.service';
import {
  Event,
  CreateEventRequest,
  MyRegistration,
  EventStats,
  EventRegistration,
  EventInteractionType,
  EventFeedbackRequest,
  FeedbackSuggestionResponse
} from '../../../shared/models/event.model';
import { EventRefreshService } from './event-refresh.service';

export interface EventsPage {
  content: Event[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private readonly base = API_ENDPOINTS.events;
  private listCache = new Map<string, Observable<EventsPage>>();
  private myEventsCache: Observable<Event[]> | null = null;
  private myRegistrationsCache: Observable<MyRegistration[]> | null = null;
  private getByIdCache = new Map<number, Observable<Event>>();

  constructor(
    private http: HttpClient,
    private refresh: EventRefreshService,
    private auth: AuthService,
  ) {
    this.refresh.refreshed.subscribe(() => this.clearCache());
    this.auth.currentUser$.subscribe(() => this.clearCache());
  }

  private clearCache(): void {
    this.listCache.clear();
    this.myEventsCache = null;
    this.myRegistrationsCache = null;
    this.getByIdCache.clear();
  }

  list(params: { type?: string; mode?: string; upcomingOnly?: boolean; page?: number; size?: number } = {}): Observable<EventsPage> {
    const key = JSON.stringify(params);
    if (!this.listCache.has(key)) {
      let httpParams = new HttpParams();
      if (params.type) httpParams = httpParams.set('type', params.type);
      if (params.mode) httpParams = httpParams.set('mode', params.mode);
      if (params.upcomingOnly !== undefined) httpParams = httpParams.set('upcomingOnly', params.upcomingOnly);
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size);
      this.listCache.set(key, this.http.get<EventsPage>(this.base, { params: httpParams }).pipe(shareReplay(1)));
    }
    return this.listCache.get(key)!;
  }

  getById(id: number): Observable<Event> {
    if (!this.getByIdCache.has(id)) {
      this.getByIdCache.set(
        id,
        this.http.get<Event>(`${this.base}/${id}`).pipe(
          shareReplay(1),
          catchError((err) => {
            this.getByIdCache.delete(id);
            return throwError(() => err);
          })
        )
      );
    }
    return this.getByIdCache.get(id)!;
  }

  create(body: CreateEventRequest): Observable<Event> {
    return this.http.post<Event>(this.base, body).pipe(tap(() => this.refresh.triggerRefresh()));
  }

  update(id: number, body: CreateEventRequest): Observable<Event> {
    return this.http.put<Event>(`${this.base}/${id}`, body).pipe(tap(() => this.refresh.triggerRefresh()));
  }

  cancel(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/cancel`, {}).pipe(tap(() => this.refresh.triggerRefresh()));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(tap(() => this.refresh.triggerRefresh()));
  }

  myEvents(): Observable<Event[]> {
    if (!this.myEventsCache) {
      this.myEventsCache = this.http.get<Event[]>(`${this.base}/my`).pipe(
        shareReplay(1),
        catchError((err) => {
          this.myEventsCache = null;
          return throwError(() => err);
        })
      );
    }
    return this.myEventsCache;
  }

  register(eventId: number, user: { firstName: string; lastName: string }): Observable<unknown> {
    return this.http.post(`${this.base}/${eventId}/register`, {
      firstName: user.firstName,
      lastName: user.lastName
    }).pipe(tap(() => this.refresh.triggerRefresh()));
  }

  unregister(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${eventId}/register`).pipe(tap(() => this.refresh.triggerRefresh()));
  }

  myRegistrations(forceRefresh = false): Observable<MyRegistration[]> {
    if (forceRefresh) {
      this.myRegistrationsCache = null;
    }
    if (!this.myRegistrationsCache) {
      this.myRegistrationsCache = this.http.get<MyRegistration[]>(`${this.base}/my-registrations`).pipe(
        shareReplay(1),
        catchError((err) => {
          this.myRegistrationsCache = null;
          return throwError(() => err);
        })
      );
    }
    return this.myRegistrationsCache;
  }

  recommendations(userId: number, limit = 6): Observable<Event[]> {
    const params = new HttpParams().set('userId', userId).set('limit', limit);
    return this.http.get<Event[]>(`${this.base}/recommendations`, { params });
  }

  trackInteraction(eventId: number, type: EventInteractionType): Observable<unknown> {
    return this.http.post(`${this.base}/interactions`, { eventId, type });
  }

  submitFeedback(eventId: number, body: EventFeedbackRequest): Observable<FeedbackSuggestionResponse> {
    return this.http.post<FeedbackSuggestionResponse>(`${this.base}/${eventId}/feedback`, body);
  }

  getFeedbackSuggestion(eventId: number): Observable<FeedbackSuggestionResponse> {
    return this.http.get<FeedbackSuggestionResponse>(`${this.base}/${eventId}/feedback/suggestion`);
  }

  adminList(): Observable<Event[]> {
    return this.http.get<Event[]>(API_ENDPOINTS.adminEvents);
  }

  adminStats(): Observable<EventStats> {
    return this.http.get<EventStats>(`${API_ENDPOINTS.adminEvents}/stats`);
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.adminEvents}/${id}`);
  }

  // Registration Management (Admin/Trainer)
  getRegistrations(eventId: number): Observable<EventRegistration[]> {
    return this.http.get<EventRegistration[]>(`http://localhost:8080/api/events/management/${eventId}/registrations`);
  }

  approveRegistration(regId: number): Observable<void> {
    return this.http.put<void>(`http://localhost:8080/api/events/management/registrations/${regId}/approve`, {});
  }

  rejectRegistration(regId: number): Observable<void> {
    return this.http.put<void>(`http://localhost:8080/api/events/management/registrations/${regId}/reject`, {});
  }

  markAsAttended(regId: number): Observable<void> {
    return this.http.put<void>(`http://localhost:8080/api/events/management/registrations/${regId}/attend`, {});
  }
}
