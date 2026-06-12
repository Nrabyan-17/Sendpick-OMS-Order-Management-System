import React, { useMemo, useState, useEffect } from 'react';
import { Search, Eye, Pencil, XCircle, ClipboardList, Clock, Truck, CheckCircle2, ArrowDown } from 'lucide-react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import EditModal from '../../../components/common/EditModal';
import CancelConfirmModal from '../../../components/common/CancelConfirmModal';
import Pagination from '../../../components/common/Pagination';
import JobOrderDetail from './JobOrderDetail';
import { fetchJobOrders, createJobOrder, updateJobOrder, cancelJobOrder } from '../services/jobOrderService';
import { fetchCustomers } from '../../customers/services/customerService';

// Jumlah data per halaman
const ITEMS_PER_PAGE = 6;

const summaryCards = [
    {
        title: 'Total Order',
        value: '1,247',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        description: 'Semua jenis order',
        icon: <ClipboardList className='h-5 w-5' />,
    },
    {
        title: 'Pending',
        value: '89',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-500',
        description: 'Menunggu konfirmasi',
        icon: <Clock className='h-5 w-5' />,
    },
    {
        title: 'In Progress',
        value: '156',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-500',
        description: 'Dalam proses pengiriman',
        icon: <Truck className='h-5 w-5' />,
    },
    {
        title: 'Completed',
        value: '1,002',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-500',
        description: 'Order selesai bulan ini',
        icon: <CheckCircle2 className='h-5 w-5' />,
    },
];

const orderTypeStyles = {
    jobOrder: {
        label: 'Job Order',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
    },
    LTL: {
        label: 'LTL',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
    },
    FTL: {
        label: 'FTL',
        bg: 'bg-purple-50',
        text: 'text-purple-600',
    },
    manifest: {
        label: 'Manifest',
        bg: 'bg-sky-50',
        text: 'text-sky-600',
    },
    delivery: {
        label: 'Delivery Order',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
};

const statusStyles = {
    assigned: {
        label: 'Assigned',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
    },
    in_progress: {
        label: 'In Progress',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
    },
    pending: {
        label: 'Pending',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
    delivered: {
        label: 'Delivered',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    completed: {
        label: 'Completed',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    created: {
        label: 'Created',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
    },
    confirmed: {
        label: 'Confirmed',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-red-50',
        text: 'text-red-600',
    },
};

const typeFilterOptions = [
    { value: 'all', label: 'Semua Tipe' },
    { value: 'FTL', label: 'FTL (Full Truckload)' },
    { value: 'LTL', label: 'LTL (Less Than Truckload)' },
];

const statusFilterOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
];

const fallbackOrderRecords = [
    {
        id: 'JO-2024-001',
        type: 'jobOrder',
        jobOrderType: 'LTL', // Add specific job order type
        customer: 'PT Maju Jaya',
        customer_id: '1', // Add customer_id for form mapping
        origin: 'Jakarta Selatan',
        destination: 'Bandung',
        commodity: 'Elektronik - 50 pcs',
        weight: '250',
        items: 'Elektronik - 50 pcs', // Add items field for form
        driver: 'Ahmad Subandi',
        vehicle: 'B 1234 AB',
        status: 'in_progress',
        startDate: '2024-01-15',
        endDate: '2024-01-16',
        ship_date: '2024-01-15', // Add ship_date for form
        value: '2500000',
    },
    {
        id: 'MF-2024-002',
        type: 'manifest',
        customer: 'CV Sukses Mandiri',
        customer_id: '2', // Add customer_id for form mapping
        origin: 'Jakarta Timur',
        destination: 'Surabaya',
        commodity: 'Tekstil - 100 pcs',
        weight: '500',
        items: 'Tekstil - 100 pcs', // Add items field for form
        driver: '-',
        vehicle: '-',
        status: 'pending',
        startDate: '2024-01-15',
        endDate: '2024-01-17',
        ship_date: '2024-01-15', // Add ship_date for form
        value: '3200000',
    },
    {
        id: 'DO-2024-003',
        type: 'delivery',
        customer: 'UD Berkah',
        customer_id: '3', // Add customer_id for form mapping
        origin: 'Jakarta Barat',
        destination: 'Medan',
        commodity: 'Makanan - 200 pcs',
        weight: '300',
        items: 'Makanan - 200 pcs', // Add items field for form
        driver: 'Budi Santoso',
        vehicle: 'B 5678 CD',
        status: 'delivered',
        startDate: '2024-01-10',
        endDate: '2024-01-12',
        ship_date: '2024-01-10', // Add ship_date for form
        value: '4100000',
    },
];

const fallbackCustomers = [
    { id: '1', nama: 'PT Maju Jaya', kode: 'PMJ', contact_name: 'Budi Santoso', phone: '081234567890' },
    { id: '2', nama: 'CV Sukses Mandiri', kode: 'CSM', contact_name: 'Andi Wijaya', phone: '082345678901' },
    { id: '3', nama: 'UD Berkah', kode: 'UDB', contact_name: 'Siti Rahayu', phone: '083456789012' },
    { id: '4', nama: 'PT Global Logistik', kode: 'PGL', contact_name: 'Dian Pratama', phone: '084567890123' },
    { id: '5', nama: 'CV Sentosa Transport', kode: 'CST', contact_name: 'Rudi Hartono', phone: '085678901234' },
];

const INDONESIA_CITIES = [
    { value: 'Jakarta', label: 'Jakarta' },
    { value: 'Surabaya', label: 'Surabaya' },
    { value: 'Bandung', label: 'Bandung' },
    { value: 'Semarang', label: 'Semarang' },
    { value: 'Medan', label: 'Medan' },
    { value: 'Makassar', label: 'Makassar' },
    { value: 'Denpasar', label: 'Denpasar' },
    { value: 'Yogyakarta', label: 'Yogyakarta' },
    { value: 'Balikpapan', label: 'Balikpapan' },
    { value: 'Palembang', label: 'Palembang' },
    { value: 'Tangerang', label: 'Tangerang' },
    { value: 'Bekasi', label: 'Bekasi' },
    { value: 'Depok', label: 'Depok' },
    { value: 'Bogor', label: 'Bogor' },
    { value: 'Malang', label: 'Malang' },
    { value: 'Solo', label: 'Solo' },
    { value: 'Batam', label: 'Batam' },
    { value: 'Pekanbaru', label: 'Pekanbaru' },
    { value: 'Bandar Lampung', label: 'Bandar Lampung' },
    { value: 'Padang', label: 'Padang' },
];

// Icon wrappers using Lucide React
const SearchIcon = ({ className = 'h-5 w-5' }) => <Search className={className} />;
const EyeIcon = ({ className = 'h-4 w-4' }) => <Eye className={className} />;
const EditIcon = ({ className = 'h-4 w-4' }) => <Pencil className={className} />;
const CancelIcon = ({ className = 'h-4 w-4' }) => <XCircle className={className} />;

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

function OrderTypeBadge({ type }) {
    const style = orderTypeStyles[type] ?? orderTypeStyles.jobOrder;
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
}

function StatusBadge({ status }) {
    const style = statusStyles[status] ?? statusStyles.pending;
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
}

function OrderRow({ order, onViewDetail, onEdit, onCancel }) {
    const numericValue = Number(order.value ?? 0);
    const formattedValue = Number.isFinite(numericValue) ? numericValue.toLocaleString('id-ID') : '0';

    const isReadOnly = order.status === 'cancelled';

    return (
        <tr className='transition-colors hover:bg-slate-50'>
            <td className='whitespace-nowrap px-6 py-4'>
                <div className='text-sm font-semibold text-slate-800'>{order.id}</div>
            </td>
            <td className='px-6 py-4'>
                <OrderTypeBadge type={order.jobOrderType} />
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>{order.customer}</td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='flex items-center gap-2'>
                    <div className='h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-sky-100' />
                    <p className='font-semibold text-slate-800 text-sm'>{order.delivery_city || 'Kota Tujuan'}</p>
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='space-y-1'>
                    <p className='font-medium text-slate-900 line-clamp-2 max-w-[200px]' title={order.commodity}>{order.commodity}</p>
                    <div className='flex items-center gap-2 text-xs text-slate-500'>
                        <span className='bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600'>{order.weight} kg</span>
                        <span>•</span>
                        <span className='bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600'>{order.volume ? `${order.volume} m³` : '-'}</span>
                    </div>
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='space-y-1'>
                    {order.jobOrderType === 'LTL' && (!order.driver || order.driver === '-') ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                            <span>📦</span>
                            Via Manifest
                        </div>
                    ) : (
                        <>
                            <p className='font-medium text-slate-900'>{order.driver}</p>
                            <p className='text-xs text-slate-400'>{order.vehicle}</p>
                        </>
                    )}
                </div>
            </td>
            <td className='px-6 py-4'>
                <StatusBadge status={order.status} />
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <p>{order.startDate ? new Date(order.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
            </td>
            <td className='px-6 py-4 text-sm font-semibold text-slate-700'>
                Rp {formattedValue}
            </td>
            <td className='px-6 py-4'>
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={(e) => {
                            e.preventDefault();
                            onViewDetail(order.id);
                        }}
                        className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600'
                        aria-label={`Detail order ${order.id}`}
                        title="Lihat Detail"
                    >
                        <EyeIcon />
                    </button>
                    <button
                        type='button'
                        onClick={(e) => {
                            e.preventDefault();
                            !isReadOnly && onEdit(order);
                        }}
                        disabled={isReadOnly}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition ${isReadOnly ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-indigo-200 hover:text-indigo-600'}`}
                        aria-label={`Edit order ${order.id}`}
                        title={isReadOnly ? "Tidak dapat diedit" : "Edit Order"}
                    >
                        <EditIcon />
                    </button>
                    <button
                        type='button'
                        onClick={(e) => {
                            e.preventDefault();
                            !isReadOnly && onCancel(order);
                        }}
                        disabled={isReadOnly}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition ${isReadOnly ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-rose-200 hover:text-rose-600'}`}
                        aria-label={`Cancel order ${order.id}`}
                        title={isReadOnly ? "Tidak dapat dibatalkan" : "Batalkan Order"}
                    >
                        <CancelIcon />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function OrdersTable({
    orders,
    isLoading,
    error,
    onViewDetail,
    onEdit,
    onCancel,
    // Pagination props
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    onPageChange,
}) {
    return (
        <>
            <div className='mt-6 overflow-x-auto'>
                <table className='w-full min-w-[960px] border-collapse'>
                    <thead>
                        <tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                            <th className='px-6 py-3'>Order ID</th>
                            <th className='px-6 py-3'>Tipe</th>
                            <th className='px-6 py-3'>Customer</th>
                            <th className='px-6 py-3'>Kota Tujuan</th>
                            <th className='px-6 py-3'>Barang</th>
                            <th className='px-6 py-3'>Driver/Kendaraan</th>
                            <th className='px-6 py-3'>Status</th>
                            <th className='px-6 py-3'>Tanggal Kirim</th>
                            <th className='px-6 py-3'>Nilai</th>
                            <th className='px-6 py-3'>Aksi</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {isLoading ? (
                            <tr>
                                <td colSpan={10} className='px-6 py-12 text-center text-sm text-slate-400'>
                                    Memuat data job order...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={10} className='px-6 py-12 text-center text-sm text-rose-500'>
                                    {error}
                                </td>
                            </tr>
                        ) : orders.length > 0 ? (
                            orders.map((order) => (
                                <OrderRow
                                    key={order.id}
                                    order={order}
                                    onViewDetail={onViewDetail}
                                    onEdit={onEdit}
                                    onCancel={onCancel}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} className='px-6 py-12 text-center text-sm text-slate-400'>
                                    Tidak ada order untuk filter saat ini.
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
        </>
    );
}

export default function JobOrderContent() {
    console.log('JobOrderContent component mounted and rendering...');

    const [orders, setOrders] = useState(fallbackOrderRecords);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('all');
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail'
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    // Modal states
    const [editModal, setEditModal] = useState({ isOpen: false, order: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, order: null });
    const [createModal, setCreateModal] = useState({ isOpen: false });
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [customers, setCustomers] = useState([]);

    const allowedStatuses = useMemo(
        () => new Set(statusFilterOptions.map((option) => option.value)),
        []
    );

    // State for dynamic form fields
    const [formJobOrderType, setFormJobOrderType] = useState('LTL');

    const handleFieldChange = (name, value, setFormData) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-fill Nama Penerima dan No. Telp Penerima ketika customer dipilih
            if (name === 'customer_id' && value) {
                const selectedCustomer = customers.find(c => c.id === value);
                if (selectedCustomer) {
                    // Hanya auto-fill jika field masih kosong
                    if (!prev.recipient_name) {
                        newData.recipient_name = selectedCustomer.contact_name || '';
                    }
                    if (!prev.recipient_phone) {
                        newData.recipient_phone = selectedCustomer.phone || '';
                    }
                    console.log('📋 Auto-fill recipient data from customer:', selectedCustomer);
                }
            }

            return newData;
        });

        if (name === 'jobOrderType') {
            setFormJobOrderType(value);
        }
    };

    const normalizeStatus = (status) => {
        if (!status) {
            return 'pending';
        }

        const normalized = status.toString().toLowerCase().replace(/\s+/g, '_');
        return allowedStatuses.has(normalized) ? normalized : 'pending';
    };

    const mapJobOrderToRecord = (order) => {
        if (!order) {
            return null;
        }

        const assignments = Array.isArray(order.assignments) ? order.assignments : [];
        // ✅ FIXED: Only use assignment if it's Active, do NOT fallback to cancelled assignments
        const activeAssignment = assignments.find(a => a.status === 'Active' || a.status === 'active');

        // Only show driver/vehicle if there's an ACTIVE assignment
        // If no active assignment, show '-' (menunggu assignment)
        const driverName = activeAssignment
            ? (activeAssignment?.driver?.driver_name ??
                activeAssignment?.driver?.name ??
                activeAssignment?.driver_name ??
                '-')
            : '-';

        const vehicleName = activeAssignment
            ? (activeAssignment?.vehicle?.plate_number ??
                activeAssignment?.vehicle?.vehicle_name ??
                activeAssignment?.vehicle?.registration_number ??
                activeAssignment?.vehicle?.license_plate ??
                activeAssignment?.vehicle?.plate_no ??
                '-')
            : '-';

        const shipDate = order.ship_date ?? order.startDate ?? order.created_at ?? '';
        const endDate = order.delivery_date ?? order.endDate ?? order.completed_at ?? '';
        const value = order.order_value ?? order.value ?? 0;

        return {
            id: order.job_order_id ?? order.id ?? '',
            type: 'jobOrder',
            jobOrderType: order.order_type ?? order.jobOrderType ?? 'LTL',
            customer: order.customer?.customer_name ?? order.customer_name ?? order.customer?.name ?? '-',
            customer_id: order.customer_id ?? '',
            origin: order.pickup_address ?? order.origin ?? '-',
            pickup_city: order.pickup_city ?? '',
            pickup_lat: order.pickup_lat ?? '',
            pickup_lng: order.pickup_lng ?? '',
            pickup_contact: order.pickup_contact ?? '',
            pickup_phone: order.pickup_phone ?? '',
            destination: order.delivery_address ?? order.destination ?? '-',
            delivery_city: order.delivery_city ?? '',
            delivery_lat: order.delivery_lat ?? '',
            delivery_lng: order.delivery_lng ?? '',
            recipient_name: order.recipient_name ?? '',
            recipient_phone: order.recipient_phone ?? '',
            commodity: order.goods_desc ?? order.commodity ?? '-',
            goods_qty: order.goods_qty ?? '', // Add goods_qty mapping
            weight: order.goods_weight != null ? `${order.goods_weight}` : order.weight ?? '',
            volume: order.goods_volume != null ? `${order.goods_volume}` : order.volume ?? '',
            items: order.goods_desc ?? order.items ?? '-',
            driver: driverName,
            vehicle: vehicleName,
            status: normalizeStatus(order.status),
            startDate: shipDate,
            endDate,
            ship_date: shipDate,
            value,
        };
    };

    const loadJobOrders = async () => {
        console.log('JobOrderContent: loading job orders');
        setOrdersLoading(true);
        setOrdersError(null);

        try {
            const { items } = await fetchJobOrders({ per_page: 50 });

            if (Array.isArray(items)) {
                const mappedOrders = items.map(mapJobOrderToRecord).filter(Boolean);
                setOrders(mappedOrders);
            } else {
                setOrders(fallbackOrderRecords);
                setOrdersError('Format data job order tidak valid. Menampilkan data contoh.');
            }
        } catch (error) {
            console.error('JobOrderContent: failed to load job orders', error);
            setOrders(fallbackOrderRecords);
            setOrdersError('Gagal memuat data job order. Menampilkan data contoh.');
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        loadJobOrders();
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadCustomers = async () => {
            try {
                const { items } = await fetchCustomers({ per_page: 100, status: 'Aktif' });
                if (!isMounted) {
                    return;
                }

                if (Array.isArray(items) && items.length > 0) {
                    const normalizedCustomers = items.map((customer) => ({
                        id: customer.customer_id ?? customer.id ?? '',
                        nama: customer.customer_name ?? customer.nama ?? customer.name ?? '-',
                        kode: customer.customer_code ?? customer.kode ?? customer.code ?? '-',
                        // Tambahkan contact_name dan phone untuk auto-fill penerima
                        contact_name: customer.contact_name ?? '',
                        phone: customer.phone ?? '',
                    }));

                    setCustomers(normalizedCustomers);
                } else {
                    setCustomers(fallbackCustomers);
                }
            } catch (error) {
                console.error('Error loading customers:', error);
                if (isMounted) {
                    setCustomers(fallbackCustomers);
                }
            }
        };

        loadCustomers();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleViewDetail = (orderId) => {
        setSelectedOrderId(orderId);
        setCurrentView('detail');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedOrderId(null);
        // ✅ Refresh list when returning from detail
        loadJobOrders();
    };

    // Edit modal handlers
    const handleEdit = (order) => {
        console.log('Edit button clicked for order:', order);

        // Prepare data for edit form - ensure all required fields are present
        const editData = {
            ...order,
            // Ensure we have the correct field mapping
            customer_id: order.customer_id || '',
            jobOrderType: order.jobOrderType || 'LTL',
            pickup_address: order.origin || '', // Map origin back to pickup_address for edit
            pickup_city: order.pickup_city || '',
            pickup_lat: order.pickup_lat || '',
            pickup_lng: order.pickup_lng || '',
            pickup_contact: order.pickup_contact || '',
            pickup_phone: order.pickup_phone || '',
            delivery_address: order.destination || '', // Map destination back to delivery_address for edit
            delivery_city: order.delivery_city || '',
            delivery_lat: order.delivery_lat || '',
            delivery_lng: order.delivery_lng || '',
            recipient_name: order.recipient_name || '',
            recipient_phone: order.recipient_phone || '',
            items: order.items || order.commodity || '',
            goods_desc: order.items || order.commodity || '', // Ensure goods_desc is set
            goods_qty: order.goods_qty || '', // Add goods_qty mapping for edit
            weight: order.weight || '',
            goods_weight: order.weight || '', // Ensure goods_weight is set
            volume: order.volume || '',
            goods_volume: order.volume || '', // Ensure goods_volume is set
            ship_date: order.ship_date || order.startDate || '',
            value: order.value || '',
            order_value: order.value || '', // Ensure order_value is set
            status: order.status || 'pending'
        };

        // Set initial form state for dynamic fields
        setFormJobOrderType(editData.jobOrderType);

        console.log('Prepared edit data:', editData);
        setEditModal({ isOpen: true, order: editData });
    };

    const handleCancel = (order) => {
        setDeleteModal({ isOpen: true, order });
    };

    const handleCancelConfirm = async (formData) => {
        setIsLoading(true);
        try {
            // ✅ FIXED: Use cancelJobOrder for cascading effects (DO cancel, Manifest detach)
            await cancelJobOrder(deleteModal.order.id, formData.cancellation_reason || 'Dibatalkan oleh Admin');
            console.log('Order cancelled successfully with cascading effects:', deleteModal.order.id);
            setDeleteModal({ isOpen: false, order: null });
            loadJobOrders();
        } catch (error) {
            console.error('Error canceling order:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelClose = () => {
        setDeleteModal({ isOpen: false, order: null });
    };

    const handleEditSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                order_type: formData.jobOrderType, // Map frontend field to backend expected field
            };

            await updateJobOrder(editModal.order.id, payload);
            console.log('Job order updated successfully');

            // Close modal and reload
            setEditModal({ isOpen: false, order: null });
            loadJobOrders();
        } catch (error) {
            console.error('Error updating job order:', error);
            // You might want to show an error notification here
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClose = () => {
        setEditModal({ isOpen: false, order: null });
    };

    // Create modal handlers
    const handleCreate = () => {
        console.log('Create new job order button clicked');
        setFormJobOrderType('LTL'); // Reset to default
        setCreateModal({ isOpen: true });
    };

    const handleCreateSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                order_type: formData.jobOrderType, // Map frontend field to backend expected field
            };

            await createJobOrder(payload);
            console.log('Job order created successfully');

            // Close modal and reload
            setCreateModal({ isOpen: false });
            loadJobOrders();
        } catch (error) {
            console.error('Error creating job order:', error);
            // You might want to show an error notification here
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClose = () => {
        setCreateModal({ isOpen: false });
    };

    const summaryCardsData = useMemo(() => {
        const formatter = new Intl.NumberFormat('id-ID');
        const totalOrders = orders.length;
        const pendingCount = orders.filter((order) => order.status === 'pending').length;
        const inProgressCount = orders.filter((order) => order.status === 'in_progress').length;
        const completedCount = orders.filter((order) => ['completed', 'delivered'].includes(order.status)).length;

        return summaryCards.map((card) => {
            let computedValue = card.value;

            switch (card.title) {
                case 'Total Order':
                    computedValue = formatter.format(totalOrders);
                    break;
                case 'Pending':
                    computedValue = formatter.format(pendingCount);
                    break;
                case 'In Progress':
                    computedValue = formatter.format(inProgressCount);
                    break;
                case 'Completed':
                    computedValue = formatter.format(completedCount);
                    break;
                default:
                    break;
            }

            return {
                ...card,
                value: computedValue,
            };
        });
    }, [orders]);

    const orderTabsData = useMemo(() => {
        const countsByType = orders.reduce(
            (accumulator, order) => {
                const typeKey = order.type ?? 'jobOrder';
                accumulator[typeKey] = (accumulator[typeKey] ?? 0) + 1;
                return accumulator;
            },
            {}
        );

        return [
            { key: 'all', label: 'Semua Order', count: orders.length },
            { key: 'jobOrder', label: 'Job Order', count: countsByType.jobOrder ?? 0 },
            { key: 'manifest', label: 'Manifest', count: countsByType.manifest ?? 0 },
            { key: 'delivery', label: 'Delivery Order', count: countsByType.delivery ?? 0 },
        ];
    }, [orders]);

    // Job order form fields configuration
    const jobOrderFields = useMemo(() => [
        {
            name: 'customer_id',
            label: 'Customer',
            type: 'select',
            required: true,
            options: customers.map(customer => ({
                value: customer.id,
                label: `${customer.nama} (${customer.kode})`
            }))
        },
        {
            name: 'jobOrderType',
            label: 'Tipe Order',
            type: 'select',
            required: true,
            options: [
                { value: 'LTL', label: 'LTL (Less Than Truckload)' },
                { value: 'FTL', label: 'FTL (Full Truckload)' }
            ]
        },

        // =====================================================
        // DELIVERY LOCATION SECTION (TUJUAN/DESTINATION)
        // =====================================================
        {
            name: 'delivery_address',
            label: 'Alamat Lengkap Tujuan',
            type: 'textarea',
            required: true,
            placeholder: 'Alamat lengkap tujuan',
            rows: 2
        },
        {
            name: 'delivery_city',
            label: 'Kota Tujuan',
            type: 'select',
            required: true,
            options: INDONESIA_CITIES,
            placeholder: 'Pilih Kota Tujuan'
        },
        {
            name: 'delivery_coordinates',
            label: 'Koordinat Lokasi Tujuan',
            type: 'location-picker',
            locationType: 'delivery',
            latField: 'delivery_lat',
            lngField: 'delivery_lng',
            addressField: 'delivery_address',
            cityField: 'delivery_city', // ✅ NEW: Auto-fill kota dari reverse geocoding
            mapTitle: 'Pilih Lokasi Tujuan',
            description: 'Koordinat akan otomatis diisi berdasarkan alamat di atas, atau klik di peta untuk auto-fill alamat & kota'
        },
        {
            name: 'recipient_name',
            label: 'Nama Penerima',
            type: 'text',
            required: false,
            placeholder: 'Nama orang yang akan menerima barang',
            description: 'PIC penerima di lokasi tujuan. Otomatis terisi dari data kontak pelanggan.'
        },
        {
            name: 'recipient_phone',
            label: 'No. Telepon Penerima',
            type: 'text',
            required: false,
            placeholder: 'Contoh: 08123456789',
            description: 'Nomor telepon untuk koordinasi pengiriman. Otomatis terisi dari data pelanggan.'
        },
        // Hidden fields for delivery coordinates
        {
            name: 'delivery_lat',
            type: 'hidden'
        },
        {
            name: 'delivery_lng',
            type: 'hidden'
        },
        // =====================================================
        // GOODS INFORMATION SECTION
        // =====================================================
        {
            name: 'goods_desc',
            label: 'Deskripsi Barang',
            type: 'textarea',
            required: true,
            placeholder: 'Deskripsi barang yang dikirim',
            rows: 2
        },
        {
            name: 'goods_qty',
            label: 'Jumlah Koli (Qty Packages)',
            type: 'number',
            required: true,
            placeholder: 'Jumlah paket/dus',
            min: 1,
            description: 'Wajib diisi untuk proses cross-docking'
        },
        {
            name: 'goods_weight',
            label: 'Berat (kg)',
            type: 'number',
            required: true,
            placeholder: 'Berat kotor (termasuk palet)',
            min: 0,
            step: 0.1,
            help: formJobOrderType === 'LTL' ? 'Krusial untuk LTL: Pastikan berat akurat agar tidak overload.' : null
        },
        {
            name: 'goods_volume',
            label: 'Volume (m3)',
            type: 'number',
            required: formJobOrderType === 'LTL', // Wajib untuk LTL
            placeholder: 'Estimasi volume dalam m3',
            min: 0,
            step: 0.01,
            description: formJobOrderType === 'LTL'
                ? 'WAJIB untuk LTL: Barang ringan tapi besar memakan space berharga.'
                : 'Opsional: Isi jika barang ringan tapi memakan tempat (CBM)'
        },
        {
            name: 'ship_date',
            label: 'Tanggal Kirim',
            type: 'date',
            required: true
        },
        {
            name: 'order_value',
            label: 'Nilai Order',
            type: 'number',
            required: true,
            placeholder: 'Nilai dalam Rupiah'
        }
    ], [customers, formJobOrderType]);

    // Job order form fields configuration for editing (includes status)
    const jobOrderEditFields = useMemo(() => {
        return jobOrderFields.map(field => {
            if (field.name === 'customer_id' || field.name === 'jobOrderType') {
                return { ...field, disabled: true };
            }
            return field;
        });
    }, [jobOrderFields]);

    const filteredOrders = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return orders.filter((order) => {
            const idValue = (order.id ?? '').toString().toLowerCase();
            const customerValue = (order.customer ?? '').toString().toLowerCase();
            const originValue = (order.origin ?? '').toString().toLowerCase();
            const destinationValue = (order.destination ?? '').toString().toLowerCase();

            const matchesSearch =
                term.length === 0 ||
                idValue.includes(term) ||
                customerValue.includes(term) ||
                originValue.includes(term) ||
                destinationValue.includes(term);

            const matchesType =
                (activeTab !== 'all' ? order.type === activeTab : true) &&
                (typeFilter === 'all' || order.jobOrderType === typeFilter);

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [orders, searchTerm, typeFilter, statusFilter, activeTab]);

    // Pagination calculations
    const totalItems = filteredOrders.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    // Reset ke halaman 1 saat filter/search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, statusFilter, activeTab]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Render JobOrderDetail if in detail view
    if (currentView === 'detail' && selectedOrderId) {
        console.log('Rendering JobOrderDetail for order:', selectedOrderId);
        return (
            <JobOrderDetail
                jobOrderId={selectedOrderId}
                onBack={handleBackToList}
            />
        );
    }

    console.log('Rendering main JobOrder content');
    console.log('Current view state:', currentView);
    console.log('Selected order ID:', selectedOrderId);

    return (
        <div className='flex flex-col gap-8'>
            {/* Page Header
            <header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                    <h1 className='text-2xl font-semibold text-slate-900'>Job Order Management</h1>
                    <p className='text-sm text-slate-500'>Kelola semua job order, manifest, dan delivery order</p>
                </div>
            </header> */}

            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {summaryCardsData.map((card) => (
                    <SummaryCard key={card.title} card={card} />
                ))}
            </section>
            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div className='group relative flex-1'>
                        <span className='pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400'>
                            <SearchIcon />
                        </span>
                        <input
                            type='text'
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder='Cari order, customer, atau lokasi...'
                            className='w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                        />
                    </div>
                    <div className='flex flex-col gap-3 sm:flex-row'>
                        <FilterDropdown
                            value={typeFilter}
                            onChange={setTypeFilter}
                            options={typeFilterOptions}
                            widthClass='min-w-[160px]'
                        />
                        <FilterDropdown
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={statusFilterOptions}
                            widthClass='min-w-[160px]'
                        />
                        <button
                            type='button'
                            onClick={handleCreate}
                            className='inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
                        >
                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
                                <path d='M12 5v14' strokeLinecap='round' strokeLinejoin='round' />
                                <path d='M5 12h14' strokeLinecap='round' strokeLinejoin='round' />
                            </svg>
                            Tambah Job Order
                        </button>
                    </div>
                </div>

                <OrdersTable
                    orders={paginatedOrders}
                    isLoading={ordersLoading}
                    error={ordersError}
                    onViewDetail={handleViewDetail}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={handlePageChange}
                />
            </section>

            {/* Create Modal */}
            <EditModal
                isOpen={createModal.isOpen}
                onClose={handleCreateClose}
                onSubmit={handleCreateSubmit}
                title="Tambah Job Order Baru"
                data={{}} // Empty data for new creation
                fields={jobOrderFields}
                isLoading={isLoading}
                onFieldChange={handleFieldChange}
            />

            {/* Edit Modal */}
            <EditModal
                isOpen={editModal.isOpen}
                onClose={handleEditClose}
                onSubmit={handleEditSubmit}
                title="Edit Job Order"
                data={editModal.order}
                fields={jobOrderEditFields}
                isLoading={isLoading}
                onFieldChange={handleFieldChange}
            />

            {/* Cancel Modal */}
            <CancelConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleCancelClose}
                onConfirm={handleCancelConfirm}
                title="Batalkan Job Order"
                itemId={deleteModal.order?.id || ''}
                message="Apakah Anda yakin ingin membatalkan Job Order ini?"
                statusText="Cancelled"
                reasonLabel="Alasan Pembatalan"
                reasonPlaceholder="Contoh: Stok barang kosong / Customer request cancel..."
                reasonRequired={true}
                isLoading={isLoading}
                confirmLabel="Konfirmasi Pembatalan"
                cancelLabel="Batal"
            />
        </div>
    );
}