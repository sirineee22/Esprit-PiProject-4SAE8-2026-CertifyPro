// ─────────────────────────────────────────────
// job.service.ts — CLEAN & FIXED (NO ERRORS)
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../../core/api/api.config';
import {
  ApiResponse,
  PageResponse,
  Job,
  JobFilterRequest,
  CreateJobRequest,
  JobStatus
} from '../models/job.models';

@Injectable({ providedIn: 'root' })
export class JobService {

  private http = inject(HttpClient);

  private publicBase   = API_ENDPOINTS['jobs'];          // GET public
  private employerBase = API_ENDPOINTS['employerJobs'];  // CRUD employer

  // ─────────────────────────────────────────────
  // GET ALL JOBS (public)
  // ─────────────────────────────────────────────
  getAll(filter: JobFilterRequest = {}): Observable<PageResponse<Job>> {

    let params = new HttpParams();

    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<ApiResponse<PageResponse<Job>>>(this.publicBase, { params })
      .pipe(map(res => this.mapPage(res.data)));
  }

  // ─────────────────────────────────────────────
  // GET BY ID
  // ─────────────────────────────────────────────
  getById(id: number): Observable<Job> {
    return this.http
      .get<ApiResponse<Job>>(`${this.publicBase}/${id}`)
      .pipe(map(res => this.normalizeJob(res.data)));
  }

  // ─────────────────────────────────────────────
  // CREATE JOB
  // ─────────────────────────────────────────────
  create(req: CreateJobRequest): Observable<Job> {
    return this.http
      .post<ApiResponse<Job>>(this.employerBase, req)
      .pipe(map(res => this.normalizeJob(res.data)));
  }

  // ─────────────────────────────────────────────
  // UPDATE JOB
  // ─────────────────────────────────────────────
  update(id: number, req: Partial<CreateJobRequest>): Observable<Job> {
    return this.http
      .put<ApiResponse<Job>>(`${this.employerBase}/${id}`, req)
      .pipe(map(res => this.normalizeJob(res.data)));
  }

  // ─────────────────────────────────────────────
  // DELETE JOB
  // ─────────────────────────────────────────────
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.employerBase}/${id}`);
  }

  // ─────────────────────────────────────────────
  // CHANGE STATUS
  // ─────────────────────────────────────────────
  updateStatus(id: number, status: JobStatus): Observable<Job> {
    return this.update(id, { status } as any);
  }

  // ─────────────────────────────────────────────
  // SAVE / UNSAVE JOB
  // ─────────────────────────────────────────────
  saveJob(jobId: number): Observable<void> {
    return this.http.post<void>(`${API_ENDPOINTS['candidateSavedJobs']}/${jobId}`, {});
  }

  unsaveJob(jobId: number): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS['candidateSavedJobs']}/${jobId}`);
  }

  // ─────────────────────────────────────────────
  // NORMALIZE PAGE
  // ─────────────────────────────────────────────
  private mapPage(raw: PageResponse<Job>): PageResponse<Job> {
    return {
      ...raw,
      page: raw.number ?? 0,
      content: (raw.content || []).map(job => this.normalizeJob(job))
    };
  }

  // ─────────────────────────────────────────────
  // NORMALIZE JOB (IMPORTANT FIX)
  // ─────────────────────────────────────────────
  normalizeJob(job: Job): Job {
    // tags peut arriver comme string vide "" ou null depuis le backend
    let tags: string[] = [];
    if (Array.isArray(job.tags)) {
      tags = job.tags;
    } else if (typeof job.tags === 'string' && (job.tags as string).trim() !== '') {
      tags = [(job.tags as string)];
    }

    return {
      ...job,
      tags,
      isUrgent: job.isUrgent ?? false,
      isFeatured: job.isFeatured ?? false,
      isRemote: job.isRemote ?? false,
      isPrivate: job.isPrivate ?? false,
      applicationCount: job.applicationCount ?? 0,
      numberOfVacancy: job.numberOfVacancy ?? 0,
      startSalary: job.startSalary ?? undefined,
      lastSalary: job.lastSalary ?? undefined,
      company: job.company ?? { id: 0, name: 'Unknown' }
    };
  }
  getMyJobs(page = 0, size = 10): Observable<PageResponse<Job>> {
  const params = new HttpParams()
    .set('page', page)
    .set('size', size);

  return this.http
    .get<ApiResponse<PageResponse<Job>>>(this.employerBase, { params })
    .pipe(map(res => this.mapPage(res.data)));
}
}