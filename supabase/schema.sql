-- SQL DDL Schema for Prosetting Project
-- Designed for Supabase / PostgreSQL

-- 1. Table: games (ประเภทเกม เช่น VALORANT, CS2)
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,          -- เช่น 'VALORANT', 'CS2'
    slug VARCHAR(50) UNIQUE NOT NULL,   -- เช่น 'valorant', 'cs2'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: players (ประวัติข้อมูลโปรเพลเยอร์)
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE, -- ชื่อในเกม เช่น 'TenZ'
    real_name VARCHAR(150),                -- ชื่อจริง เช่น 'Tyson Ngo'
    team VARCHAR(150),                     -- สังกัดทีม เช่น 'Edward Gaming'
    birth_date DATE,                       -- วันเดือนปีเกิด
    nationality VARCHAR(100),              -- สัญชาติ เช่น 'Canadian'
    country_code VARCHAR(10),              -- รหัสประเทศ เช่น 'CA', 'TH'
    profile_img_url TEXT,                  -- ลิงก์รูปภาพโปรไฟล์
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table: products (ฐานข้อมูลสินค้า - อุปกรณ์และ PC Spec)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,     -- ชื่อรุ่นสินค้า
    category VARCHAR(50) NOT NULL,        -- เช่น 'mouse', 'keyboard', 'cpu', 'gpu'
    product_type VARCHAR(20) CHECK (product_type IN ('gear', 'hardware')), -- เมาส์/คีย์บอร์ด หรือ สเปคคอม
    shopee_url TEXT,                      -- ลิงก์ Shopee Affiliate
    lazada_url TEXT,                      -- ลิงก์ Lazada Affiliate
    amazon_url TEXT,                      -- ลิงก์ Amazon Affiliate
    image_url TEXT,                       -- รูปภาพสินค้า
    estimated_price_thb NUMERIC(10,2),    -- ราคาประเมิน (บาท)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table: player_products (ตารางเชื่อมโยงผู้เล่นกับสินค้าที่เลือกใช้งาน)
CREATE TABLE IF NOT EXISTS player_products (
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (player_id, product_id)
);

-- 5. Table: player_game_settings (ค่าตั้งค่าและการเล่น แยกตามผู้เล่นและเกม)
CREATE TABLE IF NOT EXISTS player_game_settings (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    
    -- บทบาทและผลงานในเกมนั้นๆ
    game_role VARCHAR(100),               -- เช่น 'Duelist', 'AWPer', 'IGL'
    championships_count INTEGER DEFAULT 0,
    mvp_count INTEGER DEFAULT 0,
    achievements_list TEXT[],             -- ผลงานเด่น เช่น ['VLR Champions 2021', 'CS Masters']
    
    -- ค่าตั้งค่าเมาส์ทั่วไป (Common Mouse Settings)
    mouse_dpi NUMERIC(8,2),               -- เช่น 800.00
    mouse_hz INTEGER,                     -- เช่น 1000, 4000
    in_game_sens NUMERIC(8,4),            -- เช่น 0.3500
    edpi NUMERIC(8,2),                    -- เช่น 280.00 (คำนวณจาก dpi * sens)
    
    -- ค่าตั้งค่าหน้าจอทั่วไป (Common Video Settings)
    resolution VARCHAR(50),               -- เช่น '1920x1080'
    aspect_ratio VARCHAR(20),             -- เช่น '16:9'
    refresh_rate INTEGER,                 -- เช่น 240, 360
    
    -- [สำคัญ] ฟิลด์เก็บการตั้งค่าแบบยืดหยุ่นแยกตามเกม (JSONB)
    settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, game_id)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_player_game_settings_player_game ON player_game_settings(player_id, game_id);

-- GIN Index on JSONB for fast queries inside settings_data (e.g. crosshair code queries)
CREATE INDEX IF NOT EXISTS idx_player_game_settings_data ON player_game_settings USING gin (settings_data);

-- Disable Row-Level Security (RLS) for all tables to allow the Seeder/Scraper to insert data using public key
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_settings DISABLE ROW LEVEL SECURITY;

