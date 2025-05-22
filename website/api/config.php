<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'habenwill_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// API configuration
define('API_VERSION', 'v1');
define('API_KEY', 'your-secure-api-key-here'); // Change this to a secure key
define('JWT_SECRET', 'your-secure-jwt-secret-here'); // Change this to a secure secret

// Security settings
define('PASSWORD_HASH_COST', 12);
define('TOKEN_EXPIRY', 3600); // 1 hour
define('REFRESH_TOKEN_EXPIRY', 604800); // 7 days
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_TIMEOUT', 900); // 15 minutes

// File upload settings
define('MAX_FILE_SIZE', 5242880); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/webp']);
define('UPLOAD_DIR', '../uploads/');

// Rate limiting
define('RATE_LIMIT', 100); // requests per minute
define('RATE_LIMIT_WINDOW', 60); // seconds

// CORS settings
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Database connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Helper functions
function sanitize_input($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function generate_token() {
    return bin2hex(random_bytes(32));
}

function validate_token($token) {
    return preg_match('/^[a-f0-9]{64}$/', $token);
}

function rate_limit($ip) {
    $redis = new Redis();
    $redis->connect('127.0.0.1', 6379);
    
    $key = "rate_limit:$ip";
    $current = $redis->get($key);
    
    if (!$current) {
        $redis->setex($key, RATE_LIMIT_WINDOW, 1);
        return true;
    }
    
    if ($current >= RATE_LIMIT) {
        return false;
    }
    
    $redis->incr($key);
    return true;
}

// Authentication middleware
function authenticate_request() {
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        exit;
    }
    
    try {
        $decoded = JWT::decode($token, JWT_SECRET, ['HS256']);
        return $decoded->user_id;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }
}

// Response helper
function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
} 