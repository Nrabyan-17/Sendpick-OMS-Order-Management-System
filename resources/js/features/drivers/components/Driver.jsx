import React, { useEffect, useMemo, useRef, useState } from 'react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import EditModal from '../../../components/common/EditModal';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';

import ReactDOM from 'react-dom/client';
import {
    HiHome,
    HiUsers,
    HiUser,
    HiIdentification,
    HiTruck,
    HiShieldCheck,
    HiClipboardDocument,
    HiDocument,
    HiRectangleStack,
    HiReceiptRefund,
    HiChartPie,
    HiClock,
    HiBell,
    HiChartBar,
    HiCog,
    HiBookOpen,
    HiPhone,
    HiLifebuoy,
    HiArrowRightOnRectangle,
    HiPlus,
    HiPencil,
    HiTrash,
    HiEye,
    HiMagnifyingGlass,
    HiFunnel,
    HiMapPin,
    HiStar,
    HiEnvelope,
    HiCheckCircle,
    HiArrowTrendingUp,
    HiComputerDesktop,
    HiBars3,
    HiChevronDown,
    HiSun,
    HiMoon
} from 'react-icons/hi2';

import { UserProvider, useUser } from '../../../context/UserContext';
import { logout } from '../../auth/services/authService';
import HomeContent from '../../../pages/Home';
import CustomerContent from '../../customers/components/Customer';
import AdminContent from '../../admin/components/Users';
console.log('AdminContent imported:', AdminContent);
import JobOrderContent from '../../orders/components/JobOrder';
console.log('JobOrderContent imported:', JobOrderContent);
import InvoiceContent from '../../invoices/components/Invoice';
import VehicleListContent from '../../vehicles/components/VehicleList';
import VehicleTypesContent from '../../vehicles/components/VehicleTypes';
import VehicleHistoryContent from '../../vehicles/components/VehicleHistory';
import ActiveVehiclesContent from '../../vehicles/components/ActiveVehicles';
import SupportContent from '../../../pages/Support';
import ReportContent from '../../../pages/Report';
import TrackingContent from '../../tracking/components/Tracking';
import GuideContent from '../../../pages/Guide';
import ManifestContent from '../../manifests/components/Manifest';
import DeliveryOrderContent from '../../orders/components/DeliveryOrder';
import ProfileContent from '../../../features/auth/components/Profile';
import NotificationsContent, { unreadNotificationsCount as dashboardUnreadNotifications } from '../../../pages/Notifications';
import Pagination from '../../../components/common/Pagination';
import { useDrivers } from '../hooks/useDrivers';
import { useDriversCRUD } from '../hooks/useDriversCrud';
import { useVehicles } from '../../vehicles/hooks/useVehicles';

// Jumlah data per halaman untuk Driver
const ITEMS_PER_PAGE = 6;

const navigationIcons = {
    home: HiHome,
    users: HiUsers,
    profile: HiUser,
    contacts: HiIdentification,
    driver: HiTruck,
    shield: HiShieldCheck,
    clipboard: HiClipboardDocument,
    document: HiDocument,
    layers: HiRectangleStack,
    truck: HiTruck,
    receipt: HiReceiptRefund,
    gauge: HiChartPie,
    tracking: HiClock,
    notifications: HiBell,
    chart: HiChartBar,
    settings: HiCog,
    book: HiBookOpen,
    support: HiLifebuoy,
    history: HiClock,
    activity: HiArrowTrendingUp,
};

const PlusIcon = ({ className = 'h-4 w-4' }) => <HiPlus className={className} />;
const MenuIcon = ({ className = 'h-5 w-5' }) => <HiBars3 className={className} />;
const BellIcon = ({ className = 'h-6 w-6' }) => <HiBell className={className} />;
const ChevronDownIcon = ({ className = 'h-4 w-4' }) => <HiChevronDown className={className} />;
const SunIcon = ({ className = 'h-5 w-5' }) => <HiSun className={className} />;
const MoonIcon = ({ className = 'h-5 w-5' }) => <HiMoon className={className} />;

const MonitorIcon = ({ className = 'h-5 w-5' }) => <HiComputerDesktop className={className} />;
const SearchIcon = ({ className = 'h-4 w-4' }) => <HiMagnifyingGlass className={className} />;
const LogoutIcon = ({ className = 'h-4 w-4' }) => <HiArrowRightOnRectangle className={className} />;

// Icons menggunakan React Icons
const FilterIcon = ({ className = 'h-4 w-4' }) => <HiFunnel className={className} />;
const EditIcon = ({ className = 'h-4 w-4' }) => <HiPencil className={className} />;
const TrashIcon = ({ className = 'h-4 w-4' }) => <HiTrash className={className} />;
const PhoneIcon = ({ className = 'h-4 w-4' }) => <HiPhone className={className} />;
const MailIcon = ({ className = 'h-4 w-4' }) => <HiEnvelope className={className} />;
const VehicleIcon = ({ className = 'h-5 w-5' }) => <HiTruck className={className} />;
const MapPinIcon = ({ className = 'h-4 w-4' }) => <HiMapPin className={className} />;
const StarIcon = ({ className = 'h-4 w-4' }) => <HiStar className={className} />;
const navigationSections = [
    {
        heading: 'Main',
        items: [
            { label: 'Home', icon: navigationIcons.home, view: 'home' },
            { label: 'Notifikasi', icon: navigationIcons.notifications, view: 'notifications' },
        ],
    },
    {
        heading: 'Master Data',
        items: [
            {
                label: 'Master Data',
                icon: navigationIcons.contacts,
                id: 'contacts',
                children: [
                    { label: 'Customers', icon: navigationIcons.users, view: 'customers' },
                    { label: 'Drivers', icon: navigationIcons.driver, view: 'driversManagement' },
                ],
            },
        ],
    },
    {
        heading: 'Transactions & Operations',
        items: [
            {
                label: 'Orders',
                icon: navigationIcons.clipboard,
                id: 'orders',
                children: [
                    { label: 'Job Order', icon: navigationIcons.document, view: 'jobOrder' },
                    { label: 'Manifest/Packing List', icon: navigationIcons.layers, view: 'manifest' },
                    { label: 'Delivery Order', icon: navigationIcons.truck, view: 'deliveryOrder' },
                ],
            },
        ],
    },
    {
        heading: 'Fleet & Finance',
        items: [
            { label: 'Invoices', icon: navigationIcons.receipt, view: 'invoices' },
            {
                label: 'Fleet Management',
                icon: navigationIcons.truck,
                id: 'fleetManagement',
                children: [
                    { label: 'Vehicle List', icon: navigationIcons.gauge, view: 'vehicleList' },
                    { label: 'Vehicle Types', icon: navigationIcons.layers, view: 'vehicleTypes' },
                    { label: 'History & Recap', icon: navigationIcons.history, view: 'vehicleHistory' },
                    { label: 'Active Vehicles', icon: navigationIcons.activity, view: 'activeVehicles' },
                ],
            },
        ],
    },
    {
        heading: 'Insights',
        items: [
            { label: 'Reports & Analytics', icon: navigationIcons.chart, view: 'report' },
            { label: 'Real Time Tracking', icon: navigationIcons.tracking, view: 'tracking' },
            { label: 'User Guide', icon: navigationIcons.book, view: 'guide' },
            { label: 'Support', icon: navigationIcons.support, view: 'support' },
        ],
    },
    {
        heading: 'Account & Settings',
        items: [
            { label: 'Users', icon: navigationIcons.shield, view: 'admins' },
            { label: 'Profile', icon: navigationIcons.profile, view: 'profile' },
        ],
    },
];
// Generate real-time summary cards from driver data
const generateDriverSummaryCards = (drivers = []) => {
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.status === 'Aktif' || d.status === 'aktif' || d.status === 'active').length;

    // Drivers yang sedang dalam pengiriman (memiliki active_vehicle)
    const driversOnDelivery = drivers.filter(d => d.active_vehicle_plate || d.active_vehicle_name).length;

    // Calculate average rating from drivers with valid ratings
    const driversWithRating = drivers.filter(d => Number.isFinite(Number(d.rating)) && Number(d.rating) > 0);
    const avgRating = driversWithRating.length > 0
        ? (driversWithRating.reduce((sum, d) => sum + Number(d.rating), 0) / driversWithRating.length).toFixed(1)
        : '0.0';

    // Calculate active percentage
    const activePercentage = totalDrivers > 0
        ? Math.round((activeDrivers / totalDrivers) * 100)
        : 0;

    // Calculate average orders per driver
    const totalDeliveryCount = drivers.reduce((sum, d) => sum + (d.delivery_count || 0), 0);
    const avgOrdersPerDriver = activeDrivers > 0
        ? Math.round(totalDeliveryCount / activeDrivers)
        : 0;

    // Get new drivers this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newDriversThisMonth = drivers.filter(d => {
        if (!d.created_at) return false;
        const createdDate = new Date(d.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;

    return [
        {
            title: 'Total Driver',
            value: totalDrivers.toString(),
            description: `${newDriversThisMonth} driver baru bulan ini`,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
            icon: <VehicleIcon className='h-5 w-5' />,
        },
        {
            title: 'Driver Aktif',
            value: activeDrivers.toString(),
            description: `${activePercentage}% sedang bertugas`,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-500',
            icon: <HiCheckCircle className='h-5 w-5' />,
        },
        {
            title: 'Sedang Kirim',
            value: driversOnDelivery.toString(),
            description: `Rata-rata ${avgOrdersPerDriver} order / driver`,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-500',
            icon: <HiArrowTrendingUp className='h-5 w-5' />,
        },
        {
            title: 'Rating Rata-rata',
            value: avgRating,
            description: `Dari ${driversWithRating.length} review pelanggan`,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-500',
            icon: <StarIcon className='h-5 w-5' />,
        },
    ];
};

const driverStatusStyles = {
    // Status baru sesuai dokumentasi API
    'Available': {
        label: 'Available',
        badgeBg: 'bg-green-50',
        text: 'text-green-600',
        dot: 'bg-green-500',
    },
    'On Duty': {
        label: 'On Duty',
        badgeBg: 'bg-blue-50',
        text: 'text-blue-600',
        dot: 'bg-blue-500',
    },
    'Off Duty': {
        label: 'Off Duty',
        badgeBg: 'bg-slate-50',
        text: 'text-slate-600',
        dot: 'bg-slate-500',
    },
    'Tidak Aktif': {
        label: 'Tidak Aktif',
        badgeBg: 'bg-red-50',
        text: 'text-red-600',
        dot: 'bg-red-500',
    },
    // Fallback untuk format lama (backward compatibility)
    'Aktif': {
        label: 'Aktif',
        badgeBg: 'bg-green-50',
        text: 'text-green-600',
        dot: 'bg-green-500',
    },
    'aktif': {
        label: 'Aktif',
        badgeBg: 'bg-green-50',
        text: 'text-green-600',
        dot: 'bg-green-500',
    },
    'tidak_aktif': {
        label: 'Tidak Aktif',
        badgeBg: 'bg-red-50',
        text: 'text-red-600',
        dot: 'bg-red-500',
    },
    'inactive': {
        label: 'Tidak Aktif',
        badgeBg: 'bg-red-50',
        text: 'text-red-600',
        dot: 'bg-red-500',
    },
    'active': {
        label: 'Available',
        badgeBg: 'bg-green-50',
        text: 'text-green-600',
        dot: 'bg-green-500',
    }
};

const driverShiftOptions = [
    { value: 'all', label: 'Semua Shift' },
    { value: 'pagi', label: 'Pagi' },
    { value: 'siang', label: 'Siang' },
    { value: 'malam', label: 'Malam' },
];

const driverStatusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'available', label: 'Available' },
    { value: 'on_duty', label: 'On Duty' },
    { value: 'off_duty', label: 'Off Duty' },
    { value: 'tidak_aktif', label: 'Tidak Aktif' },
];

const driverRecords = [];

const driverActivities = [
    {
        id: 'log-001',
        title: 'Order SP-239 selesai',
        description: 'Pengiriman ke PT Nusantara Logistik berhasil diselesaikan',
        timestamp: '09:45',
        type: 'success',
    },
    {
        id: 'log-002',
        title: 'Maintenance terjadwal',
        description: 'Pemeriksaan rutin kendaraan Hino Dutro 130 - DRV-027',
        timestamp: '08:20',
        type: 'maintenance',
    },
    {
        id: 'log-003',
        title: 'Shift malam dimulai',
        description: 'Driver shift malam melakukan check-in di aplikasi',
        timestamp: '20:05',
        type: 'info',
    },
];
const driverLeaderboard = [
    { id: 'rank-1', name: 'Rudi Santoso', completed: 186, rating: 4.9, area: 'Jabodetabek' },
    { id: 'rank-2', name: 'Dewi Anggraini', completed: 153, rating: 4.8, area: 'Tangerang & BSD' },
    { id: 'rank-3', name: 'Adi Pratama', completed: 168, rating: 4.6, area: 'Bekasi & Karawang' },
];
const driversViewConfig = {
    title: 'Drivers Management',
    subtitle: 'Pantau performa driver, status kendaraan, dan aktivitas operasional',
    actionButton: null,
    getContent: () => <DriverManagementContent />,
};

const viewConfigs = {
    home: {
        title: 'Dashboard',
        subtitle: 'Selamat datang di SendPick Order Management System',
        actionButton: null,
        getContent: () => <HomeContent />,
    },
    notifications: {
        title: 'Pusat Notifikasi',
        subtitle: 'Pantau update operasional, SLA, dan aktivitas tim terbaru',
        actionButton: null,
        getContent: () => <NotificationsContent />,
    },
    customers: {
        title: 'Manajemen Pelanggan',
        subtitle: 'Kelola data pelanggan, histori transaksi, dan status keaktifan',
        actionButton: null,
        getContent: () => <CustomerContent />,
    },
    drivers: driversViewConfig,
    driver: driversViewConfig, // alias untuk view singular
    driversManagement: driversViewConfig,
    admins: {
        title: 'Tim Admin',
        subtitle: 'Pengaturan peran dan aktivitas administrator sistem',
        actionButton: null,
        getContent: () => {
            console.log('Getting AdminContent for admins view...');
            return <AdminContent />;
        },
    },
    jobOrder: {
        title: 'Job Order',
        subtitle: 'Daftar penugasan operasional dan status penyelesaian',
        actionButton: null,
        getContent: () => {
            console.log('jobOrder getContent() called, returning JobOrderContent');
            console.log('JobOrderContent component:', JobOrderContent);
            if (!JobOrderContent) {
                console.error('JobOrderContent is undefined! Check import statement.');
                return <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h3 className="text-red-800 font-semibold">Import Error</h3>
                    <p className="text-red-600 mt-1">JobOrderContent component could not be loaded.</p>
                </div>;
            }
            try {
                const component = <JobOrderContent />;
                console.log('JobOrderContent component created successfully:', component);
                return component;
            } catch (error) {
                console.error('Error creating JobOrderContent component:', error);
                return <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h3 className="text-red-800 font-semibold">Component Error</h3>
                    <p className="text-red-600 mt-1">Error creating JobOrderContent: {error.message}</p>
                </div>;
            }
        },
    },
    manifest: {
        title: 'Manifest & Packing List',
        subtitle: 'Dokumentasi muatan dan detail pengiriman terkini',
        actionButton: null,
        getContent: () => <ManifestContent />,
    },
    deliveryOrder: {
        title: 'Delivery Order',
        subtitle: 'Monitoring proses pengiriman dan bukti serah terima',
        actionButton: null,
        getContent: () => <DeliveryOrderContent />,
    },
    invoices: {
        // title: 'Invoices',
        // subtitle: 'Kelola tagihan, pembayaran, dan status penagihan',
        // actionButton: { label: 'Buat Invoice', icon: navigationIcons.receipt },
        getContent: () => <InvoiceContent />,
    },
    vehicleList: {
        title: 'Daftar Kendaraan',
        subtitle: 'Inventori armada, status ketersediaan, dan jadwal perawatan',
        actionButton: null,
        getContent: () => <VehicleListContent />,
    },
    vehicleTypes: {
        title: 'Tipe Kendaraan',
        subtitle: 'Kelola kategori dan spesifikasi tipe kendaraan armada',
        actionButton: null,
        getContent: () => <VehicleTypesContent />,
    },
    vehicleHistory: {
        title: 'History & Recap Armada',
        subtitle: 'Tinjau histori operasional armada dan insight performa.',
        actionButton: { label: 'Download Laporan', icon: navigationIcons.document },
        getContent: () => <VehicleHistoryContent />,
    },
    activeVehicles: {
        title: 'Kendaraan Aktif',
        subtitle: 'Pantau status kendaraan yang sedang beroperasi secara real-time.',
        actionButton: { label: 'Refresh Status', icon: navigationIcons.activity },
        getContent: () => <ActiveVehiclesContent />,
    },
    report: {
        // title: 'Laporan & Analitik',
        // subtitle: 'Analisis performa operasional dan KPI utama',
        actionButton: null,
        getContent: () => <ReportContent />,
    },
    tracking: {
        // title: 'Pelacakan Pengiriman',
        // subtitle: 'Pantau posisi paket dan status pengiriman secara real-time',
        actionButton: null,
        getContent: () => <TrackingContent />,
    },
    guide: {
        title: 'Panduan Pengguna',
        subtitle: 'Best practice dan dokumentasi penggunaan SendPick OMS',
        actionButton: null,
        getContent: () => <GuideContent />,
    },
    support: {
        title: 'Pusat Bantuan',
        subtitle: 'Tiket dukungan, FAQ, dan resource operasional',
        actionButton: { label: 'Buat Tiket', icon: navigationIcons.support },
        getContent: () => <SupportContent />,
    },
    profile: {
        title: 'Profil Pengguna',
        subtitle: 'Kelola informasi akun dan preferensi keamanan',
        actionButton: null,
        getContent: () => <ProfileContent />,
    },
};

function DriverSummaryCard({ card }) {
    return (
        <article className='flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor}`}>
                {card.icon}
            </div>
            <div>
                <p className='text-sm text-slate-400'>{card.title}</p>
                <p className='mt-1 text-2xl font-semibold text-slate-900'>{card.value}</p>
                <p className='text-xs text-slate-500'>{card.description}</p>
            </div>
        </article>
    );
}

function DriverStatusBadge({ status }) {
    const style = driverStatusStyles[status] ?? driverStatusStyles.active;

    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.badgeBg} ${style.text}`}>
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            {style.label}
        </span>
    );
}

function DriverRow({ driver, onEdit, onDelete }) {
    // Helper function to display vehicle name in a user-friendly format
    const getDisplayVehicleName = (vehicleValue) => {
        if (vehicleValue && vehicleValue.includes('-')) {
            // Extract just the model part after the dash
            return vehicleValue.split('-')[1];
        }
        return vehicleValue;
    };

    const driverName = driver.driver_name || driver.name || 'Unknown';

    return (
        <tr className='transition-colors hover:bg-slate-50'>
            <td className='px-6 py-4'>
                <div className='flex items-center gap-4'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600'>
                        {driverName
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                    </div>
                    <div>
                        <p className='text-sm font-semibold text-slate-900'>{driverName}</p>
                        <p className='text-xs text-slate-400'>{driver.code}</p>
                    </div>
                </div>
            </td>
            <td className='px-6 py-4'>
                <div className='space-y-1 text-xs text-slate-500'>
                    <span className='flex items-center gap-2'>
                        <PhoneIcon />
                        {driver.phone}
                    </span>
                    <span className='flex items-center gap-2'>
                        <MailIcon />
                        {driver.email}
                    </span>
                </div>
            </td>
            <td className='px-6 py-4'>
                <div className='space-y-1'>
                    <p className='text-sm font-semibold text-slate-800'>{driver.active_vehicle_name || '-'}</p>
                    <p className='text-xs text-slate-400'>{driver.active_vehicle_plate || '-'}</p>
                </div>
            </td>
            <td className='px-6 py-4'>
                <div className='flex flex-col gap-1 text-xs text-slate-500'>
                    <span className='inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600'>
                        <MapPinIcon />
                        {driver.last_location_city || driver.lastLocation || '-'}
                    </span>
                </div>
            </td>
            <td className='px-6 py-4'>
                <DriverStatusBadge status={driver.status} />
            </td>
            <td className='px-6 py-4'>
                <div className='text-sm font-semibold text-slate-800'>{driver.delivery_count || 0}</div>
                <p className='text-xs text-slate-400'>Completed</p>
            </td>
            <td className='px-6 py-4'>
                <div className='flex items-center gap-1 text-sm font-semibold text-slate-800'>
                    <span className='text-xs font-bold text-slate-600'>{driver.shift}</span>
                </div>
            </td>

            <td className='px-6 py-4'>
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={(e) => {
                            e.preventDefault();
                            onEdit(driver);
                        }}
                        className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600'
                        aria-label={`Edit ${driver.name}`}
                    >
                        <EditIcon />
                    </button>
                    <button
                        type='button'
                        onClick={(e) => {
                            e.preventDefault();
                            onDelete(driver);
                        }}
                        className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:text-rose-600'
                        aria-label={`Hapus ${driver.name}`}
                    >
                        <TrashIcon />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function DriverTableSkeleton({ rows = 6 }) {
    return (
        <tbody className='divide-y divide-slate-100'>
            {Array.from({ length: rows }).map((_, index) => (
                <tr key={`driver-skeleton-${index}`} className='animate-pulse'>
                    <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                            <div className='h-10 w-10 rounded-full bg-slate-200' />
                            <div className='space-y-2'>
                                <div className='h-3 w-28 rounded bg-slate-200' />
                                <div className='h-3 w-16 rounded bg-slate-100' />
                            </div>
                        </div>
                    </td>
                    <td className='px-6 py-4'>
                        <div className='space-y-2'>
                            <div className='h-3 w-32 rounded bg-slate-200' />
                            <div className='h-3 w-20 rounded bg-slate-100' />
                        </div>
                    </td>
                    <td className='px-6 py-4'>
                        <div className='h-3 w-28 rounded bg-slate-200' />
                    </td>
                    <td className='px-6 py-4'>
                        <div className='h-3 w-32 rounded bg-slate-200' />
                    </td>
                    <td className='px-6 py-4'>
                        <div className='h-6 w-20 rounded-full bg-slate-200' />
                    </td>
                    <td className='px-6 py-4'>
                        <div className='h-3 w-16 rounded bg-slate-200' />
                    </td>

                    <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                            <div className='h-9 w-9 rounded-full bg-slate-200' />
                            <div className='h-9 w-9 rounded-full bg-slate-200' />
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
}


function DriverTable({
    drivers,
    searchTerm,
    onSearchChange,
    shiftFilter,
    onShiftChange,
    statusFilter,
    onStatusChange,
    onAdd,
    onEdit,
    onDelete,
    loading,
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
            <div className='flex flex-col gap-4'>
                {/* Header Section */}
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h2 className='text-lg font-semibold text-slate-900'>Daftar Driver</h2>
                        <p className='text-sm text-slate-400'>Kontrol aktivitas dan kinerja driver harian</p>
                    </div>
                    <div className='flex justify-end'>
                        <button
                            type='button'
                            onClick={onAdd}
                            className='inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                        >
                            <HiPlus className='h-4 w-4' />
                            Tambah Driver
                        </button>
                    </div>
                </div>
                {/* Search & Filter Section */}
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                    <div className='group relative flex-1'>
                        <span className='pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400'>
                            <SearchIcon />
                        </span>
                        <input
                            type='text'
                            value={searchTerm}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder='Cari driver, plat nomor, atau rute...'
                            className='w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                        />
                    </div>
                    <FilterDropdown
                        value={shiftFilter}
                        onChange={onShiftChange}
                        options={driverShiftOptions}
                        widthClass='w-full sm:w-48'
                        leadingIcon={<FilterIcon />}
                    />
                    <FilterDropdown
                        value={statusFilter}
                        onChange={onStatusChange}
                        options={driverStatusOptions}
                        widthClass='w-full sm:w-48'
                    />
                </div>
            </div>
            <div className='mt-6 overflow-x-auto'>
                <table className='w-full min-w-[980px] border-collapse'>
                    <thead>
                        <tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                            <th className='px-6 py-3'>Driver</th>
                            <th className='px-6 py-3'>Kontak</th>
                            <th className='px-6 py-3'>Kendaraan</th>
                            <th className='px-6 py-3'>Lokasi Terakhir</th>
                            <th className='px-6 py-3'>Status</th>
                            <th className='px-6 py-3'>Order</th>
                            <th className='px-6 py-3'>Shift</th>

                            <th className='px-6 py-3'>Aksi</th>
                        </tr>
                    </thead>
                    {loading ? (
                        <DriverTableSkeleton rows={ITEMS_PER_PAGE} />
                    ) : (
                        <tbody className='divide-y divide-slate-100'>
                            {drivers.length > 0 ? (
                                drivers.map((driver) => (
                                    <DriverRow
                                        key={driver.driver_id || driver.code}
                                        driver={driver}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className='px-6 py-12 text-center text-sm text-slate-400'>
                                        Tidak ada driver yang sesuai dengan filter saat ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    )}
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


function DriverActivityTimeline() {
    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between'>
                <div>
                    <h3 className='text-base font-semibold text-slate-900'>Aktivitas Terbaru</h3>
                    <p className='text-sm text-slate-400'>Ringkasan aktivitas operasional dalam 24 jam terakhir</p>
                </div>
                <button
                    type='button'
                    className='text-xs font-semibold text-indigo-600 transition hover:text-indigo-500'
                >
                    Lihat Semua
                </button>
            </div>
            <ol className='mt-6 space-y-4 text-sm text-slate-600'>
                {driverActivities.map((activity) => (
                    <li key={activity.id} className='flex gap-3'>
                        <span className='mt-1 h-2 w-2 rounded-full bg-indigo-500' />
                        <div className='flex-1 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm'>
                            <div className='flex items-center justify-between'>
                                <p className='font-medium text-slate-800'>{activity.title}</p>
                                <span className='text-xs text-slate-400'>{activity.timestamp}</span>
                            </div>
                            <p className='mt-1 text-xs text-slate-500'>{activity.description}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}

function DriverLeaderboard() {
    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <h3 className='text-base font-semibold text-slate-900'>Top Performer</h3>
            <p className='text-sm text-slate-400'>Driver dengan penyelesaian order tertinggi minggu ini</p>
            <div className='mt-6 space-y-3'>
                {driverLeaderboard.map((entry, index) => (
                    <article
                        key={entry.id}
                        className='flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-4 transition hover:border-slate-200'
                    >
                        <div className='flex items-center gap-3'>
                            <span className='flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600'>
                                #{index + 1}
                            </span>
                            <div>
                                <p className='text-sm font-semibold text-slate-800'>{entry.name}</p>
                                <p className='text-xs text-slate-400'>{entry.area}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-4 text-sm font-semibold text-slate-700'>
                            <span>{entry.completed} order</span>
                            <span className='inline-flex items-center gap-1 text-amber-500'>
                                <StarIcon className='h-3.5 w-3.5' />
                                {entry.rating.toFixed(1)}
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function DriverManagementContent() {

    const [currentView, setCurrentView] = useState('driversManagement');
    const [navigationOpen, setNavigationOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [shiftFilter, setShiftFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [theme, setTheme] = useState('light');
    const [editModal, setEditModal] = useState({ isOpen: false, driver: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, driver: null });
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [driversList, setDriversList] = useState([]);
    const [notification, setNotification] = useState({ type: null, message: null });
    const [currentPage, setCurrentPage] = useState(1);
    const filterEffectInitialized = useRef(false);

    const { drivers, loading, error: fetchError, refetch } = useDrivers({ per_page: 15 });
    const { vehicles, loading: vehiclesLoading } = useVehicles({ per_page: 100 });
    const {
        isCreating,
        isUpdating,
        isDeleting,
        error: mutationError,
        successMessage,
        createDriver,
        updateDriver,
        deleteDriver,
    } = useDriversCRUD([]);

    useEffect(() => {
        console.log('🔄 useEffect triggered - drivers changed:', drivers);
        console.log('📊 Number of drivers:', drivers?.length);
        console.log('📋 Drivers data:', drivers);

        // Update driversList with the new data
        if (drivers && Array.isArray(drivers)) {
            setDriversList([...drivers]);
            console.log('✅ driversList updated with', drivers.length, 'drivers');
        } else {
            console.warn('⚠️ No valid drivers data received');
            setDriversList([]);
        }
    }, [drivers]);

    useEffect(() => {
        if (fetchError || mutationError) {
            setNotification({ type: 'error', message: fetchError || mutationError });
        } else if (successMessage) {
            setNotification({ type: 'success', message: successMessage });
        } else {
            setNotification({ type: null, message: null });
        }
    }, [fetchError, mutationError, successMessage]);

    useEffect(() => {
        if (!filterEffectInitialized.current) {
            filterEffectInitialized.current = true;
            return;
        }
        const handler = setTimeout(() => {
            refetch({
                search: searchTerm || undefined,
                shift: shiftFilter !== 'all' ? shiftFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            });
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, shiftFilter, statusFilter, refetch]);

    const handleAddDriver = () => {
        setEditModal({ isOpen: true, driver: null });
    };

    const handleEditDriver = (driver) => {
        setEditModal({ isOpen: true, driver });
    };

    const handleDeleteDriver = (driver) => {
        setDeleteModal({ isOpen: true, driver });
    };

    const filteredDrivers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return driversList.filter((driver) => {
            const matchesShift = shiftFilter === 'all' || driver.shift === shiftFilter;

            // Normalize status for comparison
            const driverStatus = (driver.status || '').toLowerCase().replace(/\s+/g, '_');
            const matchesStatus = statusFilter === 'all' ||
                // Status baru
                (statusFilter === 'available' && (driverStatus === 'available' || driverStatus === 'aktif' || driverStatus === 'active')) ||
                (statusFilter === 'on_duty' && driverStatus === 'on_duty') ||
                (statusFilter === 'off_duty' && driverStatus === 'off_duty') ||
                (statusFilter === 'tidak_aktif' && (driverStatus === 'tidak_aktif' || driverStatus === 'inactive'));

            const driverName = driver.driver_name || driver.name || '';
            const matchesSearch =
                term.length === 0 ||
                driverName.toLowerCase().includes(term) ||
                (driver.code && driver.code.toLowerCase().includes(term)) ||
                (driver.phone && driver.phone.toLowerCase().includes(term)) ||
                (driver.email && driver.email.toLowerCase().includes(term)) ||
                (driver.vehicle && driver.vehicle.toLowerCase().includes(term)) ||
                (driver.plate && driver.plate.toLowerCase().includes(term)) ||
                (driver.lastLocation && driver.lastLocation.toLowerCase().includes(term));
            return matchesShift && matchesStatus && matchesSearch;
        });
    }, [searchTerm, shiftFilter, statusFilter, driversList]);

    // Pagination calculations
    const totalItems = filteredDrivers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedDrivers = filteredDrivers.slice(startIndex, endIndex);

    // Reset ke halaman 1 saat filter/search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, shiftFilter, statusFilter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Generate real-time summary cards from driver data
    const driverSummaryCards = useMemo(() => generateDriverSummaryCards(driversList), [driversList]);

    return (
        <>
            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {driverSummaryCards.map((card) => (
                    <DriverSummaryCard key={card.title} card={card} />
                ))}
            </section>
            <section className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
                <DriverTable
                    drivers={paginatedDrivers}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    shiftFilter={shiftFilter}
                    onShiftChange={setShiftFilter}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    onAdd={handleAddDriver}
                    onEdit={handleEditDriver}
                    onDelete={handleDeleteDriver}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={handlePageChange}
                />
                <div className='space-y-6'>
                    <DriverActivityTimeline />
                    <DriverLeaderboard />
                </div>
            </section>

            {/* Edit Modal */}
            <EditModal
                title={editModal.driver ? 'Edit Driver' : 'Tambah Driver'}
                fields={[
                    {
                        name: 'driver_name',
                        label: 'Nama Driver',
                        type: 'text',
                        required: true,
                        placeholder: 'Masukkan nama driver',
                    },
                    {
                        name: 'phone',
                        label: 'Nomor Telepon',
                        type: 'tel',
                        required: true,
                        placeholder: 'Contoh: +62812345678',
                    },
                    {
                        name: 'email',
                        label: 'Email',
                        type: 'email',
                        required: true,
                        placeholder: 'Masukkan alamat email',
                    },
                    {
                        name: 'password',
                        label: 'Password',
                        type: 'password',
                        required: !editModal.driver, // Wajib hanya pada saat tambah data baru
                        placeholder: 'Masukkan password',
                    },
                    {
                        name: 'password_confirmation',
                        label: 'Konfirmasi Password',
                        type: 'password',
                        required: !editModal.driver, // Wajib hanya saat tambah baru
                        placeholder: 'Ulangi password',
                    },
                    {
                        name: 'shift',
                        label: 'Shift Kerja',
                        type: 'select',
                        required: true,
                        options: [
                            { value: 'pagi', label: 'Pagi (06:00-14:00)' },
                            { value: 'siang', label: 'Siang (14:00-22:00)' },
                            { value: 'malam', label: 'Malam (22:00-06:00)' },
                        ],
                    },
                    // Hanya tampilkan status jika dalam mode edit
                    // Admin hanya bisa set: Off Duty atau Tidak Aktif
                    // Available & On Duty dikontrol oleh driver/sistem (tidak ditampilkan)
                    ...(editModal.driver ? [{
                        name: 'status',
                        label: 'Status',
                        type: 'select',
                        required: true,
                        description: 'Available & On Duty dikontrol oleh driver melalui aplikasi mobile',
                        options: [
                            { value: 'Off Duty', label: 'Off Duty (Offline)' },
                            { value: 'Tidak Aktif', label: 'Tidak Aktif (Nonaktifkan Akun)' },
                        ],
                    }] : []),
                ]}
                initialData={editModal.driver}
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, driver: null })}
                onFieldChange={(fieldName, value, setFormData) => {
                    // Default behavior: update semua field
                    setFormData(prev => ({
                        ...prev,
                        [fieldName]: value
                    }));
                }}
                onSubmit={async (formData) => {
                    try {
                        console.log('📝 Submitting driver data:', formData);

                        // Siapkan data yang akan dikirim
                        const dataToSubmit = {
                            ...formData,
                        };

                        console.log('📤 Data to submit:', dataToSubmit);

                        if (editModal.driver) {
                            console.log('✏️ Updating driver:', editModal.driver.driver_id);
                            const result = await updateDriver(editModal.driver.driver_id, dataToSubmit);
                            console.log('✅ Update result:', result);

                            if (result && !result.success) {
                                throw new Error(result.error || 'Gagal memperbarui data driver');
                            }
                        } else {
                            console.log('📝 Creating new driver:', dataToSubmit);
                            const result = await createDriver(dataToSubmit);
                            console.log('✅ Create result:', result);

                            if (result && !result.success) {
                                throw new Error(result.error || 'Gagal menambahkan driver baru');
                            }
                        }

                        console.log('🔄 Refetching drivers list...');
                        await refetch();
                        console.log('✅ Refetch complete');

                        setEditModal({ isOpen: false, driver: null });
                    } catch (error) {
                        console.error('❌ Error saving driver:', error);
                        // Tampilkan pesan error ke user
                        alert(error.message || 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
                        console.error('Error saving driver:', error);
                    }
                }}
                isLoading={isCreating || isUpdating}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                title="Hapus Driver"
                message={`Apakah Anda yakin ingin menghapus driver "${deleteModal.driver?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, driver: null })}
                onConfirm={async () => {
                    await deleteDriver(deleteModal.driver.driver_id);
                    await refetch();
                }}
                isLoading={isDeleting}
            />
        </>
    );
}

const ThemeIndicator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selection, setSelection] = useState('light');

    const options = useMemo(
        () => [
            { value: 'light', label: 'Light', icon: SunIcon },
            { value: 'dark', label: 'Dark', icon: MoonIcon },
            { value: 'system', label: 'System', icon: MonitorIcon },
        ],
        [],
    );

    const selectedOption = options.find((option) => option.value === selection) ?? options[0];
    const SelectedIcon = selectedOption.icon;

    const handleBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsOpen(false);
        }
    };

    const handleSelect = (value) => {
        setSelection(value);
        setIsOpen(false);
    };

    const menuClassName = [
        'absolute right-0 mt-3 w-44 rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-lg transition-all duration-150 ease-out origin-top-right',
        isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
    ].join(' ');

    return (
        <div
            className='relative'
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onFocus={() => setIsOpen(true)}
            onBlur={handleBlur}
        >
            <button
                type='button'
                className='flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                aria-haspopup='menu'
                aria-expanded={isOpen}
                aria-label='Pilih mode tampilan'
                onClick={() => setIsOpen((previous) => !previous)}
            >
                <SelectedIcon className='h-5 w-5' />
            </button>
            <div className={menuClassName}>
                {options.map((option) => {
                    const OptionIcon = option.icon;
                    const isActive = selection === option.value;
                    const optionClassName = [
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                        isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600',
                    ].join(' ');

                    return (
                        <button
                            key={option.value}
                            type='button'
                            onClick={() => handleSelect(option.value)}
                            className={optionClassName}
                        >
                            <OptionIcon className='h-4 w-4' />
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const UserDropdown = ({ user, onNavigateProfile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsOpen(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            // Clear user data dari localStorage
            localStorage.removeItem('sendpick_user');
            // Redirect ke halaman login
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Tetap redirect meskipun API gagal
            localStorage.removeItem('sendpick_user');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleProfileClick = () => {
        setIsOpen(false);
        onNavigateProfile();
    };

    const menuClassName = [
        'absolute right-0 mt-3 w-48 rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-lg transition-all duration-150 ease-out origin-top-right z-50',
        isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
    ].join(' ');

    return (
        <div
            className='relative'
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onFocus={() => setIsOpen(true)}
            onBlur={handleBlur}
        >
            {/* User Info Button */}
            <button
                type='button'
                onClick={() => setIsOpen((previous) => !previous)}
                className='flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                aria-haspopup='menu'
                aria-expanded={isOpen}
                aria-label='Menu akun'
            >
                <div className='relative h-10 w-10 overflow-hidden rounded-full border border-indigo-100 shadow-sm'>
                    <img
                        src={user.photo}
                        alt={user.fullName}
                        className='h-full w-full object-cover'
                    />
                </div>
                <div className='text-sm leading-tight text-left'>
                    <p className='font-semibold text-slate-800'>{user.fullName}</p>
                    <p className='text-xs text-slate-400'>{user.username}</p>
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>

            {/* Dropdown Menu */}
            <div className={menuClassName}>
                {/* Profile Option */}
                <button
                    type='button'
                    onClick={handleProfileClick}
                    className='flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                >
                    <HiUser className='h-4 w-4' />
                    Profil Saya
                </button>

                {/* Divider */}
                <div className='my-1 border-t border-slate-200' />

                {/* Logout Option */}
                <button
                    type='button'
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className='flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    <LogoutIcon className='h-4 w-4' />
                    {isLoggingOut ? 'Keluar...' : 'Logout'}
                </button>
            </div>
        </div>
    );
};

function Sidebar({ activeView, onNavigate, isOpen, onToggle, isTransitioning }) {
    const [expandedIds, setExpandedIds] = useState(() => {
        const ids = [];
        navigationSections.forEach((section) => {
            section.items.forEach((item) => {
                if (item.children && (item.id || item.label)) {
                    ids.push(item.id ?? item.label);
                }
            });
        });
        return new Set(ids);
    });

    const collapsed = !isOpen;

    const toggleExpand = (id) => {
        setExpandedIds((previous) => {
            const next = new Set(previous);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleNavigate = (view) => {
        console.log('handleNavigate called with view:', view);
        onNavigate(view);
        if (collapsed) {
            onToggle(true);
        }
    };

    const handleParentClick = (item) => {
        const id = item.id ?? item.label;
        if (collapsed) {
            onToggle(true);
            if (item.children && item.children.length > 0) {
                onNavigate(item.children[0].view);
            }
            return;
        }
        toggleExpand(id);
    };

    const motionStyle = (maxWidth = '999px', delay = 0) => ({
        transition: `max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${delay + 50}ms, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        maxWidth: collapsed ? '0px' : maxWidth,
        opacity: collapsed ? 0 : 1,
        transform: collapsed ? 'translateX(-12px) scale(0.95)' : 'translateX(0) scale(1)',
        transformOrigin: 'left center',
        willChange: 'max-width, opacity, transform',
    });

    const asideClassName = [
        'group/sidebar flex h-full flex-col border-r border-slate-200 bg-white sidebar-container',
        // Mobile: fixed positioned sidebar, Desktop: relative
        'lg:relative fixed inset-y-0 left-0 z-30 lg:z-auto',
        // Width with smooth animation - ChatGPT style
        isOpen ? 'w-72' : 'w-72 lg:w-20',
        // Shadows for depth
        isOpen ? 'shadow-2xl lg:shadow-sm' : 'shadow-sm',
        // Enhanced slide animation like ChatGPT with different animations for show/hide
        isOpen
            ? 'translate-x-0 lg:translate-x-0 sidebar-mobile-slide showing'
            : '-translate-x-full lg:translate-x-0 sidebar-mobile-hide hiding',
        // Desktop width transition
        'sidebar-desktop-width',
        // Add transitioning class for extra smoothness
        isTransitioning ? 'transitioning' : '',
    ].join(' ');

    const navPaddingClass = collapsed ? 'px-2 pb-6' : 'px-4 pb-8';

    return (
        <aside id='dashboard-sidebar' className={asideClassName}>
            <div
                className={[
                    'flex items-center sidebar-content-slide',
                    collapsed ? 'justify-center px-3 py-6' : 'gap-3 px-6 py-8',
                ].join(' ')}
            >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-white overflow-hidden sidebar-hover-smooth ${collapsed ? 'scale-100' : 'scale-100'
                    }`}>
                    <img
                        src="/assets/logo_sendpick.aea87447-400x150.png"
                        alt="Sendpick Logo"
                        className="h-8 w-auto object-contain"
                    />
                </div>
                <div className='overflow-hidden' style={motionStyle('200px', 100)}>
                    <div className={`sidebar-content-slide ${collapsed ? 'translate-x-2 opacity-0' : 'translate-x-0 opacity-100'
                        }`}>
                        <p className='text-sm font-semibold text-slate-900'>Sendpick Logistics</p>
                        <p className='text-xs text-slate-400'>Order Management System</p>
                    </div>
                </div>
            </div>

            <nav className={['sidebar-scroll flex-1 overflow-y-auto sidebar-content-slide', navPaddingClass, collapsed ? 'translate-x-0 scale-98' : 'translate-x-0 scale-100'].join(' ')}>
                {navigationSections.map((section, sectionIndex) => (
                    <div key={section.heading} className={collapsed ? 'mb-4 flex flex-col items-center gap-2' : 'mb-6'}>
                        <div
                            className={`${collapsed ? 'flex justify-center overflow-hidden' : 'px-3'} delay-${Math.min(sectionIndex * 75 + 75, 300)}`}
                            style={motionStyle('160px', sectionIndex * 50)}
                        >
                            <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                                {section.heading}
                            </p>
                        </div>
                        <div className={collapsed ? 'flex flex-col items-center gap-2' : 'mt-3 space-y-1'}>
                            {section.items.map((item, itemIndex) => {
                                const childActive = item.children ? item.children.some((child) => child.view === activeView) : false;
                                const Icon = item.icon;

                                if (item.children) {
                                    const id = item.id ?? item.label;
                                    const isExpanded = expandedIds.has(id);
                                    const isActive = activeView === item.view || childActive;
                                    const childContainerClasses = !collapsed && isExpanded
                                        ? 'mt-1 space-y-1 overflow-hidden dropdown-container dropdown-smooth-transition max-h-60 opacity-100 translate-y-0 scale-100'
                                        : 'overflow-hidden dropdown-container dropdown-smooth-transition max-h-0 opacity-0 -translate-y-2 scale-95';
                                    const parentLabelStyle = motionStyle('168px', sectionIndex * 50 + itemIndex * 30);
                                    if (!collapsed) {
                                        parentLabelStyle.marginLeft = '4px';
                                    }

                                    return (
                                        <div key={id} className='w-full'>
                                            <button
                                                type='button'
                                                onClick={() => handleParentClick(item)}
                                                className={[
                                                    'sidebar-item flex w-full items-center rounded-2xl px-3 py-2.5 text-sm font-medium sidebar-hover-smooth',
                                                    collapsed ? 'justify-center gap-0' : 'justify-between gap-3',
                                                    isExpanded || isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100',
                                                ].join(' ')}
                                            >
                                                <span
                                                    className={[
                                                        'flex items-center transition-all duration-400 ease-out',
                                                        collapsed ? 'gap-0' : 'gap-3',
                                                    ].join(' ')}
                                                >
                                                    <span className='text-slate-400'>{Icon ? Icon('h-5 w-5') : null}</span>
                                                    <span
                                                        className='overflow-hidden whitespace-nowrap'
                                                        style={parentLabelStyle}
                                                    >
                                                        {item.label}
                                                    </span>
                                                </span>
                                                <ChevronDownIcon
                                                    className={[
                                                        'h-4 w-4 chevron-smooth',
                                                        collapsed ? 'opacity-0 scale-75' : isExpanded ? 'chevron-expanded' : 'rotate-0',
                                                    ].join(' ')}
                                                />
                                            </button>
                                            <div className={childContainerClasses}>
                                                <div className='space-y-1 pt-1'>
                                                    {item.children.map((child, childIndex) => {
                                                        const ChildIcon = child.icon;
                                                        const isActiveChild = activeView === child.view;
                                                        const childLabelStyle = motionStyle('160px', sectionIndex * 50 + itemIndex * 30 + childIndex * 20);
                                                        if (!collapsed) {
                                                            childLabelStyle.marginLeft = '4px';
                                                        }
                                                        const bulletStyle = collapsed
                                                            ? {
                                                                width: 0,
                                                                opacity: 0,
                                                                transform: 'scale(0.3) translateX(-4px)',
                                                                marginRight: 0,
                                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            }
                                                            : {
                                                                width: '0.5rem',
                                                                opacity: 1,
                                                                transform: 'scale(1) translateX(0)',
                                                                marginRight: '12px',
                                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            };

                                                        return (
                                                            <button
                                                                key={child.view}
                                                                type='button'
                                                                onClick={() => handleNavigate(child.view)}
                                                                className={[
                                                                    'sidebar-item flex w-full items-center rounded-2xl px-3 py-2 text-sm font-medium dropdown-item-hover',
                                                                    collapsed ? 'justify-center gap-0' : 'gap-3',
                                                                    isActiveChild ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100',
                                                                    isExpanded ? `animate-dropdown-item-fade stagger-${Math.min(childIndex + 1, 6)}` : '',
                                                                ].join(' ')}
                                                            >
                                                                <span
                                                                    className={[
                                                                        'flex h-2 flex-shrink-0 rounded-full transition-all duration-400 ease-out',
                                                                        isActiveChild ? 'bg-white' : 'bg-slate-300',
                                                                    ].join(' ')}
                                                                    style={bulletStyle}
                                                                />
                                                                <span className='text-slate-400'>{ChildIcon ? ChildIcon('h-4 w-4') : null}</span>
                                                                <span
                                                                    className='overflow-hidden whitespace-nowrap'
                                                                    style={childLabelStyle}
                                                                >
                                                                    {child.label}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                const isActive = activeView === item.view || childActive;
                                const simpleLabelStyle = motionStyle('168px', sectionIndex * 50 + itemIndex * 30);
                                if (!collapsed) {
                                    simpleLabelStyle.marginLeft = '4px';
                                }
                                const simpleBulletStyle = collapsed
                                    ? {
                                        width: 0,
                                        opacity: 0,
                                        transform: 'scale(0.3) translateX(-4px)',
                                        marginRight: 0,
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }
                                    : {
                                        width: '0.5rem',
                                        opacity: 1,
                                        transform: 'scale(1) translateX(0)',
                                        marginRight: '12px',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    };

                                return (
                                    <button
                                        key={item.view ?? item.label}
                                        type='button'
                                        onClick={() => handleNavigate(item.view)}
                                        className={[
                                            'sidebar-item flex w-full items-center rounded-2xl px-3 py-2.5 text-sm font-medium sidebar-hover-smooth',
                                            collapsed ? 'justify-center gap-0' : 'gap-3',
                                            isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100',
                                        ].join(' ')}
                                    >
                                        <span
                                            className={[
                                                'flex h-2 flex-shrink-0 rounded-full transition-all duration-400 ease-out',
                                                isActive ? 'bg-white' : 'bg-slate-300',
                                            ].join(' ')}
                                            style={simpleBulletStyle}
                                        />
                                        <span className='text-slate-400'>{Icon ? Icon('h-5 w-5') : null}</span>
                                        <span
                                            className='overflow-hidden whitespace-nowrap'
                                            style={simpleLabelStyle}
                                        >
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}

function DashboardLayout() {
    const [activeView, setActiveView] = useState('home');

    // Create a wrapped setActiveView with logging
    const handleSetActiveView = (view) => {
        console.log('Navigation requested to view:', view);
        setActiveView(view);
        console.log('ActiveView state updated to:', view);
    };
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showVehiclePopup, setShowVehiclePopup] = useState(false);
    const [showVehicleTypesPopup, setShowVehicleTypesPopup] = useState(false);
    const [sidebarTransitioning, setSidebarTransitioning] = useState(false);
    const { user } = useUser();

    const activeConfig = viewConfigs[activeView] ?? viewConfigs.home;

    console.log('Current activeView:', activeView);
    console.log('Active config:', activeConfig);

    useEffect(() => {
        if (activeView !== 'vehicleList') {
            setShowVehiclePopup(false);
        }
        if (activeView !== 'vehicleTypes') {
            setShowVehicleTypesPopup(false);
        }
    }, [activeView]);

    // Handle smooth sidebar transitions
    useEffect(() => {
        setSidebarTransitioning(true);
        const timer = setTimeout(() => {
            setSidebarTransitioning(false);
        }, isSidebarOpen ? 400 : 600); // Match animation durations

        return () => clearTimeout(timer);
    }, [isSidebarOpen]);

    const mainContent = useMemo(() => {
        console.log('Rendering mainContent for activeView:', activeView);

        if (activeView === 'vehicleList') {
            return (
                <VehicleListContent showPopup={showVehiclePopup} setShowPopup={setShowVehiclePopup} />
            );
        }

        if (activeView === 'vehicleTypes') {
            return (
                <VehicleTypesContent showPopup={showVehicleTypesPopup} setShowPopup={setShowVehicleTypesPopup} />
            );
        }

        console.log('Using activeConfig.getContent() for:', activeView);
        try {
            const content = activeConfig.getContent();
            console.log('Content result:', content);
            if (!content) {
                console.warn('getContent() returned null/undefined for view:', activeView);
                return <div className="p-4">Content not available for view: {activeView}</div>;
            }
            return content;
        } catch (error) {
            console.error('Error rendering content for view:', activeView, error);
            return (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h3 className="text-red-800 font-semibold">Error Loading Content</h3>
                    <p className="text-red-600 mt-1">Failed to load content for view: {activeView}</p>
                    <pre className="text-xs text-red-500 mt-2 overflow-auto">{error.message}</pre>
                </div>
            );
        }
    }, [activeConfig, activeView, showVehiclePopup, setShowVehiclePopup, showVehicleTypesPopup, setShowVehicleTypesPopup]);

    const actionButton = activeConfig.actionButton;
    const ActionIcon = actionButton?.icon;
    const isNotificationsView = activeView === 'notifications';

    const handleActionClick = (e) => {
        e.preventDefault();
    };
    return (
        <div className='flex h-screen w-full overflow-hidden bg-white text-slate-700'>
            {/* ChatGPT-like Mobile overlay with progressive backdrop */}
            <div
                className={`fixed inset-0 z-20 lg:hidden backdrop-progressive ${isSidebarOpen
                    ? 'opacity-100 visible bg-slate-900/25'
                    : 'opacity-0 invisible bg-slate-900/0'
                    } ${isSidebarOpen ? 'visible' : ''} ${sidebarTransitioning ? 'transitioning' : ''}`}
                style={{
                    backdropFilter: isSidebarOpen ? 'blur(6px)' : 'blur(0px)',
                    pointerEvents: isSidebarOpen ? 'auto' : 'none'
                }}
                onClick={() => setIsSidebarOpen(false)}
            />
            <Sidebar
                activeView={activeView}
                onNavigate={handleSetActiveView}
                isOpen={isSidebarOpen}
                onToggle={setIsSidebarOpen}
                isTransitioning={sidebarTransitioning}
            />
            <div className="flex flex-1 flex-col overflow-y-auto sidebar-content-slide">
                <header className='sticky top-0 z-10 flex h-20 p-5 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm'>
                    <div className='flex items-center gap-4 text-sm text-slate-500'>
                        <button
                            type='button'
                            className='rounded-xl border border-slate-200 p-2 text-slate-500 sidebar-hover-smooth hover:border-indigo-200 hover:text-indigo-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                            onClick={() => setIsSidebarOpen((previous) => !previous)}
                            aria-label='Toggle sidebar'
                            aria-controls='dashboard-sidebar'
                            aria-expanded={isSidebarOpen}
                        >
                            <MenuIcon />
                        </button>
                        <span className='font-medium text-slate-600'>Sendpick</span>
                    </div>
                    <div className='flex items-center gap-5'>
                        <ThemeIndicator />
                        <button
                            type='button'
                            onClick={() => setActiveView('notifications')}
                            aria-label='Notifikasi'
                            aria-pressed={isNotificationsView}
                            className={[
                                'relative rounded-xl border p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                                isNotificationsView
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm'
                                    : 'border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-600',
                            ].join(' ')}
                        >
                            <BellIcon />
                            {dashboardUnreadNotifications > 0 ? (
                                <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white'>
                                    {dashboardUnreadNotifications}
                                </span>
                            ) : null}
                        </button>
                        {/* User Account Dropdown */}
                        <UserDropdown
                            user={user}
                            onNavigateProfile={() => setActiveView('profile')}
                        />
                    </div>
                </header>
                <main className='flex-1 bg-white'>
                    <div className='mx-auto flex max-w-6xl flex-col gap-8 px-10 py-8'>
                        <div className='flex items-start justify-between'>
                            <div>
                                <h1 className='text-2xl font-semibold text-slate-900'>{activeConfig.title}</h1>
                                <p className='mt-2 text-sm text-slate-500'>{activeConfig.subtitle}</p>
                            </div>
                            {actionButton ? (
                                <button
                                    type='button'
                                    onClick={handleActionClick}
                                    className='inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                                >
                                    {ActionIcon ? ActionIcon('h-4 w-4') : null}
                                    {actionButton.label}
                                </button>
                            ) : null}
                        </div>
                        {mainContent}
                    </div>
                </main>
            </div>
        </div>
    );
}

function Dashboard() {
    return (
        <UserProvider>
            <DashboardLayout />
        </UserProvider>
    );
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global JavaScript Error:', event.error);
    console.error('Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
});

const container = document.getElementById('dashboard');

if (container) {
    console.log('Dashboard container found, mounting React app...');
    try {
        const root = ReactDOM.createRoot(container);
        console.log('React root created, rendering Dashboard component...');
        root.render(<Dashboard />);
        console.log('Dashboard component rendered successfully');
    } catch (error) {
        console.error('Error rendering Dashboard component:', error);
        container.innerHTML = `
            <div style="padding: 20px; background: #fee; color: #c00; font-family: Arial, sans-serif;">
                <h2>Application Error</h2>
                <p>Failed to load dashboard: ${error.message}</p>
                <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
            </div>
            `;
    }
} else {
    console.error('Dashboard container not found!');
}