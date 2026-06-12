import api from '../../../utils/api';

const CUSTOMERS_ENDPOINT = '/customers';

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
    const items = Array.isArray(listNode.data) ? listNode.data : Array.isArray(listNode)
        ? listNode
        : listNode.data ?? [];

    return {
        items,
        pagination: normalizePagination(listNode),
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

// Untuk mengambil data pelanggan dari API
export async function fetchCustomers(params = {}) {
    try {
        const response = await api.get(CUSTOMERS_ENDPOINT, { params });
        return extractListPayload(response);
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat data pelanggan');
    }
}

// Untuk mengambil detail data pelanggan dari API berdasarkan ID
export async function getCustomer(customerId, params = {}) {
    try {
        const response = await api.get(`${CUSTOMERS_ENDPOINT}/${customerId}`, { params });
        return response?.data?.data ?? null;
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat detail pelanggan');
    }
}

// Untuk membuat data pelanggan baru ke API
export async function createCustomer(payload) {
    try {
        const response = await api.post(CUSTOMERS_ENDPOINT, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Data Customer berhasil dibuat',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal membuat data customer');
    }
}

// Untuk memperbarui data pelanggan ke API berdasarkan ID
export async function updateCustomer(customerId, payload) {
    try {
        const response = await api.put(`${CUSTOMERS_ENDPOINT}/${customerId}`, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Customer berhasil diperbarui',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal memperbarui pelanggan');
    }
}

// Untuk menghapus data pelanggan dari API berdasarkan ID
export async function deleteCustomer(customerId) {
    try {
        const response = await api.delete(`${CUSTOMERS_ENDPOINT}/${customerId}`);
        return {
            success: true,
            message: response?.data?.message ?? 'Customer berhasil dihapus',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal menghapus pelanggan');
    }
}