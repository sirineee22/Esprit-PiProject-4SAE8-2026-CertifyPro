// ✅ CORRIGÉ — category.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { ApiResponse, JobCategory } from '../models/job.models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  // ✅ pointe vers /api/categories (corrigé depuis /api/jobs/categories)
  private base = API_ENDPOINTS['categories'];

  getAll(keyword?: string): Observable<JobCategory[]> {
    const url = keyword ? `${this.base}/search?keyword=${encodeURIComponent(keyword)}` : this.base;
    return this.http.get<ApiResponse<JobCategory[]>>(url).pipe(
      map(r => Array.isArray(r.data) ? r.data : [])
    );
  }

  getById(id: number): Observable<JobCategory> {
    return this.http
      .get<ApiResponse<JobCategory>>(`${this.base}/${id}`)
      .pipe(map(r => r.data));
  }

  // ✅ "icon" au lieu de "iconClass" — aligné sur JobCategory.java
  create(name: string, description?: string, icon?: string): Observable<JobCategory> {
    return this.http
      .post<ApiResponse<JobCategory>>(this.base, { name, description, icon })
      .pipe(map(r => r.data));
  }

  update(id: number, name: string, description?: string, icon?: string): Observable<JobCategory> {
    return this.http
      .put<ApiResponse<JobCategory>>(`${this.base}/${id}`, { name, description, icon })
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}