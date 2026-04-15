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
};
