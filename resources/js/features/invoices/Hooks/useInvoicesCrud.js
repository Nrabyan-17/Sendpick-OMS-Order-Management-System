import { useState } from 'react';
import {
    createInvoice as createInvoiceService,
    updateInvoice as updateInvoiceService,
    deleteInvoice as deleteInvoiceService,
    recordPayment as recordPaymentService,
    cancelInvoice as cancelInvoiceService
} from '../services/invoiceService';

export const useInvoicesCrud = (onSuccess) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const createInvoice = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await createInvoiceService(data);
            if (response.success) {
                if (onSuccess) onSuccess();
                return response.data;
            }
        } catch (err) {
            const message = err.message || 'Failed to create invoice';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateInvoice = async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await updateInvoiceService(id, data);
            if (response.success) {
                if (onSuccess) onSuccess();
                return response.data;
            }
        } catch (err) {
            const message = err.message || 'Failed to update invoice';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteInvoice = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await deleteInvoiceService(id);
            if (response.success) {
                if (onSuccess) onSuccess();
                return true;
            }
        } catch (err) {
            const message = err.message || 'Failed to delete invoice';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const cancelInvoice = async (id, reason) => {
        setLoading(true);
        setError(null);
        try {
            const response = await cancelInvoiceService(id, reason);
            if (response.success) {
                if (onSuccess) onSuccess();
                return true;
            }
        } catch (err) {
            const message = err.message || 'Failed to cancel invoice';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const recordPayment = async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await recordPaymentService(id, data);
            if (response.success) {
                if (onSuccess) onSuccess();
                return response.data;
            }
        } catch (err) {
            const message = err.message || 'Failed to record payment';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        cancelInvoice,
        recordPayment
    };
};