# ZAZSoft FMS — Financial Management System

A Financial Management & Client Retainer System built for **ZAZSoft** (Software Engineering Services).

![ZAZSoft Logo](assets/images/zazsoft.png)

---

## 🚀 Features

- **Secure Authentication**: Enterprise session token authentication, remember-me support, profile & password management in Settings, and pre-seeded admin accounts.
- **Branded Invoicing**: Exact replica of ZAZSoft's official corporate invoice template with multi-branch addresses (Lahore & Dubai), bank wire settlement info, and formal print/PDF export.
- **Projects & Retainers**: Manage recurring monthly software maintenance retainers with automatic Monthly Recurring Revenue (MRR) tracking and 1-click monthly invoice generation.
- **Client Ledgers (CRM)**: Full statement of accounts, transaction histories, balance tracking, and contact management.
- **Operational Outflows**: Categorized expense tracking for AWS/servers, developer milestone payouts, SaaS licenses, and connectivity.
- **Financial Analytics**: Inflow vs Outflow trend charts, receivables tracking, and overdue aging alerts.
- **Multi-Currency Support**: Primary in PKR, with native support for AED (Dubai branch), USD, EUR, and GBP.
- **Dark & Light Mode**: Glassmorphic dark aesthetic with instant toggle to crisp light mode.

---

## 🔐 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@zazsoft.com` | `admin123` |
| **Owner Account** | `zazimran@gmail.com` | `admin123` |

> [!TIP]
> You can change your name, email, and password anytime under the **Settings & Branding** tab ➔ **Administrator Account & Security**.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Lucide Icons, Vanilla CSS Design System
- **Backend**: PHP 8.2 REST API (PDO, JSON)
- **Database**: MySQL / MariaDB

---

## 📦 How to Push to GitHub

From your project directory:

```bash
# 1. Initialize Git repository
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit: ZAZSoft FMS complete production release"

# 4. Set main branch and remote repository
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zazsoft-fms.git

# 5. Push to GitHub
git push -u origin main
```

---

## 🌐 Deploying to Hostinger (hPanel)

Deploying on Hostinger takes just a few minutes using **hPanel**:

### Step 1: Create MySQL Database in hPanel
1. Log in to your Hostinger **hPanel**.
2. Navigate to **Databases** ➔ **Management**.
3. Create a new MySQL database:
   - **Database Name**: e.g., `u123456789_zazsoft_fms`
   - **Username**: e.g., `u123456789_admin`
   - **Password**: `your_secure_password`
4. Copy these credentials.

### Step 2: Deploy the Code (Two Methods)

#### Option A: Using Hostinger Git Deployment (Recommended)
1. In hPanel, go to **Advanced** ➔ **Git**.
2. Paste your GitHub Repository URL: `https://github.com/YOUR_USERNAME/zazsoft-fms.git`
3. Branch: `main`
4. Directory: `public_html` (or a subdomain folder)
5. Click **Create**. Hostinger will clone and automatically keep your site updated on every git push!

#### Option B: Using File Manager / FTP
1. In hPanel, open **Files** ➔ **File Manager**.
2. Go to `public_html/`.
3. Upload the project files (`api/`, `assets/`, `database/`, `dist/`, `index.php`, `.htaccess`).

### Step 3: Configure Database Connection
In Hostinger File Manager, open `api/config.php` and update it with your hPanel database credentials:

```php
return [
    'db_host' => 'localhost',
    'db_name' => 'u123456789_zazsoft_fms', // Your hPanel Database Name
    'db_user' => 'u123456789_admin',       // Your hPanel Database Username
    'db_pass' => 'your_secure_password',  // Your hPanel Database Password
    'db_port' => '3306',
    'db_charset' => 'utf8mb4'
];
```

### Step 4: Import Database Schema & Seed Data
Either:
- **Via Browser**: Open `https://yourdomain.com/database/init.php` in your browser once. It will automatically create all tables and seed your ZAZSoft company profile and sample data.
- **Via phpMyAdmin**: In hPanel, click **Enter phpMyAdmin** next to your database, go to **Import**, and choose `database/schema.sql`.

---

## 💻 Local Development (XAMPP)

1. Place folder in `C:\xampp\htdocs\zazsoft FMS`
2. Ensure Apache and MySQL are running in XAMPP
3. Visit `http://localhost/zazsoft FMS/`
4. To run Vite dev server with hot module reload:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 📄 License & Rights
© 2026 ZAZSoft. All rights reserved.
