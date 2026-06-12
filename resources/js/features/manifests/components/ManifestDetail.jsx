import React, { useState, useEffect } from 'react';
import { getManifest } from '../services/manifestService';

// ==================== HELPER FUNCTIONS ====================
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

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

// Extract city name from full address
const extractCity = (address) => {
    if (!address) return '-';
    const keywords = [
        'Jakarta Barat', 'Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Utara', 'Jakarta',
        'Bandung', 'Surabaya', 'Semarang', 'Yogyakarta', 'Jogja',
        'Medan', 'Makassar', 'Denpasar', 'Balikpapan', 'Banjarmasin', 'Palembang',
        'Tangerang', 'Bekasi', 'Depok', 'Bogor', 'Malang', 'Solo', 'Surakarta',
        'Cikarang', 'Karawang'
    ];

    for (const keyword of keywords) {
        if (address.toLowerCase().includes(keyword.toLowerCase())) {
            return keyword;
        }
    }
    return address;
};

// ==================== STATUS STYLES ====================
const getStatusStyle = (status) => {
    const styles = {
        pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
        draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
        inprogress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
        'in progress': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
        intransit: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'In Transit' },
        'in transit': { bg: 'bg-sky-100', text: 'text-sky-700', label: 'In Transit' },
        released: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Released' },
        arrived: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Arrived' },
        completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
        cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    };
    const normalizedStatus = status?.toLowerCase()?.replace(/\s+/g, '') || 'pending';
    return styles[normalizedStatus] || styles.pending;
};

// ==================== MAIN COMPONENT ====================
const ManifestDetail = ({ manifestId, onBack }) => {
    const [manifest, setManifest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (manifestId) {
            loadManifestDetail();
        }
    }, [manifestId]);

    const loadManifestDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getManifest(manifestId);
            setManifest(data);
        } catch (err) {
            console.error('Error loading manifest detail:', err);
            setError('Gagal memuat detail manifest');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-slate-500">Memuat detail manifest...</div>;
    }

    if (error || !manifest) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500 mb-4">{error || 'Data tidak ditemukan'}</p>
                <button onClick={onBack} className="text-indigo-600 hover:underline">Kembali</button>
            </div>
        );
    }

    // Extract data from manifest
    const jobOrders = manifest?.jobOrders || manifest?.job_orders || [];
    const driver = manifest?.drivers || manifest?.driver;
    const vehicle = manifest?.vehicles || manifest?.vehicle;
    const status = manifest?.status;
    const statusStyle = getStatusStyle(status);

    // Determine if FTL or LTL
    const isFTL = jobOrders.length === 1 || jobOrders.some(jo => jo.order_type === 'FTL');
    const manifestType = isFTL ? 'FTL' : 'LTL';

    // Calculate totals
    const totalWeight = jobOrders.reduce((sum, jo) => sum + (parseFloat(jo.goods_weight) || 0), 0);
    const totalKoli = jobOrders.reduce((sum, jo) => sum + (parseInt(jo.goods_qty) || 0), 0);
    const totalVolume = jobOrders.reduce((sum, jo) => sum + (parseFloat(jo.goods_volume) || 0), 0);
    const vehicleCapacity = parseFloat(vehicle?.max_capacity) || 4000;
    const capacityUsed = vehicleCapacity > 0 ? ((totalWeight / vehicleCapacity) * 100).toFixed(1) : 0;

    // Extract route info from Job Orders
    const sortedByPickup = [...jobOrders].sort((a, b) => {
        const dateA = new Date(a.pickup_datetime || a.pickup_date || 0);
        const dateB = new Date(b.pickup_datetime || b.pickup_date || 0);
        return dateA - dateB;
    });
    const firstJob = sortedByPickup[0];
    const lastJob = sortedByPickup[sortedByPickup.length - 1];

    // Origin & Destination
    const originCity = jobOrders.length > 0
        ? extractCity(firstJob?.pickup_city || firstJob?.origin_city || manifest?.origin_city)
        : extractCity(manifest?.origin_city);
    const originAddress = firstJob?.pickup_address || manifest?.origin_city || '-';

    const destCity = jobOrders.length > 0
        ? extractCity(lastJob?.delivery_city || lastJob?.destination_city || manifest?.dest_city)
        : extractCity(manifest?.dest_city);
    const destAddress = lastJob?.delivery_address || manifest?.dest_city || '-';

    // Driver & Vehicle info
    const driverName = driver?.driver_name || 'Belum ditugaskan';
    const driverPhone = driver?.phone || '-';
    const vehiclePlate = vehicle?.license_plate || vehicle?.plate_no || 'Belum ditugaskan';
    const vehicleTypeName = vehicle?.vehicle_type?.name || vehicle?.type || '-';

    // Unique customers for LTL
    const uniqueCustomers = [...new Set(jobOrders.map(jo => jo.customer?.customer_name || jo.customer_name).filter(Boolean))];
    const customerDisplay = uniqueCustomers.length > 1
        ? `${uniqueCustomers[0]} (+${uniqueCustomers.length - 1} lainnya)`
        : (uniqueCustomers[0] || '-');

    // Goods descriptions
    const goodsDescriptions = [...new Set(jobOrders.map(jo => jo.goods_desc || jo.commodity).filter(Boolean))];
    const goodsDisplay = goodsDescriptions.length > 2
        ? `${goodsDescriptions.slice(0, 2).join(', ')}...`
        : (goodsDescriptions.join(', ') || '-');

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
                        Kembali ke Manifest
                    </button>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{manifestId}</h1>
                        <p className="text-slate-600">Tujuan: {destCity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${manifestType === 'FTL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {manifestType}
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
                                        <p className="text-sm text-slate-500">Tipe Manifest</p>
                                        <p className="font-medium text-slate-900">{manifestType} ({jobOrders.length} Job Order)</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Customer</p>
                                        <p className="font-medium text-slate-900">{customerDisplay}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Driver</p>
                                        <p className={`font-medium ${driverName === 'Belum ditugaskan' ? 'text-amber-600 italic' : 'text-slate-900'}`}>
                                            {driverName}
                                        </p>
                                        {driverPhone && driverPhone !== '-' && driverName !== 'Belum ditugaskan' && (
                                            <p className="text-xs text-slate-500 mt-1">{driverPhone}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Armada</p>
                                        <p className={`font-medium ${vehiclePlate === 'Belum ditugaskan' ? 'text-amber-600 italic' : 'text-slate-900'}`}>
                                            {vehiclePlate}
                                            {vehicleTypeName && vehicleTypeName !== '-' && vehiclePlate !== 'Belum ditugaskan' && (
                                                <span className="text-slate-500 font-normal"> - {vehicleTypeName}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Tanggal Berangkat</p>
                                        <p className="font-medium text-slate-900">{formatDate(manifest?.planned_departure)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Dibuat</p>
                                        <p className="font-medium text-slate-900">{formatDateTime(manifest?.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Kapasitas Terpakai</p>
                                        <p className={`font-medium ${parseFloat(capacityUsed) > 90 ? 'text-red-600' :
                                            parseFloat(capacityUsed) > 70 ? 'text-amber-600' :
                                                'text-emerald-600'
                                            }`}>
                                            {capacityUsed}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Daftar Job Orders (untuk LTL) */}
                            {jobOrders.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                        Daftar Muatan ({jobOrders.length} Job Order)
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                                                    <th className="pb-3 pr-4">#</th>
                                                    <th className="pb-3 pr-4">Job Order</th>
                                                    <th className="pb-3 pr-4">Customer</th>
                                                    <th className="pb-3 pr-4">Penerima</th>
                                                    <th className="pb-3 pr-4">No. Telp</th>
                                                    <th className="pb-3 pr-4">Barang</th>
                                                    <th className="pb-3 pr-4">Lokasi Tujuan</th>
                                                    <th className="pb-3 pr-4 text-right">Berat</th>
                                                    <th className="pb-3 pr-4 text-right">Koli</th>
                                                    <th className="pb-3 text-center">Titik Lokasi Tujuan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {jobOrders.map((jo, index) => {
                                                    // Prepare location URL for OpenStreetMap
                                                    const hasCoordinates = jo.delivery_lat && jo.delivery_lng;
                                                    const osmUrl = hasCoordinates
                                                        ? `https://www.openstreetmap.org/?mlat=${jo.delivery_lat}&mlon=${jo.delivery_lng}#map=17/${jo.delivery_lat}/${jo.delivery_lng}`
                                                        : null;

                                                    // Extract delivery location
                                                    const deliveryCity = jo.delivery_city || extractCity(jo.delivery_address) || '-';
                                                    const deliveryAddress = jo.delivery_address || '';

                                                    return (
                                                        <tr key={jo.job_order_id || index} className="hover:bg-white/50">
                                                            <td className="py-3 pr-4 text-slate-500">{index + 1}</td>
                                                            <td className="py-3 pr-4">
                                                                <span className="font-medium text-indigo-600">{jo.job_order_id}</span>
                                                                <span className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${jo.order_type === 'FTL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                                    }`}>
                                                                    {jo.order_type || 'LTL'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 pr-4 text-slate-700">{jo.customer?.customer_name || jo.customer_name || '-'}</td>
                                                            <td className="py-3 pr-4 text-slate-700">
                                                                {jo.recipient_name || '-'}
                                                            </td>
                                                            <td className="py-3 pr-4">
                                                                {jo.recipient_phone ? (
                                                                    <a
                                                                        href={`tel:${jo.recipient_phone}`}
                                                                        className="text-indigo-600 hover:underline"
                                                                    >
                                                                        {jo.recipient_phone}
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 pr-4 text-slate-600 truncate max-w-[120px]" title={jo.goods_desc}>
                                                                {jo.goods_desc || '-'}
                                                            </td>
                                                            {/* Lokasi Tujuan */}
                                                            <td className="py-3 pr-4">
                                                                <div>
                                                                    <p className="font-medium text-slate-700">{deliveryCity}</p>
                                                                    {deliveryAddress && deliveryAddress !== deliveryCity && (
                                                                        <p className="text-xs text-slate-400 truncate max-w-[150px]" title={deliveryAddress}>
                                                                            {deliveryAddress}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            {/* Berat & Koli */}
                                                            <td className="py-3 pr-4 text-right text-slate-700">{jo.goods_weight || 0} kg</td>
                                                            <td className="py-3 pr-4 text-right text-slate-700">{jo.goods_qty || '-'}</td>
                                                            {/* Titik Lokasi */}
                                                            <td className="py-3 text-center">
                                                                {hasCoordinates ? (
                                                                    <a
                                                                        href={osmUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title={`Buka di Maps: ${jo.delivery_lat}, ${jo.delivery_lng}`}
                                                                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        </svg>
                                                                    </a>
                                                                ) : (
                                                                    <span
                                                                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
                                                                        title="Koordinat tidak tersedia"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        </svg>
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-slate-300 font-semibold">
                                                    <td colSpan="7" className="pt-3 text-slate-700">Total</td>
                                                    <td className="pt-3 text-right text-slate-900">{totalWeight.toLocaleString('id-ID')} kg</td>
                                                    <td className="pt-3 text-right text-slate-900">{totalKoli}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Detail Muatan - Right Column (1/3) */}
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Detail Muatan</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Deskripsi Barang</p>
                                        <p className="font-medium text-slate-900">{goodsDisplay}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Total Berat</p>
                                        <p className="font-medium text-slate-900">{totalWeight.toLocaleString('id-ID')} Kg</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Total Koli</p>
                                        <p className="font-medium text-slate-900">{totalKoli} Koli</p>
                                    </div>
                                    {totalVolume > 0 && (
                                        <div>
                                            <p className="text-sm text-slate-500">Total Volume</p>
                                            <p className="font-medium text-slate-900">{totalVolume.toLocaleString('id-ID')} m³</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-slate-500">Jumlah Job Order</p>
                                        <p className="font-medium text-slate-900">{jobOrders.length} Order</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Kapasitas Kendaraan</p>
                                        <p className="font-medium text-slate-900">{vehicleCapacity.toLocaleString('id-ID')} Kg</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Utilisasi</p>
                                        <div className="mt-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-medium ${parseFloat(capacityUsed) > 90 ? 'text-red-600' :
                                                    parseFloat(capacityUsed) > 70 ? 'text-amber-600' :
                                                        'text-emerald-600'
                                                    }`}>
                                                    {capacityUsed}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${parseFloat(capacityUsed) > 90 ? 'bg-red-500' :
                                                        parseFloat(capacityUsed) > 70 ? 'bg-amber-500' :
                                                            'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${Math.min(parseFloat(capacityUsed), 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManifestDetail;