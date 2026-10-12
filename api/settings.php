<?php
/**
 * ZAZSoft FMS - Company Settings & Branding API
 */

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

function getDefaultSettingsData() {
    return [
        'company_name'      => 'ZAZ Soft',
        'tagline'           => 'At Your Service Always',
        'email'             => 'zazimran@gmail.com',
        'website'           => 'www.zazsoft.com',
        'phone_pk'          => '+92 309 9507777',
        'phone_uae'         => '+971 52 7772758',
        'address_pk'        => 'H 219, Molana Ahmad Ali Road, Ravi Road Lahore, Pakistan',
        'address_uae'       => '2001, Prime Tower, Business Bay, Dubai, UAE',
        'default_currency'  => 'PKR',
        'default_terms'     => "Product Shall Be Used for One Business Unit Only\nNo Responsibility for Any Wrong Data Entry!\n24/7 SLA Support (Service Level Agreement)\nStrict Data Privacy / Security Policy",
        'bank_name'         => 'Meezan Bank Limited',
        'account_title'     => 'ZAZ Soft',
        'account_number'    => '0101-0102030405',
        'iban'              => 'PK36MEZN0001010102030405',
        'swift_code'        => 'MEZNPKKA',
        'show_uae_address'  => 1,
        'show_bank_details' => 1
    ];
}

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
        $settings = $stmt->fetch();

        // If settings row is missing, auto-create it now
        if (!$settings) {
            $def = getDefaultSettingsData();
            $ins = $pdo->prepare("
                INSERT INTO settings (
                    id, company_name, tagline, email, website, phone_pk, phone_uae, 
                    address_pk, address_uae, default_currency, default_terms, 
                    bank_name, account_title, account_number, iban, swift_code, 
                    show_uae_address, show_bank_details
                ) VALUES (
                    1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            ");
            $ins->execute([
                $def['company_name'], $def['tagline'], $def['email'], $def['website'],
                $def['phone_pk'], $def['phone_uae'], $def['address_pk'], $def['address_uae'],
                $def['default_currency'], $def['default_terms'], $def['bank_name'],
                $def['account_title'], $def['account_number'], $def['iban'],
                $def['swift_code'], $def['show_uae_address'], $def['show_bank_details']
            ]);

            $stmt = $pdo->query("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
            $settings = $stmt->fetch() ?: $def;
        }

        jsonResponse(['success' => true, 'settings' => $settings]);
    } 
    elseif ($method === 'POST' || $method === 'PUT') {
        $data = getJsonInput();

        $existing = $pdo->query("SELECT id FROM settings ORDER BY id ASC LIMIT 1")->fetch();

        if ($existing) {
            $id = $existing['id'];
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
                WHERE id = ?
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
                isset($data['show_bank_details']) ? intval($data['show_bank_details']) : 1,
                $id
            ]);
        } else {
            $def = getDefaultSettingsData();
            $ins = $pdo->prepare("
                INSERT INTO settings (
                    company_name, tagline, email, website, phone_pk, phone_uae, 
                    address_pk, address_uae, default_currency, default_terms, 
                    bank_name, account_title, account_number, iban, swift_code, 
                    show_uae_address, show_bank_details
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $ins->execute([
                $data['company_name'] ?? $def['company_name'],
                $data['tagline'] ?? $def['tagline'],
                $data['email'] ?? $def['email'],
                $data['website'] ?? $def['website'],
                $data['phone_pk'] ?? $def['phone_pk'],
                $data['phone_uae'] ?? $def['phone_uae'],
                $data['address_pk'] ?? $def['address_pk'],
                $data['address_uae'] ?? $def['address_uae'],
                $data['default_currency'] ?? $def['default_currency'],
                $data['default_terms'] ?? $def['default_terms'],
                $data['bank_name'] ?? $def['bank_name'],
                $data['account_title'] ?? $def['account_title'],
                $data['account_number'] ?? $def['account_number'],
                $data['iban'] ?? $def['iban'],
                $data['swift_code'] ?? $def['swift_code'],
                isset($data['show_uae_address']) ? intval($data['show_uae_address']) : 1,
                isset($data['show_bank_details']) ? intval($data['show_bank_details']) : 1
            ]);
        }

        $updated = $pdo->query("SELECT * FROM settings ORDER BY id ASC LIMIT 1")->fetch();

        jsonResponse([
            'success' => true,
            'message' => 'Settings updated successfully',
            'settings' => $updated
        ]);
    }
} catch (Exception $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
