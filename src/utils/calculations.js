import { toNumber } from './columnDetector';

/**
 * Dynamic calculations engine.
 * All functions accept column names as parameters — nothing is hardcoded.
 */

/**
 * Compute basic stats for a numeric column.
 */
export function computeColumnStats(data, column) {
  const values = data
    .map((row) => toNumber(row[column]))
    .filter((v) => !isNaN(v));

  if (values.length === 0) {
    return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    sum: Math.round(sum * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    count: values.length,
  };
}

/**
 * Compute stats for ALL numeric columns.
 */
export function computeAllStats(data, numericColumns) {
  const stats = {};
  numericColumns.forEach((col) => {
    stats[col] = computeColumnStats(data, col);
  });
  return stats;
}

/**
 * Compute trade-specific stats (Profit vs Loss breakdown).
 */
export function computeTradeStats(data, pnlColumn) {
  if (!pnlColumn) return null;

  const values = data
    .map((row) => toNumber(row[pnlColumn]))
    .filter((v) => !isNaN(v));

  const profits = values.filter((v) => v > 0);
  const losses = values.filter((v) => v < 0);
  const breakeven = values.filter((v) => v === 0);

  return {
    totalTrades: values.length,
    totalPnL: Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100,
    avgPnL: values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : 0,
    maxProfit: profits.length ? Math.round(Math.max(...profits) * 100) / 100 : 0,
    maxLoss: losses.length ? Math.round(Math.min(...losses) * 100) / 100 : 0,
    profitCount: profits.length,
    lossCount: losses.length,
    breakevenCount: breakeven.length,
    winRate: values.length ? Math.round((profits.length / values.length) * 10000) / 100 : 0,
    totalProfit: Math.round(profits.reduce((a, b) => a + b, 0) * 100) / 100,
    totalLoss: Math.round(losses.reduce((a, b) => a + b, 0) * 100) / 100,
  };
}

/**
 * Group data by month and compute sum for a value column.
 */
export function computeMonthlyBreakdown(data, dateColumn, valueColumn) {
  if (!dateColumn || !valueColumn) return [];

  const monthly = {};

  data.forEach((row) => {
    const dateVal = row[dateColumn];
    const numVal = toNumber(row[valueColumn]);
    if (isNaN(numVal)) return;

    let date;
    if (dateVal instanceof Date) {
      date = dateVal;
    } else {
      date = new Date(dateVal);
    }

    if (isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });

    if (!monthly[key]) {
      monthly[key] = { month: key, label, total: 0, count: 0, profits: 0, losses: 0 };
    }

    monthly[key].total += numVal;
    monthly[key].count += 1;
    if (numVal > 0) monthly[key].profits += numVal;
    if (numVal < 0) monthly[key].losses += numVal;
  });

  return Object.values(monthly)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      ...m,
      total: Math.round(m.total * 100) / 100,
      profits: Math.round(m.profits * 100) / 100,
      losses: Math.round(m.losses * 100) / 100,
      avg: m.count ? Math.round((m.total / m.count) * 100) / 100 : 0,
    }));
}

/**
 * Group data by trade type (LONG/SHORT) and compute stats.
 */
export function computeTradeTypeBreakdown(data, tradeTypeColumn, valueColumn) {
  if (!tradeTypeColumn || !valueColumn) return [];

  const groups = {};

  data.forEach((row) => {
    const type = String(row[tradeTypeColumn] || '').trim().toUpperCase();
    const numVal = toNumber(row[valueColumn]);
    if (!type || isNaN(numVal)) return;

    // Normalize trade types
    let normalizedType = type;
    if (/^(LONG|BUY|CALL)$/.test(type)) normalizedType = 'LONG';
    else if (/^(SHORT|SELL|PUT)$/.test(type)) normalizedType = 'SHORT';

    if (!groups[normalizedType]) {
      groups[normalizedType] = { type: normalizedType, total: 0, count: 0, avgPnL: 0, profits: 0, losses: 0 };
    }

    groups[normalizedType].total += numVal;
    groups[normalizedType].count += 1;
    if (numVal > 0) groups[normalizedType].profits += 1;
    if (numVal < 0) groups[normalizedType].losses += 1;
  });

  return Object.values(groups).map((g) => ({
    ...g,
    total: Math.round(g.total * 100) / 100,
    avgPnL: g.count ? Math.round((g.total / g.count) * 100) / 100 : 0,
  }));
}

/**
 * Generate a summary object suitable for storing in Supabase.
 */
export function generateParsedSummary(data, columns, columnTypes, primaryColumns) {
  const { numericColumns, pnlColumn, tradeTypeColumn, dateColumn } = primaryColumns;

  return {
    allStats: computeAllStats(data, numericColumns),
    tradeStats: computeTradeStats(data, pnlColumn),
    monthlyBreakdown: computeMonthlyBreakdown(data, dateColumn, pnlColumn),
    tradeTypeBreakdown: computeTradeTypeBreakdown(data, tradeTypeColumn, pnlColumn),
    primaryColumns,
    columnTypes,
    generatedAt: new Date().toISOString(),
  };
}
