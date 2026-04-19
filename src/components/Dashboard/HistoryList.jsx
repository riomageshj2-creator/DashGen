import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Calendar, Table, Trash2, ArrowRight } from 'lucide-react';

export default function HistoryList({ onSelectDashboard, onDeleteDashboard }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timed out. Please check your network or verify if your Supabase project is active.')), 10000);
      });

      const fetchPromise = supabase
        .from('uploaded_files')
        .select('*')
        .order('created_at', { ascending: false });

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const { data, error: dbError } = result;

      if (dbError) throw dbError;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      if (err.message && err.message.includes('JWT expired')) {
        await supabase.auth.signOut();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this preserved dashboard?')) return;
    
    try {
      await onDeleteDashboard(id);

      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Failed to delete dashboard: ${err.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="history-empty fade-in" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading saved dashboards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-empty fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--danger)', marginBottom: '20px', fontSize: '15px' }}>
          <strong>Error loading history:</strong> {error}
        </div>
        <button className="btn btn-primary" onClick={fetchHistory} style={{ margin: '0 auto' }}>
          Retry Connection
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-empty fade-in" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
        <FileText size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Saved Dashboards</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          You haven't saved any dashboards yet. Upload a file and use the "Save to Cloud" button to preserve it here.
        </p>
      </div>
    );
  }

  const filteredHistory = history.filter(item => 
    (item.file_name || 'Dashboard').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search saved dashboards..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
          style={{ maxWidth: '400px', flex: 1 }}
        />
      </div>

      {filteredHistory.length === 0 ? (
        <div className="history-empty fade-in" style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No dashboards match your search query.</p>
        </div>
      ) : (
        <div className="history-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredHistory.map((item) => {
            const stats = item.parsed_summary?.tradeStats || {};
        const isWin = (stats.totalPnL || 0) >= 0;
        
        return (
          <div 
            key={item.id} 
            className="history-card"
            onClick={() => onSelectDashboard(item)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--text-primary)', fontWeight: 600 }}>{item.file_name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                  <Calendar size={12} />
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                  })}
                </div>
              </div>
              <button 
                className="btn-icon" 
                onClick={(e) => handleDelete(e, item.id)}
                style={{ color: 'var(--text-tertiary)', width: '32px', height: '32px' }}
                title="Delete saved dashboard"
              >
                <Trash2 size={16} pointerEvents="none" style={{ pointerEvents: 'none' }} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>Total P&L</div>
                <div style={{ color: isWin ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '18px' }}>
                   ₹{Math.abs(stats.totalPnL || 0).toLocaleString()}
                </div>
              </div>
              <div>
                 <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>Total Trades</div>
                 <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '18px' }}>
                    {(stats.totalTrades || 0).toLocaleString()}
                 </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', alignItems: 'center', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 500,
              gap: '6px'
            }}>
              Open Dashboard <ArrowRight size={14} />
            </div>
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
}
