import React, { useEffect, useMemo, useRef, useState } from 'react';
import FilterDropdown from '../../../components/common/FilterDropdown';
import EditModal from '../../../components/common/EditModal';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';
import Pagination from '../../../components/common/Pagination';
import { useCustomers } from '../hooks/useCustomers';
import { useCustomersCrud } from '../hooks/useCustomersCrud';
import {
    HiUsers,
    HiCheckCircle,
    HiBuildingOffice,
    HiStar,
    HiMagnifyingGlass,
    HiFunnel,
    HiPlus,
    HiPencil,
    HiTrash,
    HiEye,
    HiPhone,
    HiEnvelope,
    HiMapPin
} from 'react-icons/hi2';

// Jumlah data per halaman
const ITEMS_PER_PAGE = 5;

// Generate real-time summary cards from customer data
const generateSummaryCards = (customers = []) => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const corporateCustomers = customers.filter(c => c.type === 'corporate').length;
    const smeCustomers = customers.filter(c => c.type === 'sme').length;

    // Calculate average rating from customers with valid ratings
    const customersWithRating = customers.filter(c => Number.isFinite(c.rating) && c.rating > 0);
    const avgRating = customersWithRating.length > 0
        ? (customersWithRating.reduce((sum, c) => sum + c.rating, 0) / customersWithRating.length).toFixed(1)
        : '0.0';

    // Calculate active percentage
    const activePercentage = totalCustomers > 0
        ? Math.round((activeCustomers / totalCustomers) * 100)
        : 0;

    return [
        {
            title: 'Total Pelanggan',
            value: totalCustomers.toString(),
            description: `Termasuk ${corporateCustomers} corporate & ${totalCustomers - corporateCustomers} lainnya`,
            iconBg: 'bg-sky-100',
            iconColor: 'text-sky-600',
            icon: <HiUsers className='h-5 w-5' />,
        },
        {
            title: 'Pelanggan Aktif',
            value: activeCustomers.toString(),
            description: `${activePercentage}% dari total pelanggan`,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-500',
            icon: <HiCheckCircle className='h-5 w-5' />,
        },
        {
            title: 'Corporate',
            value: corporateCustomers.toString(),
            description: `Termasuk SME (${smeCustomers}) & enterprise`,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-500',
            icon: <HiBuildingOffice className='h-5 w-5' />,
        },
        {
            title: 'Rata-rata Rating',
            value: avgRating,
            description: `Dari ${customersWithRating.length} ulasan pelanggan`,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-500',
            icon: <HiStar className='h-5 w-5' />,
        },
    ];
};

const customerTypeStyles = {
    corporate: {
        label: 'Corporate',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
    },
    sme: {
        label: 'SME',
        bg: 'bg-sky-50',
        text: 'text-sky-600',
    },
    individual: {
        label: 'Individual',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
};

const customerStatusStyles = {
    active: {
        label: 'Aktif',
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        dot: 'bg-emerald-500',
    },
    inactive: {
        label: 'Tidak Aktif',
        text: 'text-slate-500',
        bg: 'bg-slate-100',
        dot: 'bg-slate-400',
    },
};

const customerTypeOptions = [
    { value: 'all', label: 'Semua Tipe' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'sme', label: 'SME' },
    { value: 'individual', label: 'Individual' },
];

const customerStatusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Tidak Aktif' },
];

const API_CUSTOMER_TYPE_MAP = {
    corporate: 'Corporate',
    sme: 'SME',
    individual: 'Individual',
};

const SearchIcon = ({ className = 'h-5 w-5' }) => <HiMagnifyingGlass className={className} />;
const PhoneIcon = ({ className = 'h-4 w-4' }) => <HiPhone className={className} />;
const MailIcon = ({ className = 'h-4 w-4' }) => <HiEnvelope className={className} />;
const MapPinIcon = ({ className = 'h-4 w-4' }) => <HiMapPin className={className} />;
const StarIcon = ({ className = 'h-4 w-4' }) => <HiStar className={className} />;
const EditIcon = ({ className = 'h-4 w-4' }) => <HiPencil className={className} />;
const TrashIcon = ({ className = 'h-4 w-4' }) => <HiTrash className={className} />;

const normalizeCustomerType = (type) => {
    if (!type) return 'corporate';
    const normalized = type.toString().toLowerCase();
    if (['corporate', 'sme', 'individual'].includes(normalized)) {
        return normalized;
    }
    return 'corporate';
};

const normalizeCustomerStatus = (status) => {
    if (!status) return 'active';
    const normalized = status.toString().toLowerCase();
    if (normalized.startsWith('non')) {
        return 'inactive';
    }
    return normalized === 'inactive' ? 'inactive' : 'active';
};

const mapCustomerFromApi = (customer) => {
    if (!customer) {
        return null;
    }

    const totalValue = customer.total_value ?? customer.totalValue ?? 0;
    const ratingValue = Number(customer.rating ?? customer.avg_rating ?? 0);

    return {
        id: customer.customer_id ?? customer.id ?? customer.customer_code ?? crypto.randomUUID?.() ?? Math.random().toString(),
        name: customer.customer_name ?? customer.name ?? '-',
        code: customer.customer_code ?? customer.code ?? '-',
        type: normalizeCustomerType(customer.customer_type ?? customer.type),
        contact: customer.contact_name ?? customer.contact ?? '-',
        phone: customer.phone ?? '-',
        email: customer.email ?? '-',
        address: customer.address ?? '-',
        status: normalizeCustomerStatus(customer.status),
        totalOrders: customer.total_orders ?? customer.totalOrders ?? 0,
        totalValue,
        rating: Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue : 0,
        raw: customer,
    };
};

const formatCustomerList = (list = []) => list
    .map(mapCustomerFromApi)
    .filter(Boolean);

function CustomerSummaryCard({ card }) {
    return (
        <article className='flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm'>
            <div className='min-w-0 flex-1'>
                <p className='text-sm text-slate-400 truncate'>{card.title}</p>
                <p className='mt-2 text-2xl sm:text-3xl font-semibold text-slate-900'>{card.value}</p>
                <p className='mt-1 text-xs text-slate-400 truncate'>{card.description}</p>
            </div>
            <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor} flex-shrink-0 ml-3`}>
                {card.icon}
            </div>
        </article>
    );
}

function CustomerTypeBadge({ type }) {
    const style = customerTypeStyles[type] ?? customerTypeStyles.corporate;
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
}

function CustomerStatusBadge({ status }) {
    const style = customerStatusStyles[status] ?? customerStatusStyles.active;
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${style.bg} ${style.text}`}>
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            {style.label}
        </span>
    );
}

function CustomerRow({ customer, onEdit, onDelete }) {
    const customerName = customer?.name ?? '-';
    const initial = customerName.charAt(0).toUpperCase();
    const ratingDisplay = Number.isFinite(customer?.rating) ? customer.rating.toFixed(1) : '0.0';

    return (
        <tr className='transition-colors hover:bg-slate-50'>
            <td className='whitespace-nowrap px-3 py-4 sm:px-6'>
                <div className='flex items-center gap-2 sm:gap-3'>
                    <div className='flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-100 text-xs sm:text-sm font-semibold text-slate-600'>
                        {initial}
                    </div>
                    <div className='min-w-0'>
                        <p className='text-sm font-semibold text-slate-800 truncate'>{customerName}</p>
                        <p className='text-xs text-slate-400'>{customer.code ?? '-'}</p>
                    </div>
                </div>
            </td>
            <td className='px-3 py-4 sm:px-6'>
                <CustomerTypeBadge type={customer.type} />
            </td>
            <td className='px-3 py-4 sm:px-6'>
                <div className='space-y-1 text-sm text-slate-600'>
                    <p className='font-semibold text-slate-700 truncate'>{customer.contact}</p>
                    <div className='flex items-center gap-2'>
                        <PhoneIcon className='text-slate-400 flex-shrink-0' />
                        <span className='truncate'>{customer.phone}</span>
                    </div>
                    <div className='flex items-center gap-2 text-slate-400'>
                        <MailIcon className='flex-shrink-0' />
                        <span className='truncate'>{customer.email}</span>
                    </div>
                </div>
            </td>
            <td className='px-3 py-4 sm:px-6 text-sm text-slate-600'>
                <div className='flex items-center gap-2'>
                    <MapPinIcon className='text-slate-400 flex-shrink-0' />
                    <span className='truncate'>{customer.address}</span>
                </div>
            </td>
            <td className='px-3 py-4 sm:px-6'>
                <CustomerStatusBadge status={customer.status} />
            </td>

            <td className='px-3 py-4 sm:px-6'>
                <div className='flex items-center gap-1 sm:gap-2'>
                    <button
                        type='button'
                        onClick={(e) => {
                            e.preventDefault();
                            onEdit(customer);
                        }}
                        className='inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600'
                        aria-label={`Edit ${customer.name}`}
                    >
                        <EditIcon className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                    </button>
                    <button
                        type='button'
                        onClick={(e) => {
                            e.preventDefault();
                            onDelete(customer);
                        }}
                        className='inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:text-rose-600'
                        aria-label={`Hapus ${customer.name}`}
                    >
                        <TrashIcon className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function TableSkeleton({ rows = 5 }) {
    return (
        <tbody className='divide-y divide-slate-100'>
            {Array.from({ length: rows }).map((_, index) => (
                <tr key={`skeleton-${index}`} className='animate-pulse'>
                    <td colSpan={9} className='px-3 py-4 sm:px-6'>
                        <div className='h-4 w-full rounded bg-slate-200' />
                    </td>
                </tr>
            ))}
        </tbody>
    );
}

function CustomerTable({
    customers,
    loading,
    searchTerm,
    onSearchChange,
    typeFilter,
    onTypeChange,
    statusFilter,
    onStatusChange,
    onEdit,
    onDelete,
    onAdd,
    // Pagination props
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    onPageChange,
}) {
    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm'>
            <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                        <h2 className='text-lg font-semibold text-slate-900'>Daftar Pelanggan</h2>
                        <p className='text-sm text-slate-400'>Kelola kontak pelanggan dan histori transaksi</p>
                    </div>
                    {/* Tombol tambah di mobile dipindah ke atas */}
                    <button
                        type='button'
                        onClick={onAdd}
                        className='group relative flex-shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-5'
                    >
                        <HiPlus className='h-5 w-5 transition-transform group-hover:rotate-90' />
                        {/* Tampilkan full text pada md ke atas, singkat pada mobile */}
                        <span className='hidden md:inline'>Tambah Pelanggan</span>
                        <span className='inline md:hidden'>Tambah</span>
                    </button>
                </div>

                {/* Controls section - search dan filter */}
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                    <div className='group relative flex-1 min-w-0'>
                        <span className='pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400'>
                            <SearchIcon />
                        </span>
                        <input
                            type='text'
                            value={searchTerm}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder='Cari pelanggan, kontak, atau nomor telepon...'
                            className='w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                        />
                    </div>
                    <FilterDropdown
                        value={typeFilter}
                        onChange={onTypeChange}
                        options={customerTypeOptions}
                        widthClass='w-full sm:w-48'
                    />
                    <FilterDropdown
                        value={statusFilter}
                        onChange={onStatusChange}
                        options={customerStatusOptions}
                        widthClass='w-full sm:w-48'
                    />
                </div>
            </div>
            <div className='mt-4 sm:mt-6 overflow-x-auto'>
                <table className='w-full min-w-[900px] border-collapse'>
                    <thead>
                        <tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                            <th className='px-3 py-3 sm:px-6'>Pelanggan</th>
                            <th className='px-3 py-3 sm:px-6'>Tipe</th>
                            <th className='px-3 py-3 sm:px-6'>Kontak</th>
                            <th className='px-3 py-3 sm:px-6'>Alamat</th>
                            <th className='px-3 py-3 sm:px-6'>Status</th>

                            <th className='px-3 py-3 sm:px-6'>Aksi</th>
                        </tr>
                    </thead>
                    {loading ? (
                        <TableSkeleton rows={ITEMS_PER_PAGE} />
                    ) : (
                        <tbody className='divide-y divide-slate-100'>
                            {customers.length > 0 ? (
                                customers.map((customer, index) => (
                                    <CustomerRow
                                        key={customer.id ?? customer.code ?? index}
                                        customer={customer}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className='px-3 py-12 sm:px-6 text-center text-sm text-slate-400'>
                                        Tidak ada pelanggan yang sesuai dengan filter saat ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    )}
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

export default function CustomerContent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editModal, setEditModal] = useState({ isOpen: false, customer: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, customer: null });
    const [currentPage, setCurrentPage] = useState(1);
    const filterEffectInitialized = useRef(false);

    const {
        customers,
        loading,
        error: fetchError,
        fetchWithParams,
        refetch,
    } = useCustomers({ per_page: 15 });

    const {
        createCustomer,
        updateCustomer,
        deleteCustomer,
        creating,
        updating,
        deleting,
        error: mutationError,
        success: mutationSuccess,
    } = useCustomersCrud();

    const formattedCustomers = useMemo(() => formatCustomerList(customers ?? []), [customers]);

    // Generate real-time summary cards from formatted customer data
    const summaryCards = useMemo(() => generateSummaryCards(formattedCustomers), [formattedCustomers]);

    useEffect(() => {
        if (!filterEffectInitialized.current) {
            filterEffectInitialized.current = true;
            return;
        }

        const handler = setTimeout(() => {
            fetchWithParams({
                search: searchTerm || undefined,
                customer_type: typeFilter !== 'all' ? (API_CUSTOMER_TYPE_MAP[typeFilter] ?? typeFilter) : undefined,
            });
        }, 300);

        return () => clearTimeout(handler);
    }, [searchTerm, typeFilter, fetchWithParams]);

    const resolveCustomerId = (customer) => customer?.customer_id ?? customer?.id ?? customer?.code;

    const mapFormDataToApiPayload = (formData = {}) => {
        const statusMap = {
            active: 'Aktif',
            inactive: 'Nonaktif',
        };

        return {
            customer_name: formData.name?.trim() ?? '',
            customer_code: formData.code?.trim() ?? '',
            customer_type: formData.type ?? null,
            contact_name: formData.contact ?? null,
            phone: formData.phone ?? null,
            email: formData.email ?? null,
            address: formData.address ?? null,
            status: formData.status ? statusMap[formData.status] ?? formData.status : undefined,
        };
    };

    const filteredCustomers = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return formattedCustomers.filter((customer = {}) => {
            const compare = (value = '') => value?.toString().toLowerCase();
            const name = compare(customer.name);
            const contact = compare(customer.contact);
            const phone = customer.phone?.toString() ?? '';
            const email = compare(customer.email);
            const code = compare(customer.code);

            const matchesSearch = normalizedSearch
                ? name.includes(normalizedSearch)
                || contact.includes(normalizedSearch)
                || phone.includes(searchTerm)
                || email.includes(normalizedSearch)
                || code.includes(normalizedSearch)
                : true;

            const matchesType = typeFilter === 'all' || customer.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [formattedCustomers, searchTerm, typeFilter, statusFilter]);

    // Pagination calculations
    const totalItems = filteredCustomers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    // Reset ke halaman 1 saat filter/search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, statusFilter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleAddCustomer = () => {
        setEditModal({ isOpen: true, customer: null });
    };

    const handleEditCustomer = (customer) => {
        setEditModal({ isOpen: true, customer });
    };

    const handleDeleteCustomer = (customer) => {
        setDeleteModal({ isOpen: true, customer });
    };

    const handleCloseEditModal = () => {
        setEditModal({ isOpen: false, customer: null });
    };

    const handleCloseDeleteModal = () => {
        setDeleteModal({ isOpen: false, customer: null });
    };

    const handleSaveCustomer = async (formData) => {
        try {
            const payload = mapFormDataToApiPayload(formData);

            if (editModal.customer) {
                await updateCustomer(resolveCustomerId(editModal.customer), payload);
            } else {
                await createCustomer(payload);
            }
            await refetch();
            handleCloseEditModal();
        } catch (error) {
            console.error('Gagal menyimpan pelanggan:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.customer) {
            return;
        }

        try {
            await deleteCustomer(resolveCustomerId(deleteModal.customer));
            await refetch();
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Gagal menghapus pelanggan:', error);
        }
    };

    const customerModalFields = [
        {
            key: 'name',
            label: 'Nama Pelanggan',
            type: 'text',
            placeholder: 'Masukkan nama pelanggan',
            required: true,
        },

        {
            key: 'type',
            label: 'Tipe Pelanggan',
            type: 'select',
            options: [
                { value: 'corporate', label: 'Corporate' },
                { value: 'sme', label: 'SME' },
                { value: 'individual', label: 'Individual' },
            ],
            required: true,
        },
        {
            key: 'contact',
            label: 'Nama Kontak',
            type: 'text',
            placeholder: 'Masukkan nama kontak',
            required: true,
        },
        {
            key: 'phone',
            label: 'Nomor Telepon',
            type: 'tel',
            placeholder: 'Masukkan nomor telepon',
            required: true,
        },
        {
            key: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'Masukkan alamat email',
            required: true,
        },
        {
            key: 'address',
            label: 'Alamat',
            type: 'textarea',
            placeholder: 'Masukkan alamat lengkap',
            required: true,
        },

    ];

    return (
        <div className='space-y-4 p-4 sm:space-y-6 sm:p-6'>

            <section className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {summaryCards.map((card) => (
                    <CustomerSummaryCard key={card.title} card={card} />
                ))}
            </section>

            {(fetchError || mutationError || mutationSuccess) ? (
                <div className='space-y-2'>
                    {fetchError ? (
                        <div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                            {fetchError}
                        </div>
                    ) : null}
                    {mutationError ? (
                        <div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                            {mutationError}
                        </div>
                    ) : null}
                    {mutationSuccess ? (
                        <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
                            {mutationSuccess}
                        </div>
                    ) : null}
                </div>
            ) : null}

            <CustomerTable
                customers={paginatedCustomers}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                onEdit={handleEditCustomer}
                onDelete={handleDeleteCustomer}
                onAdd={handleAddCustomer}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
            />

            <EditModal
                isOpen={editModal.isOpen}
                onClose={handleCloseEditModal}
                onSubmit={handleSaveCustomer}
                title={editModal.customer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
                fields={customerModalFields}
                initialData={editModal.customer}
                isLoading={creating || updating}
            />

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title='Hapus Pelanggan'
                message={`Apakah Anda yakin ingin menghapus pelanggan "${deleteModal.customer?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                isLoading={deleting}
            />
        </div>
    );
}