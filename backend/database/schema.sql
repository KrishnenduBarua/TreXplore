-- TreXplore database schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS trexplore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trexplore;

-- Users: travelers + admins (website management)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  bio VARCHAR(500) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  role ENUM('traveler', 'admin') NOT NULL DEFAULT 'traveler',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Destinations: tourist attractions across the 8 divisions
CREATE TABLE IF NOT EXISTS destinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(170) NOT NULL UNIQUE,
  division ENUM('Dhaka','Chattogram','Rajshahi','Khulna','Barishal','Sylhet','Rangpur','Mymensingh') NOT NULL,
  district VARCHAR(100) NOT NULL,
  category VARCHAR(80) DEFAULT 'General',
  short_description VARCHAR(300),
  description TEXT,
  how_to_reach TEXT,
  best_time_to_visit VARCHAR(150),
  entry_fee VARCHAR(100) DEFAULT 'Free',
  image_url VARCHAR(500),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_division (division),
  INDEX idx_district (district)
);

-- Blogs: travel experiences shared by users
CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  destination_id INT DEFAULT NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  cover_image_url VARCHAR(500),
  content TEXT NOT NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
);

-- Comments on blogs (lightweight community layer)
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blog_id INT NOT NULL,
  user_id INT NOT NULL,
  content VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- AI recommendations
-- Safe to re-run on an existing database (everything is IF NOT EXISTS).
-- ---------------------------------------------------------------------------

-- Places a traveler has saved. The strongest explicit taste signal.
CREATE TABLE IF NOT EXISTS favorites (
  user_id INT NOT NULL,
  destination_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, destination_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

-- Behaviour log the recommender learns from. One row per observed action:
--   view        opened a destination page
--   blog_read   read a story about a destination
--   blog_write  published a story about a destination
--   filter      filtered the destination list by category and/or division
CREATE TABLE IF NOT EXISTS user_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  destination_id INT DEFAULT NULL,
  category VARCHAR(80) DEFAULT NULL,
  division VARCHAR(30) DEFAULT NULL,
  event_type ENUM('view','blog_read','blog_write','filter') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
  INDEX idx_events_user_time (user_id, created_at),
  INDEX idx_events_destination (destination_id)
);
