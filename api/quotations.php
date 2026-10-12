<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("
                SELECT q.*, c.name as client_name, c.company_name, c.email as client_email, c.phone as client_phone, c.address as client_address
                FROM quotations q
                JOIN clients c ON q.client_id = c.id
                WHERE q.id = ?
            ");
            $stmt->execute([$id]);
            $quotation = $stmt->fetch();

            if (!$quotation) {
                jsonResponse(['success' => false, 'message' => 'Quotation not found'], 404);
            }

            $itemsStmt = $pdo->prepare("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sr_no ASC");
            $itemsStmt->execute([$id]);
            $items = $itemsStmt->fetchAll();

            $settingsStmt = $pdo->query("SELECT * FROM settings LIMIT 1");
            $settings = $settingsStmt->fetch();

            jsonResponse(['success' => true, 'quotation' => $quotation, 'items' => $items, 'settings' => $settings]);
        } else {
            $stmt = $pdo->query("
                SELECT q.*, c.name as client_name, c.company_name
                FROM quotations q
                JOIN clients c ON q.client_id = c.id
                ORDER BY q.issue_date DESC, q.id DESC
            ");
            $quotations = $stmt->fetchAll();
            jsonResponse(['success' => true, 'quotations' => $quotations]);
        }
    } elseif ($method === 'POST') {
        $data = getJsonInput();

        // Convert to Invoice action
        if ($action === 'convert' || (!empty($data['action']) && $data['action'] === 'convert')) {
            $quoteId = !empty($data['quotation_id']) ? intval($data['quotation_id']) : $id;
            if (!$quoteId) {
                jsonResponse(['success' => false, 'message' => 'Quotation ID required'], 400);
            }

            $qStmt = $pdo->prepare("SELECT * FROM quotations WHERE id = ?");
            $qStmt->execute([$quoteId]);
            $quote = $qStmt->fetch();

            if (!$quote) {
                jsonResponse(['success' => false, 'message' => 'Quotation not found'], 404);
            }

            $itemsStmt = $pdo->prepare("SELECT * FROM quotation_items WHERE quotation_id = ?");
            $itemsStmt->execute([$quoteId]);
            $items = $itemsStmt->fetchAll();

            $pdo->beginTransaction();

            $invNumber = 'INV-' . date('Ym') . '-' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
            $refNo = date('Ymd');
            $issueDate = date('Y-m-d');
            $dueDate = date('Y-m-d', strtotime('+15 days'));

            $insInv = $pdo->prepare("
                INSERT INTO invoices 
                (invoice_number, ref_no, client_id, issue_date, due_date, currency, subject, subtotal, tax_rate, tax_amount, discount_amount, total_amount, paid_amount, balance_due, status, notes, terms_and_conditions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, 0.00, ?, 'sent', ?, ?)
            ");
            $insInv->execute([
                $invNumber,
                $refNo,
                $quote['client_id'],
                $issueDate,
                $dueDate,
                $quote['currency'],
                $quote['subject'],
                $quote['subtotal'],
                $quote['tax_rate'],
                $quote['tax_amount'],
                $quote['total_amount'],
                $quote['total_amount'],
                $quote['notes'],
                $quote['terms']
            ]);
            $newInvoiceId = $pdo->lastInsertId();

            $insItem = $pdo->prepare("
                INSERT INTO invoice_items (invoice_id, sr_no, description, quantity, unit_price, total_amount)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            foreach ($items as $it) {
                $insItem->execute([$newInvoiceId, $it['sr_no'], $it['description'], $it['quantity'], $it['unit_price'], $it['total_amount']]);
            }

            // Mark quotation as converted
            $updQuote = $pdo->prepare("UPDATE quotations SET status = 'converted' WHERE id = ?");
            $updQuote->execute([$quoteId]);

            $pdo->commit();

            jsonResponse([
                'success' => true,
                'message' => 'Quotation converted to Invoice successfully!',
                'invoice_id' => $newInvoiceId,
                'invoice_number' => $invNumber
            ]);
        }

        // Create Quotation
        if (empty($data['client_id']) || empty($data['items'])) {
            jsonResponse(['success' => false, 'message' => 'Client and items are required'], 400);
        }

        $pdo->beginTransaction();

        $quoteNumber = !empty($data['quotation_number']) ? $data['quotation_number'] : 'QT-' . date('Ym') . '-' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
        $issueDate = !empty($data['issue_date']) ? $data['issue_date'] : date('Y-m-d');
        $validUntil = !empty($data['valid_until']) ? $data['valid_until'] : date('Y-m-d', strtotime('+30 days'));
        $currency = !empty($data['currency']) ? $data['currency'] : 'PKR';
        $subject = !empty($data['subject']) ? $data['subject'] : 'Software Services Proposal';

        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $qty = floatval($item['quantity'] ?? 1);
            $price = floatval($item['unit_price'] ?? 0);
            $subtotal += ($qty * $price);
        }

        $taxRate = isset($data['tax_rate']) ? floatval($data['tax_rate']) : 0.00;
        $taxAmount = ($subtotal * $taxRate) / 100.0;
        $totalAmount = $subtotal + $taxAmount;

        $insStmt = $pdo->prepare("
            INSERT INTO quotations 
            (quotation_number, client_id, issue_date, valid_until, currency, subject, subtotal, tax_rate, tax_amount, total_amount, status, notes, terms)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?)
        ");
        $insStmt->execute([
            $quoteNumber,
            $data['client_id'],
            $issueDate,
            $validUntil,
            $currency,
            $subject,
            $subtotal,
            $taxRate,
            $taxAmount,
            $totalAmount,
            $data['notes'] ?? 'Quotation valid for 30 days',
            $data['terms'] ?? ''
        ]);
        $newQuoteId = $pdo->lastInsertId();

        $insItem = $pdo->prepare("
            INSERT INTO quotation_items (quotation_id, sr_no, description, quantity, unit_price, total_amount)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $sr = 1;
        foreach ($data['items'] as $item) {
            $desc = !empty($item['description']) ? $item['description'] : 'Software Development Service';
            $qty = floatval($item['quantity'] ?? 1);
            $price = floatval($item['unit_price'] ?? 0);
            $lineTotal = $qty * $price;
            $insItem->execute([$newQuoteId, $sr++, $desc, $qty, $price, $lineTotal]);
        }

        $pdo->commit();
        jsonResponse(['success' => true, 'id' => $newQuoteId, 'quotation_number' => $quoteNumber, 'message' => 'Quotation created successfully']);
    } elseif ($method === 'DELETE') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Quotation ID required'], 400);
        }
        $stmt = $pdo->prepare("DELETE FROM quotations WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['success' => true, 'message' => 'Quotation deleted successfully']);
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
