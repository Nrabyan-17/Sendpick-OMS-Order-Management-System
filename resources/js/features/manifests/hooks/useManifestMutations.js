import { useCallback, useMemo } from 'react';
import { useManifestList } from './useManifestList';
import { useManifestCrud } from './useManifestCrud';
import { useManifestJobOrders } from './useManifestJobOrders';

export function useManifestMutations(listControls) {
    const { setManifests, refetch } = listControls ?? {};

    const mutations = useManifestCrud({
        onCreateSuccess: (data) => {
            if (data && setManifests) {
                setManifests((prev = []) => [data, ...(Array.isArray(prev) ? prev : [])]);
            }
        },
        onUpdateSuccess: (data) => {
            if (!data || !setManifests) return;
            setManifests((prev = []) => (prev || []).map((item) => (item.manifest_id === data.manifest_id ? data : item)));
        },
        onDeleteSuccess: (manifestId) => {
            if (!setManifests) return;
            setManifests((prev = []) => (prev || []).filter((item) => item.manifest_id !== manifestId));
        },
        onMutationsComplete: refetch,
    });

    const jobOrders = useManifestJobOrders({
        onSyncComplete: () => refetch?.(),
    });

    const mutationState = useMemo(
        () => ({
            ...mutations.mutationState,
            syncingJobOrders: jobOrders.jobOrderState.syncingJobOrders,
            availableJobOrdersLoading: jobOrders.jobOrderState.availableJobOrdersLoading,
            // Prioritaskan pesan/action error dari operasi job order jika ada
            actionError: jobOrders.jobOrderState.actionError ?? mutations.mutationState.actionError,
            successMessage: jobOrders.jobOrderState.successMessage ?? mutations.mutationState.successMessage,
        }),
        [jobOrders.jobOrderState, mutations.mutationState],
    );

    const resetMutationStatus = useCallback(() => {
        mutations.resetMutationStatus?.();
        jobOrders.resetJobOrderStatus?.();
    }, [jobOrders.resetJobOrderStatus, mutations.resetMutationStatus]);

    return useMemo(
        () => ({
            ...mutations,
            ...jobOrders,
            mutationState,
            resetMutationStatus,
        }),
        [jobOrders, mutationState, mutations, resetMutationStatus],
    );
}