-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS mug_exchange;
SET search_path TO mug_exchange;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS mugs;
DROP TABLE IF EXISTS orders;

-- 2. Define ENUM type
-- MUG_ACTIVE/RETURNED -> READY_PICKUP/MUG_RETURNED to match server.js
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('IN_PROGRESS', 'READY_PICKUP', 'MUG_RETURNED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Users Table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  username VARCHAR(100),
  name VARCHAR(100),
  email VARCHAR(100),
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password VARCHAR(100),
  token VARCHAR(100)
);

-- 4. Mugs Table
CREATE TABLE mugs (
  mug_id VARCHAR(50) PRIMARY KEY, 
  assigned_at TIMESTAMP
);

-- Sequence to automatically increase the order number by 1 for each new order
CREATE SEQUENCE order_number_seq START 0;

-- NEED TO CHANGE ID AND MERCHANT_ID TYPES
-- 5. Orders Table
-- merchant_id INT -> VARCHAR(100)
-- created_at -> order_time to match frontend/database_local.js
-- added cafe_name VARCHAR(200) for history display
-- Added formatted_order_num as our unique order ID to be scanned into CSS and used for identification
CREATE TABLE orders (
  id          VARCHAR(50) PRIMARY KEY,
  user_id     UUID,
  merchant_id VARCHAR(100),
  mug_id      VARCHAR(50),
  order_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cafe_name   VARCHAR(200),
  item        VARCHAR(50),
  price       DECIMAL(10, 2),
  order_num INTEGER DEFAULT nextval('order_number_seq'),
  status      order_status,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_mug FOREIGN KEY (mug_id) REFERENCES mugs(mug_id)
);

-- 6. Orders view for "chit-friendly" time formatting
-- created_at -> order_time to match renamed column
CREATE VIEW orders_time_formatted AS
SELECT *, 
       to_char(order_time, 'HH12:MI') AS formatted_time
FROM orders;

-- added demo user for frontend demo login
INSERT INTO users(name, phone_number, password) VALUES
('demo',  '0000000000', 'demo'),
('test1', '123456789',  'hi'),
('test2', '987654321',  'hi2');


/*
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT,
  kind ENUM('scanner','return_bin'),
  public_key VARCHAR(255),
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('pickup','return','overdue','error'),
  mug_id INT,
  user_id INT,
  order_id INT,
  device_id INT,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payload_json JSON,
  FOREIGN KEY (mug_id) REFERENCES mugs(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
*/


/*
 * run these SQL commands against the production Render DB
 * before starting the server. Only needs to be run once.
 * Use the Render dashboard query editor or psql.
 *
 * ALTER TABLE mug_exchange.orders ADD COLUMN cafe_name VARCHAR(200);
 * ALTER TABLE mug_exchange.orders RENAME COLUMN created_at TO order_time;
 * ALTER TABLE mug_exchange.orders ALTER COLUMN merchant_id TYPE VARCHAR(100);
 * CREATE SEQUENCE order_number_seq START 0;
 * ALTER TABLE orders ADD COLUMN order_num INTEGER DEFAULT nextval('order_number_seq');
 * ALTER TABLE orders ADD COLUMN formatted_id VARCHAR(10) GENERATED ALWAYS AS ('?' || order_num::text) STORED;
 */

/** ALTER TABLE mug_exchange.users ADD COLUMN username VARCHAR(100);