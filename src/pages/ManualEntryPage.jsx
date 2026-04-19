import { useState } from 'react';
import { PenTool, Plus, Trash2, Check } from 'lucide-react';
import PageHero from '../components/Layout/PageHero';

const DEFAULT_COLUMNS = [
  'S.NO', 'TYPE', 'CODE', 'DATE/TIME', 'SIGNAL', 
  'PRICE', 'NET P&L', 'CONTROLED BUY', 'CONTROLED SELLING', 
  'NAKED BUY', 'NAKED SELL'
];

export default function ManualEntryPage({ onProcessData }) {
  const [rows, setRows] = useState([
    Object.fromEntries(DEFAULT_COLUMNS.map(col => [col, '']))
  ]);
  const [fileName, setFileName] = useState('Manual_Data_Entry');

  const addRow = () => {
    setRows([...rows, Object.fromEntries(DEFAULT_COLUMNS.map(col => [col, '']))]);
  };

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleChange = (e, index, col) => {
    const newRows = [...rows];
    newRows[index][col] = e.target.value;
    setRows(newRows);
  };

  const handleSubmit = () => {
    // Check if at least one row has some data to prevent empty submissions
    const hasData = rows.some(row => Object.values(row).some(val => String(val).trim() !== ''));
    if (!hasData) {
      alert("Please enter some data before generating a dashboard.");
      return;
    }
    
    // Clean empty rows before passing them to the dashboard processor
    const cleanedRows = rows.filter(row => Object.values(row).some(val => String(val).trim() !== ''));
    
    // Pass the raw data array directly down as if it was parsed from Excel
    onProcessData(cleanedRows, fileName);
  };

  return (
    <div className="fade-in">
      <PageHero 
        title="Manual Data Entry"
        description="Enter your trade data manually using the exact required columns to generate your dashboard instantly."
        icon={PenTool}
      />

      <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Dashboard Name:</label>
            <input 
              type="text" 
              className="form-input" 
              value={fileName} 
              onChange={(e) => setFileName(e.target.value)}
              style={{ width: '250px', padding: '8px 12px' }}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={addRow} title="Add a new row to the table">
            <Plus size={16} /> Add Row
          </button>
        </div>

        <div className="table-container" style={{ overflowX: 'auto', marginBottom: '24px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                {DEFAULT_COLUMNS.map(col => (
                  <th key={col} style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>{col}</th>
                ))}
                <th style={{ width: '50px', padding: '12px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {DEFAULT_COLUMNS.map(col => (
                    <td key={col} style={{ padding: '8px 12px' }}>
                      <input 
                        type="text" 
                        value={row[col]} 
                        onChange={(e) => handleChange(e, index, col)}
                        style={{ 
                          width: '100%', 
                          minWidth: '120px', 
                          border: '1px solid transparent', 
                          borderRadius: '4px', 
                          padding: '8px', 
                          background: 'var(--bg-primary)', 
                          color: 'var(--text-primary)',
                          transition: 'border-color 0.2s',
                          fontSize: '14px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                        placeholder={`Enter ${col.toLowerCase()}`}
                      />
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => removeRow(index)} 
                      disabled={rows.length === 1} 
                      title="Delete row"
                      style={{ 
                        color: rows.length === 1 ? 'var(--text-tertiary)' : 'var(--danger)', 
                        opacity: rows.length === 1 ? 0.5 : 1,
                        cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
                        padding: '6px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button className="btn btn-primary" onClick={handleSubmit} style={{ padding: '12px 32px', fontSize: '16px' }}>
            <Check size={18} style={{ marginRight: '8px' }} />
            Generate Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
