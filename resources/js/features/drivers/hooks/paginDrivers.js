import { useState, useCallback, useEffect } from 'react';
import * as driverService from '../services/driverService';

/**
 * Hook untuk manage drivers dengan pagination & search
 * @param {number} perPage - Items per page
 * @returns {Object} Drivers state & pagination functions
 */
export function useDriversWithPagination(perPage = 15) {

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        perPage: perPage,
        currentPage: 1,
        lastPage: 1,
    });

    /**
     * Fetch drivers dengan filter & pagination
     */
    const fetchDrivers = useCallback(async (page = 1, search = '') => {
        try {
            setLoading(true);
            setError(null);

            // 🔴 Call service dengan params
            const result = await driverService.fetchDrivers({
                page: page,
                per_page: perPage,
                search: search, // Filter by search
                // Bisa tambah filter lain: status, shift, dll
            });

            setDrivers(result.items);
            setPagination(result.pagination);
            setCurrentPage(page);

            console.log('✅ Drivers with pagination loaded');
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat data');
            console.error('❌ Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [perPage]);

    /**
     * Handle search
     * @param {string} query - Search query
     */
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset ke page 1 saat search
        fetchDrivers(1, query); // Fetch dengan search
    }, [fetchDrivers]);

    /**
     * Go to specific page
     * @param {number} page - Page number
     */
    const goToPage = useCallback((page) => {
        if (page >= 1 && page <= pagination.lastPage) {
            fetchDrivers(page, searchQuery);
        }
    }, [fetchDrivers, searchQuery, pagination.lastPage]);

    /**
     * Lanjut ke halaman berikutnya
     */
    const nextPage = useCallback(() => {
        if (currentPage < pagination.lastPage) {
            goToPage(currentPage + 1);
        }
    }, [currentPage, pagination.lastPage, goToPage]);

    /**
     * Kembali ke halaman sebelumnya
     */
    const prevPage = useCallback(() => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    }, [currentPage, goToPage]);

    // 🔵 Initial fetch saat component mount
    useEffect(() => {
        fetchDrivers(1);
    }, [fetchDrivers]);

    return {
        // State
        drivers,
        loading,
        error,
        searchQuery,
        currentPage,
        pagination,

        // Functions
        handleSearch,
        goToPage,
        nextPage,
        prevPage,
        refetch: () => fetchDrivers(currentPage, searchQuery),
    };
}