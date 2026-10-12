<?php
// Database helper and API common headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$config = file_exists(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];

$host    = $config['db_host'] ?? 'localhost';
$db      = $config['db_name'] ?? 'zazsoft_fms';
$user    = $config['db_user'] ?? 'root';
$pass    = $config['db_pass'] ?? '';
$port    = $config['db_port'] ?? '3306';
$charset = $config['db_charset'] ?? 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function ensureUsersTable($pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `users` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL,
                `email` VARCHAR(120) NOT NULL UNIQUE,
                `password_hash` VARCHAR(255) NOT NULL,
                `role` ENUM('admin', 'manager', 'accountant') DEFAULT 'admin',
                `avatar` VARCHAR(255) NULL,
                `auth_token` VARCHAR(255) NULL,
                `token_expiry` DATETIME NULL,
                `last_login` DATETIME NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        ");

        $count = $pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
        if ($count == 0) {
            $hashed = password_hash('admin123', PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO `users` (`name`, `email`, `password_hash`, `role`) VALUES (?, ?, ?, ?)");
            $stmt->execute(['ZAZ Admin', 'admin@zazsoft.com', $hashed, 'admin']);
            $stmt->execute(['Zaz Imran', 'zazimran@gmail.com', $hashed, 'admin']);
        }
    } catch (\Exception $e) {
        // Table check failed silently
    }
}

// Auto-ensure table on load
ensureUsersTable($pdo);

function getBearerToken() {
    $header = null;
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $header = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $header = trim($requestHeaders['Authorization']);
        } elseif (isset($requestHeaders['authorization'])) {
            $header = trim($requestHeaders['authorization']);
        }
    }

    if (!empty($header) && preg_match('/Bearer\s(\S+)/i', $header, $matches)) {
        return $matches[1];
    }

    // Query or POST parameter fallback
    if (!empty($_GET['token'])) {
        return trim($_GET['token']);
    }
    if (!empty($_POST['token'])) {
        return trim($_POST['token']);
    }

    return null;
}

function getAuthenticatedUser($pdo) {
    $token = getBearerToken();
    if (!$token) {
        return null;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id, name, email, role, avatar, last_login 
            FROM users 
            WHERE auth_token = ? 
              AND (token_expiry IS NULL OR token_expiry > NOW())
            LIMIT 1
        ");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        return $user ?: null;
    } catch (\Exception $e) {
        return null;
    }
}

function requireAuth($pdo) {
    $user = getAuthenticatedUser($pdo);
    if (!$user) {
        jsonResponse([
            'success' => false,
            'message' => 'Unauthorized. Please sign in to access this resource.'
        ], 401);
    }
    return $user;
}

