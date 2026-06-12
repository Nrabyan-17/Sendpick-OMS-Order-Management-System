import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';

const CancelInvoiceModal = ({
    isOpen,
    onClose,
    onConfirm,
    invoice,
    isLoading = false
}) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        if (!reason.trim()) {
            setError('Alasan pembatalan wajib diisi');
            return;
        }

        try {
            await onConfirm(invoice.id, reason);
            setReason('');
            setError('');
            onClose();
        } catch (error) {
            console.error('Error cancelling invoice:', error);
        }
    };

    const handleClose = () => {
        setReason('');
        setError('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="md"
            showCloseButton={false}
            closeOnBackdropClick={!isLoading}
        >
            <div className="text-center py-4">
                {/* Warning Icon */}
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse"></div>
                    <div className="text-amber-600 relative z-10">
                        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                </div>

                <div className="space-y-6 px-4">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Batalkan Invoice {invoice?.id}
                        </h3>
                        <p className="mt-2 text-slate-600">
                            Apakah Anda yakin ingin membatalkan invoice ini? Status akan berubah menjadi <span className="font-semibold text-red-600">Cancelled</span>.
                        </p>
                    </div>

                    <div className="text-left">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Alasan Pembatalan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError('');
                            }}
                            rows="3"
                            className={`
                                w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                                placeholder:text-slate-400
                                ${error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 bg-slate-50'}
                            `}
                            placeholder="Contoh: Salah input nominal..."
                            disabled={isLoading}
                        ></textarea>
                        {error && (
                            <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 mt-8 px-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 group relative px-6 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex-1 group relative px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg shadow-red-200 transition-all duration-200 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Memproses...
                            </span>
                        ) : (
                            'Konfirmasi Pembatalan'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CancelInvoiceModal;