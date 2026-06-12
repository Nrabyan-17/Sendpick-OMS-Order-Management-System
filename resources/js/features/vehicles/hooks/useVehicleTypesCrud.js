import { useState } from 'react';
import {
    createVehicleType,
    updateVehicleType,
    deleteVehicleType,
} from '../services/vehicleTypeService';

const initialState = {
    creating: false,
    updating: false,
    deleting: false,
    error: null,
    success: null,
};

export function useVehicleTypesCrud(setExternalList) {
    const [state, setState] = useState(initialState);

    const setFlags = (flags) => setState((prev) => ({ ...prev, ...flags }));

    const wrap = (flagKey, fn) => async (...args) => {
        setFlags({ [flagKey]: true, error: null, success: null });
        try {
            const result = await fn(...args);
            return result;
        } catch (error) {
            const message = error?.message ?? 'Operasi tipe kendaraan gagal';
            setFlags({ error: message });
            throw error;
        } finally {
            setFlags({ [flagKey]: false });
        }
    };

    const handleCreate = wrap('creating', async (payload) => {
        const result = await createVehicleType(payload);
        setFlags({ success: result.message });
        // Optimistic update or refetch trigger can be handled by caller via refetch
        return result.data;
    });

    const handleUpdate = wrap('updating', async (typeId, payload) => {
        const result = await updateVehicleType(typeId, payload);
        setFlags({ success: result.message });
        return result.data;
    });

    const handleDelete = wrap('deleting', async (typeId) => {
        const result = await deleteVehicleType(typeId);
        setFlags({ success: result.message });
        return true;
    });

    return {
        ...state,
        createVehicleType: handleCreate,
        updateVehicleType: handleUpdate,
        deleteVehicleType: handleDelete,
        resetStatus: () => setFlags({ error: null, success: null }),
    };
}
