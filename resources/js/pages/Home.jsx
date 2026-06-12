import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignmentWidget from '../features/orders/components/AssignmentWidget';
import {
    HiClipboardDocumentList,
    HiUser,
    HiTruck,
    HiClock,
    HiArrowRight,
    HiDocumentText,
    HiBanknotes,
    HiChevronLeft,
    HiChevronRight
} from 'react-icons/hi2';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend as ReLegend
} from 'recharts';

const statCards = [
    {
        title: 'Total Orders',
        value: '1,247',
        delta: '+12% dari bulan lalu',
        deltaColor: 'text-emerald-500',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        icon: <HiClipboardDocumentList className='h-5 w-5' />,
    },
    {
        title: 'Driver Aktif',
        value: '89',
        delta: '85% sedang beroperasi',
        deltaColor: 'text-emerald-500',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-500',
        icon: <HiUser className='h-5 w-5' />,
    },
    {
        title: 'Kendaraan Aktif',
        value: '45',
        delta: '3 dalam maintenance',
        deltaColor: 'text-amber-500',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-500',
        icon: <HiTruck className='h-5 w-5' />,
    },
    {
        title: 'OTIF Rate',
        value: '94.2%',
        delta: 'Target: 95%',
        deltaColor: 'text-emerald-500',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-500',
        icon: <HiClock className='h-5 w-5' />,
    },
];

// Helper: Get icon based on activity type
function getActivityIcon(type) {
    switch (type) {
        case 'order':
            return <HiClipboardDocumentList className='h-5 w-5 text-indigo-500' />;
        case 'delivery':
            return <HiTruck className='h-5 w-5 text-blue-500' />;
        case 'invoice':
            return <HiBanknotes className='h-5 w-5 text-emerald-500' />;
        default:
            return <HiDocumentText className='h-5 w-5 text-slate-500' />;
    }
}

// Helper: Get status color based on activity type and status
function getActivityStatusStyle(type, status) {
    const statusLower = (status || '').toLowerCase();
    if (type === 'order') {
        if (statusLower === 'pending') return 'text-amber-500 bg-amber-50';
        if (statusLower === 'completed') return 'text-emerald-500 bg-emerald-50';
        return 'text-indigo-500 bg-indigo-50';
    }
    if (type === 'delivery') {
        if (statusLower === 'in transit') return 'text-blue-500 bg-blue-50';
        if (statusLower === 'delivered') return 'text-emerald-500 bg-emerald-50';
        return 'text-amber-500 bg-amber-50';
    }
    if (type === 'invoice') {
        if (statusLower === 'paid') return 'text-emerald-500 bg-emerald-50';
        if (statusLower === 'overdue') return 'text-red-500 bg-red-50';
        return 'text-amber-500 bg-amber-50';
    }
    return 'text-slate-500 bg-slate-50';
}

// Helper: Format relative time
function formatRelativeTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    return `${diffDays} hari lalu`;
}

function HomeStatCard({ card }) {
    return (
        <article className='flex items-center gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm'>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor}`}>
                {card.icon}
            </div>
            <div>
                <p className='text-sm text-slate-400'>{card.title}</p>
                <p className='mt-2 text-2xl font-semibold text-slate-900'>{card.value}</p>
                <p className={`mt-1 text-xs font-medium ${card.deltaColor}`}>{card.delta}</p>
            </div>
        </article>
    );
}

const MonthlyTrendCard = React.memo(function MonthlyTrendCard() {
    const monthlyData = [
        { month: 'Jan', orders: 120 },
        { month: 'Feb', orders: 135 },
        { month: 'Mar', orders: 180 },
        { month: 'Apr', orders: 220 },
        { month: 'Mei', orders: 160 },
        { month: 'Jun', orders: 240 },
    ];
    return (
        <section className='flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between'>
                <div>
                    <p className='text-sm text-slate-500'>Trend Order Bulanan</p>
                    <p className='text-xs text-slate-400'>Jan - Jun 2025</p>
                </div>
            </div>
            <div className='mt-6 h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke='#e2e8f0' strokeDasharray='3 3' vertical={false} />
                        <XAxis dataKey='month' tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => v + ' Orders'} />
                        <ReTooltip
                            contentStyle={{ background: 'rgba(15,23,42,0.9)', borderRadius: 8, borderColor: '#3b82f6', color: '#fff' }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area
                            type='monotone'
                            dataKey='orders'
                            stroke='#3b82f6'
                            strokeWidth={3}
                            fillOpacity={1}
                            fill='url(#colorOrders)'
                            activeDot={{ r: 8, strokeWidth: 0 }}
                            animationDuration={2000}
                            animationEasing="ease-in-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
});

const ShipmentStatusCard = React.memo(function ShipmentStatusCard() {
    const shipmentData = [
        { name: 'Delivered', value: 83, color: '#10b981', labelClass: 'text-emerald-500' },
        { name: 'In Transit', value: 11, color: '#3b82f6', labelClass: 'text-blue-500' },
        { name: 'Pending', value: 4, color: '#f59e0b', labelClass: 'text-amber-500' },
        { name: 'Cancelled', value: 2, color: '#ef4444', labelClass: 'text-red-500' },
    ];
    return (
        <section className='w-full max-w-xs rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <p className='text-sm text-slate-500'>Status Pengiriman</p>
            <div className='mt-6 flex flex-col items-center gap-4'>
                <div className='h-44 w-44'>
                    <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                            <Pie
                                data={shipmentData}
                                dataKey='value'
                                nameKey='name'
                                cx='50%'
                                cy='50%'
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                label={false}
                                stroke='#fff'
                                strokeWidth={3}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            >
                                {shipmentData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <ReTooltip
                                formatter={(value, name) => [`${value}%`, name]}
                                contentStyle={{ background: 'rgba(15,23,42,0.9)', borderRadius: 8, borderColor: '#3b82f6', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className='space-y-1 text-xs font-medium text-slate-600'>
                    {shipmentData.map((entry) => (
                        <p key={entry.name} className={entry.labelClass}>{entry.name} {entry.value}%</p>
                    ))}
                </div>
            </div>
        </section>
    );
});

function TransactionsCard({ activities = [], loading = false, itemsPerPage = 5 }) {
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate pagination
    const totalItems = activities.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentActivities = activities.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    if (loading) {
        return (
            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='animate-pulse space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div className='h-4 w-48 rounded bg-slate-200'></div>
                        <div className='h-4 w-20 rounded bg-slate-200'></div>
                    </div>
                    <div className='space-y-3'>
                        {[...Array(itemsPerPage)].map((_, i) => (
                            <div key={i} className='flex items-center gap-3 rounded-2xl border border-slate-100 p-4'>
                                <div className='h-10 w-10 rounded-full bg-slate-200'></div>
                                <div className='flex-1 space-y-2'>
                                    <div className='h-4 w-32 rounded bg-slate-200'></div>
                                    <div className='h-3 w-24 rounded bg-slate-200'></div>
                                </div>
                                <div className='h-6 w-20 rounded bg-slate-200'></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between'>
                <p className='text-sm text-slate-500'>Perkembangan Transaksi Terbaru</p>
                <button
                    type='button'
                    className='text-xs font-semibold text-indigo-600 transition hover:text-indigo-500'
                >
                    Lihat Semua
                </button>
            </div>
            <div className='mt-6 space-y-3'>
                {currentActivities.length > 0 ? (
                    currentActivities.map((activity, idx) => (
                        <article
                            key={`${activity.type}-${startIndex + idx}`}
                            className='flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-4 transition hover:border-slate-200'
                        >
                            <div className='flex items-center gap-3'>
                                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100'>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div>
                                    <p className='text-sm font-semibold text-slate-800'>{activity.title}</p>
                                    <p className='text-xs text-slate-400'>
                                        {activity.description} | {formatRelativeTime(activity.timestamp)}
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-center gap-4'>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getActivityStatusStyle(activity.type, activity.status)}`}>
                                    {activity.status}
                                </span>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className='flex items-center justify-center py-8 text-center'>
                        <div>
                            <div className='mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center'>
                                <HiClipboardDocumentList className='h-6 w-6 text-slate-400' />
                            </div>
                            <p className='mt-3 text-sm font-medium text-slate-800'>Belum ada aktivitas</p>
                            <p className='text-xs text-slate-500'>Aktivitas terbaru akan muncul di sini.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
                <div className='mt-6 flex items-center justify-between border-t border-slate-100 pt-4'>
                    <p className='text-xs text-slate-400'>
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} transaksi
                    </p>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${currentPage === 1
                                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                        >
                            <HiChevronLeft className='h-4 w-4' />
                        </button>
                        <span className='px-3 py-1 text-xs font-medium text-slate-600'>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type='button'
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${currentPage === totalPages
                                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                        >
                            <HiChevronRight className='h-4 w-4' />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default function HomeContent() {
    const [loading, setLoading] = useState(true);
    const [activeAssignments, setActiveAssignments] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Only show loading on initial load, not on refresh
                const response = await axios.get('/dashboard');

                if (response.data?.success) {
                    const { widgets } = response.data.data;
                    setActiveAssignments(widgets?.active_assignments || []);
                    setRecentActivities(widgets?.recent_activities || []);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchDashboardData();

        // Auto-refresh every 30 seconds for real-time updates
        const refreshInterval = setInterval(() => {
            fetchDashboardData();
        }, 30000); // 30 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(refreshInterval);
    }, []);

    return (
        <>
            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {statCards.map((card) => (
                    <HomeStatCard key={card.title} card={card} />
                ))}
            </section>
            <section className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
                <div className="xl:col-span-2">
                    <MonthlyTrendCard />
                </div>
                <ShipmentStatusCard />
            </section>
            <section className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
                <AssignmentWidget
                    itemsPerPage={4}
                    showMetrics={true}
                    assignments={activeAssignments}
                    loading={loading}
                />
                <TransactionsCard
                    activities={recentActivities}
                    loading={loading}
                    itemsPerPage={5}
                />
            </section>
        </>
    );
}