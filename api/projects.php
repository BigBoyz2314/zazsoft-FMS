<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("
                SELECT p.*, c.name as client_name, c.company_name, c.email as client_email
                FROM projects p
                JOIN clients c ON p.client_id = c.id
                WHERE p.id = ?
            ");
            $stmt->execute([$id]);
            $project = $stmt->fetch();

            if (!$project) {
                jsonResponse(['success' => false, 'message' => 'Project not found'], 404);
            }

            // Get invoices generated for this project
            $invStmt = $pdo->prepare("SELECT * FROM invoices WHERE project_id = ? ORDER BY issue_date DESC");
            $invStmt->execute([$id]);
            $invoices = $invStmt->fetchAll();

            jsonResponse(['success' => true, 'project' => $project, 'invoices' => $invoices]);
        } else {
            // List all projects with client details
            $stmt = $pdo->query("
                SELECT 
                    p.*, 
                    c.name as client_name, 
                    c.company_name,
                    COUNT(i.id) as total_invoices_billed,
                    COALESCE(SUM(i.total_amount), 0) as total_billed_amount
                FROM projects p
                JOIN clients c ON p.client_id = c.id
                LEFT JOIN invoices i ON p.id = i.project_id
                GROUP BY p.id
                ORDER BY p.status ASC, p.next_billing_date ASC, p.id DESC
            ");
            $projects = $stmt->fetchAll();
            jsonResponse(['success' => true, 'projects' => $projects]);
        }
    } elseif ($method === 'POST') {
        $data = getJsonInput();

        // Check if action is generate_monthly_invoice
        if ($action === 'generate_invoice' || (!empty($data['action']) && $data['action'] === 'generate_invoice')) {
            $projectId = !empty($data['project_id']) ? intval($data['project_id']) : $id;
            if (!$projectId) {
                jsonResponse(['success' => false, 'message' => 'Project ID required to generate invoice'], 400);
            }

            $projStmt = $pdo->prepare("
                SELECT p.*, c.name as client_name, c.company_name 
                FROM projects p 
                JOIN clients c ON p.client_id = c.id 
                WHERE p.id = ?
            ");
            $projStmt->execute([$projectId]);
            $proj = $projStmt->fetch();

            if (!$proj) {
                jsonResponse(['success' => false, 'message' => 'Project not found'], 404);
            }

            // Determine billing period / month label
            $billingDate = !empty($data['billing_date']) ? $data['billing_date'] : ($proj['next_billing_date'] ?: date('Y-m-d'));
            $billingTimestamp = strtotime($billingDate);
            $monthShort = date('F-y', $billingTimestamp); // e.g. October-26
            $refNo = date('Ymd', $billingTimestamp); // e.g. 20261016

            // Unique invoice number
            $invNumber = 'INV-' . date('Ym') . '-' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);

            $subject = $proj['project_name'] . ' ' . $monthShort;
            $rate = floatval($proj['billing_rate']);
            $currency = $proj['currency'];
            $dueDate = date('Y-m-d', strtotime('+15 days', $billingTimestamp));

            // Default terms
            $settingsStmt = $pdo->query("SELECT default_terms FROM settings LIMIT 1");
            $settings = $settingsStmt->fetch();
            $terms = $settings ? $settings['default_terms'] : '';

            $pdo->beginTransaction();

            $insInv = $pdo->prepare("
                INSERT INTO invoices 
                (invoice_number, ref_no, client_id, project_id, issue_date, due_date, currency, subject, subtotal, tax_rate, tax_amount, discount_amount, total_amount, paid_amount, balance_due, status, notes, terms_and_conditions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 0.00, ?, 0.00, ?, 'sent', ?, ?)
            ");
            $note = 'Note: All prices are in ' . $currency;
            $insInv->execute([
                $invNumber,
                $refNo,
                $proj['client_id'],
                $projectId,
                $billingDate,
                $dueDate,
                $currency,
                $subject,
                $rate,
                $rate,
                $rate,
                $note,
                $terms
            ]);
            $newInvoiceId = $pdo->lastInsertId();

            // Line item
            $insItem = $pdo->prepare("
                INSERT INTO invoice_items 
                (invoice_id, sr_no, description, quantity, unit_price, total_amount)
                VALUES (?, 1, ?, 1.00, ?, ?)
            ");
            $insItem->execute([
                $newInvoiceId,
                $subject,
                $rate,
                $rate
            ]);

            // Advance next billing date by 1 month if monthly retainer
            if ($proj['billing_type'] === 'monthly_retainer') {
                $nextDate = date('Y-m-d', strtotime('+1 month', $billingTimestamp));
                $updProj = $pdo->prepare("UPDATE projects SET next_billing_date = ? WHERE id = ?");
                $updProj->execute([$nextDate, $projectId]);
            }

            $pdo->commit();

            jsonResponse([
                'success' => true,
                'message' => "Monthly retainer invoice {$invNumber} generated successfully!",
                'invoice_id' => $newInvoiceId,
                'invoice_number' => $invNumber
            ]);
        }

        // Standard Project Create
        if (empty($data['client_id']) || empty($data['project_name'])) {
            jsonResponse(['success' => false, 'message' => 'Client and Project Name are required'], 400);
        }

        $code = !empty($data['project_code']) ? $data['project_code'] : 'PRJ-' . strtoupper(substr(uniqid(), -5));

        $stmt = $pdo->prepare("
            INSERT INTO projects 
            (client_id, project_code, project_name, billing_type, billing_rate, currency, billing_cycle_day, next_billing_date, start_date, status, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['client_id'],
            $code,
            $data['project_name'],
            $data['billing_type'] ?? 'monthly_retainer',
            $data['billing_rate'] ?? 0.00,
            $data['currency'] ?? 'PKR',
            $data['billing_cycle_day'] ?? 1,
            $data['next_billing_date'] ?? null,
            $data['start_date'] ?? date('Y-m-d'),
            $data['status'] ?? 'active',
            $data['description'] ?? null
        ]);

        $newId = $pdo->lastInsertId();
        jsonResponse(['success' => true, 'id' => $newId, 'message' => 'Project created successfully']);
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Project ID required'], 400);
        }
        $data = getJsonInput();

        $stmt = $pdo->prepare("
            UPDATE projects SET
                client_id = COALESCE(?, client_id),
                project_code = COALESCE(?, project_code),
                project_name = COALESCE(?, project_name),
                billing_type = COALESCE(?, billing_type),
                billing_rate = COALESCE(?, billing_rate),
                currency = COALESCE(?, currency),
                billing_cycle_day = ?,
                next_billing_date = ?,
                start_date = ?,
                status = COALESCE(?, status),
                description = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['client_id'] ?? null,
            $data['project_code'] ?? null,
            $data['project_name'] ?? null,
            $data['billing_type'] ?? null,
            $data['billing_rate'] ?? null,
            $data['currency'] ?? null,
            $data['billing_cycle_day'] ?? 1,
            $data['next_billing_date'] ?? null,
            $data['start_date'] ?? null,
            $data['status'] ?? null,
            $data['description'] ?? null,
            $id
        ]);

        jsonResponse(['success' => true, 'message' => 'Project updated successfully']);
    } elseif ($method === 'DELETE') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Project ID required'], 400);
        }

        $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['success' => true, 'message' => 'Project deleted successfully']);
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
