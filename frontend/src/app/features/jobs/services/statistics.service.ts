import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/api/api.config';

export interface RecentApplication {
  id: number;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  applyDate: string;
  status: string;
}

export interface DashboardStats {
  totalApplications: number;
  applicationGrowthPercent: number;
  totalInterviewed: number;
  interviewedGrowthPercent: number;
  totalHired: number;
  hiredGrowthPercent: number;
  totalRejected: number;
  rejectedGrowthPercent: number;
  totalPublishedJobs: number;
  totalCompanies: number;
  totalCandidates: number;
  monthlyApplications: number[];
  monthlyInterviews: number[];
  monthlyHired: number[];
  monthlyRejected: number[];
  applicationsByStatus: Record<string, number>;
  jobsByContractType: Record<string, number>;
  jobsByCountry: Record<string, number>;
  jobsByCategory: Record<string, number>;
  recentApplications: RecentApplication[];
}

@Injectable({ providedIn: 'root' })
export class JobStatisticsService {
  private http = inject(HttpClient);
  private url  = API_ENDPOINTS['statisticsDashboard'];

  getDashboard(): Observable<DashboardStats> {
    return this.http.get<any>(this.url).pipe(
      map(res => res?.data ?? res)
    );
  }
}
