-- V3: Add updated_at and last_login to users table
ALTER TABLE users
ADD COLUMN updated_at TIMESTAMP DEFAULT now(),
ADD COLUMN last_login TIMESTAMP;
