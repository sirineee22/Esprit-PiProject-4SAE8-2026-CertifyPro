import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JobApplication, ApplyJobRequest, UpdateApplicationStatusRequest } from '../models/job-application.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class JobApplicationService {

    private apiUrl = 'http://localhost:8089/api/jobs';

    constructor(private http: HttpClient) { }

    // Candidate
    applyTopJob(jobOfferId: string, request: ApplyJobRequest): Observable<ApiResponse<JobApplication>> {
        return this.http.post<ApiResponse<JobApplication>>(`${this.apiUrl}/candidate/apply/${jobOfferId}`, request);
    }

    getMyApplications(): Observable<ApiResponse<JobApplication[]>> {
        return this.http.get<ApiResponse<JobApplication[]>>(`${this.apiUrl}/candidate/applications`);
    }

    withdrawApplication(applicationId: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/candidate/applications/${applicationId}`);
    }

    // Employer
    getApplicationsForOffer(offerId: string): Observable<ApiResponse<JobApplication[]>> {
        return this.http.get<ApiResponse<JobApplication[]>>(`${this.apiUrl}/employer/${offerId}/applications`);
    }

    getApplicationDetail(applicationId: string): Observable<ApiResponse<JobApplication>> {
        return this.http.get<ApiResponse<JobApplication>>(`${this.apiUrl}/employer/applications/${applicationId}`);
    }

    updateApplicationStatus(applicationId: string, request: UpdateApplicationStatusRequest): Observable<ApiResponse<JobApplication>> {
        return this.http.patch<ApiResponse<JobApplication>>(`${this.apiUrl}/employer/applications/${applicationId}/status`, request);
    }
}
