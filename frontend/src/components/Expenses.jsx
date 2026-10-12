import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, Plus, Search, DollarSign, Tag, Calendar, 
  Trash2, CreditCard, X, Server, Code, Wifi, ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'hosting_infrastructure',
    vendor_name: '',
    amount: '',
    currency: 'PKR',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    notes: ''
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.getExpenses({ category: selectedCat });
      if (res.success) {
        setExpenses(res.expenses);
        if (res.by_category) setCategories(res.by_category);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCat]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createExpense(formData);
      if (res.success) {
        setShowAddModal(false);
        setFormData({
          title: '',
          category: 'hosting_infrastructure',
          vendor_name: '',
          amount: '',
          currency: 'PKR',
          expense_date: new Date().toISOString().split('T')[0],
          payment_method: 'bank_transfer',
          notes: ''
        });
        loadExpenses();
      }
    } catch (err) {
      alert('Error recording expense: ' + err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete expense "${title}"?`)) return;
    try {
      const res = await api.deleteExpense(id);
      if (res.success) loadExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalExpenseSum = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'hosting_infrastructure': return <Server size={14} />;
      case 'developer_payout': return <Code size={14} />;
      case 'utilities': return <Wifi size={14} />;
      default: return <Tag size={14} />;
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>
            Operational Expenses & Payouts
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Track server cloud hosting, developer contract stipends, software tool licenses, and operations
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Record New Expense
        </button>
      </div>

      {/* Top Expense Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Recorded Expenses
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F87171', marginTop: '4px' }}>
            Rs. {totalExpenseSum.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {expenses.length} Expense transactions logged
          </div>
        </div>

        {categories.slice(0, 3).map((c, idx) => (
          <div key={idx} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {getCategoryIcon(c.category)} {c.category.replace('_', ' ')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
              Rs. {Number(c.total).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {c.count} transactions
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          className={`btn btn-sm ${selectedCat === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCat('')}
        >
          All Categories
        </button>
        {['hosting_infrastructure', 'developer_payout', 'software_licenses', 'utilities', 'office_rent', 'misc'].map((cat) => (
          <button 
            key={cat}
            className={`btn btn-sm ${selectedCat === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCat(cat)}
          >
            {cat.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Expense #</th>
                <th>Category</th>
                <th>Title / Description</th>
                <th>Vendor / Payee</th>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No expenses recorded in this category.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {exp.expense_number}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.78rem', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        background: 'var(--inner-box-bg)',
                        border: '1px solid var(--inner-box-border)',
                        color: 'var(--text-secondary)',
                        textTransform: 'capitalize',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {getCategoryIcon(exp.category)} {exp.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{exp.title}</strong>
                      {exp.notes && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{exp.notes}</div>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{exp.vendor_name || '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{exp.expense_date}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: '0.84rem' }}>
                      {exp.payment_method?.replace('_', ' ')}
                    </td>
                    <td>
                      <strong style={{ color: '#F87171', fontSize: '0.95rem' }}>
                        Rs. {Number(exp.amount).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-icon btn-sm"
                          style={{ color: '#EF4444' }}
                          onClick={() => handleDelete(exp.id, exp.title)}
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

      {/* RECORD EXPENSE MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Record Operational Expense</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Expense Title / Item *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. AWS Production EC2 & MariaDB Cluster"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="hosting_infrastructure">Cloud Servers & Hosting</option>
                      <option value="developer_payout">Developer / Contractor Payout</option>
                      <option value="software_licenses">Software & SaaS Tooling</option>
                      <option value="office_rent">Office Rent</option>
                      <option value="utilities">Utilities & Internet</option>
                      <option value="marketing">Marketing & Sales</option>
                      <option value="hardware">Hardware & Equipment</option>
                      <option value="misc">Miscellaneous</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vendor / Contractor Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Amazon Web Services"
                      className="form-control"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (PKR) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Amount"
                      className="form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Date *</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select 
                    className="form-control"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Company Credit Card</option>
                    <option value="online">Online Payment</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Purpose</label>
                  <textarea 
                    rows="2"
                    className="form-control"
                    placeholder="Specific sprint, invoice, or voucher note"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
