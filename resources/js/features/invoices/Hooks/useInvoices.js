import { useState, useEffect, useCallback } from 'react';
import { fetchInvoices as fetchInvoicesService } from '../services/invoiceService';

export const useInvoices = (initialParams = {}) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    const [params, setParams] = useState(initialParams);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchInvoicesService(params);
            // Service now returns { items, pagination, ... } directly
            setInvoices(response.items);
            setPagination(response.pagination);
        } catch (err) {
            setError(err.message || 'An error occurred while fetching invoices');
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const updateParams = useCallback((newParams) => {
        setParams(prev => ({ ...prev, ...newParams }));
    }, []);

    const refresh = useCallback(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    return {
        invoices,
        loading,
        error,
        pagination,
        updateParams,
        refresh
    };
};