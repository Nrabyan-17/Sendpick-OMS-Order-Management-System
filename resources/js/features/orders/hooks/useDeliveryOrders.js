import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    fetchDeliveryOrders,
    getDeliveryOrder as getDeliveryOrderRequest,
    createDeliveryOrder as createDeliveryOrderRequest,
    updateDeliveryOrder as updateDeliveryOrderRequest,
    deleteDeliveryOrder as deleteDeliveryOrderRequest,
    assignDriverToDeliveryOrder as assignDriverRequest,
    completeDeliveryOrder as completeDeliveryOrderRequest,
    cancelDeliveryOrder as cancelDeliveryOrderRequest,
} from '../services/deliveryOrderService';

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
    completing: false,
    loadingDetail: false,
    successMessage: null,
    actionError: null,
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message ?? error?.message ?? fallback;

export function useDeliveryOrders(initialParams = {}) {
    const [deliveryOrders, setDeliveryOrders] = useState([]);
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

    const loadDeliveryOrders = useCallback(
        async (override = {}) => {
            try {
                setLoading(true);
                setFetchError(null);
                const result = await fetchDeliveryOrders({ ...mergedParams, ...override });
                setDeliveryOrders(result.items ?? []);
                setPagination(result.pagination ?? DEFAULT_PAGINATION);
                return result;
            } catch (error) {
                setFetchError(getErrorMessage(error, 'Gagal memuat data delivery order'));
                throw error;
            } finally {
                setLoading(false);
            }
        },
        [mergedParams],
    );

    useEffect(() => {
        loadDeliveryOrders();
    }, [loadDeliveryOrders]);

    const createDeliveryOrder = useCallback(
        async (payload) => {
            updateMutationState({ creating: true, actionError: null, successMessage: null });
            try {
                const response = await createDeliveryOrderRequest(payload);
                if (response?.data) {
                    setDeliveryOrders((prev = []) => [response.data, ...(Array.isArray(prev) ? prev : [])]);
                } else {
                    await loadDeliveryOrders();
                }
                updateMutationState({ successMessage: response?.message ?? 'Delivery order berhasil dibuat' });
                return response?.data;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal membuat delivery order') });
                throw error;
            } finally {
                updateMutationState({ creating: false });
            }
        },
        [loadDeliveryOrders, updateMutationState],
    );

    const updateDeliveryOrder = useCallback(
        async (doId, payload) => {
            updateMutationState({ updating: true, actionError: null, successMessage: null });
            try {
                const response = await updateDeliveryOrderRequest(doId, payload);
                if (response?.data) {
                    setDeliveryOrders((prev = []) =>
                        (prev || []).map((item) => (item.do_id === doId ? response.data : item)),
                    );
                } else {
                    await loadDeliveryOrders();
                }
                updateMutationState({ successMessage: response?.message ?? 'Delivery order berhasil diperbarui' });
                return response?.data;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal memperbarui delivery order') });
                throw error;
            } finally {
                updateMutationState({ updating: false });
            }
        },
        [loadDeliveryOrders, updateMutationState],
    );

    const deleteDeliveryOrder = useCallback(
        async (doId) => {
            updateMutationState({ deleting: true, actionError: null, successMessage: null });
            try {
                const response = await deleteDeliveryOrderRequest(doId);
                setDeliveryOrders((prev = []) => (prev || []).filter((item) => item.do_id !== doId));
                updateMutationState({ successMessage: response?.message ?? 'Delivery order berhasil dihapus' });
                return true;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal menghapus delivery order') });
                throw error;
            } finally {
                updateMutationState({ deleting: false });
            }
        },
        [updateMutationState],
    );

    const getDeliveryOrderDetail = useCallback(
        async (doId) => {
            updateMutationState({ loadingDetail: true });
            try {
                return await getDeliveryOrderRequest(doId);
            } finally {
                updateMutationState({ loadingDetail: false });
            }
        },
        [updateMutationState],
    );

    const assignDriver = useCallback(
        async (doId, assignmentData) => {
            updateMutationState({ assigning: true, actionError: null, successMessage: null });
            try {
                const response = await assignDriverRequest(doId, assignmentData);
                await loadDeliveryOrders();
                updateMutationState({ successMessage: response?.message ?? 'Driver berhasil ditugaskan' });
                return response?.data;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal menugaskan driver') });
                throw error;
            } finally {
                updateMutationState({ assigning: false });
            }
        },
        [loadDeliveryOrders, updateMutationState],
    );

    const completeDeliveryOrder = useCallback(
        async (doId) => {
            updateMutationState({ completing: true, actionError: null, successMessage: null });
            try {
                const response = await completeDeliveryOrderRequest(doId);
                await loadDeliveryOrders();
                updateMutationState({ successMessage: response?.message ?? 'Delivery order berhasil diselesaikan' });
                return response?.data;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal menyelesaikan delivery order') });
                throw error;
            } finally {
                updateMutationState({ completing: false });
            }
        },
        [loadDeliveryOrders, updateMutationState],
    );

    const cancelDeliveryOrder = useCallback(
        async (doId) => {
            updateMutationState({ deleting: true, actionError: null, successMessage: null }); // Reuse deleting state for loading spinner
            try {
                const response = await cancelDeliveryOrderRequest(doId);
                await loadDeliveryOrders();
                updateMutationState({ successMessage: response?.message ?? 'Delivery order berhasil dibatalkan' });
                return response?.data;
            } catch (error) {
                updateMutationState({ actionError: getErrorMessage(error, 'Gagal membatalkan delivery order') });
                throw error;
            } finally {
                updateMutationState({ deleting: false });
            }
        },
        [loadDeliveryOrders, updateMutationState],
    );

    return {
        deliveryOrders,
        pagination,
        loading,
        error: fetchError,
        params: mergedParams,
        setParams,
        refetch: loadDeliveryOrders,
        createDeliveryOrder,
        updateDeliveryOrder,
        deleteDeliveryOrder,
        cancelDeliveryOrder,
        getDeliveryOrder: getDeliveryOrderDetail,
        assignDriver,
        completeDeliveryOrder,
        mutationState,
        resetMutationStatus,
    };
}