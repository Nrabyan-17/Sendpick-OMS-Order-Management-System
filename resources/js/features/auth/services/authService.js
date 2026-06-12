import api from '../../../utils/api';

export async function login(credentials) {
    const response = await api.post('/auth/login', credentials);
    const { token } = response.data ?? {};

    if (token) {
        localStorage.setItem('authToken', token);
    }

    return response.data;
}

export async function logout() {
    try {
        await api.post('/auth/logout');
    } finally {
        localStorage.removeItem('authToken');
    }
}

export async function getAuthenticatedUser() {
    const response = await api.get('/auth/saya');
    return response.data;
}

