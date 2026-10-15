import React, { useEffect } from 'react';
import { Printer, X } from 'lucide-react';

export default function InvoicePrint({ invoiceData, onClose }) {
  const invoice = invoiceData?.invoice || (invoiceData?.invoice_number ? invoiceData : null);
  const items = invoiceData?.items || invoice?.items || [];
  const settings = invoiceData?.settings || {};

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!invoice) return null;

  // Format date like "16th, September 2026"
  const formatDateFormal = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const day = d.getDate();
    let suffix = 'th';
    if (day % 10 === 1 && day !== 11) suffix = 'st';
    else if (day % 10 === 2 && day !== 12) suffix = 'nd';
    else if (day % 10 === 3 && day !== 13) suffix = 'rd';

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}${suffix}, ${month} ${year}`;
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const invNum = invoice.invoice_number || invoice.ref_no || 'Document';
    document.title = `Invoice_${invNum}`;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const termsLines = (invoice.terms_and_conditions || settings.default_terms || '')
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean);

  const currency = invoice.currency || settings.default_currency || 'PKR';
  const logoUrl = './assets/images/zazsoft.png';

  const hasTax = Number(invoice.tax_amount) > 0;
  const hasDiscount = Number(invoice.discount_amount) > 0;
  const hasPaid = Number(invoice.paid_amount) > 0;
  const hasBalance = Number(invoice.balance_due) > 0;

  return (
    <div className="modal-overlay invoice-print-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content invoice-print-modal" style={{ maxWidth: '920px', maxHeight: '96vh' }}>
        <div className="modal-header no-print">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              Invoice Preview — {invoice.invoice_number}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Ref No: {invoice.ref_no || 'N/A'} &bull; Client: {invoice.company_name || invoice.client_name || 'Valued Client'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handlePrint} id="btn-print-invoice">
              <Printer size={16} /> Print / Save as PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              <X size={16} /> Close
            </button>
          </div>
        </div>

        <div className="modal-body invoice-print-body">
          <div className="invoice-preview-container" style={{ padding: 0 }}>
            {/* The Authentic A4 Sheet */}
            <div className="invoice-a4-sheet" id="printable-invoice-content">
              
              {/* Header Top: Logo & Title */}
              <div>
                <div className="inv-brand-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img 
                      src={logoUrl} 
                      alt="ZAZSoft Logo" 
                      className="inv-logo-img"
                      onError={(e) => {
                        if (e.target.src.indexOf('assets/images/zazsoft.png') !== -1) {
                          e.target.src = './zazsoft.png';
                        } else {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#0284C7', fontWeight: 600 }}>
                        {settings.tagline || 'At Your Service Always'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="inv-heading">INVOICE</div>
                    <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>
                      #{invoice.invoice_number}
                    </div>
                  </div>
                </div>

                {/* Metadata matching exact layout of Aerosoft docx */}
                <div className="inv-meta-grid">
                  <div className="inv-meta-col-left">
                    <div>
                      <span className="inv-meta-label">To:</span>
                      <strong style={{ color: '#0F172A' }}>{invoice.client_name || 'Valued Client'}</strong>
                    </div>
                    <div>
                      <span className="inv-meta-label">Company:</span>
                      <span style={{ color: '#1E293B' }}>
                        {invoice.company_name || '—'}
                        {invoice.client_city ? ` (${invoice.client_city}, ${invoice.client_country || 'Pakistan'})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="inv-meta-label">Subject:</span>
                      <strong style={{ color: '#0284C7' }}>{invoice.subject || 'Project Billing'}</strong>
                    </div>
                  </div>

                  <div className="inv-meta-col-right">
                    <div>
                      <span className="inv-meta-label" style={{ textAlign: 'left' }}>Date:</span>
                      <strong style={{ color: '#0F172A' }}>{formatDateFormal(invoice.issue_date)}</strong>
                    </div>
                    {invoice.due_date && (
                      <div>
                        <span className="inv-meta-label" style={{ textAlign: 'left' }}>Due Date:</span>
                        <strong style={{ color: '#0F172A' }}>{formatDateFormal(invoice.due_date)}</strong>
                      </div>
                    )}
                    <div>
                      <span className="inv-meta-label" style={{ textAlign: 'left' }}>From:</span>
                      <span style={{ color: '#1E293B' }}>{settings.company_name || 'ZAZ Soft'} {settings.website || 'www.zazsoft.com'}</span>
                    </div>
                    <div>
                      <span className="inv-meta-label" style={{ textAlign: 'left' }}>Ref. No.:</span>
                      <strong style={{ color: '#0F172A', letterSpacing: '0.05em' }}>{invoice.ref_no || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                {/* Table matching the docx format: Sr. | Description | Qty. | Amount */}
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }} className="text-center">Sr.</th>
                      <th>Description</th>
                      <th style={{ width: '80px' }} className="text-center">Qty.</th>
                      <th style={{ width: '150px' }} className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items && items.length > 0 ? (
                      items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="text-center" style={{ fontWeight: 600, color: '#64748B' }}>
                            {item.sr_no || idx + 1}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.description}</div>
                          </td>
                          <td className="text-center">
                            {Number(item.quantity || 1).toFixed(0)}
                          </td>
                          <td className="text-right" style={{ fontWeight: 700 }}>
                            {Number(item.total_amount || (Number(item.quantity || 1) * Number(item.unit_price || 0))).toLocaleString()} {currency}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center" style={{ color: '#64748B', padding: '16px' }}>
                          No line items specified.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    {(hasTax || hasDiscount) && (
                      <tr>
                        <td colSpan="3" className="text-right" style={{ border: 'none', padding: '6px 14px', fontWeight: 600 }}>
                          Subtotal:
                        </td>
                        <td className="text-right" style={{ border: '1px solid #CBD5E1', padding: '6px 14px' }}>
                          {Number(invoice.subtotal || invoice.total_amount).toLocaleString()} {currency}
                        </td>
                      </tr>
                    )}
                    {hasTax && (
                      <tr>
                        <td colSpan="3" className="text-right" style={{ border: 'none', padding: '6px 14px', fontWeight: 600 }}>
                          Tax ({invoice.tax_rate}%):
                        </td>
                        <td className="text-right" style={{ border: '1px solid #CBD5E1', padding: '6px 14px' }}>
                          {Number(invoice.tax_amount).toLocaleString()} {currency}
                        </td>
                      </tr>
                    )}
                    {hasDiscount && (
                      <tr>
                        <td colSpan="3" className="text-right" style={{ border: 'none', padding: '6px 14px', fontWeight: 600, color: '#DC2626' }}>
                          Discount:
                        </td>
                        <td className="text-right" style={{ border: '1px solid #CBD5E1', padding: '6px 14px', color: '#DC2626' }}>
                          -{Number(invoice.discount_amount).toLocaleString()} {currency}
                        </td>
                      </tr>
                    )}
                    <tr className="inv-total-row">
                      <td colSpan="3" className="text-right" style={{ padding: '10px 14px' }}>
                        Total Amount:
                      </td>
                      <td className="text-right" style={{ padding: '10px 14px', color: '#0284C7' }}>
                        {Number(invoice.total_amount).toLocaleString()} {currency}
                      </td>
                    </tr>
                    {hasPaid && (
                      <tr>
                        <td colSpan="3" className="text-right" style={{ border: 'none', padding: '6px 14px', fontWeight: 600, color: '#059669' }}>
                          Amount Paid:
                        </td>
                        <td className="text-right" style={{ border: '1px solid #CBD5E1', padding: '6px 14px', color: '#059669', fontWeight: 700 }}>
                          {Number(invoice.paid_amount).toLocaleString()} {currency}
                        </td>
                      </tr>
                    )}
                    {hasBalance && hasPaid && (
                      <tr>
                        <td colSpan="3" className="text-right" style={{ border: 'none', padding: '6px 14px', fontWeight: 700, color: '#DC2626' }}>
                          Balance Due:
                        </td>
                        <td className="text-right" style={{ border: '1px solid #CBD5E1', padding: '6px 14px', color: '#DC2626', fontWeight: 800 }}>
                          {Number(invoice.balance_due).toLocaleString()} {currency}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>

                {/* Note line */}
                <div className="inv-note-box">
                  {invoice.notes || `Note: All prices are in ${currency}`}
                </div>

                {/* Terms and Conditions */}
                {termsLines.length > 0 && (
                  <div className="inv-terms-section">
                    <div className="inv-terms-title">Terms and Conditions:</div>
                    <ul className="inv-terms-list">
                      {termsLines.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bank / Wire Transfer details if enabled */}
                {(settings.show_bank_details == 1 || settings.show_bank_details === true) && (settings.iban || settings.account_number) && (
                  <div className="inv-bank-box" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.8rem' }}>
                    <strong style={{ color: '#0F172A', display: 'block', marginBottom: '4px' }}>Bank Transfer Details:</strong>
                    <div>Bank: <strong>{settings.bank_name || 'Meezan Bank Limited'}</strong> | Title: <strong>{settings.account_title || 'ZAZ Soft'}</strong></div>
                    <div>Account: <strong>{settings.account_number || 'N/A'}</strong> | IBAN: <strong>{settings.iban || 'N/A'}</strong> {settings.swift_code ? `| SWIFT: ${settings.swift_code}` : ''}</div>
                  </div>
                )}

                {/* Sign-off */}
                <div className="inv-signoff">
                  <div className="inv-signoff-regards">Best Regards,</div>
                  <div className="inv-signoff-brand">{settings.company_name || 'ZAZ Soft'}</div>
                  <div className="inv-signoff-tagline">{settings.tagline || 'At Your Service Always'}</div>
                </div>
              </div>

              {/* Footer: Multi-branch Lahore & Dubai matching exact Aerosoft docx */}
              <div className="inv-footer">
                <div>
                  <div className="inv-footer-branch-title">Pakistan Office:</div>
                  <div><strong>Mail:</strong> {settings.email || 'zazimran@gmail.com'}</div>
                  <div><strong>Contact:</strong> {settings.phone_pk || '+92 309 9507777'}</div>
                  <div><strong>Address:</strong> {settings.address_pk || 'H 219, Molana Ahmad Ali Road, Ravi Road Lahore'}</div>
                </div>

                {(settings.show_uae_address == 1 || settings.show_uae_address === true) && (
                  <div>
                    <div className="inv-footer-branch-title">UAE Office:</div>
                    <div><strong>Mail:</strong> {settings.email || 'zazimran@gmail.com'}</div>
                    <div><strong>Phone:</strong> {settings.phone_uae || '+971 52 7772758'}</div>
                    <div><strong>Address:</strong> {settings.address_uae || '2001, Prime Tower, Business Bay, Dubai, UAE'}</div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
