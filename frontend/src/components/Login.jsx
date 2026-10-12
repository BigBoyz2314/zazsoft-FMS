import React, { useState } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, ShieldCheck, 
  ArrowRight, Loader2, AlertCircle, Sun, Moon, KeyRound, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess, theme, toggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.login(email.trim(), password, rememberMe);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Network error or invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="login-page">
      {/* Dynamic Background Glows */}
      <div className="login-backdrop">
        <div className="glow-sphere sphere-1" />
        <div className="glow-sphere sphere-2" />
      </div>

      {/* Top Bar for Theme Toggle */}
      <div className="login-topbar">
        <button 
          className="btn-icon theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="login-card-wrapper fade-in">
        <div className="login-card">
          
          {/* Brand Header */}
          <div className="login-header">
            <div className="login-logo-container">
              <img 
                src="./assets/images/zazsoft.png" 
                alt="ZAZSoft Logo" 
                className="login-brand-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            <div className="login-badge">
              <ShieldCheck size={13} style={{ color: '#38BDF8' }} />
              <span>FMS Enterprise Access</span>
            </div>

            <h1 className="login-title">Sign In</h1>
            <p className="login-subtitle">
              Financial Management & Client Retainer System
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="login-alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="input-icon-wrapper">
                <Mail size={17} className="input-icon-left" />
                <input
                  id="login-email"
                  type="email"
                  className="form-control with-icon-left"
                  placeholder="admin@zazsoft.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={17} className="input-icon-left" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control with-icon-left with-icon-right"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-remember-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Keep me signed in for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner-icon" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credential Fillers */}
          <div className="login-demo-box">
            <div className="demo-box-header">
              <KeyRound size={13} style={{ color: '#F59E0B' }} />
              <span>Default Admin Accounts</span>
            </div>
            <div className="demo-chips">
              <button
                type="button"
                className="demo-chip"
                onClick={() => handleQuickFill('admin@zazsoft.com')}
                title="Click to auto-fill admin@zazsoft.com / admin123"
              >
                <Sparkles size={12} />
                <span>admin@zazsoft.com</span>
              </button>
              <button
                type="button"
                className="demo-chip"
                onClick={() => handleQuickFill('zazimran@gmail.com')}
                title="Click to auto-fill zazimran@gmail.com / admin123"
              >
                <Sparkles size={12} />
                <span>zazimran@gmail.com</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="login-card-footer">
            <span>ZAZSoft &bull; Lahore &bull; Dubai</span>
            <span>256-bit Encrypted Session</span>
          </div>

        </div>
      </div>
    </div>
  );
}
