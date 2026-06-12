import { useState, useEffect, useCallback } from 'react';
import { getAvailableDrivers } from '../../drivers/services/driverService';

/**
 * Custom hook untuk fetch dan manage data available drivers
 * (Driver yang belum ditugaskan ke kendaraan)
 * @returns {Object} { availableDrivers, loading, error, refetch }
 */
export function useAvailableDrivers() {
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Fetch available drivers dari API
     */
    const fetchAvailableDrivers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const drivers = await getAvailableDrivers();
            setAvailableDrivers(drivers);

            console.log('✅ Available drivers loaded:', drivers);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Gagal memuat data driver tersedia';
            setError(errorMessage);
            console.error('❌ Error loading available drivers:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch saat component mount
    useEffect(() => {
        fetchAvailableDrivers();
    }, [fetchAvailableDrivers]);

    return {
        availableDrivers,
        loading,
        error,
        refetch: fetchAvailableDrivers,
    };
}
