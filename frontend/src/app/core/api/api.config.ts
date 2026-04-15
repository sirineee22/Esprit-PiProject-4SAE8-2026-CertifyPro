<<<<<<< HEAD
export const API_BASE_URL = 'http://localhost:8081';

export const API_ENDPOINTS = {
  users: `${API_BASE_URL}/api/users`,
  auth: `${API_BASE_URL}/api/auth`,
  forum: {
    posts: `${API_BASE_URL}/api/forum/posts`,
    comments: `${API_BASE_URL}/api/forum/comments`
  },
  events: `${API_BASE_URL}/api/events`,
  adminEvents: `${API_BASE_URL}/api/admin/events`,
  audit: `${API_BASE_URL}/api/admin/audit`,
=======
// Pointing everything to the API Gateway (Port 8082)
export const GATEWAY_URL = 'http://localhost:8082';

export const USER_BASE_URL = GATEWAY_URL;
export const TRAINING_BASE_URL = GATEWAY_URL;
export const API_BASE_URL = GATEWAY_URL;

export const API_ENDPOINTS = {
  users: `${USER_BASE_URL}/api/users`,
  auth: `${USER_BASE_URL}/api/auth`,
  trainerRequests: `${USER_BASE_URL}/api/trainer-requests`,
  formations: `${TRAINING_BASE_URL}/api/formations`,
  evaluations: `${TRAINING_BASE_URL}/api/evaluations`,
  quizzes: `${TRAINING_BASE_URL}/api/quizzes`,
  progression: `${TRAINING_BASE_URL}/api/progression`,
  stats: `${TRAINING_BASE_URL}/api/stats`,
  favorites: `${TRAINING_BASE_URL}/api/favorites`,
>>>>>>> origin/Trainings-Evaluation
};
