import api from '../../../utils/api';

const toListResponse = (response) => ({
    items: response.data?.data ?? [],
    pagination: response.data?.pagination ?? {},
});

const handleError = (label, error) => {
    const detail = error?.response?.data ?? error;
    console.error(label, detail);
    throw error;
};

// ========== STANDARD CRUD ==========

export async function fetchDeliveryOrders(params = {}) {
    try {
        const response = await api.get('/delivery-orders', { params });
        return toListResponse(response);
    } catch (error) {
        handleError('❌ Fetch delivery orders failed:', error);
    }
}

export async function getDeliveryOrder(doId) {
    try {
        const response = await api.get(`/delivery-orders/${doId}`);
        return response.data?.data ?? null;
    } catch (error) {
        handleError(`❌ Get delivery order ${doId} failed:`, error);
    }
}

export async function createDeliveryOrder(payload) {
    try {
        const response = await api.post('/delivery-orders', payload);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message ?? 'Delivery order berhasil dibuat',
        };
    } catch (error) {
        handleError('❌ Create delivery order failed:', error);
    }
}

export async function updateDeliveryOrder(doId, payload) {
    try {
        const response = await api.put(`/delivery-orders/${doId}`, payload);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message ?? 'Delivery order berhasil diperbarui',
        };
    } catch (error) {
        handleError(`❌ Update delivery order ${doId} failed:`, error);
    }
}

export async function deleteDeliveryOrder(doId) {
    try {
        const response = await api.delete(`/delivery-orders/${doId}`);
        return {
            success: true,
            message: response.data?.message ?? 'Delivery order berhasil dihapus',
        };
    } catch (error) {
        handleError(`❌ Delete delivery order ${doId} failed:`, error);
    }
}

// ========== ADDITIONAL ROUTES ==========

export async function assignDriverToDeliveryOrder(doId, assignmentData) {
    try {
        const response = await api.post(`/delivery-orders/${doId}/assign-driver`, assignmentData);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message ?? 'Driver berhasil ditugaskan',
        };
    } catch (error) {
        handleError(`❌ Assign driver to delivery order ${doId} failed:`, error);
    }
}

export async function completeDeliveryOrder(doId) {
    try {
        const response = await api.post(`/delivery-orders/${doId}/complete`);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message ?? 'Delivery order berhasil diselesaikan',
        };
    } catch (error) {
        handleError(`❌ Complete delivery order ${doId} failed:`, error);
    }
}

/**
 * Cancel Delivery Order dengan cascading effects (JO reset ke Pending, Manifest recalculate)
 * ✅ Mengikuti route: POST /delivery-orders/{doId}/cancel
 */
export async function cancelDeliveryOrder(doId, cancellationReason = 'Salah cetak/revisi dokumen') {
    try {
        const response = await api.post(`/delivery-orders/${doId}/cancel`, {
            cancellation_reason: cancellationReason
        });
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message ?? 'Delivery order berhasil dibatalkan',
        };
    } catch (error) {
        handleError(`❌ Cancel delivery order ${doId} failed:`, error);
    }
}