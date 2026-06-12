import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';

const CancelOrderModal = ({
    isOpen,
    onClose,
    onConfirm,
    orderId,
    isLoading = false
}) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason.trim()) {
            setError('Alasan pembatalan wajib diisi');
            return;
        }

        try {
            await onConfirm(reason);
            setReason(''); // Reset after success
            setError('');
        } catch (err) {
            console.error('Error confirming cancellation:', err);
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
            size="sm"
            title="Batalkan Order"
        >
            <div className="p-4">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Konfirmasi Pembatalan</h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Apakah Anda yakin ingin membatalkan Job Order <span className="font-semibold text-slate-900">{orderId}</span>?
                        Tindakan ini tidak dapat dikembalikan.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-700">
                            Alasan Pembatalan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="reason"
                            rows="3"
                            className={`w-full rounded-lg border p-2.5 text-sm focus:ring-2 focus:ring-red-500 ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-red-500'
                                }`}
                            placeholder="Contoh: Stok habis, Customer request cancel, dll."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError('');
                            }}
                            disabled={isLoading}
                        ></textarea>
                        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isLoading ? 'Memproses...' : 'Confirm Cancel'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default CancelOrderModal;
