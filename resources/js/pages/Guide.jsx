import React from 'react';

function SearchIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <circle cx='11' cy='11' r='6' />
            <path d='m20 20-3.5-3.5' strokeLinecap='round' />
        </svg>
    );
}

function DownloadIcon({ className = 'h-4 w-4' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M12 4v10' strokeLinecap='round' />
            <path d='m8 10 4 4 4-4' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M5 18h14' strokeLinecap='round' />
        </svg>
    );
}

function QuickHelpIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M12 3c4.42 0 8 3 8 6.72 0 2-1.18 3.82-3.06 5.02l.19 3.26a1 1 0 0 1-1.5.9L12 17.72l-3.63 1.18a1 1 0 0 1-1.5-.9l.19-3.26C5.18 13.54 4 11.72 4 9.72 4 6 7.58 3 12 3z' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function LightningIcon({ className = 'h-4 w-4' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='m13 2-8 12h6l-2 8 8-12h-6z' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function ClockIcon({ className = 'h-4 w-4' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <circle cx='12' cy='12' r='8' />
            <path d='M12 8v4l3 2' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function ExternalLinkIcon({ className = 'h-4 w-4' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M14 3h7v7' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M10 14 21 3' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M21 14v7h-7' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M3 10v11h11' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function ArrowRightIcon({ className = 'h-4 w-4' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M5 12h14' strokeLinecap='round' />
            <path d='m13 6 6 6-6 6' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function CompassIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <circle cx='12' cy='12' r='9' />
            <path d='m14.5 9.5-2 5-5 2 2-5z' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function ClipboardIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <rect x='5' y='4' width='14' height='16' rx='2' />
            <path d='M9 4V3h6v1' strokeLinecap='round' />
            <path d='M9 10h6M9 14h6' strokeLinecap='round' />
        </svg>
    );
}

function RadarIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <circle cx='12' cy='12' r='9' />
            <path d='M12 12 5 5' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M12 12h7' strokeLinecap='round' />
            <path d='m12 12 4 6' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function SparklesIcon({ className = 'h-4 w-4' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M12 3v4' strokeLinecap='round' />
            <path d='M12 17v4' strokeLinecap='round' />
            <path d='M3 12h4' strokeLinecap='round' />
            <path d='M17 12h4' strokeLinecap='round' />
            <path d='m16 8-2 4 2 4 2-4z' strokeLinecap='round' strokeLinejoin='round' />
            <path d='m8 8-2 4 2 4 2-4z' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function LayersIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='m12 4 9 5-9 5-9-5z' strokeLinecap='round' strokeLinejoin='round' />
            <path d='m3 13 9 5 9-5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function HeadsetIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M4 14v-2a8 8 0 1 1 16 0v2' strokeLinecap='round' />
            <path d='M4 14v2a3 3 0 0 0 3 3h1' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M20 14v2a3 3 0 0 1-3 3h-1' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M9 19v1a3 3 0 0 0 3 3' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function DocumentIcon({ className = 'h-4 w-4' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M8 3h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M14 3v5h5' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M9 13h6M9 17h4' strokeLinecap='round' />
        </svg>
    );
}

function SteeringWheelIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <circle cx='12' cy='12' r='8' />
            <circle cx='12' cy='12' r='2' />
            <path d='M12 4v4' strokeLinecap='round' />
            <path d='M12 16v4' strokeLinecap='round' />
            <path d='m6.5 9.5 3.5 2.3' strokeLinecap='round' strokeLinejoin='round' />
            <path d='m17.5 9.5-3.5 2.3' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function ChartIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M4 19h16' strokeLinecap='round' />
            <path d='M7 16V8' strokeLinecap='round' />
            <path d='M12 16V6' strokeLinecap='round' />
            <path d='M17 16v-4' strokeLinecap='round' />
        </svg>
    );
}

function PlayIcon({ className = 'h-6 w-6' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='m9 7 8 5-8 5V7z' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function EyeIcon({ className = 'h-4 w-4' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z' strokeLinecap='round' strokeLinejoin='round' />
            <circle cx='12' cy='12' r='2.5' />
        </svg>
    );
}

function DownloadCloudIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M7 17a4 4 0 0 1 .7-7.94A5 5 0 0 1 19 9a4 4 0 0 1 0 8' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M12 12v7' strokeLinecap='round' />
            <path d='m9 16 3 3 3-3' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function ChatBubbleIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='M21 12a7 7 0 0 1-7 7H9l-4 2v-4a7 7 0 1 1 12-5z' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M8 12h.01M12 12h.01M16 12h.01' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

function CodeIcon({ className = 'h-5 w-5' }) {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className={className}>
            <path d='m8 8-4 4 4 4' strokeLinecap='round' strokeLinejoin='round' />
            <path d='m16 8 4 4-4 4' strokeLinecap='round' strokeLinejoin='round' />
            <path d='m11 20 2-16' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

const quickHelpTopics = [
    {
        question: 'How do I create a new order?',
        answer: 'Navigate to Orders -> Job Order and click "Add New Order". Fill in customer details and delivery information.',
        tag: 'Orders',
    },
    {
        question: 'Why is my vehicle not showing on the tracking map?',
        answer: 'Ensure the vehicle has an active GPS device and the driver has checked in for their shift.',
        tag: 'Tracking',
    },
    {
        question: 'How can I export monthly reports?',
        answer: 'Go to Reports & Analytics, select your date range, and click "Export PDF" or "Export Excel".',
        tag: 'Reports',
    },
];

const guideCollections = [
    {
        key: 'fleet-drivers',
        title: 'Fleet & Drivers',
        description: 'Operational SOPs untuk armada dan driver Anda.',
        icon: SteeringWheelIcon,
        iconBg: 'bg-sky-50',
        iconColor: 'text-sky-600',
        articles: [
            { title: 'Vehicle Registration', readTime: '8 min read' },
            { title: 'Driver Assignment', readTime: '6 min read', isPopular: true },
            { title: 'Real-time Tracking Setup', readTime: '15 min read', isPopular: true },
            { title: 'Maintenance Scheduling', readTime: '10 min read' },
        ],
    },
    {
        key: 'reports-analytics',
        title: 'Reports & Analytics',
        description: 'Analisis KPI, ekspor data, dan pembuatan laporan kustom.',
        icon: ChartIcon,
        iconBg: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        articles: [
            { title: 'Understanding KPIs', readTime: '12 min read', isPopular: true },
            { title: 'Custom Report Creation', readTime: '18 min read' },
            { title: 'Data Export Options', readTime: '7 min read', isPopular: true },
            { title: 'Performance Analysis', readTime: '20 min read' },
        ],
    },
];



const resourceShortcuts = [
    {
        key: 'download-resources',
        title: 'Download Resources',
        description: 'Dapatkan PDF guide, template, dan checklist operasional.',
        icon: DownloadCloudIcon,
        iconBg: 'bg-sky-50',
        iconColor: 'text-sky-600',
        cta: 'Download sekarang',
    },
    {
        key: 'live-chat',
        title: 'Live Chat Support',
        description: 'Terhubung langsung dengan tim support kami kapan saja.',
        icon: ChatBubbleIcon,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        cta: 'Mulai chat',
    },
    {
        key: 'api-docs',
        title: 'API Documentation',
        description: 'Dokumentasi teknis lengkap untuk integrasi developer.',
        icon: CodeIcon,
        iconBg: 'bg-violet-50',
        iconColor: 'text-violet-600',
        cta: 'Buka dokumentasi',
    },
];

const tagThemes = {
    Orders: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-200' },
    Tracking: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200' },
    Reports: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200' },
};

function QuickHelpItem({ topic }) {
    const theme = tagThemes[topic.tag] ?? { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' };

    return (
        <article className='flex items-start justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 transition hover:border-indigo-200 hover:bg-white'>
            <div className='max-w-2xl pr-4'>
                <p className='text-sm font-semibold text-slate-800'>{topic.question}</p>
                <p className='mt-2 text-xs text-slate-400'>{topic.answer}</p>
            </div>
            <span
                className={`ml-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${theme.bg} ${theme.text} ${theme.ring}`}
            >
                {topic.tag}
            </span>
        </article>
    );
}

function GuideArticleRow({ article }) {
    return (
        <article className='flex items-start justify-between rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-indigo-200 hover:bg-white'>
            <div className='flex items-start gap-3 pr-4'>
                <div className='mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-inset ring-slate-200'>
                    <DocumentIcon className='h-4 w-4' />
                </div>
                <div>
                    <p className='text-sm font-semibold text-slate-800'>{article.title}</p>
                    <div className='mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400'>
                        <span className='inline-flex items-center gap-1'>
                            <ClockIcon className='h-4 w-4 text-slate-300' />
                            {article.readTime}
                        </span>
                        {article.isPopular ? (
                            <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-600 ring-1 ring-inset ring-amber-200'>
                                <SparklesIcon className='h-3.5 w-3.5 text-amber-500' />
                                Popular
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
            <button
                type='button'
                className='rounded-xl border border-transparent p-2 text-slate-300 transition hover:border-slate-200 hover:text-indigo-600'
            >
                <ExternalLinkIcon className='h-4 w-4' />
                <span className='sr-only'>Open {article.title}</span>
            </button>
        </article>
    );
}

function GuideCollectionCard({ section }) {
    const Icon = section.icon;

    return (
        <section className='flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-start gap-3'>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${section.iconBg} ${section.iconColor}`}>
                    <Icon className='h-5 w-5' />
                </div>
                <div>
                    <h3 className='text-base font-semibold text-slate-800'>{section.title}</h3>
                    <p className='text-xs text-slate-400'>{section.description}</p>
                </div>
            </div>
            <div className='mt-5 space-y-3'>
                {section.articles.map((article) => (
                    <GuideArticleRow key={article.title} article={article} />
                ))}
            </div>
        </section>
    );
}



function ResourceCard({ resource }) {
    const Icon = resource.icon;

    return (
        <article className='flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md'>
            <div className='flex items-start gap-4'>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${resource.iconBg} ${resource.iconColor}`}>
                    <Icon className='h-5 w-5' />
                </div>
                <div>
                    <h3 className='text-sm font-semibold text-slate-800'>{resource.title}</h3>
                    <p className='mt-2 text-xs text-slate-400'>{resource.description}</p>
                </div>
            </div>
            <button
                type='button'
                className='mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500'
            >
                {resource.cta}
                <ArrowRightIcon className='h-4 w-4' />
            </button>
        </article>
    );
}

export default function GuideContent() {
    return (
        <div className='flex flex-col gap-8'>
            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <p className='text-sm text-slate-500'>Comprehensive documentation and tutorials for the OMS platform.</p>
                    <button
                        type='button'
                        className='inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500'
                    >
                        <DownloadIcon className='h-4 w-4' />
                        Download PDF Guide
                    </button>
                </div>
                <div className='relative mt-5'>
                    <SearchIcon className='pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
                    <input
                        type='search'
                        placeholder='Search documentation, tutorials, or FAQs...'
                        className='w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-600 transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100'
                    />
                </div>
            </section>

            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600'>
                            <QuickHelpIcon className='h-5 w-5' />
                        </div>
                        <div>
                            <h2 className='text-base font-semibold text-slate-800'>Quick Help</h2>
                            <p className='text-xs text-slate-400'>Instant answers for the most common operational questions.</p>
                        </div>
                    </div>
                    <span className='inline-flex items-center gap-2 text-xs font-semibold text-slate-400'>
                        <LightningIcon className='h-3.5 w-3.5 text-amber-500' />
                        Updated this week
                    </span>
                </div>
                <div className='mt-4 space-y-3'>
                    {quickHelpTopics.map((topic) => (
                        <QuickHelpItem key={topic.question} topic={topic} />
                    ))}
                </div>
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
                {guideCollections.map((section) => (
                    <GuideCollectionCard key={section.key} section={section} />
                ))}
            </section>



            <section className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                {resourceShortcuts.map((resource) => (
                    <ResourceCard key={resource.key} resource={resource} />
                ))}
            </section>
        </div>
    );
}