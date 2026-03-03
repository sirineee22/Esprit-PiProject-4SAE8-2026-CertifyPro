import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/api/api.config';

export interface TrainerRequestDto {
  userId: number;
  subjects: string;
  message: string;
  experience?: string;
  certificatesLink?: string;
}

export interface TrainerRequest {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  subjects: string;
  message: string;
  experience?: string;
  certificatesLink?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
  rejectedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrainerRequestService {
  private readonly baseUrl = `${API_ENDPOINTS.users.replace('/users', '')}/trainer-requests`;

  constructor(private http: HttpClient) { }

  submitRequest(request: TrainerRequestDto): Observable<TrainerRequest> {
    return this.http.post<TrainerRequest>(this.baseUrl, request);
  }

  // Alias for consistency with other services
  create(request: TrainerRequestDto): Observable<TrainerRequest> {
    return this.submitRequest(request);
  }

  getMyRequests(userId: number): Observable<TrainerRequest[]> {
    return this.http.get<TrainerRequest[]>(`${this.baseUrl}/my-requests?userId=${userId}`);
  }

  getPendingRequests(): Observable<TrainerRequest[]> {
    return this.http.get<TrainerRequest[]>(this.baseUrl);
  }

  approveRequest(id: number): Observable<string> {
    return this.http.put(`${this.baseUrl}/${id}/approve`, {}, { responseType: 'text' });
  }

  rejectRequest(id: number): Observable<string> {
    return this.http.put(`${this.baseUrl}/${id}/reject`, {}, { responseType: 'text' });
  }
}
