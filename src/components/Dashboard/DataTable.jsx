import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { toNumber } from '../../utils/columnDetector';

const ROWS_PER_PAGE = 25;

export default function DataTable({ data, columns, columnTypes, searchFilter, onSearchChange }) {
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });
  const [page, setPage] = useState(0);

  const sortedData = useMemo(() => {
    if (!data || !sortConfig.column) return data || [];

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.column];
      const bVal = b[sortConfig.column];

      // Numeric sorting
      const aNum = toNumber(aVal);
      const bNum = toNumber(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // String sorting
      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      const compare = aStr.localeCompare(bStr);
      return sortConfig.direction === 'asc' ? compare : -compare;
    });
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = page * ROWS_PER_PAGE;
    return sortedData.slice(start, start + ROWS_PER_PAGE);
  }, [sortedData, page]);

  const totalPages = Math.ceil((sortedData?.length || 0) / ROWS_PER_PAGE);

  const handleSort = (column) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const formatCellValue = (value, col) => {
    if (value === null || value === undefined || value === '') return '—';

    if (value instanceof Date) {
      // Use the date directly — timezone was already corrected in parseExcel
      if (isNaN(value.getTime())) return '—';
      return value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // Try to detect date strings that weren't parsed as Date objects
    const colType = columnTypes?.[col]?.type;
    if (colType === 'date' && typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
    }

    if (colType === 'number') {
      const num = toNumber(value);
      if (!isNaN(num)) {
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
      }
    }

    return String(value);
  };

  const getCellClass = (value, col) => {
    const colType = columnTypes?.[col];
    if (!colType) return '';

    if (colType.type === 'number') {
      const num = toNumber(value);
      if (!isNaN(num)) {
        if (colType.semantic === 'pnl') {
          return num > 0 ? 'cell-positive' : num < 0 ? 'cell-negative' : 'cell-number';
        }
        return 'cell-number';
      }
    }

    if (colType.type === 'date') return 'cell-date';
    return '';
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="data-table-wrapper">
      <div className="data-table-header">
        <h3>Data Table</h3>
        <div className="data-table-filters">
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              id="table-search"
              type="text"
              className="filter-input"
              placeholder="Search data..."
              value={searchFilter}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
          </div>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={sortConfig.column === col ? 'sorted' : ''}
                >
                  {col}
                  <span className="sort-icon">
                    {sortConfig.column === col ? (
                      sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ChevronUp size={12} style={{ opacity: 0.3 }} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td key={col} className={getCellClass(row[col], col)}>
                    {formatCellValue(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>
          Showing {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, sortedData.length)} of{' '}
          {sortedData.length} rows
        </span>
        <div className="table-pagination">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = page < 3 ? i : page - 2 + i;
            if (pageNum >= totalPages) return null;
            return (
              <button
                key={pageNum}
                className={page === pageNum ? 'active' : ''}
                onClick={() => setPage(pageNum)}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
