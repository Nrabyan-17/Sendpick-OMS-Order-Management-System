import { useState } from 'react';
import {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicle,
} from '../services/vehicleService';

const initialState = {
    creating: false,
    updating: false,
    deleting: false,
    loadingDetail: false,
    error: null,
    success: null,
};

export function useVehiclesCrud(setExternalList) {
    const [state, setState] = useState(initialState);

    const setFlags = (flags) => setState((prev) => ({ ...prev, ...flags }));

    const wrap = (flagKey, fn) => async (...args) => {
        setFlags({ [flagKey]: true, error: null, success: null });
        try {
            const result = await fn(...args);
            return result;
        } catch (error) {
            const message = error?.message ?? 'Operasi kendaraan gagal';
            setFlags({ error: message });
            throw error;
        } finally {
            setFlags({ [flagKey]: false });
        }
    };

    const handleCreate = wrap('creating', async (payload) => {
        const result = await createVehicle(payload);
        setFlags({ success: result.message });
        setExternalList?.((prev = []) => [result.data, ...(Array.isArray(prev) ? prev : [])]);
        return result.data;
    });

    const handleUpdate = wrap('updating', async (vehicleId, payload) => {
        const result = await updateVehicle(vehicleId, payload);
        setFlags({ success: result.message });
        setExternalList?.((prev = []) =>
            (prev || []).map((item) => (item.vehicle_id === vehicleId ? result.data : item)),
        );
        return result.data;
    });

    const handleDelete = wrap('deleting', async (vehicleId) => {
        const result = await deleteVehicle(vehicleId);
        setFlags({ success: result.message });
        setExternalList?.((prev = []) => (prev || []).filter((item) => item.vehicle_id !== vehicleId));
        return true;
    });

    const handleGet = wrap('loadingDetail', (vehicleId) => getVehicle(vehicleId));

    return {
        ...state,
        createVehicle: handleCreate,
        updateVehicle: handleUpdate,
        deleteVehicle: handleDelete,
        getVehicle: handleGet,
        resetStatus: () => setFlags({ error: null, success: null }),
    };
}