import { useCallback, useState } from 'react';
import {
    getAvailableJobOrders as getAvailableJobOrdersRequest,
    addJobOrders as addJobOrdersRequest,
    removeJobOrders as removeJobOrdersRequest,
} from '../services/manifestService';

const INITIAL_STATE = {
    availableJobOrdersLoading: false,
    syncingJobOrders: false,
    successMessage: null,
    actionError: null,
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message ?? error?.message ?? fallback;

export function useManifestJobOrders(options = {}) {
    const { onSyncComplete } = options;
    const [state, setState] = useState(INITIAL_STATE);

    const setJobOrderState = useCallback((patch) => {
        setState((prev) => ({ ...prev, ...patch }));
    }, []);

    const resetJobOrderStatus = useCallback(() => {
        setJobOrderState({ successMessage: null, actionError: null });
    }, [setJobOrderState]);

    const fetchAvailableJobOrders = useCallback(
        async (manifestId) => {
            setJobOrderState({ availableJobOrdersLoading: true, actionError: null });
            try {
                return await getAvailableJobOrdersRequest(manifestId);
            } catch (error) {
                setJobOrderState({ actionError: getErrorMessage(error, 'Gagal memuat job order tersedia') });
                throw error;
            } finally {
                setJobOrderState({ availableJobOrdersLoading: false });
            }
        },
        [],
    );

    const syncJobOrders = useCallback(
        async ({ manifestId, jobOrderIds = [], action }) => {
            setJobOrderState({ syncingJobOrders: true, actionError: null, successMessage: null });
            try {
                const requestFn = action === 'add' ? addJobOrdersRequest : removeJobOrdersRequest;
                const response = await requestFn(manifestId, jobOrderIds);
                setJobOrderState({ successMessage: response?.message ?? 'Manifest berhasil diperbarui' });
                onSyncComplete?.(response?.data, action);
                return response?.data;
            } catch (error) {
                const fallback = action === 'add' ? 'Gagal menambahkan job order' : 'Gagal menghapus job order';
                setJobOrderState({ actionError: getErrorMessage(error, fallback) });
                throw error;
            } finally {
                setJobOrderState({ syncingJobOrders: false });
            }
        },
        [onSyncComplete],
    );

    return {
        jobOrderState: state,
        fetchAvailableJobOrders,
        addJobOrders: (manifestId, jobOrderIds) => syncJobOrders({ manifestId, jobOrderIds, action: 'add' }),
        removeJobOrders: (manifestId, jobOrderIds) => syncJobOrders({ manifestId, jobOrderIds, action: 'remove' }),
        resetJobOrderStatus,
    };
}
