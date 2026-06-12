import { useCallback, useEffect, useState } from 'react';
import { fetchActiveVehicleTypes } from '../services/vehicleTypeService';

export function useActiveVehicleTypes() {
    const [activeVehicleTypes, setActiveVehicleTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadActiveTypes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchActiveVehicleTypes();
            setActiveVehicleTypes(data);
        } catch (err) {
            setError(err.message ?? 'Gagal memuat tipe kendaraan aktif');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadActiveTypes();
    }, [loadActiveTypes]);

    return {
        activeVehicleTypes,
        loading,
        error,
        refetch: loadActiveTypes,
    };
}