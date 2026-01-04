// Environment configuration - loaded before app initialization
// This allows the frontend to work with any backend port
window.ENV = {
  // Backend URL can be set via environment variable or defaults to current origin
  BACKEND_URL: typeof __BACKEND_URL__ !== 'undefined' ? __BACKEND_URL__ : window.location.origin,
  API_BASE_URL: typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : window.location.origin,
};

// For development, you can override in browser console:
// window.ENV.BACKEND_URL = 'http://localhost:8000'
console.log('🔧 Environment loaded:', window.ENV);
