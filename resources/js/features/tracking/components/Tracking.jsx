import React, { useMemo, useState } from 'react';
import {
    Truck, CheckCircle2, AlertTriangle, MapPin, User, Clock,
    Search, RefreshCw, Navigation, Package,
} from 'lucide-react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import LiveTrackingMap from './LiveTrackingMap';

/* ──────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────── */

const trackingKpis = [
    {
        title: 'Active Deliveries',
        value: '2',
        description: 'Pengiriman sedang berlangsung',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        icon: <Truck className='h-5 w-5' />,
    },
    {
        title: 'Completed Today',
        value: '1',
        description: 'Selesai hari ini',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-500',
        icon: <CheckCircle2 className='h-5 w-5' />,
    },
    {
        title: 'Delayed',
        value: '0',
        description: 'Tidak ada keterlambatan',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-500',
        icon: <AlertTriangle className='h-5 w-5' />,
    },
    {
        title: 'Online Vehicles',
        value: '24',
        description: 'Kendaraan terlacak aktif',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-500',
        icon: <Navigation className='h-5 w-5' />,
    },
];

const statusStyles = {
    onDelivery: {
        label: 'On Delivery',
        bg: 'bg-sky-50',
        text: 'text-sky-600',
        dot: 'bg-sky-500',
    },
    pickup: {
        label: 'Pickup',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        dot: 'bg-amber-500',
    },
    delayed: {
        label: 'Delayed',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        dot: 'bg-rose-500',
    },
};

const statusFilters = [
    { value: 'all', label: 'Semua Status' },
    { value: 'onDelivery', label: 'On Delivery' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'delayed', label: 'Delayed' },
];

const activeDeliveries = [
    {
        orderId: 'JO-2024-001',
        company: 'PT Maju Jaya',
        driver: 'Ahmad Subandi',
        vehicle: 'B 1234 AB',
        location: 'Tol Cipularang KM 85',
        eta: '14:30',
        progress: 75,
        status: 'onDelivery',
    },
    {
        orderId: 'MF-2024-002',
        company: 'CV Sukses Mandiri',
        driver: 'Budi Santoso',
        vehicle: 'B 5678 CD',
        location: 'Jakarta Timur',
        eta: '08:00 - 11:00',
        progress: 15,
        status: 'pickup',
    },
    {
        orderId: 'DO-2024-003',
        company: 'UD Berkah',
        driver: 'Rudi Hartono',
        vehicle: 'B 9012 EF',
        location: 'Bekasi Utara',
        eta: '19:00',
        progress: 42,
        status: 'onDelivery',
    },
];

/* ──────────────────────────────────────────────
   SUB-COMPONENTS
   ────────────────────────────────────────────── */

function KpiCard({ card }) {
    return (
        <article className='group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300'>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor} transition-transform duration-200 group-hover:scale-110`}>
                {card.icon}
            </div>
            <div className='min-w-0'>
                <p className='text-sm text-slate-400'>{card.title}</p>
                <p className='mt-1 text-2xl font-semibold text-slate-900'>{card.value}</p>
                <p className='text-xs text-slate-500'>{card.description}</p>
            </div>
        </article>
    );
}

function StatusBadge({ status }) {
    const style = statusStyles[status] ?? statusStyles.onDelivery;
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            {style.label}
        </span>
    );
}

function DeliveryCard({ delivery }) {
    const progressColor =
        delivery.status === 'delayed'
            ? 'bg-rose-500'
            : delivery.progress >= 60
                ? 'bg-emerald-500'
                : 'bg-indigo-500';

    return (
        <article className='group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300'>
            {/* Header */}
            <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                    <p className='text-xs font-semibold text-indigo-500'>{delivery.orderId}</p>
                    <h4 className='mt-0.5 text-sm font-semibold text-slate-800 truncate'>{delivery.company}</h4>
                </div>
                <StatusBadge status={delivery.status} />
            </div>

            {/* Info rows with proper icons */}
            <div className='mt-3 space-y-2'>
                <div className='flex items-center gap-2.5 text-xs text-slate-500'>
                    <User className='h-3.5 w-3.5 shrink-0 text-slate-400' />
                    <span className='truncate'>{delivery.driver}</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-slate-500'>
                    <Truck className='h-3.5 w-3.5 shrink-0 text-slate-400' />
                    <span>{delivery.vehicle}</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-slate-500'>
                    <MapPin className='h-3.5 w-3.5 shrink-0 text-slate-400' />
                    <span className='truncate'>{delivery.location}</span>
                </div>
                <div className='flex items-center gap-2.5 text-xs text-slate-500'>
                    <Clock className='h-3.5 w-3.5 shrink-0 text-slate-400' />
                    <span>ETA: {delivery.eta}</span>
                </div>
            </div>

            {/* Progress */}
            <div className='mt-4'>
                <div className='flex items-center justify-between text-xs font-semibold text-slate-400'>
                    <span>Progress</span>
                    <span className='text-slate-600'>{delivery.progress}%</span>
                </div>
                <div className='mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100'>
                    <div
                        className={`h-full rounded-full ${progressColor} transition-all duration-500`}
                        style={{ width: `${delivery.progress}%` }}
                    />
                </div>
            </div>
        </article>
    );
}

/* ──────────────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────────────── */

export default function TrackingContent() {
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDeliveries = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return activeDeliveries.filter((delivery) => {
            const matchesSearch =
                term.length === 0 ||
                delivery.orderId.toLowerCase().includes(term) ||
                delivery.company.toLowerCase().includes(term) ||
                delivery.driver.toLowerCase().includes(term);
            const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, statusFilter]);

    return (
        <div className='relative z-0 flex flex-col gap-8'>
            {/* ─── Header ─── */}
            <header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                    <div className='flex items-center gap-3'>
                        <h1 className='text-2xl font-semibold text-slate-900'>Real-Time Tracking</h1>
                        <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700'>
                            <span className='relative flex h-2 w-2'>
                                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
                                <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500' />
                            </span>
                            Live
                        </span>
                    </div>
                    <p className='mt-2 text-sm text-slate-500'>Monitor posisi driver & kendaraan secara real-time</p>
                </div>

                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        className='inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600'
                    >
                        <RefreshCw className='h-4 w-4' />
                        Refresh
                    </button>
                </div>
            </header>

            {/* ─── KPI Cards ─── */}
            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {trackingKpis.map((card) => (
                    <KpiCard key={card.title} card={card} />
                ))}
            </section>

            {/* ─── Live Map (Full Width) ─── */}
            <section className='relative z-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600'>
                            <MapPin className='h-4 w-4' />
                        </div>
                        <div>
                            <h3 className='text-sm font-semibold text-slate-800'>Live Map</h3>
                            <p className='text-xs text-slate-400'>Posisi kendaraan diperbarui secara real-time</p>
                        </div>
                    </div>
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600'>
                        <span className='relative flex h-2 w-2'>
                            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
                            <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500' />
                        </span>
                        24 kendaraan online
                    </span>
                </div>
                <div className='mt-4 flex h-[420px] overflow-hidden rounded-2xl border border-slate-200'>
                    <LiveTrackingMap />
                </div>
            </section>

            {/* ─── Bottom 3-Column Grid ─── */}
            <section className='relative z-0'>
                {/* Active Deliveries */}
                <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <div className='flex items-center gap-2 mb-4'>
                        <Package className='h-4 w-4 text-indigo-500' />
                        <h3 className='text-sm font-semibold text-slate-800'>Active Deliveries</h3>
                    </div>

                    {/* Search & Filter */}
                    <div className='flex flex-col gap-3 mb-5'>
                        <div className='group relative'>
                            <span className='pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400'>
                                <Search className='h-4 w-4' />
                            </span>
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder='Cari order, driver...'
                                className='w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                            />
                        </div>
                        <FilterDropdown
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={statusFilters}
                            widthClass='w-full'
                        />
                    </div>

                    {/* Delivery Cards */}
                    <div className='space-y-4 max-h-[480px] overflow-y-auto pr-1'>
                        {filteredDeliveries.length > 0 ? (
                            filteredDeliveries.map((delivery) => (
                                <DeliveryCard key={delivery.orderId} delivery={delivery} />
                            ))
                        ) : (
                            <div className='py-8 text-center'>
                                <Package className='mx-auto h-8 w-8 text-slate-300' />
                                <p className='mt-2 text-sm text-slate-400'>Tidak ada pengiriman ditemukan</p>
                            </div>
                        )}
                    </div>
                </div>

            </section>
        </div>
    );
}