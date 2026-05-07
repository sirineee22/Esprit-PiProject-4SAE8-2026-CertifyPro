export const API_BASE_URL = 'http://localhost:8081';

export const API_ENDPOINTS = {
  users: `${API_BASE_URL}/api/users`,
  auth: `${API_BASE_URL}/api/auth`,
  trainerRequests: `${API_BASE_URL}/api/trainer-requests`,
  forum: {
    posts: `${API_BASE_URL}/api/forum/posts`,
    comments: `${API_BASE_URL}/api/forum/comments`
  },
  events: `${API_BASE_URL}/api/events`,
  adminEvents: `${API_BASE_URL}/api/admin/events`,
  audit: `${API_BASE_URL}/api/admin/audit`,
  
  // Training & Evaluation Service Endpoints
  formations: `${API_BASE_URL}/api/formations`,
  evaluations: `${API_BASE_URL}/api/evaluations`,
  quizzes: `${API_BASE_URL}/api/quizzes`,
  progression: `${API_BASE_URL}/api/progression`,
  stats: `${API_BASE_URL}/api/stats`,
  favorites: `${API_BASE_URL}/api/favorites`,
  
  // Planned Sessions & Collaborations
  rooms: `${API_BASE_URL}/api/rooms`,
  schedules: `${API_BASE_URL}/api/schedules`,
  groups: `${API_BASE_URL}/api/groups`,
};
