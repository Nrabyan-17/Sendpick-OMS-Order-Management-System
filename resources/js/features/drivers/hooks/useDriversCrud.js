import { useState, useCallback } from 'react';
import * as driverService from '../services/driverService';

/**
 * Advanced hook untuk CRUD operations pada drivers
 * @param {Object} initialDrivers - Initial drivers data
 * @returns {Object} Drivers state & CRUD functions
 */
export function useDriversCRUD(initialDrivers = []) {

    const [drivers, setDrivers] = useState(initialDrivers);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    /**
     * Create new driver
     * @param {Object} driverData - Data driver baru
     */
    const createDriver = useCallback(async (driverData) => {
        try {
            setIsCreating(true);
            setError(null);

            // 🔴 Call service create
            const result = await driverService.createDriver(driverData);

            // 🟢 Add ke state
            setDrivers(prev => [...prev, result.data]);
            setSuccessMessage('✅ Data driver berhasil ditambahkan');

            console.log('✅ Driver created:', result.data);
            return { success: true, data: result.data };

        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Gagal membuat driver';
            setError(errorMsg);
            console.error('❌ Create error:', err);
            return { success: false, error: errorMsg };

        } finally {
            setIsCreating(false);
        }
    }, []);

    /**
     * Update existing driver
     * @param {number} driverId - ID driver
     * @param {Object} driverData - Data update
     */
    const updateDriver = useCallback(async (driverId, driverData) => {
        try {
            setIsUpdating(true);
            setError(null);

            // 🔴 Call service update
            const result = await driverService.updateDriver(driverId, driverData);

            // 🟢 Update di state
            setDrivers(prev =>
                prev.map(driver =>
                    driver.driver_id === driverId ? result.data : driver
                )
            );
            setSuccessMessage('✅ Driver berhasil diperbarui');

            console.log('✅ Driver updated:', result.data);
            return { success: true, data: result.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Gagal update driver';
            setError(errorMsg);
            console.error('❌ Update error:', err);
            return { success: false, error: errorMsg };
        } finally {
            setIsUpdating(false);
        }
    }, []);

    /**
     * Delete driver
     * @param {number} driverId - ID driver
     */
    const deleteDriver = useCallback(async (driverId) => {
        try {
            setIsDeleting(true);
            setError(null);

            // 🔴 Call service delete
            await driverService.deleteDriver(driverId);

            // 🟢 Remove dari state
            setDrivers(prev =>
                prev.filter(driver => driver.driver_id !== driverId)
            );
            setSuccessMessage('✅ Driver berhasil dihapus');

            console.log('✅ Driver deleted:', driverId);
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Gagal hapus driver';
            setError(errorMsg);
            console.error('❌ Delete error:', err);
            return { success: false, error: errorMsg };
        } finally {
            setIsDeleting(false);
        }
    }, []);

    /**
     * Get single driver detail
     * @param {number} driverId - ID driver
     */
    const getDriver = useCallback(async (driverId) => {
        try {
            setIsLoading(true);
            const driver = await driverService.getDriver(driverId);
            return driver;
        } catch (err) {
            setError('Gagal memuat detail driver');
            console.error('❌ Get driver error:', err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        // State
        drivers,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        successMessage,

        // Functions
        createDriver,
        updateDriver,
        deleteDriver,
        getDriver,
    };
}