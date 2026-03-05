export const API_BASE_URL = 'http://localhost:8083';

export const API_ENDPOINTS = {
  users: `${API_BASE_URL}/api/users`,
  auth: `${API_BASE_URL}/api/auth`,
  forum: {
    posts: `${API_BASE_URL}/api/forum/posts`,
    comments: `${API_BASE_URL}/api/forum/comments`
  }
};
