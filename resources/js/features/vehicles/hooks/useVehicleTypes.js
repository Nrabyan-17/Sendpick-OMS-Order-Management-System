import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchVehicleTypes } from '../services/vehicleTypeService';

const DEFAULT_PAGINATION = {
    total: 0,
    perPage: 15,
    currentPage: 1,
    lastPage: 1,
    from: null,
    to: null,
};

export function useVehicleTypes(initialParams = {}) {
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [params, setParams] = useState(initialParams);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const mergedParams = useMemo(() => ({ per_page: 15, ...params }), [params]);

    const loadVehicleTypes = useCallback(
        async (override = {}) => {
            try {
                setLoading(true);
                setError(null);
                const result = await fetchVehicleTypes({ ...mergedParams, ...override });
                setVehicleTypes(result.items ?? []);
                setPagination(result.pagination ?? DEFAULT_PAGINATION);
                return result;
            } catch (err) {
                setError(err.message ?? 'Gagal memuat tipe kendaraan');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [mergedParams],
    );

    useEffect(() => {
        loadVehicleTypes();
    }, [loadVehicleTypes]);

    const refetch = useCallback(() => loadVehicleTypes(), [loadVehicleTypes]);

    return {
        vehicleTypes,
        pagination,
        loading,
        error,
        params: mergedParams,
        setParams,
        refetch,
        fetchWithParams: loadVehicleTypes,
    };
}
