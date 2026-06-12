import React from 'react';
import { HiChevronLeft, HiChevronRight, HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi2';

/**
 * Komponen Pagination yang reusable untuk tabel CRUD
 * @param {Object} props
 * @param {number} props.currentPage - Halaman saat ini
 * @param {number} props.totalPages - Total halaman
 * @param {number} props.totalItems - Total item keseluruhan
 * @param {number} props.itemsPerPage - Jumlah item per halaman
 * @param {number} props.startIndex - Index awal item di halaman ini
 * @param {number} props.endIndex - Index akhir item di halaman ini
 * @param {Function} props.onPageChange - Callback ketika halaman berubah
 * @param {boolean} props.showFirstLast - Tampilkan tombol first/last page
 */
export default function Pagination({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = 5,
    startIndex = 0,
    endIndex = 0,
    onPageChange,
    showFirstLast = true,
}) {
    const handlePrevPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handleFirstPage = () => {
        if (currentPage !== 1) {
            onPageChange(1);
        }
    };

    const handleLastPage = () => {
        if (currentPage !== totalPages) {
            onPageChange(totalPages);
        }
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Calculate range around current page
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Add ellipsis if needed before middle section
            if (start > 2) {
                pages.push('...');
            }

            // Add middle pages
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis if needed after middle section
            if (end < totalPages - 1) {
                pages.push('...');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (totalItems === 0) {
        return null;
    }

    const displayStart = startIndex + 1;
    const displayEnd = Math.min(endIndex, totalItems);

    return (
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 mt-4'>
            {/* Info text */}
            <p className='text-xs text-slate-400 order-2 sm:order-1'>
                Menampilkan <span className='font-semibold text-slate-600'>{displayStart}</span> - <span className='font-semibold text-slate-600'>{displayEnd}</span> dari <span className='font-semibold text-slate-600'>{totalItems}</span> data
            </p>

            {/* Pagination controls */}
            <div className='flex items-center gap-1 order-1 sm:order-2'>
                {/* First Page Button */}
                {showFirstLast && (
                    <button
                        type='button'
                        onClick={handleFirstPage}
                        disabled={currentPage === 1}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-400'
                        aria-label='First page'
                    >
                        <HiChevronDoubleLeft className='h-4 w-4' />
                    </button>
                )}

                {/* Previous Button */}
                <button
                    type='button'
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-400'
                    aria-label='Previous page'
                >
                    <HiChevronLeft className='h-4 w-4' />
                </button>

                {/* Page Numbers */}
                <div className='flex items-center gap-1'>
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span
                                key={`ellipsis-${index}`}
                                className='px-2 text-sm text-slate-400'
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                type='button'
                                onClick={() => onPageChange(page)}
                                className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition ${currentPage === page
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'border border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                                    }`}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                {/* Next Button */}
                <button
                    type='button'
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-400'
                    aria-label='Next page'
                >
                    <HiChevronRight className='h-4 w-4' />
                </button>

                {/* Last Page Button */}
                {showFirstLast && (
                    <button
                        type='button'
                        onClick={handleLastPage}
                        disabled={currentPage === totalPages}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-400'
                        aria-label='Last page'
                    >
                        <HiChevronDoubleRight className='h-4 w-4' />
                    </button>
                )}
            </div>
        </div>
    );
}
