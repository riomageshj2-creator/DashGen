/**
 * Column Detector — Automatically classifies columns by type.
 * Scans data to determine: date, number, text, boolean
 * Also detects semantic meaning: pnl, tradeType, etc.
 */

const DATE_PATTERNS = /date|time|timestamp|created|updated|day|month|year/i;
const PNL_PATTERNS = /profit|loss|p&l|pnl|p\.l|pl|return|gain|result|amount|net|revenue|income|earning/i;
const TRADE_TYPE_PATTERNS = /type|side|direction|position|trade.?type|order.?type|action/i;
const TRADE_TYPE_VALUES = /^(long|short|buy|sell|call|put)$/i;

/**
 * Check if a value looks like a date
 */
function isDateValue(value) {
  if (value instanceof Date) return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  // Try to parse as date
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return false;
  // Reject pure numbers that happen to parse as dates
  if (/^\d+$/.test(trimmed) && trimmed.length < 6) return false;
  return true;
}

/**
 * Check if a value is numeric
 */
function isNumericValue(value) {
  if (typeof value === 'number') return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim().replace(/[,$%]/g, '');
  if (!trimmed) return false;
  return !isNaN(Number(trimmed));
}

/**
 * Convert a value to number
 */
export function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  const cleaned = value.trim().replace(/[,$%]/g, '');
  if (cleaned === '') return NaN;
  return Number(cleaned);
}

/**
 * Detect column types from data
 * Returns an object: { columnName: { type, semantic } }
 */
export function detectColumnTypes(data, columns) {
  const sampleSize = Math.min(data.length, 100);
  const sample = data.slice(0, sampleSize);
  const result = {};

  columns.forEach((col) => {
    const values = sample.map((row) => row[col]).filter((v) => v !== '' && v !== null && v !== undefined);
    const totalNonEmpty = values.length;

    if (totalNonEmpty === 0) {
      result[col] = { type: 'text', semantic: null };
      return;
    }

    // Count types
    const dateCount = values.filter(isDateValue).length;
    const numCount = values.filter(isNumericValue).length;
    const tradeTypeCount = values.filter((v) => TRADE_TYPE_VALUES.test(String(v).trim())).length;

    const dateRatio = dateCount / totalNonEmpty;
    const numRatio = numCount / totalNonEmpty;
    const tradeTypeRatio = tradeTypeCount / totalNonEmpty;

    let type = 'text';
    let semantic = null;

    // Determine type
    if (dateRatio > 0.7) {
      type = 'date';
    } else if (numRatio > 0.7) {
      type = 'number';
    } else if (tradeTypeRatio > 0.5) {
      type = 'text';
      semantic = 'tradeType';
    }

    // Determine semantic meaning from column name
    if (type === 'number' && PNL_PATTERNS.test(col)) {
      semantic = 'pnl';
    } else if (type === 'date' && DATE_PATTERNS.test(col)) {
      semantic = 'date';
    } else if (DATE_PATTERNS.test(col) && dateRatio > 0.5) {
      type = 'date';
      semantic = 'date';
    } else if (TRADE_TYPE_PATTERNS.test(col)) {
      semantic = 'tradeType';
    }

    // Fallback: if column name matches trade type pattern and values match
    if (!semantic && tradeTypeRatio > 0.5) {
      semantic = 'tradeType';
    }

    result[col] = { type, semantic };
  });

  return result;
}

/**
 * Find the primary columns for dashboard use
 */
export function findPrimaryColumns(columnTypes) {
  const result = {
    dateColumn: null,
    pnlColumn: null,
    tradeTypeColumn: null,
    numericColumns: [],
    allColumns: Object.keys(columnTypes),
  };

  Object.entries(columnTypes).forEach(([col, info]) => {
    if (info.type === 'number') {
      result.numericColumns.push(col);
    }
    if (info.semantic === 'date' || (info.type === 'date' && !result.dateColumn)) {
      result.dateColumn = col;
    }
    if (info.semantic === 'pnl' && !result.pnlColumn) {
      result.pnlColumn = col;
    }
    if (info.semantic === 'tradeType' && !result.tradeTypeColumn) {
      result.tradeTypeColumn = col;
    }
  });

  // If no explicit PNL column, use first numeric column
  if (!result.pnlColumn && result.numericColumns.length > 0) {
    result.pnlColumn = result.numericColumns[0];
  }

  return result;
}
