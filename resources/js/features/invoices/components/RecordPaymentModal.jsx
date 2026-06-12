import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { HiOutlineCash, HiOutlineUpload, HiOutlineX } from 'react-icons/hi';

const RecordPaymentModal = ({
    isOpen,
    onClose,
    onConfirm,
    invoice,
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        paymentDate: '',
        amount: '',
        paymentMethod: 'transfer',
        proofFile: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && invoice) {
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];

            // Calculate remaining amount (total - paid)
            const totalAmount = parseFloat(invoice.total_amount) || 0;
            const paidAmount = parseFloat(invoice.paid_amount) || 0;
            const remainingAmount = totalAmount - paidAmount;

            setFormData({
                paymentDate: today,
                amount: remainingAmount > 0 ? remainingAmount.toString() : '',
                paymentMethod: 'transfer',
                proofFile: null
            });
            setPreviewUrl(null);
            setErrors({});
        }
    }, [isOpen, invoice]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setErrors(prev => ({ ...prev, proofFile: 'Ukuran file maksimal 5MB' }));
                return;
            }
            setFormData(prev => ({ ...prev, proofFile: file }));
            setPreviewUrl(URL.createObjectURL(file));
            if (errors.proofFile) {
                setErrors(prev => ({ ...prev, proofFile: '' }));
            }
        }
    };

    const handleRemoveFile = () => {
        setFormData(prev => ({ ...prev, proofFile: null }));
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.paymentDate) newErrors.paymentDate = 'Tanggal bayar wajib diisi';
        if (!formData.amount) newErrors.amount = 'Nominal wajib diisi';
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Metode pembayaran wajib dipilih';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await onConfirm(invoice.id, formData);
            onClose();
        } catch (error) {
            console.error('Error recording payment:', error);
        }
    };

    const formatCurrency = (value) => {
        if (!value) return '';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            title="Catat Pembayaran"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-100">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            <HiOutlineCash className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-indigo-600 font-medium">Total Tagihan</p>
                            <p className="text-xl font-bold text-indigo-900">{formatCurrency(invoice?.total_amount) || 'Rp 0'}</p>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-3 border-t border-indigo-200">
                        <div className="flex-1">
                            <p className="text-xs text-emerald-600 font-medium">Sudah Dibayar</p>
                            <p className="text-sm font-semibold text-emerald-700">{formatCurrency(invoice?.paid_amount) || 'Rp 0'}</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-rose-600 font-medium">Sisa Tagihan</p>
                            <p className="text-sm font-semibold text-rose-700">{formatCurrency((parseFloat(invoice?.total_amount) || 0) - (parseFloat(invoice?.paid_amount) || 0))}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Tanggal Bayar */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Tanggal Bayar <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="paymentDate"
                            value={formData.paymentDate}
                            onChange={handleChange}
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${errors.paymentDate
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
                                }`}
                        />
                        {errors.paymentDate && (
                            <p className="mt-1 text-xs text-red-500">{errors.paymentDate}</p>
                        )}
                    </div>

                    {/* Nominal */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Nominal yang Dibayar <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0"
                                className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${errors.amount
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
                                    }`}
                            />
                        </div>
                        {errors.amount && (
                            <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                            Bisa pembayaran penuh (Full) atau sebagian (Partial)
                        </p>
                    </div>

                    {/* Metode Pembayaran */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Metode Pembayaran <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleChange}
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${errors.paymentMethod
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
                                }`}
                        >
                            <option value="transfer">Transfer Bank</option>
                            <option value="cash">Tunai</option>
                            <option value="check">Cek / Giro</option>
                        </select>
                        {errors.paymentMethod && (
                            <p className="mt-1 text-xs text-red-500">{errors.paymentMethod}</p>
                        )}
                    </div>

                    {/* Bukti Transfer */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Bukti Transfer <span className="text-slate-400 font-normal">(Opsional)</span>
                        </label>

                        {!previewUrl ? (
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="proof-upload"
                                />
                                <label
                                    htmlFor="proof-upload"
                                    className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-6 hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                        <HiOutlineUpload className="mb-3 h-8 w-8 text-slate-400" />
                                        <p className="mb-2 text-sm text-slate-500">
                                            <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                                        </p>
                                        <p className="text-xs text-slate-500">PNG, JPG, JPEG (Max. 5MB)</p>
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div className="relative rounded-xl border border-slate-200 p-2">
                                <img
                                    src={previewUrl}
                                    alt="Bukti Transfer"
                                    className="h-48 w-full object-contain rounded-lg bg-slate-50"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-slate-400 shadow-md hover:text-red-500 transition-colors"
                                >
                                    <HiOutlineX className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        {errors.proofFile && (
                            <p className="mt-1 text-xs text-red-500">{errors.proofFile}</p>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RecordPaymentModal;
