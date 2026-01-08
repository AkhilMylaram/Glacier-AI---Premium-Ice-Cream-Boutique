-- Glacier AI - Premium Ice Cream Boutique Database Schema
-- MySQL 8.0+ Compatible

CREATE DATABASE IF NOT EXISTS glacier_ai;
USE glacier_ai;

-- Users table for authentication and user management
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- User profiles for additional information
CREATE TABLE user_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Product categories
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_name (name)
);

-- Products table
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    image_url VARCHAR(500),
    inventory INT NOT NULL DEFAULT 0,
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_category (category_id),
    INDEX idx_price (price),
    INDEX idx_active (is_active)
);

-- Shopping carts
CREATE TABLE carts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Cart items
CREATE TABLE cart_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    cart_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_product (cart_id, product_id),
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id)
);

-- Orders table
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Order items
CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- User sessions for authentication
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
);

-- AI chat sessions for flavor recommendations
CREATE TABLE ai_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    session_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Insert default categories
INSERT INTO categories (id, name, description, image_url) VALUES
(UUID(), 'Classic', 'Traditional ice cream flavors that never go out of style', 'https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&q=80&w=400'),
(UUID(), 'Signature', 'Our exclusive creations and chef specialties', 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&q=80&w=400'),
(UUID(), 'Vegan', 'Plant-based delicious alternatives', 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&q=80&w=400'),
(UUID(), 'Limited', 'Seasonal and limited edition flavors', 'https://images.unsplash.com/photo-1501443762991-2c8c3c3c3c3c?auto=format&fit=crop&q=80&w=400');

-- Insert sample products
INSERT INTO products (id, name, description, price, category_id, image_url, inventory, tags) VALUES
(UUID(), 'Vanilla Bean Classic', 'Pure Madagascar vanilla beans in a rich cream base', 6.99, (SELECT id FROM categories WHERE name = 'Classic'), 'https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&q=80&w=400', 50, JSON_ARRAY('vanilla', 'classic', 'creamy')),
(UUID(), 'Chocolate Obsidian', 'Deep dark chocolate with cocoa nibs', 7.99, (SELECT id FROM categories WHERE name = 'Classic'), 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&q=80&w=400', 40, JSON_ARRAY('chocolate', 'rich', 'decadent')),
(UUID(), 'Strawberry Fields', 'Fresh organic strawberries swirled in cream', 7.49, (SELECT id FROM categories WHERE name = 'Classic'), 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&q=80&w=400', 35, JSON_ARRAY('strawberry', 'fruity', 'fresh')),
(UUID(), 'Mint Chocolate Swirl', 'Peppermint ice cream with dark chocolate chunks', 7.99, (SELECT id FROM categories WHERE name = 'Signature'), 'https://images.unsplash.com/photo-1501443762991-2c8c3c3c3c3c?auto=format&fit=crop&q=80&w=400', 30, JSON_ARRAY('mint', 'chocolate', 'refreshing')),
(UUID(), 'Salted Caramel Dream', 'Buttery caramel with sea salt crystals', 8.49, (SELECT id FROM categories WHERE name = 'Signature'), 'https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&q=80&w=400', 25, JSON_ARRAY('caramel', 'salted', 'buttery')),
(UUID(), 'Coconut Almond Bliss', 'Creamy coconut base with roasted almonds', 8.99, (SELECT id FROM categories WHERE name = 'Vegan'), 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&q=80&w=400', 20, JSON_ARRAY('vegan', 'coconut', 'almond')),
(UUID(), 'Pumpkin Spice Limited', 'Seasonal pumpkin with warm spices', 9.49, (SELECT id FROM categories WHERE name = 'Limited'), 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&q=80&w=400', 15, JSON_ARRAY('pumpkin', 'seasonal', 'spiced'));

-- Create a default admin user (password: admin123)
INSERT INTO users (id, email, password_hash, name, role) VALUES
(UUID(), 'admin@glacierai.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xm5/Y5K2q', 'Admin User', 'admin');

-- Create indexes for better performance
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);