import { useRef, useState, useMemo, useCallback } from 'react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import StatsCards from '../components/Dashboard/StatsCards';
import DateFilter from '../components/Dashboard/DateFilter';
import DataTable from '../components/Dashboard/DataTable';
import FourPlanMonthlyChart from '../components/Charts/FourPlanMonthlyChart';
import LongShortBar from '../components/Charts/LongShortBar';
import ProfitLossPie from '../components/Charts/ProfitLossPie';
import FourPlanChart from '../components/Charts/FourPlanChart';

import TradesByCodeChart from '../components/Charts/TradesByCodeChart';
import { toNumber } from '../utils/columnDetector';
import {
  computeAllStats,
  computeTradeStats,
  computeMonthlyBreakdown,
  computeTradeTypeBreakdown,
} from '../utils/calculations';
import { BarChart3 } from 'lucide-react';

export default function DashboardPage({ parsedResult, onBack, onSave, isSaving, onShare, onDeleteDashboard }) {
  const dashboardRef = useRef(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchFilter, setSearchFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState({ col: null, vals: [] });

  const { data, columns, columnTypes, primaryColumns, summary, fileName, isHistorical } = parsedResult || {};

  // Filter data by date range and search (Base)
  const baseFilteredData = useMemo(() => {
    if (!data) return [];
    let filtered = [...data];

    // Date filter
    const dateCol = primaryColumns?.dateColumn;
    if (dateCol && (dateRange.start || dateRange.end)) {
      filtered = filtered.filter((row) => {
        const val = row[dateCol];
        const date = val instanceof Date ? val : new Date(val);
        if (isNaN(date.getTime())) return true;
        if (dateRange.start && date < new Date(dateRange.start)) return false;
        if (dateRange.end && date > new Date(dateRange.end + 'T23:59:59')) return false;
        return true;
      });
    }

    // Text search
    if (searchFilter.trim()) {
      const search = searchFilter.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(search))
      );
    }

    return filtered;
  }, [data, dateRange, searchFilter, primaryColumns]);

  // Apply code filter on top of base filters for the rest of the dashboard
  const filteredData = useMemo(() => {
    if (!codeFilter || codeFilter.vals.length === 0) return baseFilteredData;
    return baseFilteredData.filter(row => 
      codeFilter.vals.includes(String(row[codeFilter.col] || '').trim().toUpperCase())
    );
  }, [baseFilteredData, codeFilter]);

  const handleSelectCode = useCallback((val, col) => {
    setCodeFilter(prev => {
      if (!prev || !prev.col || prev.col !== col) {
        return { col, vals: [val] };
      }
      const newVals = prev.vals.includes(val)
        ? prev.vals.filter(v => v !== val)
        : [...prev.vals, val];
      return { col, vals: newVals };
    });
  }, []);

  // Recompute summary when filters are active
  const activeSummary = useMemo(() => {
    if (!primaryColumns) return summary;
    if (!data || filteredData.length === data.length) return summary;

    const { numericColumns, pnlColumn, tradeTypeColumn, dateColumn } = primaryColumns;
    return {
      allStats: computeAllStats(filteredData, numericColumns),
      tradeStats: computeTradeStats(filteredData, pnlColumn),
      monthlyBreakdown: computeMonthlyBreakdown(filteredData, dateColumn, pnlColumn),
      tradeTypeBreakdown: computeTradeTypeBreakdown(filteredData, tradeTypeColumn, pnlColumn),
      primaryColumns,
      columnTypes,
    };
  }, [filteredData, data, summary, primaryColumns, columnTypes]);

  if (!parsedResult) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">
          <BarChart3 size={28} />
        </div>
        <h3>No Data Loaded</h3>
        <p>Upload an Excel or CSV file to generate your dashboard.</p>
        <button className="btn btn-primary btn-sm" onClick={onBack} style={{ marginTop: '20px', width: 'auto' }}>
          Go to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <DashboardHeader 
        fileName={fileName} 
        summary={activeSummary}
        dashboardRef={dashboardRef}
        onBack={onBack}
        onSave={onSave}
        isSaving={isSaving}
        isSaved={!!parsedResult?.fileId}
        fileId={parsedResult?.fileId}
        onShare={onShare}
        onUnsave={onDeleteDashboard}
        codeFilter={codeFilter}
        onClearCodeFilter={() => setCodeFilter(null)}
      />

      {/* Date filter */}
      {primaryColumns?.dateColumn && !isHistorical && (
        <div style={{ marginBottom: '20px' }}>
          <DateFilter
            dateRange={dateRange}
            onDateChange={setDateRange}
            dateColumn={primaryColumns.dateColumn}
          />
          {filteredData.length !== data?.length && (
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              Showing {filteredData.length} of {data?.length} rows
            </span>
          )}
        </div>
      )}

      {/* Dashboard content for PDF export */}
      <div ref={dashboardRef}>
        {/* KPI Cards */}
        <StatsCards summary={activeSummary} primaryColumns={primaryColumns} />

        {/* Charts */}
        {!isHistorical && filteredData.length > 0 && (
          <div className="charts-grid">
            <FourPlanMonthlyChart data={filteredData} columns={columns} />
          </div>
        )}

        {/* Trades by Code */}
        {!isHistorical && baseFilteredData.length > 0 && (
          <div className="charts-grid" style={{ marginTop: '0' }}>
            <TradesByCodeChart 
              data={baseFilteredData} 
              columns={columns} 
              selectedCodes={codeFilter.vals}
              onSelectCode={handleSelectCode}
              onClearFilter={() => setCodeFilter({ col: null, vals: [] })}
            />
          </div>
        )}

        {/* Four Plan Analysis Chart */}
        {!isHistorical && filteredData.length > 0 && (
          <div className="charts-grid" style={{ marginBottom: '0' }}>
          <FourPlanChart data={filteredData} columns={columns} />
        </div>
        )}

      </div>

      {/* Data Table (only for fresh uploads, not historical) */}
      {!isHistorical && filteredData.length > 0 && (
        <DataTable
          data={filteredData}
          columns={columns}
          columnTypes={columnTypes}
          searchFilter={searchFilter}
          onSearchChange={setSearchFilter}
        />
      )}

      {isHistorical && (
        <div className="empty-state" style={{ padding: '40px' }}>
          <h3>Historical Dashboard</h3>
          <p>
            This is a saved dashboard snapshot. Upload the file again to see the full data table and apply filters.
          </p>
        </div>
      )}
    </div>
  );
}
