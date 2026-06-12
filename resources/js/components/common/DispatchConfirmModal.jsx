import React from 'react';
import Modal from './Modal';

const DispatchConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi Keberangkatan',
    message = 'Apakah armada sudah siap berangkat?',
    manifestId = '',
    isLoading = false,
}) => {

    const handleConfirm = async () => {
        try {
            await onConfirm();
        } catch (error) {
            console.error('Error dispatching:', error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            showCloseButton={false}
            closeOnBackdropClick={!isLoading}
        >
            <div className="text-center py-4">
                {/* Truck Icon (Blue/Indigo) */}
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-pulse"></div>
                    <div className="text-indigo-600 relative z-10">
                        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {title}
                    </h3>

                    <div className="space-y-3">
                        <p className="text-slate-600 leading-relaxed">
                            {message}
                        </p>

                        {manifestId && (
                            <div className="mx-auto max-w-xs">
                                <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2">
                                    <p className="text-sm font-bold text-indigo-900">
                                        {manifestId}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mx-4">
                            <p className="text-xs text-blue-800 font-medium flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Status Manifest akan berubah menjadi In Transit
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`
                            flex-1 px-6 py-3 rounded-xl text-white font-semibold 
                            bg-indigo-600 hover:bg-indigo-700
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                            transition flex items-center justify-center
                            ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
                        `}
                    >
                        {isLoading ? (
                            <>
                                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Memproses...
                            </>
                        ) : (
                            'Ya, Berangkatkan'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DispatchConfirmModal;
