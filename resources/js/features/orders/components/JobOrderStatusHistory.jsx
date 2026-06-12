import React, { useState, useEffect, useMemo } from 'react';

const statusColors = {
    created: 'bg-slate-100 text-slate-600 border-slate-200',
    confirmed: 'bg-blue-100 text-blue-600 border-blue-200',
    assigned: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    pickup: 'bg-purple-100 text-purple-600 border-purple-200',
    'on delivery': 'bg-amber-100 text-amber-600 border-amber-200',
    delivered: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    completed: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
    'order updated': 'bg-slate-100 text-slate-600 border-slate-200',
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

const SystemIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <rect width='20' height='14' x='2' y='3' rx='2' />
        <line x1='8' x2='16' y1='21' y2='21' />
        <line x1='12' x2='12' y1='17' y2='21' />
    </svg>
);

const NoteIcon = ({ className = 'h-4 w-4' }) => (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
        <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
        <polyline points='14,2 14,8 20,8' />
        <line x1='16' x2='8' y1='13' y2='13' />
        <line x1='16' x2='8' y1='17' y2='17' />
        <polyline points='10,9 9,9 8,9' />
    </svg>
);

function StatusHistoryItem({ item, isLast }) {
    const formatTime = (timestamp) => {
        if (!timestamp) return { time: '-', date: '-' };
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

    const { time, date } = formatTime(item.timestamp);
    const statusColorClass = statusColors[item.status] || statusColors.created;

    return (
        <div className='relative flex gap-4'>
            {/* Timeline line */}
            {!isLast && (
                <div className='absolute left-6 top-12 h-full w-px bg-slate-200'></div>
            )}

            {/* Timeline dot */}
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-white ${statusColorClass}`}>
                {item.systemGenerated ? (
                    <SystemIcon className='h-5 w-5' />
                ) : (
                    <UserIcon className='h-5 w-5' />
                )}
            </div>

            {/* Content */}
            <div className='flex-1 pb-8'>
                <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                    <h3 className='font-semibold text-slate-800'>{item.statusLabel}</h3>
                    <div className='flex items-center gap-2 text-xs text-slate-500'>
                        <ClockIcon className='h-3 w-3' />
                        <span>{time} • {date}</span>
                    </div>
                </div>

                <p className='mt-1 text-sm text-slate-600'>{item.description}</p>

                <div className='mt-2 flex items-center gap-2 text-xs text-slate-500'>
                    {item.systemGenerated ? <SystemIcon className='h-3 w-3' /> : <UserIcon className='h-3 w-3' />}
                    <span>{item.actor}</span>
                    {item.actorRole && (
                        <>
                            <span>•</span>
                            <span>{item.actorRole}</span>
                        </>
                    )}
                </div>

                {item.notes && (
                    <div className='mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3'>
                        <NoteIcon className='mt-0.5 h-3 w-3 shrink-0 text-slate-400' />
                        <p className='text-xs text-slate-600'>{item.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusHistoryFilter({ activeFilter, onFilterChange }) {
    const filters = [
        { value: 'all', label: 'All Activities' },
        { value: 'user_actions', label: 'User Actions' },
        { value: 'system_generated', label: 'System Generated' },
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

export default function JobOrderStatusHistory({ jobOrderId, historyData = [] }) {
    const [statusHistory, setStatusHistory] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (historyData && historyData.length > 0) {
            const mappedData = historyData.map((item, index) => {
                const statusLower = item.status.toLowerCase();
                let description = item.notes || `Status updated to ${item.status}`;

                // Clean up "Vehicle -" if present (fix for legacy/bugged data)
                if (description && typeof description === 'string') {
                    description = description.replace(' - Vehicle -', '');
                }
                let notes = null;

                // Special handling for Cancelled status
                if (statusLower === 'cancelled') {
                    description = `Job Order cancelled by ${item.changed_by || 'System'}`;
                    notes = item.notes; // Display the reason in the note box
                } else {
                    // For other statuses, use the DB note as description
                    // and do not duplicate it in the notes box
                    notes = null;
                }

                return {
                    id: item.history_id || index,
                    status: statusLower,
                    statusLabel: item.status,
                    description: description,
                    timestamp: item.changed_at,
                    actor: item.changed_by || 'System',
                    actorRole: item.trigger_type === 'system' ? 'System' : 'User',
                    notes: notes,
                    systemGenerated: item.trigger_type === 'system',
                };
            }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

            setStatusHistory(mappedData);
        } else {
            setStatusHistory([]);
        }
    }, [historyData]);

    const filteredHistory = useMemo(() => {
        if (filter === 'all') return statusHistory;
        if (filter === 'user_actions') return statusHistory.filter(item => !item.systemGenerated);
        if (filter === 'system_generated') return statusHistory.filter(item => item.systemGenerated);
        return statusHistory;
    }, [statusHistory, filter]);

    return (
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                    <h2 className='text-lg font-semibold text-slate-900'>Status History</h2>
                    <p className='text-sm text-slate-500'>Timeline aktivitas job order {jobOrderId}</p>
                </div>
                <StatusHistoryFilter activeFilter={filter} onFilterChange={setFilter} />
            </div>

            <div className='mt-6'>
                {filteredHistory.length > 0 ? (
                    <div className='space-y-0'>
                        {filteredHistory.map((item, index) => (
                            <StatusHistoryItem
                                key={item.id}
                                item={item}
                                isLast={index === filteredHistory.length - 1}
                            />
                        ))}
                    </div>
                ) : (
                    <div className='flex items-center justify-center py-8 text-center'>
                        <div>
                            <div className='mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center'>
                                <ClockIcon className='h-6 w-6 text-slate-400' />
                            </div>
                            <p className='mt-3 text-sm font-medium text-slate-800'>No activities found</p>
                            <p className='text-xs text-slate-500'>No status history matching the current filter.</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}