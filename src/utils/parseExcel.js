import * as XLSX from 'xlsx';

/**
 * Parse an uploaded file (Excel or CSV) into JSON data.
 * Returns { data, columns, sheetNames }
 * NEVER modifies original file data — we work on a parsed copy.
 */
export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
        const sheetNames = workbook.SheetNames;
        const firstSheet = workbook.Sheets[sheetNames[0]];

        // Log merge info for debugging
        if (firstSheet['!merges']) {
          console.log('=== MERGE RANGES ===');
          console.log(`Total merges: ${firstSheet['!merges'].length}`);
          // Show first 10 merges
          firstSheet['!merges'].slice(0, 10).forEach((m, idx) => {
            const startRef = XLSX.utils.encode_cell(m.s);
            const endRef = XLSX.utils.encode_cell(m.e);
            const topCell = firstSheet[startRef];
            console.log(`Merge ${idx}: ${startRef}:${endRef} | Top cell value: ${topCell ? JSON.stringify(topCell.v) : 'EMPTY'}`);
          });
        }

        // Parse WITHOUT merge fill — let SheetJS handle it naturally
        const rawData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (rawData.length === 0) {
          reject(new Error('The uploaded file contains no data.'));
          return;
        }

        // Debug: log first 6 raw rows
        console.log('=== RAW DATA (first 6 rows) ===');
        rawData.slice(0, 6).forEach((row, i) => {
          const summary = Object.entries(row)
            .map(([k, v]) => `${k}=${v === '' ? '""' : v}`)
            .join(' | ');
          console.log(`Row ${i}: ${summary}`);
        });

        // FIX 1: Convert date serials
        convertDateSerialsToStrings(rawData);

        // FIX 3: Remove summary rows
        let cleanData = filterSummaryRows(rawData);

        // FIX 4: Filter garbage columns
        const allColumns = Object.keys(cleanData[0] || {});
        const cleanColumns = filterColumns(allColumns, cleanData);

        resolve({
          data: cleanData,
          columns: cleanColumns,
          allColumns,
          sheetNames,
          sheetCount: sheetNames.length,
          rowCount: cleanData.length,
        });
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

/* Data is kept exactly as Excel stores it — no row manipulation */



function convertDateSerialsToStrings(data) {
  if (data.length === 0) return;

  const columns = Object.keys(data[0]);
  const dateColumns = [];

  columns.forEach(col => {
    const nameMatch = /date|time|timestamp|created|updated/i.test(col);
    const sampleSize = Math.min(data.length, 30);
    let dateSerialCount = 0;
    let nonEmptyCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const val = data[i][col];
      if (val === '' || val === null || val === undefined) continue;
      nonEmptyCount++;
      if (typeof val === 'number' && val > 25000 && val < 73050 && Number.isInteger(val)) {
        dateSerialCount++;
      }
    }

    const serialRatio = nonEmptyCount > 0 ? dateSerialCount / nonEmptyCount : 0;
    if ((nameMatch && serialRatio > 0.3) || serialRatio > 0.7) {
      dateColumns.push(col);
    }
  });

  if (dateColumns.length > 0) {
    data.forEach(row => {
      dateColumns.forEach(col => {
        const val = row[col];
        if (typeof val === 'number' && val > 0 && val < 73050) {
          row[col] = excelSerialToDateString(val);
        }
      });
    });
  }
}

function excelSerialToDateString(serial) {
  let adjustedSerial = serial;
  if (serial > 59) adjustedSerial = serial - 1;

  const msPerDay = 86400000;
  const epoch1900 = new Date(1900, 0, 1).getTime();
  const dateMs = epoch1900 + (adjustedSerial - 1) * msPerDay;
  const date = new Date(dateMs);

  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function filterSummaryRows(data) {
  if (data.length === 0) return data;

  const columns = Object.keys(data[0]);
  const summaryPattern = /^(total|percentage|average|sum|count|grand total|sub total|subtotal|four big|big negative|big positive|overall|net total|row labels)/i;

  return data.filter(row => {
    for (const col of columns) {
      const val = row[col];
      if (typeof val === 'string' && val.trim() && summaryPattern.test(val.trim())) {
        return false;
      }
    }
    return true;
  });
}

function filterColumns(columns, data) {
  const sampleSize = Math.min(data.length, 50);
  const sample = data.slice(0, sampleSize);

  return columns.filter(col => {
    if (/^__EMPTY/i.test(col)) return false;
    const nonEmpty = sample.filter(
      row => row[col] !== '' && row[col] !== null && row[col] !== undefined
    ).length;
    return (nonEmpty / sampleSize) > 0.05;
  });
}

export function parseAllSheets(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array', cellDates: false });
        const sheets = {};

        workbook.SheetNames.forEach(name => {
          const sheet = workbook.Sheets[name];
          let data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          convertDateSerialsToStrings(data);
          data = filterSummaryRows(data);
          sheets[name] = data;
        });

        resolve(sheets);
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}
