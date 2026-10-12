import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Eye, Phone, Mail, MapPin, 
  FileText, DollarSign, Edit3, Trash2, X, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function Clients({ onPreviewInvoice }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClientData, setSelectedClientData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    client_code: '',
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore',
    country: 'Pakistan',
    currency: 'PKR',
    tax_number: '',
    notes: '',
    status: 'active'
  });

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await api.getClients();
      if (res.success) setClients(res.clients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const openAddClient = () => {
    setFormData({
      client_code: 'CLT-' + Math.floor(1000 + Math.random() * 9000),
      name: '',
      company_name: '',
      email: '',
      phone: '',
      address: '',
      city: 'Lahore',
      country: 'Pakistan',
      currency: 'PKR',
      tax_number: '',
      notes: '',
      status: 'active'
    });
    setShowAddModal(true);
  };

  const openEditClient = (client) => {
    setEditingClient(client);
    setFormData({
      client_code: client.client_code || '',
      name: client.name || '',
      company_name: client.company_name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || 'Lahore',
      country: client.country || 'Pakistan',
      currency: client.currency || 'PKR',
      tax_number: client.tax_number || '',
      notes: client.notes || '',
      status: client.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createClient(formData);
      if (res.success) {
        setShowAddModal(false);
        loadClients();
      }
    } catch (err) {
      alert('Error saving client: ' + err.message);
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateClient(editingClient.id, formData);
      if (res.success) {
        setShowEditModal(false);
        setEditingClient(null);
        loadClients();
      }
    } catch (err) {
      alert('Error updating client: ' + err.message);
    }
  };

  const openClientLedger = async (clientId) => {
    try {
      const res = await api.getClient(clientId);
      if (res.success) {
        setSelectedClientData(res);
        setShowLedgerModal(true);
      }
    } catch (err) {
      alert('Error fetching client ledger: ' + err.message);
    }
  };

  const handleDeleteClient = async (id, name) => {
    if (!window.confirm(`Delete client "${name}"?`)) return;
    try {
      const res = await api.deleteClient(id);
      if (res.success) loadClients();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Client Accounts & Ledgers
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Corporate client records, editable contact profiles, and real-time financial statements
          </span>
        </div>
        <button className="btn btn-primary" onClick={openAddClient}>
          <Plus size={16} /> Add New Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ position: 'relative', maxWidth: '380px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Search by client name, company, code..."
            className="form-control"
            style={{ paddingLeft: '36px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {filteredClients.map((c) => (
          <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#2563EB', background: 'rgba(37, 99, 235, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {c.client_code}
                </span>
                <span className={`badge badge-${c.status === 'active' ? 'paid' : 'draft'}`}>
                  {c.status}
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
                {c.name}
              </h3>
              <div style={{ fontSize: '0.92rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '12px' }}>
                {c.company_name}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {c.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} /> {c.email}
                  </div>
                )}
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} /> {c.phone}
                  </div>
                )}
                {(c.city || c.country) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} /> {c.city}, {c.country}
                  </div>
                )}
              </div>

              {/* Financial Balance Summary Box */}
              <div className="inner-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Total Billed:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                    {Number(c.total_invoiced || 0).toLocaleString()} {c.currency}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Cleared Payments:</span>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.92rem' }}>
                    {Number(c.total_paid || 0).toLocaleString()} {c.currency}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Balance Due:</span>
                  <strong style={{ color: Number(c.balance_due) > 0 ? 'var(--danger)' : 'var(--success)', marginLeft: '6px' }}>
                    {Number(c.balance_due || 0).toLocaleString()} {c.currency}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {c.active_projects_count || 0} Active Project(s)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {/* Edit Client Button */}
                <button 
                  className="btn btn-secondary btn-sm"
                  title="Edit Client Information"
                  onClick={() => openEditClient(c)}
                >
                  <Edit3 size={13} /> Edit
                </button>

                {/* View Statement Button */}
                <button 
                  className="btn btn-secondary btn-sm"
                  title="View Statement of Account"
                  onClick={() => openClientLedger(c.id)}
                >
                  <Eye size={13} /> Statement
                </button>

                {/* Delete Button */}
                <button 
                  className="btn btn-icon btn-sm"
                  style={{ color: 'var(--danger)' }}
                  title="Delete Client"
                  onClick={() => handleDeleteClient(c.id, c.name)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* EDIT CLIENT MODAL */}
      {showEditModal && editingClient && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Edit Client — {editingClient.company_name}
              </h3>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateClient}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Person Name *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company / Entity Name *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Client Code</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.client_code}
                      onChange={(e) => setFormData({ ...formData, client_code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone / WhatsApp</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Billing Currency</label>
                    <select 
                      className="form-control"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <option value="PKR">PKR (Pakistani Rupee)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Billing Street Address</label>
                  <textarea 
                    rows="2"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tax ID / NTN / Notes</label>
                  <textarea 
                    rows="2"
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT STATEMENT / LEDGER MODAL */}
      {showLedgerModal && selectedClientData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  Statement of Account — {selectedClientData.client.company_name}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Contact: {selectedClientData.client.name} &bull; Code: {selectedClientData.client.client_code}
                </span>
              </div>
              <button className="btn-icon" onClick={() => setShowLedgerModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Stats Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--info)', textTransform: 'uppercase', fontWeight: 700 }}>Total Invoiced</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    Rs. {Number(selectedClientData.stats.total_invoiced).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 700 }}>Total Cleared</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                    Rs. {Number(selectedClientData.stats.total_paid).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--danger)', textTransform: 'uppercase', fontWeight: 700 }}>Net Balance Due</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>
                    Rs. {Number(selectedClientData.stats.balance_due).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Invoices History */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>Invoices</h4>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Ref</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClientData.invoices.map(inv => (
                        <tr key={inv.id}>
                          <td><strong>{inv.invoice_number}</strong></td>
                          <td>{inv.ref_no}</td>
                          <td>{inv.subject}</td>
                          <td>{inv.issue_date}</td>
                          <td>{Number(inv.total_amount).toLocaleString()} {inv.currency}</td>
                          <td>{Number(inv.balance_due).toLocaleString()} {inv.currency}</td>
                          <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                          <td>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={async () => {
                                const full = await api.getInvoice(inv.id);
                                if (full.success && onPreviewInvoice) {
                                  onPreviewInvoice(full);
                                }
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments History */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>Payment Receipts Cleared</h4>
                {selectedClientData.payments.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No payment receipts recorded yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Receipt #</th>
                          <th>Invoice #</th>
                          <th>Date</th>
                          <th>Method</th>
                          <th>Reference Txn</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClientData.payments.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.receipt_no}</strong></td>
                            <td>{p.invoice_number}</td>
                            <td>{p.payment_date}</td>
                            <td style={{ textTransform: 'capitalize' }}>{p.payment_method.replace('_', ' ')}</td>
                            <td>{p.reference_txn || '-'}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                              {Number(p.amount).toLocaleString()} {p.currency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowLedgerModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Add New Client Account</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClient}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Person Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mr. Naeem Anwar"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company / Entity Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AeroSoft Thailand"
                      className="form-control"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="contact@company.com"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone / WhatsApp</label>
                    <input 
                      type="text" 
                      placeholder="+92 300 1234567"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Billing Currency</label>
                    <select 
                      className="form-control"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <option value="PKR">PKR (Pakistani Rupee)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Billing Street Address</label>
                  <textarea 
                    rows="2"
                    placeholder="e.g. Gulberg III, Main Boulevard, Lahore"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
