import React, { useState } from 'react';
import Modal from './Modal';

/**
 * CancelConfirmModal - Modal untuk konfirmasi pembatalan dengan input alasan
 * 
 * Desain sesuai dengan gambar referensi:
 * - Icon warning kuning di atas
 * - Judul dengan ID item
 * - Deskripsi yang menjelaskan aksi
 * - Textarea untuk alasan pembatalan
 * - Tombol Batal (outline) dan Konfirmasi Pembatalan (merah)
 */
const CancelConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Batalkan',
    itemId = '',
    itemName = '', // Legacy support
    message = 'Apakah Anda yakin ingin membatalkan item ini?',
    statusText = 'Cancelled',
    reasonLabel = 'Alasan Pembatalan',
    reasonPlaceholder = 'Contoh: Salah input nominal...',
    reasonRequired = true,
    isLoading = false,
    confirmLabel = 'Konfirmasi Pembatalan',
    loadingLabel = 'Memproses...',
    cancelLabel = 'Batal',
    backdropOpacity = 'default',
    disableScroll = true,
    hideContentScrollbar = false
}) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        // Validate if reason is required
        if (reasonRequired && !reason.trim()) {
            setError('Alasan pembatalan wajib diisi');
            return;
        }

        try {
            await onConfirm({ cancellation_reason: reason.trim() });
            setReason('');
            setError('');
        } catch (err) {
            console.error('Error cancelling item:', err);
            setError('Gagal membatalkan item');
        }
    };

    const handleClose = () => {
        setReason('');
        setError('');
        onClose();
    };

    // Build display title
    const displayId = itemId || itemName || '';
    const fullTitle = displayId ? `${title} ${displayId}` : title;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="md"
            showCloseButton={false}
            closeOnBackdropClick={!isLoading}
            backdropOpacity={backdropOpacity}
            disableScroll={disableScroll}
            hideContentScrollbar={hideContentScrollbar}
        >
            <div className="text-center py-4 px-2">
                {/* Warning Icon - Yellow Circle with Exclamation */}
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-6">
                    <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Title with Item ID */}
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {fullTitle}
                </h3>

                {/* Description Message */}
                <p className="text-slate-600 mb-1">
                    {message}
                </p>
                <p className="text-slate-600 mb-6">
                    Status akan berubah menjadi <span className="text-red-600 font-semibold">{statusText}</span>.
                </p>

                {/* Reason Input */}
                <div className="text-left mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        {reasonLabel} {reasonRequired && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder={reasonPlaceholder}
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition ${error ? 'border-red-500 bg-red-50' : 'border-slate-300'
                            }`}
                        disabled={isLoading}
                    />
                    {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 transition"
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                {loadingLabel}
                            </span>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CancelConfirmModal;
