import React, { useMemo, useState } from 'react';

const filterOptions = [
    { id: 'all', label: 'Semua' },
    { id: 'priority', label: 'Prioritas' },
    { id: 'orders', label: 'Order' },
    { id: 'fleet', label: 'Armada' },
    { id: 'finance', label: 'Finance' },
    { id: 'system', label: 'Sistem' },
];

export const notificationItems = [
    {
        id: 'notif-001',
        title: 'Order SP-239 membutuhkan konfirmasi',
        detail: 'Driver Rudi Santoso menunggu verifikasi bukti serah terima sebelum 14:00 WIB.',
        category: 'orders',
        priority: 'high',
        unread: true,
        timestamp: '09:45 WIB',
        relative: '10 menit lalu',
        meta: 'Gudang Jakarta 1',
    },
    {
        id: 'notif-002',
        title: 'Perubahan jadwal maintenance armada DRV-027',
        detail: 'Maintenance dimajukan ke 16 Jan 2024 pukul 08:00 karena temuan inspeksi harian.',
        category: 'fleet',
        priority: 'medium',
        unread: true,
        timestamp: '08:20 WIB',
        relative: '1 jam lalu',
        meta: 'Armada - Hino Dutro 130',
    },
    {
        id: 'notif-003',
        title: 'Invoice INV-018 telah diterima',
        detail: 'Pembayaran Rp124.000.000 dari PT Logisindo tercatat otomatis di modul finance.',
        category: 'finance',
        priority: 'low',
        unread: false,
        timestamp: '07:05 WIB',
        relative: '2 jam lalu',
        meta: 'Finance update',
    },
    {
        id: 'notif-004',
        title: 'Order SP-221 terlambat 35 menit',
        detail: 'Status order diperbarui menjadi Completed with Delay. Verifikasi tindakan korektif disarankan.',
        category: 'orders',
        priority: 'medium',
        unread: false,
        timestamp: '12 Jan 2024 16:45',
        relative: 'Kemarin',
        meta: 'SLA 96% (-2%)',
    },
    {
        id: 'notif-005',
        title: 'Driver baru menunggu aktivasi akun',
        detail: 'Dokumen Farhan Pratama sudah lengkap. Aktivasi diperlukan untuk menerima penugasan.',
        category: 'fleet',
        priority: 'low',
        unread: true,
        timestamp: '11 Jan 2024 10:20',
        relative: '2 hari lalu',
        meta: 'Pending approval',
    },
    {
        id: 'notif-006',
        title: 'Update fitur Live Tracking 2.0',
        detail: 'Monitoring rute real time kini mendukung tautan pelacakan untuk pelanggan.',
        category: 'system',
        priority: 'low',
        unread: false,
        timestamp: '10 Jan 2024 09:00',
        relative: '3 hari lalu',
        meta: 'Changelog',
    },
];

export const unreadNotificationsCount = notificationItems.filter((item) => item.unread).length;

const priorityStyles = {
    high: {
        label: 'High',
        text: 'text-rose-600',
        dot: 'bg-rose-500',
    },
    medium: {
        label: 'Medium',
        text: 'text-amber-600',
        dot: 'bg-amber-500',
    },
    low: {
        label: 'Low',
        text: 'text-slate-400',
        dot: 'bg-slate-300',
    },
};

const categoryStyles = {
    orders: {
        label: 'Order',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
    },
    fleet: {
        label: 'Armada',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
    finance: {
        label: 'Finance',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    system: {
        label: 'Sistem',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
    },
};

const timelineEntries = [
    {
        id: 'timeline-001',
        time: '09:15',
        title: 'Driver check-in Bandung Hub',
        description: '5 driver memulai shift pagi dan siap menerima order rute Bandung metropolitan.',
        tone: 'success',
    },
    {
        id: 'timeline-002',
        time: '08:40',
        title: 'Re-route otomatis order SP-245',
        description: 'Sistem mengalihkan jalur karena kepadatan di Tol JORR. ETA baru: 11:25 WIB.',
        tone: 'warning',
    },
    {
        id: 'timeline-003',
        time: 'Besok 09:00',
        title: 'Pengingat meeting koordinasi partner',
        description: 'Evaluasi SLA pengiriman dan kapasitas armada bersama partner logistik.',
        tone: 'info',
    },
];

const toneStyles = {
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border border-amber-100',
    info: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
};

function NotificationCard({ item }) {
    const priority = priorityStyles[item.priority] ?? priorityStyles.low;
    const category = categoryStyles[item.category] ?? categoryStyles.system;

    return (
        <article className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='flex items-start gap-3'>
                    <div className={[category.bg, category.text, 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-semibold'].join(' ')}>
                        {category.label[0]}
                    </div>
                    <div>
                        <div className='flex flex-wrap items-center gap-2'>
                            <h3 className='font-semibold text-slate-900'>{item.title}</h3>
                            <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', category.bg, category.text].join(' ')}>
                                {category.label}
                            </span>
                            <span className={['inline-flex items-center gap-1 text-xs font-medium', priority.text].join(' ')}>
                                <span className={['h-1.5 w-1.5 rounded-full', priority.dot].join(' ')} />
                                {priority.label} priority
                            </span>
                            {item.unread ? (
                                <span className='inline-flex items-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white'>
                                    Baru
                                </span>
                            ) : null}
                        </div>
                        <p className='mt-2 text-sm text-slate-500'>{item.detail}</p>
                        <div className='mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400'>
                            <span>{item.timestamp}</span>
                            <span>•</span>
                            <span>{item.relative}</span>
                            <span>•</span>
                            <span>{item.meta}</span>
                        </div>
                    </div>
                </div>
                <button
                    type='button'
                    className='rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600'
                >
                    Tandai dibaca
                </button>
            </div>
        </article>
    );
}

function TimelineCard({ entry }) {
    const tone = toneStyles[entry.tone] ?? toneStyles.info;

    return (
        <div className={['rounded-2xl border px-4 py-3', tone].join(' ')}>
            <div className='flex items-center justify-between text-xs font-semibold uppercase tracking-wide'>
                <span>{entry.title}</span>
                <span>{entry.time}</span>
            </div>
            <p className='mt-2 text-sm text-slate-600'>{entry.description}</p>
        </div>
    );
}

export default function NotificationsContent() {
    const [activeFilter, setActiveFilter] = useState('all');

    const filteredItems = useMemo(() => {
        if (activeFilter === 'all') {
            return notificationItems;
        }

        if (activeFilter === 'priority') {
            return notificationItems.filter((item) => item.priority === 'high');
        }

        return notificationItems.filter((item) => item.category === activeFilter);
    }, [activeFilter]);

    const unreadItems = useMemo(() => filteredItems.filter((item) => item.unread), [filteredItems]);
    const readItems = useMemo(() => filteredItems.filter((item) => !item.unread), [filteredItems]);

    return (
        <div className='flex min-h-full flex-col gap-6 bg-slate-50 p-6 lg:p-10'>
            <section className='rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 p-6 text-white shadow-lg'>
                <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='max-w-2xl'>
                        <p className='text-sm font-medium uppercase tracking-widest text-indigo-100'>Pusat Notifikasi</p>
                        <h1 className='mt-2 text-2xl font-semibold lg:text-3xl'>Semua update penting untuk operasional SendPick</h1>
                        <p className='mt-3 text-sm text-indigo-100'>Gunakan filter untuk fokus pada prioritas. Tandai notifikasi sebagai dibaca agar seluruh tim tetap sinkron.</p>
                    </div>
                    <div className='grid grid-cols-3 gap-4 rounded-2xl bg-white/15 p-4 text-sm backdrop-blur'>
                        <div>
                            <p className='text-xs uppercase tracking-wide text-indigo-100'>Notifikasi baru</p>
                            <p className='text-3xl font-semibold'>{unreadNotificationsCount}</p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-wide text-indigo-100'>Prioritas tinggi</p>
                            <p className='text-3xl font-semibold'>{notificationItems.filter((item) => item.priority === 'high').length}</p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-wide text-indigo-100'>Terakhir diperbarui</p>
                            <p className='text-lg font-semibold'>09:45 WIB</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                    <div>
                        <h2 className='text-lg font-semibold text-slate-900'>Daftar notifikasi</h2>
                        <p className='text-sm text-slate-500'>Filter berdasarkan jenis informasi atau fokus pada prioritas tinggi.</p>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        {filterOptions.map((option) => {
                            const isActive = activeFilter === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type='button'
                                    onClick={() => setActiveFilter(option.id)}
                                    className={[
                                        'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                                        isActive ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600',
                                    ].join(' ')}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className='mt-6 grid gap-5'>
                    {unreadItems.length > 0 ? (
                        <div className='grid gap-4'>
                            <div className='flex items-center justify-between'>
                                <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>Belum dibaca</h3>
                                <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500'>{unreadItems.length} item</span>
                            </div>
                            {unreadItems.map((item) => (
                                <NotificationCard key={item.id} item={item} />
                            ))}
                        </div>
                    ) : null}

                    {readItems.length > 0 ? (
                        <div className='grid gap-4'>
                            <div className='flex items-center justify-between'>
                                <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>Riwayat terbaru</h3>
                                <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500'>{readItems.length} item</span>
                            </div>
                            {readItems.map((item) => (
                                <NotificationCard key={item.id} item={item} />
                            ))}
                        </div>
                    ) : null}

                    {unreadItems.length === 0 && readItems.length === 0 ? (
                        <div className='rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400'>
                            Tidak ada notifikasi untuk filter yang dipilih.
                        </div>
                    ) : null}
                </div>
            </section>


            <section className='grid gap-6 lg:grid-cols-3'>
                <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-lg font-semibold text-slate-900'>Catatan timeline</h2>
                            <p className='text-sm text-slate-500'>Rangkuman cepat aktivitas yang berkaitan dengan order dan armada.</p>
                        </div>
                        <button
                            type='button'
                            className='rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600'
                        >
                            Ekspor log
                        </button>
                    </div>
                    <div className='mt-6 grid gap-3'>
                        {timelineEntries.map((entry) => (
                            <TimelineCard key={entry.id} entry={entry} />
                        ))}
                    </div>
                </div>
                <div className='flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <h2 className='text-lg font-semibold text-slate-900'>Tips sinkronisasi tim</h2>
                    <ul className='grid gap-3 text-sm text-slate-600'>
                        <li className='rounded-2xl bg-slate-50 p-4'>Tandai notifikasi penting dan follow up langsung melalui modul Support.</li>
                        <li className='rounded-2xl bg-slate-50 p-4'>Gunakan filter Prioritas untuk menyiapkan briefing harian.</li>
                        <li className='rounded-2xl bg-slate-50 p-4'>Download log timeline untuk laporan performa mingguan.</li>
                    </ul>
                    <div className='rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-600'>
                        Integrasi Task Board akan hadir untuk mengubah notifikasi menjadi tugas otomatis.
                    </div>
                </div>
            </section>
        </div>
    );
}
