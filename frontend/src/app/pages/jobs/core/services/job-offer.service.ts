import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JobOffer, JobFilter, CreateJobOfferRequest } from '../models/job-offer.model';
import { ApiResponse, PageResponse, DashboardStats } from '../models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class JobOfferService {

    private apiUrl = 'http://localhost:8082/api';

    constructor(private http: HttpClient) { }

    // Public Search
    searchPublicJobs(filter: JobFilter, page: number = 0, size: number = 20): Observable<ApiResponse<PageResponse<JobOffer>>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (filter.keyword) params = params.set('keyword', filter.keyword);
        if (filter.location) params = params.set('location', filter.location);
        if (filter.contractType) params = params.set('contractType', filter.contractType);
        if (filter.experienceLevel) params = params.set('experienceLevel', filter.experienceLevel);
        if (filter.remote !== undefined) params = params.set('remote', filter.remote);
        if (filter.sector) params = params.set('sector', filter.sector);

        return this.http.get<ApiResponse<PageResponse<JobOffer>>>(`${this.apiUrl}/jobs/search`, { params });
    }

    getPublicOffer(id: string): Observable<ApiResponse<JobOffer>> {
        return this.http.get<ApiResponse<JobOffer>>(`${this.apiUrl}/jobs/public/${id}`);
    }

    // Employer - Manage own offers
    getEmployerOffers(): Observable<ApiResponse<JobOffer[]>> {
        return this.http.get<ApiResponse<JobOffer[]>>(`${this.apiUrl}/jobs/employer`);
    }

    getEmployerOffer(id: string): Observable<ApiResponse<JobOffer>> {
        return this.http.get<ApiResponse<JobOffer>>(`${this.apiUrl}/jobs/employer/${id}`);
    }

    createOffer(request: CreateJobOfferRequest): Observable<ApiResponse<JobOffer>> {
        return this.http.post<ApiResponse<JobOffer>>(`${this.apiUrl}/jobs/employer`, request);
    }

    updateOffer(id: string, request: CreateJobOfferRequest): Observable<ApiResponse<JobOffer>> {
        return this.http.put<ApiResponse<JobOffer>>(`${this.apiUrl}/jobs/employer/${id}`, request);
    }

    publishOffer(id: string): Observable<ApiResponse<JobOffer>> {
        return this.http.patch<ApiResponse<JobOffer>>(`${this.apiUrl}/jobs/employer/${id}/publish`, {});
    }

    closeOffer(id: string): Observable<ApiResponse<JobOffer>> {
        return this.http.patch<ApiResponse<JobOffer>>(`${this.apiUrl}/jobs/employer/${id}/close`, {});
    }

    deleteOffer(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/jobs/employer/${id}`);
    }

    // Admin
    getAdminStats(): Observable<ApiResponse<DashboardStats>> {
        return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/admin/jobs/stats`);
    }

    formatSalary(min?: number, max?: number): string {
        if (min && max) {
            return `${min.toLocaleString()} - ${max.toLocaleString()} TND`;
        } else if (min) {
            return `À partir de ${min.toLocaleString()} TND`;
        } else if (max) {
            return `Jusqu'à ${max.toLocaleString()} TND`;
        }
        return 'Non spécifié';
    }
}
