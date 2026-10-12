import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Eye, DollarSign, Trash2, Edit3, 
  CheckCircle, Clock, AlertTriangle, ArrowRight, Printer, X
} from 'lucide-react';
import { api } from '../services/api';

export default function Invoices({ onPreviewInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);

  // New Invoice Form State
  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    invoice_number: '',
    ref_no: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    currency: 'PKR',
    subject: '',
    tax_rate: 0,
    discount_amount: 0,
    notes: 'Note: All prices are in PKR',
    terms_and_conditions: '',
    items: [
      { description: 'Production Management Software October-26', quantity: 1, unit_price: 40000 }
    ]
  });

  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_txn: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, clientRes, projRes] = await Promise.all([
        api.getInvoices({ status: statusFilter, search: searchTerm }),
        api.getClients(),
        api.getProjects()
      ]);
      if (invRes.success) setInvoices(invRes.invoices);
      if (clientRes.success) setClients(clientRes.clients);
      if (projRes.success) setProjects(projRes.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchTerm]);

  // Open Create Modal
  const openNewInvoiceModal = () => {
    const today = new Date();
    const dateFormatted = today.toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    const refNo = today.toISOString().split('T')[0].replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    const invNumber = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-${randNum}`;

    setFormData({
      client_id: clients[0]?.id || '',
      project_id: '',
      invoice_number: invNumber,
      ref_no: refNo,
      issue_date: dateFormatted,
      due_date: dueDate,
      currency: 'PKR',
      subject: 'Production Management Software ' + today.toLocaleString('default', { month: 'long' }) + '-' + String(today.getFullYear()).slice(-2),
      tax_rate: 0,
      discount_amount: 0,
      notes: 'Note: All prices are in PKR',
      terms_and_conditions: '',
      items: [
        { description: 'Production Management Software Maintenance', quantity: 1, unit_price: 40000 }
      ]
    });
    setShowCreateModal(true);
  };

  // Add Item Line
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  // Remove Item Line
  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Change Item Value
  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      return { ...prev, items: newItems };
    });
  };

  // Calculations
  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const tax = (sub * Number(formData.tax_rate || 0)) / 100;
    const disc = Number(formData.discount_amount || 0);
    return Math.max(0, sub + tax - disc);
  };

  // Submit Invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }
    try {
      const res = await api.createInvoice(formData);
      if (res.success) {
        setShowCreateModal(false);
        loadData();
        // Load and preview newly created invoice
        const full = await api.getInvoice(res.id);
        if (full.success && onPreviewInvoice) {
          onPreviewInvoice(full);
        }
      }
    } catch (err) {
      alert('Error creating invoice: ' + err.message);
    }
  };

  // Open Payment Modal
  const openRecordPayment = (inv) => {
    setSelectedInvoiceForPayment(inv);
    setPaymentData({
      amount: inv.balance_due,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      reference_txn: '',
      notes: `Payment for ${inv.invoice_number}`
    });
    setShowPaymentModal(true);
  };

  // Submit Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.recordPayment({
        invoice_id: selectedInvoiceForPayment.id,
        ...paymentData
      });
      if (res.success) {
        alert(res.message);
        setShowPaymentModal(false);
        loadData();
      }
    } catch (err) {
      alert('Error recording payment: ' + err.message);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id, num) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${num}?`)) return;
    try {
      const res = await api.deleteInvoice(id);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert('Error deleting invoice: ' + err.message);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>
            Invoices & Billing
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Generate, track, and print official ZAZSoft client invoices
          </span>
        </div>
        <button className="btn btn-primary" onClick={openNewInvoiceModal}>
          <Plus size={16} /> Create New Invoice
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['', 'sent', 'paid', 'partially_paid', 'draft'].map((st) => (
              <button
                key={st}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === '' ? 'All Invoices' : st.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search invoice #, ref, client..."
              className="form-control"
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* Invoices List Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Ref No</th>
                <th>Client / Organization</th>
                <th>Subject</th>
                <th>Issue Date</th>
                <th>Total</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No invoices found. Click "Create New Invoice" to generate one.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <strong style={{ color: '#60A5FA' }}>{inv.invoice_number}</strong>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                        {inv.ref_no}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.client_name}</div>
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
                      {Number(inv.balance_due) > 0 ? (
                        <span style={{ color: '#F87171', fontWeight: 700 }}>
                          {Number(inv.balance_due).toLocaleString()} {inv.currency}
                        </span>
                      ) : (
                        <span style={{ color: '#34D399', fontWeight: 600 }}>Cleared</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${inv.status}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        
                        {/* Preview / Print */}
                        <button 
                          className="btn btn-secondary btn-sm"
                          title="Print / PDF Branded Document"
                          onClick={async () => {
                            const full = await api.getInvoice(inv.id);
                            if (full.success && onPreviewInvoice) {
                              onPreviewInvoice(full);
                            }
                          }}
                        >
                          <Printer size={13} /> Print
                        </button>

                        {/* Record Payment */}
                        {Number(inv.balance_due) > 0 && (
                          <button 
                            className="btn btn-success btn-sm"
                            title="Record Payment"
                            onClick={() => openRecordPayment(inv)}
                          >
                            <DollarSign size={13} /> Pay
                          </button>
                        )}

                        {/* Delete */}
                        <button 
                          className="btn btn-icon btn-sm"
                          style={{ color: '#EF4444' }}
                          title="Delete Invoice"
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoice_number)}
                        >
                          <Trash2 size={14} />
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

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Create New Invoice</h3>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select 
                      className="form-control"
                      value={formData.client_id}
                      onChange={(e) => {
                        const cid = e.target.value;
                        const cl = clients.find(c => c.id == cid);
                        setFormData(prev => ({
                          ...prev,
                          client_id: cid,
                          currency: cl?.currency || prev.currency,
                          notes: `Note: All prices are in ${cl?.currency || prev.currency}`
                        }));
                      }}
                      required
                    >
                      <option value="">Select Client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.company_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Linked Project (Optional)</label>
                    <select 
                      className="form-control"
                      value={formData.project_id}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const pr = projects.find(p => p.id == pid);
                        setFormData(prev => ({
                          ...prev,
                          project_id: pid,
                          subject: pr ? `${pr.project_name} ${new Date().toLocaleString('default', { month: 'long' })}-${String(new Date().getFullYear()).slice(-2)}` : prev.subject,
                          currency: pr?.currency || prev.currency
                        }));
                      }}
                    >
                      <option value="">None / Standalone</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.project_name} ({p.billing_type})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Invoice Number</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ref. No. (e.g. 20260816)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.ref_no}
                      onChange={(e) => setFormData({ ...formData, ref_no: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select 
                      className="form-control"
                      value={formData.currency}
                      onChange={(e) => {
                        const c = e.target.value;
                        setFormData({ ...formData, currency: c, notes: `Note: All prices are in ${c}` });
                      }}
                    >
                      <option value="PKR">PKR (Pakistani Rupee)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Subject *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Production Management Software September-26"
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
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Invoice Items</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
                      <Plus size={14} /> Add Item
                    </button>
                  </div>

                  {formData.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 140px 120px 40px', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Description (e.g. Production Management Software)"
                        className="form-control"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        required
                      />
                      <input 
                        type="number" 
                        min="1"
                        placeholder="Qty"
                        className="form-control"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        required
                      />
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="Unit Price"
                        className="form-control"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        required
                      />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#60A5FA', textAlign: 'right' }}>
                        {(Number(item.quantity || 0) * Number(item.unit_price || 0)).toLocaleString()} {formData.currency}
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

                {/* Totals Summary */}
                <div className="inner-box" style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{calculateSubtotal().toLocaleString()} {formData.currency}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tax (%):</span>
                      <input 
                        type="number" 
                        step="0.1" 
                        style={{ width: '70px', padding: '4px 8px', fontSize: '0.85rem' }} 
                        className="form-control"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Discount:</span>
                      <input 
                        type="number" 
                        step="1" 
                        style={{ width: '90px', padding: '4px 8px', fontSize: '0.85rem' }} 
                        className="form-control"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      />
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                      <span>Total:</span>
                      <span>{calculateTotal().toLocaleString()} {formData.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Notes and Terms */}
                <div className="form-group">
                  <label className="form-label">Note Line</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Invoice & Preview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedInvoiceForPayment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Record Payment — {selectedInvoiceForPayment.invoice_number}
              </h3>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
                  <div>Client: <strong>{selectedInvoiceForPayment.client_name}</strong></div>
                  <div>Outstanding Balance: <strong style={{ color: 'var(--danger)' }}>{Number(selectedInvoiceForPayment.balance_due).toLocaleString()} {selectedInvoiceForPayment.currency}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount ({selectedInvoiceForPayment.currency}) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    max={selectedInvoiceForPayment.balance_due}
                    className="form-control"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Date *</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select 
                    className="form-control"
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  >
                    <option value="bank_transfer">Bank Transfer (Meezan / Wire)</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online / Stripe / Card</option>
                    <option value="wire">International Wire (Dubai / UAE)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction / Cheque Reference</label>
                  <input 
                    type="text" 
                    placeholder="e.g. FTX-99882201"
                    className="form-control"
                    value={paymentData.reference_txn}
                    onChange={(e) => setPaymentData({ ...paymentData, reference_txn: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea 
                    rows="2"
                    className="form-control"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  <CheckCircle size={16} /> Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
