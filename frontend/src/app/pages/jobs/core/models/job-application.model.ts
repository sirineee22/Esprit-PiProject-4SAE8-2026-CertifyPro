// src/app/pages/jobs/core/models/job-application.model.ts

export interface JobApplication {
    id: string;
    jobOfferId: string;
    jobTitle: string;
    companyName: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    cvUrl?: string;
    coverLetter?: string;
    matchingScore: number;
    status: string;
    employerNote?: string;
    interviewDate?: string;
    appliedAt: string;
    updatedAt: string;
}

export interface ApplyJobRequest {
    candidatePhone?: string;
    cvUrl?: string;
    coverLetter?: string;
}

export interface UpdateApplicationStatusRequest {
    status: string;
    employerNote?: string;
    interviewDate?: string;
}

export const APPLICATION_STATUSES = ['PENDING', 'REVIEWED', 'INTERVIEW_SCHEDULED', 'ACCEPTED', 'REJECTED'];

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
    'PENDING': 'En attente',
    'REVIEWED': 'Examinée',
    'INTERVIEW_SCHEDULED': 'Entretien prévu',
    'ACCEPTED': 'Acceptée',
    'REJECTED': 'Refusée'
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
    'PENDING': 'warning',
    'REVIEWED': 'info',
    'INTERVIEW_SCHEDULED': 'primary',
    'ACCEPTED': 'success',
    'REJECTED': 'danger'
};
