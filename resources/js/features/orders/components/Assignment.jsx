import React, { useMemo, useState } from 'react';
import FilterDropdown from '../../../components/common/FilterDropdown';

const summaryCards = [
    {
        title: 'Total Assignments',
        value: '124',
        description: 'All active assignments',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
                <path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' />
                <circle cx='12' cy='7' r='4' />
            </svg>
        ),
    },
    {
        title: 'Active Drivers',
        value: '18',
        description: 'Currently on duty',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
                <path d='M14 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2' />
                <path d='M15 18H9' />
                <path d='M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14' />
                <circle cx='17' cy='18' r='2' />
                <circle cx='7' cy='18' r='2' />
            </svg>
        ),
    },
    {
        title: 'Pending Assignments',
        value: '12',
        description: 'Awaiting confirmation',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
                <circle cx='12' cy='12' r='8' />
                <path d='M12 8v4l2.5 1.5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
    },
    {
        title: 'Completed Today',
        value: '34',
        description: 'Successfully finished',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
                <circle cx='12' cy='12' r='8' />
                <path d='m9 12 2 2 4-4' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
    },
];

const statusStyles = {
    pending: {
        label: 'Pending',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
    active: {
        label: 'Active',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
    },
    standby: {
        label: 'Standby',
        bg: 'bg-purple-50',
        text: 'text-purple-600',
    },
    completed: {
        label: 'Completed',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-red-50',
        text: 'text-red-600',
    },
};

const priorityStyles = {
    low: {
        label: 'Low',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
    },
    medium: {
        label: 'Medium',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
    high: {
        label: 'High',
        bg: 'bg-red-50',
        text: 'text-red-600',
    },
    urgent: {
        label: 'Urgent',
        bg: 'bg-red-100',
        text: 'text-red-700',
    },
};

const statusFilterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'standby', label: 'Standby' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const typeFilterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'driver_assignment', label: 'Driver Assignment' },
    { value: 'quality_check', label: 'Quality Check' },
    { value: 'loading_supervisor', label: 'Loading Supervisor' },
    { value: 'delivery_coordinator', label: 'Delivery Coordinator' },
];

const assignmentRecords = [
    {
        id: 'ASG-2024-001',
        jobOrderId: 'JO-2024-874',
        assignmentType: 'driver_assignment',
        assignedTo: 'Budi Santoso',
        assignedBy: 'Sari Wulandari',
        customer: 'PT Maju Jaya Logistics',
        route: 'Jakarta DC → Surabaya Hub',
        vehicle: 'B 1234 ABC',
        assignedAt: '2024-01-15 14:20:00',
        scheduledStart: '2024-01-16 08:00:00',
        estimatedCompletion: '2024-01-16 16:00:00',
        status: 'active',
        priority: 'high',
        notes: 'Urgent delivery - customer premium service',
    },
    {
        id: 'ASG-2024-002',
        jobOrderId: 'JO-2024-875',
        assignmentType: 'quality_check',
        assignedTo: 'Maya Sari',
        assignedBy: 'Ahmad Rizki',
        customer: 'CV Sukses Mandiri',
        route: 'Bandung Hub → Makassar Hub',
        vehicle: null,
        assignedAt: '2024-01-15 13:15:00',
        scheduledStart: '2024-01-15 13:30:00',
        estimatedCompletion: '2024-01-15 14:00:00',
        status: 'completed',
        priority: 'medium',
        notes: 'Quality check for fragile electronics',
        completedAt: '2024-01-15 13:45:00',
    },
    {
        id: 'ASG-2024-003',
        jobOrderId: 'JO-2024-876',
        assignmentType: 'loading_supervisor',
        assignedTo: 'Roni Setiawan',
        assignedBy: 'Ahmad Rizki',
        customer: 'PT Nusantara Sejahtera',
        route: 'Jakarta DC → Medan Hub',
        vehicle: 'B 5678 DEF',
        assignedAt: '2024-01-16 07:30:00',
        scheduledStart: '2024-01-16 08:00:00',
        estimatedCompletion: '2024-01-16 08:45:00',
        status: 'pending',
        priority: 'high',
        notes: 'Heavy cargo loading supervision required',
    },
    {
        id: 'ASG-2024-004',
        jobOrderId: 'JO-2024-877',
        assignmentType: 'driver_assignment',
        assignedTo: 'Andi Pratama',
        assignedBy: 'Sari Wulandari',
        customer: 'UD Sumber Berkah',
        route: 'Surabaya Hub → Denpasar Hub',
        vehicle: 'L 9999 ABC',
        assignedAt: '2024-01-15 16:45:00',
        scheduledStart: '2024-01-16 06:00:00',
        estimatedCompletion: '2024-01-16 14:00:00',
        status: 'standby',
        priority: 'medium',
        notes: 'Backup assignment - waiting for confirmation',
    },
];

const assignmentTypeLabels = {
    driver_assignment: 'Driver Assignment',
    quality_check: 'Quality Check',
    loading_supervisor: 'Loading Supervisor',
    delivery_coordinator: 'Delivery Coordinator',
};

const SearchIcon = ({ className = 'h-5 w-5' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <circle cx='11' cy='11' r='6' />
        <path d='m20 20-3.5-3.5' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

const PlusIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M12 5v14M5 12h14' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

const DownloadIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M12 4v10' strokeLinecap='round' />
        <path d='m8 10 4 4 4-4' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M5 18h14' strokeLinecap='round' />
    </svg>
);

const UserIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' />
        <circle cx='12' cy='7' r='4' />
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

function StatusBadge({ status }) {
    const style = statusStyles[status] ?? statusStyles.pending;
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
}

function PriorityBadge({ priority }) {
    const style = priorityStyles[priority] ?? priorityStyles.medium;
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
}

function AssignmentTypeIcon({ type, className = 'h-4 w-4' }) {
    switch (type) {
        case 'driver_assignment':
            return <TruckIcon className={className} />;
        case 'quality_check':
            return <CheckCircleIcon className={className} />;
        default:
            return <UserIcon className={className} />;
    }
}

function AssignmentRow({ assignment }) {
    const formatDateTime = (timestamp) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const assigned = formatDateTime(assignment.assignedAt);
    const scheduled = formatDateTime(assignment.scheduledStart);

    return (
        <tr className='transition-colors hover:bg-slate-50'>
            <td className='whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-800 sm:px-6'>
                <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600'>
                        <AssignmentTypeIcon type={assignment.assignmentType} className='h-4 w-4' />
                    </div>
                    <div className='flex flex-col'>
                        <span className='text-sm font-semibold'>{assignment.id}</span>
                        <span className='text-xs text-slate-400 sm:hidden'>Job: {assignment.jobOrderId}</span>
                    </div>
                </div>
            </td>
            <td className='px-4 py-4 text-sm text-slate-600 sm:px-6'>
                <div className='space-y-1'>
                    <p className='font-medium text-slate-700'>{assignmentTypeLabels[assignment.assignmentType]}</p>
                    <p className='text-xs text-slate-400 hidden sm:block'>Job: {assignment.jobOrderId}</p>
                </div>
            </td>
            <td className='px-4 py-4 text-sm text-slate-600 sm:px-6'>
                <div className='space-y-1'>
                    <p className='font-medium text-slate-700'>{assignment.assignedTo}</p>
                    <p className='text-xs text-slate-400'>by {assignment.assignedBy}</p>
                </div>
            </td>
            <td className='px-4 py-4 text-sm text-slate-600 sm:px-6 hidden lg:table-cell'>
                <div className='space-y-1'>
                    <p className='font-medium text-slate-700'>{assignment.customer}</p>
                    <p className='text-xs text-slate-400'>{assignment.route}</p>
                </div>
            </td>
            <td className='px-4 py-4 text-sm text-slate-600 sm:px-6 hidden md:table-cell'>
                {assignment.vehicle && (
                    <span className='inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700'>
                        {assignment.vehicle}
                    </span>
                )}
            </td>
            <td className='px-4 py-4 sm:px-6'>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2'>
                    <StatusBadge status={assignment.status} />
                    <PriorityBadge priority={assignment.priority} />
                </div>
            </td>
            <td className='px-4 py-4 text-sm text-slate-600 sm:px-6 hidden sm:table-cell'>
                <div className='space-y-1'>
                    <p>{scheduled.date}</p>
                    <p className='text-xs text-slate-400'>{scheduled.time}</p>
                </div>
            </td>
            <td className='px-4 py-4 text-right text-xs text-slate-400 sm:px-6 hidden xl:table-cell'>
                <div className='space-y-1'>
                    <p>Assigned: {assigned.date}</p>
                    <p>{assigned.time}</p>
                </div>
            </td>
        </tr>
    );
}

function AssignmentTable({
    records,
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    typeFilter,
    onTypeChange,
}) {
    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex flex-col gap-4'>
                {/* Title Section */}
                <div className='flex flex-col gap-1'>
                    <h2 className='text-lg font-semibold text-slate-900'>Assignment Management</h2>
                    <p className='text-sm text-slate-400'>Manage staff assignments and task allocation</p>
                </div>
                
                {/* Controls Section */}
                <div className='flex flex-col gap-3'>
                    {/* Search Bar */}
                    <div className='w-full'>
                        <div className='group relative'>
                            <span className='pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400'>
                                <SearchIcon className='h-5 w-5' />
                            </span>
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder='Search assignments, staff, or job orders...'
                                className='w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                            />
                        </div>
                    </div>
                    
                    {/* Filters and Actions */}
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                        {/* Filters */}
                        <div className='flex flex-col gap-2 sm:flex-row sm:gap-3'>
                            <FilterDropdown
                                value={statusFilter}
                                onChange={onStatusChange}
                                options={statusFilterOptions}
                                widthClass='w-full sm:w-40'
                            />
                            <FilterDropdown
                                value={typeFilter}
                                onChange={onTypeChange}
                                options={typeFilterOptions}
                                widthClass='w-full sm:w-48'
                            />
                        </div>
                        
                        {/* Action Buttons */}
                        <div className='flex flex-col gap-2 sm:flex-row sm:gap-3'>
                            <button
                                type='button'
                                className='inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
                            >
                                <PlusIcon className='h-4 w-4' />
                                New Assignment
                            </button>
                            <button
                                type='button'
                                className='inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
                            >
                                <DownloadIcon className='h-4 w-4' />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className='mt-6 overflow-x-auto rounded-2xl border border-slate-200'>
                <table className='w-full min-w-[1000px] border-collapse'>
                    <thead className='bg-slate-50'>
                        <tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                            <th className='px-4 py-3 sm:px-6'>Assignment ID</th>
                            <th className='px-4 py-3 sm:px-6'>Type</th>
                            <th className='px-4 py-3 sm:px-6'>Assigned To</th>
                            <th className='px-4 py-3 sm:px-6 hidden lg:table-cell'>Customer & Route</th>
                            <th className='px-4 py-3 sm:px-6 hidden md:table-cell'>Vehicle</th>
                            <th className='px-4 py-3 sm:px-6'>Status</th>
                            <th className='px-4 py-3 sm:px-6 hidden sm:table-cell'>Scheduled</th>
                            <th className='px-4 py-3 sm:px-6 text-right hidden xl:table-cell'>Created</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {records.length > 0 ? (
                            records.map((assignment) => <AssignmentRow key={assignment.id} assignment={assignment} />)
                        ) : (
                            <tr>
                                <td colSpan={8} className='px-4 py-12 text-center text-sm text-slate-400 sm:px-6'>
                                    No assignments found matching the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function Assignment() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const filteredRecords = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return assignmentRecords.filter((assignment) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                assignment.id.toLowerCase().includes(normalizedSearch) ||
                assignment.assignedTo.toLowerCase().includes(normalizedSearch) ||
                assignment.jobOrderId.toLowerCase().includes(normalizedSearch) ||
                assignment.customer.toLowerCase().includes(normalizedSearch);

            const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
            const matchesType = typeFilter === 'all' || assignment.assignmentType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [searchTerm, statusFilter, typeFilter]);

    return (
        <div className='space-y-6'>
            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
                {summaryCards.map((card) => (
                    <SummaryCard key={card.title} card={card} />
                ))}
            </section>
            
            <AssignmentTable
                records={filteredRecords}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
            />
        </div>
    );
}