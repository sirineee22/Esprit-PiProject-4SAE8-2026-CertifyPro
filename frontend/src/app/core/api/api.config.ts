export const API_BASE_URL = 'http://localhost:8081';
export const JOBS_API_BASE_URL = API_BASE_URL;

export const API_ENDPOINTS = {
  users:       `${API_BASE_URL}/api/users`,
  auth:        `${API_BASE_URL}/api/auth`,
  certifications: `${API_BASE_URL}/api/certifications`,
  certificationExams: `${API_BASE_URL}/api/certification-exams`,
  payments:    `${API_BASE_URL}/api/payments`,
  trainerRequests: `${API_BASE_URL}/api/trainer-requests`,
  forum: {
    posts: `${API_BASE_URL}/api/forum/posts`,
    comments: `${API_BASE_URL}/api/forum/comments`
  },
  events:      `${API_BASE_URL}/api/events`,
  adminEvents: `${API_BASE_URL}/api/admin/events`,
  audit:       `${API_BASE_URL}/api/admin/audit`,

  // Training & Evaluation
  formations:  `${API_BASE_URL}/api/formations`,
  evaluations: `${API_BASE_URL}/api/evaluations`,
  quizzes:     `${API_BASE_URL}/api/quizzes`,
  progression: `${API_BASE_URL}/api/progression`,
  stats:       `${API_BASE_URL}/api/stats`,
  favorites:   `${API_BASE_URL}/api/favorites`,

  // Planned Sessions & Collaborations
  rooms:       `${API_BASE_URL}/api/rooms`,
  schedules:   `${API_BASE_URL}/api/schedules`,
  groups:      `${API_BASE_URL}/api/groups`,

  // Jobs module
  categories:  `${JOBS_API_BASE_URL}/api/categories`,
  jobs:        `${JOBS_API_BASE_URL}/api/jobs`,
  companies:   `${JOBS_API_BASE_URL}/api/companies`,

  filesUploadResume: `${JOBS_API_BASE_URL}/api/files/upload/resume`,

  candidateApply:           `${JOBS_API_BASE_URL}/api/candidate/apply`,
  candidateApplications:    `${JOBS_API_BASE_URL}/api/candidate/applications`,
  candidateSavedJobs:       `${JOBS_API_BASE_URL}/api/candidate/saved-jobs`,
  candidateProfile:         `${JOBS_API_BASE_URL}/api/candidate/profile`,
  candidateMatching:        `${JOBS_API_BASE_URL}/api/candidate/matching/recommendations`,
  candidateMatchScore:      `${JOBS_API_BASE_URL}/api/candidate/matching/score`,
  candidateAlerts:          `${JOBS_API_BASE_URL}/api/candidate/alerts`,
  candidateNotifications:   `${JOBS_API_BASE_URL}/api/candidate/notifications`,

  employerJobs:     `${JOBS_API_BASE_URL}/api/employer/jobs`,
  employerMyOffers: `${JOBS_API_BASE_URL}/api/employer/jobs/my-offers`,

  statisticsDashboard:     `${JOBS_API_BASE_URL}/api/admin/statistics/dashboard`,
  adminApplications:       `${JOBS_API_BASE_URL}/api/admin/applications`,
  adminApplicationsSearch: `${JOBS_API_BASE_URL}/api/admin/applications/search`,
};
