-- Create database
CREATE DATABASE IF NOT EXISTS habenwill_db;
USE habenwill_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'Österreich',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INT NOT NULL,
    seller_id INT NOT NULL,
    condition ENUM('new', 'like-new', 'good', 'fair') NOT NULL,
    location VARCHAR(100) NOT NULL,
    status ENUM('active', 'sold', 'inactive') DEFAULT 'active',
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Item images table
CREATE TABLE IF NOT EXISTS item_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, item_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    item_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reviewer_id INT NOT NULL,
    reviewed_id INT NOT NULL,
    item_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- Login logs table
CREATE TABLE IF NOT EXISTS login_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    action ENUM('login', 'logout', 'failed_login', 'password_reset') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default categories
INSERT INTO categories (name, slug, description, icon) VALUES
('Elektronik & Technik', 'elektronik-technik', 'Elektronische Geräte und technische Produkte', 'fas fa-mobile-alt'),
('Mode & Kleidung', 'mode-kleidung', 'Kleidung und Accessoires für Damen, Herren und Kinder', 'fas fa-tshirt'),
('Haus & Garten', 'haus-garten', 'Möbel, Dekoration und Gartenartikel', 'fas fa-home'),
('Sport & Freizeit', 'sport-freizeit', 'Sportartikel und Freizeitausrüstung', 'fas fa-futbol'),
('Fahrzeuge', 'fahrzeuge', 'Autos, Motorräder und Zubehör', 'fas fa-car'),
('Spielzeug & Spiele', 'spielzeug-spiele', 'Spielzeug und Gesellschaftsspiele', 'fas fa-gamepad');

-- Insert subcategories
INSERT INTO categories (name, slug, description, parent_id, icon) VALUES
-- Elektronik & Technik subcategories
('Computer & Laptops', 'computer-laptops', 'Computer, Laptops und Zubehör', 1, 'fas fa-laptop'),
('Smartphones & Tablets', 'smartphones-tablets', 'Smartphones, Tablets und Zubehör', 1, 'fas fa-mobile-alt'),
('TV & Audio', 'tv-audio', 'Fernseher und Audioanlagen', 1, 'fas fa-tv'),
('Gaming & Konsolen', 'gaming-konsolen', 'Gaming-Konsolen und Zubehör', 1, 'fas fa-gamepad'),

-- Mode & Kleidung subcategories
('Damenmode', 'damenmode', 'Kleidung und Accessoires für Damen', 2, 'fas fa-female'),
('Herrenmode', 'herrenmode', 'Kleidung und Accessoires für Herren', 2, 'fas fa-male'),
('Kindermode', 'kindermode', 'Kleidung und Accessoires für Kinder', 2, 'fas fa-child'),
('Schuhe & Accessoires', 'schuhe-accessoires', 'Schuhe und modische Accessoires', 2, 'fas fa-shoe-prints'),

-- Haus & Garten subcategories
('Möbel', 'moebel', 'Möbel für Wohnung und Haus', 3, 'fas fa-couch'),
('Küche & Haushalt', 'kueche-haushalt', 'Küchengeräte und Haushaltsartikel', 3, 'fas fa-utensils'),
('Dekoration', 'dekoration', 'Wohndekoration und Accessoires', 3, 'fas fa-paint-roller'),
('Garten & Pflanzen', 'garten-pflanzen', 'Gartenartikel und Pflanzen', 3, 'fas fa-leaf'),

-- Sport & Freizeit subcategories
('Fitness & Training', 'fitness-training', 'Fitnessgeräte und Trainingsausrüstung', 4, 'fas fa-dumbbell'),
('Fahrräder & Zubehör', 'fahrraeder-zubehoer', 'Fahrräder und Fahrradzubehör', 4, 'fas fa-bicycle'),
('Camping & Outdoor', 'camping-outdoor', 'Camping- und Outdoorausrüstung', 4, 'fas fa-campground'),
('Wassersport', 'wassersport', 'Wassersportausrüstung', 4, 'fas fa-swimming-pool'),

-- Fahrzeuge subcategories
('Autos', 'autos', 'Pkw und Zubehör', 5, 'fas fa-car'),
('Motorräder', 'motorraeder', 'Motorräder und Zubehör', 5, 'fas fa-motorcycle'),
('Nutzfahrzeuge', 'nutzfahrzeuge', 'Nutzfahrzeuge und Zubehör', 5, 'fas fa-truck'),
('Ersatzteile & Zubehör', 'ersatzteile-zubehoer', 'Ersatzteile und Fahrzeugzubehör', 5, 'fas fa-tools'),

-- Spielzeug & Spiele subcategories
('Gesellschaftsspiele', 'gesellschaftsspiele', 'Gesellschafts- und Brettspiele', 6, 'fas fa-puzzle-piece'),
('Brettspiele', 'brettspiele', 'Klassische Brettspiele', 6, 'fas fa-dice'),
('Babyspielzeug', 'babyspielzeug', 'Spielzeug für Babys und Kleinkinder', 6, 'fas fa-baby'),
('Elektronisches Spielzeug', 'elektronisches-spielzeug', 'Elektronisches Spielzeug', 6, 'fas fa-robot'); 