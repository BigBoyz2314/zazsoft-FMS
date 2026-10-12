<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

try {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
            $stmt->execute([$id]);
            $expense = $stmt->fetch();
            if (!$expense) {
                jsonResponse(['success' => false, 'message' => 'Expense not found'], 404);
            }
            jsonResponse(['success' => true, 'expense' => $expense]);
        } else {
            $category = isset($_GET['category']) ? $_GET['category'] : '';
            $month = isset($_GET['month']) ? $_GET['month'] : ''; // format YYYY-MM

            $sql = "SELECT * FROM expenses WHERE 1=1";
            $params = [];

            if (!empty($category)) {
                $sql .= " AND category = ?";
                $params[] = $category;
            }
            if (!empty($month)) {
                $sql .= " AND DATE_FORMAT(expense_date, '%Y-%m') = ?";
                $params[] = $month;
            }

            $sql .= " ORDER BY expense_date DESC, id DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $expenses = $stmt->fetchAll();

            // Category summary
            $catStmt = $pdo->query("
                SELECT category, COUNT(*) as count, SUM(amount) as total
                FROM expenses
                GROUP BY category
            ");
            $byCategory = $catStmt->fetchAll();

            jsonResponse(['success' => true, 'expenses' => $expenses, 'by_category' => $byCategory]);
        }
    } elseif ($method === 'POST') {
        $data = getJsonInput();

        if (empty($data['title']) || empty($data['amount'])) {
            jsonResponse(['success' => false, 'message' => 'Title and amount are required'], 400);
        }

        $expNo = !empty($data['expense_number']) ? $data['expense_number'] : 'EXP-' . date('Ym') . '-' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
        $date = !empty($data['expense_date']) ? $data['expense_date'] : date('Y-m-d');
        $currency = !empty($data['currency']) ? $data['currency'] : 'PKR';

        $stmt = $pdo->prepare("
            INSERT INTO expenses 
            (expense_number, category, title, vendor_name, amount, currency, expense_date, payment_method, status, notes, receipt_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $expNo,
            $data['category'] ?? 'misc',
            $data['title'],
            $data['vendor_name'] ?? null,
            floatval($data['amount']),
            $currency,
            $date,
            $data['payment_method'] ?? 'bank_transfer',
            $data['status'] ?? 'paid',
            $data['notes'] ?? null,
            $data['receipt_path'] ?? null
        ]);

        $newId = $pdo->lastInsertId();
        jsonResponse(['success' => true, 'id' => $newId, 'expense_number' => $expNo, 'message' => 'Expense logged successfully']);
    } elseif ($method === 'PUT') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Expense ID required'], 400);
        }
        $data = getJsonInput();

        $stmt = $pdo->prepare("
            UPDATE expenses SET
                category = COALESCE(?, category),
                title = COALESCE(?, title),
                vendor_name = ?,
                amount = COALESCE(?, amount),
                currency = COALESCE(?, currency),
                expense_date = COALESCE(?, expense_date),
                payment_method = COALESCE(?, payment_method),
                status = COALESCE(?, status),
                notes = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['category'] ?? null,
            $data['title'] ?? null,
            $data['vendor_name'] ?? null,
            isset($data['amount']) ? floatval($data['amount']) : null,
            $data['currency'] ?? null,
            $data['expense_date'] ?? null,
            $data['payment_method'] ?? null,
            $data['status'] ?? null,
            $data['notes'] ?? null,
            $id
        ]);

        jsonResponse(['success' => true, 'message' => 'Expense updated successfully']);
    } elseif ($method === 'DELETE') {
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Expense ID required'], 400);
        }
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['success' => true, 'message' => 'Expense deleted successfully']);
    }
} catch (Exception $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
