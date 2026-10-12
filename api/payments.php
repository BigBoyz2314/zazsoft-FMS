<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

try {
    if ($method === 'GET') {
        if ($id) {
            // Receipt voucher details
            $stmt = $pdo->prepare("
                SELECT p.*, 
                       i.invoice_number, i.ref_no, i.subject, i.total_amount as invoice_total, i.balance_due as invoice_balance,
                       c.name as client_name, c.company_name, c.email as client_email, c.phone as client_phone, c.address as client_address
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                JOIN clients c ON p.client_id = c.id
                WHERE p.id = ?
            ");
            $stmt->execute([$id]);
            $payment = $stmt->fetch();

            if (!$payment) {
                jsonResponse(['success' => false, 'message' => 'Payment receipt not found'], 404);
            }

            $settingsStmt = $pdo->query("SELECT * FROM settings LIMIT 1");
            $settings = $settingsStmt->fetch();

            jsonResponse(['success' => true, 'payment' => $payment, 'settings' => $settings]);
        } else {
            // List all payments
            $clientId = isset($_GET['client_id']) ? intval($_GET['client_id']) : 0;
            $invoiceId = isset($_GET['invoice_id']) ? intval($_GET['invoice_id']) : 0;

            $sql = "
                SELECT p.*, 
                       i.invoice_number, i.ref_no,
                       c.name as client_name, c.company_name
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                JOIN clients c ON p.client_id = c.id
                WHERE 1=1
            ";
            $params = [];
            if ($clientId > 0) {
                $sql .= " AND p.client_id = ?";
                $params[] = $clientId;
            }
            if ($invoiceId > 0) {
                $sql .= " AND p.invoice_id = ?";
                $params[] = $invoiceId;
            }

            $sql .= " ORDER BY p.payment_date DESC, p.id DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $payments = $stmt->fetchAll();

            jsonResponse(['success' => true, 'payments' => $payments]);
        }
    } elseif ($method === 'POST') {
        $data = getJsonInput();

        if (empty($data['invoice_id']) || empty($data['amount'])) {
            jsonResponse(['success' => false, 'message' => 'Invoice and payment amount are required'], 400);
        }

        $invoiceId = intval($data['invoice_id']);
        $amount = floatval($data['amount']);
        if ($amount <= 0) {
            jsonResponse(['success' => false, 'message' => 'Payment amount must be greater than 0'], 400);
        }

        $pdo->beginTransaction();

        // Lock invoice record
        $invStmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ? FOR UPDATE");
        $invStmt->execute([$invoiceId]);
        $invoice = $invStmt->fetch();

        if (!$invoice) {
            jsonResponse(['success' => false, 'message' => 'Invoice not found'], 404);
        }

        $receiptNo = !empty($data['receipt_no']) ? $data['receipt_no'] : 'REC-' . date('Ym') . '-' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
        $paymentDate = !empty($data['payment_date']) ? $data['payment_date'] : date('Y-m-d');
        $paymentMethod = !empty($data['payment_method']) ? $data['payment_method'] : 'bank_transfer';
        $refTxn = !empty($data['reference_txn']) ? $data['reference_txn'] : null;
        $notes = !empty($data['notes']) ? $data['notes'] : null;
        $currency = !empty($data['currency']) ? $data['currency'] : $invoice['currency'];

        // Insert payment record
        $insPay = $pdo->prepare("
            INSERT INTO payments 
            (receipt_no, invoice_id, client_id, payment_date, amount, currency, payment_method, reference_txn, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $insPay->execute([
            $receiptNo,
            $invoiceId,
            $invoice['client_id'],
            $paymentDate,
            $amount,
            $currency,
            $paymentMethod,
            $refTxn,
            $notes
        ]);
        $paymentId = $pdo->lastInsertId();

        // Update invoice balance and status
        $newPaidAmount = floatval($invoice['paid_amount']) + $amount;
        $totalAmount = floatval($invoice['total_amount']);
        $newBalanceDue = max(0, $totalAmount - $newPaidAmount);
        $newStatus = ($newBalanceDue <= 0.001) ? 'paid' : 'partially_paid';

        $updInv = $pdo->prepare("
            UPDATE invoices 
            SET paid_amount = ?, balance_due = ?, status = ?
            WHERE id = ?
        ");
        $updInv->execute([$newPaidAmount, $newBalanceDue, $newStatus, $invoiceId]);

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'id' => $paymentId,
            'receipt_no' => $receiptNo,
            'new_balance' => $newBalanceDue,
            'invoice_status' => $newStatus,
            'message' => "Payment of {$amount} {$currency} recorded successfully. Invoice marked as {$newStatus}."
        ]);
    } elseif ($method === 'DELETE') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Payment ID required'], 400);
        }

        $pdo->beginTransaction();

        $payStmt = $pdo->prepare("SELECT * FROM payments WHERE id = ? FOR UPDATE");
        $payStmt->execute([$id]);
        $payment = $payStmt->fetch();

        if ($payment) {
            $invoiceId = $payment['invoice_id'];
            $amount = floatval($payment['amount']);

            // Delete payment
            $delStmt = $pdo->prepare("DELETE FROM payments WHERE id = ?");
            $delStmt->execute([$id]);

            // Recompute invoice paid_amount and balance
            $invStmt = $pdo->prepare("SELECT total_amount FROM invoices WHERE id = ? FOR UPDATE");
            $invStmt->execute([$invoiceId]);
            $totalAmount = floatval($invStmt->fetchColumn() ?: 0);

            $sumStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = ?");
            $sumStmt->execute([$invoiceId]);
            $newPaid = floatval($sumStmt->fetchColumn() ?: 0);
            $newBal = max(0, $totalAmount - $newPaid);
            $newStatus = ($newPaid <= 0) ? 'sent' : (($newBal <= 0) ? 'paid' : 'partially_paid');

            $upd = $pdo->prepare("UPDATE invoices SET paid_amount = ?, balance_due = ?, status = ? WHERE id = ?");
            $upd->execute([$newPaid, $newBal, $newStatus, $invoiceId]);
        }

        $pdo->commit();
        jsonResponse(['success' => true, 'message' => 'Payment deleted and invoice balance recalculated']);
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
