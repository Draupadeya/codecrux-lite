// API Configuration
export const API_CONFIG = {
  // Get backend URL from environment variable, fallback to localhost for development
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  
  // API endpoints
  endpoints: {
    login: '/monitor/api/login/',
    studymate: '/studymate/api',
    courses: '/courses/api',
    exams: '/studymate/exam',
  }
};

// Helper function to get full API URL
export const getApiUrl = (path: string): string => {
  return `${API_CONFIG.BACKEND_URL}${path}`;
};
