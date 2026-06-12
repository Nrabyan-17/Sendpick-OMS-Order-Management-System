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

export async function fetchManifests(params = {}) {
    try {
        const response = await api.get('/manifests', { params });
        return toListResponse(response);
    } catch (error) {
        handleError('❌ Fetch manifests failed:', error);
    }
}

export async function getManifest(manifestId) {
    try {
        const response = await api.get(`/manifests/${manifestId}`);
        return response.data?.data ?? null;
    } catch (error) {
        handleError(`❌ Get manifest ${manifestId} failed:`, error);
    }
}

export async function createManifest(manifestData) {
    try {
        const response = await api.post('/manifests', manifestData);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message,
        };
    } catch (error) {
        handleError('❌ Create manifest failed:', error);
    }
}

export async function updateManifest(manifestId, manifestData) {
    try {
        const response = await api.put(`/manifests/${manifestId}`, manifestData);
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message,
        };
    } catch (error) {
        handleError(`❌ Update manifest ${manifestId} failed:`, error);
    }
}

export async function deleteManifest(manifestId) {
    try {
        const response = await api.delete(`/manifests/${manifestId}`);
        return { success: true, message: response.data?.message };
    } catch (error) {
        handleError(`❌ Delete manifest ${manifestId} failed:`, error);
    }
}

// ========== ADDITIONAL ROUTES (Sesuai api.php) ==========

export async function getAvailableJobOrders(manifestId) {
    try {
        const response = await api.get(`/manifests/${manifestId}/available-job-orders`);
        return response.data?.data ?? {};
    } catch (error) {
        handleError(`❌ Get available job orders for manifest ${manifestId} failed:`, error);
    }
}

export async function addJobOrders(manifestId, jobOrderIds = []) {
    try {
        const response = await api.post(`/manifests/${manifestId}/add-job-orders`, {
            job_order_ids: jobOrderIds,
        });
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message,
        };
    } catch (error) {
        handleError(`❌ Add job orders to manifest ${manifestId} failed:`, error);
    }
}

export async function removeJobOrders(manifestId, jobOrderIds = []) {
    try {
        const response = await api.post(`/manifests/${manifestId}/remove-job-orders`, {
            job_order_ids: jobOrderIds,
        });
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message,
        };
    } catch (error) {
        handleError(`❌ Remove job orders from manifest ${manifestId} failed:`, error);
    }
}

/**
 * Cancel Manifest dengan cascading effects (JO reset ke Pending, DO cancel)
 * ✅ Mengikuti route: POST /manifests/{manifestId}/cancel
 */
export async function cancelManifest(manifestId, cancellationReason = 'Armada batal berangkat') {
    try {
        const response = await api.post(`/manifests/${manifestId}/cancel`, {
            cancellation_reason: cancellationReason
        });
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message,
        };
    } catch (error) {
        handleError(`❌ Cancel manifest ${manifestId} failed:`, error);
    }
}

/**
 * Update manifest status only (for status transitions like Pending -> In Transit)
 * Uses PATCH /manifests/{manifestId}/status endpoint
 */
export async function updateManifestStatus(manifestId, status) {
    try {
        const response = await api.patch(`/manifests/${manifestId}/status`, { status });
        return {
            success: true,
            data: response.data?.data,
            message: response.data?.message,
        };
    } catch (error) {
        handleError(`❌ Update manifest ${manifestId} status failed:`, error);
    }
}