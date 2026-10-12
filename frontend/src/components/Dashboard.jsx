import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, AlertCircle, 
  CheckCircle2, Calendar, FileText, ArrowUpRight, Plus, RefreshCw, Eye
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ onNavigate, onPreviewInvoice }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleBillRetainer = async (projectId) => {
    if (!window.confirm('Generate monthly retainer invoice for this project now?')) return;
    try {
      setBillingLoading(true);
      const res = await api.generateRetainerInvoice(projectId);
      if (res.success) {
        alert(res.message);
        fetchDashboard();
        // Load and preview invoice
        const invRes = await api.getInvoice(res.invoice_id);
        if (invRes.success && onPreviewInvoice) {
          onPreviewInvoice(invRes);
        }
      }
    } catch (err) {
      alert('Error generating invoice: ' + err.message);
    } finally {
      setBillingLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
        <RefreshCw size={28} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px' }}>Loading Financial Intelligence...</p>
      </div>
    );
  }

  const { metrics = {}, upcoming_retainers = [], recent_invoices = [], recent_payments = [], recent_expenses = [], monthly_trends = [] } = data || {};

  // Find max value in monthly trends for chart scaling
  const maxTrendVal = Math.max(
    ...monthly_trends.map(t => Math.max(parseFloat(t.income || 0), parseFloat(t.expense || 0))),
    100000
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Retainer Alert Banner if running projects due */}
      {upcoming_retainers.length > 0 && (
        <div style={{
          background: 'var(--info-bg)',
          border: '1px solid var(--info-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(37, 99, 235, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Recurring Monthly Retainers ({metrics.active_retainers} Active)
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Next billing for <strong>{upcoming_retainers[0]?.project_name}</strong> ({upcoming_retainers[0]?.client_name}): {upcoming_retainers[0]?.next_billing_date || 'Due Now'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-primary btn-sm"
              disabled={billingLoading}
              onClick={() => handleBillRetainer(upcoming_retainers[0]?.id)}
            >
              <FileText size={14} /> Bill {upcoming_retainers[0]?.project_name?.slice(0, 18)}...
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('projects')}
            >
              View All Projects
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        
        {/* Total Invoiced */}
        <div className="metric-card" style={{ '--accent-color': '#3B82F6' }}>
          <div className="metric-header">
            <span className="metric-label">Total Invoiced</span>
            <div className="metric-icon-wrap" style={{ color: '#3B82F6' }}>
              <FileText size={18} />
            </div>
          </div>
          <div className="metric-value">
            Rs. {Number(metrics.total_invoiced || 0).toLocaleString()}
          </div>
          <div className="metric-subtext">
            <span>All time billed client contracts</span>
          </div>
        </div>

        {/* Revenue Collected */}
        <div className="metric-card" style={{ '--accent-color': '#10B981' }}>
          <div className="metric-header">
            <span className="metric-label">Revenue Collected</span>
            <div className="metric-icon-wrap" style={{ color: '#10B981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#34D399' }}>
            Rs. {Number(metrics.total_collected || 0).toLocaleString()}
          </div>
          <div className="metric-subtext" style={{ color: '#34D399' }}>
            <TrendingUp size={14} />
            <span>Cleared client payments</span>
          </div>
        </div>

        {/* Receivables Due */}
        <div className="metric-card" style={{ '--accent-color': metrics.total_receivable > 0 ? '#F59E0B' : '#64748B' }}>
          <div className="metric-header">
            <span className="metric-label">Pending Receivables</span>
            <div className="metric-icon-wrap" style={{ color: '#F59E0B' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: metrics.total_receivable > 0 ? '#FBBF24' : 'inherit' }}>
            Rs. {Number(metrics.total_receivable || 0).toLocaleString()}
          </div>
          <div className="metric-subtext">
            {metrics.overdue_count > 0 ? (
              <span style={{ color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {metrics.overdue_count} Overdue (Rs. {Number(metrics.overdue_amount).toLocaleString()})
              </span>
            ) : (
              <span>All invoices currently on track</span>
            )}
          </div>
        </div>

        {/* Total Expenses */}
        <div className="metric-card" style={{ '--accent-color': '#EF4444' }}>
          <div className="metric-header">
            <span className="metric-label">Operational Outflows</span>
            <div className="metric-icon-wrap" style={{ color: '#EF4444' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#F87171' }}>
            Rs. {Number(metrics.total_expenses || 0).toLocaleString()}
          </div>
          <div className="metric-subtext">
            <span>Servers, contractor pay & ops</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="metric-card" style={{ '--accent-color': '#8B5CF6' }}>
          <div className="metric-header">
            <span className="metric-label">Net Financial Profit</span>
            <div className="metric-icon-wrap" style={{ color: '#8B5CF6' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: metrics.net_profit >= 0 ? '#A78BFA' : '#F87171' }}>
            Rs. {Number(metrics.net_profit || 0).toLocaleString()}
          </div>
          <div className="metric-subtext">
            <span>Collected Revenue minus Expenses</span>
          </div>
        </div>

        {/* Monthly Retainers MRR */}
        <div className="metric-card" style={{ '--accent-color': '#06B6D4' }}>
          <div className="metric-header">
            <span className="metric-label">Monthly Retainer MRR</span>
            <div className="metric-icon-wrap" style={{ color: '#06B6D4' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#22D3EE' }}>
            Rs. {Number(metrics.mrr_pkr || 0).toLocaleString()}
          </div>
          <div className="metric-subtext">
            <span>{metrics.active_retainers} recurring software clients</span>
          </div>
        </div>

      </div>

      {/* Middle Row: Financial Trends Visual Chart + Quick Retainer Manager */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Monthly Trend Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} style={{ color: '#3B82F6' }} />
              <span>Monthly Cash Inflow vs Outflow</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '2px' }}></span> Inflow
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '2px' }}></span> Outflow
              </span>
            </div>
          </div>

          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {monthly_trends.map((item, idx) => {
              const incH = Math.max(6, (parseFloat(item.income || 0) / maxTrendVal) * 180);
              const expH = Math.max(6, (parseFloat(item.expense || 0) / maxTrendVal) * 180);

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                    {/* Income Bar */}
                    <div 
                      title={`Income: Rs. ${Number(item.income).toLocaleString()}`}
                      style={{ 
                        width: '40%', 
                        maxWidth: '22px', 
                        height: `${incH}px`, 
                        background: 'linear-gradient(180deg, #34D399, #059669)', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease'
                      }} 
                    />
                    {/* Expense Bar */}
                    <div 
                      title={`Expense: Rs. ${Number(item.expense).toLocaleString()}`}
                      style={{ 
                        width: '40%', 
                        maxWidth: '22px', 
                        height: `${expH}px`, 
                        background: 'linear-gradient(180deg, #F87171, #DC2626)', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease'
                      }} 
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {item.month_label?.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Last 6 Months Real-time Activity</span>
            <span>Amounts in Base Currency (PKR)</span>
          </div>
        </div>

        {/* Retainers & Projects Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Calendar size={18} style={{ color: '#06B6D4' }} />
              <span>Active Software Retainers</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('projects')}>
              Manage Retainers
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcoming_retainers.map((proj) => (
              <div 
                key={proj.id}
                className="inner-box"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {proj.project_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Client: {proj.client_name} ({proj.company_name})
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--primary)', marginTop: '3px', fontWeight: 600 }}>
                    Next Billing: {proj.next_billing_date || 'Due'} &bull; Cycle Day: {proj.billing_cycle_day}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {Number(proj.billing_rate).toLocaleString()} {proj.currency}
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '6px' }}
                    onClick={() => handleBillRetainer(proj.id)}
                  >
                    <Plus size={12} /> Bill Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Invoices Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={18} style={{ color: '#3B82F6' }} />
            <span>Recent Invoices</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('invoices')}>
              <Plus size={14} /> New Invoice
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('invoices')}>
              View All
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Ref No</th>
                <th>Client / Company</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent_invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <strong style={{ color: '#60A5FA' }}>{inv.invoice_number}</strong>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{inv.ref_no}</span>
                  </td>
                  <td>
                    <div><strong>{inv.client_name}</strong></div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{inv.company_name}</div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv.subject}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{inv.issue_date}</td>
                  <td>
                    <strong>{Number(inv.total_amount).toLocaleString()} {inv.currency}</strong>
                  </td>
                  <td>
                    <span className={`badge badge-${inv.status}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      title="View & Print Official Branded Invoice"
                      onClick={async () => {
                        const full = await api.getInvoice(inv.id);
                        if (full.success && onPreviewInvoice) {
                          onPreviewInvoice(full);
                        }
                      }}
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
