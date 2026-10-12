import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Plus, Calendar, DollarSign, Clock, Play, 
  CheckCircle2, AlertCircle, Edit, Trash2, ArrowUpRight, FileText, X
} from 'lucide-react';
import { api } from '../services/api';

export default function Projects({ onPreviewInvoice }) {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Billing modal form
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);

  // Project Form
  const [formData, setFormData] = useState({
    client_id: '',
    project_code: '',
    project_name: '',
    billing_type: 'monthly_retainer',
    billing_rate: 40000,
    currency: 'PKR',
    billing_cycle_day: 1,
    next_billing_date: new Date().toISOString().split('T')[0],
    start_date: new Date().toISOString().split('T')[0],
    status: 'active',
    description: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, clientRes] = await Promise.all([
        api.getProjects(),
        api.getClients()
      ]);
      if (projRes.success) setProjects(projRes.projects);
      if (clientRes.success) setClients(clientRes.clients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddProjectModal = () => {
    setFormData({
      client_id: clients[0]?.id || '',
      project_code: 'PRJ-' + Math.floor(1000 + Math.random() * 9000),
      project_name: '',
      billing_type: 'monthly_retainer',
      billing_rate: 40000,
      currency: 'PKR',
      billing_cycle_day: 1,
      next_billing_date: new Date().toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      description: ''
    });
    setShowAddModal(true);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createProject(formData);
      if (res.success) {
        setShowAddModal(false);
        loadData();
      }
    } catch (err) {
      alert('Error creating project: ' + err.message);
    }
  };

  const openBillRetainer = (proj) => {
    setSelectedProject(proj);
    setBillingDate(proj.next_billing_date || new Date().toISOString().split('T')[0]);
    setShowBillModal(true);
  };

  const handleConfirmBill = async (e) => {
    e.preventDefault();
    try {
      const res = await api.generateRetainerInvoice(selectedProject.id, billingDate);
      if (res.success) {
        setShowBillModal(false);
        alert(res.message);
        loadData();

        // Preview newly generated invoice
        const invFull = await api.getInvoice(res.invoice_id);
        if (invFull.success && onPreviewInvoice) {
          onPreviewInvoice(invFull);
        }
      }
    } catch (err) {
      alert('Error generating invoice: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete project ${name}?`)) return;
    try {
      const res = await api.deleteProject(id);
      if (res.success) loadData();
    } catch (err) {
      alert('Error deleting project: ' + err.message);
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    if (filterType === 'all') return true;
    if (filterType === 'retainers') return p.billing_type === 'monthly_retainer';
    if (filterType === 'fixed') return p.billing_type === 'fixed_cost';
    return true;
  });

  // Calculate MRR
  const mrr = projects
    .filter(p => p.billing_type === 'monthly_retainer' && p.status === 'active')
    .reduce((sum, p) => sum + Number(p.billing_rate || 0), 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>
            Projects & Recurring Retainers
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage client software contracts, ongoing retainers, and automated monthly billing cycles
          </span>
        </div>
        <button className="btn btn-primary" onClick={openAddProjectModal}>
          <Plus size={16} /> New Project / Retainer
        </button>
      </div>

      {/* Overview Metric Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Monthly Recurring Revenue (MRR)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
            Rs. {mrr.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Guaranteed monthly retainer base
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Software Retainers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>
            {projects.filter(p => p.billing_type === 'monthly_retainer' && p.status === 'active').length} Clients
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            SLA maintenance & continuous development
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Billed Lifetime
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#A78BFA', marginTop: '4px' }}>
            Rs. {projects.reduce((sum, p) => sum + Number(p.total_billed_amount || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across all milestone and retainer runs
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('all')}
        >
          All Projects ({projects.length})
        </button>
        <button 
          className={`btn btn-sm ${filterType === 'retainers' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('retainers')}
        >
          Monthly Retainers ({projects.filter(p => p.billing_type === 'monthly_retainer').length})
        </button>
        <button 
          className={`btn btn-sm ${filterType === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('fixed')}
        >
          Fixed / Milestone Contracts
        </button>
      </div>

      {/* Projects Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '18px' }}>
        {filteredProjects.map((proj) => (
          <div key={proj.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#60A5FA', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  {proj.project_code}
                </span>
                <span className={`badge badge-${proj.status === 'active' ? 'paid' : 'draft'}`}>
                  {proj.status}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                {proj.project_name}
              </h3>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {proj.client_name} &bull; <strong style={{ color: 'var(--text-secondary)' }}>{proj.company_name}</strong>
              </div>

              {proj.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                  {proj.description}
                </p>
              )}

              <div className="inner-box" style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Billing Model:</span>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                    {proj.billing_type.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Rate:</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {Number(proj.billing_rate).toLocaleString()} {proj.currency}
                    {proj.billing_type === 'monthly_retainer' ? '/mo' : ''}
                  </div>
                </div>
                {proj.billing_type === 'monthly_retainer' && (
                  <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Next Billing Date:</span>
                    <strong style={{ color: 'var(--warning)', marginLeft: '6px' }}>
                      {proj.next_billing_date || 'Due Now'} (Day {proj.billing_cycle_day})
                    </strong>
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {proj.total_invoices_billed || 0} Invoices generated
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {proj.billing_type === 'monthly_retainer' && proj.status === 'active' && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => openBillRetainer(proj)}
                  >
                    <FileText size={13} /> Bill Retainer
                  </button>
                )}
                <button 
                  className="btn btn-icon btn-sm"
                  style={{ color: '#EF4444' }}
                  onClick={() => handleDelete(proj.id, proj.project_name)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* BILL RETAINER MODAL */}
      {showBillModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Generate Monthly Retainer Invoice
              </h3>
              <button className="btn-icon" onClick={() => setShowBillModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBill}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{selectedProject.project_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Client: {selectedProject.client_name} ({selectedProject.company_name})
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, marginTop: '6px' }}>
                    Billing Rate: {Number(selectedProject.billing_rate).toLocaleString()} {selectedProject.currency}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Billing Date / Period</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Invoice will be created for the corresponding month (e.g. {new Date(billingDate).toLocaleString('default', { month: 'long' })}-{String(new Date(billingDate).getFullYear()).slice(-2)}) and next cycle will auto-advance by 1 month.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBillModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FileText size={16} /> Generate & View Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>New Software Project / Retainer</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select 
                      className="form-control"
                      value={formData.client_id}
                      onChange={(e) => {
                        const cid = e.target.value;
                        const cl = clients.find(c => c.id == cid);
                        setFormData({
                          ...formData,
                          client_id: cid,
                          currency: cl?.currency || formData.currency
                        });
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
                    <label className="form-label">Project Code</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.project_code}
                      onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Production Management Software"
                    className="form-control"
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Billing Type</label>
                    <select 
                      className="form-control"
                      value={formData.billing_type}
                      onChange={(e) => setFormData({ ...formData, billing_type: e.target.value })}
                    >
                      <option value="monthly_retainer">Monthly Retainer (Recurring)</option>
                      <option value="fixed_cost">Fixed Project Cost</option>
                      <option value="hourly">Hourly Rate</option>
                      <option value="milestone">Milestone Based</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Billing Rate / Amount *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-control"
                      value={formData.billing_rate}
                      onChange={(e) => setFormData({ ...formData, billing_rate: e.target.value })}
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

                {formData.billing_type === 'monthly_retainer' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Cycle Billing Day (1-31)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="31"
                        className="form-control"
                        value={formData.billing_cycle_day}
                        onChange={(e) => setFormData({ ...formData, billing_cycle_day: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Next Billing Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.next_billing_date}
                        onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Description / Scope of Work</label>
                  <textarea 
                    rows="2"
                    placeholder="Details about SLAs, server maintenance, scope..."
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
