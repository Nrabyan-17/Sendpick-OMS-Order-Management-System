// File untuk melakukan konfigurasi Axios
import axios from 'axios';

// Untuk development, pakai base URL local:
const localBaseUrl = 'http://127.0.0.1:8000/api';

// Untuk production, pakai base URL production:
const productionBaseUrl = 'https://sendpick.isslab.web.id/api';

// Buat instance axios dengan base URL yang sesuai
const api = axios.create({
    baseURL: import.meta.env?.VITE_API_BASE_URL ?? localBaseUrl,
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

// Interceptor untuk menambahkan token autentikasi pada setiap request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ Token berhasil ditambahkan ke header:', token.substring(0, 20) + '...')
        }
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error)
    }
);

// Interceptor untuk menangani response error & Token Expired
api.interceptors.response.use(
    (response) => {
        console.log('✅ Response Success:', response.status);
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        console.error('❌ Response Error:', { status, message });

        // Jika status response adalah 401, maka hapus token autentikasi dari localStorage, karena tokennya expired.
        if (status === 401) {
            console.error('🔐 Token expired atau invalid');
            localStorage.removeItem('authToken');
            window.location.href = '/login'; // Redirect to login page
        }

        // Handle 403 Forbidden
        if (status === 403) {
            console.error('🚫 Forbidden - Anda tidak memiliki akses');
        }

        // Handle 422 Validation Error
        if (status === 422) {
            console.error('⚠️ Validation Error:', error.response?.data?.errors);
        }

        return Promise.reject(error);
    }
);

// Export instance axios buat dipake di file" yg ada di folder services
export default api;