import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';

const COLORS = {
  profit: '#10b981',
  loss: '#ef4444',
  breakeven: '#64748b',
};

export default function ProfitLossPie({ tradeStats }) {
  if (!tradeStats) return null;

  const data = [
    { name: 'Profitable', value: tradeStats.profitCount, color: COLORS.profit },
    { name: 'Losing', value: tradeStats.lossCount, color: COLORS.loss },
  ];

  if (tradeStats.breakevenCount > 0) {
    data.push({ name: 'Breakeven', value: tradeStats.breakevenCount, color: COLORS.breakeven });
  }

  // Filter out zero values
  const filteredData = data.filter((d) => d.value > 0);
  if (filteredData.length === 0) return null;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const total = filteredData.reduce((sum, item) => sum + item.value, 0);
      const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '13px',
        }}>
          <p style={{ fontWeight: 700, color: d.color }}>{d.name}</p>
          <p style={{ color: 'var(--text-secondary)' }}>
            {d.value} trades ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>🎯 Profit vs Loss Distribution</h3>
        <span>{tradeStats.totalTrades} total trades</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={110}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {filteredData.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="var(--bg-secondary)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
