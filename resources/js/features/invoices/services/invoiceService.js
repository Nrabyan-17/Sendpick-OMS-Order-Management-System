import api from '../../../utils/api';

const INVOICES_ENDPOINT = '/invoices';
const AVAILABLE_SOURCES_ENDPOINT = '/invoices/available-sources';
const RECORD_PAYMENT_ENDPOINT = (invoiceId) => `/invoices/${invoiceId}/record-payment`;
const CANCEL_INVOICE_ENDPOINT = (invoiceId) => `/invoices/${invoiceId}/cancel`;

const normalizePagination = (payload = {}) => ({
    total: payload.total ?? payload.meta?.total ?? 0,
    perPage: payload.per_page ?? payload.perPage ?? payload.meta?.per_page ?? 0,
    currentPage: payload.current_page ?? payload.currentPage ?? payload.meta?.current_page ?? 1,
    lastPage: payload.last_page ?? payload.lastPage ?? payload.meta?.last_page ?? 1,
    from: payload.from ?? payload.meta?.from ?? null,
    to: payload.to ?? payload.meta?.to ?? null,
});

const extractListPayload = (response) => {
    const topLevel = response?.data ?? {};
    const listNode = topLevel.data ?? topLevel.items ?? topLevel;

    const items = Array.isArray(listNode)
        ? listNode
        : Array.isArray(listNode.data)
            ? listNode.data
            : Array.isArray(topLevel?.data?.data)
                ? topLevel.data.data
                : [];

    return {
        items,
        pagination: normalizePagination(topLevel.pagination ?? listNode.pagination ?? listNode.meta ?? {}),
        meta: topLevel.meta ?? listNode.meta ?? null,
        message: topLevel.message ?? null,
        raw: topLevel,
    };
};

const normalizeError = (error, fallbackMessage) => {
    const normalized = new Error(error?.response?.data?.message ?? fallbackMessage);
    normalized.status = error?.response?.status;
    normalized.errors = error?.response?.data?.errors ?? null;
    normalized.raw = error;
    return normalized;
};

export async function fetchInvoices(params = {}) {
    try {
        const response = await api.get(INVOICES_ENDPOINT, { params });
        return extractListPayload(response);
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat data invoice');
    }
}

export async function getInvoice(invoiceId) {
    try {
        const response = await api.get(`${INVOICES_ENDPOINT}/${invoiceId}`);
        return response?.data?.data ?? null;
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat detail invoice');
    }
}

export async function createInvoice(payload) {
    try {
        const response = await api.post(INVOICES_ENDPOINT, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Invoice berhasil dibuat',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal membuat invoice');
    }
}

export async function updateInvoice(invoiceId, payload) {
    try {
        const response = await api.put(`${INVOICES_ENDPOINT}/${invoiceId}`, payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Invoice berhasil diperbarui',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal memperbarui invoice');
    }
}

export async function deleteInvoice(invoiceId) {
    try {
        const response = await api.delete(`${INVOICES_ENDPOINT}/${invoiceId}`);
        return {
            success: true,
            message: response?.data?.message ?? 'Invoice berhasil dihapus',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal menghapus invoice');
    }
}

export async function fetchAvailableSources() {
    try {
        const response = await api.get(AVAILABLE_SOURCES_ENDPOINT);
        return Array.isArray(response?.data?.data) ? response.data.data : [];
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat sumber invoice');
    }
}

export async function recordPayment(invoiceId, payload) {
    try {
        const response = await api.post(RECORD_PAYMENT_ENDPOINT(invoiceId), payload);
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Pembayaran berhasil dicatat',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal mencatat pembayaran');
    }
}

export async function cancelInvoice(invoiceId, reason) {
    try {
        const response = await api.post(CANCEL_INVOICE_ENDPOINT(invoiceId), { reason });
        return {
            success: true,
            data: response?.data?.data ?? null,
            message: response?.data?.message ?? 'Invoice berhasil dibatalkan',
        };
    } catch (error) {
        throw normalizeError(error, 'Gagal membatalkan invoice');
    }
}

export async function fetchInvoiceStats(params = {}) {
    try {
        const response = await api.get(`${INVOICES_ENDPOINT}/stats`, { params });
        return response?.data?.data ?? null;
    } catch (error) {
        throw normalizeError(error, 'Gagal memuat statistik invoice');
    }
}