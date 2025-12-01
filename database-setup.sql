-- ============================================
-- INSTRUCCIONES DE CONFIGURACIÓN DE BASE DE DATOS
-- ============================================
-- 
-- PASOS A SEGUIR:
-- 1. Entra a tu proyecto Supabase en https://supabase.com
-- 2. Ve a "SQL Editor"
-- 3. Crea una nueva query
-- 4. Copia y pega el código SQL de abajo
-- 5. Ejecuta (Run)
--
-- ============================================

-- TABLA DE DISPOSITIVOS
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'light', 'lock', 'thermostat', 'motion_sensor', 'camera'
    status JSONB DEFAULT '{"online": true, "power": false}'::jsonb,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA DE LOGS DE ACTIVIDAD
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- TABLA DE USUARIOS Y DISPOSITIVOS (Opcional - Para futuros usos)
CREATE TABLE device_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    permission VARCHAR(50) DEFAULT 'control', -- 'view', 'control'
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_users ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT (lectura) público
CREATE POLICY "Allow all SELECT on devices" ON devices
    FOR SELECT USING (true);

CREATE POLICY "Allow all SELECT on activity_logs" ON activity_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow all SELECT on device_users" ON device_users
    FOR SELECT USING (true);

-- Política: Permitir UPDATE (actualización) público
CREATE POLICY "Allow all UPDATE on devices" ON devices
    FOR UPDATE USING (true);

-- Política: Permitir INSERT (inserción) en logs
CREATE POLICY "Allow all INSERT on activity_logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- INSERTAR DATOS DE EJEMPLO
-- ============================================

-- Luces Inteligentes
INSERT INTO devices (name, type, status, location) VALUES
('Luz Sala', 'light', '{"online": true, "power": false, "brightness": 100}'::jsonb, 'Sala'),
('Luz Dormitorio', 'light', '{"online": true, "power": false, "brightness": 50}'::jsonb, 'Dormitorio'),
('Luz Cocina', 'light', '{"online": true, "power": true, "brightness": 80}'::jsonb, 'Cocina');

-- Cerraduras Inteligentes
INSERT INTO devices (name, type, status, location) VALUES
('Puerta Principal', 'lock', '{"online": true, "locked": true}'::jsonb, 'Entrada'),
('Puerta Garage', 'lock', '{"online": true, "locked": false}'::jsonb, 'Garage');

-- Termostatos
INSERT INTO devices (name, type, status, location) VALUES
('Termostato Principal', 'thermostat', '{"online": true, "temperature": 22, "target": 22}'::jsonb, 'Sala'),
('Termostato Dormitorio', 'thermostat', '{"online": true, "temperature": 20, "target": 20}'::jsonb, 'Dormitorio');

-- Sensores de Movimiento
INSERT INTO devices (name, type, status, location) VALUES
('Sensor Entrada', 'motion_sensor', '{"online": true, "motion_detected": false}'::jsonb, 'Entrada'),
('Sensor Sala', 'motion_sensor', '{"online": true, "motion_detected": true}'::jsonb, 'Sala');

-- Cámaras de Seguridad
INSERT INTO devices (name, type, status, location) VALUES
('Cámara Entrada', 'camera', '{"online": true, "recording": true}'::jsonb, 'Entrada'),
('Cámara Garage', 'camera', '{"online": false, "recording": false}'::jsonb, 'Garage');

-- ============================================
-- VERIFICAR DATOS INSERTADOS
-- ============================================

SELECT * FROM devices;
SELECT * FROM activity_logs;
