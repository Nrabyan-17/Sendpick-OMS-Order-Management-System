import api from '../../../utils/api';

const VEHICLES_ENDPOINT = '/vehicles';
const AVAILABLE_ENDPOINT = '/vehicles/available';
const MAINTENANCE_ENDPOINT = (vehicleId) => `/vehicles/${vehicleId}/maintenance`;

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

export async function fetchVehicles(params = {}) {
    try {
        const response = await api.get(VEHICLES_ENDPOINT, { params });
        return extractListPayload(response);
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat data kendaraan');
    }
}

// Perlu diubah
export async function getVehicle(vehicleId, params = {}) {
    try {
        const response = await api.get(`${VEHICLES_ENDPOINT}/${vehicleId}`, { params });
        return response?.data?.data ?? null;
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat detail kendaraan');
    }
}

export async function createVehicle(payload) {
    try {
        const response = await api.post(VEHICLES_ENDPOINT, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Kendaraan berhasil dibuat',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal membuat kendaraan');
    }
}

export async function updateVehicle(vehicleId, payload) {
    try {
        const response = await api.put(`${VEHICLES_ENDPOINT}/${vehicleId}`, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Kendaraan berhasil diperbarui',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal memperbarui kendaraan');
    }
}

export async function deleteVehicle(vehicleId) {
    try {
        const response = await api.delete(`${VEHICLES_ENDPOINT}/${vehicleId}`);
        return {
            success: true,
            message: response?.data?.message ?? 'Kendaraan berhasil dihapus',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal menghapus kendaraan');
    }
}

export async function fetchAvailableVehicles(params = {}) {
    try {
        const response = await api.get(AVAILABLE_ENDPOINT, { params });
        return Array.isArray(response?.data?.data) ? response.data.data : [];
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat kendaraan tersedia');
    }
}

export async function updateVehicleMaintenance(vehicleId, payload) {
    try {
        const response = await api.patch(MAINTENANCE_ENDPOINT(vehicleId), payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Info maintenance berhasil diperbarui',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal memperbarui info maintenance');
    }
}

export async function fetchActiveVehicles() {
    try {
        const response = await api.get('/vehicles/active');
        return {
            success: true,
            data: response?.data?.data ?? [],
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat data kendaraan aktif');
    }
}