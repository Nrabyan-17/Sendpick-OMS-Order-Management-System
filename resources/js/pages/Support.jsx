import React, { useState } from 'react';
import FilterDropdown from '../components/common/FilterDropdown';

const contactChannels = [
    {
        title: 'Live Chat',
        description: 'Get instant help from our support team',
        availability: 'Available 24/7',
        response: 'Response: Immediate',
        statusLabel: 'Online',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-6 w-6'>
                <path d='M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-6l-4 3v-3H6a2 2 0 0 1-2-2Z' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
    },
    {
        title: 'Phone Support',
        description: 'Speak directly with our technical experts',
        availability: 'Mon-Fri 8AM-6PM',
        response: 'Response: Immediate',
        statusLabel: 'Available',
        iconBg: 'bg-sky-500/10',
        iconColor: 'text-sky-500',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-6 w-6'>
                <path d='M6.5 3h2a1 1 0 0 1 1 .72c.23.92.65 2.19 1.3 3.5a1 1 0 0 1-.23 1.15L9.1 10.04c1.4 2.3 3.2 4.1 5.5 5.5l1.67-1.47a1 1 0 0 1 1.15-.23c1.3.65 2.58 1.07 3.5 1.3a1 1 0 0 1 .72 1v2a1 1 0 0 1-1.05 1 16 16 0 0 1-14.5-14.45A1 1 0 0 1 6.5 3z' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
    },
    {
        title: 'Email Support',
        description: 'Send detailed inquiries and get comprehensive answers',
        availability: 'Available 24/7',
        response: 'Response: < 2 hours',
        statusLabel: 'Online',
        iconBg: 'bg-indigo-500/10',
        iconColor: 'text-indigo-500',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-6 w-6'>
                <rect x='3' y='5' width='18' height='14' rx='2' />
                <path d='m4 7 8 6 8-6' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
    },
];

const ticketStatusStyles = {
    inProgress: {
        label: 'In Progress',
        bg: 'bg-sky-50',
        text: 'text-sky-600',
    },
    resolved: {
        label: 'Resolved',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
    },
    waiting: {
        label: 'Waiting for Response',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
    },
};

const recentTickets = [
    {
        id: 'TICK-001',
        title: 'GPS tracking not updating for Vehicle FLT-045',
        timeAgo: '2 hours ago',
        priority: 'High',
        status: 'inProgress',
    },
    {
        id: 'TICK-002',
        title: 'Unable to generate monthly delivery reports',
        timeAgo: '1 day ago',
        priority: 'Medium',
        status: 'resolved',
    },
    {
        id: 'TICK-003',
        title: 'Driver mobile app login issues',
        timeAgo: '3 days ago',
        priority: 'Low',
        status: 'waiting',
    },
];

const faqItems = [
    {
        question: 'How do I reset my password?',
        answer:
            'Go to Settings ? Users, select your user account, and click �Reset Password�. A temporary password will be sent to your email.',
        tag: 'Account',
    },
    {
        question: 'Why are some vehicles not showing on the map?',
        answer:
            'This usually happens when GPS devices are offline or drivers haven�t checked in. Check the Fleet Management section for device status.',
        tag: 'Tracking',
    },
    {
        question: 'How can I add new drivers to the system?',
        answer:
            'Navigate to Contacts ? Drivers and click �Add New Driver�. Fill in their details and assign appropriate permissions.',
        tag: 'User Management',
    },
    {
        question: 'Can I customize the dashboard widgets?',
        answer:
            'Yes, you can customize dashboard widgets through Settings ? Company. Drag and drop widgets to rearrange them.',
        tag: 'Dashboard',
    },
];

const supportChannels = [
    {
        title: 'Phone Support',
        description: '+62 21 1234 5678',
        details: 'Mon-Fri 8AM-6PM WIB',
        iconBg: 'bg-sky-500/10',
        iconColor: 'text-sky-600',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-6 w-6'>
                <path d='M6.5 3h2a1 1 0 0 1 1 .72c.23.92.65 2.19 1.3 3.5a1 1 0 0 1-.23 1.15L9.1 10.04c1.4 2.3 3.2 4.1 5.5 5.5l1.67-1.47a1 1 0 0 1 1.15-.23c1.3.65 2.58 1.07 3.5 1.3a1 1 0 0 1 .72 1v2a1 1 0 0 1-1.05 1 16 16 0 0 1-14.5-14.45A1 1 0 0 1 6.5 3z' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
    },
    {
        title: 'Email Support',
        description: 'support@sendpick.com',
        details: 'Response within 2 hours',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-6 w-6'>
                <rect x='3' y='5' width='18' height='14' rx='2' />
                <path d='m4 7 8 6 8-6' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
    },
    {
        title: 'Online Resources',
        description: 'help.sendpick.com',
        details: '24/7 self-service portal',
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-500',
        icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-6 w-6'>
                <circle cx='12' cy='12' r='9' />
                <path d='M3.6 9h16.8M3.6 15h16.8' strokeLinecap='round' />
                <path d='M12 3c-2.5 3-4 6.5-4 9s1.5 6 4 9c2.5-3 4-6.5 4-9s-1.5-6-4-9z' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
    },
];

function ContactCard({ channel }) {
    return (
        <article className='flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-start justify-between gap-4'>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${channel.iconBg} ${channel.iconColor}`}>
                    {channel.icon}
                </div>
                <span className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600'>
                    {channel.statusLabel}
                </span>
            </div>
            <div className='mt-4 space-y-1'>
                <h3 className='text-base font-semibold text-slate-800'>{channel.title}</h3>
                <p className='text-sm text-slate-500'>{channel.description}</p>
                <p className='text-xs text-slate-400'>{channel.availability}</p>
                <p className='text-xs text-slate-400'>{channel.response}</p>
            </div>
        </article>
    );
}

function TicketCard({ ticket }) {
    const statusStyle = ticketStatusStyles[ticket.status] ?? ticketStatusStyles.inProgress;
    return (
        <article className='flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div>
                <h4 className='text-sm font-semibold text-slate-800'>{ticket.title}</h4>
                <p className='mt-2 text-xs text-slate-400'>
                    {ticket.id} � {ticket.timeAgo}
                </p>
                <p className='mt-2 text-xs font-semibold text-slate-400'>Priority: {ticket.priority}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
            </span>
        </article>
    );
}

function FAQItem({ item }) {
    return (
        <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-start justify-between gap-4'>
                <div>
                    <h4 className='text-sm font-semibold text-slate-800'>{item.question}</h4>
                    <p className='mt-2 text-sm text-slate-500'>{item.answer}</p>
                </div>
                <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500'>
                    {item.tag}
                </span>
            </div>
        </article>
    );
}

function SupportChannel({ channel }) {
    return (
        <article className='rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm'>
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${channel.iconBg} ${channel.iconColor}`}>
                {channel.icon}
            </div>
            <h4 className='mt-4 text-sm font-semibold text-slate-800'>{channel.title}</h4>
            <p className='mt-2 text-sm text-slate-500'>{channel.description}</p>
            <p className='mt-1 text-xs text-slate-400'>{channel.details}</p>
        </article>
    );
}

export default function SupportContent() {
    // State for dropdown Priority
    const [priority, setPriority] = useState('low');

    return (
        <div className='flex flex-col gap-8'>
            <header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                
                <button
                    type='button'
                    className='inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500'
                >
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
                        <path d='M12 5v14M5 12h14' strokeLinecap='round' />
                    </svg>
                    Start Live Chat
                </button>
            </header>

            <section className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
                {contactChannels.map((channel) => (
                    <ContactCard key={channel.title} channel={channel} />
                ))}
            </section>

            <section className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <article className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <h3 className='text-sm font-semibold text-slate-700'>Submit a Support Request</h3>
                    <p className='mt-1 text-xs text-slate-400'>Provide details below so we can assist you faster.</p>
                    <form className='mt-4 grid grid-cols-1 gap-4'>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <label className='text-xs font-semibold text-slate-500'>
                                Name
                                <input
                                    type='text'
                                    placeholder='Your full name'
                                    className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                                />
                            </label>
                            <label className='text-xs font-semibold text-slate-500'>
                                Email
                                <input
                                    type='email'
                                    placeholder='your.email@company.com'
                                    className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                                />
                            </label>
                        </div>
                        <label className='text-xs font-semibold text-slate-500'>
                            Subject
                            <input
                                type='text'
                                placeholder='Brief description of your issue'
                                className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                            />
                        </label>
                        <label className='text-xs font-semibold text-slate-500'>
                            Priority
                            <div className='mt-2'>
                                <FilterDropdown
                                    value={priority}
                                    onChange={setPriority}
                                    options={[
                                        { value: 'low', label: 'Low - General question' },
                                        { value: 'medium', label: 'Medium - Needs follow up' },
                                        { value: 'high', label: 'High - Service interruption' },
                                    ]}
                                    widthClass='w-full'
                                />
                            </div>
                        </label>
                        <label className='text-xs font-semibold text-slate-500'>
                            Description
                            <textarea
                                rows={4}
                                placeholder='Please provide detailed information about your issue, including steps to reproduce if applicable...'
                                className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                            />
                        </label>
                        <button
                            type='button'
                            className='inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500'
                        >
                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
                                <path d='M5 12h14' strokeLinecap='round' />
                                <path d='M12 5v14' strokeLinecap='round' />
                            </svg>
                            Submit Request
                        </button>
                    </form>
                </article>

                <article className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                    <h3 className='text-sm font-semibold text-slate-700'>Recent Support Tickets</h3>
                    <p className='mt-1 text-xs text-slate-400'>Monitor the latest requests from your organization.</p>
                    <div className='mt-4 space-y-4'>
                        {recentTickets.map((ticket) => (
                            <TicketCard key={ticket.id} ticket={ticket} />
                        ))}
                    </div>
                </article>
            </section>

            <section className='space-y-4'>
                <h3 className='text-sm font-semibold text-slate-700'>Frequently Asked Questions</h3>
                <div className='grid grid-cols-1 gap-4'>
                    {faqItems.map((item) => (
                        <FAQItem key={item.question} item={item} />
                    ))}
                </div>
            </section>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                {supportChannels.map((channel) => (
                    <SupportChannel key={channel.title} channel={channel} />
                ))}
            </section>
        </div>
    );
}
