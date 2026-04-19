import { useState, useMemo } from 'react';
import { toNumber } from '../utils/columnDetector';
import {
  computeAllStats,
  computeTradeStats,
  computeMonthlyBreakdown,
  computeTradeTypeBreakdown,
} from '../utils/calculations';

/**
 * Hook that provides filtered data and computed dashboard values.
 * Handles date range filtering and memoized calculations.
 */
export function useDashboardData(parsedResult) {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchFilter, setSearchFilter] = useState('');

  const filteredData = useMemo(() => {
    if (!parsedResult?.data) return [];
    let data = [...parsedResult.data];

    // Date range filter
    const { dateColumn } = parsedResult.primaryColumns || {};
    if (dateColumn && (dateRange.start || dateRange.end)) {
      data = data.filter((row) => {
        const val = row[dateColumn];
        const date = val instanceof Date ? val : new Date(val);
        if (isNaN(date.getTime())) return true;

        if (dateRange.start && date < new Date(dateRange.start)) return false;
        if (dateRange.end && date > new Date(dateRange.end + 'T23:59:59')) return false;
        return true;
      });
    }

    // Text search filter
    if (searchFilter.trim()) {
      const search = searchFilter.toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(search)
        )
      );
    }

    return data;
  }, [parsedResult, dateRange, searchFilter]);

  const filteredSummary = useMemo(() => {
    if (!parsedResult?.summary) return parsedResult?.summary || null;
    if (!parsedResult?.data || filteredData.length === parsedResult.data.length) {
      return parsedResult.summary;
    }

    // Recompute summary for filtered data
    const { numericColumns, pnlColumn, tradeTypeColumn, dateColumn } = parsedResult.primaryColumns;

    return {
      allStats: computeAllStats(filteredData, numericColumns),
      tradeStats: computeTradeStats(filteredData, pnlColumn),
      monthlyBreakdown: computeMonthlyBreakdown(filteredData, dateColumn, pnlColumn),
      tradeTypeBreakdown: computeTradeTypeBreakdown(filteredData, tradeTypeColumn, pnlColumn),
      primaryColumns: parsedResult.primaryColumns,
      columnTypes: parsedResult.columnTypes,
    };
  }, [filteredData, parsedResult]);

  return {
    filteredData,
    filteredSummary,
    dateRange,
    setDateRange,
    searchFilter,
    setSearchFilter,
    totalRows: parsedResult?.data?.length || parsedResult?.rowCount || 0,
    filteredRows: filteredData.length,
  };
}
