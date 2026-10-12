import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, Plus, Search, Eye, ArrowRight, Trash2, X, Printer
} from 'lucide-react';
import { api } from '../services/api';

export default function Quotations({ onPreviewInvoice }) {
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    quotation_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    currency: 'PKR',
    subject: 'Software Services Proposal',
    tax_rate: 0,
    notes: 'Quotation valid for 30 calendar days.',
    terms: '50% advance upon project kickoff, 50% upon deployment.',
    items: [
      { description: 'Custom ERP & Mobile Application Development', quantity: 1, unit_price: 150000 }
    ]
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [qRes, cRes] = await Promise.all([
        api.getQuotations(),
        api.getClients()
      ]);
      if (qRes.success) setQuotations(qRes.quotations);
      if (cRes.success) setClients(cRes.clients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    const today = new Date();
    setFormData({
      client_id: clients[0]?.id || '',
      quotation_number: 'QT-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(100 + Math.random() * 900),
      issue_date: today.toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      currency: 'PKR',
      subject: 'Software Engineering Proposal',
      tax_rate: 0,
      notes: 'Quotation valid for 30 calendar days.',
      terms: '50% advance on agreement, 50% on UAT completion.',
      items: [
        { description: 'Custom Cloud Architecture & Mobile App Solution', quantity: 1, unit_price: 150000 }
      ]
    });
    setShowAddModal(true);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const handleRemoveItem = (idx) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemChange = (idx, field, val) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[idx][field] = val;
      return { ...prev, items };
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createQuotation(formData);
      if (res.success) {
        setShowAddModal(false);
        loadData();
      }
    } catch (err) {
      alert('Error creating quotation: ' + err.message);
    }
  };

  const handleConvertToInvoice = async (quoteId) => {
    if (!window.confirm('Convert this quotation into an official invoice now?')) return;
    try {
      const res = await api.convertQuotation(quoteId);
      if (res.success) {
        alert(res.message);
        loadData();
        const invFull = await api.getInvoice(res.invoice_id);
        if (invFull.success && onPreviewInvoice) {
          onPreviewInvoice(invFull);
        }
      }
    } catch (err) {
      alert('Error converting quotation: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quotation?')) return;
    try {
      const res = await api.deleteQuotation(id);
      if (res.success) loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>
            Quotations & Estimates
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Create formal project estimates and convert directly to invoices with 1 click
          </span>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Create New Quotation
        </button>
      </div>

      {/* Quotations Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Client / Company</th>
                <th>Subject</th>
                <th>Issue Date</th>
                <th>Valid Until</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No quotations generated yet. Click "Create New Quotation".
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id}>
                    <td><strong style={{ color: '#A78BFA' }}>{q.quotation_number}</strong></td>
                    <td>
                      <div><strong>{q.client_name}</strong></div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{q.company_name}</div>
                    </td>
                    <td>{q.subject}</td>
                    <td>{q.issue_date}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{q.valid_until}</td>
                    <td><strong>{Number(q.total_amount).toLocaleString()} {q.currency}</strong></td>
                    <td>
                      <span className={`badge badge-${q.status === 'converted' ? 'paid' : 'sent'}`}>
                        {q.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {q.status !== 'converted' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            title="Convert to Active Invoice"
                            onClick={() => handleConvertToInvoice(q.id)}
                          >
                            <ArrowRight size={13} /> Invoice
                          </button>
                        )}
                        <button 
                          className="btn btn-icon btn-sm"
                          style={{ color: '#EF4444' }}
                          onClick={() => handleDelete(q.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>New Quotation Proposal</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select 
                      className="form-control"
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      required
                    >
                      <option value="">Select Client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.company_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quotation Number</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.quotation_number}
                      onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select 
                      className="form-control"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <option value="PKR">PKR</option>
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Proposal Subject *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issue Date</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid Until</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Quotation Items</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
                      <Plus size={14} /> Add Item
                    </button>
                  </div>

                  {formData.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 140px 120px 40px', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <input 
                        type="text"
                        placeholder="Description of deliverables"
                        className="form-control"
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        required
                      />
                      <input 
                        type="number"
                        min="1"
                        className="form-control"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        required
                      />
                      <input 
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={it.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        required
                      />
                      <div style={{ textAlign: 'right', fontWeight: 700, color: '#A78BFA' }}>
                        {(Number(it.quantity || 0) * Number(it.unit_price || 0)).toLocaleString()} {formData.currency}
                      </div>
                      <button 
                        type="button" 
                        className="btn-icon" 
                        style={{ color: '#EF4444' }}
                        disabled={formData.items.length === 1}
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '260px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#A78BFA' }}>
                    <span>Total Estimated:</span>
                    <span>{calculateSubtotal().toLocaleString()} {formData.currency}</span>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
