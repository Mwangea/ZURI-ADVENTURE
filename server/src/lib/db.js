import mysql from 'mysql2/promise';
import { env, hasMysqlConfig } from './env.js';

export const pool = hasMysqlConfig()
  ? mysql.createPool({
      host: env.MYSQL_HOST,
      port: env.MYSQL_PORT,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      database: env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  : null;

let schemaInitialized = false;

export async function ensureSchema() {
  if (schemaInitialized) return;
  schemaInitialized = true;

  if (!pool) {
    // DB not configured yet; allow server to start so /health works.
    // Admin/public endpoints will respond with 503 when accessed.
    return;
  }

  // Helper: run multiple SQL statements.
  const q = async (sql) => {
    await pool.query(sql);
  };

  // Core admin/auth tables
  await q(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_refresh_tokens_admin_id (admin_id),
      UNIQUE KEY uq_refresh_tokens_token_hash (token_hash),
      CONSTRAINT fk_refresh_tokens_admins
        FOREIGN KEY (admin_id) REFERENCES admins(id)
        ON DELETE CASCADE
    )
  `);

  // Packages + media + content fields for public SEO pages
  await q(`
    CREATE TABLE IF NOT EXISTS packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      duration VARCHAR(100) NOT NULL,
      tourType VARCHAR(100) NULL,
      maxPeople INT NULL,
      minAge INT NULL,
      scheduling_mode ENUM('FIXED_DEPARTURES','FLEXIBLE_DATES') NOT NULL DEFAULT 'FIXED_DEPARTURES',
      overview TEXT NULL,
      seoDescription TEXT NULL,
      price_base DECIMAL(10,2) NULL,
      price_note VARCHAR(255) NULL,
      tour_map_url VARCHAR(2048) NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      publish TINYINT(1) NOT NULL DEFAULT 0,
      hero_image_url VARCHAR(2048) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS package_media (
      id INT AUTO_INCREMENT PRIMARY KEY,
      package_id INT NOT NULL,
      media_type ENUM('IMAGE','VIDEO') NOT NULL,
      src_url VARCHAR(2048) NULL,
      video_embed_url VARCHAR(2048) NULL,
      title VARCHAR(255) NULL,
      caption TEXT NULL,
      thumbnail_url VARCHAR(2048) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_thumbnail TINYINT(1) NOT NULL DEFAULT 0,
      thumbnail_sort_order INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_package_media_package_id (package_id),
      CONSTRAINT fk_package_media_packages
        FOREIGN KEY (package_id) REFERENCES packages(id)
        ON DELETE CASCADE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS package_price_tiers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      package_id INT NOT NULL,
      min_person INT NOT NULL,
      max_person INT NOT NULL,
      price_per_person DECIMAL(10,2) NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'USD',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_package_price_tiers_package_id (package_id),
      CONSTRAINT fk_package_price_tiers_packages
        FOREIGN KEY (package_id) REFERENCES packages(id)
        ON DELETE CASCADE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS package_highlights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      package_id INT NOT NULL,
      text TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_package_highlights_packages
        FOREIGN KEY (package_id) REFERENCES packages(id)
        ON DELETE CASCADE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS package_included (
      id INT AUTO_INCREMENT PRIMARY KEY,
      package_id INT NOT NULL,
      text TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_package_included_packages
        FOREIGN KEY (package_id) REFERENCES packages(id)
        ON DELETE CASCADE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS package_excluded (
      id INT AUTO_INCREMENT PRIMARY KEY,
      package_id INT NOT NULL,
      text TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_package_excluded_packages
        FOREIGN KEY (package_id) REFERENCES packages(id)
        ON DELETE CASCADE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS package_related_packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      package_id INT NOT NULL,
      related_package_id INT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_package_related_packages_package
        FOREIGN KEY (package_id) REFERENCES packages(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_package_related_packages_related_package
        FOREIGN KEY (related_package_id) REFERENCES packages(id)
        ON DELETE CASCADE,
      UNIQUE KEY uq_package_related (package_id, related_package_id)
    )
  `);

  // Adventures
  await q(`
    CREATE TABLE IF NOT EXISTS adventures (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255) NULL,
      description TEXT NULL,
      hero_image_url VARCHAR(2048) NULL,
      publish TINYINT(1) NOT NULL DEFAULT 0,
      related_package_id INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_adventures_related_package_id (related_package_id),
      CONSTRAINT fk_adventures_related_package
        FOREIGN KEY (related_package_id) REFERENCES packages(id)
        ON DELETE SET NULL
    )
  `);

  // Fixed departures (for scheduling_mode=FIXED_DEPARTURES; used in later R3 UI/flows)
  await q(`
    CREATE TABLE IF NOT EXISTS package_departures (
      id INT AUTO_INCREMENT PRIMARY KEY,
      package_id INT NOT NULL,
      departure_date DATE NOT NULL,
      max_people INT NULL,
      spots_left INT NULL,
      publish TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_package_departures_package_id (package_id, departure_date),
      CONSTRAINT fk_package_departures_packages
        FOREIGN KEY (package_id) REFERENCES packages(id)
        ON DELETE CASCADE
    )
  `);
}

export function isDbReady() {
  return Boolean(pool);
}

