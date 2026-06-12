import api from '../../../utils/api';

export async function fetchJobOrders(params = {}) {
    try {
        const response = await api.get('/job-orders', { params });
        return {
            items: response.data?.data || [],
            pagination: response.data?.pagination || {}
        };
    } catch (error) {
        console.error('Gagal mengambil job order', error);
        throw error;
    }
}

export async function getJobOrder(jobOrderId) {
    try {
        const response = await api.get(`/job-orders/${jobOrderId}`);
        return response.data?.data || null;
    } catch (error) {
        console.error(`❌ Get job order ${jobOrderId} failed:`, error);
        throw error;
    }
}

export async function createJobOrder(jobOrderData) {
    try {
        // ✅ Mengikuti route: POST /job-orders
        const response = await api.post('/job-orders', jobOrderData);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message
        };
    } catch (error) {
        console.error('❌ Create job order failed:', error.response?.data?.errors);
        throw error;
    }
}

export async function updateJobOrder(jobOrderId, jobOrderData) {
    try {
        // ✅ Mengikuti route: PUT /job-orders/{id}
        const response = await api.put(`/job-orders/${jobOrderId}`, jobOrderData);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message
        };
    } catch (error) {
        console.error(`❌ Update job order ${jobOrderId} failed:`, error.response?.data?.errors);
        throw error;
    }
}

export async function deleteJobOrder(jobOrderId) {
    try {
        // ✅ Mengikuti route: DELETE /job-orders/{id}
        const response = await api.delete(`/job-orders/${jobOrderId}`);
        return { success: true, message: response.data?.message };
    } catch (error) {
        console.error(`❌ Delete job order ${jobOrderId} failed:`, error);
        throw error;
    }
}

// ========== ADDITIONAL ROUTES (Khusus Job Order) ==========

export async function assignDriver(jobOrderId, payload) {
    try {
        // ✅ Mengikuti route: POST /job-orders/{id}/assignments
        const response = await api.post(`/job-orders/${jobOrderId}/assignments`, payload);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message
        };
    } catch (error) {
        console.error('❌ Assign driver failed:', error.response?.data?.errors);
        throw error;
    }
}

export async function getAssignments(jobOrderId) {
    try {
        // ✅ Mengikuti route: GET /job-orders/{id}/assignments
        const response = await api.get(`/job-orders/${jobOrderId}/assignments`);
        return response.data?.data || [];
    } catch (error) {
        console.error(`❌ Get assignments for ${jobOrderId} failed:`, error);
        throw error;
    }
}

/**
 * Cancel Job Order dengan cascading effects (DO cancel, detach dari Manifest)
 * ✅ Mengikuti route: POST /job-orders/{id}/cancel
 */
export async function cancelJobOrder(jobOrderId, cancellationReason = 'Dibatalkan oleh Admin') {
    try {
        const response = await api.post(`/job-orders/${jobOrderId}/cancel`, {
            cancellation_reason: cancellationReason
        });
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message
        };
    } catch (error) {
        console.error(`❌ Cancel job order ${jobOrderId} failed:`, error.response?.data);
        throw error;
    }
}