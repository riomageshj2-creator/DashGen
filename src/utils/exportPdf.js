import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function getRGBColor(element) {
  const el = element || document.body;
  const bgColor = window.getComputedStyle(el).backgroundColor;
  const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return [245, 246, 250]; // fallback light bg
}

/**
 * Export a DOM element as a PDF.
 */
export async function exportDashboardPdf(elementRef, fileName = 'dashboard-report.pdf') {
  if (!elementRef?.current) {
    throw new Error('No element reference provided for PDF export.');
  }

  const element = elementRef.current;
  const rgbBg = getRGBColor(document.body);
  const hexBg = `#${rgbBg.map(x => x.toString(16).padStart(2, '0')).join('')}`;

  // Capture the element as a canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: hexBg,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');

  // Convert to original CSS dimensions (since scale: 2 was used)
  const cssWidth = canvas.width / 2;
  const cssHeight = canvas.height / 2;

  // Add comfortable padding around the dashboard
  const padding = 40; // 40px
  const pdfWidth = cssWidth + (padding * 2);
  const pdfHeight = cssHeight + (padding * 2);

  // Create a single-page PDF that fits everything seamlessly without cutting
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'l' : 'p',
    unit: 'px',
    format: [pdfWidth, pdfHeight]
  });

  // Fill the entire PDF with the matching background color
  pdf.setFillColor(rgbBg[0], rgbBg[1], rgbBg[2]);
  pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

  // Add the captured image inside the padded area
  pdf.addImage(imgData, 'PNG', padding, padding, cssWidth, cssHeight);

  pdf.save(fileName);
}

/**
 * Export insights data as a CSV download.
 */
export function downloadInsightsCSV(summary, fileName = 'dashboard-insights.csv') {
  if (!summary) return;

  const lines = [];

  // Trade Stats
  if (summary.tradeStats) {
    lines.push('=== Trade Summary ===');
    lines.push(`Total Trades,${summary.tradeStats.totalTrades}`);
    lines.push(`Total P&L,${summary.tradeStats.totalPnL}`);
    lines.push(`Average P&L,${summary.tradeStats.avgPnL}`);
    lines.push(`Max Profit,${summary.tradeStats.maxProfit}`);
    lines.push(`Max Loss,${summary.tradeStats.maxLoss}`);
    lines.push(`Win Rate,${summary.tradeStats.winRate}%`);
    lines.push(`Profitable Trades,${summary.tradeStats.profitCount}`);
    lines.push(`Loss Trades,${summary.tradeStats.lossCount}`);
    lines.push('');
  }

  // Monthly breakdown
  if (summary.monthlyBreakdown?.length > 0) {
    lines.push('=== Monthly Breakdown ===');
    lines.push('Month,Total P&L,Trades,Average');
    summary.monthlyBreakdown.forEach((m) => {
      lines.push(`${m.label},${m.total},${m.count},${m.avg}`);
    });
    lines.push('');
  }

  // Trade type breakdown
  if (summary.tradeTypeBreakdown?.length > 0) {
    lines.push('=== Trade Type Breakdown ===');
    lines.push('Type,Total P&L,Count,Average P&L');
    summary.tradeTypeBreakdown.forEach((t) => {
      lines.push(`${t.type},${t.total},${t.count},${t.avgPnL}`);
    });
    lines.push('');
  }

  // All column stats
  if (summary.allStats) {
    lines.push('=== Column Statistics ===');
    lines.push('Column,Sum,Average,Min,Max,Count');
    Object.entries(summary.allStats).forEach(([col, stats]) => {
      lines.push(`${col},${stats.sum},${stats.avg},${stats.min},${stats.max},${stats.count}`);
    });
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
