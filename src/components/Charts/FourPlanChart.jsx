import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { toNumber } from '../../utils/columnDetector';

const COLORS = {
  win: '#10b981',
  loss: '#ef4444',
  total: '#6366f1',
  neutral: '#94a3b8',
};

const PLAN_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

const PLAN_COLUMNS = [
  { pattern: /controled\s*buy|controlled\s*buy/i, label: 'Controlled Buy' },
  { pattern: /controled\s*sell|controlled\s*sell/i, label: 'Controlled Selling' },
  { pattern: /naked\s*buy/i, label: 'Naked Buy' },
  { pattern: /naked\s*sell/i, label: 'Naked Sell' },
];

/**
 * Detect the four plan columns from available columns.
 */
function detectPlanColumns(columns) {
  const found = [];
  PLAN_COLUMNS.forEach(({ pattern, label }) => {
    const match = columns.find((col) => pattern.test(col));
    if (match) {
      found.push({ key: match, label });
    }
  });
  return found;
}

/**
 * Check if a value is a real data value (not empty from merged cells).
 */
function hasRealValue(val) {
  if (val === '' || val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  return true;
}

/**
 * Get rows that have actual plan data (non-empty values in plan columns).
 * ENTRY + EXITE = 1 trade. Only the row with merged cell data counts.
 * The other row of the pair has empty values and is skipped.
 */
function getTradeRows(data, planColumns) {
  return data.filter((row) => {
    return planColumns.some(({ key }) => {
      return hasRealValue(row[key]);
    });
  });
}

/**
 * Compute comprehensive stats for each plan column.
 * ENTRY + EXITE = 1 single trade. Only rows with actual data are counted.
 */
function computePlanStats(data, planColumns) {
  const tradeRows = getTradeRows(data, planColumns);

  return planColumns.map(({ key, label }) => {
    let totalPositive = 0;
    let totalNegative = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let total = 0;
    let count = 0;
    const allValues = [];

    tradeRows.forEach((row) => {
      if (!hasRealValue(row[key])) return; // skip empty merged cells
      const val = toNumber(row[key]);
      if (isNaN(val)) return;

      count++;
      total += val;
      allValues.push({ value: val, row });

      if (val > 0) {
        totalPositive += val;
        positiveCount++;
      } else if (val < 0) {
        totalNegative += val;
        negativeCount++;
      }
    });

    // Get 4 biggest losses (most negative values)
    const bigLosses = allValues
      .filter(({ value }) => value < 0)
      .sort((a, b) => a.value - b.value)
      .slice(0, 4);

    // Get 4 biggest wins (most positive values)
    const bigWins = allValues
      .filter(({ value }) => value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    const winPct = count > 0 ? ((positiveCount / count) * 100) : 0;
    const lossPct = count > 0 ? ((negativeCount / count) * 100) : 0;

    return {
      name: label,
      key,
      win: Math.round(totalPositive * 100) / 100,
      loss: Math.round(Math.abs(totalNegative) * 100) / 100,
      lossRaw: Math.round(totalNegative * 100) / 100,
      total: Math.round(total * 100) / 100,
      winCount: positiveCount,
      lossCount: negativeCount,
      totalCount: count,
      winPct: Math.round(winPct * 100) / 100,
      lossPct: Math.round(lossPct * 100) / 100,
      bigLosses,
      bigWins,
    };
  });
}


const CountTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        boxShadow: 'var(--shadow-lg)',
        fontSize: '13px',
        minWidth: '200px',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', fontSize: '14px' }}>
          {d.name}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: COLORS.win }}>● Win Count:</span>
          <span style={{ color: COLORS.win, fontWeight: 600 }}>
            {d.winCount} trades ({d.winPct}%)
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: COLORS.loss }}>● Loss Count:</span>
          <span style={{ color: COLORS.loss, fontWeight: 600 }}>
            {d.lossCount} trades ({d.lossPct}%)
          </span>
        </div>
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: 6,
          marginTop: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total Trades:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.totalCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Win Value:</span>
            <span style={{ color: COLORS.win, fontWeight: 600 }}>₹{Math.abs(d.win).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Loss Value:</span>
            <span style={{ color: COLORS.loss, fontWeight: 600 }}>-₹{Math.abs(d.loss).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: '12px', fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export default function FourPlanChart({ data, columns }) {
  if (!data || !columns) return null;

  const planColumns = detectPlanColumns(columns);
  if (planColumns.length === 0) return null;

  const planStats = useMemo(() => computePlanStats(data, planColumns), [data, columns]);

  // Compute grand total across all plans
  const grandTotal = useMemo(() => {
    return planStats.reduce((sum, p) => sum + p.total, 0);
  }, [planStats]);

  // Data for the totals bar chart
  const totalsData = useMemo(() => {
    return planStats.map((p, i) => ({
      ...p,
      fill: PLAN_COLORS[i % PLAN_COLORS.length],
    }));
  }, [planStats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', gridColumn: '1 / -1' }}>

      {/* ============ SECTION 1: Win/Loss Count Summary Cards ============ */}
      <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
        <div className="chart-card-header">
          <h3>Win vs Loss Count</h3>
          <span>{planColumns.length} plans detected</span>
        </div>

        {/* Plan Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${planStats.length}, 1fr)`,
          gap: '12px',
          marginBottom: '20px',
        }}>
          {planStats.map((plan, i) => (
            <div key={plan.key} style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'center',
              borderTop: `3px solid ${PLAN_COLORS[i]}`,
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {plan.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: COLORS.win }}>{plan.winCount}</div>
                  <div style={{ fontSize: '10px', color: COLORS.win, fontWeight: 600 }}>WINS</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border-color)' }} />
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: COLORS.loss }}>{plan.lossCount}</div>
                  <div style={{ fontSize: '10px', color: COLORS.loss, fontWeight: 600 }}>LOSSES</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Total: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{plan.totalCount}</span> trades
              </div>
            </div>
          ))}
        </div>

        {/* Bar Chart — Win Count vs Loss Count */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={planStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.15)' }}
            />
            <YAxis
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Number of Trades', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--text-tertiary)' } }}
            />
            <Tooltip content={<CountTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
                  {value}
                </span>
              )}
            />
            <Bar dataKey="winCount" name="Win" fill={COLORS.win} radius={[6, 6, 0, 0]} maxBarSize={55} />
            <Bar dataKey="lossCount" name="Loss" fill={COLORS.loss} radius={[6, 6, 0, 0]} maxBarSize={55} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ============ SECTION 2: Total of Four Plans ============ */}
      <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
        <div className="chart-card-header">
          <h3>Total of Four Plans</h3>
          <span style={{
            fontSize: '16px',
            fontWeight: 800,
            color: grandTotal >= 0 ? COLORS.win : COLORS.loss,
          }}>
            Net: {grandTotal >= 0 ? '+' : '-'}{Math.abs(Math.round(grandTotal)).toLocaleString('en-IN')} Pts
          </span>
        </div>

        {/* Total cards per plan */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${planStats.length}, 1fr)`,
          gap: '12px',
          marginBottom: '20px',
        }}>
          {planStats.map((plan, i) => (
            <div key={plan.key} style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 16px',
              textAlign: 'center',
              borderLeft: `4px solid ${PLAN_COLORS[i]}`,
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {plan.name}
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: plan.total >= 0 ? COLORS.win : COLORS.loss }}>
                {plan.total >= 0 ? '+₹' : '-₹'}{Math.abs(plan.total).toLocaleString('en-IN')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: 8, fontSize: '11px' }}>
                <span style={{ color: COLORS.win }}>▲ ₹{Math.abs(plan.win).toLocaleString('en-IN')}</span>
                <span style={{ color: COLORS.loss }}>▼ -₹{Math.abs(plan.loss).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Bar Chart */}
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={totalsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.15)' }}
            />
            <YAxis
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                fontSize: '13px',
              }}
              formatter={(value) => [`${value >= 0 ? '₹' : '-₹'}${Math.abs(value).toLocaleString('en-IN')}`, 'Net Total']}
            />
            <Bar dataKey="total" name="Net Total" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {totalsData.map((entry, index) => (
                <Cell key={index} fill={entry.total >= 0 ? COLORS.win : COLORS.loss} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ============ SECTION 3: Win/Loss Percentage ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(planStats.length, 4)}, 1fr)`, gap: '20px' }}>
        {planStats.map((plan, i) => {
          const pieData = [
            { name: 'Win %', value: plan.winPct, color: COLORS.win },
            { name: 'Loss %', value: plan.lossPct, color: COLORS.loss },
          ];
          // If there are neutral trades (zero P&L), add them
          const neutralPct = 100 - plan.winPct - plan.lossPct;
          if (neutralPct > 0.5) {
            pieData.push({ name: 'Neutral %', value: Math.round(neutralPct * 100) / 100, color: COLORS.neutral });
          }

          return (
            <div key={plan.key} className="chart-card">
              <div className="chart-card-header" style={{ marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px' }}>{plan.name}</h3>
                <span>{plan.totalCount} trades</span>
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value}%`]}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '4px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: COLORS.win }}>{plan.winPct}%</div>
                  <div style={{ fontSize: '10px', color: COLORS.win, fontWeight: 600 }}>WIN RATE</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border-color)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: COLORS.loss }}>{plan.lossPct}%</div>
                  <div style={{ fontSize: '10px', color: COLORS.loss, fontWeight: 600 }}>LOSS RATE</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============ SECTION 4: Four Big Negative [Big Loss] ============ */}
      <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
        <div className="chart-card-header">
          <h3>Big Loss Comparison</h3>
          <span>Top 4 biggest losses per plan</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(planStats.length, 4)}, 1fr)`,
          gap: '16px',
        }}>
          {planStats.map((plan, i) => (
            <div key={plan.key} style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}>
              {/* Plan header */}
              <div style={{
                padding: '12px 16px',
                background: `linear-gradient(135deg, ${PLAN_COLORS[i]}22, ${PLAN_COLORS[i]}08)`,
                borderBottom: `2px solid ${PLAN_COLORS[i]}33`,
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {plan.bigLosses.length} big losses
                </div>
              </div>

              {/* Loss rows */}
              <div style={{ padding: '4px 0' }}>
                {plan.bigLosses.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    No losses recorded
                  </div>
                ) : (
                  plan.bigLosses.map((loss, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderBottom: idx < plan.bigLosses.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--danger-light)',
                          color: COLORS.loss,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}>
                          #{idx + 1}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Trade
                        </span>
                      </div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: COLORS.loss,
                      }}>
                        -₹{Math.abs(loss.value).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ SECTION 5: Four Big Positive [Big Win] ============ */}
      <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
        <div className="chart-card-header">
          <h3>Big Win Comparison</h3>
          <span>Top 4 biggest wins per plan</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(planStats.length, 4)}, 1fr)`,
          gap: '16px',
        }}>
          {planStats.map((plan, i) => (
            <div key={plan.key} style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}>
              {/* Plan header */}
              <div style={{
                padding: '12px 16px',
                background: `linear-gradient(135deg, ${PLAN_COLORS[i]}22, ${PLAN_COLORS[i]}08)`,
                borderBottom: `2px solid ${PLAN_COLORS[i]}33`,
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {plan.bigWins.length} big wins
                </div>
              </div>

              {/* Win rows */}
              <div style={{ padding: '4px 0' }}>
                {plan.bigWins.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    No wins recorded
                  </div>
                ) : (
                  plan.bigWins.map((win, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderBottom: idx < plan.bigWins.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: COLORS.win,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}>
                          #{idx + 1}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Trade
                        </span>
                      </div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: COLORS.win,
                      }}>
                        +₹{Math.abs(win.value).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
