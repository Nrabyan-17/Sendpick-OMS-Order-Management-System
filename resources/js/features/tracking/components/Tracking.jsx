import React, { useMemo, useState } from 'react';
import {
    Truck, CheckCircle2, AlertTriangle, MapPin, User, Clock,
    Search, RefreshCw, Radio, Navigation, Package, CircleDot,
    Info, CircleCheck, TriangleAlert, Route,
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

const liveEvents = [
    { id: 1, time: '09:30', message: 'Budi Santoso memulai perjalanan ke Bandung.', type: 'info' },
    { id: 2, time: '09:45', message: 'Siti Kurnia telah sampai di lokasi Pickup.', type: 'success' },
    { id: 3, time: '10:00', message: 'Ahmad Subandi terjebak macet (Speed: 0 km/h selama 15 menit).', type: 'warning' },
    { id: 4, time: '10:15', message: 'Rudi Hartono melewati checkpoint Bekasi Barat.', type: 'info' },
];

const timelineEvents = [
    { time: '08:00', title: 'Berangkat', description: 'Driver memulai perjalanan dari Pool Jakarta.' },
    { time: '10:00', title: 'Sampai Rest Area', description: 'Istirahat di Rest Area KM 57.' },
    { time: '12:00', title: 'Melanjutkan Perjalanan', description: 'Kembali ke rute utama menuju tujuan.' },
    { time: '14:00', title: 'Mendekati Tujuan', description: 'Estimasi tiba dalam 30 menit.' },
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

function LiveEventsTicker() {
    const eventIcon = {
        info: <Info className='h-3.5 w-3.5' />,
        success: <CircleCheck className='h-3.5 w-3.5' />,
        warning: <TriangleAlert className='h-3.5 w-3.5' />,
    };

    const eventDotColor = {
        info: 'bg-sky-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
    };

    const eventTextColor = {
        info: 'text-slate-700',
        success: 'text-emerald-700',
        warning: 'text-amber-700',
    };

    const eventIconColor = {
        info: 'text-sky-500',
        success: 'text-emerald-500',
        warning: 'text-amber-500',
    };

    return (
        <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between mb-5'>
                <div className='flex items-center gap-2'>
                    <Radio className='h-4 w-4 text-indigo-500' />
                    <h4 className='text-sm font-semibold text-slate-800'>Live Updates</h4>
                </div>
                <span className='inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600'>
                    <span className='relative flex h-2 w-2'>
                        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
                        <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500' />
                    </span>
                    Live
                </span>
            </div>
            <div className='space-y-4'>
                {liveEvents.map((event, index) => (
                    <div key={event.id} className='flex gap-3'>
                        <div className='flex flex-col items-center'>
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${event.type === 'warning' ? 'bg-amber-50' : event.type === 'success' ? 'bg-emerald-50' : 'bg-sky-50'} ${eventIconColor[event.type]}`}>
                                {eventIcon[event.type]}
                            </div>
                            {index < liveEvents.length - 1 && (
                                <div className='mt-1 h-full w-px bg-slate-200' />
                            )}
                        </div>
                        <div className='pb-4'>
                            <span className='text-xs font-mono font-semibold text-slate-400'>{event.time}</span>
                            <p className={`mt-0.5 text-xs font-medium leading-relaxed ${eventTextColor[event.type]}`}>
                                {event.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ActivityTimeline() {
    return (
        <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center gap-2 mb-5'>
                <Route className='h-4 w-4 text-indigo-500' />
                <h4 className='text-sm font-semibold text-slate-800'>Riwayat Perjalanan</h4>
            </div>
            <div className='relative space-y-0 pl-1'>
                {/* Vertical Line */}
                <div className='absolute left-[11px] top-1 h-[calc(100%-24px)] w-0.5 bg-gradient-to-b from-indigo-400 via-indigo-300 to-slate-200' />

                {timelineEvents.map((event, index) => (
                    <div key={index} className='relative flex gap-4 pb-6 last:pb-0'>
                        {/* Dot */}
                        <div className={`relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${index === 0 ? 'border-indigo-500 bg-indigo-500' : 'border-indigo-300 bg-white'}`}>
                            {index === 0 && <CircleDot className='h-3 w-3 text-white' />}
                        </div>

                        <div className='min-w-0'>
                            <div className='flex items-center gap-2'>
                                <span className='text-xs font-semibold text-indigo-600'>{event.time}</span>
                                {index === 0 && (
                                    <span className='rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600'>Terkini</span>
                                )}
                            </div>
                            <h5 className='mt-0.5 text-sm font-medium text-slate-900'>{event.title}</h5>
                            <p className='mt-0.5 text-xs text-slate-500 leading-relaxed'>{event.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
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
            {/* ─── Hero Header ─── */}
            <header className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-8 py-8 shadow-lg'>
                {/* Decorative bg circles */}
                <div className='pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5' />
                <div className='pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5' />

                <div className='relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div className='space-y-1'>
                        <div className='flex items-center gap-3'>
                            <h1 className='text-2xl font-bold text-white'>Real-Time Tracking</h1>
                            <span className='inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm'>
                                <span className='relative flex h-2 w-2'>
                                    <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
                                    <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-400' />
                                </span>
                                Live
                            </span>
                        </div>
                        <p className='text-sm text-indigo-200'>Monitor posisi driver & kendaraan secara real-time</p>
                    </div>

                    {/* Quick stats in header */}
                    <div className='flex items-center gap-6'>
                        <div className='text-center'>
                            <p className='text-2xl font-bold text-white'>2</p>
                            <p className='text-xs text-indigo-200'>Aktif</p>
                        </div>
                        <div className='h-8 w-px bg-white/20' />
                        <div className='text-center'>
                            <p className='text-2xl font-bold text-white'>1</p>
                            <p className='text-xs text-indigo-200'>Selesai</p>
                        </div>
                        <div className='h-8 w-px bg-white/20' />
                        <div className='text-center'>
                            <p className='text-2xl font-bold text-emerald-300'>0</p>
                            <p className='text-xs text-indigo-200'>Delay</p>
                        </div>

                        <button
                            type='button'
                            className='ml-2 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25'
                        >
                            <RefreshCw className='h-4 w-4' />
                            Refresh
                        </button>
                    </div>
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
            <section className='relative z-0 grid grid-cols-1 items-start gap-6 lg:grid-cols-3'>
                {/* Column 1: Active Deliveries */}
                <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1'>
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

                {/* Column 2: Live Updates */}
                <LiveEventsTicker />

                {/* Column 3: Activity Timeline */}
                <ActivityTimeline />
            </section>
        </div>
    );
}