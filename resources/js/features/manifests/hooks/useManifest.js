import { useManifestList } from './useManifestList';
import { useManifestPagination } from './useManifestPagination';
import { useManifestMutations } from './useManifestMutations';

export function useManifests(initialParams = {}) {
    const listControls = useManifestList(initialParams);
    const paginationControls = useManifestPagination(listControls.pagination, listControls.fetchWithParams);
    const mutationControls = useManifestMutations(listControls);

    return {
        ...listControls,
        ...mutationControls,
        pagination: paginationControls,
    };
}