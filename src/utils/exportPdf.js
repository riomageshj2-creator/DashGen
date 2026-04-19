import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export a DOM element as a PDF.
 */
export async function exportDashboardPdf(elementRef, fileName = 'dashboard-report.pdf') {
  if (!elementRef?.current) {
    throw new Error('No element reference provided for PDF export.');
  }

  const element = elementRef.current;

  // Capture the element as a canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');

  // Create PDF
  const pdf = new jsPDF('l', 'mm', 'a4'); // landscape for dashboards
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Scale image to fit page width
  const ratio = pdfWidth / imgWidth;
  const scaledHeight = imgHeight * ratio;

  // Handle multi-page if dashboard is very tall
  let yPosition = 0;
  let remainingHeight = scaledHeight;

  while (remainingHeight > 0) {
    if (yPosition > 0) {
      pdf.addPage();
    }

    pdf.addImage(imgData, 'PNG', 0, -yPosition, pdfWidth, scaledHeight);
    yPosition += pdfHeight;
    remainingHeight -= pdfHeight;
  }

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
