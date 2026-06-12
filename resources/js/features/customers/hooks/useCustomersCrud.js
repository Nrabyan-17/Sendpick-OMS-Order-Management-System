import { useCallback, useState } from 'react';
import { createCustomer, deleteCustomer, getCustomer, updateCustomer } from '../services/customerService';

/**
 * Hook helper untuk operasi CRUD customer.
 * Bisa dipakai sendiri atau dikombinasikan dengan hook list (useCustomers).
 * @param {(updater: Function) => void} setExternalList optional setter supaya state list ikut tersinkron.
 */
export function useCustomersCrud(setExternalList) {
    const [state, setState] = useState({
        creating: false,
        updating: false,
        deleting: false,
        loadingDetail: false,
        error: null,
        success: null,
    });

    const setFlags = (flags) => setState((prev) => ({ ...prev, ...flags }));

    const wrap = (flagKey, fn) => async (...args) => {
        setFlags({ [flagKey]: true, error: null, success: null });
        try {
            const result = await fn(...args);
            return result;
        } catch (error) {
            const message = error?.message ?? 'Operasi gagal';
            setFlags({ error: message });
            throw error;
        } finally {
            setFlags({ [flagKey]: false });
        }
    };

    const handleCreate = wrap('creating', async (payload) => {
        const result = await createCustomer(payload);
        setFlags({ success: result.message });
        setExternalList?.((prev) => [result.data, ...(Array.isArray(prev) ? prev : [])]);
        return result.data;
    });

    const handleUpdate = wrap('updating', async (customerId, payload) => {
        const result = await updateCustomer(customerId, payload);
        setFlags({ success: result.message });
        setExternalList?.((prev = []) => prev.map((item) => (item.id === customerId ? result.data : item)));
        return result.data;
    });

    const handleDelete = wrap('deleting', async (customerId) => {
        const result = await deleteCustomer(customerId);
        setFlags({ success: result.message });
        setExternalList?.((prev = []) => prev.filter((item) => item.id !== customerId));
        return true;
    });

    const fetchDetail = wrap('loadingDetail', (customerId) => getCustomer(customerId));

    return {
        ...state,
        createCustomer: handleCreate,
        updateCustomer: handleUpdate,
        deleteCustomer: handleDelete,
        getCustomer: fetchDetail,
    };
}