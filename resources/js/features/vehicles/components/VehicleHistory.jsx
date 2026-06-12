import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Activity, Package, Clock, Search, Loader2 } from 'lucide-react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import Pagination from '../../../components/common/Pagination';
import api from '../../../utils/api';

// Jumlah data per halaman
const ITEMS_PER_PAGE = 6;

const timeFilterOptions = [
    { value: '30d', label: '30 Hari Terakhir' },
    { value: '90d', label: '90 Hari Terakhir' },
    { value: '12m', label: '12 Bulan Terakhir' },
    { value: 'all', label: 'Semua Waktu' },
];

const activityFilterOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
];

const statusStyles = {
    delivered: {
        label: 'Delivered',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
    },
    inProgress: {
        label: 'In Progress',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
};

// Icon wrappers using Lucide React
const SearchIcon = ({ className = 'h-4 w-4' }) => <Search className={className} />;

function SummaryCard({ card, loading }) {
    return (
        <article className='flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor}`}>
                {card.icon}
            </div>
            <div>
                <p className='text-sm text-slate-400'>{card.title}</p>
                <p className='mt-1 text-2xl font-semibold text-slate-900'>
                    {loading ? <span className='animate-pulse'>...</span> : card.value}
                </p>
                <p className='text-xs text-slate-500'>{card.description}</p>
            </div>
        </article>
    );
}

function StatusBadge({ status }) {
    const style = statusStyles[status] ?? statusStyles.delivered;

    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
            <span className='h-2 w-2 rounded-full bg-current' />
            {style.label}
        </span>
    );
}

function HistoryRow({ record }) {
    return (
        <tr className='transition-colors hover:bg-slate-50'>
            <td className='px-6 py-4'>
                <p className='text-sm font-semibold text-slate-900'>{record.date}</p>
                <p className='text-xs text-slate-400'>{record.route}</p>
            </td>
            <td className='px-6 py-4'>
                <div className='space-y-1'>
                    <p className='text-sm font-semibold text-slate-800'>{record.vehicle}</p>
                    <p className='text-xs text-slate-400'>{record.driver}</p>
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>{record.activity}</td>
            <td className='px-6 py-4'>
                <p className='text-sm font-medium text-indigo-600'>{record.docNumber}</p>
            </td>
            <td className='px-6 py-4'>
                <StatusBadge status={record.status} />
            </td>
        </tr>
    );
}

function HistoryTable({ records, searchTerm, onSearchChange, statusFilter, onStatusChange, timeFilter, onTimeChange, loading, pagination, onPageChange }) {
    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='space-y-4'>
                <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
                    <div>
                        <h2 className='text-lg font-semibold text-slate-900'>Histori Pengiriman</h2>
                        <p className='text-sm text-slate-400'>Riwayat pengiriman yang telah selesai atau dibatalkan.</p>
                    </div>
                </div>

                {/* Search and Filters Section */}
                <div className='space-y-3'>
                    {/* Search Bar */}
                    <div className='group relative w-full'>
                        <span className='pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400'>
                            <SearchIcon />
                        </span>
                        <input
                            type='text'
                            value={searchTerm}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder='Cari plat, driver, atau aktivitas...'
                            className='w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                        />
                    </div>

                    {/* Filters Row */}
                    <div className='flex flex-col gap-3 sm:flex-row sm:gap-3'>
                        <FilterDropdown
                            value={timeFilter}
                            onChange={onTimeChange}
                            options={timeFilterOptions}
                            widthClass='w-full sm:w-auto sm:min-w-[140px]'
                        />
                        <FilterDropdown
                            value={statusFilter}
                            onChange={onStatusChange}
                            options={activityFilterOptions}
                            widthClass='w-full sm:w-auto sm:min-w-[140px]'
                        />
                    </div>
                </div>
            </div>
            <div className='mt-6 overflow-x-auto'>
                <table className='w-full min-w-[880px] border-collapse'>
                    <thead>
                        <tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                            <th className='px-6 py-3'>Tanggal & Rute</th>
                            <th className='px-6 py-3'>Kendaraan</th>
                            <th className='px-6 py-3'>Aktivitas</th>
                            <th className='px-6 py-3'>No. Dokumen</th>
                            <th className='px-6 py-3'>Status</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className='px-6 py-12 text-center'>
                                    <div className='flex items-center justify-center gap-2 text-slate-400'>
                                        <Loader2 className='h-5 w-5 animate-spin' />
                                        <span>Memuat data...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : records.length > 0 ? (
                            records.map((record) => <HistoryRow key={record.id} record={record} />)
                        ) : (
                            <tr>
                                <td colSpan={5} className='px-6 py-12 text-center text-sm text-slate-400'>
                                    Tidak ada histori pada filter saat ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <Pagination
                    currentPage={pagination.current_page || 1}
                    totalPages={pagination.last_page || 1}
                    totalItems={pagination.total || 0}
                    itemsPerPage={ITEMS_PER_PAGE}
                    startIndex={((pagination.current_page || 1) - 1) * ITEMS_PER_PAGE}
                    endIndex={Math.min(((pagination.current_page || 1) * ITEMS_PER_PAGE), pagination.total || 0)}
                    onPageChange={onPageChange}
                />
            )}
        </section>
    );
}

export default function VehicleHistoryContent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('30d');
    const [currentPage, setCurrentPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [kpiData, setKpiData] = useState({
        completed_deliveries: 0,
        fleet_utilization: 0,
        total_cargo_ton: 0,
        on_time_rate: 0,
    });
    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState(null);

    // Debounce search term
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch data from API
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                time_filter: timeFilter,
                status_filter: statusFilter,
                search: debouncedSearch,
                page: currentPage,
                per_page: ITEMS_PER_PAGE,
            };

            const response = await api.get('/vehicles/delivery-history', { params });

            if (response.data.success) {
                setKpiData(response.data.kpi);
                setRecords(response.data.records);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching delivery history:', error);
        } finally {
            setLoading(false);
        }
    }, [timeFilter, statusFilter, debouncedSearch, currentPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [timeFilter, statusFilter]);

    // Build summary cards with dynamic data
    const summaryCards = [
        {
            title: 'Pengiriman Selesai',
            value: kpiData.completed_deliveries.toLocaleString('id-ID'),
            description: timeFilter === '30d' ? '30 hari terakhir' : timeFilter === '90d' ? '90 hari terakhir' : timeFilter === '12m' ? '12 bulan terakhir' : 'Semua waktu',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-500',
            icon: <CheckCircle2 className='h-5 w-5' />,
        },
        {
            title: 'Utilisasi Armada',
            value: `${kpiData.fleet_utilization}%`,
            description: 'Armada aktif dari Manifest',
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-500',
            icon: <Activity className='h-5 w-5' />,
        },
        {
            title: 'Total Muatan',
            value: `${kpiData.total_cargo_ton.toLocaleString('id-ID', { minimumFractionDigits: 1 })} Ton`,
            description: 'Akumulasi berat JO selesai',
            iconBg: 'bg-sky-100',
            iconColor: 'text-sky-600',
            icon: <Package className='h-5 w-5' />,
        },
        {
            title: 'Tepat Waktu (%)',
            value: `${kpiData.on_time_rate}%`,
            description: 'On-time delivery rate',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-500',
            icon: <Clock className='h-5 w-5' />,
        },
    ];

    return (
        <div className='flex flex-col gap-8'>
            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {summaryCards.map((card) => (
                    <SummaryCard key={card.title} card={card} loading={loading} />
                ))}
            </section>

            <HistoryTable
                records={records}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                timeFilter={timeFilter}
                onTimeChange={setTimeFilter}
                loading={loading}
                pagination={pagination}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
