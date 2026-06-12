import { useCallback, useState } from 'react';
import { createAdmin, deleteAdmin, getAdmin, updateAdmin } from '../services/adminService';

/**
 * Hook helper untuk operasi CRUD admin.
 * @param {(updater: Function) => void} setExternalList optional setter agar state list lokal ikut diperbarui.
 */
export function useAdminsCrud(setExternalList) {
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
        const result = await createAdmin(payload);
        setFlags({ success: result.message });
        setExternalList?.((prev = []) => [result.data, ...prev]);
        return result.data;
    });

    const handleUpdate = wrap('updating', async (userId, payload) => {
        const result = await updateAdmin(userId, payload);
        setFlags({ success: result.message });
        setExternalList?.((prev = []) => prev.map((item) => (item.user_id === userId ? result.data : item)));
        return result.data;
    });

    const handleDelete = wrap('deleting', async (userId) => {
        const result = await deleteAdmin(userId);
        setFlags({ success: result.message });
        setExternalList?.((prev = []) => prev.filter((item) => item.user_id !== userId));
        return true;
    });

    const fetchDetail = wrap('loadingDetail', (userId) => getAdmin(userId));

    return {
        ...state,
        createAdmin: handleCreate,
        updateAdmin: handleUpdate,
        deleteAdmin: handleDelete,
        getAdmin: fetchDetail,
    };
}