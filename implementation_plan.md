# Prosettings Project Implementation Plan (Final)

แผนการพัฒนาแกนหลักของระบบ (Core System Implementation) - ปรับโครงสร้างฐานข้อมูลแบบยืดหยุ่นสูง (Polymorphic DB)

---

## 🎯 ขอบเขตการทำงานระยะแรก (Phase 1 Focus)
เราจะเน้นการพัฒนาฐานระบบและข้อมูลหลังบ้านให้พร้อมทำงานก่อนเรื่องดีไซน์ โดยมีรายละเอียดดังนี้:

1.  **การตั้งค่าโครงการ (Project Setup)**:
    *   สร้างโครงสร้างโปรเจกต์ Next.js ใน workspace ปัจจุบัน
2.  **ระบบดูดข้อมูล (Web Scraper)**:
    *   เขียนสคริปต์ JavaScript ในเครื่องเพื่อเข้าถึงหน้าเว็บ `prosettings.net` ดึงรายชื่อผู้เล่นและค่าตั้งค่าอย่างสุภาพและปลอดภัย
3.  **โครงสร้างฐานข้อมูล (Database Schema)**:
    *   ออกแบบตารางข้อมูลด้วยคอลัมน์ JSONB เพื่อรองรับการตั้งค่าที่แตกต่างกันโดยสิ้นเชิงในแต่ละเกม (เช่น โค้ดเป้าใน Valorant, ปุ่มปรับแต่ง Viewmodel และ Launch Options ใน CS2)
4.  **ระบบแปลงค่าเมาส์ (Sensitivity Converter Utility)**:
    *   เขียนฟังก์ชันคำนวณการแปลงความไวเมาส์สำหรับเกม VALORANT, CS2, Apex Legends และ Overwatch

---

## 🗄️ โครงสร้างฐานข้อมูลอย่างละเอียด (PostgreSQL DDL Schema)

เพื่อให้รองรับความจริงที่ว่า **"แต่ละเกมมีรายละเอียดการตั้งค่าที่แตกต่างกันโดยสิ้นเชิงและมีจำนวนเยอะมาก"** ผมได้เปลี่ยนการออกแบบโครงสร้างตารางโดยใช้เทคนิค **JSONB (JSON Binary)** ของ PostgreSQL:

```sql
-- 1. ตารางเก็บข้อมูลเกม
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,          -- เช่น 'VALORANT', 'CS2', 'Apex Legends'
    slug VARCHAR(50) UNIQUE NOT NULL,   -- เช่น 'valorant', 'cs2'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. ตารางเก็บข้อมูลโปรเพลเยอร์
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,     -- ชื่อในเกม เช่น 'TenZ'
    real_name VARCHAR(150),             -- ชื่อจริง เช่น 'Tyson Ngo'
    birth_date DATE,                    -- วันเดือนปีเกิด
    nationality VARCHAR(100),           -- สัญชาติ เช่น 'Canadian'
    country_code VARCHAR(10),           -- รหัสประเทศ เช่น 'CA', 'TH'
    profile_img_url TEXT,               -- รูปภาพโปรไฟล์
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. ตารางเก็บข้อมูลสินค้า (แยกกลุ่มด้วย product_type ในระดับโปรแกรม)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,          -- ชื่อสินค้า
    category VARCHAR(50) NOT NULL,      -- เช่น 'mouse', 'keyboard', 'cpu', 'gpu', 'ram'
    product_type VARCHAR(20) CHECK (product_type IN ('gear', 'hardware')),
    shopee_url TEXT,                    -- ลิงก์ Affiliate Shopee
    lazada_url TEXT,                    -- ลิงก์ Affiliate Lazada
    amazon_url TEXT,                    -- ลิงก์ Affiliate Amazon
    image_url TEXT,                     -- รูปภาพสินค้า
    estimated_price_thb NUMERIC(10,2),  -- ราคาประเมิน
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. ตารางความสัมพันธ์ผู้เล่นกับสินค้า
CREATE TABLE player_products (
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (player_id, product_id)
);

-- 5. ตารางเก็บค่าตั้งค่า, ตำแหน่ง และผลงานของเพลเยอร์ (ยืดหยุ่นด้วยระบบ JSONB)
CREATE TABLE player_game_settings (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    
    -- ข้อมูลบทบาทและผลงานผู้เล่นในเกมนั้น
    game_role VARCHAR(100),             -- เช่น 'Duelist' หรือ 'AWPer'
    championships_count INTEGER DEFAULT 0,
    mvp_count INTEGER DEFAULT 0,
    achievements_list TEXT[],
    
    -- ค่าเมาส์พื้นฐานที่มีร่วมกันทุกเกม
    mouse_dpi NUMERIC(8,2),             -- เช่น 800
    mouse_hz INTEGER,                   -- เช่น 1000, 4000
    in_game_sens NUMERIC(8,4),          -- เช่น 0.35
    edpi NUMERIC(8,2),                  -- เช่น 280
    
    -- ค่าหน้าจอพื้นฐานที่มีร่วมกันทุกเกม
    resolution VARCHAR(50),             -- เช่น '1920x1080'
    aspect_ratio VARCHAR(20),           -- เช่น '16:9'
    refresh_rate INTEGER,               -- เช่น 240, 360
    
    -- [สำคัญ] ฟิลด์เก็บการตั้งค่าแบบยืดหยุ่นตามประเภทเกม (JSONB)
    settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id, game_id)
);
```

---

## 💡 โครงสร้างการจัดเก็บข้อมูลการตั้งค่าเฉพาะเกม (Inside `settings_data`)

เมื่อผู้ใช้เปลี่ยนไปมาระหว่างเกม ตัวแอปพลิเคชันจะใช้คอลัมน์ `settings_data` ในการเก็บ Object ที่แตกต่างกันดังนี้ครับ:

### กรณีเกม VALORANT (ตัวอย่างข้อมูลในคอลัมน์ `settings_data`)
```json
{
  "crosshair_code": "0;s;1;P;c;5;o;1;d;1;z;3;f;0;0t;1;0l;2;0o;2;0a;1;0f;0;1b;0",
  "zoom_sens": 1.0,
  "video_graphics": {
    "material_quality": "Low",
    "texture_quality": "Low",
    "detail_quality": "Low",
    "ui_quality": "Low",
    "vsync": "Off",
    "anti_aliasing": "None",
    "anisotropic_filtering": "1x"
  }
}
```

### กรณีเกม CS2 (ตัวอย่างข้อมูลในคอลัมน์ `settings_data`)
```json
{
  "crosshair_code": "CSGO-3yX9z-44y8v-5U4vJ-UoWkH-yPquK",
  "viewmodel_code": "viewmodel_fov 68; viewmodel_offset_x 2.5; viewmodel_offset_z -1.5;",
  "launch_options": "-novid -freq 360 -allow_third_party_software",
  "config_url": "https://example.com/s1mple.cfg",
  "video_graphics": {
    "boost_player_contrast": "Enabled",
    "model_texture_detail": "Low",
    "shader_detail": "Low",
    "ambient_occlusion": "Disabled",
    "nvidia_reflex_low_latency": "Enabled"
  }
}
```

### กรณีเกม Apex Legends (ตัวอย่างข้อมูลในคอลัมน์ `settings_data`)
```json
{
  "fov": 110,
  "video_graphics": {
    "vsync": "Disabled",
    "texture_streaming_budget": "None",
    "model_detail": "Low",
    "effects_detail": "Low"
  }
}
```

---

## ✅ ทำไมการใช้ JSONB จึงตอบโจทย์ที่สุด?
1.  **ยืดหยุ่นไร้ขีดจำกัด**: แต่ละเกมจะตั้งค่าละเอียดแค่ไหนก็ได้ เช่น CS2 มี Viewmodel กับ Launch Options ขณะที่ Valorant มีรายละเอียดเส้น Crosshair ยิบย่อย ข้อมูลเหล่านี้จะถูกเก็บแยกใน JSONB โดยไม่ต้องสร้างตารางแยก
2.  **ไม่มีฟิลด์ว่าง (NULL)**: ตารางจะไม่รกรุงรังด้วยคอลัมน์ของเกมอื่นที่ไม่ได้ใช้
3.  **รองรับการขยายตัวในอนาคต**: หากอนาคตคุณอยากเพิ่มเกมใหม่ (เช่น Rainbow Six Siege หรือ Call of Duty) เราสามารถเพิ่มระบบได้ทันทีโดยไม่ต้องแก้ไขโครงสร้าง Database (ไม่ต้องทำ Migrations)

---

## 🛠️ แผนการทำงานเรียงตามลำดับ (Tasks Roadmap)
1.  [ ] **Task 1**: ติดตั้ง Next.js โครงการเริ่มต้นใน workspace
2.  [ ] **Task 2**: เขียนและรันสคริปต์ Scraper เพื่อเตรียมข้อมูลนักแข่งตัวอย่าง
3.  [ ] **Task 3**: ออกแบบโครงสร้าง SQL Schema สำหรับ Supabase/PostgreSQL
4.  [ ] **Task 4**: พัฒนาระบบคำนวณ Sensitivity Converter
