import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { toNumber } from '../../utils/columnDetector';
import CustomDatePicker from '../Dashboard/CustomDatePicker';

const PLAN_CONFIGS = [
  { pattern: /controled\s*buy|controlled\s*buy/i, label: 'Controlled Buy', color: '#3b82f6' },
  { pattern: /controled\s*sell|controlled\s*sell/i, label: 'Controlled Selling', color: '#8b5cf6' },
  { pattern: /naked\s*buy/i, label: 'Naked Buy', color: '#f59e0b' },
  { pattern: /naked\s*sell/i, label: 'Naked Sell', color: '#ec4899' },
];

const NET_PNL_COLOR = '#10b981';
const GRID_COLOR = 'rgba(148, 163, 184, 0.15)';

function hasRealValue(val) {
  if (val === '' || val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  return true;
}

function detectPlanColumns(columns) {
  const found = [];
  PLAN_CONFIGS.forEach(({ pattern, label, color }) => {
    const match = columns.find((col) => pattern.test(col));
    if (match) found.push({ key: match, label, color });
  });
  return found;
}

function parseDate(dateVal) {
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'number' && dateVal > 25000 && dateVal < 73050) {
    let adj = dateVal > 59 ? dateVal - 1 : dateVal;
    const epoch = new Date(1900, 0, 1).getTime();
    return new Date(epoch + (adj - 1) * 86400000);
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
}

export default function FourPlanMonthlyChart({ data, columns }) {
  if (!data || !columns) return null;

  const planColumns = detectPlanColumns(columns);
  if (planColumns.length === 0) return null;

  const dateCol = columns.find(c => /date|time/i.test(c));
  const pnlCol = columns.find(c => /net\s*p[&.]?l|profit|loss/i.test(c));

  // Plan toggle filters
  const [activePlans, setActivePlans] = useState(() => {
    const initial = {};
    planColumns.forEach(p => { initial[p.label] = true; });
    if (pnlCol) initial['Net P&L'] = true;
    return initial;
  });

  // Date range filter (within the chart)
  const [chartDateRange, setChartDateRange] = useState({ start: '', end: '' });

  const togglePlan = (label) => {
    setActivePlans(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const showAll = () => {
    const all = {};
    planColumns.forEach(p => { all[p.label] = true; });
    if (pnlCol) all['Net P&L'] = true;
    setActivePlans(all);
  };

  const hideAll = () => {
    const none = {};
    planColumns.forEach(p => { none[p.label] = false; });
    if (pnlCol) none['Net P&L'] = false;
    setActivePlans(none);
  };

  const clearDateFilter = () => {
    setChartDateRange({ start: '', end: '' });
  };

  // Parse all rows with dates for filtering
  const rowsWithDates = useMemo(() => {
    if (!dateCol) return [];
    return data.map(row => {
      const date = parseDate(row[dateCol]);
      return { row, date };
    }).filter(r => r.date !== null);
  }, [data, dateCol]);

  // Apply date filter
  const filteredRows = useMemo(() => {
    let rows = rowsWithDates;
    if (chartDateRange.start) {
      const s = new Date(chartDateRange.start);
      rows = rows.filter(r => r.date >= s);
    }
    if (chartDateRange.end) {
      const e = new Date(chartDateRange.end + 'T23:59:59');
      rows = rows.filter(r => r.date <= e);
    }
    return rows;
  }, [rowsWithDates, chartDateRange]);

  // Compute monthly data from filtered rows
  const monthlyData = useMemo(() => {
    const monthlyMap = {};

    filteredRows.forEach(({ row, date }) => {
      const hasAnyPlan = planColumns.some(p => hasRealValue(row[p.key]));
      if (!hasAnyPlan) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: key, label };
        planColumns.forEach(p => { monthlyMap[key][p.label] = 0; });
        if (pnlCol) monthlyMap[key]['Net P&L'] = 0;
        monthlyMap[key]._counts = {};
        planColumns.forEach(p => { monthlyMap[key]._counts[p.label] = 0; });
        if (pnlCol) monthlyMap[key]._counts['Net P&L'] = 0;
      }

      planColumns.forEach(p => {
        if (hasRealValue(row[p.key])) {
          const val = toNumber(row[p.key]);
          if (!isNaN(val)) {
            monthlyMap[key][p.label] += val;
            monthlyMap[key]._counts[p.label]++;
          }
        }
      });

      if (pnlCol && hasRealValue(row[pnlCol])) {
        const val = toNumber(row[pnlCol]);
        if (!isNaN(val)) {
          monthlyMap[key]['Net P&L'] += val;
          monthlyMap[key]._counts['Net P&L']++;
        }
      }
    });

    return Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => {
        const rounded = { ...m };
        planColumns.forEach(p => { rounded[p.label] = Math.round(m[p.label] * 100) / 100; });
        if (pnlCol) rounded['Net P&L'] = Math.round(m['Net P&L'] * 100) / 100;
        return rounded;
      });
  }, [filteredRows, planColumns, pnlCol]);

  // Comparison summary for active plans in filtered date range
  const comparisonStats = useMemo(() => {
    const stats = {};
    const allLineKeys = [
      ...planColumns.map(p => p.label),
      ...(pnlCol ? ['Net P&L'] : []),
    ];

    allLineKeys.forEach(key => {
      let total = 0, trades = 0, wins = 0, losses = 0;
      monthlyData.forEach(m => {
        total += m[key] || 0;
        trades += m._counts?.[key] || 0;
      });

      // Compute wins/losses from filtered raw data
      const planCol = planColumns.find(p => p.label === key);
      const colKey = planCol ? planCol.key : (key === 'Net P&L' ? pnlCol : null);
      if (colKey) {
        filteredRows.forEach(({ row }) => {
          if (!hasRealValue(row[colKey])) return;
          const val = toNumber(row[colKey]);
          if (isNaN(val)) return;
          if (val > 0) wins++;
          if (val < 0) losses++;
        });
      }

      stats[key] = {
        total: Math.round(total * 100) / 100,
        trades,
        wins,
        losses,
        winRate: trades > 0 ? Math.round((wins / trades) * 10000) / 100 : 0,
      };
    });
    return stats;
  }, [monthlyData, filteredRows, planColumns, pnlCol]);

  if (monthlyData.length === 0 && !chartDateRange.start && !chartDateRange.end) return null;

  const allLines = [
    ...planColumns.map(p => ({ key: p.label, color: p.color })),
    ...(pnlCol ? [{ key: 'Net P&L', color: NET_PNL_COLOR }] : []),
  ];

  const activeCount = Object.values(activePlans).filter(Boolean).length;
  const isDateFiltered = chartDateRange.start || chartDateRange.end;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      if (!dataPoint) return null;
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '13px',
          minWidth: '220px',
        }}>
          <p style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', fontSize: '14px' }}>
            {dataPoint.label}
          </p>
          {allLines.filter(l => activePlans[l.key]).map(line => {
            const val = dataPoint[line.key];
            const count = dataPoint._counts?.[line.key] || 0;
            return (
              <div key={line.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: line.color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{line.key}:</span>
                </span>
                <span style={{ color: val >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {val >= 0 ? '₹' : '-₹'}{Math.abs(val || 0).toLocaleString('en-IN')}
                  <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, fontSize: '11px', marginLeft: 4 }}>
                    ({count})
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
      <div className="chart-card-header" style={{ marginBottom: '4px' }}>
        <h3>Monthly Performance</h3>
        <span>{monthlyData.length} months{isDateFiltered ? ' (filtered)' : ''}</span>
      </div>

      {/* Controls Row: Date Filter + Plan Toggles */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {/* Date Range Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          padding: '10px 14px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Date Range:
          </span>
          <CustomDatePicker
            selected={chartDateRange.start}
            onChange={(val) => setChartDateRange(prev => ({ ...prev, start: val }))}
            placeholderText="Start date"
            selectsStart
            startDate={chartDateRange.start}
            endDate={chartDateRange.end}
          />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>to</span>
          <CustomDatePicker
            selected={chartDateRange.end}
            onChange={(val) => setChartDateRange(prev => ({ ...prev, end: val }))}
            placeholderText="End date"
            selectsEnd
            startDate={chartDateRange.start}
            endDate={chartDateRange.end}
          />
          {isDateFiltered && (
            <button
              onClick={clearDateFilter}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: '#ef444420',
                color: '#ef4444',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Plan Toggle Filters */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}>
          <button
            onClick={activeCount === allLines.length ? hideAll : showAll}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              background: activeCount === allLines.length ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: activeCount === allLines.length ? '#ffffff' : 'var(--text-secondary)',
              border: activeCount === allLines.length ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {activeCount === allLines.length ? '✓ All' : 'Select All'}
          </button>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

          {allLines.map(line => (
            <button
              key={line.key}
              onClick={() => togglePlan(line.key)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                border: `2px solid ${activePlans[line.key] ? line.color : 'var(--border-color)'}`,
                background: activePlans[line.key] ? `${line.color}18` : 'var(--bg-tertiary)',
                color: activePlans[line.key] ? line.color : 'var(--text-tertiary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: activePlans[line.key] ? line.color : 'var(--border-color)',
                transition: 'all 0.2s ease',
              }} />
              {line.key}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {allLines.map(line => (
                <linearGradient key={line.key} id={`grad-${line.key.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={line.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={line.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
            />
            <YAxis
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="var(--text-tertiary)" strokeDasharray="3 3" />

            {allLines.map(line => (
              activePlans[line.key] && (
                <Area
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color}
                  strokeWidth={2.5}
                  fill={`url(#grad-${line.key.replace(/\s/g, '')})`}
                  dot={{ r: 3, fill: line.color, strokeWidth: 2, stroke: 'var(--bg-secondary)' }}
                  activeDot={{ r: 5, stroke: line.color, strokeWidth: 2, fill: 'var(--bg-secondary)' }}
                />
              )
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
          fontSize: '14px',
        }}>
          No data in selected date range
        </div>
      )}

      {/* Comparison Table */}
      <div style={{
        marginTop: '20px',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '16px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Plan Comparison {isDateFiltered ? '(Filtered)' : '(All Time)'}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${allLines.filter(l => activePlans[l.key]).length || 1}, 1fr)`,
          gap: '10px',
        }}>
          {allLines.filter(l => activePlans[l.key]).map(line => {
            const stats = comparisonStats[line.key];
            if (!stats) return null;
            return (
              <div key={line.key} style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                borderTop: `3px solid ${line.color}`,
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: line.color,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {line.key}
                </div>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: stats.total >= 0 ? '#10b981' : '#ef4444',
                  marginBottom: 8,
                }}>
                  {stats.total >= 0 ? '+₹' : '-₹'}{Math.abs(stats.total).toLocaleString('en-IN')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Trades</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.trades}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#10b981' }}>Wins</span>
                    <span style={{ fontWeight: 600, color: '#10b981' }}>{stats.wins}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#ef4444' }}>Losses</span>
                    <span style={{ fontWeight: 600, color: '#ef4444' }}>{stats.losses}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: 4,
                    marginTop: 2,
                  }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Win Rate</span>
                    <span style={{
                      fontWeight: 700,
                      color: stats.winRate >= 50 ? '#10b981' : '#ef4444',
                    }}>
                      {stats.winRate}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
