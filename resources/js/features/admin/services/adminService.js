import api from '../../../utils/api';

const ADMINS_ENDPOINT = '/admins';
const ROLES_ENDPOINT = '/admins/roles';

const normalizePagination = (payload = {}) => ({
    total: payload.total ?? payload.meta?.total ?? 0,
    perPage: payload.per_page ?? payload.perPage ?? payload.meta?.per_page ?? 0,
    currentPage: payload.current_page ?? payload.currentPage ?? payload.meta?.current_page ?? 1,
    lastPage: payload.last_page ?? payload.lastPage ?? payload.meta?.last_page ?? 1,
    from: payload.from ?? payload.meta?.from ?? null,
    to: payload.to ?? payload.meta?.to ?? null,
});

const extractListPayload = (response) => {
    const topLevel = response?.data ?? {};
    const listNode = topLevel.data ?? topLevel;

    const items = Array.isArray(listNode)
        ? listNode
        : Array.isArray(listNode.data)
            ? listNode.data
            : listNode.items ?? [];

    return {
        items,
        pagination: normalizePagination(listNode.pagination ?? listNode),
        meta: topLevel.meta ?? listNode.meta ?? null,
        message: topLevel.message ?? null,
        raw: topLevel,
    };
};

const normalizeError = (error, fallbackMessage) => {
    const normalized = new Error(error?.response?.data?.message ?? fallbackMessage);
    normalized.status = error?.response?.status;
    normalized.errors = error?.response?.data?.errors ?? null;
    normalized.raw = error;
    return normalized;
};

export async function fetchAdmins(params = {}) {
    try {
        const response = await api.get(ADMINS_ENDPOINT, { params });
        return extractListPayload(response);
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat data admin');
    }
}

export async function getAdmin(userId, params = {}) {
    try {
        const response = await api.get(`${ADMINS_ENDPOINT}/${userId}`, { params });
        return response?.data?.data ?? null;
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat detail admin');
    }
}

export async function createAdmin(payload) {
    try {
        const response = await api.post(ADMINS_ENDPOINT, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Admin berhasil dibuat',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal membuat admin');
    }
}

export async function updateAdmin(userId, payload) {
    try {
        const response = await api.put(`${ADMINS_ENDPOINT}/${userId}`, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Admin berhasil diperbarui',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal memperbarui admin');
    }
}

export async function deleteAdmin(userId) {
    try {
        const response = await api.delete(`${ADMINS_ENDPOINT}/${userId}`);
        return {
            success: true,
            message: response?.data?.message ?? 'Admin berhasil dihapus',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal menghapus admin');
    }
}

export async function fetchAdminRoles(params = {}) {
    try {
        const response = await api.get(ROLES_ENDPOINT, { params });
        return Array.isArray(response?.data?.data) ? response.data.data : [];
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat data role');
    }
}