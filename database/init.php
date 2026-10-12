<?php
/**
 * Database Initializer & Migration Script for ZAZSoft FMS
 * Works on both local XAMPP and Hostinger hPanel MySQL
 */
header('Content-Type: application/json');

$configFile = __DIR__ . '/../api/config.php';
$config = file_exists($configFile) ? require $configFile : [];

$host    = $config['db_host'] ?? 'localhost';
$dbName  = $config['db_name'] ?? 'zazsoft_fms';
$user    = $config['db_user'] ?? 'root';
$pass    = $config['db_pass'] ?? '';
$port    = $config['db_port'] ?? '3306';
$charset = $config['db_charset'] ?? 'utf8mb4';

try {
    // Connect to MySQL server (or directly to DB if user has restricted privileges like on Hostinger)
    try {
        $pdo = new PDO("mysql:host=$host;port=$port;charset=$charset", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `$dbName`");
    } catch (Exception $connEx) {
        // On Hostinger, database must be created via hPanel first, so direct connection to DB name is required:
        $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbName;charset=$charset", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
    }

    // Execute schema
    $schemaFile = __DIR__ . '/schema.sql';
    if (file_exists($schemaFile)) {
        $sql = file_get_contents($schemaFile);
        // Remove CREATE DATABASE if running inside restricted user
        $sql = preg_replace('/CREATE DATABASE[^;]+;/i', '', $sql);
        $sql = preg_replace('/USE `?[a-zA-Z0-9_]+`?;/i', '', $sql);
        $pdo->exec($sql);
    }

    // Seed Settings if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM `settings`");
    if ($stmt->fetchColumn() == 0) {
        $defaultTerms = "Product Shall Be Used for One Business Unit Only\nNo Responsibility for Any Wrong Data Entry!\n24/7 SLA Support (Service Level Agreement)\nStrict Data Privacy / Security Policy";
        $addrPk = "H 219, Molana Ahmad Ali Road, Ravi Road Lahore, Pakistan";
        $addrUae = "2001, Prime Tower, Business Bay, Dubai, UAE";

        $insSettings = $pdo->prepare("
            INSERT INTO `settings` 
            (`company_name`, `tagline`, `email`, `website`, `phone_pk`, `phone_uae`, `address_pk`, `address_uae`, `default_currency`, `default_terms`, `bank_name`, `account_title`, `account_number`, `iban`, `swift_code`, `show_uae_address`, `show_bank_details`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PKR', ?, 'Meezan Bank Limited', 'ZAZ Soft', '0101-0102030405', 'PK36MEZN0001010102030405', 'MEZNPKKA', 1, 1)
        ");
        $insSettings->execute([
            'ZAZ Soft',
            'At Your Service Always',
            'zazimran@gmail.com',
            'www.zazsoft.com',
            '+92 309 9507777',
            '+971 52 7772758',
            $addrPk,
            $addrUae,
            $defaultTerms
        ]);
    }

    // Seed Clients if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM `clients`");
    if ($stmt->fetchColumn() == 0) {
        $insClient = $pdo->prepare("
            INSERT INTO `clients` 
            (`id`, `client_code`, `name`, `company_name`, `email`, `phone`, `address`, `city`, `country`, `currency`, `notes`, `status`)
            VALUES 
            (1, 'CLT-1001', 'Mr. Naeem Anwar', 'AeroSoft Thailand', 'naeem@aerosoft.com', '+92 300 1234567', 'Gulberg III, Main Boulevard', 'Lahore', 'Pakistan', 'PKR', 'Long-standing software maintenance client', 'active'),
            (2, 'CLT-1002', 'Sheikh Tariq Al-Maktoum', 'Gulf Retail Solutions', 'tariq@gulfretail.ae', '+971 50 8899221', 'Business Bay Tower A, Floor 14', 'Dubai', 'United Arab Emirates', 'AED', 'E-Commerce ERP cloud integration', 'active'),
            (3, 'CLT-1003', 'Sarah Jenkins', 'Apex Logistics UK', 'sarah@apexlogistics.co.uk', '+44 20 7946 0912', '124 City Road', 'London', 'United Kingdom', 'USD', 'Fleet & Dispatch Tracking App', 'active')
        ");
        $insClient->execute();
    }

    // Seed Projects if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM `projects`");
    if ($stmt->fetchColumn() == 0) {
        $insProj = $pdo->prepare("
            INSERT INTO `projects` 
            (`id`, `client_id`, `project_code`, `project_name`, `billing_type`, `billing_rate`, `currency`, `billing_cycle_day`, `next_billing_date`, `start_date`, `status`, `description`)
            VALUES
            (1, 1, 'PRJ-AERO-01', 'Production Management Software', 'monthly_retainer', 40000.00, 'PKR', 16, '2026-10-16', '2026-01-01', 'active', 'Monthly SLA maintenance & feature updates for production management system'),
            (2, 2, 'PRJ-GULF-01', 'Omnichannel POS & Cloud Sync', 'monthly_retainer', 3500.00, 'AED', 1, '2026-11-01', '2026-04-15', 'active', 'High availability retail POS microservice retainer'),
            (3, 3, 'PRJ-APEX-01', 'Fleet Logistics Portal', 'fixed_cost', 6500.00, 'USD', 1, NULL, '2026-06-01', 'active', 'Full lifecycle development of dispatch mobile & web portal')
        ");
        $insProj->execute();
    }

    // Seed Invoices if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM `invoices`");
    if ($stmt->fetchColumn() == 0) {
        $termsDoc = "Product Shall Be Used for One Business Unit Only\nNo Responsibility for Any Wrong Data Entry!\n24/7 SLA Support (Service Level Agreement)\nStrict Data Privacy / Security Policy";

        $insInv = $pdo->prepare("
            INSERT INTO `invoices` 
            (`id`, `invoice_number`, `ref_no`, `client_id`, `project_id`, `issue_date`, `due_date`, `currency`, `subject`, `subtotal`, `tax_rate`, `tax_amount`, `discount_amount`, `total_amount`, `paid_amount`, `balance_due`, `status`, `notes`, `terms_and_conditions`)
            VALUES
            (1, 'INV-2026-0901', '20260816', 1, 1, '2026-09-16', '2026-09-30', 'PKR', 'Production Management Software September-26', 40000.00, 0.00, 0.00, 0.00, 40000.00, 40000.00, 0.00, 'paid', 'Note: All prices are in PKR', ?),
            (2, 'INV-2026-1001', '20261016', 1, 1, '2026-10-16', '2026-10-31', 'PKR', 'Production Management Software October-26', 40000.00, 0.00, 0.00, 0.00, 40000.00, 0.00, 40000.00, 'sent', 'Note: All prices are in PKR', ?),
            (3, 'INV-2026-1002', '20261001', 2, 2, '2026-10-01', '2026-10-15', 'AED', 'Omnichannel POS & Cloud Sync October-26', 3500.00, 5.00, 175.00, 0.00, 3675.00, 3675.00, 0.00, 'paid', 'VAT Registered', ?)
        ");
        $insInv->execute([$termsDoc, $termsDoc, $termsDoc]);

        $insItem = $pdo->prepare("
            INSERT INTO `invoice_items` (`invoice_id`, `sr_no`, `description`, `quantity`, `unit_price`, `total_amount`)
            VALUES
            (1, 1, 'Production Management Software September-26', 1.00, 40000.00, 40000.00),
            (2, 1, 'Production Management Software October-26', 1.00, 40000.00, 40000.00),
            (3, 1, 'Monthly POS Infrastructure Maintenance & SLA', 1.00, 3500.00, 3500.00)
        ");
        $insItem->execute();
    }

    echo json_encode(['status' => 'success', 'message' => "Database '$dbName' initialized successfully on $host!"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
