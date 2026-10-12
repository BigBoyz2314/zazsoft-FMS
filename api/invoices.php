<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    if ($method === 'GET') {
        if ($id) {
            // Get single invoice with full details, items, client, payments, company settings
            $stmt = $pdo->prepare("
                SELECT i.*, 
                       c.name as client_name, 
                       c.company_name, 
                       c.email as client_email, 
                       c.phone as client_phone, 
                       c.address as client_address,
                       c.city as client_city,
                       c.country as client_country,
                       p.project_name
                FROM invoices i
                JOIN clients c ON i.client_id = c.id
                LEFT JOIN projects p ON i.project_id = p.id
                WHERE i.id = ?
            ");
            $stmt->execute([$id]);
            $invoice = $stmt->fetch();

            if (!$invoice) {
                jsonResponse(['success' => false, 'message' => 'Invoice not found'], 404);
            }

            // Items
            $itemStmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sr_no ASC, id ASC");
            $itemStmt->execute([$id]);
            $items = $itemStmt->fetchAll();

            // Payments applied
            $payStmt = $pdo->prepare("SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC");
            $payStmt->execute([$id]);
            $payments = $payStmt->fetchAll();

            // Company Settings
            $settingsStmt = $pdo->query("SELECT * FROM settings LIMIT 1");
            $settings = $settingsStmt->fetch();

            jsonResponse([
                'success' => true,
                'invoice' => $invoice,
                'items' => $items,
                'payments' => $payments,
                'settings' => $settings
            ]);
        } else {
            // List invoices with filtering
            $status = isset($_GET['status']) ? $_GET['status'] : '';
            $clientId = isset($_GET['client_id']) ? intval($_GET['client_id']) : 0;
            $search = isset($_GET['search']) ? trim($_GET['search']) : '';

            $sql = "
                SELECT 
                    i.*, 
                    c.name as client_name, 
                    c.company_name,
                    p.project_name
                FROM invoices i
                JOIN clients c ON i.client_id = c.id
                LEFT JOIN projects p ON i.project_id = p.id
                WHERE 1=1
            ";
            $params = [];

            if (!empty($status)) {
                $sql .= " AND i.status = ?";
                $params[] = $status;
            }
            if ($clientId > 0) {
                $sql .= " AND i.client_id = ?";
                $params[] = $clientId;
            }
            if (!empty($search)) {
                $sql .= " AND (i.invoice_number LIKE ? OR i.ref_no LIKE ? OR i.subject LIKE ? OR c.name LIKE ? OR c.company_name LIKE ?)";
                $term = "%$search%";
                $params = array_merge($params, [$term, $term, $term, $term, $term]);
            }

            $sql .= " ORDER BY i.issue_date DESC, i.id DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $invoices = $stmt->fetchAll();

            jsonResponse(['success' => true, 'invoices' => $invoices]);
        }
    } elseif ($method === 'POST') {
        $data = getJsonInput();

        if (empty($data['client_id']) || empty($data['items']) || !is_array($data['items'])) {
            jsonResponse(['success' => false, 'message' => 'Client and at least one line item are required'], 400);
        }

        $pdo->beginTransaction();

        $issueDate = !empty($data['issue_date']) ? $data['issue_date'] : date('Y-m-d');
        $dueDate = !empty($data['due_date']) ? $data['due_date'] : date('Y-m-d', strtotime('+15 days', strtotime($issueDate)));
        $currency = !empty($data['currency']) ? $data['currency'] : 'PKR';

        // Auto-generate ref_no if not provided (like 20260816 format from docx)
        $refNo = !empty($data['ref_no']) ? $data['ref_no'] : date('Ymd', strtotime($issueDate));
        
        // Auto-generate invoice number if not provided
        $invNumber = !empty($data['invoice_number']) 
            ? $data['invoice_number'] 
            : 'INV-' . date('Ym', strtotime($issueDate)) . '-' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);

        $subject = !empty($data['subject']) ? $data['subject'] : 'Software Services Invoice';
        $taxRate = isset($data['tax_rate']) ? floatval($data['tax_rate']) : 0.00;
        $discountAmount = isset($data['discount_amount']) ? floatval($data['discount_amount']) : 0.00;

        // Calculate subtotal from items
        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $qty = floatval($item['quantity'] ?? 1);
            $price = floatval($item['unit_price'] ?? 0);
            $subtotal += ($qty * $price);
        }

        $taxAmount = ($subtotal * $taxRate) / 100.0;
        $totalAmount = max(0, $subtotal + $taxAmount - $discountAmount);
        $paidAmount = isset($data['paid_amount']) ? floatval($data['paid_amount']) : 0.00;
        $balanceDue = max(0, $totalAmount - $paidAmount);

        $status = 'sent';
        if (!empty($data['status'])) {
            $status = $data['status'];
        } elseif ($balanceDue <= 0 && $totalAmount > 0) {
            $status = 'paid';
        } elseif ($paidAmount > 0) {
            $status = 'partially_paid';
        }

        // Terms and conditions
        $terms = !empty($data['terms_and_conditions']) ? $data['terms_and_conditions'] : null;
        if (!$terms) {
            $settingsStmt = $pdo->query("SELECT default_terms FROM settings LIMIT 1");
            $terms = $settingsStmt->fetchColumn() ?: '';
        }

        $note = !empty($data['notes']) ? $data['notes'] : ('Note: All prices are in ' . $currency);

        $insStmt = $pdo->prepare("
            INSERT INTO invoices 
            (invoice_number, ref_no, client_id, project_id, issue_date, due_date, currency, exchange_rate, subject, subtotal, tax_rate, tax_amount, discount_amount, total_amount, paid_amount, balance_due, status, notes, terms_and_conditions)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1.0000, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $insStmt->execute([
            $invNumber,
            $refNo,
            $data['client_id'],
            $data['project_id'] ?? null,
            $issueDate,
            $dueDate,
            $currency,
            $subject,
            $subtotal,
            $taxRate,
            $taxAmount,
            $discountAmount,
            $totalAmount,
            $paidAmount,
            $balanceDue,
            $status,
            $note,
            $terms
        ]);

        $newInvoiceId = $pdo->lastInsertId();

        // Insert items
        $itemIns = $pdo->prepare("
            INSERT INTO invoice_items 
            (invoice_id, sr_no, description, quantity, unit_price, total_amount)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $sr = 1;
        foreach ($data['items'] as $item) {
            $desc = !empty($item['description']) ? $item['description'] : 'Software Services';
            $qty = floatval($item['quantity'] ?? 1);
            $price = floatval($item['unit_price'] ?? 0);
            $lineTotal = $qty * $price;
            $itemIns->execute([$newInvoiceId, $sr++, $desc, $qty, $price, $lineTotal]);
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'id' => $newInvoiceId,
            'invoice_number' => $invNumber,
            'message' => 'Invoice created successfully'
        ]);
    } elseif ($method === 'PUT') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Invoice ID required'], 400);
        }
        $data = getJsonInput();

        $pdo->beginTransaction();

        $subtotal = 0;
        if (!empty($data['items']) && is_array($data['items'])) {
            foreach ($data['items'] as $item) {
                $qty = floatval($item['quantity'] ?? 1);
                $price = floatval($item['unit_price'] ?? 0);
                $subtotal += ($qty * $price);
            }
        } else {
            $subtotal = floatval($data['subtotal'] ?? 0);
        }

        $taxRate = isset($data['tax_rate']) ? floatval($data['tax_rate']) : 0.00;
        $discountAmount = isset($data['discount_amount']) ? floatval($data['discount_amount']) : 0.00;
        $taxAmount = ($subtotal * $taxRate) / 100.0;
        $totalAmount = max(0, $subtotal + $taxAmount - $discountAmount);

        // Fetch current paid amount
        $currStmt = $pdo->prepare("SELECT paid_amount FROM invoices WHERE id = ?");
        $currStmt->execute([$id]);
        $currPaid = floatval($currStmt->fetchColumn() ?: 0);
        $paidAmount = isset($data['paid_amount']) ? floatval($data['paid_amount']) : $currPaid;
        $balanceDue = max(0, $totalAmount - $paidAmount);

        $status = $data['status'] ?? 'sent';
        if ($balanceDue <= 0 && $totalAmount > 0) {
            $status = 'paid';
        } elseif ($paidAmount > 0 && $balanceDue > 0) {
            $status = 'partially_paid';
        }

        $stmt = $pdo->prepare("
            UPDATE invoices SET
                client_id = COALESCE(?, client_id),
                project_id = ?,
                ref_no = COALESCE(?, ref_no),
                issue_date = COALESCE(?, issue_date),
                due_date = COALESCE(?, due_date),
                currency = COALESCE(?, currency),
                subject = COALESCE(?, subject),
                subtotal = ?,
                tax_rate = ?,
                tax_amount = ?,
                discount_amount = ?,
                total_amount = ?,
                paid_amount = ?,
                balance_due = ?,
                status = ?,
                notes = ?,
                terms_and_conditions = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['client_id'] ?? null,
            $data['project_id'] ?? null,
            $data['ref_no'] ?? null,
            $data['issue_date'] ?? null,
            $data['due_date'] ?? null,
            $data['currency'] ?? null,
            $data['subject'] ?? null,
            $subtotal,
            $taxRate,
            $taxAmount,
            $discountAmount,
            $totalAmount,
            $paidAmount,
            $balanceDue,
            $status,
            $data['notes'] ?? null,
            $data['terms_and_conditions'] ?? null,
            $id
        ]);

        if (!empty($data['items']) && is_array($data['items'])) {
            // Re-insert items
            $delItems = $pdo->prepare("DELETE FROM invoice_items WHERE invoice_id = ?");
            $delItems->execute([$id]);

            $itemIns = $pdo->prepare("
                INSERT INTO invoice_items 
                (invoice_id, sr_no, description, quantity, unit_price, total_amount)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $sr = 1;
            foreach ($data['items'] as $item) {
                $desc = !empty($item['description']) ? $item['description'] : 'Software Services';
                $qty = floatval($item['quantity'] ?? 1);
                $price = floatval($item['unit_price'] ?? 0);
                $lineTotal = $qty * $price;
                $itemIns->execute([$id, $sr++, $desc, $qty, $price, $lineTotal]);
            }
        }

        $pdo->commit();
        jsonResponse(['success' => true, 'message' => 'Invoice updated successfully']);
    } elseif ($method === 'PATCH') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Invoice ID required'], 400);
        }
        $data = getJsonInput();

        if (isset($data['status'])) {
            $upd = $pdo->prepare("UPDATE invoices SET status = ? WHERE id = ?");
            $upd->execute([$data['status'], $id]);
            jsonResponse(['success' => true, 'message' => 'Invoice status updated']);
        }
    } elseif ($method === 'DELETE') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Invoice ID required'], 400);
        }

        $del = $pdo->prepare("DELETE FROM invoices WHERE id = ?");
        $del->execute([$id]);
        jsonResponse(['success' => true, 'message' => 'Invoice deleted successfully']);
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
