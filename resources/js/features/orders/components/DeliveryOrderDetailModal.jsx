import React from 'react';
import Modal from '../../../components/common/Modal';

// ==================== ICONS ====================
const MapPinIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' strokeLinecap='round' strokeLinejoin='round' />
        <circle cx='12' cy='10' r='3' />
    </svg>
);

const TruckIcon = ({ className = 'h-5 w-5' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M14 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2' />
        <path d='M15 18H9' />
        <path d='M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14' />
        <circle cx='17' cy='18' r='2' />
        <circle cx='7' cy='18' r='2' />
    </svg>
);

const UserIcon = ({ className = 'h-5 w-5' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' />
        <circle cx='12' cy='7' r='4' />
    </svg>
);

const PhoneIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

const CalendarIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
        <line x1='16' y1='2' x2='16' y2='6' />
        <line x1='8' y1='2' x2='8' y2='6' />
        <line x1='3' y1='10' x2='21' y2='10' />
    </svg>
);

const ClockIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <circle cx='12' cy='12' r='10' />
        <polyline points='12,6 12,12 16,14' />
    </svg>
);

const PackageIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

const PrintIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M6 9V2h12v7' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M6 14h12v8H6z' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

// ==================== STATUS BADGE ====================
const statusStyles = {
    pending: { label: 'Pending', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    inTransit: { label: 'In Transit', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
    'in transit': { label: 'In Transit', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
    delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    returned: { label: 'Returned', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    completed: { label: 'Completed', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
};

function StatusBadge({ status }) {
    const normalizedStatus = status?.toLowerCase()?.replace(/\s+/g, '') || 'pending';
    const style = statusStyles[normalizedStatus] || statusStyles.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${style.bg} ${style.text} border ${style.border}`}>
            {style.label}
        </span>
    );
}

// ==================== HELPER FUNCTIONS ====================
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const formatFullDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

// ==================== MAIN COMPONENT ====================
export default function DeliveryOrderDetailModal({ isOpen, onClose, delivery }) {
    if (!isOpen || !delivery) return null;

    const raw = delivery.raw || {};
    const sourceInfo = raw.source_info || {};

    // Extract driver & vehicle info
    const driverName = raw.driver_name || delivery.driver || 'Belum ditugaskan';
    const driverPhone = raw.driver_phone || sourceInfo.driver_phone || null;
    const vehiclePlate = raw.vehicle_plate || delivery.vehicle || 'Belum ditugaskan';
    const vehicleType = raw.vehicle_type || sourceInfo.vehicle_type || 'Armada';

    // Extract route info
    const originAddress = sourceInfo.pickup_address || raw.pickup_address || '-';
    const originCity = sourceInfo.pickup_city || sourceInfo.origin_city || delivery.origin || '-';
    const destAddress = sourceInfo.delivery_address || raw.delivery_address || '-';
    const destCity = sourceInfo.delivery_city || sourceInfo.dest_city || delivery.destination || '-';

    // Extract cargo info
    const weight = sourceInfo.goods_weight || raw.weight || delivery.weight || '-';
    const koli = sourceInfo.koli || sourceInfo.goods_qty || raw.quantity || delivery.qty || '-';
    const volume = sourceInfo.goods_volume || '-';
    const goodsDesc = raw.goods_summary || sourceInfo.goods_desc || delivery.goods_desc || '-';

    // Dates
    const doDate = raw.do_date || raw.created_at;
    const departureDate = raw.departure_date;
    const eta = raw.eta;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            showCloseButton={true}
        >
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{delivery.id}</h2>
                        <p className="text-slate-500 mt-1">Tanggal DO: {formatDate(doDate)}</p>
                    </div>
                    <StatusBadge status={delivery.backendStatus || delivery.status} />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Shipping Info */}
                    <div className="space-y-5">
                        {/* Informasi Pengiriman Section */}
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-50 to-slate-50 px-5 py-3 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="h-4 w-4 text-indigo-600" />
                                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Informasi Pengiriman</p>
                                </div>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Customer Penerima */}
                                <div>
                                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-1">Customer Penerima</p>
                                    <p className="font-bold text-slate-900 text-lg">{delivery.customer}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{destAddress}</p>
                                </div>

                                {/* Rute Pengiriman */}
                                <div>
                                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-3">Rute Pengiriman</p>
                                    <div className="flex items-center gap-3">
                                        <div className="inline-flex items-center px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
                                            <span className="font-semibold text-slate-800">{originCity}</span>
                                        </div>
                                        <div className="flex items-center text-slate-300">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </div>
                                        <div className="inline-flex items-center px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
                                            <span className="font-semibold text-slate-800">{destCity}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detail Muatan Section */}
                        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
                            <div className="px-5 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <PackageIcon className="h-4 w-4 text-amber-600" />
                                    <p className="font-semibold text-amber-800">Detail Muatan</p>
                                </div>
                                <p className="text-slate-700 font-medium mb-4">{goodsDesc}</p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/80 rounded-xl px-4 py-3 border border-amber-100">
                                        <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Berat Total</p>
                                        <p className="text-xl font-bold text-slate-900">{weight} <span className="text-sm font-medium text-slate-500">Kg</span></p>
                                    </div>
                                    <div className="bg-white/80 rounded-xl px-4 py-3 border border-amber-100">
                                        <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Qty / Jumlah</p>
                                        <p className="text-xl font-bold text-amber-600">{koli} <span className="text-sm font-medium text-slate-500">Koli</span></p>
                                    </div>
                                </div>

                                {volume && volume !== '-' && (
                                    <div className="mt-3 bg-white/80 rounded-xl px-4 py-3 border border-amber-100">
                                        <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Volume</p>
                                        <p className="text-xl font-bold text-slate-900">{volume} <span className="text-sm font-medium text-slate-500">m³</span></p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Driver & Schedule */}
                    <div className="space-y-5">
                        {/* Armada & Driver Section */}
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-50 to-slate-50 px-5 py-3 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <TruckIcon className="h-4 w-4 text-sky-600" />
                                    <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Armada & Driver</p>
                                </div>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Driver Info */}
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                            <UserIcon className="h-6 w-6 text-slate-500" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 text-lg">{driverName}</p>
                                        {driverPhone && (
                                            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                                <PhoneIcon className="h-4 w-4" />
                                                <span className="text-sm">{driverPhone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Vehicle Badge */}
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 font-bold rounded-lg text-sm border border-indigo-200">
                                        {vehiclePlate}
                                    </span>
                                    <span className="text-slate-500 text-sm">• {vehicleType}</span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline & Status Section */}
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-50 to-slate-50 px-5 py-3 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-emerald-600" />
                                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Timeline & Status</p>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-600">Jadwal Keberangkatan</span>
                                        <span className="font-bold text-slate-900">{formatFullDate(departureDate)}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-slate-600">Estimasi Tiba (ETA)</span>
                                        <span className="font-bold text-slate-900">{eta ? formatFullDate(eta) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Source Info */}
                        {delivery.sourceLabel && (
                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                                <p className="text-xs text-slate-500 font-medium">Sumber</p>
                                <p className="font-semibold text-slate-700 mt-0.5">{delivery.sourceLabel}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                        onClick={() => window.open(`/delivery-orders/${delivery.id}/print`, '_blank')}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-500 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50"
                    >
                        <PrintIcon className="h-4 w-4" />
                        Cetak Surat Jalan
                    </button>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </Modal>
    );
}
