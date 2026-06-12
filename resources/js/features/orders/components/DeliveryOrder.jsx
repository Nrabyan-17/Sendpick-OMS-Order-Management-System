import React, { useMemo, useState, useEffect } from 'react';
import { Search, User, MapPin, Truck, ChevronDown, Pencil, Users, Eye, XCircle, Clock, ArrowRight, Printer, Plus } from 'lucide-react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import DeliveryOrderModal from '../../../components/common/DeliveryOrderModal';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';
import EditModal from '../../../components/common/EditModal';
import DeliveryOrderDetail from './DeliveryOrderDetail';
import Pagination from '../../../components/common/Pagination';
import { useDeliveryOrders } from '../hooks/useDeliveryOrders';
import { fetchDrivers } from '../../drivers/services/driverService';
import { fetchVehicles } from '../../vehicles/services/vehicleService';

// Jumlah data per halaman
const ITEMS_PER_PAGE = 6;

const summaryCardsBase = [
    {
        key: 'total',
        title: 'Total Delivery Order',
        value: '0',
        description: 'DO aktif minggu ini',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        icon: <Truck className='h-5 w-5' />,
    },
    {
        key: 'delivered',
        title: 'Sudah Terkirim',
        value: '0',
        description: '0% dari total pengiriman',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-500',
        icon: <ArrowRight className='h-5 w-5' />,
    },
    {
        key: 'inTransit',
        title: 'Dalam Perjalanan',
        value: '0',
        description: 'Update real-time setiap 15 menit',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-500',
        icon: <Clock className='h-5 w-5' />,
    },
    {
        key: 'exception',
        title: 'Returned / Cancelled',
        value: '0',
        description: 'Gagal kirim atau dibatalkan',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-500',
        icon: <ArrowRight className='h-5 w-5 rotate-180' />,
    },
];

const DO_STATUS_MAP = {
    pending: 'pending',
    'in transit': 'inTransit',
    delivered: 'delivered',
    returned: 'returned',
    completed: 'completed',
    cancelled: 'cancelled',
};

const statusStyles = {
    pending: {
        label: 'Pending',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
    },
    inTransit: {
        label: 'In Transit',
        bg: 'bg-sky-50',
        text: 'text-sky-600',
    },
    delivered: {
        label: 'Delivered',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    returned: {
        label: 'Returned',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
    completed: {
        label: 'Completed',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
    },
};

const statusFilterOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Transit', label: 'In Transit' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Returned', label: 'Returned' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

const priorityFilterOptions = [
    { value: 'all', label: 'Semua Prioritas' },
    { value: 'critical', label: 'Critical - Cold Chain' },
    { value: 'high', label: 'High Priority' },
    { value: 'normal', label: 'Normal' },
];

const alertFilterOptions = [
    { value: 'all', label: 'Semua Alert' },
    { value: 'pending_pod', label: 'Pending POD' },
    { value: 'late', label: 'Keterlambatan' },
];

const normalizeStatus = (status) => {
    if (!status) return 'pending';
    const key = status.toString().toLowerCase();
    return DO_STATUS_MAP[key] ?? 'pending';
};

/**
 * Helper function to extract city name from address
 * If the address contains a comma, take the last meaningful part (usually the city)
 * Otherwise return the original value
 */
const extractCityName = (address) => {
    if (!address || address === '-') return '-';

    // If it looks like just a city name already (short, no comma), return as is
    if (address.length <= 30 && !address.includes(',')) {
        return address;
    }

    // Try to extract city from comma-separated address
    const parts = address.split(',').map(p => p.trim()).filter(p => p);
    if (parts.length >= 2) {
        // Usually the city is the second-to-last or last part before postal code
        // Take the last non-numeric part that's not too short
        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i];
            // Skip if it's just a postal code (all numbers) or too short
            if (!/^\d+$/.test(part) && part.length > 3) {
                return part;
            }
        }
    }

    // Fallback: if address is too long, truncate it
    if (address.length > 30) {
        return address.substring(0, 27) + '...';
    }

    return address;
};

const mapDeliveryOrderFromApi = (deliveryOrder) => {
    if (!deliveryOrder) return null;

    const sourceInfo = deliveryOrder.source_info ?? {};
    const customerName = deliveryOrder.customer?.customer_name ?? sourceInfo.customer_name ?? '-';

    // Fix Route: Extract city names only (not full addresses)
    // Priority: origin_city/dest_city (already city) > pickup_city/delivery_city (may be full address)
    const rawOrigin = sourceInfo.origin_city ?? sourceInfo.pickup_city ?? sourceInfo.origin ?? '-';
    const rawDestination = sourceInfo.dest_city ?? sourceInfo.delivery_city ?? sourceInfo.destination ?? '-';

    // Extract city names from addresses
    const origin = extractCityName(rawOrigin);
    const destination = extractCityName(rawDestination);
    const route = origin && destination && origin !== '-' && destination !== '-' ? `${origin} → ${destination}` : '-';

    // Fix Source Label - Enhanced for LTL-specific
    const isJobOrder = deliveryOrder.source_type === 'JO';
    const isLTLSpecific = sourceInfo.is_ltl_specific === true;
    let sourceLabel = isJobOrder ? `Job Order: ${deliveryOrder.source_id}` : `Manifest: ${deliveryOrder.source_id}`;

    // ✅ NEW: For LTL-specific DO, show which JO it's for
    if (isLTLSpecific && sourceInfo.job_order_id) {
        sourceLabel = `Manifest: ${deliveryOrder.source_id} → ${sourceInfo.job_order_id}`;
    }

    // Fix Date Format: Use departure_date if available, otherwise fall back to do_date
    const departureDate = deliveryOrder.departure_date ?? deliveryOrder.do_date;
    const formattedDeparture = departureDate ? new Date(departureDate).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';

    // ✅ FIXED (2025-12-22): Check if DO is Cancelled
    // Cancelled DO should:
    // - Show 0/dash for cargo data (weight, qty, volume, goods_desc, ETA)
    // - KEEP showing driver/vehicle names for audit purposes
    const status = normalizeStatus(deliveryOrder.status);
    const isCancelled = status === 'cancelled';

    // Fix Koli & Goods Info
    // For Cancelled DO: show dash/empty for cargo info
    const weight = isCancelled ? '-' : (sourceInfo.goods_weight ?? deliveryOrder.weight ?? '-');
    const qty = isCancelled ? '-' : (sourceInfo.koli ?? sourceInfo.quantity ?? deliveryOrder.quantity ?? '-');
    const volume = isCancelled ? '-' : (sourceInfo.goods_volume ?? '-');
    const jobOrdersCount = sourceInfo.job_orders_count ?? null;

    // Use goods_summary first, then sourceInfo.goods_desc
    // For Cancelled DO: hide goods description
    const goodsDesc = isCancelled ? '-' : (deliveryOrder.goods_summary || sourceInfo.goods_desc || '-');

    // Fix ETA: Now using the eta field from database
    // For Cancelled DO: always show dash (no ETA needed)
    let eta = '-';
    if (!isCancelled) {
        if (deliveryOrder.eta) {
            eta = new Date(deliveryOrder.eta).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        } else if (status === 'inTransit') {
            eta = 'Estimating...';
        }
    }

    // ✅ FIXED (2025-12-22): For driver/vehicle display:
    // - For Cancelled DO: KEEP showing original driver/vehicle names for AUDIT purposes
    // - Only show "Belum ditugaskan" if data truly doesn't exist
    const driverName = deliveryOrder.driver_name ?? deliveryOrder.assigned_driver ?? null;
    const vehiclePlate = deliveryOrder.vehicle_plate ?? deliveryOrder.assigned_vehicle ?? null;

    return {
        id: deliveryOrder.do_id ?? deliveryOrder.id,
        manifestId: deliveryOrder.source_type === 'MF' ? deliveryOrder.source_id : '-',
        jobOrder: deliveryOrder.source_type === 'JO' ? deliveryOrder.source_id : (sourceInfo.job_order_id ?? '-'),
        selectedJobOrderId: sourceInfo.selected_job_order_id ?? sourceInfo.job_order_id ?? null,
        sourceLabel: sourceLabel,
        customer: customerName,
        // ✅ FIXED: Show driver/vehicle for audit even on Cancelled DO
        driver: driverName || 'Belum ditugaskan',
        vehicle: vehiclePlate || 'Belum ditugaskan',
        route,
        origin: origin,  // Separate field for vertical display
        destination: destination,  // Separate field for vertical display
        eta: eta,
        departure: formattedDeparture,
        status: status,
        backendStatus: deliveryOrder.status ?? 'Pending',
        weight: weight,
        qty: qty,
        volume: volume,
        goods_desc: goodsDesc,
        lastUpdate: deliveryOrder.updated_at ? new Date(deliveryOrder.updated_at).toLocaleString('id-ID') : '-',

        // Additional fields for display logic
        isManifest: deliveryOrder.source_type === 'MF',
        isLTLSpecific: isLTLSpecific,
        jobOrdersCount: jobOrdersCount,
        isCancelled: isCancelled, // ✅ NEW: Flag for cancelled status

        priority: (deliveryOrder.priority ?? 'normal').toLowerCase(),
        raw: deliveryOrder,
    };
};


// Icon wrappers using Lucide React
const SearchIcon = ({ className = 'h-5 w-5' }) => <Search className={className} />;
const UserIcon = ({ className = 'h-4 w-4' }) => <User className={className} />;
const MapPinIcon = ({ className = 'h-4 w-4' }) => <MapPin className={className} />;
const TruckIcon = ({ className = 'h-4 w-4' }) => <Truck className={className} />;
const ChevronDownIcon = ({ className = 'h-4 w-4' }) => <ChevronDown className={className} />;
const EditIcon = ({ className = 'h-4 w-4' }) => <Pencil className={className} />;
const UserAssignIcon = ({ className = 'h-4 w-4' }) => <Users className={className} />;
const ViewDetailIcon = ({ className = 'h-4 w-4' }) => <Eye className={className} />;
const CancelIcon = ({ className = 'h-4 w-4' }) => <XCircle className={className} />;
const PrinterIcon = ({ className = 'h-4 w-4' }) => <Printer className={className} />;
const PlusIcon = ({ className = 'h-4 w-4' }) => <Plus className={className} />;

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
    const style = statusStyles[status] ?? statusStyles.pending;
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
}

function PriorityPill({ priority }) {
    const styles = {
        critical: 'bg-rose-100 text-rose-600',
        high: 'bg-amber-100 text-amber-600',
        normal: 'bg-slate-100 text-slate-500',
    };

    const labels = {
        critical: 'Critical',
        high: 'High',
        normal: 'Normal',
    };

    const style = styles[priority] ?? styles.normal;

    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${style}`}>
            {labels[priority] ?? 'Normal'}
        </span>
    );
}

function DeliveryOrderRow({ delivery, onEdit, onViewDetail, onCancel, onPrint }) {
    // Cancelled and Completed statuses are read-only
    const isReadOnly = delivery.status === 'cancelled' || delivery.status === 'completed';

    return (
        <tr className='transition-colors hover:bg-slate-50'>
            <td className='whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-800'>{delivery.id}</td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='space-y-1'>
                    <p className='font-semibold text-slate-700'>{delivery.customer}</p>
                    <p className='text-xs text-slate-400'>{delivery.sourceLabel}</p>
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='flex flex-col gap-0.5'>
                    {/* ✅ UPDATED: Hanya tampilkan Kota Tujuan */}
                    <span className='font-semibold text-slate-800'>{delivery.destination || '-'}</span>
                    <span className='text-xs text-slate-400'>Keberangkatan: {delivery.departure}</span>
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                        <TruckIcon className='h-4 w-4 text-slate-400' />
                        <span>{delivery.vehicle}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <UserIcon className='h-4 w-4 text-slate-400' />
                        <span>{delivery.driver}</span>
                    </div>
                </div>
            </td>
            <td className='px-6 py-4'>
                <StatusBadge status={delivery.status} />
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='space-y-0.5'>
                    <p className='font-semibold text-slate-700'>
                        {/* ✅ UPDATED: Show Weight • Koli • Volume */}
                        {delivery.weight !== '-' ? `${delivery.weight} Kg` : '- Kg'} • {delivery.qty !== '-' ? delivery.qty : '-'} Koli
                        {delivery.volume && delivery.volume !== '-' && ` • ${delivery.volume} m³`}
                    </p>
                    <p className='text-xs text-slate-500 truncate max-w-[180px]' title={delivery.goods_desc}>
                        {delivery.goods_desc}
                    </p>
                    <p className='text-xs text-slate-400'>ETA: {delivery.eta}</p>
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='flex items-center'>
                    <PriorityPill priority={delivery.priority} />
                </div>
            </td>
            <td className='px-6 py-4 text-right text-xs text-slate-400'>{delivery.lastUpdate}</td>
            <td className='px-6 py-4'>
                <div className='flex items-center justify-center gap-1'>
                    {/* Print Button */}
                    <button
                        type='button'
                        title='Cetak PDF'
                        onClick={(e) => {
                            e.preventDefault();
                            onPrint(delivery);
                        }}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600'
                    >
                        <PrinterIcon className='h-4 w-4' />
                    </button>
                    <button
                        type='button'
                        title={isReadOnly ? 'Read-only' : 'Edit'}
                        disabled={isReadOnly}
                        onClick={(e) => {
                            if (isReadOnly) return;
                            e.preventDefault();
                            onEdit(delivery);
                        }}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${isReadOnly
                            ? 'cursor-not-allowed text-slate-300'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'
                            }`}
                    >
                        <EditIcon className='h-4 w-4' />
                    </button>
                    <button
                        type='button'
                        title='Lihat Detail'
                        onClick={(e) => {
                            e.preventDefault();
                            onViewDetail(delivery);
                        }}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600'
                    >
                        <ViewDetailIcon className='h-4 w-4' />
                    </button>
                    <button
                        type='button'
                        title={isReadOnly ? 'Read-only' : 'Cancel'}
                        disabled={isReadOnly}
                        onClick={(e) => {
                            if (isReadOnly) return;
                            e.preventDefault();
                            onCancel(delivery);
                        }}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${isReadOnly
                            ? 'cursor-not-allowed text-slate-300'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-rose-600'
                            }`}
                    >
                        <CancelIcon className='h-4 w-4' />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function DeliveryOrderTable({
    records,
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    priorityFilter,
    onPriorityChange,
    alertFilter,
    onAlertChange,
    onEdit,
    onViewDetail,
    onCancel,
    onAddNew,
    onPrint, // Print button in header
    onPrintRow, // Print single row/delivery
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
        <section className='rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm'>
            <div className='space-y-4'>
                <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
                    <div>
                        <h2 className='text-lg font-semibold text-slate-900'>Delivery Order & Status Tracking</h2>
                        <p className='text-sm text-slate-400'>Monitoring real-time armada, jadwal, dan bukti kirim.</p>
                    </div>
                </div>

                {/* Search and Filters Section */}
                <div className='space-y-3'>
                    {/* Search Bar */}
                    <div className='group relative w-full'>
                        <span className='pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400'>
                            <SearchIcon className='h-4 w-4' />
                        </span>
                        <input
                            type='text'
                            value={searchTerm}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder='Cari DO, manifest, driver...'
                            className='w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                        />
                    </div>

                    {/* Filters and Add Button Row */}
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='flex flex-col gap-2 sm:flex-row sm:gap-3'>
                            <FilterDropdown
                                value={statusFilter}
                                onChange={onStatusChange}
                                options={statusFilterOptions}
                                widthClass='w-full sm:w-auto sm:min-w-[120px]'
                            />
                            <FilterDropdown
                                value={priorityFilter}
                                onChange={onPriorityChange}
                                options={priorityFilterOptions}
                                widthClass='w-full sm:w-auto sm:min-w-[140px]'
                            />
                            <FilterDropdown
                                value={alertFilter}
                                onChange={onAlertChange}
                                options={alertFilterOptions}
                                widthClass='w-full sm:w-auto sm:min-w-[140px]'
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className='flex flex-col sm:flex-row gap-2'>
                            {/* Add Button */}
                            <button
                                type='button'
                                onClick={onAddNew}
                                className='w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 whitespace-nowrap'
                            >
                                <PlusIcon className='h-4 w-4 flex-shrink-0' />
                                <span className='hidden sm:inline'>Tambah Delivery Order</span>
                                <span className='sm:hidden'>Tambah DO</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className='mt-4 overflow-x-auto -mx-4 sm:mx-0'>
                <div className='min-w-full inline-block align-middle'>
                    <table className='w-full min-w-[920px] border-collapse'>
                        <thead>
                            <tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                                <th className='px-6 py-3'>Delivery Order</th>
                                <th className='px-6 py-3'>Customer</th>
                                <th className='px-6 py-3'>Kota Tujuan</th>
                                <th className='px-6 py-3'>Armada & Driver</th>
                                <th className='px-6 py-3'>Status</th>
                                <th className='px-6 py-3'>Koli & ETA</th>
                                <th className='px-6 py-3'>Prioritas</th>
                                <th className='px-6 py-3 text-right'>Update Terakhir</th>
                                <th className='px-6 py-3 text-center'>Aksi</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className='px-6 py-12 text-center text-sm text-slate-400'>
                                        Memuat data delivery order...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={9} className='px-6 py-12 text-center text-sm text-rose-500'>
                                        {error}
                                    </td>
                                </tr>
                            ) : records.length > 0 ? (
                                records.map((delivery) => (
                                    <DeliveryOrderRow
                                        key={delivery.id}
                                        delivery={delivery}
                                        onEdit={onEdit}
                                        onViewDetail={onViewDetail}
                                        onCancel={onCancel}
                                        onPrint={onPrintRow}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className='px-6 py-12 text-center text-sm text-slate-400'>
                                        Tidak ada delivery order yang sesuai dengan filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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



// Helper to format status (AVAILABLE -> Available)
const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
};

export default function DeliveryOrderContent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [alertFilter, setAlertFilter] = useState('all');

    // Data lists for options
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    // Modal states
    const [editModal, setEditModal] = useState({ isOpen: false, delivery: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, delivery: null });
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail'
    const [selectedDeliveryOrderId, setSelectedDeliveryOrderId] = useState(null);
    const [assignDriverModal, setAssignDriverModal] = useState({ isOpen: false, delivery: null });
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const {
        deliveryOrders,
        loading,
        error,
        createDeliveryOrder,
        updateDeliveryOrder,
        deleteDeliveryOrder,
        cancelDeliveryOrder,
        assignDriver,
        mutationState,
        resetMutationStatus,
    } = useDeliveryOrders({ per_page: 50 });

    // Fetch drivers and vehicles on mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                // Fetch Drivers
                const driverRes = await fetchDrivers({ per_page: 100 });
                setDrivers(driverRes.items || []);

                // Fetch Vehicles
                const vehicleRes = await fetchVehicles({ per_page: 100 });
                setVehicles(vehicleRes.items || []);

            } catch (err) {
                console.error("Error fetching options:", err);
            }
        };

        fetchOptions();
    }, []);

    const computedRecords = useMemo(() => {
        if (!Array.isArray(deliveryOrders)) return [];
        return deliveryOrders.map(mapDeliveryOrderFromApi).filter(Boolean);
    }, [deliveryOrders]);

    const summaryCards = useMemo(() => {
        if (!computedRecords.length) return summaryCardsBase;

        const totals = computedRecords.reduce(
            (acc, item) => {
                acc.total += 1;
                if (item.backendStatus === 'Delivered' || item.backendStatus === 'Completed') acc.delivered += 1;
                if (item.backendStatus === 'In Transit') acc.inTransit += 1;
                if (item.backendStatus === 'Returned' || item.backendStatus === 'Cancelled') acc.exception += 1;
                return acc;
            },
            { total: 0, delivered: 0, inTransit: 0, exception: 0 },
        );

        return summaryCardsBase.map((card) => {
            if (card.key === 'total') return { ...card, value: totals.total.toString() };
            if (card.key === 'delivered') {
                const percentage = totals.total ? Math.round((totals.delivered / totals.total) * 100) : 0;
                return { ...card, value: totals.delivered.toString(), description: `${percentage}% dari total pengiriman` };
            }
            if (card.key === 'inTransit') return { ...card, value: totals.inTransit.toString() };
            if (card.key === 'exception') return { ...card, value: totals.exception.toString() };
            return card;
        });
    }, [computedRecords]);

    const handleAddNew = () => {
        resetMutationStatus();
        setEditModal({ isOpen: true, delivery: null });
    };

    const handleEdit = (delivery) => {
        resetMutationStatus();
        setEditModal({ isOpen: true, delivery });
    };

    const handleEditSubmit = async (formData) => {
        setIsLoading(true);
        try {
            if (editModal.delivery) {
                await updateDeliveryOrder(editModal.delivery.id, formData);
            } else {
                await createDeliveryOrder(formData);
            }
            setEditModal({ isOpen: false, delivery: null });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClose = () => {
        setEditModal({ isOpen: false, delivery: null });
    };

    const handleViewDetail = (delivery) => {
        setSelectedDeliveryOrderId(delivery.id);
        setCurrentView('detail');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedDeliveryOrderId(null);
    };

    const handleAssignDriver = (delivery) => {
        resetMutationStatus();
        setAssignDriverModal({ isOpen: true, delivery });
    };

    const handleAssignDriverSubmit = async (formData) => {
        if (!assignDriverModal.delivery) return;
        setIsLoading(true);
        try {
            await assignDriver(assignDriverModal.delivery.id, formData);
            setAssignDriverModal({ isOpen: false, delivery: null });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignDriverClose = () => {
        setAssignDriverModal({ isOpen: false, delivery: null });
    };

    const handleCancel = (delivery) => {
        resetMutationStatus();
        setDeleteModal({ isOpen: true, delivery });
    };

    const handleCancelConfirm = async () => {
        if (!deleteModal.delivery) return;
        setIsLoading(true);
        try {
            // Use cancelDeliveryOrder instead of deleteDeliveryOrder
            await cancelDeliveryOrder(deleteModal.delivery.id);
            setDeleteModal({ isOpen: false, delivery: null });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClose = () => {
        setDeleteModal({ isOpen: false, delivery: null });
    };

    // ✅ NEW: Handle print button click - Opens PDF in new tab
    const handlePrint = () => {
        // Show instruction for printing
        const selectedDO = prompt(
            '🖨️ Cetak Delivery Order\n\n' +
            'Masukkan ID Delivery Order yang ingin dicetak (contoh: DO-20251218-0001):\n\n' +
            'Tips: Anda juga bisa mencetak dari tombol "Lihat Detail" di tabel.',
            ''
        );

        if (selectedDO && selectedDO.trim()) {
            // Open PDF in new tab
            window.open(`/print/delivery-order/${selectedDO.trim()}`, '_blank');
        }
    };

    // Handle print single delivery order (from row action or detail modal)
    const handlePrintSingle = (delivery) => {
        if (delivery?.id) {
            window.open(`/print/delivery-order/${delivery.id}`, '_blank');
        }
    };

    // Assign driver form fields    // Get delivery order form fields for creating new DO
    const getDeliveryOrderCreateFields = (formData = {}) => [
        {
            name: 'source_type',
            label: 'Tipe Sumber',
            type: 'select',
            required: true,
            options: [
                { value: 'JO', label: 'Job Order' },
                { value: 'MF', label: 'Manifest' }
            ]
        },
        {
            name: 'source_id',
            label: formData.source_type === 'JO' ? 'Job Order' : formData.source_type === 'MF' ? 'Manifest' : 'Sumber',
            type: 'select',
            required: true,
            options: []
        },
        {
            name: 'driver_id',
            label: 'Assign Driver',
            type: 'select',
            required: false,
            options: [{ value: '', label: '-- Pilih Driver (Opsional) --' }]
        },
        {
            name: 'vehicle_id',
            label: 'Assign Kendaraan',
            type: 'select',
            required: false,
            options: [{ value: '', label: '-- Pilih Kendaraan (Opsional) --' }]
        },
        {
            name: 'do_date',
            label: 'Tanggal DO',
            type: 'date',
            required: true
        }
    ];

    // Get delivery order form fields for editing existing DO
    const getDeliveryOrderEditFields = (delivery) => {
        // --- LOGIC FILTERING (Requested by User) ---
        const currentDriverId = delivery?.raw?.assigned_driver_id || delivery?.raw?.driver_id;
        const currentVehicleId = delivery?.raw?.assigned_vehicle_id || delivery?.raw?.vehicle_id;

        // "Tampilkan Driver JIKA (Status == 'AVAILABLE') ATAU (Driver.id == currentSelectedDriverId)"
        const filteredDrivers = drivers
            .filter(d => (d.status === 'AVAILABLE' || d.status === 'Active' || d.status === 'Aktif' || d.driver_id === currentDriverId))
            .map(d => ({
                value: d.driver_id,
                label: `${d.driver_name} (${formatStatus(d.status)})`
            }));

        // Include default option
        const driverOptions = [
            { value: '', label: '-- Pilih Driver --' },
            ...filteredDrivers
        ];

        // "Tampilkan Vehicle JIKA (Status == 'AVAILABLE') ATAU (Vehicle.id == currentSelectedVehicleId)"
        const filteredVehicles = vehicles
            .filter(v => (v.status === 'AVAILABLE' || v.status === 'Active' || v.status === 'Aktif' || v.vehicle_id === currentVehicleId))
            .map(v => ({
                value: v.vehicle_id,
                label: `${v.plate_no} (${formatStatus(v.status)})`
            }));

        // Include default option
        const vehicleOptions = [
            { value: '', label: '-- Pilih Kendaraan --' },
            ...filteredVehicles
        ];

        return [
            {
                name: 'source_display',
                label: 'Sumber',
                type: 'text',
                required: false,
                readOnly: true,
                defaultValue: delivery?.jobOrder && delivery.jobOrder !== '-' ? `Job Order: ${delivery.jobOrder}` : `Manifest: ${delivery.manifestId}`,
                description: 'Sumber DO tidak dapat diubah setelah dibuat'
            },
            {
                name: 'customer_display',
                label: 'Customer',
                type: 'text',
                required: false,
                readOnly: true,
                defaultValue: delivery?.customer || '',
                description: 'Data customer diambil dari sumber DO'
            },
            // HIDDEN FIELDS REQUIRED FOR UPDATE
            {
                name: 'customer_id',
                type: 'hidden',
                defaultValue: delivery?.raw?.customer_id || ''
            },
            {
                name: 'do_date',
                label: 'Tanggal DO',
                type: 'date',
                required: true,
                defaultValue: delivery?.raw?.do_date || ''
            },
            {
                name: 'goods_summary',
                label: 'Ringkasan Barang',
                type: 'text',
                required: false,
                readOnly: true,
                defaultValue: delivery?.raw?.goods_summary || delivery?.goods_desc || '',
                description: 'Data barang diambil dari sumber DO. Jika perlu diubah, silakan revisi di Job Order/Manifest.'
            },
            {
                name: 'route_display',
                label: 'Rute',
                type: 'text',
                required: false,
                readOnly: true,
                defaultValue: delivery?.route || '',
                description: 'Rute diambil dari sumber DO'
            },
            {
                name: 'departure_date',
                label: 'Tanggal Keberangkatan',
                type: 'date',
                required: false,
                defaultValue: delivery?.raw?.departure_date
                    ? new Date(delivery.raw.departure_date).toISOString().split('T')[0]
                    : '',
                description: 'Tanggal keberangkatan armada'
            },
            {
                name: 'eta',
                label: 'Estimasi Tiba (ETA)',
                type: 'datetime-local',
                required: false,
                defaultValue: delivery?.raw?.eta ? convertDateTimeForInput(delivery.raw.eta) : '',
                description: 'Estimasi waktu tiba'
            },
            {
                name: 'driver_id',
                label: 'Driver',
                type: 'select',
                required: false,
                options: driverOptions,
                defaultValue: currentDriverId ?? '',
                description: 'Driver dapat diubah atau diganti'
            },
            {
                name: 'vehicle_id',
                label: 'Kendaraan',
                type: 'select',
                required: false,
                options: vehicleOptions,
                defaultValue: currentVehicleId ?? '',
                description: 'Kendaraan dapat diubah atau diganti'
            },
            {
                name: 'priority',
                label: 'Prioritas',
                type: 'select',
                required: true,
                options: [
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High Priority' },
                    { value: 'Urgent', label: 'Urgent / Critical' }
                ],
                defaultValue: delivery?.raw?.priority ? delivery.raw.priority.charAt(0).toUpperCase() + delivery.raw.priority.slice(1) : 'Medium',
                description: 'Prioritas pengiriman dapat diubah'
            }
        ];
    };

    // Helper function to convert datetime for input field
    const convertDateTimeForInput = (dateTimeString) => {
        if (!dateTimeString) return '';
        // Create date object (handling numeric timestamps or strings)
        const date = new Date(dateTimeString);

        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateTimeString);
            return '';
        }

        // Format manually to YYYY-MM-DDTHH:mm using local time
        // This avoids timezone shifts caused by toISOString() which converts to UTC
        const pad = (num) => String(num).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Helper function to get driver ID from driver name
    const getDriverIdFromName = (driverName) => {
        if (!driverName) return '';
        const driver = drivers.find(d => d.driver_name === driverName);
        return driver ? driver.driver_id : '';
    };

    // Helper function to get vehicle ID from vehicle description
    const getVehicleIdFromName = (vehicleDesc) => {
        if (!vehicleDesc) return '';
        const vehicle = vehicles.find(v => v.plate_no === vehicleDesc);
        return vehicle ? vehicle.vehicle_id : '';
    };

    // Assign driver form fields
    const assignDriverFields = [
        {
            name: 'driver_id',
            label: 'Driver',
            type: 'select',
            required: true,
            options: [{ value: '', label: '-- Pilih Driver --' }]
        },
        {
            name: 'vehicle_id',
            label: 'Kendaraan',
            type: 'select',
            required: true,
            options: [{ value: '', label: '-- Pilih Kendaraan --' }]
        },
        {
            name: 'notes',
            label: 'Catatan',
            type: 'textarea',
            required: false,
            placeholder: 'Catatan tambahan untuk assignment',
            rows: 3
        }
    ];

    const filteredRecords = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return computedRecords.filter((delivery) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                delivery.id.toLowerCase().includes(normalizedSearch) ||
                delivery.manifestId.toLowerCase().includes(normalizedSearch) ||
                delivery.driver.toLowerCase().includes(normalizedSearch) ||
                delivery.customer.toLowerCase().includes(normalizedSearch) ||
                delivery.route.toLowerCase().includes(normalizedSearch);

            const matchesStatus = statusFilter === 'all' || delivery.backendStatus === statusFilter;
            const matchesPriority = priorityFilter === 'all' || delivery.priority === priorityFilter;

            let matchesAlert = true;
            if (alertFilter === 'pending_pod') {
                matchesAlert = delivery.backendStatus === 'Delivered' || delivery.backendStatus === 'Completed';
            } else if (alertFilter === 'late') {
                matchesAlert = delivery.backendStatus === 'Cancelled' || delivery.priority === 'critical';
            }

            return matchesSearch && matchesStatus && matchesPriority && matchesAlert;
        });
    }, [computedRecords, searchTerm, statusFilter, priorityFilter, alertFilter]);

    // Pagination calculations
    const totalItems = filteredRecords.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    // Reset ke halaman 1 saat filter/search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, priorityFilter, alertFilter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Render DeliveryOrderDetail if in detail view
    if (currentView === 'detail' && selectedDeliveryOrderId) {
        return (
            <DeliveryOrderDetail
                deliveryOrderId={selectedDeliveryOrderId}
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
            <DeliveryOrderTable
                records={paginatedRecords}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
                alertFilter={alertFilter}
                onAlertChange={setAlertFilter}
                onEdit={handleEdit}
                onViewDetail={handleViewDetail}
                onAssignDriver={handleAssignDriver}
                onCancel={handleCancel}
                onAddNew={handleAddNew}
                onPrint={handlePrint}
                onPrintRow={handlePrintSingle}
                loading={loading}
                error={error}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
            />


            {editModal.isOpen && !editModal.delivery && (
                <DeliveryOrderModal
                    title="Tambah Delivery Order"
                    initialData={null}
                    isOpen={editModal.isOpen}
                    onClose={handleEditClose}
                    onSubmit={handleEditSubmit}
                    isLoading={isLoading}
                />
            )}

            {editModal.isOpen && editModal.delivery && (
                <EditModal
                    title={`Edit Delivery Order - ${editModal.delivery.id}`}
                    fields={getDeliveryOrderEditFields(editModal.delivery)}
                    initialData={editModal.delivery}
                    isOpen={editModal.isOpen}
                    onClose={handleEditClose}
                    onSubmit={handleEditSubmit}
                    isLoading={isLoading}
                />
            )}

            {assignDriverModal.isOpen && (
                <EditModal
                    title={`Assign Driver - ${assignDriverModal.delivery?.id}`}
                    fields={assignDriverFields}
                    initialData={{}}
                    isOpen={assignDriverModal.isOpen}
                    onClose={handleAssignDriverClose}
                    onSubmit={handleAssignDriverSubmit}
                    isLoading={isLoading}
                />
            )}

            {/* Cancel Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteClose}
                onConfirm={handleCancelConfirm}
                title='Batalkan Delivery Order'
                message={`Apakah Anda yakin ingin membatalkan Delivery Order ${deleteModal.delivery?.id}? Status akan berubah menjadi Cancelled.`}
                isLoading={isLoading || mutationState.deleting}
                confirmLabel="Ya, Batalkan"
                loadingLabel="Membatalkan..."
            />
        </>
    );
}