import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// Simple Cache Layer
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request interceptor: Attach Token and Check Cache
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Only cache GET requests
  if (config.method === 'get' && !config.params?.refresh) {
    const cacheKey = config.url + JSON.stringify(config.params || {});
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_DURATION)) {

      config.adapter = () => Promise.resolve({
        data: cachedResponse.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      });
    }
  }

  return config;
});

// Response interceptor: Store in Cache or Invalidate
api.interceptors.response.use(
  (response) => {
    const { method, url } = response.config;

    if (method === 'get') {
      const cacheKey = url + JSON.stringify(response.config.params || {});
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    } else if (['post', 'put', 'delete', 'patch'].includes(method)) {
      // Invalidate cache on mutations

      cache.clear(); 
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or unauthorized. Redirecting to login...");
      if (window.location.pathname !== '/') {
        window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;

