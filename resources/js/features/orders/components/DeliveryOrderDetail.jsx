import React, { useState, useEffect } from 'react';
import { getDeliveryOrder } from '../services/deliveryOrderService';

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

const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// ==================== STATUS STYLES ====================
const getStatusStyle = (status) => {
    const styles = {
        pending: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Pending' },
        intransit: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'In Transit' },
        'in transit': { bg: 'bg-sky-100', text: 'text-sky-700', label: 'In Transit' },
        delivered: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Delivered' },
        returned: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Returned' },
        completed: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Completed' },
        cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    };
    const normalizedStatus = status?.toLowerCase()?.replace(/\s+/g, '') || 'pending';
    return styles[normalizedStatus] || styles.pending;
};

// ==================== MAIN COMPONENT ====================
const DeliveryOrderDetail = ({ deliveryOrderId, onBack }) => {
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (deliveryOrderId) {
            loadDeliveryOrder();
        }
    }, [deliveryOrderId]);

    const loadDeliveryOrder = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDeliveryOrder(deliveryOrderId);
            setDelivery(data);
        } catch (err) {
            console.error('Error loading delivery order detail:', err);
            setError('Gagal memuat detail delivery order');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-slate-500">Memuat detail delivery order...</div>;
    }

    if (error || !delivery) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500 mb-4">{error || 'Data tidak ditemukan'}</p>
                <button onClick={onBack} className="text-indigo-600 hover:underline">Kembali</button>
            </div>
        );
    }

    // Extract data
    const sourceInfo = delivery.source_info || {};
    const doId = delivery.do_id || deliveryOrderId;
    const status = delivery.status;
    const statusStyle = getStatusStyle(status);

    // Driver & vehicle info
    const driverName = delivery.driver_name || delivery.assigned_driver || 'Belum ditugaskan';
    const vehiclePlate = delivery.vehicle_plate || delivery.assigned_vehicle || 'Belum ditugaskan';
    const vehicleType = delivery.vehicle_type || sourceInfo.vehicle_type || '-';

    // Route info
    const originCity = sourceInfo.pickup_city || sourceInfo.origin_city || '-';
    const originAddress = sourceInfo.pickup_address || '-';
    const destCity = sourceInfo.delivery_city || sourceInfo.dest_city || '-';
    const destAddress = sourceInfo.delivery_address || '-';

    // Cargo info
    const weight = sourceInfo.goods_weight || delivery.weight || '-';
    const koli = sourceInfo.koli || sourceInfo.goods_qty || delivery.quantity || '-';
    const volume = sourceInfo.goods_volume || '-';
    const goodsDesc = delivery.goods_summary || sourceInfo.goods_desc || '-';
    const priority = delivery.priority || 'Medium';

    // Dates
    const doDate = delivery.do_date || delivery.created_at;
    const departureDate = delivery.departure_date;
    const eta = delivery.eta;
    const createdAt = delivery.created_at;

    // Customer
    const customerName = delivery.customer?.customer_name || sourceInfo.customer_name || '-';

    // Source info
    const sourceType = delivery.source_type;
    const sourceId = delivery.source_id;
    const sourceLabel = sourceType === 'JO' ? 'Job Order' : 'Manifest';

    // Notes (Catatan Tambahan dari Admin)
    const notes = delivery.notes || '';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Delivery Order
                    </button>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{doId}</h1>
                        <p className="text-slate-600">{customerName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${sourceType === 'JO' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                            {sourceLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Informasi Pengiriman - Left Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Informasi Pengiriman</h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-slate-500">Sumber</p>
                                        <p className="font-medium text-slate-900">{sourceLabel}: {sourceId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Customer</p>
                                        <p className="font-medium text-slate-900">{customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Kota Tujuan</p>
                                        <p className="font-medium text-slate-900">{destCity}</p>
                                        {destAddress && destAddress !== '-' && destAddress !== destCity && (
                                            <p className="text-xs text-slate-500 mt-1">{destAddress}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Driver</p>
                                        <p className={`font-medium ${driverName === 'Belum ditugaskan' ? 'text-amber-600 italic' : 'text-slate-900'}`}>
                                            {driverName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Armada</p>
                                        <p className={`font-medium ${vehiclePlate === 'Belum ditugaskan' ? 'text-amber-600 italic' : 'text-slate-900'}`}>
                                            {vehiclePlate}
                                            {vehicleType && vehicleType !== '-' && vehiclePlate !== 'Belum ditugaskan' && (
                                                <span className="text-slate-500 font-normal"> - {vehicleType}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Tanggal DO</p>
                                        <p className="font-medium text-slate-900">{formatFullDate(doDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Jadwal Keberangkatan</p>
                                        <p className="font-medium text-slate-900">{formatFullDate(departureDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Estimasi Tiba (ETA)</p>
                                        <p className="font-medium text-slate-900">{eta ? formatFullDate(eta) : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Dibuat</p>
                                        <p className="font-medium text-slate-900">{formatDateTime(createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary - Right Column (1/3) */}
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Detail Muatan</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Deskripsi Barang</p>
                                        <p className="font-medium text-slate-900">{goodsDesc}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Berat</p>
                                        <p className="font-medium text-slate-900">{weight} Kg</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Koli</p>
                                        <p className="font-medium text-slate-900">{koli} Koli</p>
                                    </div>
                                    {volume && volume !== '-' && (
                                        <div>
                                            <p className="text-sm text-slate-500">Volume</p>
                                            <p className="font-medium text-slate-900">{volume} m³</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-slate-500">Prioritas</p>
                                        <p className={`font-medium ${priority === 'Urgent' ? 'text-red-600' :
                                            priority === 'High' ? 'text-orange-600' :
                                                priority === 'Medium' ? 'text-amber-600' :
                                                    'text-green-600'
                                            }`}>
                                            {priority}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Catatan Tambahan */}
                            {notes && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                                    <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Catatan Tambahan
                                    </h3>
                                    <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryOrderDetail;
