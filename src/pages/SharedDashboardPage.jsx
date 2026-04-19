import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { computeAllStats, computeTradeStats, computeMonthlyBreakdown, computeTradeTypeBreakdown } from '../utils/calculations';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DateFilter from '../components/Dashboard/DateFilter';
import StatsCards from '../components/Dashboard/StatsCards';
import MonthlyLineChart from '../components/Charts/MonthlyLineChart';
import ProfitLossPie from '../components/Charts/ProfitLossPie';
import TradesByCodeChart from '../components/Charts/TradesByCodeChart';
import FourPlanChart from '../components/Charts/FourPlanChart';
import FourPlanMonthlyChart from '../components/Charts/FourPlanMonthlyChart';
import DataTable from '../components/Dashboard/DataTable';
import ThemeToggle from '../components/Layout/ThemeToggle';
import { Activity } from 'lucide-react';
import PageHero from '../components/Layout/PageHero';

export default function SharedDashboardPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filteredRows, setFilteredRows] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function loadShared() {
      try {
        setLoading(true);
        const { data: fileRecord, error: dbError } = await supabase
          .from('uploaded_files')
          .select('*')
          .eq('id', id)
          .single();

        if (dbError) throw dbError;
        
        if (!fileRecord.is_public) {
          throw new Error("This dashboard is not publicly shared.");
        }

        const summaryData = fileRecord.parsed_summary;
        const rawData = summaryData.rawData || [];
        
        setData({
          file_name: fileRecord.file_name,
          rawData: rawData,
          columns: fileRecord.column_names,
          dateColumn: summaryData.dateColumn,
          pnlColumn: summaryData.pnlColumn,
          planColumn: summaryData.planColumn,
          initialSummary: summaryData
        });

      } catch (err) {
        console.error('Error loading shared dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadShared();
  }, [id]);

  // Apply Date Filters if rawdata available
  useEffect(() => {
    if (!data || !data.rawData) return;
    
    let rows = [...data.rawData];
    if (data.dateColumn && (dateRange.start || dateRange.end)) {
      const getMs = (val) => {
        if (!val) return null;
        if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000)).getTime();
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d.getTime();
      };
      
      const startMs = dateRange.start ? new Date(dateRange.start).getTime() : null;
      const endMs = dateRange.end ? new Date(dateRange.end + 'T23:59:59').getTime() : null;
      
      rows = rows.filter(row => {
        const ms = getMs(row[data.dateColumn]);
        if (!ms) return false;
        if (startMs && ms < startMs) return false;
        if (endMs && ms > endMs) return false;
        return true;
      });
    }

    setFilteredRows(rows);

    if (rows.length === data.rawData.length) {
      setSummary(data.initialSummary);
    } else {
      if (data.pnlColumn) {
        setSummary({
          allStats: computeAllStats(rows, data.initialSummary.primaryColumns?.numericColumns),
          tradeStats: computeTradeStats(rows, data.pnlColumn),
          monthlyBreakdown: computeMonthlyBreakdown(rows, data.dateColumn, data.pnlColumn),
          tradeTypeBreakdown: computeTradeTypeBreakdown(rows, data.initialSummary.primaryColumns?.tradeTypeColumn, data.pnlColumn),
          primaryColumns: data.initialSummary.primaryColumns
        });
      } else {
        setSummary(data.initialSummary); // fallback
      }
    }

  }, [data, dateRange]);

  if (loading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="spinner spinner-lg" />
        <p style={{ color: 'var(--text-primary)' }}>Loading shared dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="empty-state">
          <PageHero title="Dashboard Unavailable" description={error || "Dashboard not found."} icon={Activity} variant="danger" />
          <Link to="/" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-block' }}>
            Go to App
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Read Only Shared Navbar */}
      <nav style={{ 
        height: '64px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={24} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>DashGen <span style={{ color: 'var(--text-tertiary)', fontWeight: 500, marginLeft: 4 }}>Shared</span></h2>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <ThemeToggle />
          <Link to="/" className="btn btn-primary btn-sm">Build Your Own</Link>
        </div>
      </nav>

      <main style={{ padding: '32px 24px', maxWidth: '1440px', margin: '0 auto' }}>
        <PageHero 
          title={data.file_name}
          description="This dashboard was shared with you securely via DashGen."
          icon={Activity}
          variant="primary"
        />

        <div style={{ marginBottom: '24px' }}>
           <DateFilter 
             dateRange={dateRange} 
             onDateChange={setDateRange} 
             dateColumn={data.dateColumn} 
           />
        </div>

        {summary && <StatsCards summary={summary} />}

        <div className="charts-grid">
          {summary && (
            <>
              <MonthlyLineChart monthlyStats={summary.monthlyStats} />
              <ProfitLossPie tradeStats={summary.tradeStats} />
              <FourPlanChart tradeStats={summary.tradeStats} />
              <TradesByCodeChart codeStats={summary.codeStats} />
            </>
          )}
        </div>

        {data.dateColumn && data.pnlColumn && (
          <FourPlanMonthlyChart 
            data={filteredRows} 
            columns={data.columns} 
          />
        )}

        <div className="data-table-wrapper slide-up" style={{ animationDelay: '0.2s', marginTop: '32px' }}>
          <DataTable data={filteredRows} columns={data.columns} />
        </div>
      </main>
    </div>
  );
}
