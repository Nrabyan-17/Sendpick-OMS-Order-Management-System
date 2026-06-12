import api from '../../../utils/api';

const VEHICLE_TYPES_ENDPOINT = '/vehicle-types';
const ACTIVE_TYPES_ENDPOINT = '/vehicle-types/active';

const normalizePagination = (payload = {}) => ({
    total: payload.total ?? payload.meta?.total ?? 0,
    perPage: payload.per_page ?? payload.meta?.per_page ?? 0,
    currentPage: payload.current_page ?? payload.meta?.current_page ?? 1,
    lastPage: payload.last_page ?? payload.meta?.last_page ?? 1,
    from: payload.from ?? payload.meta?.from ?? null,
    to: payload.to ?? payload.meta?.to ?? null,
});

const extractListPayload = (response) => {
    const topLevel = response?.data ?? {};
    const listNode = topLevel.data ?? topLevel.items ?? topLevel;

    const items = Array.isArray(listNode)
        ? listNode
        : Array.isArray(listNode.data)
            ? listNode.data
            : Array.isArray(topLevel?.data?.data)
                ? topLevel.data.data
                : [];

    return {
        items,
        pagination: normalizePagination(topLevel.pagination ?? listNode.pagination ?? listNode.meta ?? {}),
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

export async function fetchVehicleTypes(params = {}) {
    try {
        const response = await api.get(VEHICLE_TYPES_ENDPOINT, { params });
        return extractListPayload(response);
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat tipe kendaraan');
    }
}

export async function getVehicleType(typeId, params = {}) {
    try {
        const response = await api.get(`${VEHICLE_TYPES_ENDPOINT}/${typeId}`, { params });
        return response?.data?.data ?? null;
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat detail tipe kendaraan');
    }
}

export async function createVehicleType(payload) {
    try {
        const response = await api.post(VEHICLE_TYPES_ENDPOINT, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Tipe kendaraan berhasil dibuat',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal membuat tipe kendaraan');
    }
}

export async function updateVehicleType(typeId, payload) {
    try {
        const response = await api.put(`${VEHICLE_TYPES_ENDPOINT}/${typeId}`, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Tipe kendaraan berhasil diperbarui',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal memperbarui tipe kendaraan');
    }
}

export async function deleteVehicleType(typeId) {
    try {
        const response = await api.delete(`${VEHICLE_TYPES_ENDPOINT}/${typeId}`);
        return {
            success: true,
            message: response?.data?.message ?? 'Tipe kendaraan berhasil dihapus',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal menghapus tipe kendaraan');
    }
}

export async function fetchActiveVehicleTypes(params = {}) {
    try {
        const response = await api.get(ACTIVE_TYPES_ENDPOINT, { params });
        return Array.isArray(response?.data?.data) ? response.data.data : [];
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat tipe kendaraan aktif');
    }
}