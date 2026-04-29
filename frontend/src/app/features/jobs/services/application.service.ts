import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { API_ENDPOINTS, API_BASE_URL } from '../../../core/api/api.config';
import {
  ApiResponse, PageResponse, JobApplication,
  ApplicationFilterRequest, CreateApplicationRequest,
  UpdateApplicationStatusRequest, ApplicationSummary, ApplicationStatus,
  ContractType,
} from '../models/job.models';

// ── Helper : mapper Spring Page ──────────────────────────
function mapSpringPage<T>(raw: any): PageResponse<T> {
  const content = (raw?.content ?? []) as T[];
  return {
    content,
    number: raw?.number ?? 0,
    page: raw?.number ?? 0,
    size: raw?.size ?? 10,
    totalElements: raw?.totalElements ?? 0,
    totalPages: raw?.totalPages ?? 0,
    first: raw?.first ?? false,
    last: raw?.last ?? false,
    empty: content.length === 0,
  };
}

// ── Helper : mapper candidature ─────────────────────────
function mapApplicationFromApi(raw: any): JobApplication {
  return {
    id: raw.id,
    applicationId: raw.applicationId ?? '',
    jobOffer: { id: raw.jobOfferId ?? 0, title: raw.jobTitle ?? 'Titre non défini' },
    candidateId: raw.candidateId ?? 0,
    candidateName: raw.candidateName ?? 'Anonyme',
    companyName: raw.companyName ?? 'Entreprise inconnue',
    status: (raw.status?.trim() as ApplicationStatus) || 'NEW',
    contractType: raw.contractType ?? 'FULL_TIME',
    applyDate: raw.applyDate ?? '',
    coverLetter: raw.coverLetter ?? '',
    resumeUrl: raw.resumeUrl ?? '',
    recruiterNotes: raw.recruiterNotes ?? '',
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? '',
  };
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);

  private adminBase      = API_ENDPOINTS['adminApplications']; // ex: /api/admin/applications
  private candidateApply = API_ENDPOINTS['candidateApply'];    // ex: /api/candidate/apply
  private candidateList  = API_ENDPOINTS['candidateApplications']; // ex: /api/candidate/applications
  private resumeUpload   = API_ENDPOINTS['filesUploadResume']; // ex: /api/files/upload/resume

  // ── Candidate : mes candidatures ──────────────────────────
  getMyApplications(page = 0, size = 10, status?: string): Observable<PageResponse<JobApplication>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);

    return this.http.get<any>(this.candidateList, { params }).pipe(
      map(res => {
        const springPage = res?.data ?? res;
        const content = (springPage?.content ?? []).map(mapApplicationFromApi);
        return { ...mapSpringPage<JobApplication>(springPage), content };
      })
    );
  }

  // ── Admin/Employer : toutes les candidatures ──────────────
  getAll(filter: ApplicationFilterRequest): Observable<PageResponse<JobApplication>> {
    let params = new HttpParams()
      .set('page', filter.page ?? 0)
      .set('size', filter.size ?? 12);

    if (filter.status)        params = params.set('status', filter.status);
    if (filter.keyword)       params = params.set('keyword', filter.keyword);
    if (filter.contractType)  params = params.set('contractType', filter.contractType);

    const url = filter.jobId
      ? `${this.adminBase}/job/${filter.jobId}` // CORRIGÉ : pas double 'applications'
      : `${this.adminBase}/search`;

    return this.http.get<ApiResponse<any>>(url, { params }).pipe(
      map(res => {
        const raw = res?.data ?? res;
        const mapped = mapSpringPage<any>(raw);
        return {
          ...mapped,
          content: (mapped.content ?? []).map(mapApplicationFromApi),
        } as PageResponse<JobApplication>;
      })
    );
  }

  // ── Postuler ──────────────────────────────────────────────
  apply(req: CreateApplicationRequest, resumeFile?: File) {
    const body: any = {
      jobOfferId: req.jobOfferId,
      coverLetter: req.coverLetter,
      contractType: req.contractType,
    };

    const postApply = (resumeUrl?: string) =>
      this.http.post<ApiResponse<any>>(this.candidateApply, {
        ...body,
        ...(resumeUrl ? { resumeUrl } : {})
      }).pipe(map(r => mapApplicationFromApi(r.data)));

    if (!resumeFile) return postApply();

    const fd = new FormData();
    fd.append('file', resumeFile);

    return this.http.post<ApiResponse<{ url: string }>>(this.resumeUpload, fd)
      .pipe(switchMap(res => postApply(res.data?.url ?? '')));
  }

  // ── Update statut (Admin uniquement) ───────────────────────
  updateStatus(id: number, req: UpdateApplicationStatusRequest) {
    return this.http.patch<ApiResponse<any>>(`${this.adminBase}/${id}/status`, req)
      .pipe(map(r => mapApplicationFromApi(r.data)));
  }

  // ── Supprimer candidature Learner ─────────────────────────
  deleteApplication(id: number) {
    return this.http.delete(`${this.candidateList}/${id}`);
  }

  // ── Supprimer candidature Admin (optionnel) ───────────────
  deleteAdminApplication(id: number) {
    return this.http.delete(`${this.adminBase}/${id}`);
  }

  // ── Téléchargement CV ─────────────────────────────────────
  downloadResume(app: JobApplication): void {
    if (!app.resumeUrl) return;

    const url = app.resumeUrl.startsWith('http')
      ? app.resumeUrl
      : `${API_BASE_URL}${app.resumeUrl.startsWith('/') ? '' : '/'}${app.resumeUrl}`;

    const safeName = (app.candidateName ?? 'candidate').replace(/\s+/g, '_');

    fetch(url, { mode: 'cors' })
      .then(res => {
        if (!res.ok) throw new Error('CV introuvable');
        return res.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${safeName}_cv.pdf`;
        link.click();
      })
      .catch(err => {
        console.error('Erreur téléchargement CV :', err);
        alert('Impossible de télécharger le CV.');
      });
  }

  // ── Stats par job ─────────────────────────────────────────
  getSummaryByJob(jobId: number): Observable<ApplicationSummary> {
    return of({
      total: 0, newCount: 0, pending: 0,
      approved: 0, rejected: 0, interview: 0,
      approvalRate: 0, rejectionRate: 0,
    });
  }
}