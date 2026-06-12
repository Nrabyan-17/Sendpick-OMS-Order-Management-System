// Hooks untuk fetch dan pagination data admin
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdmins, fetchAdminRoles } from '../services/adminService';

const DEFAULT_PAGINATION = {
    total: 0,
    perPage: 15,
    currentPage: 1,
    lastPage: 1,
    from: null,
    to: null,
};

export function useAdmins(initialParams = {}) {
    const [admins, setAdmins] = useState([]);
    const [roles, setRoles] = useState([]);
    const [params, setParams] = useState(initialParams);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const mergedParams = useMemo(() => ({ per_page: 15, ...params }), [params]);

    const loadAdmins = useCallback(async (overrideParams = {}) => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchAdmins({ ...mergedParams, ...overrideParams });
            setAdmins(result.items ?? []);
            setPagination(result.pagination ?? DEFAULT_PAGINATION);
            return result;
        } catch (err) {
            setError(err.message ?? 'Gagal memuat data admin');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [mergedParams]);

    const loadRoles = useCallback(async () => {
        try {
            const roleList = await fetchAdminRoles();
            setRoles(roleList ?? []);
        } catch (err) {
            console.error('Gagal memuat data role:', err);
        }
    }, []);

    useEffect(() => {
        loadAdmins();
        loadRoles();
    }, [loadAdmins, loadRoles]);

    const refetch = useCallback(() => loadAdmins(), [loadAdmins]);

    return {
        admins,
        roles,
        pagination,
        loading,
        error,
        params: mergedParams,
        setParams,
        refetch,
        fetchWithParams: loadAdmins,
    };
}
