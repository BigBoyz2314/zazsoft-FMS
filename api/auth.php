<?php
/**
 * ZAZSoft FMS - Authentication API
 * Provides Login, Token Verification (Me), Logout, and Profile/Password Management
 */

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($method === 'POST' ? 'login' : 'me');

try {
    // -------------------------------------------------------------
    // ACTION: LOGIN
    // -------------------------------------------------------------
    if ($action === 'login' && $method === 'POST') {
        $input = getJsonInput();
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');
        $rememberMe = !empty($input['remember_me']);

        if (empty($email) || empty($password)) {
            jsonResponse([
                'success' => false,
                'message' => 'Please provide both email address and password.'
            ], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonResponse([
                'success' => false,
                'message' => 'Invalid email or password. Please verify your credentials.'
            ], 401);
        }

        // Generate high-entropy 64-char token
        $token = bin2hex(random_bytes(32));
        $expiryInterval = $rememberMe ? '30 DAY' : '1 DAY';

        $updateStmt = $pdo->prepare("
            UPDATE users 
            SET auth_token = ?,
                token_expiry = DATE_ADD(NOW(), INTERVAL $expiryInterval),
                last_login = NOW()
            WHERE id = ?
        ");
        $updateStmt->execute([$token, $user['id']]);

        // Fetch refreshed user info
        $userResponse = [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'avatar' => $user['avatar'],
            'last_login' => date('Y-m-d H:i:s')
        ];

        jsonResponse([
            'success' => true,
            'message' => 'Signed in successfully',
            'token' => $token,
            'user' => $userResponse
        ]);
    }

    // -------------------------------------------------------------
    // ACTION: ME (Verify Session)
    // -------------------------------------------------------------
    elseif ($action === 'me' && $method === 'GET') {
        $user = requireAuth($pdo);
        jsonResponse([
            'success' => true,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'avatar' => $user['avatar'],
                'last_login' => $user['last_login']
            ]
        ]);
    }

    // -------------------------------------------------------------
    // ACTION: LOGOUT
    // -------------------------------------------------------------
    elseif ($action === 'logout' && ($method === 'POST' || $method === 'GET')) {
        $token = getBearerToken();
        if ($token) {
            $stmt = $pdo->prepare("UPDATE users SET auth_token = NULL, token_expiry = NULL WHERE auth_token = ?");
            $stmt->execute([$token]);
        }

        jsonResponse([
            'success' => true,
            'message' => 'Signed out successfully'
        ]);
    }

    // -------------------------------------------------------------
    // ACTION: UPDATE PROFILE / PASSWORD
    // -------------------------------------------------------------
    elseif ($action === 'update_profile' && $method === 'POST') {
        $currentUser = requireAuth($pdo);
        $input = getJsonInput();

        $name = trim($input['name'] ?? $currentUser['name']);
        $email = trim($input['email'] ?? $currentUser['email']);
        $currentPassword = $input['current_password'] ?? '';
        $newPassword = $input['new_password'] ?? '';

        if (empty($name) || empty($email)) {
            jsonResponse(['success' => false, 'message' => 'Name and email are required.'], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['success' => false, 'message' => 'Please provide a valid email address.'], 400);
        }

        // Check email uniqueness if changed
        if ($email !== $currentUser['email']) {
            $chkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $chkStmt->execute([$email, $currentUser['id']]);
            if ($chkStmt->fetch()) {
                jsonResponse(['success' => false, 'message' => 'Email address is already in use by another user.'], 400);
            }
        }

        // Password change logic
        if (!empty($newPassword)) {
            if (empty($currentPassword)) {
                jsonResponse(['success' => false, 'message' => 'Current password is required to set a new password.'], 400);
            }
            if (strlen($newPassword) < 6) {
                jsonResponse(['success' => false, 'message' => 'New password must be at least 6 characters long.'], 400);
            }

            // Verify current password from DB
            $passStmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $passStmt->execute([$currentUser['id']]);
            $currentHash = $passStmt->fetchColumn();

            if (!password_verify($currentPassword, $currentHash)) {
                jsonResponse(['success' => false, 'message' => 'Current password is incorrect.'], 400);
            }

            $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
            $upStmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?");
            $upStmt->execute([$name, $email, $newHash, $currentUser['id']]);
        } else {
            $upStmt = $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
            $upStmt->execute([$name, $email, $currentUser['id']]);
        }

        jsonResponse([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => (int)$currentUser['id'],
                'name' => $name,
                'email' => $email,
                'role' => $currentUser['role'],
                'avatar' => $currentUser['avatar']
            ]
        ]);
    }

    else {
        jsonResponse(['success' => false, 'message' => 'Invalid action or request method.'], 404);
    }

} catch (\Exception $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ], 500);
}
