import React, { useEffect, useMemo, useState } from 'react';
import { Ban, Play, Search, Download, Plus, ChevronDown, Pencil, Trash2, Eye, ClipboardList, CheckCircle2, Clock, Printer } from 'lucide-react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import EditModal from '../../../components/common/EditModal';
import CancelConfirmModal from '../../../components/common/CancelConfirmModal';
import ManifestDetail from './ManifestDetail';
import Pagination from '../../../components/common/Pagination';
import { useManifests } from '../hooks/useManifest';
import { useManifestJobOrders } from '../hooks/useManifestJobOrders';
import { getAvailableDrivers } from '../../drivers/services/driverService';
import { fetchAvailableVehicles } from '../../vehicles/services/vehicleService';

// Jumlah data per halaman
const ITEMS_PER_PAGE = 6;

// Icon wrappers using Lucide React
const BanIcon = ({ className = 'h-4 w-4' }) => <Ban className={className} />;
const PlayIcon = ({ className = 'h-4 w-4' }) => <Play className={className} />;

const summaryCardsBase = [
    {
        key: 'total',
        title: 'Total Manifest',
        description: 'Semua manifest aktif',
        value: '0',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        icon: <ClipboardList className='h-5 w-5' />,
    },
    {
        key: 'completed',
        title: 'Packing Completed',
        description: 'Selesai diverifikasi QC',
        value: '0',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-500',
        icon: <CheckCircle2 className='h-5 w-5' />,
    },
    {
        key: 'inProgress',
        title: 'Dalam Proses',
        description: 'Menunggu loading kendaraan',
        value: '0',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-500',
        icon: <Clock className='h-5 w-5' />,
    },
    {
        key: 'average',
        title: 'Average Lead Time',
        description: 'Dari receiving hingga dispatch',
        value: '3.5 Jam',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-500',
        icon: <Clock className='h-5 w-5' />,
    },
];

const MANIFEST_STATUS_MAP = {
    draft: 'draft',
    pending: 'pending',
    inprogress: 'inProgress',
    released: 'released',
    completed: 'completed',
    intransit: 'inProgress',
};

const normalizeManifestStatus = (status) => {
    if (!status) return 'pending';
    const normalized = status.toString().toLowerCase().replace(/\s+/g, '');
    return MANIFEST_STATUS_MAP[normalized] ?? 'pending';
};

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

/**
 * Menentukan label "Rute Manifest" secara dinamis berdasarkan daftar Job Order yang dipilih (Case LTL).
 * ✅ UPDATED: Prioritaskan field kota (pickup_city, delivery_city) sebelum alamat
 * 
 * @param {Array} jobOrders - Array Job Orders dengan properties:
 *   - pickup_city atau origin_city
 *   - delivery_city atau destination_city  
 *   - pickup_datetime (Date/String)
 *   - delivery_datetime_estimation (Date/String)
 * @returns {String} - Route name label, contoh: "Jakarta -> Surabaya (Multi-stop)"
 */
const getManifestRouteName = (jobOrders) => {
    // Validasi input
    if (!Array.isArray(jobOrders) || jobOrders.length === 0) {
        return '-';
    }

    // 1. SORTING: Urutkan berdasarkan pickup_datetime secara Ascending (Terlama ke Terbaru)
    const sortedByPickup = [...jobOrders].sort((a, b) => {
        const dateA = new Date(a.pickup_datetime || a.pickup_date || 0);
        const dateB = new Date(b.pickup_datetime || b.pickup_date || 0);
        return dateA - dateB;
    });

    // 2. TENTUKAN START NODE: prioritaskan pickup_city (field khusus kota)
    const firstJob = sortedByPickup[0];
    const startNode = extractCity(
        firstJob.pickup_city ||          // Field kota khusus (prioritas 1)
        firstJob.origin_city ||          // Legacy field (prioritas 2)
        firstJob.origin ||               // Fallback (prioritas 3)
        firstJob.pickup_address ||       // Alamat lengkap (prioritas terakhir)
        '-'
    );

    // 3. TENTUKAN END NODE: prioritaskan delivery_city (field khusus kota)
    // Sort by delivery time untuk menentukan EndNode yang paling akurat jika rutenya bercabang
    const sortedByDelivery = [...jobOrders].sort((a, b) => {
        const dateA = new Date(a.delivery_datetime_estimation || a.delivery_date || a.estimated_delivery || 0);
        const dateB = new Date(b.delivery_datetime_estimation || b.delivery_date || b.estimated_delivery || 0);
        return dateB - dateA; // Descending: terbaru ke terlama
    });

    const lastDeliveryJob = sortedByDelivery[0]; // Item dengan delivery time paling akhir
    const endNode = extractCity(
        lastDeliveryJob.delivery_city ||    // Field kota khusus (prioritas 1)
        lastDeliveryJob.destination_city || // Legacy field (prioritas 2)
        lastDeliveryJob.destination ||      // Fallback (prioritas 3)
        lastDeliveryJob.delivery_address || // Alamat lengkap (prioritas terakhir)
        '-'
    );

    // 4. HANDLING DUPLIKAT
    if (startNode === endNode) {
        // Pengiriman dalam kota yang sama
        if (jobOrders.length > 1) {
            return `${startNode} (Multi-stop)`;
        }
        return startNode;
    }

    // 5. Format string dengan arrow
    let routeLabel = `${startNode} --> ${endNode}`;

    // 6. TAMBAHAN UI: Jika jumlah Job Order > 1, tambahkan suffix "(Multi-stop)"
    if (jobOrders.length > 1) {
        routeLabel = `${routeLabel} (Multi-stop)`;
    }

    return routeLabel;
};

/**
 * Versi ringkas untuk tampilan tabel - HANYA menampilkan KOTA TUJUAN dari Job Orders
 * ✅ UPDATED: Tidak lagi menampilkan origin → destination
 * - FTL (1 Job Order): Tampilkan 1 kota tujuan saja
 * - LTL (Multi Job Order): Tampilkan tujuan JO1 → tujuan JO2 (berdasarkan urutan delivery)
 * 
 * @param {Array} jobOrders - Array Job Orders
 * @returns {Object} - { firstDestination, lastDestination, isMultiStop }
 */
const getManifestRouteForTable = (jobOrders) => {
    if (!Array.isArray(jobOrders) || jobOrders.length === 0) {
        return { firstDestination: '-', lastDestination: null, isMultiStop: false };
    }

    // FTL: Single destination only
    if (jobOrders.length === 1) {
        const jo = jobOrders[0];
        const destination = extractCity(
            jo.delivery_city ||
            jo.destination_city ||
            jo.destination ||
            jo.delivery_address ||
            '-'
        );
        return { firstDestination: destination, lastDestination: null, isMultiStop: false };
    }

    // LTL: Multiple destinations - sort by delivery time
    const sortedByDelivery = [...jobOrders].sort((a, b) => {
        const dateA = new Date(a.delivery_datetime_estimation || a.delivery_date || a.estimated_delivery || 0);
        const dateB = new Date(b.delivery_datetime_estimation || b.delivery_date || b.estimated_delivery || 0);
        return dateA - dateB; // Ascending: earliest to latest
    });

    const firstJob = sortedByDelivery[0];
    const lastJob = sortedByDelivery[sortedByDelivery.length - 1];

    const firstDestination = extractCity(
        firstJob.delivery_city ||
        firstJob.destination_city ||
        firstJob.destination ||
        firstJob.delivery_address ||
        '-'
    );

    const lastDestination = extractCity(
        lastJob.delivery_city ||
        lastJob.destination_city ||
        lastJob.destination ||
        lastJob.delivery_address ||
        '-'
    );

    // If both destinations are the same, show just one
    if (firstDestination === lastDestination) {
        return { firstDestination, lastDestination: null, isMultiStop: true };
    }

    return { firstDestination, lastDestination, isMultiStop: true };
};

const mapManifestFromApi = (manifest) => {
    if (!manifest) {
        return null;
    }

    const jobOrders = Array.isArray(manifest.jobOrders) ? manifest.jobOrders : (Array.isArray(manifest.job_orders) ? manifest.job_orders : []);
    const jobOrderIds = jobOrders.map(jo => jo.job_order_id).filter(Boolean);

    // Fix Job Order Display: Show first ID + count of others
    let jobOrderDisplay = '-';
    if (jobOrderIds.length === 1) {
        jobOrderDisplay = jobOrderIds[0];
    } else if (jobOrderIds.length > 1) {
        jobOrderDisplay = `${jobOrderIds[0]} (+${jobOrderIds.length - 1} others)`;
    }

    const jobOrderTooltip = jobOrderIds.join(', ');

    const primaryJobOrder = jobOrders[0];

    // Fix Misplaced Data: Customer Name might be in cargo_summary if not in jobOrder
    let customerName = primaryJobOrder?.customer?.customer_name;

    // If Cancelled, job orders might be detached, so we can't rely on them for customer name.
    // However, we don't have a snapshot of customer name in manifest table (yet).
    // But we can try to use cargo_summary if it looks like a name, OR just show '-' if we can't recover it.
    // The user requirement says: "Tetap tampilkan 'PT. Maju Jaya', tapi statusnya merah."
    // Since we didn't add a customer_name column to manifests table, we might lose this info upon detach.
    // BUT, the user said: "Simpan 'Snapshot' customer/berat...". 
    // We implemented snapshot for weight/summary in backend (by NOT updating them to 0).
    // For customer name, if it's not in cargo_summary, we might lose it unless we added a column.
    // Let's assume for now we rely on what we have. If cargo_summary has text, use it?
    // Actually, the previous logic:
    if (!customerName && manifest.cargo_summary && !manifest.cargo_summary.match(/\d/)) {
        customerName = manifest.cargo_summary;
    }

    // ✅ CHECK: If manifest is Cancelled, always show 0 for all cargo values
    // A cancelled manifest is "empty" - all job orders have been returned to pending
    const isCancelled = manifest.status?.toLowerCase() === 'cancelled';

    // Filter untuk menentukan Job Order aktif (exclude Cancelled JOs)
    const activeJobOrders = jobOrders.filter(jo => jo.status !== 'Cancelled');

    // Cargo Summary should be calculated from ACTIVE Job Orders only
    const commodity = activeJobOrders.map(jo => jo.commodity || jo.goods_desc).filter(Boolean).join(', ');

    // ✅ FIXED (2025-12-22): For Cancelled manifests, always show "0 packages"
    // For active manifests, calculate from ACTIVE job orders only (exclude Cancelled JOs)
    // This ensures that when a JO is cancelled, the Manifest shows reduced total
    let cargoSummary;
    if (isCancelled) {
        cargoSummary = '0 packages';
    } else if (activeJobOrders.length > 0) {
        cargoSummary = `${activeJobOrders.length} packages${commodity ? ': ' + commodity.substring(0, 50) : ''}`;
    } else {
        // All JOs might be cancelled but Manifest is still active
        cargoSummary = '0 packages';
    }

    // ✅ FIXED (2025-12-22): Calculate weight and packages from ACTIVE Job Orders only
    // For Cancelled manifests: always 0
    // For Active manifests: sum from ACTIVE JOs only (exclude Cancelled)
    const totalPackages = isCancelled ? 0 : activeJobOrders.reduce((sum, jo) => {
        const qty = Number(jo.goods_qty || jo.quantity || jo.koli || 0);
        return sum + qty;
    }, 0);

    const totalWeight = isCancelled ? 0 : activeJobOrders.reduce((sum, jo) => {
        const weight = Number(jo.goods_weight || jo.weight || 0);
        return sum + weight;
    }, 0);

    // ✅ FIXED: Customer display logic for LTL
    // If LTL with multiple unique customers, show "Multi-Customer (Mixed)"
    const uniqueCustomers = [...new Set(jobOrders.map(jo => jo.customer?.customer_name || jo.customer_name).filter(Boolean))];
    const isFTL = jobOrders.some(jo => jo.order_type === 'FTL');
    let displayCustomerName = customerName;

    if (!isFTL && uniqueCustomers.length > 1) {
        displayCustomerName = 'Multi-Customer (Mixed)';
    } else if (!isFTL && uniqueCustomers.length === 1) {
        displayCustomerName = uniqueCustomers[0];
    }

    // ✅ NEW: Calculate Route Preview for Edit form (using existing getManifestRouteName helper)
    const routePreview = jobOrders.length > 0
        ? getManifestRouteName(jobOrders)
        : `${extractCity(manifest.origin_city)} --> ${extractCity(manifest.dest_city)}`;

    // ✅ Extract driver_id and vehicle_id for form pre-population
    // Try from direct manifest fields first, then from relationships
    const driverId = manifest.driver_id || manifest.drivers?.driver_id || null;
    const vehicleId = manifest.vehicle_id || manifest.vehicles?.vehicle_id || null;

    console.log('🗺️ mapManifestFromApi - Driver/Vehicle IDs:', {
        manifest_id: manifest.manifest_id,
        driver_id: driverId,
        vehicle_id: vehicleId,
        drivers_relation: manifest.drivers,
        vehicles_relation: manifest.vehicles,
    });

    // ✅ Format shipmentDate for both display and form input
    // HTML date input requires yyyy-mm-dd format
    const shipmentDateRaw = manifest.planned_departure
        ? manifest.planned_departure.split('T')[0]  // Extract date part from ISO string
        : '';
    const shipmentDateDisplay = manifest.planned_departure
        ? new Date(manifest.planned_departure).toLocaleDateString('id-ID')
        : '-';

    return {
        id: manifest.manifest_id ?? manifest.id,
        jobOrder: jobOrderDisplay,
        jobOrderTooltip: jobOrderTooltip,
        // ✅ PENTING: Simpan array Job Order IDs untuk form Edit
        jobOrders: jobOrderIds,
        // ✅ Simpan data lengkap job orders untuk referensi (termasuk order_type)
        jobOrdersData: jobOrders,
        customer: displayCustomerName || '-',
        // ✅ FIX: Separate raw origin/destination for form vs display for table
        // Raw values from database for form editing
        origin: manifest.origin_city || '',
        destination: manifest.dest_city || '',
        // ✅ UPDATED: Display values for table - HANYA KOTA TUJUAN
        // Menggunakan getManifestRouteForTable yang mengembalikan object { firstDestination, lastDestination, isMultiStop }
        ...(() => {
            const routeInfo = jobOrders.length > 0
                ? getManifestRouteForTable(jobOrders)
                : { firstDestination: extractCity(manifest.dest_city), lastDestination: null, isMultiStop: false };
            return {
                // Kota tujuan pertama (untuk LTL: tujuan JO pertama, untuk FTL: satu-satunya tujuan)
                firstDestination: routeInfo.firstDestination,
                // Kota tujuan terakhir (hanya untuk LTL dengan multiple destinations berbeda)
                lastDestination: routeInfo.lastDestination,
                // Flag untuk menampilkan badge Multi-stop
                isMultiStopRoute: routeInfo.isMultiStop,
            };
        })(),
        // ✅ NEW: Route Preview for form Edit (full label with Multi-stop indicator)
        routePreview: routePreview,
        packages: totalPackages,
        // ✅ FIXED: For Cancelled manifests, always show "0 kg"
        // For active manifests, use calculated weight or fallback to database
        // Note: Use !== null/undefined check instead of truthy check to handle 0 correctly
        totalWeightValue: totalWeight,
        totalWeight: isCancelled
            ? '0 kg'
            : (jobOrders.length > 0
                ? `${totalWeight.toLocaleString('id-ID')} kg`
                : (manifest.cargo_weight !== null && manifest.cargo_weight !== undefined
                    ? `${Number(manifest.cargo_weight).toLocaleString('id-ID')} kg`
                    : '-')),
        status: manifest.status ?? 'Pending',
        hub: (manifest.origin_city ?? '').toLowerCase().includes('jakarta')
            ? 'jakarta'
            : (manifest.origin_city ?? '').toLowerCase().includes('surabaya')
                ? 'surabaya'
                : (manifest.origin_city ?? '').toLowerCase().includes('bandung')
                    ? 'bandung'
                    : 'all',
        // ✅ FIX: Use raw date format for form, display format for table
        shipmentDate: shipmentDateRaw, // For form input (yyyy-mm-dd)
        shipmentDateDisplay: shipmentDateDisplay, // For table display (dd/mm/yyyy)
        // ✅ FIX: Tambahkan driver dan vehicle ID untuk form Edit (dropdown pre-population)
        // Convert to string for dropdown value compatibility
        driver: driverId ? String(driverId) : '',
        vehicle: vehicleId ? String(vehicleId) : '',
        // Display names for table
        driverName: manifest.drivers?.driver_name || manifest.driver?.driver_name || 'Belum Assign',
        vehiclePlate: manifest.vehicles?.plate_no || manifest.vehicle?.plate_no,
        vehicleBrand: manifest.vehicles?.brand || manifest.vehicle?.brand,
        lastUpdate: manifest.updated_at ? new Date(manifest.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        raw: manifest,
        cargoSummary: cargoSummary,
        // ✅ NEW: Add isFTL flag and jobOrderCount for Multi-stop logic
        isFTL: isFTL,
        jobOrderCount: jobOrders.length,
    };
};

const statusStyles = {
    draft: {
        label: 'Draft',
        bg: 'bg-slate-100',
        text: 'text-slate-500',
    },
    pending: {
        label: 'Pending',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
    inTransit: {
        label: 'In Transit',
        bg: 'bg-sky-50',
        text: 'text-sky-600',
    },
    arrived: {
        label: 'Arrived',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
    },
    completed: {
        label: 'Completed',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-red-50',
        text: 'text-red-600',
    },
};

const statusFilterOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Transit', label: 'In Transit' },
    { value: 'Arrived', label: 'Arrived' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

const hubFilterOptions = [
    { value: 'all', label: 'Semua Hub' },
    { value: 'jakarta', label: 'Jakarta DC' },
    { value: 'surabaya', label: 'Surabaya Hub' },
    { value: 'bandung', label: 'Bandung Hub' },
];

const manifestStatusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'In Transit', label: 'In Transit' },
    { value: 'Arrived', label: 'Arrived' },
    { value: 'Completed', label: 'Completed' },
];

// Dummy data dihapus - sekarang menggunakan data real dari API

// Icon wrappers using Lucide React
const SearchIcon = ({ className = 'h-5 w-5' }) => <Search className={className} />;
const DownloadIcon = ({ className = 'h-4 w-4' }) => <Download className={className} />;
const PlusIcon = ({ className = 'h-4 w-4' }) => <Plus className={className} />;
const ChevronDownIcon = ({ className = 'h-4 w-4' }) => <ChevronDown className={className} />;
const EditIcon = ({ className = 'h-4 w-4' }) => <Pencil className={className} />;
const TrashIcon = ({ className = 'h-4 w-4' }) => <Trash2 className={className} />;
const EyeIcon = ({ className = 'h-4 w-4' }) => <Eye className={className} />;
const PrinterIcon = ({ className = 'h-4 w-4' }) => <Printer className={className} />;

function SummaryCard({ card }) {
    return (
        <article className='flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div>
                <p className='text-sm text-slate-400'>{card.title}</p>
                <p className='mt-2 text-3xl font-semibold text-slate-900'>{card.value}</p>
                <p className='mt-1 text-xs text-slate-400'>{card.description}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor}`}>
                {card.icon}
            </div>
        </article>
    );
}

function StatusBadge({ status }) {
    // Normalize status to match keys in statusStyles (camelCase)
    const normalizedStatus = status ? status.charAt(0).toLowerCase() + status.slice(1).replace(/\s+/g, '') : 'draft';
    // Handle specific cases if needed, e.g., 'In Transit' -> 'inTransit'

    const style = statusStyles[normalizedStatus] || statusStyles.draft;

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
            {status || 'Draft'}
        </span>
    );
}

function ManifestRow({ manifest, onEdit, onDelete, onViewDetail, onPrint }) {

    return (
        <tr className='transition-colors hover:bg-slate-50'>
            <td className='whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-800'>{manifest.id}</td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='space-y-1'>
                    <p className='font-semibold text-slate-700'>{manifest.customer}</p>
                    <p className='text-xs text-slate-400' title={manifest.jobOrderTooltip}>Job Order: {manifest.jobOrder}</p>
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='flex flex-col gap-0.5'>
                    {/* ✅ UPDATED: Tampilan KOTA TUJUAN saja (bukan origin → destination) */}
                    {/* FTL: Satu kota tujuan | LTL: Tujuan1 ↓ Tujuan2 */}
                    <span className='font-semibold text-slate-800'>{manifest.firstDestination || '-'}</span>
                    {manifest.lastDestination && (
                        <>
                            <span className='text-slate-400 text-xs'>↓</span>
                            <span className='font-medium text-slate-700'>{manifest.lastDestination}</span>
                        </>
                    )}
                    {/* Show Multi-stop indicator ONLY for LTL with multiple destinations */}
                    {manifest.isMultiStopRoute && (
                        <span className='inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 w-fit mt-1'>
                            Multi-stop
                        </span>
                    )}
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='space-y-1'>
                    <p className='font-medium text-slate-700'>{manifest.totalWeight} • {manifest.packages} koli</p>
                    <p className='text-xs text-slate-400 truncate max-w-[120px]' title={manifest.cargoSummary}>
                        {manifest.cargoSummary}
                    </p>
                </div>
            </td>
            <td className='px-6 py-4'>
                <StatusBadge status={manifest.status} />
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>{manifest.shipmentDateDisplay}</td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                {manifest.driverName !== 'Belum Assign' ? (
                    <div className='flex flex-col'>
                        <span className='font-medium text-slate-900'>{manifest.driverName}</span>
                        {manifest.vehiclePlate && (
                            <span className='text-xs text-slate-500'>
                                {manifest.vehiclePlate} {manifest.vehicleBrand ? `(${manifest.vehicleBrand})` : ''}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-500`}>
                        Belum Assign
                    </span>
                )}
            </td>
            <td className='px-6 py-4 text-right text-xs text-slate-400'>{manifest.lastUpdate}</td>
            <td className='px-6 py-4'>
                <div className='flex items-center gap-1'>
                    {/* Print Button */}
                    <button
                        type='button'
                        onClick={() => onPrint(manifest)}
                        className='inline-flex items-center justify-center rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'
                        title='Cetak PDF'
                    >
                        <PrinterIcon className='h-4 w-4' />
                    </button>
                    <button
                        type='button'
                        onClick={() => onViewDetail(manifest)}
                        className='inline-flex items-center justify-center rounded-lg bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50'
                        title='Lihat Detail Manifest'
                    >
                        <EyeIcon className='h-4 w-4' />
                    </button>
                    <button
                        type='button'
                        onClick={() => onEdit(manifest)}
                        disabled={manifest.status === 'Cancelled'}
                        className={`inline-flex items-center justify-center rounded-lg bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${manifest.status === 'Cancelled' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title='Edit manifest'
                    >
                        <EditIcon className='h-4 w-4' />
                    </button>
                    <button
                        type='button'
                        onClick={() => onDelete(manifest)}
                        disabled={manifest.status === 'Cancelled'}
                        className={`inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${manifest.status === 'Cancelled' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title='Batalkan Manifest'
                    >
                        <BanIcon className='h-4 w-4' />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function ManifestTable({
    records,
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    hubFilter,
    onHubChange,
    onAddManifest,
    onEditManifest,
    onDeleteManifest,
    onViewManifest,
    onPrint, // Print button in header
    onPrintRow, // Print single row/manifest
    loading,
    error,
    // Pagination props
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    onPageChange,
}) {
    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                    <h2 className='text-lg font-semibold text-slate-900'>Daftar Manifest & Packing List</h2>
                    <p className='text-sm text-slate-400'>Pantau status packing, loading, dan release manifest.</p>
                </div>
                <div className='flex w-full flex-col gap-3 md:w-auto'>
                    {/* Search and Filters Row */}
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                        <div className='group relative min-w-[240px] flex-1'>
                            <span className='pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400'>
                                <SearchIcon className='h-5 w-5' />
                            </span>
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder='Cari manifest, customer, atau tujuan...'
                                className='w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                            />
                        </div>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                            <FilterDropdown
                                value={statusFilter}
                                onChange={onStatusChange}
                                options={statusFilterOptions}
                                widthClass='w-full sm:w-40'
                            />
                            <FilterDropdown
                                value={hubFilter}
                                onChange={onHubChange}
                                options={hubFilterOptions}
                                widthClass='w-full sm:w-44'
                            />
                        </div>
                    </div>
                    {/* Action Buttons Row */}
                    <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
                        <button
                            type='button'
                            onClick={onAddManifest}
                            className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 sm:w-auto'
                        >
                            <PlusIcon className='h-4 w-4' />
                            Tambah Manifest
                        </button>
                    </div>
                </div>
            </div>
            <div className='mt-6 overflow-x-auto'>
                <table className='w-full min-w-[920px] border-collapse'>
                    <thead>
                        <tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                            <th className='px-6 py-3'>Manifest</th>
                            <th className='px-6 py-3'>Customer</th>
                            <th className='px-6 py-3'>Kota Tujuan</th>
                            <th className='px-6 py-3'>Koli & Berat</th>
                            <th className='px-6 py-3'>Status</th>
                            <th className='px-6 py-3'>Tgl Kirim</th>
                            <th className='px-6 py-3'>DRIVER / ARMADA</th>
                            <th className='px-6 py-3 text-right'>Update Terakhir</th>
                            <th className='px-6 py-3 text-center'>Aksi</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {loading ? (
                            <tr>
                                <td colSpan={9} className='px-6 py-12 text-center text-sm text-slate-400'>
                                    Memuat data manifest...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={9} className='px-6 py-12 text-center text-sm text-rose-500'>
                                    {error}
                                </td>
                            </tr>
                        ) : records.length > 0 ? (
                            records.map((manifest) => (
                                <ManifestRow
                                    key={manifest.id}
                                    manifest={manifest}
                                    onEdit={onEditManifest}
                                    onDelete={onDeleteManifest}
                                    onViewDetail={onViewManifest}
                                    onPrint={onPrintRow}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className='px-6 py-12 text-center text-sm text-slate-400'>
                                    Tidak ada manifest yang sesuai dengan filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={ITEMS_PER_PAGE}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={onPageChange}
            />
        </section>
    );
}

export default function ManifestContent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [hubFilter, setHubFilter] = useState('all');
    const [editModal, setEditModal] = useState({ isOpen: false, manifest: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, manifest: null });
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail'
    const [selectedManifestId, setSelectedManifestId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const {
        manifests,
        loading: manifestsLoading,
        error: manifestsError,
        createManifest,
        updateManifest,
        cancelManifest,
    } = useManifests({ per_page: 50 });

    // Filtered lists state
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    // Fetch available drivers and vehicles when edit modal opens
    useEffect(() => {
        if (editModal.isOpen) {
            const loadResources = async () => {
                try {
                    const [driversData, vehiclesData] = await Promise.all([
                        getAvailableDrivers(),
                        fetchAvailableVehicles({ min_capacity: 0 })
                    ]);
                    setDrivers(driversData);
                    setVehicles(vehiclesData);
                } catch (error) {
                    console.error("Failed to load drivers/vehicles", error);
                }
            };
            loadResources();
        }
    }, [editModal.isOpen]);

    // Transform API data to display format (no more fallback to dummy data)
    const manifestRecords = useMemo(() => {
        if (Array.isArray(manifests) && manifests.length > 0) {
            return manifests
                .map(mapManifestFromApi)
                .filter(Boolean);
        }
        return []; // Return empty array instead of fallback
    }, [manifests]);

    const summaryCards = useMemo(() => {
        const baseCards = summaryCardsBase.map((card) => ({ ...card }));
        if (!manifestRecords || manifestRecords.length === 0) {
            return baseCards;
        }

        const totals = manifestRecords.reduce(
            (acc, manifest) => {
                const normalizedStatus = normalizeManifestStatus(manifest.status);
                acc.total += 1;
                if (normalizedStatus === 'completed') acc.completed += 1;
                if (['pending', 'inProgress', 'draft'].includes(normalizedStatus)) acc.inProgress += 1;
                return acc;
            },
            { total: 0, completed: 0, inProgress: 0 },
        );

        return summaryCardsBase.map((card) => {
            if (card.key === 'total') {
                return { ...card, value: totals.total.toString() };
            }
            if (card.key === 'completed') {
                const percentage = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;
                return {
                    ...card,
                    value: totals.completed.toString(),
                    description: `${percentage}% manifest selesai`,
                };
            }
            if (card.key === 'inProgress') {
                return { ...card, value: totals.inProgress.toString() };
            }
            return card;
        });
    }, [manifestRecords]);

    const { fetchAvailableJobOrders } = useManifestJobOrders();
    const [rawAvailableJobOrders, setRawAvailableJobOrders] = useState([]);

    useEffect(() => {
        if (editModal.isOpen) {
            const loadJobOrders = async () => {
                try {
                    // Use 'create' for new manifests to fetch all unassigned orders
                    const manifestId = editModal.manifest?.id || 'create';
                    const response = await fetchAvailableJobOrders(manifestId);

                    // The API returns { data: { available_job_orders: [...] } }
                    const orders = response?.available_job_orders || [];

                    // DEBUG: Log raw API response
                    console.log('📡 Raw API Response for Job Orders:', response);
                    console.log('📡 Available Job Orders:', orders);
                    if (orders.length > 0) {
                        console.log('📡 First Job Order Structure:', {
                            job_order_id: orders[0].job_order_id,
                            order_type: orders[0].order_type,
                            assignment: orders[0].assignment,
                            assignments: orders[0].assignments,
                            driver_id: orders[0].driver_id,
                            vehicle_id: orders[0].vehicle_id,
                            fullObject: orders[0]
                        });
                    }

                    setRawAvailableJobOrders(Array.isArray(orders) ? orders : []);
                } catch (error) {
                    console.error("Failed to load job orders", error);
                    setRawAvailableJobOrders([]);
                }
            };
            loadJobOrders();
        }
    }, [editModal.isOpen, editModal.manifest, fetchAvailableJobOrders]);

    const availableJobOrders = useMemo(() => {
        return (rawAvailableJobOrders || []).map(jo => ({
            value: jo.job_order_id,
            label: `${jo.job_order_id} - ${jo.customer_name || 'No Customer'}`,
            status: jo.status,
            details: jo
        }));
    }, [rawAvailableJobOrders]);

    const availableDrivers = useMemo(() => {
        const baseDrivers = (drivers || []).map(d => ({
            value: String(d.driver_id),
            label: d.driver_name
        }));

        // Merge drivers found in Job Orders (to handle FTL assignments that might be missing from base list)
        (rawAvailableJobOrders || []).forEach(jo => {
            let dId = jo.driver_id || jo.assigned_driver_id;
            let dName = jo.driver_name || jo.driver;

            // Check assignment (Singular - New Backend Structure)
            if (jo.assignment && jo.assignment.status === 'Active') {
                dId = jo.assignment.driver_id || dId;
                dName = jo.assignment.driver_name || dName;
            }
            // Check assignments (Array - Legacy/Fallback) - ONLY use Active assignments
            else if (Array.isArray(jo.assignments)) {
                const active = jo.assignments.find(a => a.status === 'Active' || a.status === 'active');
                if (active) {
                    dId = active.driver_id || dId;
                    dName = active.driver_name || active.driver?.driver_name || active.driver?.name || dName;
                }
            }

            if (dId) {
                const exists = baseDrivers.some(d => String(d.value) === String(dId));
                if (!exists) {
                    const label = dName || `Driver ${dId}`;
                    console.log(`Injecting Auto-Driver: ${dId} - ${label}`);
                    baseDrivers.push({ value: String(dId), label: label.includes('(Auto)') ? label : `${label} (Auto)` });
                }
            }
        });

        return baseDrivers;
    }, [drivers, rawAvailableJobOrders]);

    const availableVehicles = useMemo(() => {
        const baseVehicles = (vehicles || []).map(v => ({
            value: String(v.vehicle_id),
            label: `${v.plate_no} - ${v.vehicle_type?.name || v.brand || 'Unknown'}`
        }));

        // Merge vehicles found in Job Orders
        (rawAvailableJobOrders || []).forEach(jo => {
            let vId = jo.vehicle_id || jo.assigned_vehicle_id;
            let vPlate = jo.plate_no || jo.vehicle_plate || jo.vehicle;

            // Check assignment (Singular - New Backend Structure) - ONLY use Active
            if (jo.assignment && jo.assignment.status === 'Active') {
                vId = jo.assignment.vehicle_id || vId;
                vPlate = jo.assignment.vehicle_plate || vPlate;
            }
            // Check assignments (Array - Legacy/Fallback) - ONLY use Active assignments
            else if (Array.isArray(jo.assignments)) {
                const active = jo.assignments.find(a => a.status === 'Active' || a.status === 'active');
                if (active) {
                    vId = active.vehicle_id || vId;
                    vPlate = active.plate_no || active.vehicle?.plate_no || active.vehicle?.plate_number || vPlate;
                }
            }

            if (vId) {
                const exists = baseVehicles.some(v => String(v.value) === String(vId));
                if (!exists) {
                    const label = vPlate || `Vehicle ${vId}`;
                    console.log(`Injecting Auto-Vehicle: ${vId} - ${label}`);
                    baseVehicles.push({ value: String(vId), label: label.includes('(Auto)') ? label : `${label} (Auto)` });
                }
            }
        });

        return baseVehicles;
    }, [vehicles, rawAvailableJobOrders]);

    // State untuk alert/warning saat memilih Job Order
    const [selectionAlert, setSelectionAlert] = useState({ show: false, message: '', type: 'warning' });

    // Helper untuk mendapatkan service type dari Job Order
    const getServiceType = (jobOrder) => {
        if (!jobOrder) return null;
        const orderType = jobOrder.order_type || jobOrder.jobOrderType || jobOrder.service_type;
        if (orderType === 'FTL' || (orderType || '').includes('FTL')) return 'FTL';
        if (orderType === 'LTL' || (orderType || '').includes('LTL')) return 'LTL';
        return null;
    };

    // Helper to check if FTL is selected in form data
    const isFTLSelected = (formData) => {
        const selectedIds = formData.jobOrders || [];
        if (!selectedIds.length) return false;

        const selectedData = availableJobOrders
            .filter(option => selectedIds.includes(option.value))
            .map(option => option.details);

        return selectedData.some(jo => getServiceType(jo) === 'FTL');
    };

    // Helper to check if LTL is selected in form data
    const isLTLSelected = (formData) => {
        const selectedIds = formData.jobOrders || [];
        if (!selectedIds.length) return false;

        const selectedData = availableJobOrders
            .filter(option => selectedIds.includes(option.value))
            .map(option => option.details);

        return selectedData.some(jo => getServiceType(jo) === 'LTL');
    };

    // Fungsi validasi dan handler untuk Job Order selection (FTL/LTL rules)
    const validateJobOrderSelection = (currentSelection, newJobOrderId) => {
        // Ambil data Job Order yang baru dipilih
        const newJobOrder = availableJobOrders.find(jo => jo.value === newJobOrderId)?.details;
        if (!newJobOrder) {
            return { valid: true, error: null };
        }

        const newServiceType = getServiceType(newJobOrder);

        // Jika ini adalah item pertama, langsung valid
        if (!currentSelection || currentSelection.length === 0) {
            return { valid: true, error: null };
        }

        // Ambil data Job Orders yang sudah terpilih
        const existingJobOrders = availableJobOrders
            .filter(jo => currentSelection.includes(jo.value))
            .map(jo => jo.details);

        // Cek apakah sudah ada FTL yang dipilih
        const hasFTL = existingJobOrders.some(jo => getServiceType(jo) === 'FTL');
        const hasLTL = existingJobOrders.some(jo => getServiceType(jo) === 'LTL');

        // RULE 1: Jika sudah ada FTL, tidak boleh tambah apapun
        if (hasFTL) {
            return {
                valid: false,
                error: '⚠️ Tidak bisa menambah Job Order lagi. FTL bersifat eksklusif (1 item saja).'
            };
        }

        // RULE 2: Jika sudah ada LTL dan mencoba menambah FTL
        if (hasLTL && newServiceType === 'FTL') {
            return {
                valid: false,
                error: '⚠️ Tidak bisa menggabungkan FTL dengan LTL dalam satu Manifest.'
            };
        }

        // RULE 3: Jika mencoba menambah FTL saat sudah ada item lain
        if (newServiceType === 'FTL' && currentSelection.length > 0) {
            return {
                valid: false,
                error: '⚠️ FTL tidak bisa digabung dengan Job Order lain. FTL bersifat eksklusif.'
            };
        }

        // Valid: LTL + LTL atau item pertama
        return { valid: true, error: null };
    };

    // Fungsi untuk mendapatkan opsi Job Order yang tersedia berdasarkan seleksi saat ini
    const getFilteredJobOrderOptions = (currentSelection) => {
        if (!currentSelection || currentSelection.length === 0) {
            // Semua opsi tersedia jika belum ada seleksi
            return availableJobOrders.map(jo => ({
                value: jo.value,
                label: jo.label,
                disabled: false,
                serviceType: getServiceType(jo.details)
            }));
        }

        // Cek tipe service dari item yang sudah terpilih
        const existingJobOrders = availableJobOrders
            .filter(jo => currentSelection.includes(jo.value))
            .map(jo => jo.details);

        const hasFTL = existingJobOrders.some(jo => getServiceType(jo) === 'FTL');
        const hasLTL = existingJobOrders.some(jo => getServiceType(jo) === 'LTL');

        return availableJobOrders.map(jo => {
            const serviceType = getServiceType(jo.details);
            let disabled = false;
            let disabledReason = '';

            // Jika sudah ada FTL, disable semua opsi lain
            if (hasFTL) {
                disabled = !currentSelection.includes(jo.value);
                disabledReason = 'FTL bersifat eksklusif';
            }
            // Jika sudah ada LTL, disable semua FTL
            else if (hasLTL && serviceType === 'FTL') {
                disabled = true;
                disabledReason = 'Tidak bisa menggabungkan FTL dan LTL';
            }

            return {
                value: jo.value,
                label: disabled ? `${jo.label} (${disabledReason})` : jo.label,
                disabled,
                serviceType
            };
        });
    };

    // Custom handler untuk perubahan Job Order dengan validasi FTL/LTL
    const handleJobOrderChange = (selectedIds) => {
        // Reset alert
        setSelectionAlert({ show: false, message: '', type: 'warning' });

        // Jika menghapus item, langsung jalankan tanpa validasi
        // (Validasi hanya diperlukan saat menambah item baru)
        return { valid: true, selectedIds };
    };

    // Custom handler for auto-fill Driver <-> Vehicle AND Job Orders calculation
    const handleFieldChange = (name, value, setFormData) => {
        // Standard field update
        setFormData(prev => ({ ...prev, [name]: value }));

        // 1. MANIFEST AUTO-FILL: Calculate combined data when Job Orders change
        if (name === 'jobOrders') {
            const selectedIds = Array.isArray(value) ? value : (value ? [value] : []);
            const combinedData = calculateCombinedData(selectedIds);

            if (combinedData) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value, // Ensure jobOrders is updated
                    ...combinedData // Merge calculated fields (origin, dest, driver, vehicle, etc.)
                }));
            }
        }

        // 2. DRIVER <-> VEHICLE AUTO-FILL
        // Auto-fill Vehicle from Driver
        if (name === 'driver') {
            const selectedDriver = drivers.find(d => String(d.driver_id) === String(value));
            // Backend sends 'assigned_vehicle' object
            if (selectedDriver?.assigned_vehicle?.vehicle_id) {
                const vehicleId = String(selectedDriver.assigned_vehicle.vehicle_id);
                const isInOptions = availableVehicles.some(v => v.value === vehicleId);

                if (isInOptions) {
                    setFormData(prev => ({ ...prev, vehicle: vehicleId }));
                }
            }
        }

        // Auto-fill Driver from Vehicle
        if (name === 'vehicle') {
            const selectedVehicle = vehicles.find(v => String(v.vehicle_id) === String(value));
            if (selectedVehicle?.driver_id) {
                const driverId = String(selectedVehicle.driver_id);
                const isInOptions = availableDrivers.some(d => d.value === driverId);

                if (isInOptions) {
                    setFormData(prev => ({ ...prev, driver: driverId }));
                }
            }
        }
    };

    const manifestFields = [
        {
            name: 'jobOrders',
            label: 'Pilih Job Order',
            type: 'multiselect',
            required: true,
            options: availableJobOrders.map(jo => ({ value: jo.value, label: jo.label })),
            // ✅ Props baru untuk validasi FTL/LTL
            getFilteredOptions: getFilteredJobOrderOptions,
            validateSelection: validateJobOrderSelection,
            getServiceType: (jobOrderId) => {
                // 1. Cari di availableJobOrders (untuk Create atau Job Order yang masih available)
                const jo = availableJobOrders.find(j => j.value === jobOrderId);
                if (jo) {
                    const serviceType = getServiceType(jo.details);
                    console.log(`🔍 getServiceType(${jobOrderId}) dari availableJobOrders:`, serviceType);
                    return serviceType;
                }

                // 2. Fallback: Cari di manifest yang sedang di-edit (jobOrdersData)
                if (editModal.manifest?.jobOrdersData) {
                    const existingJo = editModal.manifest.jobOrdersData.find(j => j.job_order_id === jobOrderId);
                    if (existingJo) {
                        const serviceType = getServiceType(existingJo);
                        console.log(`🔍 getServiceType(${jobOrderId}) dari jobOrdersData:`, serviceType);
                        return serviceType;
                    }
                }

                // 3. Fallback: Cari di raw manifest data
                if (editModal.manifest?.raw?.job_orders || editModal.manifest?.raw?.jobOrders) {
                    const rawJobOrders = editModal.manifest.raw.job_orders || editModal.manifest.raw.jobOrders || [];
                    const rawJo = rawJobOrders.find(j => j.job_order_id === jobOrderId);
                    if (rawJo) {
                        const serviceType = getServiceType(rawJo);
                        console.log(`🔍 getServiceType(${jobOrderId}) dari raw data:`, serviceType);
                        return serviceType;
                    }
                }

                console.log(`⚠️ getServiceType(${jobOrderId}): Job Order tidak ditemukan`);
                return null;
            },
            description: '💡 FTL = Eksklusif (1 item). LTL = Multi-select (hanya sesama LTL).'
        },
        // ✅ UPDATED: Hide Customer field for LTL mode (prevents confusion with multi-customer)
        {
            name: 'customer',
            label: 'Customer',
            type: 'text',
            required: false,
            readOnly: true,
            // Hide this field when LTL is selected (multi-customer scenario)
            hidden: (formData) => isLTLSelected(formData)
        },
        { name: 'origin', label: 'Origin', type: 'text', required: false, readOnly: true },
        { name: 'destination', label: 'Destination', type: 'text', required: false, readOnly: true },
        {
            name: 'routePreview',
            label: 'Rute Manifest',
            type: 'text',
            required: false,
            readOnly: true,
            description: '✨ Rute dihitung otomatis berdasarkan Job Order yang dipilih.'
        },
        { name: 'shipmentDate', label: 'Shipment Date', type: 'date', required: true },
        // ✅ RENAMED: 'Total Packages' → 'Total Koli' for clarity (matches physical packages count)
        { name: 'packages', label: 'Total Koli', type: 'number', required: false, readOnly: true },
        { name: 'totalWeight', label: 'Total Weight (kg)', type: 'text', required: false, readOnly: true },
        {
            name: 'driver',
            label: 'Driver',
            type: 'select',
            required: false,
            options: availableDrivers,
            // Disable if FTL (Auto-filled & Locked)
            disabled: (formData) => isFTLSelected(formData),
            description: (formData) => isFTLSelected(formData)
                ? 'Untuk FTL, driver terisi otomatis dan terkunci.'
                : 'Pilih driver untuk pengiriman. Kendaraan akan dipilih driver melalui mobile app.'
        },
        // ✅ NEW: Catatan Tambahan untuk Assignment (LTL only)
        {
            name: 'assignmentNote',
            label: 'Catatan Assignment',
            type: 'textarea',
            required: false,
            placeholder: 'Catatan tambahan untuk penugasan driver (opsional)...',
            rows: 3,
            // Only show for LTL mode (not FTL)
            hidden: (formData) => isFTLSelected(formData) || !isLTLSelected(formData),
            description: 'Catatan ini akan tercatat di histori assignment Job Order.'
        },
    ];

    // Fungsi untuk menghitung data gabungan dari Job Orders yang dipilih
    const calculateCombinedData = (selectedJobOrderIds) => {
        if (!selectedJobOrderIds || selectedJobOrderIds.length === 0) {
            return {
                customer: '',
                origin: '',
                destination: '',
                routePreview: '',
                packages: 0,
                totalWeight: '',
                driver: '',
                vehicle: ''
            };
        }

        const selectedData = availableJobOrders
            .filter(option => selectedJobOrderIds.includes(option.value))
            .map(option => option.details);

        if (selectedData.length === 0) {
            return {
                customer: '',
                origin: '',
                destination: '',
                routePreview: '',
                packages: 0,
                totalWeight: '',
                driver: '',
                vehicle: ''
            };
        }

        // Menggabungkan customer (jika berbeda, pisahkan dengan koma)
        const uniqueCustomers = [...new Set(selectedData.map(data => data.customer_name))];
        // ✅ UPDATED: Customer display logic for LTL
        let customer = uniqueCustomers.join(', ');

        // Cek FTL status sebelum menentukan label Customer
        const isFTLCheck = selectedData.some(jo =>
            (jo.order_type === 'FTL' || jo.jobOrderType === 'FTL' || jo.service_type === 'FTL' || (jo.order_type || '').includes('FTL'))
        );

        if (!isFTLCheck && uniqueCustomers.length > 1) {
            customer = 'Multi-Customer (Mixed)';
        }

        // ✅ UPDATED: Use sorting logic for origin/destination (same as getManifestRouteName)
        // Sort by pickup time (ascending) untuk menentukan StartNode
        const sortedByPickup = [...selectedData].sort((a, b) => {
            const dateA = new Date(a.pickup_datetime || a.pickup_date || 0);
            const dateB = new Date(b.pickup_datetime || b.pickup_date || 0);
            return dateA - dateB;
        });
        const origin = sortedByPickup[0]?.pickup_address || sortedByPickup[0]?.origin_city || '-';

        // Sort by delivery time (descending) untuk menentukan EndNode
        const sortedByDelivery = [...selectedData].sort((a, b) => {
            const dateA = new Date(a.delivery_datetime_estimation || a.delivery_date || a.estimated_delivery || 0);
            const dateB = new Date(b.delivery_datetime_estimation || b.delivery_date || b.estimated_delivery || 0);
            return dateB - dateA;
        });
        const destination = sortedByDelivery[0]?.delivery_address || sortedByDelivery[0]?.destination_city || '-';

        // ✅ NEW: Generate route label preview for form
        const routePreview = getManifestRouteName(selectedData);

        // Menghitung total packages (SUM of goods_qty / quantity)
        // ✅ FIXED: Use SUM of goods_qty (koli) instead of counting job orders
        const totalPackages = selectedData.reduce((sum, data) => {
            // Check possible field names for quantity/koli
            const qty = Number(data.goods_qty || data.quantity || data.koli || 0);
            return sum + qty;
        }, 0);

        // Menghitung total weight
        const totalWeightKg = selectedData.reduce((sum, data) => {
            return sum + (Number(data.goods_weight) || 0);
        }, 0);

        // Calculate Cargo Summary (Goods Description)
        const uniqueGoods = [...new Set(selectedData.map(data => data.goods_desc).filter(Boolean))];
        const cargoSummary = uniqueGoods.join(', ');

        // --- FTL/LTL LOGIC ---
        // Cek apakah Job Order yang dipilih bertipe FTL
        // Asumsi: Jika salah satu FTL, maka manifest dianggap FTL (atau biasanya FTL cuma 1 JO)
        const primaryJob = selectedData[0];

        // DEBUG: Log struktur data Job Order yang dipilih
        console.log('📦 Selected Job Order Data:', {
            job_order_id: primaryJob?.job_order_id,
            order_type: primaryJob?.order_type,
            service_type: primaryJob?.service_type,
            assignment: primaryJob?.assignment,
            assignments: primaryJob?.assignments,
            driver_id: primaryJob?.driver_id,
            vehicle_id: primaryJob?.vehicle_id,
            fullObject: primaryJob
        });

        const isFTL = selectedData.some(jo =>
            (jo.order_type === 'FTL' || jo.jobOrderType === 'FTL' || jo.service_type === 'FTL' || (jo.order_type || '').includes('FTL'))
        );

        console.log('🚛 Is FTL Order?', isFTL);

        let autoDriver = '';
        let autoVehicle = '';

        // ✅ FIXED: Deklarasi variabel yang hilang
        let foundDriverId = null;
        let foundVehicleId = null;

        if (isFTL && primaryJob) {
            console.log('🔍 FTL Detected, attempting auto-fill for:', primaryJob);

            // 1. Coba ambil dari assignment (Singular - Priority from Backend)
            // ✅ FIXED: Only use Active assignments for auto-fill
            if (primaryJob.assignment &&
                (primaryJob.assignment.status === 'Active' || !primaryJob.assignment.status)) {
                console.log('📍 Found Active assignment object:', primaryJob.assignment);
                foundDriverId = primaryJob.assignment.driver_id;
                foundVehicleId = primaryJob.assignment.vehicle_id;
            }

            // 2. Fallback: Coba ambil dari assignments array (Legacy) - ONLY use Active
            if (!foundDriverId && Array.isArray(primaryJob.assignments) && primaryJob.assignments.length > 0) {
                const activeAssignment = primaryJob.assignments.find(a => a.status === 'Active' || a.status === 'active');
                console.log('📍 Found assignments array, using (only Active):', activeAssignment);
                if (activeAssignment) {
                    foundDriverId = foundDriverId || activeAssignment.driver_id;
                    foundVehicleId = foundVehicleId || activeAssignment.vehicle_id;
                }
            }

            // 3. Fallback: Cek fields langsung (Flattened API response)
            if (!foundDriverId) {
                foundDriverId = primaryJob.driver_id || primaryJob.assigned_driver_id;
                console.log('📍 Fallback to direct field driver_id:', foundDriverId);
            }
            if (!foundVehicleId) {
                foundVehicleId = primaryJob.vehicle_id || primaryJob.assigned_vehicle_id;
                console.log('📍 Fallback to direct field vehicle_id:', foundVehicleId);
            }

            // 4. Fallback: Lookup by Name if ID is missing (use availableDrivers/Vehicles lists)
            if (!foundDriverId) {
                const searchName = primaryJob.driver_name || primaryJob.driver || primaryJob.assignment?.driver_name;
                if (searchName) {
                    console.log('📍 Searching driver by name:', searchName);
                    const match = availableDrivers.find(d => d.label === searchName || d.label.includes(searchName));
                    if (match) {
                        foundDriverId = match.value;
                        console.log('✅ Found driver by name:', match);
                    }
                }
            }

            if (!foundVehicleId) {
                const searchPlate = primaryJob.plate_no || primaryJob.vehicle_plate || primaryJob.vehicle || primaryJob.assignment?.vehicle_plate;
                if (searchPlate) {
                    console.log('📍 Searching vehicle by plate:', searchPlate);
                    const match = availableVehicles.find(v => v.label.includes(searchPlate));
                    if (match) {
                        foundVehicleId = match.value;
                        console.log('✅ Found vehicle by plate:', match);
                    }
                }
            }

            // Convert to String for dropdown compatibility
            if (foundDriverId) {
                autoDriver = String(foundDriverId);
            }
            if (foundVehicleId) {
                autoVehicle = String(foundVehicleId);
            }

            console.log('✅ Auto-fill Result:', { autoDriver, autoVehicle, foundDriverId, foundVehicleId });
        } else {
            console.log('📋 LTL Order - Driver & Vehicle will be empty for manual selection');
        }
        // Jika LTL (Not FTL), driver & vehicle tetap kosong ('') -> Manual Input

        return {
            customer,
            origin,
            destination,
            packages: totalPackages,
            totalWeight: `${totalWeightKg.toLocaleString('id-ID')} kg`,
            cargoSummary,
            driver: autoDriver,
            vehicle: autoVehicle,
            routePreview // ✅ NEW: Route label preview for form display
        };
    };

    const handleAddManifest = () => {
        setEditModal({ isOpen: true, manifest: null });
    };

    const handleEditManifest = (manifest) => {
        setEditModal({ isOpen: true, manifest });
    };

    const handleEditSubmit = async (formData) => {
        setIsLoading(true);
        try {
            // ✅ Convert empty strings to null for optional fields
            // Laravel's `nullable|exists` validation treats empty strings as invalid values
            // By sending null, the validation passes correctly
            const driverId = formData.driver && formData.driver !== '' ? formData.driver : null;
            const vehicleId = formData.vehicle && formData.vehicle !== '' ? formData.vehicle : null;

            const payload = {
                origin_city: formData.origin,
                dest_city: formData.destination,
                cargo_summary: formData.cargoSummary || '',
                cargo_weight: parseFloat(formData.totalWeight.replace(/[^\d]/g, '')) || 0,
                planned_departure: formData.shipmentDate,
                job_order_ids: formData.jobOrders || [],
                driver_id: driverId,
                vehicle_id: vehicleId,
                // ✅ NEW: Catatan tambahan untuk assignment (LTL scenario)
                assignment_note: formData.assignmentNote || null,
            };

            if (!editModal.manifest) {
                await createManifest(payload);
            } else {
                await updateManifest(editModal.manifest.id, payload);
            }

            setEditModal({ isOpen: false, manifest: null });
        } catch (error) {
            console.error('Error saving manifest:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClose = () => {
        setEditModal({ isOpen: false, manifest: null });
    };

    const handleDeleteManifest = (manifest) => {
        setDeleteModal({ isOpen: true, manifest });
    };

    const handleDeleteConfirm = async () => {
        setIsLoading(true);
        try {
            await cancelManifest(deleteModal.manifest.id);
            setDeleteModal({ isOpen: false, manifest: null });
        } catch (error) {
            console.error('Error cancelling manifest:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClose = () => {
        setDeleteModal({ isOpen: false, manifest: null });
    };

    const handleViewManifest = (manifest) => {
        setSelectedManifestId(manifest.id);
        setCurrentView('detail');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedManifestId(null);
    };

    // ✅ NEW: Handle print button click in header - Opens PDF in new tab
    const handlePrint = () => {
        // Show instruction for printing
        const selectedManifest = prompt(
            '🖨️ Cetak Manifest\n\n' +
            'Masukkan ID Manifest yang ingin dicetak (contoh: MAN-20251218-001):\n\n' +
            'Tips: Anda juga bisa mencetak dari tombol printer di kolom Aksi.',
            ''
        );

        if (selectedManifest && selectedManifest.trim()) {
            // Open PDF in new tab
            window.open(`/print/manifest/${selectedManifest.trim()}`, '_blank');
        }
    };

    // Handle print single manifest (from row action)
    const handlePrintSingle = (manifest) => {
        if (manifest?.id) {
            window.open(`/print/manifest/${manifest.id}`, '_blank');
        }
    };

    const filteredRecords = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return manifestRecords.filter((manifest) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                manifest.id.toLowerCase().includes(normalizedSearch) ||
                manifest.customer.toLowerCase().includes(normalizedSearch) ||
                manifest.jobOrder.toLowerCase().includes(normalizedSearch) ||
                manifest.destination.toLowerCase().includes(normalizedSearch);

            const matchesStatus = statusFilter === 'all' || manifest.status === statusFilter;
            const matchesHub = hubFilter === 'all' || manifest.hub === hubFilter;

            return matchesSearch && matchesStatus && matchesHub;
        });
    }, [manifestRecords, searchTerm, statusFilter, hubFilter]);

    // Pagination calculations
    const totalItems = filteredRecords.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    // Reset ke halaman 1 saat filter/search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, hubFilter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Render ManifestDetail if in detail view
    if (currentView === 'detail' && selectedManifestId) {
        return (
            <ManifestDetail
                manifestId={selectedManifestId}
                onBack={handleBackToList}
            />
        );
    }

    return (
        <>
            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {summaryCards.map((card) => (
                    <SummaryCard key={card.title} card={card} />
                ))}
            </section>
            <ManifestTable
                records={paginatedRecords}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                hubFilter={hubFilter}
                onHubChange={setHubFilter}
                onAddManifest={handleAddManifest}
                onEditManifest={handleEditManifest}
                onDeleteManifest={handleDeleteManifest}
                onViewManifest={handleViewManifest}
                onPrint={handlePrint}
                onPrintRow={handlePrintSingle}
                loading={manifestsLoading}
                error={manifestsError}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
            />


            <EditModal
                title={editModal.manifest ? "Edit Manifest" : "Tambah Manifest"}
                fields={manifestFields}
                initialData={editModal.manifest}
                isOpen={editModal.isOpen}
                onClose={handleEditClose}
                onSubmit={handleEditSubmit}
                isLoading={isLoading}
                calculateCombinedData={calculateCombinedData}
                onFieldChange={handleFieldChange}
                jobOrdersData={{}} // No longer needed as we use availableJobOrders directly
            />

            <CancelConfirmModal
                title="Batalkan Manifest"
                message={`Apakah Anda yakin ingin membatalkan manifest "${deleteModal.manifest?.id}"? Job Order di dalamnya akan dilepas dan tersedia kembali.`}
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteClose}
                onConfirm={handleDeleteConfirm}
                isLoading={isLoading}
            />
        </>
    );
}