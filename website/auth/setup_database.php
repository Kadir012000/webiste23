<?php
// Database configuration
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';

try {
    // Create connection without database
    $conn = new mysqli($db_host, $db_user, $db_pass);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Create database
    $sql = "CREATE DATABASE IF NOT EXISTS habenwill_db";
    if ($conn->query($sql) === TRUE) {
        echo "Database created successfully or already exists\n";
    } else {
        throw new Exception("Error creating database: " . $conn->error);
    }

    // Select database
    $conn->select_db("habenwill_db");

    // Create users table
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        registration_date DATETIME,
        last_login DATETIME
    )";

    if ($conn->query($sql) === TRUE) {
        echo "Users table created successfully\n";
    } else {
        throw new Exception("Error creating users table: " . $conn->error);
    }

    // Create login_logs table
    $sql = "CREATE TABLE IF NOT EXISTS login_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        ip_address VARCHAR(45),
        action ENUM('login', 'registration') NOT NULL,
        timestamp DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )";

    if ($conn->query($sql) === TRUE) {
        echo "Login logs table created successfully\n";
    } else {
        throw new Exception("Error creating login_logs table: " . $conn->error);
    }

    echo "Database setup completed successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?> 