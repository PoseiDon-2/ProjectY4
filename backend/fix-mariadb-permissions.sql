-- Fix MariaDB permissions for root user
-- Run this script in MariaDB/MySQL command line or phpMyAdmin

-- Grant all privileges to root@localhost
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY '' WITH GRANT OPTION;

-- Grant all privileges to root@127.0.0.1
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY '' WITH GRANT OPTION;

-- Grant all privileges to root@'%' (all hosts) - use with caution
-- GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '' WITH GRANT OPTION;

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the grants
SELECT User, Host FROM mysql.user WHERE User = 'root';
