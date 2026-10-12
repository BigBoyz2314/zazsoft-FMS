<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

try {
    if ($method === 'GET') {
        if ($id) {
            // Get single client with stats, ledger, projects, and invoices
            $clientStmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
            $clientStmt->execute([$id]);
            $client = $clientStmt->fetch();

            if (!$client) {
                jsonResponse(['success' => false, 'message' => 'Client not found'], 404);
            }

            // Invoices
            $invStmt = $pdo->prepare("
                SELECT * FROM invoices 
                WHERE client_id = ? 
                ORDER BY issue_date DESC, id DESC
            ");
            $invStmt->execute([$id]);
            $invoices = $invStmt->fetchAll();

            // Payments
            $payStmt = $pdo->prepare("
                SELECT p.*, i.invoice_number 
                FROM payments p
                LEFT JOIN invoices i ON p.invoice_id = i.id
                WHERE p.client_id = ?
                ORDER BY p.payment_date DESC, p.id DESC
            ");
            $payStmt->execute([$id]);
            $payments = $payStmt->fetchAll();

            // Projects
            $projStmt = $pdo->prepare("
                SELECT * FROM projects 
                WHERE client_id = ?
                ORDER BY status ASC, id DESC
            ");
            $projStmt->execute([$id]);
            $projects = $projStmt->fetchAll();

            // Financial Summary for this client
            $statsStmt = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(total_amount), 0) as total_invoiced,
                    COALESCE(SUM(paid_amount), 0) as total_paid,
                    COALESCE(SUM(balance_due), 0) as balance_due,
                    COUNT(*) as invoice_count
                FROM invoices 
                WHERE client_id = ? AND status != 'cancelled'
            ");
            $statsStmt->execute([$id]);
            $stats = $statsStmt->fetch();

            jsonResponse([
                'success' => true,
                'client' => $client,
                'stats' => $stats,
                'invoices' => $invoices,
                'payments' => $payments,
                'projects' => $projects
            ]);
        } else {
            // List all clients with aggregated balance and counts
            $stmt = $pdo->query("
                SELECT 
                    c.*,
                    COALESCE(SUM(i.total_amount), 0) as total_invoiced,
                    COALESCE(SUM(i.paid_amount), 0) as total_paid,
                    COALESCE(SUM(i.balance_due), 0) as balance_due,
                    COUNT(DISTINCT p.id) as active_projects_count
                FROM clients c
                LEFT JOIN invoices i ON c.id = i.client_id AND i.status != 'cancelled'
                LEFT JOIN projects p ON c.id = p.client_id AND p.status = 'active'
                GROUP BY c.id
                ORDER BY c.name ASC
            ");
            $clients = $stmt->fetchAll();
            jsonResponse(['success' => true, 'clients' => $clients]);
        }
    } elseif ($method === 'POST') {
        $data = getJsonInput();
        if (empty($data['name']) || empty($data['company_name'])) {
            jsonResponse(['success' => false, 'message' => 'Client Name and Company Name are required'], 400);
        }

        // Generate client code if not provided
        $code = !empty($data['client_code']) ? $data['client_code'] : 'CLT-' . strtoupper(substr(uniqid(), -5));

        $stmt = $pdo->prepare("
            INSERT INTO clients 
            (client_code, name, company_name, email, phone, address, city, country, currency, tax_number, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $code,
            $data['name'],
            $data['company_name'],
            $data['email'] ?? null,
            $data['phone'] ?? null,
            $data['address'] ?? null,
            $data['city'] ?? 'Lahore',
            $data['country'] ?? 'Pakistan',
            $data['currency'] ?? 'PKR',
            $data['tax_number'] ?? null,
            $data['notes'] ?? null,
            $data['status'] ?? 'active'
        ]);

        $newId = $pdo->lastInsertId();
        jsonResponse(['success' => true, 'id' => $newId, 'message' => 'Client created successfully']);
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Client ID is required'], 400);
        }
        $data = getJsonInput();

        $stmt = $pdo->prepare("
            UPDATE clients SET
                client_code = COALESCE(?, client_code),
                name = COALESCE(?, name),
                company_name = COALESCE(?, company_name),
                email = ?,
                phone = ?,
                address = ?,
                city = ?,
                country = ?,
                currency = ?,
                tax_number = ?,
                notes = ?,
                status = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['client_code'] ?? null,
            $data['name'] ?? null,
            $data['company_name'] ?? null,
            $data['email'] ?? null,
            $data['phone'] ?? null,
            $data['address'] ?? null,
            $data['city'] ?? 'Lahore',
            $data['country'] ?? 'Pakistan',
            $data['currency'] ?? 'PKR',
            $data['tax_number'] ?? null,
            $data['notes'] ?? null,
            $data['status'] ?? 'active',
            $id
        ]);

        jsonResponse(['success' => true, 'message' => 'Client updated successfully']);
    } elseif ($method === 'DELETE') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Client ID is required'], 400);
        }

        // Check if client has invoices
        $check = $pdo->prepare("SELECT COUNT(*) FROM invoices WHERE client_id = ?");
        $check->execute([$id]);
        if ($check->fetchColumn() > 0) {
            jsonResponse(['success' => false, 'message' => 'Cannot delete client with existing invoices. You can archive or mark client as inactive instead.'], 400);
        }

        $stmt = $pdo->prepare("DELETE FROM clients WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['success' => true, 'message' => 'Client deleted successfully']);
    }
} catch (Exception $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
