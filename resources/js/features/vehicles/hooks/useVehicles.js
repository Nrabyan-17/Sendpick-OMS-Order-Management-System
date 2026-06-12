// Hooks untuk fetch dan pagination data kendaraan
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchVehicles } from '../services/vehicleService';

const DEFAULT_PAGINATION = {
    total: 0,
    perPage: 15,
    currentPage: 1,
    lastPage: 1,
    from: null,
    to: null,
};

export function useVehicles(initialParams = {}) {
    const [vehicles, setVehicles] = useState([]);
    const [params, setParams] = useState(initialParams);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const mergedParams = useMemo(() => ({ per_page: 15, ...params }), [params]);

    const loadVehicles = useCallback(
        async (override = {}) => {
            try {
                setLoading(true);
                setError(null);
                const result = await fetchVehicles({ ...mergedParams, ...override });
                setVehicles(result.items ?? []);
                setPagination(result.pagination ?? DEFAULT_PAGINATION);
                return result;
            } catch (err) {
                setError(err.message ?? 'Gagal memuat data kendaraan');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [mergedParams],
    );

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    const refetch = useCallback(() => loadVehicles(), [loadVehicles]);

    return {
        vehicles,
        pagination,
        loading,
        error,
        params: mergedParams,
        setParams,
        refetch,
        fetchWithParams: loadVehicles,
    };
}