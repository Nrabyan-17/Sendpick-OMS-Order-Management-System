import { useState, useEffect, useRef, useCallback } from 'react';

import * as driverService from '../services/driverService';

const DEFAULT_PAGINATION = {
    total: 0,
    perPage: 15,
    currentPage: 1,
    lastPage: 1,
};

/**
 * Custom hook untuk fetch dan manage data driver
 * @param {Object} initialParams - Parameter default untuk fetch
 * @returns {Object} { drivers, loading, error, pagination, refetch }
 */
export function useDrivers(initialParams = {}) {
    const [drivers, setDrivers] = useState([]); // 🟢 Store data
    const [loading, setLoading] = useState(true); // 🟡 Store loading state
    const [error, setError] = useState(null); // 🔴 Store error state
    const [pagination, setPagination] = useState(() => ({ ...DEFAULT_PAGINATION })); // 🟢 Store pagination info

    const initialParamsRef = useRef(initialParams);

    useEffect(() => {
        initialParamsRef.current = initialParams;
    }, [initialParams]);

    /**
     * Fetch data drivers dari API
     * @param {Object} params - Custom parameters untuk fetch
     */
    const fetchDriversData = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null); // Clear previous error

            // 🔴 Call service function

            const result = await driverService.fetchDrivers({
                ...initialParamsRef.current,
                ...params,
            });

            // 🟢 Update state dengan data dari API
            setDrivers(result.items ?? []);
            setPagination(result.pagination ?? { ...DEFAULT_PAGINATION });

            console.log('✅ Drivers loaded successfully:', result.items);
        } catch (err) {
            // 🔴 Handle error
            const errorMessage = err.response?.data?.message || err.message || 'Gagal memuat data driver';
            setError(errorMessage);
            console.error('❌ Hook error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔵 Run fetch saat component sedang di mount
    useEffect(() => {
        fetchDriversData();
    }, [fetchDriversData]);

    // 🟢 Return state & functions untuk dipakai component
    return {
        drivers,        // Data array
        loading,        // Boolean: true/false
        error,          // String: error message
        pagination,     // Object: pagination info
        refetch: fetchDriversData, // Function: refetch data manually
    };
}