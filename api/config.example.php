<?php
/**
 * ZAZSoft FMS - Database Configuration Template
 * 
 * Instructions for Hostinger hPanel:
 * 1. In Hostinger hPanel, go to: Databases -> Management
 * 2. Create a new MySQL database & user (e.g., u123456789_zazsoft_fms)
 * 3. Set the database name, username, and password below
 */

return [
    // Database host ('localhost' on Hostinger and XAMPP)
    'db_host' => getenv('DB_HOST') ?: 'localhost',

    // Database name (e.g. u123456789_zazsoft_fms on Hostinger, zazsoft_fms on local)
    'db_name' => getenv('DB_NAME') ?: 'zazsoft_fms',

    // Database username (e.g. u123456789_admin on Hostinger, root on local)
    'db_user' => getenv('DB_USER') ?: 'root',

    // Database password (your chosen password on Hostinger, empty on local XAMPP)
    'db_pass' => getenv('DB_PASS') ?: '',

    // Port and charset
    'db_port' => getenv('DB_PORT') ?: '3306',
    'db_charset' => 'utf8mb4'
];
