// API Client Service for ZAZSoft FMS

const getApiBase = () => {
  const loc = window.location;
  if (loc.port === '5173') {
    return 'http://localhost/zazsoft%20FMS/api';
  }
  
  // Bulletproof relative resolution across local XAMPP, subdomains, subfolders, and root domains on Hostinger hPanel
  const isDist = loc.pathname.includes('/dist');
  const relPath = isDist ? '../api' : './api';
  return new URL(relPath, loc.href).href.replace(/\/+$/, '');
};

const API_BASE = getApiBase();

async function request(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboard: () => request('dashboard.php'),

  // Clients
  getClients: () => request('clients.php'),
  getClient: (id) => request(`clients.php?id=${id}`),
  createClient: (client) => request('clients.php', { method: 'POST', body: JSON.stringify(client) }),
  updateClient: (id, client) => request(`clients.php?id=${id}`, { method: 'PUT', body: JSON.stringify(client) }),
  deleteClient: (id) => request(`clients.php?id=${id}`, { method: 'DELETE' }),

  // Projects & Retainers
  getProjects: () => request('projects.php'),
  getProject: (id) => request(`projects.php?id=${id}`),
  createProject: (proj) => request('projects.php', { method: 'POST', body: JSON.stringify(proj) }),
  updateProject: (id, proj) => request(`projects.php?id=${id}`, { method: 'PUT', body: JSON.stringify(proj) }),
  deleteProject: (id) => request(`projects.php?id=${id}`, { method: 'DELETE' }),
  generateRetainerInvoice: (projectId, billingDate) =>
    request(`projects.php?action=generate_invoice`, {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, billing_date: billingDate }),
    }),

  // Invoices
  getInvoices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`invoices.php${query ? `?${query}` : ''}`);
  },
  getInvoice: (id) => request(`invoices.php?id=${id}`),
  createInvoice: (invoice) => request('invoices.php', { method: 'POST', body: JSON.stringify(invoice) }),
  updateInvoice: (id, invoice) => request(`invoices.php?id=${id}`, { method: 'PUT', body: JSON.stringify(invoice) }),
  updateInvoiceStatus: (id, status) =>
    request(`invoices.php?id=${id}&action=status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteInvoice: (id) => request(`invoices.php?id=${id}`, { method: 'DELETE' }),

  // Quotations
  getQuotations: () => request('quotations.php'),
  getQuotation: (id) => request(`quotations.php?id=${id}`),
  createQuotation: (quote) => request('quotations.php', { method: 'POST', body: JSON.stringify(quote) }),
  convertQuotation: (id) =>
    request(`quotations.php?action=convert`, {
      method: 'POST',
      body: JSON.stringify({ quotation_id: id }),
    }),
  deleteQuotation: (id) => request(`quotations.php?id=${id}`, { method: 'DELETE' }),

  // Payments
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`payments.php${query ? `?${query}` : ''}`);
  },
  getPaymentReceipt: (id) => request(`payments.php?id=${id}`),
  recordPayment: (payment) => request('payments.php', { method: 'POST', body: JSON.stringify(payment) }),
  deletePayment: (id) => request(`payments.php?id=${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`expenses.php${query ? `?${query}` : ''}`);
  },
  createExpense: (expense) => request('expenses.php', { method: 'POST', body: JSON.stringify(expense) }),
  updateExpense: (id, expense) => request(`expenses.php?id=${id}`, { method: 'PUT', body: JSON.stringify(expense) }),
  deleteExpense: (id) => request(`expenses.php?id=${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('settings.php'),
  updateSettings: (settings) => request('settings.php', { method: 'POST', body: JSON.stringify(settings) }),
};
