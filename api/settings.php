<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM settings LIMIT 1");
        $settings = $stmt->fetch();
        if (!$settings) {
            jsonResponse(['success' => false, 'message' => 'Settings not found'], 404);
        }
        jsonResponse(['success' => true, 'settings' => $settings]);
    } elseif ($method === 'POST' || $method === 'PUT') {
        $data = getJsonInput();

        $stmt = $pdo->prepare("
            UPDATE settings SET
                company_name = COALESCE(?, company_name),
                tagline = COALESCE(?, tagline),
                email = COALESCE(?, email),
                website = COALESCE(?, website),
                phone_pk = COALESCE(?, phone_pk),
                phone_uae = COALESCE(?, phone_uae),
                address_pk = COALESCE(?, address_pk),
                address_uae = COALESCE(?, address_uae),
                default_currency = COALESCE(?, default_currency),
                default_terms = COALESCE(?, default_terms),
                bank_name = COALESCE(?, bank_name),
                account_title = COALESCE(?, account_title),
                account_number = COALESCE(?, account_number),
                iban = COALESCE(?, iban),
                swift_code = COALESCE(?, swift_code),
                show_uae_address = ?,
                show_bank_details = ?
            WHERE id = 1
        ");
        $stmt->execute([
            $data['company_name'] ?? null,
            $data['tagline'] ?? null,
            $data['email'] ?? null,
            $data['website'] ?? null,
            $data['phone_pk'] ?? null,
            $data['phone_uae'] ?? null,
            $data['address_pk'] ?? null,
            $data['address_uae'] ?? null,
            $data['default_currency'] ?? null,
            $data['default_terms'] ?? null,
            $data['bank_name'] ?? null,
            $data['account_title'] ?? null,
            $data['account_number'] ?? null,
            $data['iban'] ?? null,
            $data['swift_code'] ?? null,
            isset($data['show_uae_address']) ? intval($data['show_uae_address']) : 1,
            isset($data['show_bank_details']) ? intval($data['show_bank_details']) : 1
        ]);

        $updatedStmt = $pdo->query("SELECT * FROM settings LIMIT 1");
        $settings = $updatedStmt->fetch();

        jsonResponse(['success' => true, 'message' => 'Settings updated successfully', 'settings' => $settings]);
    }
} catch (Exception $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
