// ─────────────────────────────────────────────────────────────
// job.models.ts — CORRIGÉ & ALIGNÉ BACKEND SPRING BOOT
// ─────────────────────────────────────────────────────────────

// ── ENUMS ────────────────────────────────────────────────────
export type ContractType =
  'FULL_TIME' | 'PART_TIME' | 'FREELANCE' | 'INTERNSHIP' | 'CONTRACT' | 'REMOTE';

export type JobStatus =
  'ACTIVE' | 'CLOSED' | 'DRAFT' | 'EXPIRED' | 'URGENT';

export type ApplicationStatus =
  'NEW' | 'PENDING' | 'REVIEWED' | 'INTERVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export type ExperienceLevel =
  'ENTRY_LEVEL' | 'ONE_TO_TWO_YEARS' | 'TWO_TO_FIVE_YEARS' |
  'FIVE_PLUS_YEARS' | 'SENIOR' | 'EXECUTIVE';

export type JobType = ContractType;

// ── GENERIC API ──────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ── COMPANY ─────────────────────────────────────────────────
export interface Company {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  industryType?: string;
  location?: string;
  country?: string;
  website?: string;
  contactEmail?: string;
  phone?: string;
  employeeMin?: number;
  employeeMax?: number;
  rating?: number;
  foundedIn?: string;
}

// ── CATEGORY ────────────────────────────────────────────────
export interface JobCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  positionCount: number;
}

// ── JOB ─────────────────────────────────────────────────────
export interface Job {
  id: number;
  title: string;
  position?: string;
  description: string;
  contractType: ContractType;
  experienceLevel?: ExperienceLevel;
  status: JobStatus;

  numberOfVacancy?: number;
  startSalary?: number;
  lastSalary?: number;

  country?: string;
  state?: string;
  location?: string;

  lastDateToApply?: string;
  closeDate?: string;
  postDate?: string;

  tags: string[];

  isUrgent: boolean;
  isRemote?: boolean;
  isPrivate?: boolean;
  isFeatured: boolean;

  applicationCount: number;

  company: Company;
  category?: JobCategory;

  createdAt?: string;
  updatedAt?: string;
    isSaved?: boolean;
  matchingScore?: number;
    expired:Boolean;

}

// ── JOB APPLICATION ─────────────────────────────────────────
export interface JobApplication {
  id: number;

  applicationId?: string;

  jobOffer?: {
    id: number;
    title?: string;
  };

  jobOfferId?: number;   // ✅ CORRECT (backend)

  candidateId?: number;
  candidateName?: string;

  companyName?: string;

  status: ApplicationStatus;

  contractType?: ContractType;

  applyDate?: string;
  coverLetter?: string;
  resumeUrl?: string;

  recruiterNotes?: string;
  createdAt?: string;
  updatedAt?: string;

  // ── Interview ─────────────────────────────────────────────
  interviewDate?: string;
  interviewLink?: string;
  interviewNotes?: string;
}

// ── STATISTICS ─────────────────────────────────────────────
export interface ApplicationSummary {
  total: number;
  newCount: number;
  pending: number;
  approved: number;
  rejected: number;
  interview: number;
  approvalRate: number;
  rejectionRate: number;
}

export interface MonthlyStatEntry {
  month: number;
  monthName: string;
  applicationsSent: number;
  interviews: number;
  hired: number;
  rejected: number;
}

export interface JobStatistics {
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

  monthlyStats: MonthlyStatEntry[];

  applicationsByStatus: Record<string, number>;
  jobsByType: Record<string, number>;
  jobsByCountry: Record<string, number>;
  jobsByCategory: Record<string, number>;
}

// ── REQUESTS ───────────────────────────────────────────────

// 🔴 Create Job (aligné backend CreateJobOfferRequest)
export interface CreateJobRequest {
  title: string;
  position?: string;
  description: string;

  contractType: ContractType;

  companyId?: number;
  categoryId?: number;

  experienceLevel?: ExperienceLevel;

  numberOfVacancy?: number;
  startSalary?: number;
  lastSalary?: number;

  country: string;
  state?: string;

  lastDateToApply?: string;
  closeDate?: string;

  isUrgent?: boolean;
  isFeatured?: boolean;

  tags?: string[];
}

// 🔴 APPLY JOB (FIX IMPORTANT)
export interface CreateApplicationRequest {
  jobOfferId: number;     // ✅ FIXED (was jobId ❌)
  coverLetter?: string;
  resumeUrl?: string;
  contractType?: ContractType;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  recruiterNote?: string;
  interviewDate?: string;
  interviewLink?: string;
}

export interface CreateCompanyRequest {
  name: string;
  industryType?: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  phone?: string;
  location?: string;
  country?: string;
  employeeMin?: number;
  employeeMax?: number;
  foundedIn?: string;
}

// ── FILTERS ────────────────────────────────────────────────
export interface JobFilterRequest {
  keyword?: string;
  contractType?: ContractType;
  categoryId?: number;
  companyId?: number;
  country?: string;

  salaryMin?: number;
  salaryMax?: number;

  isUrgent?: boolean;

  sortBy?: string;
  sortDir?: string;

  page?: number;
  size?: number;
    experienceLevel?: ExperienceLevel;

}

export interface ApplicationFilterRequest {
  keyword?: string;
  status?: ApplicationStatus;
  contractType?: ContractType;

  jobId?: number;
  companyId?: number;

  page?: number;
  size?: number;
}

// ── LABELS ────────────────────────────────────────────────
export const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Stage',
  CONTRACT: 'Contract',
  REMOTE: 'Remote',
};

export const EXP_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  ENTRY_LEVEL: 'Débutant',
  ONE_TO_TWO_YEARS: '1 - 2 ans',
  TWO_TO_FIVE_YEARS: '2 - 5 ans',
  FIVE_PLUS_YEARS: '5+ ans',
  SENIOR: 'Senior',
  EXECUTIVE: 'Cadre dirigeant',
};