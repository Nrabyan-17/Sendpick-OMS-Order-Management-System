import React, { useMemo, useState, useEffect } from 'react';
import { Truck, Check, Package, BarChart3, Search } from 'lucide-react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import Pagination from '../../../components/common/Pagination';
import LiveTrackingMap from '../../tracking/components/LiveTrackingMap';
import { fetchActiveVehicles } from '../services/vehicleService';

// Jumlah data per halaman
const ITEMS_PER_PAGE = 6;

// Generate real-time summary cards from active vehicles data
const generateSummaryCards = (vehicles = [], activeLoadTon = 0) => {
    // Count vehicles on route (status = onRoute)
    const onRouteVehicles = vehicles.filter(v => v.status === 'onRoute').length;

    // Count idle vehicles (status = idle or assigned)
    const idleVehicles = vehicles.filter(v => v.status === 'idle' || v.status === 'assigned').length;

    // Calculate average utilization
    const totalVehicles = vehicles.length;
    const utilizationRate = totalVehicles > 0
        ? Math.round((onRouteVehicles / totalVehicles) * 100)
        : 0;

    return [
        {
            title: 'Kendaraan On-Route',
            value: onRouteVehicles.toString(),
            description: 'Sedang melakukan delivery',
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
            icon: <Truck className='h-5 w-5' />,
        },
        {
            title: 'Siap Berangkat',
            value: idleVehicles.toString(),
            description: 'Idle < 30 menit',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-500',
            icon: <Check className='h-5 w-5' />,
        },
        {
            title: 'Muatan Aktif',
            value: `${activeLoadTon} Ton`,
            description: 'Total berat dalam pengiriman',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-500',
            icon: <Package className='h-5 w-5' />,
        },
        {
            title: 'Utilisasi Rata-rata',
            value: `${utilizationRate}%`,
            description: '7 hari terakhir',
            iconBg: 'bg-sky-100',
            iconColor: 'text-sky-600',
            icon: <BarChart3 className='h-5 w-5' />,
        },
    ];
};

const statusFilterOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'onRoute', label: 'On Route' },
    { value: 'loading', label: 'Loading/Pickup' },
    { value: 'idle', label: 'Idle' },
    { value: 'maintenance', label: 'Maintenance' },
];

const regionFilterOptions = [
    { value: 'all', label: 'Semua Area' },
    { value: 'jabodetabek', label: 'Jabodetabek' },
    { value: 'bandung', label: 'Bandung Raya' },
    { value: 'surabaya', label: 'Surabaya' },
];

const statusStyles = {
    onRoute: {
        label: 'On Route',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
    },
    loading: {
        label: 'Loading',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
    idle: {
        label: 'Idle',
        bg: 'bg-slate-100',
        text: 'text-slate-500',
    },
    maintenance: {
        label: 'Maintenance',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
    },
    assigned: {
        label: 'Assigned',
        bg: 'bg-sky-50',
        text: 'text-sky-600',
    },
};

const utilizationSnapshots = [
    {
        id: 'util-001',
        label: 'Pemakaian Kendaraan',
        value: '82%',
        detail: 'Target 80%',
    },
    {
        id: 'util-002',
        label: 'Rata-rata Load',
        value: '4.1 Ton',
        detail: 'Pencapaian 7 hari',
    },
    {
        id: 'util-003',
        label: 'On-time Delivery',
        value: '94%',
        detail: 'QTD Performance',
    },
];

// Icon wrappers using Lucide React
const SearchIcon = ({ className = 'h-4 w-4' }) => <Search className={className} />;

function SummaryCard({ card }) {
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

function StatusBadge({ status }) {
    const style = statusStyles[status] ?? statusStyles.onRoute;

    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
            <span className='h-2 w-2 rounded-full bg-current' />
            {style.label}
        </span>
    );
}

function ActiveVehicleRow({ item }) {
    // Helper format berat
    const formatWeight = (kg) => {
        if (!kg) return '-';
        if (kg < 1000) return `${Math.round(kg)} Kg`;
        return `${(kg / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton`;
    };

    // Helper hitung persentase
    const calculatePercentage = (current, max) => {
        if (!current || !max) return 0;
        return Math.min(100, Math.round((current / max) * 100));
    };

    const percentage = calculatePercentage(item.weight_kg, item.max_capacity_kg);

    // Warna progress bar
    let progressColor = 'bg-indigo-500';
    if (percentage > 90) progressColor = 'bg-rose-500'; // Hampir Overload
    else if (percentage > 70) progressColor = 'bg-emerald-500'; // Optimal

    return (
        <tr className='transition-colors hover:bg-slate-50'>
            <td className='px-6 py-4'>
                <div className='space-y-1'>
                    <p className='text-sm font-semibold text-slate-900'>{item.vehicle}</p>
                    <p className='text-xs text-slate-400'>Driver: {item.driver}</p>
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>{item.route}</td>
            <td className='px-6 py-4'>
                {item.weight_kg ? (
                    <div className="w-32">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-semibold text-slate-800">
                                {formatWeight(item.weight_kg)}
                            </span>
                            <span className="text-xs text-slate-400">
                                {percentage}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${progressColor} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        {item.max_capacity_kg > 0 && (
                            <p className="text-[10px] text-slate-400 mt-1">
                                Kapasitas: {formatWeight(item.max_capacity_kg)}
                            </p>
                        )}
                    </div>
                ) : (
                    <span className='text-sm text-slate-400'>-</span>
                )}
            </td>
            <td className='px-6 py-4'>
                {item.manifest ? (
                    <span className='text-sm font-medium text-indigo-600'>{item.manifest}</span>
                ) : (
                    <span className='text-sm text-slate-400'>-</span>
                )}
            </td>
            <td className='px-6 py-4'>
                <StatusBadge status={item.status} />
            </td>
        </tr>
    );
}

function ActiveVehicleTable({
    items,
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
        <>
            <div className='mt-6 overflow-x-auto'>
                <table className='w-full min-w-[960px] border-collapse'>
                    <thead>
                        <tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                            <th className='px-6 py-3'>Kendaraan</th>
                            <th className='px-6 py-3'>Rute</th>
                            <th className='px-6 py-3'>Muatan</th>
                            <th className='px-6 py-3'>Manifest</th>
                            <th className='px-6 py-3'>Status</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className='px-6 py-12 text-center text-sm text-slate-400'>
                                    Memuat data kendaraan...
                                </td>
                            </tr>
                        ) : items.length > 0 ? (
                            items.map((item) => <ActiveVehicleRow key={item.id} item={item} />)
                        ) : (
                            <tr>
                                <td colSpan={5} className='px-6 py-12 text-center text-sm text-slate-400'>
                                    Tidak ada kendaraan dengan filter yang dipilih.
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

function UtilizationCard({ snapshot }) {
    return (
        <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-wide text-indigo-500'>{snapshot.label}</p>
            <p className='mt-3 text-2xl font-semibold text-slate-900'>{snapshot.value}</p>
            <p className='mt-2 text-xs text-slate-400'>{snapshot.detail}</p>
        </article>
    );
}

export default function ActiveVehiclesContent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [regionFilter, setRegionFilter] = useState('all');
    const [vehicles, setVehicles] = useState([]);
    const [activeLoadTon, setActiveLoadTon] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const loadVehicles = async () => {
            try {
                const response = await fetchActiveVehicles();
                if (response.success) {
                    setVehicles(response.data);
                    // Extract active load ton from summary
                    setActiveLoadTon(response.summary?.active_load_ton ?? 0);
                }
            } catch (error) {
                console.error('Error fetching active vehicles:', error);
            } finally {
                setLoading(false);
            }
        };

        loadVehicles();
        // Optional: Set up polling
        const interval = setInterval(loadVehicles, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const filteredVehicles = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return vehicles.filter((item) => {
            const matchesSearch =
                term.length === 0 ||
                item.vehicle.toLowerCase().includes(term) ||
                item.driver.toLowerCase().includes(term) ||
                item.route.toLowerCase().includes(term);

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesRegion = regionFilter === 'all' || item.region === regionFilter;

            return matchesSearch && matchesStatus && matchesRegion;
        });
    }, [searchTerm, statusFilter, regionFilter, vehicles]);

    // Generate real-time summary cards from vehicles data
    const summaryCards = useMemo(() => generateSummaryCards(vehicles, activeLoadTon), [vehicles, activeLoadTon]);

    // Pagination calculations
    const totalItems = filteredVehicles.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

    // Reset ke halaman 1 saat filter/search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, regionFilter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className='flex flex-col gap-8'>
            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {summaryCards.map((card) => (
                    <SummaryCard key={card.title} card={card} />
                ))}
            </section>

            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h2 className='text-lg font-semibold text-slate-900'>Kendaraan Aktif</h2>
                        <p className='text-sm text-slate-400'>Monitor status armada secara real-time dan siap ambil aksi.</p>
                    </div>
                    <div className='flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center'>
                        <div className='group relative min-w-[260px] flex-1'>
                            <span className='pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400'>
                                <SearchIcon />
                            </span>
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder='Cari plat, driver, atau rute...'
                                className='w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                            />
                        </div>
                        <FilterDropdown
                            value={regionFilter}
                            onChange={setRegionFilter}
                            options={regionFilterOptions}
                            widthClass='w-full sm:w-48'
                        />
                        <FilterDropdown
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={statusFilterOptions}
                            widthClass='w-full sm:w-48'
                        />
                    </div>
                </div>
                <ActiveVehicleTable
                    items={paginatedVehicles}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={handlePageChange}
                />
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-1'>
                <article className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h3 className='text-sm font-semibold text-slate-800'>Live Map Snapshot</h3>
                            <p className='text-xs text-slate-400'>Real-time vehicle positions.</p>
                        </div>
                        <span className='text-xs font-semibold text-slate-400'>Update per 30 detik</span>
                    </div>
                    <div className='mt-4 flex h-96 overflow-hidden rounded-2xl border border-slate-200'>
                        <LiveTrackingMap />
                    </div>
                </article>
            </section>
        </div>
    );
}