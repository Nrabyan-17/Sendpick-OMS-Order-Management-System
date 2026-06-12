import React from 'react';
import { HiOutlineDocumentText, HiOutlinePrinter, HiOutlineDownload, HiOutlineCash } from 'react-icons/hi';
import Modal from '../../../components/common/Modal';

// Status styles configuration
const statusStyles = {
    paid: {
        label: 'Paid',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
    },
    pending: {
        label: 'Pending',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
    },
    overdue: {
        label: 'Overdue',
        bg: 'bg-rose-100',
        text: 'text-rose-700',
        border: 'border-rose-200',
    },
    partial: {
        label: 'Partial',
        bg: 'bg-sky-100',
        text: 'text-sky-700',
        border: 'border-sky-200',
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
    },
};

function StatusBadge({ status }) {
    const style = statusStyles[status?.toLowerCase()] ?? statusStyles.pending;
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${style.bg} ${style.text} border ${style.border}`}>
            {style.label}
        </span>
    );
}

export default function InvoiceDetailModal({ isOpen, onClose, invoice }) {
    if (!isOpen || !invoice) return null;

    // Helper to parse currency value safely
    const parseCurrencyValue = (value) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value) || 0;
        return 0;
    };

    // Helper for date formatting
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(parseCurrencyValue(value));
    };

    const invoiceAmount = invoice.amount || invoice.total_amount || 0;
    const invoiceTax = invoice.tax_amount || invoice.tax || 0;

    // Mock items if not present (since initial mock data doesn't have items)
    const items = invoice.items || [
        {
            description: 'Jasa Pengiriman (Default)',
            qty: 1,
            price: parseCurrencyValue(invoiceAmount) - parseCurrencyValue(invoiceTax)
        }
    ];

    // Recalculate based on available data
    let displayItems = items;
    if (!invoice.items || invoice.items.length === 0) {
        const totalVal = parseCurrencyValue(invoice.total_amount || invoice.amount || 0);
        const taxVal = parseCurrencyValue(invoice.tax_amount || invoice.tax || 0);
        const subtotalVal = invoice.subtotal ? parseCurrencyValue(invoice.subtotal) : (totalVal - taxVal);

        displayItems = [{
            description: 'Jasa Pengiriman (Default)',
            qty: 1,
            price: subtotalVal
        }];
    }

    const subtotal = displayItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate) : 11;
    const tax = invoice.tax_amount ? parseCurrencyValue(invoice.tax_amount) : (subtotal * (taxRate / 100));
    const total = subtotal + tax;

    // Get payments array - sort by date descending (newest first)
    const payments = (invoice.payments || []).sort((a, b) =>
        new Date(b.payment_date) - new Date(a.payment_date)
    );

    // Calculate total payments received
    const totalPaid = parseCurrencyValue(invoice.paid_amount) ||
        payments.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Detail Invoice #${invoice.id}`}
            size="2xl"
        >
            <div className="flex flex-col h-full">
                {/* Content */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Invoice Header Info with Status Badge */}
                    <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <StatusBadge status={invoice.status} />
                                {/* Show overdue indicator if status is Overdue */}
                                {invoice.status?.toLowerCase() === 'overdue' && invoice.days_overdue > 0 && (
                                    <span className="text-xs text-rose-500 font-medium">
                                        {invoice.days_overdue} hari lewat jatuh tempo
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</label>
                                <p className="mt-1 text-base font-semibold text-slate-900">{invoice.customer}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order ID</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                                        {invoice.orderId}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 md:text-right">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tanggal Invoice</label>
                                <p className="mt-1 text-base font-medium text-slate-900">{formatDate(invoice.date)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jatuh Tempo</label>
                                <p className={`mt-1 text-base font-medium ${invoice.status?.toLowerCase() === 'overdue' ? 'text-rose-600' : 'text-slate-900'
                                    }`}>
                                    {formatDate(invoice.dueDate)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary Card - Only show if there are payments or partial/paid status */}
                    {(totalPaid > 0 || ['partial', 'paid'].includes(invoice.status?.toLowerCase())) && (
                        <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border border-indigo-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                        <HiOutlineCash className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Ringkasan Pembayaran</p>
                                        <p className="text-xs text-slate-500">{payments.length} transaksi pembayaran</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Total Dibayar</p>
                                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                                    <p className="text-xs text-slate-500">dari {formatCurrency(invoice.total_amount)}</p>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-3">
                                <div className="h-2 w-full rounded-full bg-slate-200">
                                    <div
                                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                                        style={{
                                            width: `${Math.min(100, (totalPaid / parseCurrencyValue(invoice.total_amount)) * 100)}%`
                                        }}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-slate-500 text-right">
                                    {((totalPaid / parseCurrencyValue(invoice.total_amount)) * 100).toFixed(1)}% terbayar
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Deskripsi Item</th>
                                    <th className="px-6 py-3 font-semibold text-center">Qty</th>
                                    <th className="px-6 py-3 font-semibold text-right">Harga Satuan</th>
                                    <th className="px-6 py-3 font-semibold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {displayItems.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.description}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{item.qty}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">Rp {item.price.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            Rp {(item.qty * item.price).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td colSpan="3" className="px-6 py-3 text-right font-semibold text-slate-600">Subtotal</td>
                                    <td className="px-6 py-3 text-right font-semibold text-slate-900">Rp {subtotal.toLocaleString('id-ID')}</td>
                                </tr>
                                <tr>
                                    <td colSpan="3" className="px-6 py-3 text-right font-semibold text-slate-600">
                                        Pajak (PPN {invoice.tax_rate ? parseFloat(invoice.tax_rate) : 11}%)
                                    </td>
                                    <td className="px-6 py-3 text-right font-semibold text-slate-900">Rp {tax.toLocaleString('id-ID')}</td>
                                </tr>
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-right text-base font-bold text-slate-900">Total Tagihan</td>
                                    <td className="px-6 py-4 text-right text-base font-bold text-indigo-600">Rp {total.toLocaleString('id-ID')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Notes Section */}
                    {invoice.notes && (
                        <div className="mb-4 rounded-2xl border border-slate-200 bg-amber-50 p-6">
                            <h4 className="mb-2 text-sm font-bold text-slate-900">Catatan</h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                    )}

                    {/* Cancellation Note Section */}
                    {invoice.status === 'Cancelled' && invoice.cancellation_note && (
                        <div className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 p-6">
                            <h4 className="mb-2 text-sm font-bold text-rose-900">Alasan Pembatalan</h4>
                            <p className="text-sm text-rose-600 whitespace-pre-wrap">{invoice.cancellation_note}</p>
                        </div>
                    )}

                    {/* Payment History */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                            <HiOutlineDocumentText className="h-5 w-5 text-slate-500" />
                            Riwayat Pembayaran
                        </h4>

                        {payments.length > 0 ? (
                            <div className="space-y-3">
                                {/* List all payments */}
                                {payments.map((payment, index) => (
                                    <div
                                        key={payment.id || index}
                                        className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${index === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                <HiOutlineCash className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    Pembayaran #{payments.length - index}
                                                    {index === 0 && (
                                                        <span className="ml-2 text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                                                            Terakhir
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500 capitalize">
                                                    {payment.payment_method || '-'}
                                                </p>
                                                {payment.notes && (
                                                    <p className="text-xs text-slate-400 mt-1 italic">{payment.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatDate(payment.payment_date)}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Total Summary */}
                                <div className="flex items-center justify-between rounded-xl bg-indigo-50 p-4 border border-indigo-100 mt-4">
                                    <div>
                                        <p className="text-sm font-semibold text-indigo-900">Total Pembayaran Masuk</p>
                                        <p className="text-xs text-indigo-600">{payments.length} kali pembayaran</p>
                                    </div>
                                    <p className="text-lg font-bold text-indigo-700">
                                        {formatCurrency(totalPaid)}
                                    </p>
                                </div>

                                {/* Remaining amount if not fully paid */}
                                {invoice.status?.toLowerCase() !== 'paid' && (
                                    <div className="flex items-center justify-between rounded-xl bg-rose-50 p-4 border border-rose-100">
                                        <div>
                                            <p className="text-sm font-semibold text-rose-900">Sisa Tagihan</p>
                                            <p className="text-xs text-rose-600">Belum terbayar</p>
                                        </div>
                                        <p className="text-lg font-bold text-rose-700">
                                            {formatCurrency(parseCurrencyValue(invoice.total_amount) - totalPaid)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="mb-2 rounded-full bg-slate-200 p-3 text-slate-400">
                                    <HiOutlineDocumentText className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium text-slate-900">Belum ada pembayaran</p>
                                <p className="text-xs text-slate-500">Invoice ini belum memiliki riwayat pembayaran.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6 mt-6">
                    <button
                        type="button"
                        onClick={() => {
                            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
                            window.open(`${baseUrl}/invoices/${invoice.invoice_id}/pdf`, '_blank');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                    >
                        <HiOutlinePrinter className="h-4 w-4" />
                        Cetak
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
                            window.open(`${baseUrl}/invoices/${invoice.invoice_id}/pdf`, '_blank');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300"
                    >
                        <HiOutlineDownload className="h-4 w-4" />
                        Download PDF
                    </button>
                </div>
            </div>
        </Modal>
    );
}