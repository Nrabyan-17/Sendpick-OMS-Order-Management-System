import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchManifests } from '../services/manifestService';

const DEFAULT_PAGINATION = {
    total: 0,
    perPage: 15,
    currentPage: 1,
    lastPage: 1,
    from: null,
    to: null,
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message ?? error?.message ?? fallback;

export function useManifestList(initialParams = {}) {
    const [manifests, setManifests] = useState([]);
    const [params, setParams] = useState(initialParams);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const mergedParams = useMemo(() => ({ per_page: 15, ...params }), [params]);

    const loadManifests = useCallback(
        async (override = {}) => {
            try {
                setLoading(true);
                setError(null);
                const result = await fetchManifests({ ...mergedParams, ...override });
                setManifests(result?.items ?? []);
                setPagination(result?.pagination ?? DEFAULT_PAGINATION);
                return result;
            } catch (err) {
                const message = getErrorMessage(err, 'Gagal memuat data manifest');
                setError(message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [mergedParams],
    );

    useEffect(() => {
        loadManifests();
    }, [loadManifests]);

    const refetch = useCallback(() => loadManifests(), [loadManifests]);

    return {
        manifests,
        setManifests,
        loading,
        error,
        pagination,
        params: mergedParams,
        setParams,
        refetch,
        fetchWithParams: loadManifests,
    };
}
