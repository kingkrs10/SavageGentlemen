-- Database Performance Optimizations for Savage Gentlemen App
-- High Priority Performance Indexes

-- Events table indexes (most frequently queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_featured ON events(featured) WHERE featured = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_location ON events(location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_guest ON users(is_guest);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_firebase_id ON users(firebase_id);

-- Tickets table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_sales_start_date ON tickets(sales_start_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_sales_end_date ON tickets(sales_end_date);

-- Ticket purchases table indexes (critical for sales tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_purchases_user_id ON ticket_purchases(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_purchases_event_id ON ticket_purchases(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_purchases_ticket_id ON ticket_purchases(ticket_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_purchases_order_id ON ticket_purchases(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_purchases_status ON ticket_purchases(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_purchases_purchase_date ON ticket_purchases(purchase_date);

-- Ticket scans table indexes (for scanning performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_scans_qr_code_data ON ticket_scans(qr_code_data);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_scans_user_id ON ticket_scans(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_scans_event_id ON ticket_scans(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_scans_scan_date ON ticket_scans(scan_date);

-- Orders table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);

-- Analytics table indexes (for performance monitoring)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_analytics_event_id ON event_analytics(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_analytics_date ON event_analytics(date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_analytics_date ON product_analytics(date);

-- Products table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products(price);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_event_status ON tickets(event_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_purchases_user_event ON ticket_purchases(user_id, event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_featured ON events(date, featured);

-- Optimize frequently used queries
-- Events with tickets query optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_with_tickets ON events(id) 
WHERE id IN (SELECT DISTINCT event_id FROM tickets WHERE status = 'active');

-- Active user sessions optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_users ON users(id, role, is_guest) 
WHERE is_guest = false;

-- Comment: These indexes will dramatically improve query performance for:
-- 1. Event browsing and filtering
-- 2. User authentication and role checks
-- 3. Ticket purchase flows
-- 4. QR code scanning operations
-- 5. Analytics dashboard queries
-- 6. Admin panel operations