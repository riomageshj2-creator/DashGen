import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, Area, AreaChart
} from 'recharts';

const COLORS = {
  profit: '#10b981',
  loss: '#ef4444',
  primary: '#6366f1',
  grid: 'rgba(148, 163, 184, 0.15)',
};

export default function MonthlyLineChart({ data }) {
  if (!data || data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
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
        }}>
          <p style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{d.label}</p>
          <p style={{ color: d.total >= 0 ? COLORS.profit : COLORS.loss }}>
            Total: ₹{d.total.toLocaleString()}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>Trades: {d.count}</p>
          <p style={{ color: 'var(--text-secondary)' }}>Avg: ₹{d.avg.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>📈 Monthly Performance</h3>
        <span>{data.length} months</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradientProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: COLORS.grid }}
          />
          <YAxis
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="var(--text-tertiary)" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="total"
            stroke={COLORS.primary}
            strokeWidth={2.5}
            fill="url(#gradientProfit)"
            dot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: 'var(--bg-secondary)' }}
            activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2, fill: 'var(--bg-secondary)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
