import { useCallback, useState } from 'react';
import {
    createManifest as createManifestRequest,
    updateManifest as updateManifestRequest,
    deleteManifest as deleteManifestRequest,
    getManifest as getManifestRequest,
    cancelManifest as cancelManifestRequest,
    updateManifestStatus as updateManifestStatusRequest,
} from '../services/manifestService';

const INITIAL_STATE = {
    creating: false,
    updating: false,
    updatingStatus: false,
    deleting: false,
    cancelling: false,
    loadingDetail: false,
    successMessage: null,
    actionError: null,
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message ?? error?.message ?? fallback;

export function useManifestCrud(options = {}) {
    const {
        onCreateSuccess,
        onUpdateSuccess,
        onDeleteSuccess,
        onMutationsComplete,
    } = options;

    const [state, setState] = useState(INITIAL_STATE);

    const setMutationState = useCallback((patch) => {
        setState((prev) => ({ ...prev, ...patch }));
    }, []);

    const resetMutationStatus = useCallback(() => {
        setMutationState({ successMessage: null, actionError: null });
    }, [setMutationState]);

    const handleCreate = useCallback(
        async (payload) => {
            setMutationState({ creating: true, actionError: null, successMessage: null });
            try {
                const response = await createManifestRequest(payload);
                onCreateSuccess?.(response?.data, response);
                setMutationState({ successMessage: response?.message ?? 'Manifest berhasil dibuat' });
                return response?.data;
            } catch (error) {
                setMutationState({ actionError: getErrorMessage(error, 'Gagal membuat manifest') });
                throw error;
            } finally {
                setMutationState({ creating: false });
                onMutationsComplete?.();
            }
        },
        [onCreateSuccess, onMutationsComplete, setMutationState],
    );

    const handleUpdate = useCallback(
        async (manifestId, payload) => {
            setMutationState({ updating: true, actionError: null, successMessage: null });
            try {
                const response = await updateManifestRequest(manifestId, payload);
                onUpdateSuccess?.(response?.data, response);
                setMutationState({ successMessage: response?.message ?? 'Manifest berhasil diperbarui' });
                return response?.data;
            } catch (error) {
                setMutationState({ actionError: getErrorMessage(error, 'Gagal memperbarui manifest') });
                throw error;
            } finally {
                setMutationState({ updating: false });
                onMutationsComplete?.();
            }
        },
        [onMutationsComplete, onUpdateSuccess, setMutationState],
    );

    const handleDelete = useCallback(
        async (manifestId) => {
            setMutationState({ deleting: true, actionError: null, successMessage: null });
            try {
                const response = await deleteManifestRequest(manifestId);
                onDeleteSuccess?.(manifestId, response);
                setMutationState({ successMessage: response?.message ?? 'Manifest berhasil dihapus' });
                return true;
            } catch (error) {
                setMutationState({ actionError: getErrorMessage(error, 'Gagal menghapus manifest') });
                throw error;
            } finally {
                setMutationState({ deleting: false });
                onMutationsComplete?.();
            }
        },
        [onDeleteSuccess, onMutationsComplete, setMutationState],
    );

    const handleCancel = useCallback(
        async (manifestId) => {
            setMutationState({ cancelling: true, actionError: null, successMessage: null });
            try {
                const response = await cancelManifestRequest(manifestId);
                // We can treat cancel as an update since the record still exists but status changed
                onUpdateSuccess?.(response?.data, response);
                setMutationState({ successMessage: response?.message ?? 'Manifest berhasil dibatalkan' });
                return true;
            } catch (error) {
                setMutationState({ actionError: getErrorMessage(error, 'Gagal membatalkan manifest') });
                throw error;
            } finally {
                setMutationState({ cancelling: false });
                onMutationsComplete?.();
            }
        },
        [onUpdateSuccess, onMutationsComplete, setMutationState],
    );

    const getManifestDetail = useCallback(
        async (manifestId) => {
            setMutationState({ loadingDetail: true });
            try {
                return await getManifestRequest(manifestId);
            } catch (error) {
                setMutationState({ actionError: getErrorMessage(error, 'Gagal memuat detail manifest') });
                throw error;
            } finally {
                setMutationState({ loadingDetail: false });
            }
        },
        [setMutationState],
    );

    const handleUpdateStatus = useCallback(
        async (manifestId, status) => {
            setMutationState({ updatingStatus: true, actionError: null, successMessage: null });
            try {
                const response = await updateManifestStatusRequest(manifestId, status);
                onUpdateSuccess?.(response?.data, response);
                setMutationState({ successMessage: response?.message ?? 'Status manifest berhasil diperbarui' });
                return response?.data;
            } catch (error) {
                setMutationState({ actionError: getErrorMessage(error, 'Gagal memperbarui status manifest') });
                throw error;
            } finally {
                setMutationState({ updatingStatus: false });
                onMutationsComplete?.();
            }
        },
        [onMutationsComplete, onUpdateSuccess, setMutationState],
    );

    return {
        createManifest: handleCreate,
        updateManifest: handleUpdate,
        updateManifestStatus: handleUpdateStatus,
        deleteManifest: handleDelete,
        cancelManifest: handleCancel,
        getManifest: getManifestDetail,
        mutationState: state,
        resetMutationStatus,
    };
}
