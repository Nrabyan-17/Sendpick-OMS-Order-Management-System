import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineLockClosed, HiOutlineExclamation } from 'react-icons/hi';
import EditModal from '../../../components/common/EditModal';
import { fetchAvailableSources } from '../services/invoiceService';

export default function InvoiceFormModal({ isOpen, onClose, onSubmit, initialData, isLoading = false }) {
    const isEditMode = !!initialData;
    const [availableSources, setAvailableSources] = useState([]);
    const [loadingSources, setLoadingSources] = useState(false);

    // Check if there are any payments made - if so, lock price editing
    const hasPaidAmount = isEditMode && parseFloat(initialData?.paid_amount || 0) > 0;
    const paidAmount = parseFloat(initialData?.paid_amount || 0);

    const [formData, setFormData] = useState({
        source_type: '',
        source_id: '',
        customer_id: '',
        customer_name: '', // Display only
        date: '',
        dueDate: '',
        items: [{ description: '', qty: 1, price: 0 }],
        taxRate: 11, // Default 11%
        notes: '',
    });

    useEffect(() => {
        if (isOpen && !isEditMode) {
            fetchSources();
        }
    }, [isOpen, isEditMode]);

    const fetchSources = async () => {
        setLoadingSources(true);
        try {
            const sources = await fetchAvailableSources();
            setAvailableSources(sources);
        } catch (error) {
            console.error('Failed to fetch available sources:', error);
        } finally {
            setLoadingSources(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Parse items from initialData if available, otherwise default
                // Ensure date is in YYYY-MM-DD format for input[type="date"]
                const formatDateForInput = (dateString) => {
                    if (!dateString) return '';
                    return new Date(dateString).toISOString().split('T')[0];
                };

                setFormData({
                    source_type: initialData.source_type || '',
                    source_id: initialData.source_id || '',
                    customer_id: initialData.customer_id || '',
                    customer_name: initialData.customer || '',
                    date: formatDateForInput(initialData.invoice_date || initialData.date),
                    dueDate: formatDateForInput(initialData.due_date || initialData.dueDate),
                    items: initialData.items || [{ description: 'Jasa Pengiriman', qty: 1, price: parseFloat(initialData.subtotal) || 0 }],
                    taxRate: parseFloat(initialData.tax_rate) || 11,
                    notes: initialData.notes || '',
                });
            } else {
                // Reset for Create mode
                setFormData({
                    source_type: '',
                    source_id: '',
                    customer_id: '',
                    customer_name: '',
                    date: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    items: [{ description: '', qty: 1, price: 0 }],
                    taxRate: 11,
                    notes: '',
                });
            }
        }
    }, [isOpen, initialData]);

    const handleOrderSelect = (e) => {
        const selectedId = e.target.value;
        const source = availableSources.find(s => s.id === selectedId);

        if (source) {
            setFormData(prev => ({
                ...prev,
                source_type: source.type,
                source_id: source.id,
                customer_id: source.customer_id,
                customer_name: source.customer?.customer_name || 'Unknown Customer',
                items: [{
                    description: source.title,
                    qty: 1,
                    price: parseFloat(source.amount) || 0
                }]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                source_type: '',
                source_id: '',
                customer_id: '',
                customer_name: '',
                items: [{ description: '', qty: 1, price: 0 }]
            }));
        }
    };

    const handleItemChange = (index, field, value) => {
        // If already has payments, don't allow changing qty or price
        if (hasPaidAmount && (field === 'qty' || field === 'price')) {
            return;
        }

        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        // If already has payments, don't allow adding items
        if (hasPaidAmount) return;

        setFormData({
            ...formData,
            items: [...formData.items, { description: '', qty: 1, price: 0 }]
        });
    };

    const removeItem = (index) => {
        // If already has payments, don't allow removing items
        if (hasPaidAmount) return;

        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    };

    const calculateTaxAmount = () => {
        const subtotal = calculateSubtotal();
        return subtotal * (formData.taxRate / 100);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const taxAmount = calculateTaxAmount();
        return subtotal + taxAmount;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            source_type: formData.source_type,
            source_id: formData.source_id,
            customer_id: formData.customer_id,
            invoice_date: formData.date,
            due_date: formData.dueDate,
            subtotal: calculateSubtotal(),
            tax_rate: formData.taxRate,
            tax_amount: calculateTaxAmount(),
            total_amount: calculateTotal(),
            notes: formData.notes
        };

        onSubmit(payload);
    };

    // Format currency for display
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <EditModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Invoice' : 'Buat Invoice Baru'}
            size="2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Warning Banner for Locked Fields */}
                {hasPaidAmount && (
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 shrink-0">
                            <HiOutlineExclamation className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-amber-800">
                                Perhatian: Invoice ini sudah memiliki pembayaran
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                                Pembayaran yang sudah masuk: <strong>{formatCurrency(paidAmount)}</strong>.
                                Field <strong>Harga Satuan</strong>, <strong>Qty</strong>, dan <strong>Tax Rate</strong> dikunci
                                untuk mencegah total tagihan berubah menjadi lebih rendah dari jumlah yang sudah dibayar.
                            </p>
                        </div>
                    </div>
                )}

                {/* Order & Customer Section */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Order Referensi <span className="text-rose-500">*</span>
                        </label>
                        {isEditMode ? (
                            <input
                                type="text"
                                value={formData.source_id}
                                disabled
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500"
                            />
                        ) : (
                            <select
                                value={formData.source_id}
                                onChange={handleOrderSelect}
                                required
                                disabled={loadingSources}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="">{loadingSources ? 'Memuat...' : 'Pilih Order...'}</option>
                                {availableSources.map(source => (
                                    <option key={source.id} value={source.id}>
                                        {source.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Nama Customer
                        </label>
                        <input
                            type="text"
                            value={formData.customer_name}
                            readOnly
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500"
                            placeholder="Otomatis terisi..."
                        />
                    </div>
                </div>

                {/* Dates Section */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Tanggal Invoice <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Jatuh Tempo <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            required
                            min={formData.date}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700">
                            Rincian Item / Biaya <span className="text-rose-500">*</span>
                            {hasPaidAmount && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    <HiOutlineLockClosed className="h-3 w-3" />
                                    Terkunci
                                </span>
                            )}
                        </label>
                        <button
                            type="button"
                            onClick={addItem}
                            disabled={hasPaidAmount}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${hasPaidAmount
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                }`}
                            title={hasPaidAmount ? 'Tidak dapat menambah item karena sudah ada pembayaran' : 'Tambah item baru'}
                        >
                            <HiOutlinePlus className="h-4 w-4" />
                            Tambah Item
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex gap-3">
                                <div className="flex-[3]">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        placeholder="Deskripsi item..."
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.qty}
                                        onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                                        placeholder="Qty"
                                        required
                                        disabled={hasPaidAmount}
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${hasPaidAmount
                                            ? 'border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed'
                                            : 'border-slate-200 text-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                                            }`}
                                    />
                                    {hasPaidAmount && (
                                        <HiOutlineLockClosed className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                    )}
                                </div>
                                <div className="flex-[2] relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={item.price}
                                        onChange={(e) => handleItemChange(index, 'price', parseInt(e.target.value) || 0)}
                                        placeholder="Harga Satuan"
                                        required
                                        disabled={hasPaidAmount}
                                        className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${hasPaidAmount
                                            ? 'border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed'
                                            : 'border-slate-200 text-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                                            }`}
                                    />
                                    {hasPaidAmount && (
                                        <HiOutlineLockClosed className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                    )}
                                </div>
                                {formData.items.length > 1 && !hasPaidAmount && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50"
                                    >
                                        <HiOutlineTrash className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary Section */}
                <div className="rounded-2xl bg-slate-50 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                        <div className="flex-1">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Catatan (Opsional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows="3"
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="Catatan tambahan untuk customer..."
                            ></textarea>
                        </div>
                        <div className="w-full space-y-3 sm:w-72">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-medium">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-slate-600 flex items-center gap-1">
                                    Tax Rate (%)
                                    {hasPaidAmount && (
                                        <HiOutlineLockClosed className="h-3 w-3 text-amber-500" />
                                    )}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={formData.taxRate}
                                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                                    disabled={hasPaidAmount}
                                    className={`w-20 rounded-lg border px-3 py-1.5 text-right text-sm focus:outline-none ${hasPaidAmount
                                        ? 'border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed'
                                        : 'border-slate-200 text-slate-700 focus:border-indigo-500'
                                        }`}
                                />
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Tax Amount</span>
                                <span className="font-medium">Rp {calculateTaxAmount().toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3">
                                <div className="flex justify-between text-base font-bold text-slate-800">
                                    <span>Total</span>
                                    <span>Rp {calculateTotal().toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>

                            {/* Show paid amount info if exists */}
                            {hasPaidAmount && (
                                <div className="border-t border-slate-200 pt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-emerald-600 font-medium">Sudah Dibayar</span>
                                        <span className="font-semibold text-emerald-600">{formatCurrency(paidAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-rose-600 font-medium">Sisa Tagihan</span>
                                        <span className="font-semibold text-rose-600">{formatCurrency(calculateTotal() - paidAmount)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 flex justify-end gap-4 border-t border-slate-200 pt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Buat Invoice')}
                    </button>
                </div>
            </form>
        </EditModal>
    );
}