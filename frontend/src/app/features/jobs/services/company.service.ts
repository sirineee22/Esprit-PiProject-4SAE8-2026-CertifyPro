// ✅ CORRIGÉ — company.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/api/api.config';
import { ApiResponse, PageResponse, Company, CreateCompanyRequest } from '../models/job.models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private http = inject(HttpClient);
  private base = API_ENDPOINTS['companies'];

  getAll(keyword?: string, industryType?: string, page = 0, size = 16): Observable<PageResponse<Company>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword)      params = params.set('keyword', keyword);
    if (industryType) params = params.set('industryType', industryType);
    return this.http
      .get<ApiResponse<PageResponse<Company>>>(this.base, { params })
      .pipe(map(r => ({ ...r.data, page: r.data.number ?? 0 })));
  }

  getById(id: number): Observable<Company> {
    return this.http
      .get<ApiResponse<Company>>(`${this.base}/${id}`)
      .pipe(map(r => r.data));
  }

  create(req: CreateCompanyRequest): Observable<Company> {
    return this.http
      .post<ApiResponse<Company>>(this.base, req)
      .pipe(map(r => r.data));
  }

  update(id: number, req: Partial<CreateCompanyRequest>): Observable<Company> {
    return this.http
      .put<ApiResponse<Company>>(`${this.base}/${id}`, req)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadLogo(id: number, file: File): Observable<Company> {
    const fd = new FormData();
    fd.append('logo', file);
    return this.http
      .post<ApiResponse<Company>>(`${this.base}/${id}/logo`, fd)
      .pipe(map(r => r.data));
  }

  // ✅ FIX : getMyCompany n'existe pas côté backend
  // → Retourne null sans erreur, le composant gère l'absence
  getMyCompany(): Observable<Company | null> {
    return this.http
      .get<ApiResponse<Company>>(`${this.base}/my`)
      .pipe(
        map(r => r.data),
        catchError(() => of(null))
      );
  }
}