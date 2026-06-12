import { useCallback } from 'react';

const DEFAULT_PAGINATION = {
    total: 0,
    perPage: 15,
    currentPage: 1,
    lastPage: 1,
    from: null,
    to: null,
};

export function useManifestPagination(pagination = DEFAULT_PAGINATION, fetchWithParams = () => Promise.resolve()) {
    const safePagination = pagination ?? DEFAULT_PAGINATION;
    const currentPage = safePagination.currentPage ?? 1;
    const lastPage = safePagination.lastPage ?? 1;

    const goToPage = useCallback(
        (page) => {
            if (!page || page < 1 || page > (safePagination.lastPage ?? 1)) {
                return;
            }
            fetchWithParams({ page });
        },
        [fetchWithParams, safePagination.lastPage],
    );

    const nextPage = useCallback(() => {
        if (currentPage < lastPage) {
            goToPage(currentPage + 1);
        }
    }, [currentPage, lastPage, goToPage]);

    const prevPage = useCallback(() => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    }, [currentPage, goToPage]);

    return {
        pagination: safePagination,
        goToPage,
        nextPage,
        prevPage,
    };
}
