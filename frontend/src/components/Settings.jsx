import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, MapPin, Phone, Mail, Globe, 
  CreditCard, ShieldCheck, CheckCircle2, Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success) setSettings(res.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateSettings(settings);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert('Error updating settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading Settings...</div>;
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>
            Company Profile & Invoice Customizer
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Configure ZAZSoft corporate identity, multi-country branch addresses, bank accounts, and invoice templates
          </span>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saveSuccess ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Saved Successfully!
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} /> Save Changes
            </span>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Brand & Identity Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building2 size={18} style={{ color: '#3B82F6' }} />
              <span>Company Branding & Online Identity</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ background: 'var(--inner-box-bg)', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--inner-box-border)' }}>
              <img 
                src="./assets/images/zazsoft.png" 
                alt="ZAZSoft Logo"
                style={{ height: '54px', width: 'auto', display: 'block' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Corporate Logo Configured</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Stored at <code style={{ color: 'var(--primary)' }}>assets/images/zazsoft.png</code>. Appears in headers across all printed client documents.
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input 
                type="text" 
                className="form-control"
                value={settings.company_name || ''}
                onChange={(e) => handleChange('company_name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Slogan / Tagline</label>
              <input 
                type="text" 
                className="form-control"
                value={settings.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control"
                value={settings.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input 
                type="text" 
                className="form-control"
                value={settings.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Multi-Branch Contact Info (Lahore & Dubai) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <MapPin size={18} style={{ color: '#06B6D4' }} />
              <span>Multi-Branch Contact & Footers</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Pakistan Branch */}
            <div className="inner-box" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px' }}>
                Pakistan Office (Lahore)
              </h4>
              <div className="form-group">
                <label className="form-label">Phone / WhatsApp</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={settings.phone_pk || ''}
                  onChange={(e) => handleChange('phone_pk', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Office Address</label>
                <textarea 
                  rows="2"
                  className="form-control"
                  value={settings.address_pk || ''}
                  onChange={(e) => handleChange('address_pk', e.target.value)}
                />
              </div>
            </div>

            {/* UAE Branch */}
            <div className="inner-box" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--warning)', margin: 0 }}>
                  UAE Office (Dubai)
                </h4>
                <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={settings.show_uae_address == 1}
                    onChange={(e) => handleChange('show_uae_address', e.target.checked ? 1 : 0)}
                  /> Show on Invoices
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={settings.phone_uae || ''}
                  onChange={(e) => handleChange('phone_uae', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dubai Address</label>
                <textarea 
                  rows="2"
                  className="form-control"
                  value={settings.address_uae || ''}
                  onChange={(e) => handleChange('address_uae', e.target.value)}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Bank & Settlement Details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={18} style={{ color: '#10B981' }} />
              <span>Bank Settlement Accounts</span>
            </div>
            <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={settings.show_bank_details == 1}
                onChange={(e) => handleChange('show_bank_details', e.target.checked ? 1 : 0)}
              /> Display Bank Details on Invoices
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input 
                type="text" 
                className="form-control"
                value={settings.bank_name || ''}
                onChange={(e) => handleChange('bank_name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Title</label>
              <input 
                type="text" 
                className="form-control"
                value={settings.account_title || ''}
                onChange={(e) => handleChange('account_title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input 
                type="text" 
                className="form-control"
                value={settings.account_number || ''}
                onChange={(e) => handleChange('account_number', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IBAN</label>
              <input 
                type="text" 
                className="form-control"
                value={settings.iban || ''}
                onChange={(e) => handleChange('iban', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Terms and Conditions Editor */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} style={{ color: '#8B5CF6' }} />
              <span>Standard Invoice Terms and Conditions</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Default Terms (One condition per line)</label>
            <textarea 
              rows="5"
              className="form-control"
              style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}
              value={settings.default_terms || ''}
              onChange={(e) => handleChange('default_terms', e.target.value)}
            />
          </div>
        </div>

      </form>

    </div>
  );
}
