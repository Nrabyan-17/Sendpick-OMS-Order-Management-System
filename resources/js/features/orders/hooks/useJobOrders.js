import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    fetchJobOrders,
    getJobOrder as getJobOrderRequest,
    createJobOrder as createJobOrderRequest,
    updateJobOrder as updateJobOrderRequest,
    deleteJobOrder as deleteJobOrderRequest,
    assignDriver as assignDriverRequest,
} from '../services/jobOrderService';

const DEFAULT_PAGINATION = {
    total: 0,
    perPage: 15,
    currentPage: 1,
    lastPage: 1,
    from: null,
    to: null,
};

const initialMutationState = {
    creating: false,
    updating: false,
    deleting: false,
    assigning: false,
    loadingDetail: false,
    successMessage: null,
    actionError: null,
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message ?? error?.message ?? fallback;

export function useJobOrders(initialParams = {}) {
    const [jobOrders, setJobOrders] = useState([]);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [params, setParams] = useState(initialParams);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [mutationState, setMutationState] = useState(initialMutationState);

    const mergedParams = useMemo(() => ({ per_page: 15, ...params }), [params]);

    const updateMutationState = useCallback((patch) => {
        setMutationState((prev) => ({ ...prev, ...patch }));
    }, []);

    const resetMutationStatus = useCallback(() => {
        updateMutationState({ successMessage: null, actionError: null });
    }, [updateMutationState]);

    const loadJobOrders = useCallback(
        async (override = {}) => {
            try {
                setLoading(true);
                setFetchError(null);
                const result = await fetchJobOrders({ ...mergedParams, ...override });
                setJobOrders(result.items ?? []);
                setPagination(result.pagination ?? DEFAULT_PAGINATION);
                return result;
            } catch (error) {
                setFetchError(getErrorMessage(error, 'Gagal memuat data job order'));
                throw error;
            } finally {
                setLoading(false);
            }
        },
        [mergedParams],
    );

    useEffect(() => {
        loadJobOrders();
    }, [loadJobOrders]);

    const createJobOrder = useCallback(
        async (payload) => {
            updateMutationState({ creating: true, actionError: null, successMessage: null });
            try {
                const response = await createJobOrderRequest(payload);
                if (response?.data) {
                    setJobOrders((prev = []) => [response.data, ...(Array.isArray(prev) ? prev : [])]);
                } else {
                    await loadJobOrders();
                }
                updateMutationState({ successMessage: response?.message ?? 'Job order berhasil dibuat' });
                return response?.data;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal membuat job order') });
                throw error;
            } finally {
                updateMutationState({ creating: false });
            }
        },
        [loadJobOrders, updateMutationState],
    );

    const updateJobOrder = useCallback(
        async (jobOrderId, payload) => {
            updateMutationState({ updating: true, actionError: null, successMessage: null });
            try {
                const response = await updateJobOrderRequest(jobOrderId, payload);
                if (response?.data) {
                    setJobOrders((prev = []) =>
                        (prev || []).map((item) => (item.job_order_id === jobOrderId ? response.data : item)),
                    );
                } else {
                    await loadJobOrders();
                }
                updateMutationState({ successMessage: response?.message ?? 'Job order berhasil diperbarui' });
                return response?.data;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal memperbarui job order') });
                throw error;
            } finally {
                updateMutationState({ updating: false });
            }
        },
        [loadJobOrders, updateMutationState],
    );

    const deleteJobOrder = useCallback(
        async (jobOrderId) => {
            updateMutationState({ deleting: true, actionError: null, successMessage: null });
            try {
                const response = await deleteJobOrderRequest(jobOrderId);
                setJobOrders((prev = []) => (prev || []).filter((item) => item.job_order_id !== jobOrderId));
                updateMutationState({ successMessage: response?.message ?? 'Job order berhasil dihapus' });
                return true;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal menghapus job order') });
                throw error;
            } finally {
                updateMutationState({ deleting: false });
            }
        },
        [updateMutationState],
    );

    const getJobOrderDetail = useCallback(
        async (jobOrderId) => {
            updateMutationState({ loadingDetail: true });
            try {
                return await getJobOrderRequest(jobOrderId);
            } finally {
                updateMutationState({ loadingDetail: false });
            }
        },
        [updateMutationState],
    );

    const assignDriver = useCallback(
        async (jobOrderId, driverId) => {
            updateMutationState({ assigning: true, actionError: null, successMessage: null });
            try {
                const response = await assignDriverRequest(jobOrderId, driverId);
                await loadJobOrders();
                updateMutationState({ successMessage: response?.message ?? 'Driver berhasil ditugaskan ke job order' });
                return response?.data;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal menugaskan driver ke job order') });
                throw error;
            } finally {
                updateMutationState({ assigning: false });
            }
        },
        [loadJobOrders, updateMutationState],
    );

    return {
        jobOrders,
        pagination,
        loading,
        error: fetchError,
        params: mergedParams,
        setParams,
        refetch: loadJobOrders,
        createJobOrder,
        updateJobOrder,
        deleteJobOrder,
        getJobOrder: getJobOrderDetail,
        assignDriver,
        mutationState,
        resetMutationStatus,
    };
}