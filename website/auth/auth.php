<?php
// Start session with secure settings
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
session_start();

// Set headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'habenwill_db';

// Create database connection
try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // Set charset to ensure proper encoding
    if (!$conn->set_charset("utf8mb4")) {
        throw new Exception("Error setting charset: " . $conn->error);
    }
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    die(json_encode([
        'error' => 'Database connection failed. Please try again later.',
        'debug' => $e->getMessage() // Remove this in production
    ]));
}

// Get client IP address
function getClientIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        return $_SERVER['REMOTE_ADDR'];
    }
}

// Handle registration
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'register') {
    try {
        if (!isset($_POST['email']) || !isset($_POST['password'])) {
            throw new Exception('Email and password are required');
        }

        $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }

        $password = $_POST['password'];
        if (strlen($password) < 8) {
            throw new Exception('Password must be at least 8 characters long');
        }

        $password = password_hash($password, PASSWORD_DEFAULT);
        $ip_address = getClientIP();
        $registration_date = date('Y-m-d H:i:s');

        // Check if email already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            throw new Exception('Email already registered');
        }

        // Insert new user
        $stmt = $conn->prepare("INSERT INTO users (email, password, ip_address, registration_date) VALUES (?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("ssss", $email, $password, $ip_address, $registration_date);

        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        // Log successful registration
        $user_id = $conn->insert_id;
        $stmt = $conn->prepare("INSERT INTO login_logs (user_id, ip_address, action, timestamp) VALUES (?, ?, 'registration', ?)");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("iss", $user_id, $ip_address, $registration_date);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Registration successful']);
    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    try {
        if (!isset($_POST['email']) || !isset($_POST['password'])) {
            throw new Exception('Email and password are required');
        }

        $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }

        $password = $_POST['password'];
        $ip_address = getClientIP();
        $login_date = date('Y-m-d H:i:s');

        // Get user
        $stmt = $conn->prepare("SELECT id, password FROM users WHERE email = ?");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            if (password_verify($password, $user['password'])) {
                // Update last login
                $stmt = $conn->prepare("UPDATE users SET last_login = ? WHERE id = ?");
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $conn->error);
                }

                $stmt->bind_param("si", $login_date, $user['id']);
                $stmt->execute();

                // Log successful login
                $stmt = $conn->prepare("INSERT INTO login_logs (user_id, ip_address, action, timestamp) VALUES (?, ?, 'login', ?)");
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $conn->error);
                }

                $stmt->bind_param("iss", $user['id'], $ip_address, $login_date);
                $stmt->execute();

                // Regenerate session ID for security
                session_regenerate_id(true);
                
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['email'] = $email;
                $_SESSION['last_activity'] = time();
                
                echo json_encode(['success' => true, 'message' => 'Login successful']);
            } else {
                throw new Exception('Invalid password');
            }
        } else {
            throw new Exception('User not found');
        }
    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        echo json_encode(['error' => $e->getMessage()]);
    }
}

$conn->close();
?> 