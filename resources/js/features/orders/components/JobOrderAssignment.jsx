import React, { useState, useEffect, useMemo } from 'react';
import EditModal from '../../../components/common/EditModal';
import Manifest from '../../manifests/components/Manifest'
import { getAvailableDrivers } from '../../drivers/services/driverService';
import { fetchAvailableVehicles } from '../../vehicles/services/vehicleService';
import { assignDriver, getAssignments } from '../services/jobOrderService';

const assignmentData = [
    {
        id: 1,
        assignmentType: 'driver_assignment',
        assignedTo: 'Budi Santoso',
        assignedById: 'USR-001',
        assignedBy: 'Sari Wulandari',
        assignedByRole: 'Dispatcher',
        assignedAt: '2024-01-15 14:20:00',
        status: 'active',
        vehicle: 'B 1234 ABC',
        notes: 'Ditugaskan manual oleh Admin.',
    },
    {
        id: 2,
        assignmentType: 'driver_assignment',
        assignedTo: 'Andi Pratama',
        assignedById: 'USR-001',
        assignedBy: 'Sari Wulandari',
        assignedByRole: 'Dispatcher',
        assignedAt: '2024-01-15 09:00:00',
        status: 'cancelled',
        vehicle: 'B 5678 DEF',
        notes: 'Driver sakit, digantikan.',
    },
];



const statusStyles = {
    pending: {
        label: 'Pending',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
    },
    active: {
        label: 'Active',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
    },
    standby: {
        label: 'Standby',
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
    },
    completed: {
        label: 'Completed',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
    },
};



const UserIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' />
        <circle cx='12' cy='7' r='4' />
    </svg>
);

const ClockIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <circle cx='12' cy='12' r='9' />
        <path d='M12 7v5l3 2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

const TruckIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M14 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2' />
        <path d='M15 18H9' />
        <path d='M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14' />
        <circle cx='17' cy='18' r='2' />
        <circle cx='7' cy='18' r='2' />
    </svg>
);

const CheckCircleIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <circle cx='12' cy='12' r='8' />
        <path d='m9 12 2 2 4-4' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

const PlusIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M12 5v14M5 12h14' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

function StatusBadge({ status }) {
    const style = statusStyles[status] ?? statusStyles.pending;
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${style.bg} ${style.text} ${style.border} border`}>
            {style.label}
        </span>
    );
}



function AssignmentItem({ assignment }) {
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return {
            time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            date: date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }),
        };
    };

    const { time, date } = formatTime(assignment.assignedAt);

    return (
        <div className='rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm'>
            <div className='flex items-start gap-4'>
                {/* Icon */}
                <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600'>
                    <TruckIcon className='h-6 w-6' />
                </div>

                {/* Content */}
                <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <h3 className='font-semibold text-slate-900'>Driver Assignment</h3>
                            <StatusBadge status={assignment.status} />
                        </div>
                    </div>

                    <div className='mt-2 space-y-1'>
                        <p className='text-base font-medium text-slate-800'>{assignment.assignedTo}</p>

                        {assignment.vehicle && (
                            <p className='text-sm text-slate-600'>
                                Vehicle: <span className='font-medium text-slate-900'>{assignment.vehicle}</span>
                            </p>
                        )}

                        <div className='flex items-center gap-2 text-sm text-slate-500'>
                            <ClockIcon className='h-4 w-4' />
                            <span>Assigned on: {date} • {time}</span>
                        </div>

                        {assignment.notes && (
                            <p className='mt-2 text-sm text-slate-500 italic'>
                                Note: {assignment.notes}
                            </p>
                        )}

                        <p className='text-xs text-slate-400 mt-1'>
                            By {assignment.assignedBy} ({assignment.assignedByRole})
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AssignmentFilter({ activeFilter, onFilterChange }) {
    const filters = [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
    ];

    return (
        <div className='flex gap-2'>
            {filters.map((filter) => (
                <button
                    key={filter.value}
                    onClick={() => onFilterChange(filter.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeFilter === filter.value
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
}

export default function JobOrderAssignment({ jobOrderId, status, goodsWeight = 0, orderType, manifestInfo, driverDisplay, vehicleDisplay, onAssignmentUpdate }) {
    // ✅ Check if this is an LTL order with no assignment (pending)
    const isLTLPending = orderType === 'LTL' && (!manifestInfo?.driver && (driverDisplay === '-' || driverDisplay === 'Menunggu Planning Manifest ⏳' || !driverDisplay));

    // ✅ If LTL and pending, show locked assignment message
    if (isLTLPending) {
        return (
            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                    {/* Info Icon */}
                    <div className='mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-6'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-8 w-8 text-indigo-500'>
                            <circle cx='12' cy='12' r='10' />
                            <path d='M12 16v-4' strokeLinecap='round' strokeLinejoin='round' />
                            <circle cx='12' cy='8' r='0.5' fill='currentColor' />
                        </svg>
                    </div>

                    {/* Title */}
                    <div className='flex items-center gap-2 mb-3'>
                        <span className='text-lg'>ℹ️</span>
                        <h3 className='text-xl font-semibold text-slate-900'>Assignment Terkunci</h3>
                    </div>

                    {/* Description */}
                    <p className='text-slate-600 max-w-md leading-relaxed mb-6'>
                        Order ini bertipe <span className='font-bold text-indigo-600'>LTL</span>.
                        Penugasan Driver dan Armada untuk tipe LTL dilakukan melalui modul Manifest / Packing List (konsolidasi), bukan secara langsung per order. Data driver & Armada akan muncul di sini setelah penugasan di modul Manifest.
                    </p>

                    {/* CTA Button */}
                    <a
                        href="/manifest"
                        className='inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
                    >
                        <span>📦</span>
                        Pergi ke Manifest
                    </a>
                </div>
            </section>
        );
    }

    // ✅ For LTL that is already assigned OR for FTL orders, show the normal Assignment History UI

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isReadOnly = status === 'cancelled';

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const response = await getAssignments(jobOrderId);
            // Transform API data to match component structure
            const transformedData = response.map(item => ({
                id: item.assignment_id,
                assignmentType: 'driver_assignment',
                assignedTo: item.driver?.driver_name || 'Unknown Driver',
                assignedById: item.assigned_by,
                assignedBy: item.assigned_by === 'SYSTEM' ? 'System' : 'Admin', // Placeholder until we have user data
                assignedByRole: item.assigned_by === 'SYSTEM' ? 'System' : 'Admin',
                assignedAt: item.assigned_at,
                status: item.status?.toLowerCase() || 'active',
                vehicle: item.vehicle?.license_plate || item.vehicle?.plate_no || 'Unknown Vehicle',
                notes: item.notes,
            }));
            setAssignments(transformedData);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (jobOrderId) {
            fetchAssignments();
        }
    }, [jobOrderId]);

    const filteredAssignments = assignments.filter(assignment => {
        if (filter === 'all') return true;
        return assignment.status === filter;
    });

    const fetchOptions = async () => {
        try {
            // Pass min_capacity to filter vehicles by capacity
            // Only vehicles that can carry the job order weight will be shown
            const vehicleParams = goodsWeight > 0 ? { min_capacity: goodsWeight } : {};

            const [driversData, vehiclesData] = await Promise.all([
                getAvailableDrivers(),
                fetchAvailableVehicles(vehicleParams)
            ]);
            setDrivers(driversData);
            setVehicles(vehiclesData);
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleAddAssignment = () => {
        if (isReadOnly) return;
        fetchOptions();
        setIsModalOpen(true);
    };

    const handleSubmitAssignment = async (formData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                status: 'Active' // Default status
            };
            await assignDriver(jobOrderId, payload);
            console.log('Assignment created successfully');
            // setIsModalOpen(false); // EditModal handles closing
            // Refresh list
            fetchAssignments();
            if (onAssignmentUpdate) {
                onAssignmentUpdate();
            }
        } catch (error) {
            console.error('Error creating assignment:', error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const assignmentFields = useMemo(() => [
        {
            name: 'driver_id',
            label: 'Driver',
            type: 'select',
            required: true,
            description: 'Pilih driver untuk ditugaskan. Kendaraan akan dipilih oleh driver melalui mobile app.',
            options: drivers.map(d => ({
                value: d.driver_id,
                label: `${d.driver_name}${d.assigned_vehicle?.plate_no ? ` (Kendaraan: ${d.assigned_vehicle.plate_no})` : ''}`
            }))
        },
        {
            name: 'notes',
            label: 'Catatan',
            type: 'textarea',
            required: false,
            placeholder: 'Catatan tambahan untuk assignment',
            rows: 3
        }
    ], [drivers]);

    const handleFieldChange = (name, value, setFormData) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <h2 className='text-lg font-semibold text-slate-900'>Assignment History</h2>
                <div className='mt-6 flex items-center justify-center py-8'>
                    <div className='h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600'></div>
                </div>
            </section>
        );
    }

    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                    <h2 className='text-lg font-semibold text-slate-900'>Assignment History</h2>
                    <p className='text-sm text-slate-500'>Team assignments untuk job order {jobOrderId}</p>
                </div>
                <div className='flex items-center gap-3'>
                    <AssignmentFilter activeFilter={filter} onFilterChange={setFilter} />
                    {orderType !== 'LTL' && (
                        <button
                            type='button'
                            onClick={handleAddAssignment}
                            disabled={isReadOnly}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${isReadOnly ? 'bg-slate-400 cursor-not-allowed opacity-75' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            title={isReadOnly ? "Tidak dapat menambah assignment pada order yang dibatalkan" : "Add Assignment"}
                        >
                            <PlusIcon className='h-3 w-3' />
                            Add Assignment
                        </button>
                    )}
                </div>
            </div>

            <div className='mt-6'>
                {filteredAssignments.length > 0 ? (
                    <div className='space-y-3'>
                        {filteredAssignments.map((assignment) => (
                            <AssignmentItem key={assignment.id} assignment={assignment} />
                        ))}
                    </div>
                ) : (
                    <div className='flex items-center justify-center py-8 text-center'>
                        <div>
                            <div className='mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center'>
                                <UserIcon className='h-6 w-6 text-slate-400' />
                            </div>
                            <p className='mt-3 text-sm font-medium text-slate-800'>No assignments found</p>
                            <p className='text-xs text-slate-500'>No assignments matching the current filter.</p>
                        </div>
                    </div>
                )}
            </div>

            <EditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitAssignment}
                title={`Assign Driver - ${jobOrderId}`}
                data={{}}
                fields={assignmentFields}
                isLoading={isSubmitting}
                onFieldChange={handleFieldChange}
            />
        </section >
    );
}