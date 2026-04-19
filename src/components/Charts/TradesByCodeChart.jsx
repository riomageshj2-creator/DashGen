import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

const BAR_COLORS = [
  '#3b82f6'
];

const CODE_PATTERN = /^(code|expiry|contract|month|series)$/i;

/**
 * Detect the CODE column from available columns.
 */
function detectCodeColumn(columns) {
  // First: exact name match
  for (const col of columns) {
    if (CODE_PATTERN.test(col.trim())) return col;
  }
  // Fallback: partial match
  for (const col of columns) {
    if (/code/i.test(col)) return col;
  }
  return null;
}

/**
 * Get trade rows — rows that have a non-empty Code value.
 * ENTRY + EXITE = 1 trade. Only rows with actual Code data count.
 */
function hasRealValue(val) {
  if (val === '' || val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  return true;
}

/**
 * Compute trade count by code.
 */
function computeTradesByCode(data, codeCol) {
  const codeMap = {};

  data.forEach((row) => {
    const code = row[codeCol];
    if (!hasRealValue(code)) return; // skip empty rows (EXITE half of merged pair)

    const codeStr = String(code).trim().toUpperCase();
    if (!codeMap[codeStr]) {
      codeMap[codeStr] = { code: codeStr, count: 0 };
    }
    codeMap[codeStr].count++;
  });

  // Sort by natural order (months: JAN, FEB, MAR, etc.)
  const monthOrder = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  return Object.values(codeMap).sort((a, b) => {
    const aIdx = monthOrder.indexOf(a.code);
    const bIdx = monthOrder.indexOf(b.code);
    if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
    if (aIdx >= 0) return -1;
    if (bIdx >= 0) return 1;
    return a.code.localeCompare(b.code);
  });
}


const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-lg)',
        fontSize: '13px',
        minWidth: '140px',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)', fontSize: '14px' }}>
          {d.code}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>No. of Trades:</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary, #6366f1)' }}>{d.count}</span>
        </div>
      </div>
    );
  }
  return null;
};


export default function TradesByCodeChart({ data, columns, selectedCodes = [], onSelectCode, onClearFilter }) {
  if (!data || !columns) return null;

  const codeCol = useMemo(() => detectCodeColumn(columns), [columns]);
  if (!codeCol) return null;

  const codeStats = useMemo(() => computeTradesByCode(data, codeCol), [data, codeCol]);
  if (codeStats.length === 0) return null;

  const totalTrades = codeStats.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>No. of Trades by Code</h3>
        <span>{totalTrades} total trades · {codeStats.length} codes</span>
      </div>

      {/* Summary badges */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px',
      }}>
        {codeStats.map((item, i) => {
          const isSelected = selectedCodes.includes(item.code);
          const isFaded = selectedCodes.length > 0 && !isSelected;
          return (
          <div 
            key={item.code} 
            onClick={() => onSelectCode && onSelectCode(item.code, codeCol)}
            title="Click to filter dashboard"
            style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: isSelected ? 'var(--bg-card)' : 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            borderLeft: `3px solid ${BAR_COLORS[i % BAR_COLORS.length]}`,
            border: isSelected ? `1px solid ${BAR_COLORS[i % BAR_COLORS.length]}` : '1px solid transparent',
            cursor: 'pointer',
            opacity: isFaded ? 0.4 : 1,
            transition: 'all 0.2s',
            transform: isSelected ? 'scale(1.05)' : 'none',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.code}
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 800,
              color: BAR_COLORS[i % BAR_COLORS.length],
            }}>
              {item.count}
            </span>
          </div>
        )})}
        {selectedCodes.length > 0 && (
          <button 
            onClick={onClearFilter}
            className="btn btn-ghost"
            style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--danger)' }}
            title="Clear all code filters"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={codeStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
          <XAxis
            dataKey="code"
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.15)' }}
          />
          <YAxis
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            label={{ value: 'No. of Trades', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--text-tertiary)' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            name="Trades" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={55}
            onClick={(d) => onSelectCode && onSelectCode(d.code, codeCol)}
            style={{ cursor: 'pointer' }}
          >
            {codeStats.map((entry, index) => {
              const isFaded = selectedCodes.length > 0 && !selectedCodes.includes(entry.code);
              return (
              <Cell 
                key={index} 
                fill={BAR_COLORS[index % BAR_COLORS.length]} 
                opacity={isFaded ? 0.3 : 1}
              />
            )})}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
