import React, { useEffect, useMemo, useState } from 'react';
import { Truck, Check, Package, AlertTriangle, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import EditModal from '../../../components/common/EditModal';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';
import Pagination from '../../../components/common/Pagination';
import { useVehicles } from '../hooks/useVehicles';
import { useVehiclesCrud } from '../hooks/useVehiclesCrud';
import { useActiveVehicleTypes } from '../hooks/useActiveVehicleTypes';
import { useAvailableDrivers } from '../hooks/useAvailableDrivers';

// Jumlah data per halaman
const ITEMS_PER_PAGE = 6;

// Generate real-time summary cards from vehicle data
const generateSummaryCards = (vehicles = []) => {
    const totalVehicles = vehicles.length;

    // Count by status
    const operatingVehicles = vehicles.filter(v => v.status === 'Aktif' || v.status === 'Sedang Kirim').length;
    // const maintenanceVehicles = vehicles.filter(v => v.status === 'Maintenance').length; // Removed
    const inactiveVehicles = vehicles.filter(v => v.status === 'Tidak Aktif').length;

    // Calculate total available capacity (Sum of max_weight for 'Aktif' vehicles)
    // max_weight is in kg, convert to Tons
    const availableCapacity = vehicles
        .filter(v => v.status === 'Aktif')
        .reduce((sum, v) => sum + (parseFloat(v.max_weight) || 0), 0);

    // Format to Tons with 1 decimal place if needed
    const availableCapacityTons = (availableCapacity / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 });

    return [
        {
            title: 'Total Kendaraan',
            value: totalVehicles.toString(),
            description: 'Armada terdaftar',
            iconBg: 'bg-sky-100',
            iconColor: 'text-sky-600',
            icon: <Truck className='h-5 w-5' />,
        },
        {
            title: 'Beroperasi',
            value: operatingVehicles.toString(),
            description: 'Sedang digunakan di lapangan',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-500',
            icon: <Check className='h-5 w-5' />,
        },
        {
            title: 'Kapasitas Tersedia',
            value: `${availableCapacityTons} Ton`,
            description: 'Total kapasitas armada yang siap jalan',
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
            icon: <Package className='h-5 w-5' />,
        },
        {
            title: 'Tidak Aktif',
            value: inactiveVehicles.toString(),
            description: 'Perlu tindak lanjut',
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-500',
            icon: <AlertTriangle className='h-5 w-5' />,
        },
    ];
};

const tabs = [
    { key: 'vehicles', label: 'Daftar Kendaraan' },
    // { key: 'history', label: 'Rekapitulasi/Histori' },
    // { key: 'active', label: 'Kendaraan Beroperasi' },
];

const vehicleStatusStyles = {
    'Aktif': {
        label: 'Aktif',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    'Sedang Kirim': {
        label: 'Sedang Kirim',
        bg: 'bg-sky-50',
        text: 'text-sky-600',
    },
    'Maintenance': {
        label: 'Maintenance',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
    'Tidak Aktif': {
        label: 'Tidak Aktif',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
    },
};

const conditionStyles = {
    'Baru': {
        label: 'Baru',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
    },
    'Sangat Baik': {
        label: 'Sangat Baik',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    'Baik': {
        label: 'Baik',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    'Perlu Perbaikan': {
        label: 'Perlu Perbaikan',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
};

const driverFilterOptions = [
    { value: 'all', label: 'Semua Driver' },
];

const statusFilterOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Tidak Aktif', label: 'Tidak Aktif' },
];

const EXIT_ANIMATION_DURATION = 280; // Keep in sync with CSS modal exit duration

// Icon wrappers using Lucide React
const SearchIcon = ({ className = 'h-5 w-5' }) => <Search className={className} />;
const PlusIcon = ({ className = 'h-4 w-4' }) => <Plus className={className} />;
const EditIcon = ({ className = 'h-4 w-4' }) => <Pencil className={className} />;
const TrashIcon = ({ className = 'h-4 w-4' }) => <Trash2 className={className} />;

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

function Tag({ children, bg, text }) {
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${bg} ${text}`}>
            {children}
        </span>
    );
}



function VehicleRow({ vehicle, onEdit, onDelete }) {
    const statusStyle = vehicleStatusStyles[vehicle.status] ?? vehicleStatusStyles['Aktif'];
    const conditionStyle = conditionStyles[vehicle.condition_label] ?? conditionStyles['Baik'];

    return (
        <tr className='transition-colors hover:bg-slate-50'>
            <td className='whitespace-nowrap px-6 py-4'>
                <p className='text-sm font-semibold text-slate-800'>{vehicle.plate_no || 'N/A'}</p>
                <p className='text-xs text-slate-500'>
                    {vehicle.brand} {vehicle.model} • {vehicle.year ? `Tahun ${vehicle.year}` : 'Tahun N/A'}
                </p>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                <div className='space-y-1'>
                    <p className='font-medium text-slate-900'>{vehicle.vehicle_type?.name || vehicle.type || 'N/A'}</p>
                    <p className='text-xs text-slate-500'>{vehicle.capacity_label || 'N/A'}</p>
                    <p className='text-xs text-slate-400'>
                        Kapasitas: {vehicle.vehicle_type?.capacity_max_kg ? `${parseInt(vehicle.vehicle_type.capacity_max_kg).toLocaleString('id-ID')} Kg` : 'N/A'}
                    </p>
                </div>
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>
                {vehicle.driver?.driver_name || 'Tidak ada driver'}
            </td>
            <td className='px-6 py-4 text-sm text-slate-600'>{vehicle.current_location || 'Pool (Standby)'}</td>
            <td className='px-6 py-4'>
                <Tag bg={statusStyle.bg} text={statusStyle.text}>
                    {statusStyle.label}
                </Tag>
            </td>
            <td className='px-6 py-4'>
                <Tag bg={conditionStyle.bg} text={conditionStyle.text}>
                    {conditionStyle.label}
                </Tag>
            </td>
            <td className='px-6 py-4'>
                <div className='flex items-center gap-1'>
                    <button
                        type='button'
                        onClick={(e) => {
                            e.preventDefault();
                            onEdit(vehicle);
                        }}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600'
                        aria-label={`Edit kendaraan ${vehicle.plate}`}
                    >
                        <EditIcon />
                    </button>
                    <button
                        type='button'
                        onClick={(e) => {
                            e.preventDefault();
                            onDelete(vehicle);
                        }}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:text-rose-600'
                        aria-label={`Hapus kendaraan ${vehicle.plate}`}
                    >
                        <TrashIcon />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function VehicleTable({
    vehicles,
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
            <div className='flex items-center justify-between'>
                <h2 className='text-sm font-semibold text-slate-700'>Daftar Kendaraan</h2>
                <button
                    type='button'
                    className='inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600'
                >
                    Export Data
                </button>
            </div>
            <div className='mt-6 overflow-x-auto'>
                <table className='w-full min-w-[1000px] border-collapse'>
                    <thead>
                        <tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                            <th className='px-6 py-3'>Kendaraan</th>
                            <th className='px-6 py-3'>Tipe & Kapasitas</th>
                            <th className='px-6 py-3'>Driver Saat Ini</th>
                            <th className='px-6 py-3'>Lokasi</th>
                            <th className='px-6 py-3'>Status</th>
                            <th className='px-6 py-3'>Kondisi</th>
                            <th className='px-6 py-3'>Aksi</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className='px-6 py-12 text-center text-sm text-slate-400'>
                                    Memuat data kendaraan...
                                </td>
                            </tr>
                        ) : vehicles.length > 0 ? (
                            vehicles.map((vehicle) => (
                                <VehicleRow
                                    key={vehicle.vehicle_id || vehicle.id || vehicle.plate}
                                    vehicle={vehicle}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className='px-6 py-12 text-center text-sm text-slate-400'>
                                    Tidak ada kendaraan pada filter saat ini.
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
        </section>
    );
}

export default function VehicleListContent({ showPopup = false, setShowPopup = () => { } }) {
    const [activeTab, setActiveTab] = useState('vehicles');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [driverFilter, setDriverFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Hooks integration
    const { vehicles, loading, error, refetch, setParams } = useVehicles();
    const { createVehicle, updateVehicle, deleteVehicle, creating, updating, deleting } = useVehiclesCrud();
    const { activeVehicleTypes } = useActiveVehicleTypes();
    const { availableDrivers, refetch: refetchDrivers } = useAvailableDrivers();

    // Modal states
    const [editModal, setEditModal] = useState({ isOpen: false, vehicle: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, vehicle: null });

    // Generate real-time summary cards from vehicle data
    const summaryCards = useMemo(() => generateSummaryCards(vehicles), [vehicles]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setParams(prev => ({
                ...prev,
                search: searchTerm,
                status: statusFilter === 'all' ? null : statusFilter,
                driver_id: driverFilter === 'all' ? null : driverFilter
            }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, driverFilter, setParams]);

    // Pagination calculations
    const totalItems = vehicles.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedVehicles = vehicles.slice(startIndex, endIndex);

    // Reset ke halaman 1 saat filter/search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, driverFilter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Edit modal handlers
    const handleAdd = () => {
        setEditModal({ isOpen: true, vehicle: null });
    };

    const handleEdit = (vehicle) => {
        setEditModal({ isOpen: true, vehicle });
    };

    const handleEditSubmit = async (formData) => {
        try {
            if (editModal.vehicle) {
                await updateVehicle(editModal.vehicle.vehicle_id, formData);
            } else {
                await createVehicle(formData);
            }
            refetch();
            refetchDrivers(); // Refresh available drivers list
            setEditModal({ isOpen: false, vehicle: null });
        } catch (error) {
            console.error('Error saving vehicle:', error);
        }
    };

    const handleEditClose = () => {
        setEditModal({ isOpen: false, vehicle: null });
    };

    // Delete modal handlers
    const handleDelete = (vehicle) => {
        setDeleteModal({ isOpen: true, vehicle });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (deleteModal.vehicle) {
                await deleteVehicle(deleteModal.vehicle.vehicle_id);
                refetch();
            }
            setDeleteModal({ isOpen: false, vehicle: null });
        } catch (error) {
            console.error('Error deleting vehicle:', error);
        }
    };

    const handleDeleteClose = () => {
        setDeleteModal({ isOpen: false, vehicle: null });
    };

    // Base vehicle form fields (for Add form)
    const baseVehicleFields = [
        {
            name: 'plate_no',
            label: 'Nomor Plat',
            type: 'text',
            required: true,
            placeholder: 'Contoh: B 1234 ABC'
        },
        {
            name: 'brand',
            label: 'Merk Kendaraan',
            type: 'text',
            required: true,
            placeholder: 'Contoh: Toyota, Suzuki, Mitsubishi'
        },
        {
            name: 'model',
            label: 'Model Kendaraan',
            type: 'text',
            required: true,
            placeholder: 'Contoh: Hiace, Carry, L300'
        },
        {
            name: 'vehicle_type_id',
            label: 'Tipe Kendaraan',
            type: 'select',
            required: true,
            options: activeVehicleTypes.map(type => ({ value: type.id, label: type.name }))
        },
        {
            name: 'year',
            label: 'Tahun',
            type: 'number',
            required: true,
            placeholder: 'Contoh: 2023'
        },
        {
            name: 'capacity_label',
            label: 'Label Kapasitas',
            type: 'text',
            required: true,
            placeholder: 'Contoh: 1 Ton, 5m³, 10 Kubik'
        },
        {
            name: 'max_weight',
            label: 'Berat Maksimal (kg)',
            type: 'number',
            required: true,
            placeholder: 'Contoh: 1000',
            min: 0,
            step: '0.01'
        }
    ];

    // Additional fields for Edit form only
    const editOnlyFields = [
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
                { value: 'Aktif', label: 'Aktif' },
                { value: 'Tidak Aktif', label: 'Tidak Aktif' }
            ]
        },
        {
            name: 'condition_label',
            label: 'Kondisi',
            type: 'select',
            required: true,
            options: [
                { value: 'Baru', label: 'Baru' },
                { value: 'Sangat Baik', label: 'Sangat Baik' },
                { value: 'Baik', label: 'Baik' },
                { value: 'Perlu Perbaikan', label: 'Perlu Perbaikan' }
            ]
        }
    ];

    // Combine fields based on whether we're adding or editing
    const getFormFields = (isEdit) => {
        return isEdit ? [...baseVehicleFields, ...editOnlyFields] : baseVehicleFields;
    };

    return (
        <>
            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {summaryCards.map((card) => (
                    <SummaryCard key={card.title} card={card} />
                ))}
            </section>
            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div className='inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-500'>
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type='button'
                                    onClick={() => setActiveTab(tab.key)}
                                    className={'flex-1 rounded-xl px-4 py-2 transition ' + (isActive ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-indigo-600')}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className='flex flex-col gap-3'>
                        {/* Search and Filter Row */}
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                            <div className='group relative min-w-[260px] flex-1'>
                                <span className='pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400'>
                                    <SearchIcon />
                                </span>
                                <input
                                    type='text'
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder='Cari plat nomor, merk, atau tipe...'
                                    className='w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                                />
                            </div>
                            <FilterDropdown
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={statusFilterOptions}
                                className='w-full sm:w-40'
                            />
                            <FilterDropdown
                                value={driverFilter}
                                onChange={setDriverFilter}
                                options={driverFilterOptions}
                                className="w-full sm:w-48"
                            />
                        </div>
                        {/* Action Button Row */}
                        <div className='flex justify-end'>
                            <button
                                type='button'
                                onClick={handleAdd}
                                className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto'
                            >
                                <PlusIcon className='h-4 w-4' />
                                Tambah Kendaraan
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <VehicleTable
                vehicles={paginatedVehicles}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
            />

            <EditModal
                title={editModal.vehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
                fields={getFormFields(!!editModal.vehicle)}
                initialData={editModal.vehicle}
                isOpen={editModal.isOpen}
                onClose={handleEditClose}
                onSubmit={handleEditSubmit}
                isLoading={creating || updating}
            />

            <DeleteConfirmModal
                title="Hapus Kendaraan"
                message={`Apakah Anda yakin ingin menghapus kendaraan "${deleteModal.vehicle?.plate}"?`}
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteClose}
                onConfirm={handleDeleteConfirm}
                isLoading={deleting}
            />
        </>
    );
}