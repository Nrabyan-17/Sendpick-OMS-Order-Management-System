import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FilterDropdown from '../components/common/FilterDropdown';
import {
    BarChart,
    Bar as ReBar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    Legend as ReLegend,
    LabelList,
    Cell
} from 'recharts';
import {
    TrendingUp,
    ShoppingCart,
    Users,
    CheckCircle,
    RefreshCw,
    Download,
    FileText,
    FileSpreadsheet,
    Check,
    ChevronDown,
    Table2,
    Loader2,
    Calendar,
    Database,
    AlertCircle
} from 'lucide-react';

// Helper function to format currency - exact format matching Invoice module
const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'Rp 0';
    const num = parseFloat(value);
    return `Rp ${num.toLocaleString('id-ID')}`;
};

// Helper function to format number
const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    return parseInt(value).toLocaleString('id-ID');
};

// Static icon definitions for KPI cards using lucide-react
const kpiIcons = {
    revenue: <TrendingUp className='h-5 w-5' />,
    orders: <ShoppingCart className='h-5 w-5' />,
    delivery: <Users className='h-5 w-5' />,
    satisfaction: <CheckCircle className='h-5 w-5' />,
};



function KPI({ card, isLoading }) {
    return (
        <article className='flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div>
                <p className='text-sm text-slate-400'>{card.title}</p>
                {isLoading ? (
                    <div className='mt-2 h-8 w-24 animate-pulse rounded bg-slate-200'></div>
                ) : (
                    <p className='mt-2 text-2xl font-semibold text-slate-900'>{card.value}</p>
                )}
                {isLoading ? (
                    <div className='mt-1 h-4 w-32 animate-pulse rounded bg-slate-100'></div>
                ) : (
                    <p className={`mt-1 text-xs font-semibold ${card.deltaColor || 'text-emerald-500'}`}>{card.delta}</p>
                )}
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor}`}>
                {card.icon}
            </div>
        </article>
    );
}

function CustomerRow({ customer }) {
    return (
        <div className='flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600'>
                    {customer.rank}
                </div>
                <div>
                    <p className='text-sm font-semibold text-slate-800'>{customer.name}</p>
                    <p className='text-xs text-slate-400'>{customer.orders} orders</p>
                </div>
            </div>
            <div className='text-right'>
                <p className='text-sm font-semibold text-slate-800'>{customer.revenue}</p>
                <p className='text-xs text-slate-400'>{customer.share}</p>
            </div>
        </div>
    );
}



function SimpleRevenueChart({ revenueData, totalRevenue, isLoading }) {
    const chartData = revenueData.length > 0 ? revenueData : [
        { month: '-', revenue: 0 },
    ];

    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between'>
                <div>
                    <h3 className='text-sm font-semibold text-slate-700'>Monthly Revenue</h3>
                    <p className='text-xs text-slate-400'>Revenue trends over the selected period</p>
                </div>
                <div className='text-right'>
                    {isLoading ? (
                        <div className='h-8 w-28 animate-pulse rounded bg-slate-200'></div>
                    ) : (
                        <div className='text-2xl font-bold text-blue-600'>{formatCurrency(totalRevenue)}</div>
                    )}
                    <div className='text-xs text-green-600'>From selected period</div>
                </div>
            </div>
            <div className='mt-6 h-70'>
                {isLoading ? (
                    <div className='flex h-full items-center justify-center'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                    </div>
                ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                        <BarChart data={chartData} barSize={32} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke='rgba(226,232,240,0.5)' vertical={false} />
                            <XAxis dataKey='month' tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => 'Rp ' + v + 'M'} />
                            <ReTooltip formatter={v => 'Rp ' + v + 'M'} contentStyle={{ background: 'rgba(15,23,42,0.9)', borderRadius: 8, borderColor: '#3b82f6', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                            <ReBar dataKey='revenue' fill='rgba(59,130,246,0.8)' radius={[8, 8, 0, 0]}>
                                <LabelList dataKey='revenue' position='top' formatter={v => 'Rp ' + v + 'M'} style={{ fill: '#3b82f6', fontWeight: 600, fontSize: 12 }} />
                            </ReBar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
}

function PerformanceCard({ performanceData, isLoading }) {
    const data = performanceData.length > 0 ? performanceData : [
        { name: 'On-Time Delivery', value: 0, color: '#10b981' },
        { name: 'Completion Rate', value: 0, color: '#3b82f6' },
        { name: 'Fleet Utilization', value: 0, color: '#f59e0b' },
        { name: 'Driver Efficiency', value: 0, color: '#8b5cf6' },
    ];

    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
            <h3 className='text-sm font-semibold text-slate-700'>Performance Metrics</h3>
            <p className='text-xs text-slate-400'>Key operational KPIs based on the selected period</p>
            <div className='mt-6 h-96'>
                {isLoading ? (
                    <div className='flex h-full items-center justify-center'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                    </div>
                ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                        <BarChart data={data} layout='vertical' margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barSize={28}>
                            <CartesianGrid stroke='rgba(226,232,240,0.5)' horizontal={true} vertical={false} />
                            <XAxis type='number' domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v + '%'} />
                            <YAxis type='category' dataKey='name' tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={140} />
                            <ReTooltip formatter={v => v + '%'} contentStyle={{ background: 'rgba(15,23,42,0.9)', borderRadius: 8, borderColor: '#3b82f6', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                            <ReBar dataKey='value' radius={6} isAnimationActive fill='#3b82f6'>
                                {data.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.color} />
                                ))}
                                <LabelList dataKey='value' position='right' formatter={v => v + '%'} style={{ fill: '#3b82f6', fontWeight: 600, fontSize: 12 }} />
                            </ReBar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
}

function TopCustomersPanel({ customers, isLoading }) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 5;

    // Calculate pagination
    const totalItems = customers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCustomers = customers.slice(startIndex, endIndex);

    // Reset to page 1 when customers data changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [customers.length]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-slate-700'>Top Customers by Revenue</h3>
                {!isLoading && customers.length > 0 && (
                    <span className='text-xs text-slate-400'>
                        {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems}
                    </span>
                )}
            </div>
            <div className='mt-4 space-y-3'>
                {isLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className='flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                            <div className='flex items-center gap-4'>
                                <div className='h-10 w-10 animate-pulse rounded-full bg-slate-200'></div>
                                <div>
                                    <div className='h-4 w-24 animate-pulse rounded bg-slate-200'></div>
                                    <div className='mt-1 h-3 w-16 animate-pulse rounded bg-slate-100'></div>
                                </div>
                            </div>
                            <div className='text-right'>
                                <div className='h-4 w-20 animate-pulse rounded bg-slate-200'></div>
                                <div className='mt-1 h-3 w-12 animate-pulse rounded bg-slate-100'></div>
                            </div>
                        </div>
                    ))
                ) : paginatedCustomers.length > 0 ? (
                    paginatedCustomers.map((customer) => (
                        <CustomerRow key={customer.rank} customer={customer} />
                    ))
                ) : (
                    <div className='text-center py-8 text-slate-400'>
                        <p>No customer data available for this period</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className='mt-4 flex items-center justify-between border-t border-slate-100 pt-4'>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${currentPage === 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7' />
                        </svg>
                        Prev
                    </button>

                    <div className='flex items-center gap-1'>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`h-7 w-7 flex items-center justify-center text-xs font-medium rounded-lg transition ${currentPage === page
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${currentPage === totalPages
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Next
                        <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                        </svg>
                    </button>
                </div>
            )}
        </section>
    );
}

function ExportReportsPanel({ dateRange, dataCount = 0, isLoadingData = false }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportingType, setExportingType] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasData = dataCount > 0;

    const handleExport = async (type) => {
        if (!hasData) return;

        setIsExporting(true);
        setExportingType(type);
        setIsDropdownOpen(false);

        console.log(`Exporting ${type.toUpperCase()} report...`);
        console.log(`Date Range: ${dateRange?.start} - ${dateRange?.end}`);
        console.log(`Total Records: ${dataCount}`);

        try {
            if (type === 'pdf') {
                // Build the PDF export URL with query parameters
                const params = new URLSearchParams({
                    start_date: dateRange?.start,
                    end_date: dateRange?.end
                });

                // Open in new tab to trigger download
                const exportUrl = `/reports/analytics/pdf?${params.toString()}`;
                window.open(exportUrl, '_blank');

                // Short delay to show loading state
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else if (type === 'excel') {
                // Excel export - placeholder for future implementation
                // For now, show a message that it's coming soon
                await new Promise(resolve => setTimeout(resolve, 1500));
                alert(`ℹ️ Export Excel akan segera tersedia.\n\nPeriode: ${dateRange?.start} - ${dateRange?.end}\nJumlah Data: ${dataCount} transaksi`);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert(`❌ Gagal mengekspor ${type.toUpperCase()}. Silakan coba lagi.`);
        } finally {
            setIsExporting(false);
            setExportingType(null);
        }
    };

    // Format date for display
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <section className='relative flex flex-col bg-white shadow-sm rounded-3xl border border-slate-200'>
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-5 rounded-t-3xl">
                <h3 className='text-base font-semibold text-white flex items-center gap-2'>
                    <Download className="w-5 h-5" />
                    Export Reports
                </h3>
                <p className='text-sm text-slate-300 mt-1'>Generate laporan dalam format PDF / Excel</p>
            </div>

            {/* Pre-Export Info Section */}
            <div className="px-6 py-5 border-b border-slate-100">
                <div className="grid grid-cols-1 gap-4">
                    {/* Date Range Info */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Periode Laporan</p>
                            {isLoadingData ? (
                                <div className="h-5 w-32 mt-0.5 bg-slate-200 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {formatDisplayDate(dateRange?.start)} — {formatDisplayDate(dateRange?.end)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Data Count Info */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg">
                            <Database className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Jumlah Data</p>
                            {isLoadingData ? (
                                <div className="h-5 w-24 mt-0.5 bg-slate-200 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-sm font-semibold text-slate-800">
                                    <span className={dataCount > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                                        {dataCount.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-slate-500 font-normal ml-1">Transaksi akan diekspor</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Actions */}
            <div className="p-6 flex-1 flex flex-col justify-end">
                {/* Empty State Warning */}
                {!hasData && !isLoadingData && (
                    <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                            Tidak ada data untuk diekspor pada periode ini. Silakan ubah filter periode untuk mendapatkan data.
                        </p>
                    </div>
                )}

                {/* Dropdown Button Container */}
                <div ref={dropdownRef} className="relative">
                    {/* Main Generate Button */}
                    <button
                        type="button"
                        onClick={() => hasData && !isExporting && setIsDropdownOpen(!isDropdownOpen)}
                        disabled={!hasData || isExporting || isLoadingData}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg ${!hasData || isLoadingData
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : isExporting
                                ? 'bg-indigo-500 text-white cursor-wait'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200 active:scale-[0.98]'
                            }`}
                        title={!hasData ? 'Tidak ada data untuk diekspor pada periode ini' : ''}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating {exportingType?.toUpperCase()}...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                <span>Generate Report</span>
                                <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && hasData && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                            {/* PDF Option */}
                            <button
                                type="button"
                                onClick={() => handleExport('pdf')}
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors group"
                            >
                                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                    <FileText className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-semibold text-slate-800">Export as PDF</p>
                                    <p className="text-xs text-slate-500">Format formal untuk rapat & arsip</p>
                                </div>
                                <div className="px-2 py-1 bg-red-100 rounded-lg">
                                    <span className="text-xs font-bold text-red-600">.PDF</span>
                                </div>
                            </button>

                            <div className="border-t border-slate-100"></div>

                            {/* Excel Option */}
                            <button
                                type="button"
                                onClick={() => handleExport('excel')}
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-emerald-50 transition-colors group"
                            >
                                <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                                    <Table2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-semibold text-slate-800">Export as Excel</p>
                                    <p className="text-xs text-slate-500">Data mentah untuk analisis lanjut</p>
                                </div>
                                <div className="px-2 py-1 bg-emerald-100 rounded-lg">
                                    <span className="text-xs font-bold text-emerald-600">.XLSX</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Additional Helper Text */}
                {hasData && !isExporting && (
                    <p className="text-center text-xs text-slate-400 mt-3">
                        Klik untuk memilih format ekspor
                    </p>
                )}
            </div>
        </section>
    );
}


export default function ReportContent() {
    const [selectedPeriod, setSelectedPeriod] = useState('30d');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data states
    const [kpiData, setKpiData] = useState([]);
    const [revenueChartData, setRevenueChartData] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [performanceData, setPerformanceData] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [exportDateRange, setExportDateRange] = useState({ start: null, end: null });

    const periodOptions = [
        { value: '7d', label: '7 Hari Terakhir' },
        { value: '30d', label: '30 Hari Terakhir' },
        { value: '90d', label: '90 Hari Terakhir' }
    ];

    // Calculate date range based on selected period
    const getDateRange = (period) => {
        const endDate = new Date();
        const startDate = new Date();

        switch (period) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        return {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
        };
    };

    // Fetch all report data
    const fetchReportData = async () => {
        setIsLoading(true);
        setError(null);

        const { start_date, end_date } = getDateRange(selectedPeriod);

        try {
            // Fetch sales data
            const salesResponse = await axios.get('/reports/sales', {
                params: { start_date, end_date, group_by: 'month' }
            });

            // Fetch operational data
            const operationalResponse = await axios.get('/reports/operational', {
                params: { start_date, end_date }
            });

            const salesData = salesResponse.data.data;
            const operationalData = operationalResponse.data.data;

            // Process KPI cards
            const kpiCards = [
                {
                    title: 'Total Revenue',
                    value: formatCurrency(salesData.summary.total_revenue),
                    delta: `${salesData.summary.total_customers || 0} customers`,
                    deltaColor: 'text-emerald-500',
                    iconBg: 'bg-sky-100',
                    iconColor: 'text-sky-600',
                    icon: kpiIcons.revenue,
                },
                {
                    title: 'Total Orders',
                    value: formatNumber(salesData.summary.total_orders),
                    delta: `${salesData.summary.completion_rate || 0}% completed`,
                    deltaColor: 'text-emerald-500',
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-500',
                    icon: kpiIcons.orders,
                },
                {
                    title: 'Active Drivers',
                    value: formatNumber(operationalData.summary.active_drivers),
                    delta: `${operationalData.summary.active_vehicles || 0} vehicles active`,
                    deltaColor: 'text-amber-500',
                    iconBg: 'bg-amber-100',
                    iconColor: 'text-amber-500',
                    icon: kpiIcons.delivery,
                },
                {
                    title: 'Delivery Success',
                    value: `${operationalData.summary.delivery_success_rate || 0}%`,
                    delta: `${operationalData.summary.manifest_completion_rate || 0}% manifest completed`,
                    deltaColor: 'text-purple-500',
                    iconBg: 'bg-purple-100',
                    iconColor: 'text-purple-500',
                    icon: kpiIcons.satisfaction,
                },
            ];
            setKpiData(kpiCards);
            setTotalRevenue(salesData.summary.total_revenue || 0);
            setTotalOrders(parseInt(salesData.summary.total_orders) || 0);
            setExportDateRange({ start: start_date, end: end_date });

            // Process revenue chart data
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            const chartData = (salesData.sales_trend || []).map(item => ({
                month: item.period ? monthNames[parseInt(item.period.split('-')[1]) - 1] || item.period : item.period,
                revenue: Math.round((parseFloat(item.total_revenue) || 0) / 1000000) // Convert to millions
            }));
            setRevenueChartData(chartData);

            // Process performance metrics
            const perfData = [
                {
                    name: 'On-Time Delivery',
                    value: parseFloat(operationalData.summary.delivery_success_rate || 0).toFixed(1),
                    color: '#10b981'
                },
                {
                    name: 'Completion Rate',
                    value: parseFloat(salesData.summary.completion_rate || 0).toFixed(1),
                    color: '#3b82f6'
                },
                {
                    name: 'Manifest Completion',
                    value: parseFloat(operationalData.summary.manifest_completion_rate || 0).toFixed(1),
                    color: '#f59e0b'
                },
                {
                    name: 'Fleet Utilization',
                    value: operationalData.summary.active_vehicles > 0 ?
                        Math.min(100, ((operationalData.summary.avg_deliveries_per_driver || 0) * 10)).toFixed(1) : '0.0',
                    color: '#8b5cf6'
                },
            ];
            setPerformanceData(perfData);

            // Process top customers (all customers, pagination handled by TopCustomersPanel)
            const maxRevenue = salesData.customer_distribution?.[0]?.total_revenue || 1;
            const customersData = (salesData.customer_distribution || []).map((customer, index) => ({
                rank: index + 1,
                name: customer.customer_name || 'Unknown',
                orders: customer.order_count || 0,
                revenue: formatCurrency(customer.total_revenue),
                share: `${((customer.total_revenue / maxRevenue) * 100).toFixed(1)}%`
            }));
            setTopCustomers(customersData);

        } catch (err) {
            console.error('Error fetching report data:', err);
            setError('Gagal memuat data laporan. Silakan coba lagi.');

            // Set empty/default data on error
            setKpiData([
                { title: 'Total Revenue', value: 'Rp 0', delta: 'No data', deltaColor: 'text-slate-400', iconBg: 'bg-sky-100', iconColor: 'text-sky-600', icon: kpiIcons.revenue },
                { title: 'Total Orders', value: '0', delta: 'No data', deltaColor: 'text-slate-400', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500', icon: kpiIcons.orders },
                { title: 'Active Drivers', value: '0', delta: 'No data', deltaColor: 'text-slate-400', iconBg: 'bg-amber-100', iconColor: 'text-amber-500', icon: kpiIcons.delivery },
                { title: 'Delivery Success', value: '0%', delta: 'No data', deltaColor: 'text-slate-400', iconBg: 'bg-purple-100', iconColor: 'text-purple-500', icon: kpiIcons.satisfaction },
            ]);
            setRevenueChartData([]);
            setPerformanceData([]);
            setTopCustomers([]);
            setTotalOrders(0);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data on component mount and when period changes
    useEffect(() => {
        fetchReportData();
    }, [selectedPeriod]);

    return (
        <div className='flex flex-col gap-5'>
            <header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between -mt-2'>
                <div>
                    <h1 className='text-2xl font-semibold text-slate-900'>Reports & Exports</h1>
                    <p className='text-sm text-slate-500'>Analytics overview dan export data laporan operasional</p>
                </div>

                <div className='flex items-center gap-3'>
                    <FilterDropdown
                        value={selectedPeriod}
                        onChange={setSelectedPeriod}
                        options={periodOptions}
                        widthClass="w-48"
                        placeholder="Pilih periode"
                    />
                    <button
                        type='button'
                        onClick={fetchReportData}
                        className='inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600'
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </header>

            {error && (
                <div className='rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600'>
                    {error}
                </div>
            )}

            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {kpiData.length > 0 ? (
                    kpiData.map((card) => (
                        <KPI key={card.title} card={card} isLoading={isLoading} />
                    ))
                ) : (
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm'>
                            <div className='h-4 w-20 animate-pulse rounded bg-slate-200'></div>
                            <div className='mt-2 h-8 w-24 animate-pulse rounded bg-slate-200'></div>
                            <div className='mt-1 h-4 w-32 animate-pulse rounded bg-slate-100'></div>
                        </div>
                    ))
                )}
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
                <div className='xl:col-span-2'>
                    <SimpleRevenueChart
                        revenueData={revenueChartData}
                        totalRevenue={totalRevenue}
                        isLoading={isLoading}
                    />
                </div>
                <ExportReportsPanel
                    dateRange={exportDateRange}
                    dataCount={totalOrders}
                    isLoadingData={isLoading}
                />
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
                <PerformanceCard performanceData={performanceData} isLoading={isLoading} />
                <TopCustomersPanel customers={topCustomers} isLoading={isLoading} />
            </section>
        </div>
    );
}