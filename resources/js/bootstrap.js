import axios from 'axios';

if (!window.axios) {
    window.axios = axios;
}

const baseURL = import.meta.env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api';

window.axios.defaults.baseURL = baseURL;
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set Authorization token from localStorage if exists
const token = localStorage.getItem('auth_token');
if (token) {
    window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Add response interceptor to handle authentication errors
window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // If 401 Unauthorized, clear auth and redirect to login
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_type');

            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);