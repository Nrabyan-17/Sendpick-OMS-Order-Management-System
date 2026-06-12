import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCustomers } from '../services/customerService';

const DEFAULT_PAGINATION = {
    total: 0,
    perPage: 15,
    currentPage: 1,
    lastPage: 1,
    from: null,
    to: null,
};

/**
 * Hook untuk mengambil daftar pelanggan dengan dukungan filter pencarian & pagination.
 * @param {Object} initialParams parameter default untuk request (misal per_page, sort, dsb)
 */
export function useCustomers(initialParams = {}) {
    const [customers, setCustomers] = useState([]);
    const [params, setParams] = useState(initialParams);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const mergedParams = useMemo(() => ({ per_page: 15, ...params }), [params]);

    const loadCustomers = useCallback(async (overrideParams = {}) => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchCustomers({ ...mergedParams, ...overrideParams });
            setCustomers(result.items);
            setPagination(result.pagination ?? DEFAULT_PAGINATION);
            return result;
        } catch (err) {
            setError(err.message ?? 'Gagal memuat data pelanggan');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [mergedParams]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const refetch = useCallback(() => loadCustomers(), [loadCustomers]);

    return {
        customers,
        pagination,
        loading,
        error,
        params: mergedParams,
        setParams,
        refetch,
        fetchWithParams: loadCustomers,
    };
}