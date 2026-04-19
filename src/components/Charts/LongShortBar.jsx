import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#3b82f6', '#ec4899'];
const GRID_COLOR = 'rgba(148, 163, 184, 0.15)';

export default function LongShortBar({ data }) {
  if (!data || data.length === 0) return null;

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
        }}>
          <p style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{d.type}</p>
          <p style={{ color: d.total >= 0 ? '#10b981' : '#ef4444' }}>
            Total P&L: ₹{d.total.toLocaleString()}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>Trades: {d.count}</p>
          <p style={{ color: 'var(--text-secondary)' }}>Avg P&L: ₹{d.avgPnL.toLocaleString()}</p>
          <p style={{ color: '#10b981' }}>Wins: {d.profits}</p>
          <p style={{ color: '#ef4444' }}>Losses: {d.losses}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>📊 Trade Type Breakdown</h3>
        <span>{data.length} types</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey="type"
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
          />
          <YAxis
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
