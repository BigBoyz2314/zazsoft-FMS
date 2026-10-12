
-- Users table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'manager', 'accountant') DEFAULT 'admin',
    `avatar` VARCHAR(255) NULL,
    `auth_token` VARCHAR(255) NULL,
    `token_expiry` DATETIME NULL,
    `last_login` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Settings table
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_name` VARCHAR(150) NOT NULL DEFAULT 'ZAZ Soft',
    `tagline` VARCHAR(255) DEFAULT 'At Your Service Always',
    `email` VARCHAR(100) DEFAULT 'zazimran@gmail.com',
    `website` VARCHAR(100) DEFAULT 'www.zazsoft.com',
    `phone_pk` VARCHAR(50) DEFAULT '+92 309 9507777',
    `phone_uae` VARCHAR(50) DEFAULT '+971 52 7772758',
    `address_pk` TEXT,
    `address_uae` TEXT,
    `default_currency` VARCHAR(10) DEFAULT 'PKR',
    `default_terms` TEXT,
    `bank_name` VARCHAR(100) DEFAULT 'Meezan Bank Limited',
    `account_title` VARCHAR(100) DEFAULT 'ZAZ Soft',
    `account_number` VARCHAR(50) DEFAULT '0101-0102030405',
    `iban` VARCHAR(50) DEFAULT 'PK36MEZN0001010102030405',
    `swift_code` VARCHAR(20) DEFAULT 'MEZNPKKA',
    `show_uae_address` TINYINT(1) DEFAULT 1,
    `show_bank_details` TINYINT(1) DEFAULT 1,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Clients table
CREATE TABLE IF NOT EXISTS `clients` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `client_code` VARCHAR(30) UNIQUE NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `company_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(100),
    `phone` VARCHAR(50),
    `address` TEXT,
    `city` VARCHAR(100) DEFAULT 'Lahore',
    `country` VARCHAR(100) DEFAULT 'Pakistan',
    `currency` VARCHAR(10) DEFAULT 'PKR',
    `tax_number` VARCHAR(50) NULL,
    `notes` TEXT,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Projects & Retainers table
CREATE TABLE IF NOT EXISTS `projects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `client_id` INT NOT NULL,
    `project_code` VARCHAR(30) UNIQUE NOT NULL,
    `project_name` VARCHAR(150) NOT NULL,
    `billing_type` ENUM('monthly_retainer', 'fixed_cost', 'hourly', 'milestone') DEFAULT 'monthly_retainer',
    `billing_rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(10) DEFAULT 'PKR',
    `billing_cycle_day` INT DEFAULT 1,
    `next_billing_date` DATE NULL,
    `start_date` DATE NULL,
    `status` ENUM('active', 'paused', 'completed') DEFAULT 'active',
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Invoices table
CREATE TABLE IF NOT EXISTS `invoices` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `invoice_number` VARCHAR(50) UNIQUE NOT NULL,
    `ref_no` VARCHAR(50) NOT NULL,
    `client_id` INT NOT NULL,
    `project_id` INT NULL,
    `issue_date` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `currency` VARCHAR(10) DEFAULT 'PKR',
    `exchange_rate` DECIMAL(10,4) DEFAULT 1.0000,
    `subject` VARCHAR(255) NOT NULL,
    `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5,2) DEFAULT 0.00,
    `tax_amount` DECIMAL(15,2) DEFAULT 0.00,
    `discount_amount` DECIMAL(15,2) DEFAULT 0.00,
    `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(15,2) DEFAULT 0.00,
    `balance_due` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled') DEFAULT 'sent',
    `notes` TEXT,
    `terms_and_conditions` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Invoice Items table
CREATE TABLE IF NOT EXISTS `invoice_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` INT NOT NULL,
    `sr_no` INT NOT NULL DEFAULT 1,
    `description` TEXT NOT NULL,
    `quantity` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Quotations table
CREATE TABLE IF NOT EXISTS `quotations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quotation_number` VARCHAR(50) UNIQUE NOT NULL,
    `client_id` INT NOT NULL,
    `issue_date` DATE NOT NULL,
    `valid_until` DATE NOT NULL,
    `currency` VARCHAR(10) DEFAULT 'PKR',
    `subject` VARCHAR(255) NOT NULL,
    `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5,2) DEFAULT 0.00,
    `tax_amount` DECIMAL(15,2) DEFAULT 0.00,
    `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('draft', 'sent', 'accepted', 'declined', 'converted') DEFAULT 'sent',
    `notes` TEXT,
    `terms` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Quotation Items table
CREATE TABLE IF NOT EXISTS `quotation_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quotation_id` INT NOT NULL,
    `sr_no` INT NOT NULL DEFAULT 1,
    `description` TEXT NOT NULL,
    `quantity` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Payments / Receipts table
CREATE TABLE IF NOT EXISTS `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `receipt_no` VARCHAR(50) UNIQUE NOT NULL,
    `invoice_id` INT NOT NULL,
    `client_id` INT NOT NULL,
    `payment_date` DATE NOT NULL,
    `amount` DECIMAL(15,2) NOT NULL,
    `currency` VARCHAR(10) DEFAULT 'PKR',
    `payment_method` ENUM('bank_transfer', 'cash', 'cheque', 'wire', 'online') DEFAULT 'bank_transfer',
    `reference_txn` VARCHAR(100) NULL,
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Expenses table
CREATE TABLE IF NOT EXISTS `expenses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `expense_number` VARCHAR(50) UNIQUE NOT NULL,
    `category` ENUM('hosting_infrastructure', 'developer_payout', 'software_licenses', 'office_rent', 'utilities', 'marketing', 'hardware', 'travel_transport', 'misc') DEFAULT 'misc',
    `title` VARCHAR(255) NOT NULL,
    `vendor_name` VARCHAR(150),
    `amount` DECIMAL(15,2) NOT NULL,
    `currency` VARCHAR(10) DEFAULT 'PKR',
    `expense_date` DATE NOT NULL,
    `payment_method` ENUM('bank_transfer', 'cash', 'credit_card', 'cheque', 'online') DEFAULT 'bank_transfer',
    `status` ENUM('paid', 'pending') DEFAULT 'paid',
    `notes` TEXT,
    `receipt_path` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
