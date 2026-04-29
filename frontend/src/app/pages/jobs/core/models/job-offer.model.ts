// src/app/pages/jobs/core/models/job-offer.model.ts

export interface JobOffer {
    id: string;
    employerId: string;
    employerName: string;
    title: string;
    description: string;
    location: string;
    contractType: string;
    experienceLevel: string;
    salaryMin?: number;
    salaryMax?: number;
    remote: boolean;
    requiredSkills: string[];
    sector: string;
    status: string;
    deadline?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateJobOfferRequest {
    title: string;
    description: string;
    location: string;
    contractType: string;
    experienceLevel: string;
    salaryMin?: number;
    salaryMax?: number;
    remote: boolean;
    requiredSkills: string[];
    sector: string;
    deadline?: string;
    status: string;
}

export interface JobFilter {
    keyword?: string;
    location?: string;
    contractType?: string;
    experienceLevel?: string;
    remote?: boolean;
    sector?: string;
}

export const CONTRACT_TYPES = ['CDI', 'CDD', 'FREELANCE', 'INTERNSHIP', 'APPRENTICESHIP'];
export const EXPERIENCE_LEVELS = ['JUNIOR', 'MID_LEVEL', 'SENIOR', 'EXPERT'];
export const SECTORS = ['IT', 'FINANCE', 'HEALTHCARE', 'EDUCATION', 'MARKETING'];

export const BADGE_COLORS: Record<string, string> = {
    'CDI': 'primary',
    'CDD': 'secondary',
    'FREELANCE': 'info',
    'INTERNSHIP': 'warning',
    'APPRENTICESHIP': 'success',
    'PUBLISHED': 'success',
    'DRAFT': 'secondary',
    'CLOSED': 'danger',
    'ARCHIVED': 'dark'
};
