import React, { useState, useMemo } from 'react';

const statusStyles = {
    pending: {
        label: 'Pending',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        dot: 'bg-amber-400',
    },
    active: {
        label: 'In Transit',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        dot: 'bg-blue-400',
    },
    assigned: {
        label: 'Assigned',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        dot: 'bg-indigo-400',
    },
    completed: {
        label: 'Delivered',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        dot: 'bg-emerald-400',
    },
    overdue: {
        label: 'Overdue',
        bg: 'bg-red-50',
        text: 'text-red-600',
        dot: 'bg-red-400',
    },
};

// Helper: Map API status to widget status
function mapApiStatusToWidget(apiStatus) {
    const status = (apiStatus || '').toLowerCase();
    if (status === 'in transit' || status === 'on delivery') return 'active';
    if (status === 'assigned' || status === 'pickup') return 'assigned';
    if (status === 'delivered' || status === 'completed') return 'completed';
    if (status === 'pending') return 'pending';
    return 'pending';
}

const priorityStyles = {
    low: 'border-l-slate-300',
    medium: 'border-l-amber-400',
    high: 'border-l-red-400',
    urgent: 'border-l-red-600',
};

const assignmentTypeLabels = {
    driver_assignment: 'Driver',
    quality_check: 'QC',
    loading_supervisor: 'Loading',
    delivery_coordinator: 'Delivery',
};

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

const ClockIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <circle cx='12' cy='12' r='9' />
        <path d='M12 7v5l3 2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

const ArrowRightIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M5 12h14M12 5l7 7-7 7' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

function StatusBadge({ status, size = 'sm' }) {
    const style = statusStyles[status] ?? statusStyles.pending;
    const sizeClass = size === 'xs' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs';

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${style.bg} ${style.text} ${sizeClass}`}>
            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${style.dot}`}></span>
            {style.label}
        </span>
    );
}

function AssignmentTypeIcon({ type, className = 'h-4 w-4' }) {
    switch (type) {
        case 'driver_assignment':
            return <UserIcon className={className} />;
        case 'quality_check':
            return <CheckCircleIcon className={className} />;
        case 'loading_supervisor':
            return <UserIcon className={className} />;
        default:
            return <UserIcon className={className} />;
    }
}

function AssignmentItem({ assignment }) {
    // FTL/LTL badge styles
    const orderTypeBadge = {
        FTL: 'bg-purple-100 text-purple-600',
        LTL: 'bg-orange-100 text-orange-600',
    };

    return (
        <div className={`flex items-center justify-between rounded-2xl border-l-4 bg-white p-4 shadow-sm transition hover:shadow-md ${priorityStyles[assignment.priority]}`}>
            <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600'>
                    <UserIcon className='h-5 w-5' />
                </div>
                <div className='space-y-0.5'>
                    {/* Row 1: Driver Name + Vehicle Plate */}
                    <div className='flex items-center gap-2'>
                        <p className='font-semibold text-slate-800'>{assignment.assignedTo}</p>
                        {assignment.vehiclePlate && assignment.vehiclePlate !== 'N/A' && (
                            <>
                                <span className='text-xs text-slate-300'>•</span>
                                <span className='text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded'>
                                    {assignment.vehiclePlate}
                                </span>
                            </>
                        )}
                    </div>
                    {/* Row 2: Route (Origin → Destination) */}
                    <p className='text-xs text-slate-500'>{assignment.route}</p>
                    {/* Row 3: Order Type Badge + Customer / LTL Info */}
                    <div className='flex items-center gap-2'>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${orderTypeBadge[assignment.orderType] || orderTypeBadge.FTL}`}>
                            {assignment.orderType || 'FTL'}
                        </span>
                        <p className='text-sm text-slate-600'>{assignment.customer}</p>
                    </div>
                </div>
            </div>
            <div className='flex flex-col items-end gap-1'>
                <StatusBadge status={assignment.status} size='xs' />
                <div className='flex items-center gap-1 text-xs text-slate-400'>
                    <ClockIcon className='h-3 w-3' />
                    <span>{assignment.startTime}</span>
                </div>
            </div>
        </div>
    );
}

function AssignmentMetrics({ metrics }) {
    return (
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            <div className='text-center'>
                <p className='text-2xl font-bold text-slate-900'>{metrics.totalToday}</p>
                <p className='text-xs text-slate-500'>Total Today</p>
            </div>
            <div className='text-center'>
                <p className='text-2xl font-bold text-blue-600'>{metrics.active}</p>
                <p className='text-xs text-slate-500'>Assigned</p>
            </div>
            <div className='text-center'>
                <p className='text-2xl font-bold text-emerald-600'>{metrics.completed}</p>
                <p className='text-xs text-slate-500'>Completed</p>
            </div>
            <div className='text-center'>
                <p className='text-2xl font-bold text-amber-600'>{metrics.pending}</p>
                <p className='text-xs text-slate-500'>In Transit</p>
            </div>
        </div>
    );
}

export default function AssignmentWidget({
    itemsPerPage = 4,
    showMetrics = true,
    assignments = [], // Data dari API
    loading = false   // Loading state dari parent
}) {
    const [currentPage, setCurrentPage] = useState(1);

    // Compute metrics from assignments data
    const metrics = useMemo(() => {
        const statusCounts = {
            totalToday: assignments.length,
            active: 0,
            completed: 0,
            pending: 0,
            overdue: 0,
        };

        assignments.forEach(a => {
            const status = (a.status || '').toLowerCase();
            if (status === 'in transit' || status === 'assigned' || status === 'active') {
                statusCounts.active++;
            } else if (status === 'delivered' || status === 'completed') {
                statusCounts.completed++;
            } else if (status === 'pending') {
                statusCounts.pending++;
            }
        });

        return statusCounts;
    }, [assignments]);

    // Transform API data to widget format
    const todayAssignments = useMemo(() => {
        return assignments.map(a => ({
            id: a.job_order_id || a.do_id,
            type: 'driver_assignment',
            orderType: a.order_type || 'FTL',
            assignedTo: a.driver_name || 'Unassigned',
            jobOrder: a.job_order_id || a.do_id,
            customer: a.customer_name || 'N/A',
            route: `${a.pickup_city || '?'} → ${a.delivery_city || '?'}`,
            startTime: a.assigned_at
                ? new Date(a.assigned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : (a.created_at ? new Date(a.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'),
            status: mapApiStatusToWidget(a.status),
            priority: 'medium',
            vehiclePlate: a.vehicle_plate || 'N/A',
            goodsSummary: a.goods_summary || 'N/A',
        }));
    }, [assignments]);

    // Pagination calculations
    const totalItems = todayAssignments.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayAssignments = todayAssignments.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    // Chevron Icons for pagination
    const ChevronLeftIcon = ({ className = 'h-4 w-4' }) => (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className={className}>
            <path d='M15 19l-7-7 7-7' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );

    const ChevronRightIcon = ({ className = 'h-4 w-4' }) => (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className={className}>
            <path d='M9 5l7 7-7 7' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );

    if (loading) {
        return (
            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='animate-pulse space-y-6'>
                    <div className='flex items-center justify-between'>
                        <div className='space-y-2'>
                            <div className='h-5 w-40 rounded bg-slate-200'></div>
                            <div className='h-4 w-32 rounded bg-slate-200'></div>
                        </div>
                        <div className='h-8 w-20 rounded bg-slate-200'></div>
                    </div>
                    <div className='grid grid-cols-4 gap-4'>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className='space-y-2'>
                                <div className='h-4 w-12 rounded bg-slate-200'></div>
                                <div className='h-6 w-8 rounded bg-slate-200'></div>
                            </div>
                        ))}
                    </div>
                    <div className='space-y-3'>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className='flex items-center gap-3 rounded-2xl border border-slate-100 p-4'>
                                <div className='h-10 w-10 rounded-lg bg-slate-200'></div>
                                <div className='flex-1 space-y-2'>
                                    <div className='h-4 w-24 rounded bg-slate-200'></div>
                                    <div className='h-3 w-32 rounded bg-slate-200'></div>
                                </div>
                                <div className='h-6 w-16 rounded bg-slate-200'></div>
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
                <div>
                    <h2 className='text-lg font-semibold text-slate-900'>Active Assignments</h2>
                    <p className='text-sm text-slate-500'>Ongoing task assignments (not yet completed)</p>
                </div>
                <a
                    href='/orders'
                    className='inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
                >
                    View All
                    <ArrowRightIcon className='h-3 w-3' />
                </a>
            </div>

            {showMetrics && (
                <div className='mt-6'>
                    <AssignmentMetrics metrics={metrics} />
                </div>
            )}

            <div className='mt-6 space-y-3'>
                {displayAssignments.length > 0 ? (
                    displayAssignments.map((assignment) => (
                        <AssignmentItem key={assignment.id} assignment={assignment} />
                    ))
                ) : (
                    <div className='flex items-center justify-center py-8 text-center'>
                        <div>
                            <div className='mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center'>
                                <UserIcon className='h-6 w-6 text-slate-400' />
                            </div>
                            <p className='mt-3 text-sm font-medium text-slate-800'>No active assignments</p>
                            <p className='text-xs text-slate-500'>All assignments have been completed.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
                <div className='mt-6 flex items-center justify-between border-t border-slate-100 pt-4'>
                    <p className='text-xs text-slate-400'>
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} assignment
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
                            <ChevronLeftIcon className='h-4 w-4' />
                        </button>
                        <span className='px-3 py-1 text-xs font-medium text-slate-600'>
                            {currentPage} / {totalPages || 1}
                        </span>
                        <button
                            type='button'
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${currentPage === totalPages || totalPages === 0
                                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                        >
                            <ChevronRightIcon className='h-4 w-4' />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}