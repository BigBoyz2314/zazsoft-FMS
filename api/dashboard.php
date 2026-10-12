<?php
require_once __DIR__ . '/db.php';

try {
    // 1. Invoices overview
    $invStmt = $pdo->query("
        SELECT 
            COUNT(*) as total_invoices,
            COALESCE(SUM(total_amount), 0) as total_invoiced,
            COALESCE(SUM(paid_amount), 0) as total_collected,
            COALESCE(SUM(balance_due), 0) as total_receivable,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as paid_count,
            COALESCE(SUM(CASE WHEN status = 'sent' OR status = 'partially_paid' THEN 1 ELSE 0 END), 0) as pending_count,
            COALESCE(SUM(CASE WHEN due_date < CURDATE() AND status != 'paid' AND status != 'cancelled' THEN 1 ELSE 0 END), 0) as overdue_count,
            COALESCE(SUM(CASE WHEN due_date < CURDATE() AND status != 'paid' AND status != 'cancelled' THEN balance_due ELSE 0 END), 0) as overdue_amount
        FROM invoices
    ");
    $invOverview = $invStmt->fetch();

    // 2. Expenses overview
    $expStmt = $pdo->query("
        SELECT 
            COUNT(*) as total_expenses_count,
            COALESCE(SUM(amount), 0) as total_expenses,
            COALESCE(SUM(CASE WHEN MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE()) THEN amount ELSE 0 END), 0) as this_month_expenses
        FROM expenses
    ");
    $expOverview = $expStmt->fetch();

    // 3. Active Projects & Monthly Retainers (MRR)
    $projStmt = $pdo->query("
        SELECT 
            COUNT(*) as total_projects,
            COALESCE(SUM(CASE WHEN billing_type = 'monthly_retainer' AND status = 'active' THEN 1 ELSE 0 END), 0) as active_retainers,
            COALESCE(SUM(CASE WHEN billing_type = 'monthly_retainer' AND status = 'active' THEN billing_rate ELSE 0 END), 0) as mrr_pkr
        FROM projects
    ");
    $projOverview = $projStmt->fetch();

    // 4. Retainers due or upcoming for billing
    $upcomingRetainersStmt = $pdo->query("
        SELECT p.*, c.name as client_name, c.company_name
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        WHERE p.billing_type = 'monthly_retainer' AND p.status = 'active'
        ORDER BY p.next_billing_date ASC
        LIMIT 5
    ");
    $upcomingRetainers = $upcomingRetainersStmt->fetchAll();

    // 5. Recent Invoices
    $recentInvStmt = $pdo->query("
        SELECT i.*, c.name as client_name, c.company_name
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        ORDER BY i.issue_date DESC, i.id DESC
        LIMIT 6
    ");
    $recentInvoices = $recentInvStmt->fetchAll();

    // 6. Recent Payments
    $recentPayStmt = $pdo->query("
        SELECT p.*, i.invoice_number, c.name as client_name, c.company_name
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        JOIN clients c ON p.client_id = c.id
        ORDER BY p.payment_date DESC, p.id DESC
        LIMIT 5
    ");
    $recentPayments = $recentPayStmt->fetchAll();

    // 7. Recent Expenses
    $recentExpStmt = $pdo->query("
        SELECT * FROM expenses
        ORDER BY expense_date DESC, id DESC
        LIMIT 5
    ");
    $recentExpenses = $recentExpStmt->fetchAll();

    // 8. Monthly Trends (Last 6 months revenue vs expense)
    $monthlyStmt = $pdo->query("
        SELECT 
            DATE_FORMAT(m.dt, '%Y-%m') as `month`,
            DATE_FORMAT(m.dt, '%b %Y') as `month_label`,
            COALESCE(inv.income, 0) as income,
            COALESCE(exp.expense, 0) as expense
        FROM (
            SELECT CURDATE() - INTERVAL 5 MONTH as dt UNION ALL
            SELECT CURDATE() - INTERVAL 4 MONTH UNION ALL
            SELECT CURDATE() - INTERVAL 3 MONTH UNION ALL
            SELECT CURDATE() - INTERVAL 2 MONTH UNION ALL
            SELECT CURDATE() - INTERVAL 1 MONTH UNION ALL
            SELECT CURDATE()
        ) m
        LEFT JOIN (
            SELECT DATE_FORMAT(payment_date, '%Y-%m') as mth, SUM(amount) as income
            FROM payments
            GROUP BY mth
        ) inv ON DATE_FORMAT(m.dt, '%Y-%m') = inv.mth
        LEFT JOIN (
            SELECT DATE_FORMAT(expense_date, '%Y-%m') as mth, SUM(amount) as expense
            FROM expenses
            GROUP BY mth
        ) exp ON DATE_FORMAT(m.dt, '%Y-%m') = exp.mth
        ORDER BY `month` ASC
    ");
    $monthlyTrends = $monthlyStmt->fetchAll();

    // 9. Currency breakdown of invoiced
    $currStmt = $pdo->query("
        SELECT currency, COUNT(*) as count, SUM(total_amount) as total
        FROM invoices
        GROUP BY currency
    ");
    $currencyBreakdown = $currStmt->fetchAll();

    $netProfit = floatval($invOverview['total_collected']) - floatval($expOverview['total_expenses']);

    jsonResponse([
        'success' => true,
        'data' => [
            'metrics' => [
                'total_invoiced' => floatval($invOverview['total_invoiced']),
                'total_collected' => floatval($invOverview['total_collected']),
                'total_receivable' => floatval($invOverview['total_receivable']),
                'total_expenses' => floatval($expOverview['total_expenses']),
                'net_profit' => $netProfit,
                'overdue_count' => intval($invOverview['overdue_count']),
                'overdue_amount' => floatval($invOverview['overdue_amount']),
                'active_retainers' => intval($projOverview['active_retainers']),
                'mrr_pkr' => floatval($projOverview['mrr_pkr']),
            ],
            'upcoming_retainers' => $upcomingRetainers,
            'recent_invoices' => $recentInvoices,
            'recent_payments' => $recentPayments,
            'recent_expenses' => $recentExpenses,
            'monthly_trends' => $monthlyTrends,
            'currency_breakdown' => $currencyBreakdown
        ]
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
