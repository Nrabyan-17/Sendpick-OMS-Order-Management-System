import React, { useMemo, useState } from 'react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import LiveTrackingMap from './LiveTrackingMap';

const trackingKpis = [
    {
        title: 'Active Deliveries',
        value: '2',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
                <path d='M3 7h11v9H3z' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M14 11h3l2 2v3h-5' strokeLinecap='round' strokeLinejoin='round' />
                <circle cx='7' cy='18' r='1.5' />
                <circle cx='17' cy='18' r='1.5' />
            </svg>
        ),
    },
    {
        title: 'Completed Today',
        value: '1',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-500',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
                <circle cx='12' cy='12' r='8' />
                <path d='m9 12 2 2 4-4' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
    },
    {
        title: 'Delayed',
        value: '0',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-500',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
                <path d='M12 4 3 19h18z' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M12 9v4' strokeLinecap='round' />
                <circle cx='12' cy='15' r='1' fill='currentColor' stroke='none' />
            </svg>
        ),
    },
    {
        title: 'Online Vehicles',
        value: '24',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-500',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
                <path d='M12 7a5 5 0 0 1 5 5c0 3-5 7-5 7s-5-4-5-7a5 5 0 0 1 5-5z' strokeLinecap='round' strokeLinejoin='round' />
                <circle cx='12' cy='12' r='1.5' />
            </svg>
        ),
    },
];

const statusStyles = {
    onDelivery: {
        label: 'On Delivery',
        bg: 'bg-sky-50',
        text: 'text-sky-600',
    },
    pickup: {
        label: 'Pickup',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
    delayed: {
        label: 'Delayed',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
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
        eta: '08:00 - 11',
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

const SearchIcon = ({ className = 'h-5 w-5' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <circle cx='11' cy='11' r='6' />
        <path d='m20 20-3.5-3.5' strokeLinecap='round' strokeLinejoin='rounded' />
    </svg>
);

function KPI({ card }) {
    return (
        <article className='flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm'>
            <div>
                <p className='text-sm font-medium text-slate-400'>{card.title}</p>
                <p className='mt-3 text-3xl font-semibold text-slate-900'>{card.value}</p>
            </div>
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor}`}>
                {React.cloneElement(card.icon, { className: 'h-6 w-6' })}
            </div>
        </article>
    );
}

function StatusBadge({ status }) {
    const style = statusStyles[status] ?? statusStyles.onDelivery;
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
}

function DeliveryCard({ delivery }) {
    return (
        <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-start justify-between'>
                <div>
                    <p className='text-xs font-semibold text-slate-400'>{delivery.orderId}</p>
                    <h4 className='text-sm font-semibold text-slate-800'>{delivery.company}</h4>
                    <div className='mt-2 space-y-1 text-xs text-slate-500'>
                        <p>?? {delivery.driver}</p>
                        <p>?? {delivery.vehicle}</p>
                        <p>?? {delivery.location}</p>
                        <p>? ETA: {delivery.eta}</p>
                    </div>
                </div>
                <StatusBadge status={delivery.status} />
            </div>
            <div className='mt-4'>
                <div className='flex items-center justify-between text-xs font-semibold text-slate-400'>
                    <span>Progress</span>
                    <span>{delivery.progress}%</span>
                </div>
                <div className='mt-1 h-2 rounded-full bg-slate-100'>
                    <div className='h-full rounded-full bg-indigo-500' style={{ width: `${delivery.progress}%` }} />
                </div>
            </div>
        </article>
    );
}

const liveEvents = [
    { id: 1, time: '09:30', message: 'Budi Santoso memulai perjalanan ke Bandung.', type: 'info' },
    { id: 2, time: '09:45', message: 'Siti Kurnia telah sampai di lokasi Pickup.', type: 'success' },
    { id: 3, time: '10:00', message: 'Ahmad Subandi terjebak macet (Speed: 0 km/h selama 15 menit).', type: 'warning' },
];

const timelineEvents = [
    { time: '08:00', title: 'Berangkat', description: 'Driver memulai perjalanan dari Pool Jakarta.' },
    { time: '10:00', title: 'Sampai Rest Area', description: 'Istirahat di Rest Area KM 57.' },
    { time: '12:00', title: 'Melanjutkan perjalanan', description: 'Kembali ke rute utama menuju tujuan.' },
];

function LiveEventsTicker() {
    return (
        <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
            <h4 className='mb-3 text-sm font-semibold text-slate-800'>Live Updates</h4>
            <div className='space-y-3'>
                {liveEvents.map((event) => (
                    <div key={event.id} className='flex gap-3 text-xs'>
                        <span className='font-mono font-medium text-slate-500'>{event.time}</span>
                        <span className={`font-medium ${event.type === 'warning' ? 'text-amber-600' :
                            event.type === 'success' ? 'text-emerald-600' : 'text-slate-700'
                            }`}>
                            {event.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ActivityTimeline() {
    return (
        <div className='rounded-2xl border border-slate-200 bg-white p-4'>
            <h4 className='mb-4 text-sm font-semibold text-slate-800'>Riwayat Perjalanan (Timeline)</h4>
            <div className='relative space-y-0 pl-2'>
                {/* Vertical Line */}
                <div className='absolute left-[11px] top-2 h-[calc(100%-16px)] w-0.5 bg-slate-200' />

                {timelineEvents.map((event, index) => (
                    <div key={index} className='relative flex gap-4 pb-6 last:pb-0'>
                        {/* Dot */}
                        <div className='relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-indigo-500 shadow-sm' />

                        <div>
                            <span className='text-xs font-semibold text-indigo-600'>{event.time}</span>
                            <h5 className='text-sm font-medium text-slate-900'>{event.title}</h5>
                            <p className='text-xs text-slate-500'>{event.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

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
        <div className='flex flex-col gap-8'>
            <header className='flex items-center justify-between -mt-2'>
                <div className='space-y-1'>
                    <h1 className='text-2xl font-semibold text-slate-900'>Real-Time Tracking</h1>
                    <p className='text-sm text-slate-500'>Monitor driver & vehicle locations in real-time</p>
                </div>
                <button
                    type='button'
                    className='inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600'
                >
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
                        <path d='M4 4h16M4 12h16M4 20h16' strokeLinecap='round' />
                    </svg>
                    Refresh
                </button>
            </header>

            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {trackingKpis.map((card) => (
                    <KPI key={card.title} card={card} />
                ))}
            </section>

            <section className='grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:grid-cols-[minmax(0,360px)_1fr]'>
                <div className='w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <div className='flex flex-col gap-4'>
                        <div className='group relative'>
                            <span className='pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400'>
                                <SearchIcon />
                            </span>
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder='Cari order, driver, atau lokasi...'
                                className='w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                            />
                        </div>
                        <FilterDropdown
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={statusFilters}
                            widthClass='min-w-[160px]'
                        />
                    </div>
                    <div className='mt-6 space-y-4'>
                        {filteredDeliveries.map((delivery) => (
                            <DeliveryCard key={delivery.orderId} delivery={delivery} />
                        ))}
                    </div>
                </div>
                <section className='flex flex-col rounded-3xl border border-slate-200 bg-white p-11 shadow-sm'>
                    <header className='flex items-center justify-between'>
                        <h3 className='text-sm font-semibold text-slate-700'>Live Map</h3>
                        <span className='text-xs text-slate-400'>Real-time vehicle tracking</span>
                    </header>
                    <div className='mt-6 flex min-h-[200px] lg:h-[260px] overflow-hidden rounded-2xl border border-slate-200'>
                        <LiveTrackingMap />
                    </div>

                    <div className='mt-22 grid grid-cols-1 gap-6 lg:grid-cols-2'>
                        <LiveEventsTicker />
                        <ActivityTimeline />
                    </div>
                </section>
            </section>
        </div>
    );
}