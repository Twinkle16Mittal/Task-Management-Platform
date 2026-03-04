import React from 'react';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        pages.push(1);
        if (page > 3) pages.push('...');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
            pages.push(i);
        }
        if (page < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    return (
        <div className="pagination">
            <button
                className="page-btn"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
            >
                ‹ Prev
            </button>
            {getPages().map((p, i) =>
                p === '...' ? (
                    <span key={`dot-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
                ) : (
                    <button
                        key={p}
                        className={`page-btn${page === p ? ' active' : ''}`}
                        onClick={() => onPageChange(p as number)}
                    >
                        {p}
                    </button>
                )
            )}
            <button
                className="page-btn"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
            >
                Next ›
            </button>
        </div>
    );
}
