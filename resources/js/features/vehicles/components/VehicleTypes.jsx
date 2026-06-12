import React, { useEffect, useMemo, useState } from 'react';
import { Layers, CheckCircle2, XCircle, Truck, Plus, Pencil, Trash2, Search } from 'lucide-react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import EditModal from '../../../components/common/EditModal';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';
import Pagination from '../../../components/common/Pagination';
import { useVehicleTypes } from '../hooks/useVehicleTypes';
import { useVehicleTypesCrud } from '../hooks/useVehicleTypesCrud';

// Jumlah data per halaman
const ITEMS_PER_PAGE = 6;

// Generate real-time summary cards from vehicle types data
const generateSummaryCards = (vehicleTypes = []) => {
    const totalTypes = vehicleTypes.length;

    // Count by status
    const activeTypes = vehicleTypes.filter(vt => vt.status === 'Aktif').length;
    const inactiveTypes = vehicleTypes.filter(vt => vt.status === 'Tidak Aktif').length;

    // Count total vehicles registered
    const totalVehicles = vehicleTypes.reduce((sum, vt) => sum + (vt.vehicles_count ?? vt.vehicle_count ?? 0), 0);

    return [
        {
            title: 'Total Tipe Kendaraan',
            value: totalTypes.toString(),
            description: 'Kategori terdaftar',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            icon: <Layers className='h-5 w-5' />,
        },
        {
            title: 'Aktif',
            value: activeTypes.toString(),
            description: 'Sedang digunakan',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            icon: <CheckCircle2 className='h-5 w-5' />,
        },
        {
            title: 'Non-Aktif',
            value: inactiveTypes.toString(),
            description: 'Tidak digunakan',
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-600',
            icon: <XCircle className='h-5 w-5' />,
        },
        {
            title: 'Kendaraan Terdaftar',
            value: totalVehicles.toString(),
            description: 'Total unit',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            icon: <Truck className='h-5 w-5' />,
        },
    ];
};

const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Tidak Aktif', label: 'Non-Aktif' },
];

// Icon wrappers using Lucide React
const PlusIcon = () => <Plus className='h-4 w-4' />;
const EditIcon = () => <Pencil className='h-4 w-4' />;
const DeleteIcon = () => <Trash2 className='h-4 w-4' />;
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

function Tag({ children, bg, text }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${bg} ${text}`}>
            {children}
        </span>
    );
}

function VehicleTypeRow({ vehicleType, onEdit, onDelete }) {
    const statusConfig = vehicleType.status === 'Aktif'
        ? { label: 'Aktif', bg: 'bg-emerald-50', text: 'text-emerald-600' }
        : { label: 'Non-Aktif', bg: 'bg-slate-100', text: 'text-slate-500' };

    return (
        <tr className='hover:bg-slate-50'>
            <td className='px-6 py-4'>
                <div>
                    <div className='font-medium text-slate-900'>{vehicleType.name}</div>
                    <div className='text-sm text-slate-500'>{vehicleType.description}</div>
                </div>
            </td>
            <td className='px-6 py-4'>
                <div className='text-sm text-slate-900'>{vehicleType.capacity_range}</div>
                <div className='text-xs text-slate-500'>
                    Maks: {vehicleType.capacity_max_kg} kg
                </div>
            </td>
            <td className='px-6 py-4'>
                <div className='text-sm text-slate-900'>
                    Maks: {vehicleType.volume_max_m3} m³
                </div>
            </td>
            <td className='px-6 py-4'>
                <Tag bg={statusConfig.bg} text={statusConfig.text}>
                    {statusConfig.label}
                </Tag>
            </td>
            <td className='px-6 py-4'>
                <div className='text-sm font-medium text-slate-900'>
                    {vehicleType.vehicles_count ?? vehicleType.vehicle_count ?? 0} Unit
                </div>
            </td>
            <td className='px-6 py-4'>
                <div className='text-sm text-slate-900'>
                    {new Date(vehicleType.created_at).toLocaleDateString('id-ID')}
                </div>
            </td>
            <td className='px-6 py-4'>
                <div className='flex items-center gap-2'>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onEdit(vehicleType);
                        }}
                        className='flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors'
                        title='Edit'
                    >
                        <EditIcon />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onDelete(vehicleType);
                        }}
                        className='flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors'
                        title='Hapus'
                    >
                        <DeleteIcon />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function VehicleTypeTable({
    vehicleTypes,
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
        <>
            <div className='overflow-x-auto'>
                <table className='w-full'>
                    <thead>
                        <tr className='border-b border-slate-200'>
                            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500'>
                                Nama & Deskripsi
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500'>
                                Kapasitas Berat
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500'>
                                Volume
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500'>
                                Status
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500'>
                                Kendaraan
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500'>
                                Dibuat
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500'>
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className='px-6 py-12 text-center text-slate-500'>
                                    Memuat data tipe kendaraan...
                                </td>
                            </tr>
                        ) : vehicleTypes.length > 0 ? (
                            vehicleTypes.map((vehicleType) => (
                                <VehicleTypeRow
                                    key={vehicleType.id}
                                    vehicleType={vehicleType}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className='px-6 py-12 text-center text-slate-500'>
                                    <div className='flex flex-col items-center'>
                                        <svg className='h-12 w-12 text-slate-300 mb-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-5v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V8a1 1 0 011-1h2a1 1 0 011 1z' />
                                        </svg>
                                        <p className='text-sm font-medium text-slate-900 mb-1'>Belum ada tipe kendaraan</p>
                                        <p className='text-sm text-slate-500'>Mulai dengan menambahkan tipe kendaraan pertama</p>
                                    </div>
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

export default function VehicleTypesContent({ showPopup = false, setShowPopup = () => { } }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Hooks integration
    const { vehicleTypes, loading, error, refetch, setParams } = useVehicleTypes();
    const { createVehicleType, updateVehicleType, deleteVehicleType, creating, updating, deleting } = useVehicleTypesCrud();

    // Modal states
    const [editModal, setEditModal] = useState({ isOpen: false, vehicleType: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, vehicleType: null });

    // Generate real-time summary cards from vehicle types data
    const summaryCards = useMemo(() => generateSummaryCards(vehicleTypes), [vehicleTypes]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setParams(prev => ({
                ...prev,
                search: searchTerm,
                status: statusFilter === 'all' ? null : statusFilter
            }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, setParams]);

    // Pagination calculations
    const totalItems = vehicleTypes.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedVehicleTypes = vehicleTypes.slice(startIndex, endIndex);

    // Reset ke halaman 1 saat filter/search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Edit modal handlers
    const handleAdd = () => {
        setEditModal({ isOpen: true, vehicleType: null });
    };

    const handleEdit = (vehicleType) => {
        setEditModal({ isOpen: true, vehicleType });
    };

    const handleEditSubmit = async (formData) => {
        try {
            if (editModal.vehicleType) {
                await updateVehicleType(editModal.vehicleType.id, formData);
            } else {
                await createVehicleType(formData);
            }
            refetch();
            setEditModal({ isOpen: false, vehicleType: null });
        } catch (error) {
            console.error('Error updating vehicle type:', error);
        }
    };

    // Delete modal handlers
    const handleDelete = (vehicleType) => {
        setDeleteModal({ isOpen: true, vehicleType });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (deleteModal.vehicleType) {
                await deleteVehicleType(deleteModal.vehicleType.id);
                refetch();
            }
            setDeleteModal({ isOpen: false, vehicleType: null });
        } catch (error) {
            console.error('Error deleting vehicle type:', error);
        }
    };

    const handleEditClose = () => setEditModal({ isOpen: false, vehicleType: null });
    const handleDeleteClose = () => setDeleteModal({ isOpen: false, vehicleType: null });

    const baseFormFields = [
        {
            name: 'name',
            label: 'Nama Tipe',
            type: 'text',
            required: true,
            placeholder: 'Nama tipe kendaraan'
        },
        {
            name: 'description',
            label: 'Deskripsi',
            type: 'textarea',
            required: false,
            placeholder: 'Deskripsi singkat tentang tipe kendaraan'
        },
        {
            name: 'capacity_max_kg',
            label: 'Kapasitas Maksimum (Kg)',
            type: 'number',
            required: false,
            placeholder: '5000'
        },
        {
            name: 'volume_max_m3',
            label: 'Volume Maksimum (m³)',
            type: 'number',
            required: false,
            placeholder: '20'
        }
    ];

    const statusField = {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
            { value: 'Aktif', label: 'Aktif' },
            { value: 'Tidak Aktif', label: 'Non-Aktif' }
        ]
    };

    // Only include status field when editing an existing vehicle type
    const editFormFields = editModal.vehicleType
        ? [...baseFormFields, statusField]
        : baseFormFields;

    return (
        <>
            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {summaryCards.map((card) => (
                    <SummaryCard key={card.title} card={card} />
                ))}
            </section>

            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6'>
                    <div>
                        <h2 className='text-lg font-semibold text-slate-900'>Daftar Tipe Kendaraan</h2>
                        <p className='text-sm text-slate-500'>Kelola kategori dan spesifikasi tipe kendaraan</p>
                    </div>

                    <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                        <div className='relative'>
                            <input
                                type='text'
                                placeholder='Cari tipe kendaraan...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='w-full sm:w-64 rounded-2xl border border-slate-200 bg-white px-4 py-2 pl-10 text-sm placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100'
                            />
                            <span className='absolute left-3 top-2.5 text-slate-400'>
                                <SearchIcon className='h-4 w-4' />
                            </span>
                        </div>

                        <FilterDropdown
                            options={statusOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Filter Status"
                        />

                        <button
                            type='button'
                            onClick={handleAdd}
                            className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:w-auto'
                        >
                            <PlusIcon />
                            Tambah Tipe
                        </button>
                    </div>
                </div>

                <VehicleTypeTable
                    vehicleTypes={paginatedVehicleTypes}
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
            </section>

            <EditModal
                title={editModal.vehicleType ? 'Edit Tipe Kendaraan' : 'Tambah Tipe Kendaraan'}
                fields={editFormFields}
                initialData={editModal.vehicleType}
                isOpen={editModal.isOpen}
                onClose={handleEditClose}
                onSubmit={handleEditSubmit}
                isLoading={creating || updating}
            />

            <DeleteConfirmModal
                title="Hapus Tipe Kendaraan"
                message={`Apakah Anda yakin ingin menghapus tipe kendaraan "${deleteModal.vehicleType?.name}"?`}
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteClose}
                onConfirm={handleDeleteConfirm}
                isLoading={deleting}
            />
        </>
    );
}