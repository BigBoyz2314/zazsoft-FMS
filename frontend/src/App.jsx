import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, FolderKanban, Users, TrendingDown, 
  FileCheck2, Settings as SettingsIcon, Sun, Moon, Plus, Bell,
  ShieldCheck, Globe, CreditCard, LogOut, Loader2, User as UserIcon
} from 'lucide-react';

import { api, authStorage } from './services/api';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Invoices from './components/Invoices';
import Projects from './components/Projects';
import Clients from './components/Clients';
import Expenses from './components/Expenses';
import Quotations from './components/Quotations';
import Settings from './components/Settings';
import InvoicePrint from './components/InvoicePrint';

export default function App() {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [authChecking, setAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [previewInvoiceData, setPreviewInvoiceData] = useState(null);

  // Set theme attribute on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Authenticate session on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = authStorage.getToken();
      if (!token) {
        setUser(null);
        setAuthChecking(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          authStorage.setUser(res.user);
        } else {
          authStorage.clear();
          setUser(null);
        }
      } catch (err) {
        authStorage.clear();
        setUser(null);
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('zazsoft_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('zazsoft_unauthorized', handleUnauthorized);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out of ZAZSoft FMS?')) {
      await api.logout();
      setUser(null);
    }
  };

  if (authChecking) {
    return (
      <div className="auth-loader-screen">
        <Loader2 size={36} className="spinner-icon" style={{ color: 'var(--primary)' }} />
        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading ZAZSoft FMS...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login 
        onLoginSuccess={(loggedUser) => setUser(loggedUser)} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices & Billing', icon: FileText },
    { id: 'projects', label: 'Projects & Retainers', icon: FolderKanban },
    { id: 'clients', label: 'Clients & Accounts', icon: Users },
    { id: 'expenses', label: 'Expenses & Payouts', icon: TrendingDown },
    { id: 'quotations', label: 'Quotations / Proposals', icon: FileCheck2 },
    { id: 'settings', label: 'Settings & Branding', icon: SettingsIcon },
  ];

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <div className="app-container">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar no-print">
        
        {/* Brand Header */}
        <div className="sidebar-header">
          <img 
            src="./assets/images/zazsoft.png" 
            alt="ZAZSoft Logo" 
            className="sidebar-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-badge">FMS Enterprise</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.name}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {user.email}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              className="btn-icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button 
              className="btn-icon"
              onClick={handleLogout}
              title="Sign Out"
              style={{ color: '#EF4444' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        
        {/* TOPBAR */}
        <header className="topbar no-print">
          <div className="topbar-title-section">
            <div>
              <h1 className="topbar-title">
                {navItems.find(i => i.id === currentTab)?.label}
              </h1>
              <div className="topbar-subtitle">
                ZAZSoft Financial & Client Retainer Management System
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(255, 255, 255, 0.04)', 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}>
              <Globe size={13} style={{ color: '#38BDF8' }} />
              <span>PKR &bull; AED &bull; USD</span>
            </div>

            {/* User Profile Badge */}
            <div className="user-profile-badge">
              <div className="user-avatar-circle">
                {userInitial}
              </div>
              <div className="user-badge-text">
                <span className="user-badge-name">{user.name}</span>
                <span className="user-badge-role">{user.role || 'Admin'}</span>
              </div>
            </div>

            {/* Logout Action */}
            <button 
              className="btn-logout"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>

            {currentTab !== 'invoices' && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentTab('invoices')}
              >
                <Plus size={14} /> Quick Invoice
              </button>
            )}
          </div>
        </header>

        {/* BODY */}
        <main className="content-body">
          {currentTab === 'dashboard' && (
            <Dashboard 
              onNavigate={setCurrentTab} 
              onPreviewInvoice={setPreviewInvoiceData}
            />
          )}

          {currentTab === 'invoices' && (
            <Invoices 
              onPreviewInvoice={setPreviewInvoiceData}
            />
          )}

          {currentTab === 'projects' && (
            <Projects 
              onPreviewInvoice={setPreviewInvoiceData}
            />
          )}

          {currentTab === 'clients' && (
            <Clients 
              onPreviewInvoice={setPreviewInvoiceData}
            />
          )}

          {currentTab === 'expenses' && (
            <Expenses />
          )}

          {currentTab === 'quotations' && (
            <Quotations 
              onPreviewInvoice={setPreviewInvoiceData}
            />
          )}

          {currentTab === 'settings' && (
            <Settings 
              currentUser={user}
              onUserUpdated={(u) => setUser(u)}
            />
          )}
        </main>

      </div>

      {/* FULL INVOICE PREVIEW / PRINT MODAL */}
      {previewInvoiceData && (
        <InvoicePrint 
          invoiceData={previewInvoiceData}
          onClose={() => setPreviewInvoiceData(null)}
        />
      )}

    </div>
  );
}
