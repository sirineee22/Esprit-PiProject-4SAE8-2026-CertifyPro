// ✅ CORRIGÉ — api.config.ts
export const API_BASE_URL      = 'http://localhost:8080';  // gateway
export const JOBS_API_BASE_URL = API_BASE_URL;             // routé via gateway

export const API_ENDPOINTS = {
  users:       `${API_BASE_URL}/api/users`,
  auth:        `${API_BASE_URL}/api/auth`,
  events:      `${API_BASE_URL}/api/events`,
  adminEvents: `${API_BASE_URL}/api/admin/events`,

  categories:  `${JOBS_API_BASE_URL}/api/categories`,
  jobs:        `${JOBS_API_BASE_URL}/api/jobs`,
  companies:   `${JOBS_API_BASE_URL}/api/companies`,

  filesUploadResume: `${JOBS_API_BASE_URL}/api/files/upload/resume`,

  candidateApply:        `${JOBS_API_BASE_URL}/api/candidate/apply`,
  candidateApplications: `${JOBS_API_BASE_URL}/api/candidate/applications`,
  candidateSavedJobs:    `${JOBS_API_BASE_URL}/api/candidate/saved-jobs`,
  candidateProfile:      `${JOBS_API_BASE_URL}/api/candidate/profile`,

  employerJobs:     `${JOBS_API_BASE_URL}/api/employer/jobs`,
  employerMyOffers: `${JOBS_API_BASE_URL}/api/employer/jobs/my-offers`,

  statisticsDashboard:    `${JOBS_API_BASE_URL}/api/admin/statistics/dashboard`,
  adminApplications:      `${JOBS_API_BASE_URL}/api/admin/applications`,
  adminApplicationsSearch:`${JOBS_API_BASE_URL}/api/admin/applications/search`,
candidateMatching:       `${JOBS_API_BASE_URL}/api/candidate/matching/recommendations`,
candidateMatchScore:     `${JOBS_API_BASE_URL}/api/candidate/matching/score`,
candidateAlerts:         `${JOBS_API_BASE_URL}/api/candidate/alerts`,
candidateNotifications:  `${JOBS_API_BASE_URL}/api/candidate/notifications`,

} as const;
