import {
  TrendingUp, TrendingDown, BarChart3, Hash,
  Target, Award, Percent, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function StatsCards({ summary, primaryColumns }) {
  if (!summary) return null;

  const { tradeStats, allStats } = summary;
  const cards = [];

  // Trade-specific cards (if PNL column detected)
  if (tradeStats) {
    cards.push({
      label: 'Total P&L',
      value: formatCurrency(tradeStats.totalPnL),
      valueClass: tradeStats.totalPnL >= 0 ? 'positive' : 'negative',
      icon: tradeStats.totalPnL >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
      iconClass: tradeStats.totalPnL >= 0 ? 'green' : 'red',
      sub: `From ${tradeStats.totalTrades} trades`,
    });

    cards.push({
      label: 'Total Trades',
      value: tradeStats.totalTrades.toLocaleString(),
      icon: <Hash size={18} />,
      iconClass: 'blue',
      sub: `${tradeStats.profitCount} wins · ${tradeStats.lossCount} losses`,
    });

    cards.push({
      label: 'Average P&L',
      value: formatCurrency(tradeStats.avgPnL),
      valueClass: tradeStats.avgPnL >= 0 ? 'positive' : 'negative',
      icon: <BarChart3 size={18} />,
      iconClass: 'purple',
      sub: 'Per trade',
    });


  }

  // Generic numeric column stats (show top 4 if no trade-specific columns)
  if (!tradeStats && allStats) {
    const numericCols = Object.keys(allStats).slice(0, 6);
    const icons = [DollarSign, BarChart3, TrendingUp, Hash, Target, Award];
    const colors = ['blue', 'purple', 'green', 'yellow', 'red', 'blue'];

    numericCols.forEach((col, i) => {
      const stats = allStats[col];
      const Icon = icons[i % icons.length];
      cards.push({
        label: col,
        value: formatNumber(stats.sum),
        icon: <Icon size={18} />,
        iconClass: colors[i % colors.length],
        sub: `Avg: ${formatNumber(stats.avg)} · Count: ${stats.count}`,
      });
    });
  }

  return (
    <div className="stats-grid">
      {cards.map((card, index) => (
        <div className="stat-card" key={index} style={{ animationDelay: `${index * 0.05}s` }}>
          <div className="stat-card-header">
            <span className="stat-card-label">{card.label}</span>
            <div className={`stat-card-icon ${card.iconClass}`}>{card.icon}</div>
          </div>
          <div className={`stat-card-value ${card.valueClass || ''}`}>{card.value}</div>
          {card.sub && <div className="stat-card-sub">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '0 Pts';
  const formatted = Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-${formatted} Pts` : `${formatted} Pts`;
}

function formatNumber(value) {
  if (value === undefined || value === null) return '0';
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
