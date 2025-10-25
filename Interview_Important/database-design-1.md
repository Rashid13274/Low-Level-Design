# Database Design - Scenario-Based Interview Questions

## **RELATIONAL DATABASE SCENARIOS**

### **1. E-Commerce Database Design**

**Q: Design a database schema for an e-commerce platform like Amazon. Include users, products, orders, payments, and reviews.**

**Answer:**

```sql
-- USERS TABLE
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- ADDRESSES TABLE (One user can have multiple addresses)
CREATE TABLE addresses (
    address_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    address_type ENUM('shipping', 'billing') NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- CATEGORIES TABLE (Hierarchical categories)
CREATE TABLE categories (
    category_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id BIGINT NULL, -- For nested categories
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_parent (parent_category_id),
    INDEX idx_slug (slug)
);

-- PRODUCTS TABLE
CREATE TABLE products (
    product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE NOT NULL, -- Stock Keeping Unit
    brand VARCHAR(100),
    weight DECIMAL(8, 2), -- in kg
    dimensions VARCHAR(50), -- e.g., "10x20x30 cm"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    INDEX idx_category (category_id),
    INDEX idx_sku (sku),
    INDEX idx_price (price),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_search (product_name, description)
);

-- PRODUCT IMAGES TABLE (One product can have multiple images)
CREATE TABLE product_images (
    image_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);

-- ORDERS TABLE
CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., "ORD-2024-001234"
    order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address_id BIGINT NOT NULL,
    billing_address_id BIGINT NOT NULL,
    payment_method VARCHAR(50),
    tracking_number VARCHAR(100),
    notes TEXT,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id),
    FOREIGN KEY (billing_address_id) REFERENCES addresses(address_id),
    INDEX idx_user (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (order_status),
    INDEX idx_ordered_at (ordered_at)
);

-- ORDER ITEMS TABLE (Many-to-Many: Orders and Products)
CREATE TABLE order_items (
    order_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL, -- Price at time of order
    subtotal DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);

-- PAYMENTS TABLE
CREATE TABLE payments (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'upi', 'cod') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE, -- From payment gateway
    payment_gateway VARCHAR(50), -- Stripe, Razorpay, etc.
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_date TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    INDEX idx_order (order_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_status (payment_status)
);

-- REVIEWS TABLE
CREATE TABLE reviews (
    review_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT, -- To verify purchase
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(200),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0, -- How many found it helpful
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at),
    -- Prevent duplicate reviews
    UNIQUE KEY unique_user_product (user_id, product_id, order_id)
);

-- CART TABLE (Shopping Cart)
CREATE TABLE cart_items (
    cart_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user (user_id)
);

-- WISHLIST TABLE
CREATE TABLE wishlist (
    wishlist_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user (user_id)
);

-- COUPONS TABLE
CREATE TABLE coupons (
    coupon_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INT, -- Total uses allowed
    usage_count INT DEFAULT 0,
    per_user_limit INT DEFAULT 1,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (coupon_code),
    INDEX idx_valid_dates (valid_from, valid_until)
);

-- COUPON USAGE TABLE
CREATE TABLE coupon_usage (
    usage_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    coupon_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    discount_applied DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    INDEX idx_coupon (coupon_id),
    INDEX idx_user (user_id)
);
```

**Key Design Decisions Explained:**

1. **Normalization**: Separated addresses, order items, images to avoid redundancy
2. **Indexes**: Added on foreign keys and frequently queried columns (email, order_status, etc.)
3. **Price History**: Store `unit_price` in `order_items` because product prices change over time
4. **Soft Deletes**: Using `is_active` instead of deleting records
5. **ENUM Types**: For fixed set of values (order_status, payment_method)
6. **Constraints**: UNIQUE keys to prevent duplicate cart items, reviews
7. **Cascading**: ON DELETE CASCADE for dependent data (cart items when user deleted)

**Common Queries:**

```sql
-- 1. Get user's order history with items
SELECT 
    o.order_id,
    o.order_number,
    o.order_status,
    o.total_amount,
    o.ordered_at,
    oi.product_id,
    p.product_name,
    oi.quantity,
    oi.unit_price
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.user_id = 123
ORDER BY o.ordered_at DESC;

-- 2. Get product with average rating and review count
SELECT 
    p.product_id,
    p.product_name,
    p.price,
    p.stock_quantity,
    COUNT(r.review_id) as review_count,
    AVG(r.rating) as avg_rating
FROM products p
LEFT JOIN reviews r ON p.product_id = r.product_id
WHERE p.is_active = TRUE
GROUP BY p.product_id
HAVING avg_rating >= 4.0
ORDER BY avg_rating DESC, review_count DESC
LIMIT 10;

-- 3. Get user's cart with product details
SELECT 
    ci.cart_item_id,
    ci.quantity,
    p.product_id,
    p.product_name,
    p.price,
    p.stock_quantity,
    (ci.quantity * p.price) as subtotal
FROM cart_items ci
JOIN products p ON ci.product_id = p.product_id
WHERE ci.user_id = 123 AND p.is_active = TRUE;

-- 4. Update product stock after order
UPDATE products 
SET stock_quantity = stock_quantity - 5 
WHERE product_id = 456 AND stock_quantity >= 5;

-- 5. Get top-selling products
SELECT 
    p.product_id,
    p.product_name,
    SUM(oi.quantity) as total_sold,
    SUM(oi.subtotal) as revenue
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_status IN ('delivered', 'shipped')
    AND o.ordered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.product_id
ORDER BY total_sold DESC
LIMIT 10;
```

---

### **2. Social Media Database Design**

**Q: Design a database for a social media platform like Twitter/Instagram with posts, follows, likes, and comments.**

**Answer:**

```sql
-- USERS TABLE
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    profile_picture_url VARCHAR(500),
    cover_photo_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    post_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    FULLTEXT idx_search (username, full_name)
);

-- FOLLOWS TABLE (Self-referencing many-to-many)
CREATE TABLE follows (
    follow_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    follower_id BIGINT NOT NULL, -- User who follows
    following_id BIGINT NOT NULL, -- User being followed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id),
    CHECK (follower_id != following_id) -- Can't follow yourself
);

-- POSTS TABLE
CREATE TABLE posts (
    post_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    content TEXT,
    media_type ENUM('text', 'image', 'video', 'carousel') DEFAULT 'text',
    location VARCHAR(200),
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_content (content)
);

-- POST MEDIA TABLE (Multiple images/videos per post)
CREATE TABLE post_media (
    media_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    media_type ENUM('image', 'video') NOT NULL,
    display_order INT DEFAULT 0,
    width INT,
    height INT,
    duration INT, -- For videos (in seconds)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    INDEX idx_post (post_id)
);

-- LIKES TABLE
CREATE TABLE likes (
    like_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (user_id, post_id),
    INDEX idx_user (user_id),
    INDEX idx_post (post_id),
    INDEX idx_created_at (created_at)
);

-- COMMENTS TABLE (Can be nested - replies to comments)
CREATE TABLE comments (
    comment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_comment_id BIGINT NULL, -- For nested replies
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_comment_id),
    INDEX idx_created_at (created_at)
);

-- COMMENT LIKES TABLE
CREATE TABLE comment_likes (
    comment_like_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    comment_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE,
    UNIQUE KEY unique_comment_like (user_id, comment_id),
    INDEX idx_user (user_id),
    INDEX idx_comment (comment_id)
);

-- HASHTAGS TABLE
CREATE TABLE hashtags (
    hashtag_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hashtag_name VARCHAR(100) UNIQUE NOT NULL,
    post_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (hashtag_name),
    INDEX idx_post_count (post_count)
);

-- POST HASHTAGS TABLE (Many-to-Many)
CREATE TABLE post_hashtags (
    post_hashtag_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    hashtag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_hashtag (post_id, hashtag_id),
    INDEX idx_post (post_id),
    INDEX idx_hashtag (hashtag_id)
);

-- MENTIONS TABLE (User mentions in posts)
CREATE TABLE mentions (
    mention_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL, -- User who was mentioned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_mention (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
    notification_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL, -- Recipient
    actor_id BIGINT NOT NULL, -- Who performed the action
    notification_type ENUM('like', 'comment', 'follow', 'mention', 'reply') NOT NULL,
    reference_id BIGINT, -- post_id, comment_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
);

-- DIRECT MESSAGES TABLE
CREATE TABLE direct_messages (
    message_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    message_text TEXT,
    media_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted_by_sender BOOLEAN DEFAULT FALSE,
    is_deleted_by_receiver BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_created_at (created_at),
    INDEX idx_conversation (sender_id, receiver_id, created_at)
);

-- SAVED POSTS TABLE (Bookmarks)
CREATE TABLE saved_posts (
    saved_post_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    collection_name VARCHAR(100) DEFAULT 'All Posts',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    UNIQUE KEY unique_saved (user_id, post_id),
    INDEX idx_user (user_id),
    INDEX idx_post (post_id)
);

-- BLOCKED USERS TABLE
CREATE TABLE blocked_users (
    block_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    blocker_id BIGINT NOT NULL, -- User who blocked
    blocked_id BIGINT NOT NULL, -- User who is blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocker_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_block (blocker_id, blocked_id),
    INDEX idx_blocker (blocker_id),
    INDEX idx_blocked (blocked_id)
);
```

**Key Design Decisions:**

1. **Denormalized Counts**: Store `follower_count`, `like_count` for faster reads (update with triggers)
2. **Self-Referencing**: `follows` table references `users` twice
3. **Nested Comments**: `parent_comment_id` allows comment replies
4. **Soft Deletes**: `is_deleted` flag instead of actual deletion
5. **Many-to-Many**: Separate junction tables for hashtags, mentions
6. **Composite Indexes**: For conversation queries (sender + receiver + timestamp)

**Common Queries:**

```sql
-- 1. Get user's feed (posts from people they follow)
SELECT 
    p.post_id,
    p.user_id,
    u.username,
    u.profile_picture_url,
    p.content,
    p.like_count,
    p.comment_count,
    p.created_at
FROM posts p
JOIN users u ON p.user_id = u.user_id
WHERE p.user_id IN (
    SELECT following_id 
    FROM follows 
    WHERE follower_id = 123
)
AND p.is_deleted = FALSE
ORDER BY p.created_at DESC
LIMIT 20;

-- 2. Check if user liked a post
SELECT EXISTS(
    SELECT 1 
    FROM likes 
    WHERE user_id = 123 AND post_id = 456
) as has_liked;

-- 3. Get post with all details (likes, comments, user data)
SELECT 
    p.*,
    u.username,
    u.profile_picture_url,
    u.is_verified,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) as like_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) as comment_count,
    EXISTS(SELECT 1 FROM likes WHERE post_id = p.post_id AND user_id = 123) as is_liked_by_me
FROM posts p
JOIN users u ON p.user_id = u.user_id
WHERE p.post_id = 456;

-- 4. Get trending hashtags
SELECT 
    h.hashtag_name,
    COUNT(ph.post_id) as post_count
FROM hashtags h
JOIN post_hashtags ph ON h.hashtag_id = ph.hashtag_id
JOIN posts p ON ph.post_id = p.post_id
WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY h.hashtag_id
ORDER BY post_count DESC
LIMIT 10;

-- 5. Get comment thread (nested comments)
WITH RECURSIVE comment_tree AS (
    -- Base case: top-level comments
    SELECT 
        c.*,
        u.username,
        u.profile_picture_url,
        0 as depth
    FROM comments c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.post_id = 456 AND c.parent_comment_id IS NULL
    
    UNION ALL
    
    -- Recursive case: replies
    SELECT 
        c.*,
        u.username,
        u.profile_picture_url,
        ct.depth + 1
    FROM comments c
    JOIN users u ON c.user_id = u.user_id
    JOIN comment_tree ct ON c.parent_comment_id = ct.comment_id
)
SELECT * FROM comment_tree
ORDER BY created_at ASC;

-- 6. Get mutual followers
SELECT u.user_id, u.username, u.profile_picture_url
FROM users u
WHERE u.user_id IN (
    -- People who follow me
    SELECT follower_id FROM follows WHERE following_id = 123
)
AND u.user_id IN (
    -- People I follow
    SELECT following_id FROM follows WHERE follower_id = 123
);

-- 7. Get unread notifications count
SELECT COUNT(*) as unread_count
FROM notifications
WHERE user_id = 123 AND is_read = FALSE;
```

**Triggers for Maintaining Counts:**

```sql
-- Trigger to update like_count when like is added
DELIMITER $$
CREATE TRIGGER after_like_insert
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    UPDATE posts 
    SET like_count = like_count + 1 
    WHERE post_id = NEW.post_id;
END$$

-- Trigger to update like_count when like is deleted
CREATE TRIGGER after_like_delete
AFTER DELETE ON likes
FOR EACH ROW
BEGIN
    UPDATE posts 
    SET like_count = like_count - 1 
    WHERE post_id = OLD.post_id;
END$$

-- Trigger to update follower/following counts
CREATE TRIGGER after_follow_insert
AFTER INSERT ON follows
FOR EACH ROW
BEGIN
    UPDATE users SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    UPDATE users SET follower_count = follower_count + 1 WHERE user_id = NEW.following_id;
END$$

CREATE TRIGGER after_follow_delete
AFTER DELETE ON follows
FOR EACH ROW
BEGIN
    UPDATE users SET following_count = following_count - 1 WHERE user_id = OLD.follower_id;
    UPDATE users SET follower_count = follower_count - 1 WHERE user_id = OLD.following_id;
END$$
DELIMITER ;
```

---

### **3. Hotel Booking System**

**Q: Design a database for a hotel booking system like Booking.com with hotels, rooms, bookings, and availability.**

**Answer:**

```sql
-- HOTELS TABLE
CREATE TABLE hotels (
    hotel_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hotel_name VARCHAR(200) NOT NULL,
    description TEXT,
    star_rating DECIMAL(2, 1) CHECK (star_rating BETWEEN 1 AND 5),
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    check_in_time TIME DEFAULT '14:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    total_rooms INT DEFAULT 0,
    amenities JSON, -- ["WiFi", "Pool", "Gym", "Parking"]
    images JSON, -- ["url1", "url2", "url3"]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_rating (star_rating),
    INDEX idx_location (latitude, longitude),
    FULLTEXT idx_search (hotel_name, description, city)
);

-- ROOM TYPES TABLE
CREATE TABLE room_types (
    room_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    type_name VARCHAR(100) NOT NULL, -- Deluxe, Suite, Standard
    description TEXT,
    max_occupancy INT NOT NULL,
    bed_type VARCHAR(50), -- King, Queen, Twin
    room_size DECIMAL(6, 2), -- in sq meters
    price_per_night DECIMAL(10, 2) NOT NULL,
    amenities JSON, -- ["TV", "Mini Bar", "Balcony"]
    images JSON,
    total_rooms INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel (hotel_id),
    INDEX idx_price (price_per_night)
);

-- ROOMS TABLE (Individual room instances)
CREATE TABLE rooms (
    room_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_type_id BIGINT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    floor_number INT,
    status ENUM('available', 'occupied', 'maintenance', 'cleaning') DEFAULT 'available',
    FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id) ON DELETE CASCADE,
    UNIQUE KEY unique_room (room_type_id, room_number),
    INDEX idx_room_type (room_type_id),
    INDEX idx_status (status)
);


-- CUSTOMERS TABLE
CREATE TABLE customers (
    customer_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    nationality VARCHAR(100),
    passport_number VARCHAR(50),
    id_proof_type ENUM('passport', 'driver_license', 'national_id'),
    id_proof_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- BOOKINGS TABLE
CREATE TABLE bookings (
    booking_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    hotel_id BIGINT NOT NULL,
    booking_reference VARCHAR(50) UNIQUE NOT NULL, -- e.g., "BK-2024-001234"
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_nights INT GENERATED ALWAYS AS (DATEDIFF(check_out_date, check_in_date)) STORED,
    num_adults INT NOT NULL,
    num_children INT DEFAULT 0,
    booking_status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid',
    special_requests TEXT,
    cancellation_reason TEXT,
    booking_source ENUM('website', 'mobile_app', 'phone', 'walk_in', 'third_party') DEFAULT 'website',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id),
    INDEX idx_customer (customer_id),
    INDEX idx_hotel (hotel_id),
    INDEX idx_dates (check_in_date, check_out_date),
    INDEX idx_booking_ref (booking_reference),
    INDEX idx_status (booking_status),
    CHECK (check_out_date > check_in_date)
);

-- BOOKING ROOMS TABLE (Many-to-Many: Bookings and Rooms)
CREATE TABLE booking_rooms (
    booking_room_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    room_type_id BIGINT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL, -- Price at time of booking
    num_nights INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL, -- price_per_night * num_nights
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id),
    INDEX idx_booking (booking_id),
    INDEX idx_room (room_id),
    INDEX idx_dates (check_in_date, check_out_date)
);

-- ROOM AVAILABILITY TABLE (For efficient availability checks)
CREATE TABLE room_availability (
    availability_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_type_id BIGINT NOT NULL,
    date DATE NOT NULL,
    available_rooms INT NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL, -- Dynamic pricing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_date (room_type_id, date),
    INDEX idx_room_type (room_type_id),
    INDEX idx_date (date)
);

-- PAYMENTS TABLE
CREATE TABLE payments (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash') NOT NULL,
    payment_type ENUM('full_payment', 'advance_payment', 'remaining_payment') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    payment_gateway VARCHAR(50),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_date TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    INDEX idx_booking (booking_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_status (payment_status)
);

-- REVIEWS TABLE
CREATE TABLE reviews (
    review_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    hotel_id BIGINT NOT NULL,
    overall_rating DECIMAL(2, 1) CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    service_rating INT CHECK (service_rating BETWEEN 1 AND 5),
    location_rating INT CHECK (location_rating BETWEEN 1 AND 5),
    value_rating INT CHECK (value_rating BETWEEN 1 AND 5),
    title VARCHAR(200),
    comment TEXT,
    response_from_hotel TEXT,
    response_date TIMESTAMP NULL,
    is_verified BOOLEAN DEFAULT TRUE, -- Verified stay
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id),
    UNIQUE KEY unique_booking_review (booking_id),
    INDEX idx_hotel (hotel_id),
    INDEX idx_customer (customer_id),
    INDEX idx_rating (overall_rating),
    INDEX idx_created_at (created_at)
);

-- CANCELLATION POLICIES TABLE
CREATE TABLE cancellation_policies (
    policy_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    policy_name VARCHAR(100) NOT NULL,
    days_before_checkin INT NOT NULL,
    refund_percentage DECIMAL(5, 2) NOT NULL, -- 0 to 100
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel (hotel_id)
);

-- PROMOTIONS/DISCOUNTS TABLE
CREATE TABLE promotions (
    promotion_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hotel_id BIGINT,
    promotion_code VARCHAR(50) UNIQUE NOT NULL,
    promotion_name VARCHAR(100) NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount', 'free_night') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_nights INT DEFAULT 1,
    min_booking_amount DECIMAL(10, 2) DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    max_uses INT,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_code (promotion_code),
    INDEX idx_hotel (hotel_id),
    INDEX idx_dates (valid_from, valid_until)
);

-- ADDITIONAL SERVICES TABLE (Room service, Spa, etc.)
CREATE TABLE additional_services (
    service_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    service_category ENUM('room_service', 'spa', 'laundry', 'airport_transfer', 'restaurant') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel (hotel_id),
    INDEX idx_category (service_category)
);

-- BOOKING SERVICES TABLE
CREATE TABLE booking_services (
    booking_service_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES additional_services(service_id),
    INDEX idx_booking (booking_id),
    INDEX idx_service (service_id)
);

-- HOUSEKEEPING TABLE (Room cleaning schedule)
CREATE TABLE housekeeping (
    housekeeping_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    cleaning_date DATE NOT NULL,
    cleaning_status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    staff_id BIGINT, -- Reference to staff table if exists
    notes TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    INDEX idx_room (room_id),
    INDEX idx_date (cleaning_date),
    INDEX idx_status (cleaning_status)
);

-- HOTEL STAFF TABLE
CREATE TABLE staff (
    staff_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role ENUM('manager', 'receptionist', 'housekeeping', 'maintenance', 'chef', 'waiter') NOT NULL,
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel (hotel_id),
    INDEX idx_role (role)
);
```

**Key Design Decisions Explained:**

1. **Room Availability Table**: Pre-calculated availability for fast searches (denormalized for performance)
2. **Booking Rooms Junction**: Multiple rooms can be booked in single booking
3. **Generated Columns**: `num_nights` auto-calculated from dates
4. **Price History**: Store `price_per_night` in bookings to preserve historical prices
5. **Cancellation Policies**: Flexible refund rules based on timing
6. **Additional Services**: Extra charges beyond room booking

**Common Queries:**

```sql
-- 1. Check room availability for date range
SELECT 
    rt.room_type_id,
    rt.type_name,
    rt.price_per_night,
    rt.max_occupancy,
    COUNT(r.room_id) as total_rooms,
    COUNT(r.room_id) - COALESCE(
        (SELECT COUNT(DISTINCT br.room_id)
         FROM booking_rooms br
         JOIN bookings b ON br.booking_id = b.booking_id
         WHERE br.room_type_id = rt.room_type_id
         AND b.booking_status NOT IN ('cancelled', 'no_show')
         AND (
             (br.check_in_date <= '2024-12-25' AND br.check_out_date > '2024-12-20')
         )), 0
    ) as available_rooms
FROM room_types rt
JOIN rooms r ON rt.room_type_id = r.room_type_id
WHERE rt.hotel_id = 123
    AND r.status = 'available'
GROUP BY rt.room_type_id
HAVING available_rooms > 0;

-- 2. Create booking with room assignment
START TRANSACTION;

-- Insert booking
INSERT INTO bookings (
    customer_id, hotel_id, booking_reference, check_in_date, 
    check_out_date, num_adults, total_amount
) VALUES (
    456, 123, 'BK-2024-001234', '2024-12-20', '2024-12-25', 2, 5000
);

SET @booking_id = LAST_INSERT_ID();

-- Find available room
SELECT room_id INTO @room_id
FROM rooms
WHERE room_type_id = 789
    AND status = 'available'
    AND room_id NOT IN (
        SELECT room_id 
        FROM booking_rooms br
        JOIN bookings b ON br.booking_id = b.booking_id
        WHERE b.booking_status NOT IN ('cancelled', 'no_show')
        AND br.check_in_date < '2024-12-25'
        AND br.check_out_date > '2024-12-20'
    )
LIMIT 1;

-- Assign room to booking
INSERT INTO booking_rooms (
    booking_id, room_id, room_type_id, check_in_date, 
    check_out_date, price_per_night, num_nights, subtotal
) VALUES (
    @booking_id, @room_id, 789, '2024-12-20', '2024-12-25', 1000, 5, 5000
);

-- Update room status
UPDATE rooms SET status = 'occupied' WHERE room_id = @room_id;

COMMIT;

-- 3. Get hotel with average rating and review count
SELECT 
    h.*,
    COUNT(r.review_id) as review_count,
    AVG(r.overall_rating) as avg_rating,
    AVG(r.cleanliness_rating) as avg_cleanliness,
    AVG(r.service_rating) as avg_service,
    AVG(r.location_rating) as avg_location,
    AVG(r.value_rating) as avg_value
FROM hotels h
LEFT JOIN reviews r ON h.hotel_id = r.hotel_id
WHERE h.city = 'Mumbai' 
    AND h.is_active = TRUE
GROUP BY h.hotel_id
HAVING avg_rating >= 4.0
ORDER BY avg_rating DESC, review_count DESC
LIMIT 10;

-- 4. Get customer booking history
SELECT 
    b.booking_id,
    b.booking_reference,
    b.check_in_date,
    b.check_out_date,
    b.num_nights,
    b.booking_status,
    b.total_amount,
    h.hotel_name,
    h.city,
    GROUP_CONCAT(rt.type_name SEPARATOR ', ') as room_types
FROM bookings b
JOIN hotels h ON b.hotel_id = h.hotel_id
JOIN booking_rooms br ON b.booking_id = br.booking_id
JOIN room_types rt ON br.room_type_id = rt.room_type_id
WHERE b.customer_id = 456
GROUP BY b.booking_id
ORDER BY b.booked_at DESC;

-- 5. Search hotels with filters
SELECT DISTINCT
    h.hotel_id,
    h.hotel_name,
    h.city,
    h.star_rating,
    MIN(rt.price_per_night) as starting_price,
    AVG(r.overall_rating) as avg_rating,
    COUNT(DISTINCT r.review_id) as review_count
FROM hotels h
JOIN room_types rt ON h.hotel_id = rt.hotel_id
LEFT JOIN reviews r ON h.hotel_id = r.hotel_id
WHERE h.city = 'Delhi'
    AND h.is_active = TRUE
    AND rt.is_active = TRUE
    AND rt.max_occupancy >= 2
    AND JSON_CONTAINS(h.amenities, '"WiFi"')
    AND h.star_rating >= 4
    -- Check availability
    AND EXISTS (
        SELECT 1
        FROM rooms rm
        WHERE rm.room_type_id = rt.room_type_id
            AND rm.status = 'available'
            AND rm.room_id NOT IN (
                SELECT br.room_id
                FROM booking_rooms br
                JOIN bookings b ON br.booking_id = b.booking_id
                WHERE b.booking_status NOT IN ('cancelled', 'no_show')
                    AND br.check_in_date < '2024-12-25'
                    AND br.check_out_date > '2024-12-20'
            )
    )
GROUP BY h.hotel_id
HAVING avg_rating >= 4.0
ORDER BY avg_rating DESC, starting_price ASC
LIMIT 20;

-- 6. Calculate cancellation refund
SELECT 
    b.booking_id,
    b.total_amount,
    b.paid_amount,
    DATEDIFF(b.check_in_date, CURDATE()) as days_until_checkin,
    cp.refund_percentage,
    (b.paid_amount * cp.refund_percentage / 100) as refund_amount
FROM bookings b
JOIN hotels h ON b.hotel_id = h.hotel_id
JOIN cancellation_policies cp ON h.hotel_id = cp.hotel_id
WHERE b.booking_id = 12345
    AND cp.is_active = TRUE
    AND DATEDIFF(b.check_in_date, CURDATE()) >= cp.days_before_checkin
ORDER BY cp.days_before_checkin DESC
LIMIT 1;

-- 7. Get housekeeping schedule
SELECT 
    r.room_number,
    rt.type_name,
    hk.cleaning_date,
    hk.cleaning_status,
    s.first_name as staff_name
FROM housekeeping hk
JOIN rooms r ON hk.room_id = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
LEFT JOIN staff s ON hk.staff_id = s.staff_id
WHERE rt.hotel_id = 123
    AND hk.cleaning_date = CURDATE()
ORDER BY hk.cleaning_status, r.room_number;

-- 8. Revenue report by date range
SELECT 
    DATE(b.booked_at) as booking_date,
    COUNT(b.booking_id) as total_bookings,
    SUM(b.total_amount) as total_revenue,
    SUM(b.paid_amount) as collected_amount,
    AVG(b.total_amount) as avg_booking_value
FROM bookings b
WHERE b.hotel_id = 123
    AND b.booking_status NOT IN ('cancelled')
    AND b.booked_at BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY DATE(b.booked_at)
ORDER BY booking_date DESC;

-- 9. Occupancy rate calculation
SELECT 
    DATE_ADD('2024-12-01', INTERVAL n DAY) as date,
    (SELECT COUNT(DISTINCT br.room_id)
     FROM booking_rooms br
     JOIN bookings b ON br.booking_id = b.booking_id
     WHERE b.hotel_id = 123
       AND b.booking_status IN ('confirmed', 'checked_in')
       AND br.check_in_date <= DATE_ADD('2024-12-01', INTERVAL n DAY)
       AND br.check_out_date > DATE_ADD('2024-12-01', INTERVAL n DAY)
    ) as occupied_rooms,
    (SELECT total_rooms FROM hotels WHERE hotel_id = 123) as total_rooms,
    ROUND(
        (SELECT COUNT(DISTINCT br.room_id)
         FROM booking_rooms br
         JOIN bookings b ON br.booking_id = b.booking_id
         WHERE b.hotel_id = 123
           AND b.booking_status IN ('confirmed', 'checked_in')
           AND br.check_in_date <= DATE_ADD('2024-12-01', INTERVAL n DAY)
           AND br.check_out_date > DATE_ADD('2024-12-01', INTERVAL n DAY)
        ) * 100.0 / (SELECT total_rooms FROM hotels WHERE hotel_id = 123), 2
    ) as occupancy_rate
FROM (
    SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
    UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
    UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24
    UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29
) numbers
WHERE n < 30;
```

---

## **NON-RELATIONAL (NoSQL) DATABASE SCENARIOS**

### **4. MongoDB - Product Catalog**

**Q: Design a MongoDB schema for a product catalog with categories, products, and inventory. Explain when to embed vs reference.**

**Answer:**

```javascript
// CATEGORIES COLLECTION (Hierarchical structure)
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Electronics",
  slug: "electronics",
  description: "Electronic items and gadgets",
  parent_id: null, // null for top-level categories
  ancestors: [], // For quick hierarchy queries
  children: [
    {
      _id: ObjectId("507f1f77bcf86cd799439012"),
      name: "Smartphones",
      slug: "smartphones"
    },
    {
      _id: ObjectId("507f1f77bcf86cd799439013"),
      name: "Laptops",
      slug: "laptops"
    }
  ],
  image_url: "https://example.com/categories/electronics.jpg",
  display_order: 1,
  is_active: true,
  created_at: ISODate("2024-01-01T00:00:00Z"),
  updated_at: ISODate("2024-01-15T10:30:00Z")
}

// PRODUCTS COLLECTION (Embedded approach for related data)
{
  _id: ObjectId("507f1f77bcf86cd799439020"),
  sku: "PHONE-IP15-128-BLK",
  name: "iPhone 15 Pro",
  slug: "iphone-15-pro-128gb-black",
  description: "Latest iPhone with A17 Pro chip",
  
  // Embedded category info (denormalized for read performance)
  category: {
    _id: ObjectId("507f1f77bcf86cd799439012"),
    name: "Smartphones",
    slug: "smartphones",
    path: "Electronics > Smartphones" // Breadcrumb
  },
  
  brand: {
    name: "Apple",
    slug: "apple",
    logo_url: "https://example.com/brands/apple.png"
  },
  
  // Pricing information
  pricing: {
    base_price: 999.99,
    sale_price: 899.99,
    currency: "USD",
    discount_percentage: 10,
    tax_rate: 0.18,
    cost_price: 700.00 // For profit calculations
  },
  
  // Inventory (embedded for atomic updates)
  inventory: {
    stock_quantity: 150,
    reserved_quantity: 10, // In active carts
    low_stock_threshold: 20,
    warehouse_locations: [
      { warehouse_id: "WH001", location: "Delhi", quantity: 100 },
      { warehouse_id: "WH002", location: "Mumbai", quantity: 50 }
    ],
    last_restocked_at: ISODate("2024-12-01T00:00:00Z")
  },
  
  // Specifications (flexible schema)
  specifications: {
    color: "Black",
    storage: "128GB",
    ram: "8GB",
    display: "6.1 inch OLED",
    battery: "3200mAh",
    camera: "48MP Main + 12MP Ultra Wide",
    processor: "A17 Pro"
  },
  
  // Images array (embedded)
  images: [
    {
      url: "https://example.com/products/iphone15-1.jpg",
      alt_text: "iPhone 15 Pro Front View",
      is_primary: true,
      display_order: 1
    },
    {
      url: "https://example.com/products/iphone15-2.jpg",
      alt_text: "iPhone 15 Pro Back View",
      is_primary: false,
      display_order: 2
    }
  ],
  
  // Dimensions and weight
  dimensions: {
    length: 146.6,
    width: 70.6,
    height: 8.25,
    weight: 187,
    unit: "mm/g"
  },
  
  // SEO information
  seo: {
    meta_title: "Buy iPhone 15 Pro - Best Price Online",
    meta_description: "Get iPhone 15 Pro with amazing features...",
    keywords: ["iphone", "apple", "smartphone", "5g"]
  },
  
  // Embedded ratings (denormalized for performance)
  ratings: {
    average: 4.5,
    count: 1250,
    distribution: {
      "5": 800,
      "4": 300,
      "3": 100,
      "2": 30,
      "1": 20
    }
  },
  
  // Tags for filtering
  tags: ["5G", "Flagship", "Premium", "iOS"],
  
  // Status flags
  is_active: true,
  is_featured: true,
  is_new_arrival: false,
  
  // Timestamps
  created_at: ISODate("2024-01-01T00:00:00Z"),
  updated_at: ISODate("2024-12-20T15:30:00Z"),
  published_at: ISODate("2024-01-15T00:00:00Z")
}

// REVIEWS COLLECTION (Separate collection - one-to-many)
{
  _id: ObjectId("507f1f77bcf86cd799439030"),
  product_id: ObjectId("507f1f77bcf86cd799439020"),
  
  // Embedded user info (denormalized)
  user: {
    _id: ObjectId("507f1f77bcf86cd799439040"),
    name: "John Doe",
    email: "john@example.com",
    avatar_url: "https://example.com/avatars/john.jpg"
  },
  
  order_id: ObjectId("507f1f77bcf86cd799439050"), // To verify purchase
  rating: 5,
  title: "Excellent phone!",
  comment: "Best smartphone I've ever used. Camera quality is amazing.",
  
  // Embedded images/videos from user
  media: [
    {
      type: "image",
      url: "https://example.com/reviews/photo1.jpg"
    }
  ],
  
  is_verified_purchase: true,
  helpful_count: 25,
  unhelpful_count: 2,
  
  // Hotel response (embedded)
  response: {
    text: "Thank you for your feedback!",
    responder_name: "Apple Support",
    responded_at: ISODate("2024-12-15T10:00:00Z")
  },
  
  status: "published", // published, pending, rejected
  created_at: ISODate("2024-12-10T14:30:00Z"),
  updated_at: ISODate("2024-12-15T10:00:00Z")
}

// ORDERS COLLECTION (Embedded order items for performance)
{
  _id: ObjectId("507f1f77bcf86cd799439050"),
  order_number: "ORD-2024-001234",
  
  // Embedded customer info
  customer: {
    _id: ObjectId("507f1f77bcf86cd799439040"),
    name: "John Doe",
    email: "john@example.com",
    phone: "+91-9876543210"
  },
  
  // Embedded items (snapshot at time of order)
  items: [
    {
      product_id: ObjectId("507f1f77bcf86cd799439020"),
      sku: "PHONE-IP15-128-BLK",
      name: "iPhone 15 Pro",
      quantity: 1,
      unit_price: 899.99,
      subtotal: 899.99,
      // Snapshot of product data at purchase time
      specifications: {
        color: "Black",
        storage: "128GB"
      },
      image_url: "https://example.com/products/iphone15-1.jpg"
    }
  ],
  
  // Pricing
  subtotal: 899.99,
  tax_amount: 161.99,
  shipping_cost: 10.00,
  discount_amount: 50.00,
  total_amount: 1021.98,
  
  // Addresses (embedded)
  shipping_address: {
    street: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400001",
    country: "India",
    phone: "+91-9876543210"
  },
  
  billing_address: {
    street: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400001",
    country: "India"
  },
  
  // Payment info
  payment: {
    method: "credit_card",
    status: "completed",
    transaction_id: "TXN123456789",
    gateway: "Razorpay",
    paid_at: ISODate("2024-12-20T10:00:00Z")
  },
  
  // Shipping info
  shipping: {
    carrier: "FedEx",
    tracking_number: "FX123456789",
    method: "standard",
    estimated_delivery: ISODate("2024-12-25T00:00:00Z"),
    shipped_at: ISODate("2024-12-21T08:00:00Z"),
    delivered_at: null
  },
  
  // Status tracking (embedded history)
  status: "shipped",
  status_history: [
    {
      status: "pending",
      timestamp: ISODate("2024-12-20T10:00:00Z"),
      note: "Order received"
    },
    {
      status: "processing",
      timestamp: ISODate("2024-12-20T11:00:00Z"),
      note: "Payment confirmed"
    },
    {
      status: "shipped",
      timestamp: ISODate("2024-12-21T08:00:00Z"),
      note: "Package dispatched"
    }
  ],
  
  notes: "Please call before delivery",
  
  created_at: ISODate("2024-12-20T10:00:00Z"),
  updated_at: ISODate("2024-12-21T08:00:00Z")
}

// USERS COLLECTION (Separate - referenced from orders)
{
  _id: ObjectId("507f1f77bcf86cd799439040"),
  email: "john@example.com",
  password_hash: "$2b$10$...",
  
  profile: {
    first_name: "John",
    last_name: "Doe",
    phone: "+91-9876543210",
    date_of_birth: ISODate("1990-05-15T00:00:00Z"),
    gender: "male",
    avatar_url: "https://example.com/avatars/john.jpg"
  },
  
  // Embedded addresses for quick access
  addresses: [
    {
      _id: ObjectId("507f1f77bcf86cd799439060"),
      type: "home",
      is_default: true,
      street: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      postal_code: "400001",
      country: "India",
      phone: "+91-9876543210"
    },
    {
      _id: ObjectId("507f1f77bcf86cd799439061"),
      type: "office",
      is_default: false,
      street: "456 Business Park",
      city: "Mumbai",
      state: "Maharashtra",
      postal_code: "400002",
      country: "India"
    }
  ],
  
  // Wishlist (array of product references)
  wishlist: [
    {
      product_id: ObjectId("507f1f77bcf86cd799439021"),
      added_at: ISODate("2024-12-15T00:00:00Z")
    }
  ],
  
  // Cart (embedded for atomic operations)
  cart: {
    items: [
      {
        product_id: ObjectId("507f1f77bcf86cd799439022"),
        quantity: 2,
        added_at: ISODate("2024-12-20T12:00:00Z")
      }
    ],
    updated_at: ISODate("2024-12-20T12:00:00Z")
  },
  
  // User preferences
  preferences: {
    language: "en",
    currency: "INR",
    notification_email: true,
    notification_sms: false,
    theme: "light"
  },
  
  // Authentication
  email_verified: true,
  phone_verified: true,
  last_login_at: ISODate("2024-12-25T08:00:00Z"),
  
  // Roles and permissions
  roles: ["customer"],
  
  // Account status
  is_active: true,
  is_blocked: false,
  
  // Timestamps
  created_at: ISODate("2023-01-01T00:00:00Z"),
  updated_at: ISODate("2024-12-25T08:00:00Z")
}

// INVENTORY_LOGS COLLECTION (Separate - for tracking history)
{
  _id: ObjectId("507f1f77bcf86cd799439070"),
  product_id: ObjectId("507f1f77bcf86cd799439020"),
  sku: "PHONE-IP15-128-BLK",
  
  transaction_type: "sale", // sale, restock, adjustment, return
  
  quantity_before: 150,
  quantity_change: -1,
  quantity_after: 149,
  
  reference_type: "order", // order, purchase_order, adjustment
  reference_id: ObjectId("507f1f77bcf86cd799439050"),
  
  warehouse_id: "WH001",
  
  performed_by: {
    user_id: ObjectId("507f1f77bcf86cd799439040"),
    name: "System"
  },
  
  notes: "Sold via order ORD-2024-001234",
  
  created_at: ISODate("2024-12-20T10:00:00Z")
}
```

**Indexes for MongoDB:**

```javascript
// PRODUCTS COLLECTION INDEXES
db.products.createIndex({ "category._id": 1 });
db.products.createIndex({ "brand.name": 1 });
db.products.createIndex({ "pricing.sale_price": 1 });
db.products.createIndex({ "ratings.average": -1 });
db.products.createIndex({ "created_at": -1 });
db.products.createIndex({ "sku": 1 }, { unique: true });
db.products.createIndex({ "slug": 1 }, { unique: true });
db.products.createIndex({ "tags": 1 });
db.products.createIndex({ "is_active": 1, "pricing.sale_price": 1 });
// Text index for search
db.products.createIndex({ 
  "name": "text", 
  "description": "text", 
  "tags": "text" 
}, {
  weights: {
    name: 10,
    tags: 5,
    description: 1
  }
});

// REVIEWS COLLECTION INDEXES
db.reviews.createIndex({ "product_id": 1, "created_at": -1 });
db.reviews.createIndex({ "user._id": 1 });
db.reviews.createIndex({ "rating": 1 });
db.reviews.createIndex({ "is_verified_purchase": 1 });

// ORDERS COLLECTION INDEXES
db.orders.createIndex({ "order_number": 1 }, { unique: true });
db.orders.createIndex({ "customer._id": 1, "created_at": -1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "created_at": -1 });
db.orders.createIndex({ "items.product_id": 1 });

// USERS COLLECTION INDEXES
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "profile.phone": 1 });
db.users.createIndex({ "wishlist.product_id": 1 });
db.users.createIndex({ "cart.items.product_id": 1 });

// INVENTORY_LOGS COLLECTION INDEXES
db.inventory_logs.createIndex({ "product_id": 1, "created_at": -1 });
db.inventory_logs.createIndex({ "reference_id": 1 });
db.inventory_logs.createIndex({ "warehouse_id": 1, "created_at": -1 });
```

**Common MongoDB Queries:**

```javascript
// 1. Search products with filters
db.products.find({
  "category.slug": "smartphones",
  "pricing.sale_price": { $gte: 500, $lte: 1000 },
  "ratings.average": { $gte: 4.0 },
  "inventory.stock_quantity": { $gt: 0 },
  "is_active": true,
  "tags": { $in: ["5G", "Flagship"] }
}).sort({ "ratings.average": -1, "pricing.sale_price": 1 }).limit(20);

// 2. Text search products
db.products.find({
  $text: { $search: "iphone pro camera" },
  "is_active": true
}, {
  score: { $meta: "textScore" }
}).sort({ score: { $meta: "textScore" } });

// 3. Get product with reviews (using aggregation)
db.products.aggregate([
  { $match: { _id: ObjectId("507f1f77bcf86cd799439020") } },
  {
    $lookup: {
      from: "reviews",
      localField: "_id",
      foreignField: "product_id",
      as: "reviews"
    }
  },
  {
    $project: {
      name: 1,
      pricing: 1,
      inventory: 1,
      ratings: 1,
      reviews: { $slice: ["$reviews", 10] } // Latest 10 reviews
    }
  }
]);

// 4. Update product stock atomically
db.products.updateOne(
  {
    _id: ObjectId("507f1f77bcf86cd799439020"),
    "inventory.stock_quantity": { $gte: 1 } // Check stock available
  },
  {
    $inc: { "inventory.stock_quantity": -1 },
    $set: { "updated_at": new Date() }
  }
);

// 5. Add item to user's cart (atomic operation)
db.users.updateOne(
  {
    _id: ObjectId("507f1f77bcf86cd799439040"),
    "cart.items.product_id": { $ne: ObjectId("507f1f77bcf86cd799439020") }
  },
  {
    $push: {
      "cart.items": {
        product_id: ObjectId("507f1f77bcf86cd799439020"),
        quantity: 1,
        added_at: new Date()
      }
    },
    $set: { "cart.updated_at": new Date() }
  }
);

// 6. Update cart item quantity
db.users.updateOne(
  {
    _id: ObjectId("507f1f77bcf86cd799439040"),
    "cart.items.product_id": ObjectId("507f1f77bcf86cd799439020")
  },
  {
    $set: {
      "cart.items.$.quantity": 3,
      "cart.updated_at": new Date()
    }
  }
);

// 7. Remove item from cart
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439040") },
  {
    $pull: {
      "cart.items": { product_id: ObjectId("507f1f77bcf86cd799439020") }
    },
    $set: { "cart.updated_at": new Date() }
  }
);

// 8. Get user's order history with product details
db.orders.aggregate([
  { $match: { "customer._id": ObjectId("507f1f77bcf86cd799439040") } },
  { $sort: { "created_at": -1 } },
  { $limit: 10 },
  { $unwind: "$items" },
  {
    $lookup: {
      from: "products",
      localField: "items.product_id",
      foreignField: "_id",
      as: "product_details"
    }
  },
  {
    $group: {
      _id: "$_id",
      order_number: { $first: "$order_number" },
      status: { $first: "$status" },
      total_amount: { $first: "$total_amount" },
      created_at: { $first: "$created_at" },
      items: {
        $push: {
          product: { $arrayElemAt: ["$product_details", 0] },
          quantity: "$items.quantity",
          unit_price: "$items.unit_price"
        }
      }
    }
  }
]);

// 9. Get top-selling products
db.orders.aggregate([
  { $match: { status: { $in: ["delivered", "shipped"] } } },
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.product_id",
      total_sold: { $sum: "$items.quantity" },
      revenue: { $sum: "$items.subtotal" }
    }
  },
  { $sort: { total_sold: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "product"
    }
  },
  { $unwind: "$product" },
  {
    $project: {
      product_name: "$product.name",
      total_sold: 1,
      revenue: 1
    }
  }
]);

// 10. Update product ratings when new review is added
db.products.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439020") },
  [
    {
      $set: {
        "ratings.count": { $add: ["$ratings.count", 1] },
        "ratings.average": {
          $divide: [
            {
              $add: [
                { $multiply: ["$ratings.average", "$ratings.count"] },
                5 // new rating
              ]
            },
            { $add: ["$ratings.count", 1] }
          ]
        },
        "ratings.distribution.5": { $add: ["$ratings.distribution.5", 1] }
      }
    }
  ]
);

// 11. Get products with low stock (inventory alert)
db.products.find({
  $expr: {
    $lte: [
      "$inventory.stock_quantity",
      "$inventory.low_stock_threshold"
    ]
  },
  "is_active": true
}).sort({ "inventory.stock_quantity": 1 });

// 12. Get revenue by category (aggregation pipeline)
db.orders.aggregate([
  { $match: { 
    status: { $in: ["delivered", "shipped"] },
    created_at: { 
      $gte: new Date("2024-01-01"),
      $lte: new Date("2024-12-31")
    }
  }},
  { $unwind: "$items" },
  {
    $lookup: {
      from: "products",
      localField: "items.product_id",
      foreignField: "_id",
      as: "product"
    }
  },
  { $unwind: "$product" },
  {
    $group: {
      _id: "$product.category.name",
      total_revenue: { $sum: "$items.subtotal" },
      total_orders: { $sum: 1 },
      total_quantity: { $sum: "$items.quantity" }
    }
  },
  { $sort: { total_revenue: -1 } }
]);
```

**When to Embed vs Reference in MongoDB:**

**EMBED when:**
1. **One-to-Few relationships** (e.g., product images - usually < 10)
2. **Data that's read together** (e.g., order with order items)
3. **Data that doesn't change often** (e.g., address in order)
4. **Need atomic updates** (e.g., cart items with user)
5. **Avoid joins** for performance (e.g., category info in product)

**REFERENCE when:**
1. **One-to-Many relationships** (e.g., product → reviews)
2. **Many-to-Many relationships** (e.g., users ↔ products for wishlist)
3. **Data that changes frequently** (e.g., user profile)
4. **Large documents** (MongoDB 16MB limit)
5. **Data accessed independently** (e.g., user details)

---

### **5. Redis - Caching & Session Store**

**Q: Design a Redis data structure for caching product data, user sessions, and real-time leaderboards.**

**Answer:**

```javascript
// 1. PRODUCT CACHE (String with JSON)
// Key: product:{product_id}
// TTL: 1 hour
redis.setex(
  'product:12345',
  3600, // 1 hour
  JSON.stringify({
    id: 12345,
    name: 'iPhone 15 Pro',
    price: 999.99,
    stock: 150,
    rating: 4.5
  })
);

// Get product
const product = JSON.parse(await redis.get('product:12345'));

// 2. USER SESSION (Hash)
// Key: session:{session_id}
// TTL: 24 hours
redis.hmset('session:abc123', {
  user_id: '67890',
  email: 'john@example.com',
  name: 'John Doe',
  role: 'customer',
  created_at: Date.now()
});
redis.expire('session:abc123', 86400); // 24 hours

// Get session data
const session = await redis.hgetall('session:abc123');

// Update last activity
redis.hset('session:abc123', 'last_activity', Date.now());
redis.expire('session:abc123', 86400); // Reset TTL

// 3. SHOPPING CART (Hash)
// Key: cart:{user_id}
// Field: product_id, Value: quantity
redis.hset('cart:67890', '12345', 2); // Product 12345, qty 2
redis.hset('cart:67890', '12346', 1); // Product 12346, qty 1
redis.expire('cart:67890', 604800); // 7 days

// Get all cart items
const cartItems = await redis.hgetall('cart:67890');

// Update quantity
redis.hincrby('cart:67890', '12345', 1); // Increment by 1

// Remove item
redis.hdel('cart:67890', '12345');

// 4. PRODUCT SEARCH CACHE (Sorted Set)
// Key: search:{query}
// Score: relevance score or timestamp
redis.zadd('search:iphone', 100, '12345'); // Product 12345, score 100
redis.zadd('search:iphone', 95, '12346');
redis.zadd('search:iphone', 90, '12347');
redis.expire('search:iphone', 300); // 5 minutes

// Get top 10 results
const results = await redis.zrevrange('search:iphone', 0, 9, 'WITHSCORES');

// 5. RECENTLY VIEWED PRODUCTS (List)
// Key: recent:{user_id}
// Keep last 20 viewed products
redis.lpush('recent:67890', '12345'); // Add to front
redis.ltrim('recent:67890', 0, 19); // Keep only last 20
redis.expire('recent:67890', 2592000); // 30 days

// Get recently viewed
const recentProducts = await redis.lrange('recent:67890', 0, 9);

// 6. LEADERBOARD (Sorted Set)
// Key: leaderboard:monthly
// Score: points/score, Member: user_id
redis.zadd('leaderboard:monthly', 1500, 'user:67890');
redis.zadd('leaderboard:monthly', 2000, 'user:67891');
redis.zadd('leaderboard:monthly', 1800, 'user:67892');

// Get top 10 users
const topUsers = await redis.zrevrange('leaderboard:monthly', 0, 9, 'WITHSCORES');

// Get user rank (0-based)
const rank = await redis.zrevrank('leaderboard:monthly', 'user:67890');

// Get user score
const score = await redis.zscore('leaderboard:monthly', 'user:67890');

// Increment user score
redis.zincrby('leaderboard:monthly', 100, 'user:67890');

// 7. RATE LIMITING (String with counter)
// Key: rate_limit:{user_id}:{window}
// Sliding window rate limiting
const key = `rate_limit:67890:${Math.floor(Date.now() / 60000)}`; // 1-minute window
const count = await redis.incr(key);
redis.expire(key, 60); // Expire after 1 minute

if (count > 100) {
  throw new Error('Rate limit exceeded');
}

// 8. REAL-TIME INVENTORY (String with atomic operations)
// Key: inventory:{product_id}
redis.set('inventory:12345', 150);

// Decrement stock atomically
const newStock = await redis.decr('inventory:12345');
if (newStock < 0) {
  await redis.incr('inventory:12345'); // Rollback
  throw new Error('Out of stock');
}

// 9. ACTIVE USERS COUNT (HyperLogLog)
// Approximate count of unique visitors
redis.pfadd('active_users:2024-12-25', 'user:67890');
redis.pfadd('active_users:2024-12-25', 'user:67891');

// Get count
const activeCount = await redis.pfcount('active_users:2024-12-25');

// 10. NOTIFICATIONS QUEUE (List)
// Key: notifications:{user_id}
redis.lpush('notifications:67890', JSON.stringify({
  type: 'order_shipped',
  message: 'Your order has been shipped',
  timestamp: Date.now()
}));

// Get unread notifications
const notifications = await redis.lrange('notifications:67890', 0, -1);

// Clear notifications
redis.del('notifications:67890');

// 11. CACHE INVALIDATION PATTERNS (Set)
// Track which caches to invalidate when product changes
redis.sadd('cache_tags:product:12345', 'product:12345');
redis.sadd('cache_tags:product:12345', 'category:smartphones');
redis.sadd('cache_tags:product:12345', 'search:iphone');

// When product 12345 changes, invalidate all related caches
const cachesToInvalidate = await redis.smembers('cache_tags:product:12345');
for (const cacheKey of cachesToInvalidate) {
  await redis.del(cacheKey);
}

// 12. DISTRIBUTED LOCK (String with NX option)
// Prevent race conditions
const lockKey = 'lock:product:12345';
const lockValue = uuid(); // Unique identifier

// Acquire lock
const acquired = await redis.set(lockKey, lockValue, 'NX', 'EX', 10); // 10 sec

if (acquired) {
  try {
    // Critical section - update inventory
    await updateInventory();
  } finally {
    // Release lock only if we still own it
    const currentValue = await redis.get(lockKey);
    if (currentValue === lockValue) {
      await redis.del(lockKey);
    }
  }
} else {
  throw new Error('Could not acquire lock');
}

// 13. PUB/SUB for Real-Time Updates
// Publisher
redis.publish('product_updates', JSON.stringify({
  product_id: 12345,
  action: 'price_changed',
  new_price: 899.99
}));

// Subscriber
redis.subscribe('product_updates');
redis.on('message', (channel, message) => {
  const update = JSON.parse(message);
  console.log('Product update:', update);
  // Broadcast to connected WebSocket clients
});

// 14. TRENDING PRODUCTS (Sorted Set with time decay)
// Score based on views with time decay
const now = Date.now();
const score = now / 1000; // Unix timestamp

redis.zadd('trending:products', score, '12345');

// Get trending in last 24 hours
const yesterday = (Date.now() - 86400000) / 1000;
const trending = await redis.zrevrangebyscore(
  'trending:products',
  '+inf',
  yesterday,
  'WITHSCORES',
  'LIMIT', 0, 10
);

// 15. GEOSPATIAL DATA (Geo)
// Store warehouse locations
redis.geoadd('warehouses',
  77.5946, 12.9716, 'WH:Bangalore', // longitude, latitude, member
  72.8777, 19.0760, 'WH:Mumbai',
  77.1025, 28.7041, 'WH:Delhi'
);

// Find nearest warehouse
const nearest = await redis.georadius(
  'warehouses',
  77.6, 12.97, // User location
  50, 'km',
  'WITHDIST',
  'COUNT', 1,
  'ASC'
);
```

**Redis Data Structure Selection Guide:**

| Use Case           | Data Structure | Key Pattern              | TTL        |
|--------------------|----------------|---------------------------|-------------|
| Product cache      | String (JSON)  | `product:{id}`            | 1 hour      |
| User session       | Hash           | `session:{token}`         | 24 hours    |
| Shopping cart      | Hash           | `cart:{user_id}`          | 7 days      |
| Search results     | Sorted Set     | `search:{query}`          | 5 minutes   |
| Recently viewed    | List           | `recent:{user_id}`        | 30 days     |
| Leaderboard        | Sorted Set     | `leaderboard:{type}`      | No expiry   |
| Rate limiting      | String         | `rate:{user}:{window}`    | 1 minute    |
| Inventory count    | String         | `inventory:{id}`          | No expiry   |
| Unique visitors    | HyperLogLog    | `visitors:{date}`         | 90 days     |
| Notifications      | List           | `notifications:{user}`    | 7 days      |
| Distributed lock   | String         | `lock:{resource}`         | 10 seconds  |
| Trending items     | Sorted Set     | `trending:{type}`         | 24 hours    |
| Geolocation        | Geo            | `locations:{type}`        | No expiry   |


---

## **DATABASE DESIGN PRINCIPLES & INTERVIEW TIPS**

### **Key Concepts to Remember:**

**1. Normalization vs Denormalization:**
- **Normalize** to reduce redundancy (relational DBs)
- **Denormalize** for read performance (NoSQL, caching)
- **Trade-off**: Storage vs Query Speed

**2. Indexing Strategy:**
- Index foreign keys
- Index frequently queried columns
- Avoid over-indexing (slows writes)
- Composite indexes for multi-column queries
- Consider covering indexes

**3. Data Types:**
- Use appropriate types (INT vs BIGINT)
- DECIMAL for money (not FLOAT)
- VARCHAR vs TEXT
- ENUM for fixed values
- JSON for flexible schemas

**4. Relationships:**
- One-to-Many: Foreign key
- Many-to-Many: Junction table
- One-to-One: Rare, use foreign key or merge tables

**5. Performance Optimization:**
- Avoid SELECT *
- Use LIMIT for large result sets
- Paginate with cursors, not OFFSET
- Cache frequently accessed data
- Partition large tables
- Use read replicas

**6. Data Integrity:**
- Foreign key constraints
- Check constraints
- Unique constraints
- NOT NULL where appropriate
- Default values

**7. Scaling Strategies:**
- **Vertical**: Bigger server
- **Horizontal**: Sharding, replication
- **Read replicas**: Separate read/write
- **Caching layer**: Redis/Memcached
- **Database per service**: Microservices

**Common Interview Questions to Prepare:**

1. **"Why did you choose SQL vs NoSQL for your project?"**
2. **"How do you handle database migrations in production?"**
3. **"Explain your indexing strategy and why."**
4. **"How do you ensure data consistency across services?"**
5. **"What's your backup and disaster recovery plan?"**
6. **"How do you optimize slow queries?"**
7. **"When would you use transactions?"**
8. **"Explain ACID properties."**
9. **"How do you handle database schema versioning?"**
10. **"What's the difference between clustered and non-clustered indexes?"**

Good luck with your interviews! 🚀