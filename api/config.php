<?php
/**
 * ZAZSoft FMS - Active Database Configuration
 * On Hostinger hPanel, fill in your database details created in hPanel.
 */

return [
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_name' => getenv('DB_NAME') ?: 'zazsoft_fms',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') ?: '',
    'db_port' => getenv('DB_PORT') ?: '3306',
    'db_charset' => 'utf8mb4'
];
