-- ============================================
-- SISTEMA DE CONTROL DE DISPOSITIVOS INTELIGENTES
-- Database Setup Script para Supabase
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Entra a tu proyecto Supabase en https://supabase.com
-- 2. Ve a "SQL Editor"
-- 3. Copia y pega TODO el código de este archivo
-- 4. Ejecuta (Run)
--
-- ============================================

-- Eliminamos tablas existentes para empezar limpio
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS device_users CASCADE;
DROP TABLE IF EXISTS devices CASCADE;

-- Crear tabla de dispositivos desde cero
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('light', 'lock', 'thermostat', 'motion_sensor', 'camera')),
    location VARCHAR(255),
    status BOOLEAN DEFAULT false,
    brightness INTEGER DEFAULT 50,
    temperature NUMERIC DEFAULT 20,
    target_temperature NUMERIC DEFAULT 22,
    is_locked BOOLEAN DEFAULT false,
    is_recording BOOLEAN DEFAULT false,
    motion_detected BOOLEAN DEFAULT false,
    last_motion TIMESTAMP DEFAULT NOW(),
    -- Agregar campos para cámaras IP reales
    camera_url VARCHAR(500),
    camera_username VARCHAR(255),
    camera_password VARCHAR(255),
    camera_type VARCHAR(50) DEFAULT 'ip',
    -- Fin cambios
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de logs de actividad
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de usuarios (opcional para futura autenticación)
CREATE TABLE device_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    permission VARCHAR(50) DEFAULT 'control',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Políticas RLS - Eliminamos antes de crear
-- ============================================

-- Políticas para devices
DROP POLICY IF EXISTS "allow_select_devices" ON devices;
CREATE POLICY "allow_select_devices" ON devices FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_update_devices" ON devices;
CREATE POLICY "allow_update_devices" ON devices FOR UPDATE USING (true);

DROP POLICY IF EXISTS "allow_insert_devices" ON devices;
CREATE POLICY "allow_insert_devices" ON devices FOR INSERT WITH CHECK (true);

-- Políticas para activity_logs
DROP POLICY IF EXISTS "allow_select_logs" ON activity_logs;
CREATE POLICY "allow_select_logs" ON activity_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_insert_logs" ON activity_logs;
CREATE POLICY "allow_insert_logs" ON activity_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_logs" ON activity_logs;
CREATE POLICY "allow_delete_logs" ON activity_logs FOR DELETE USING (true);

-- Políticas para device_users
DROP POLICY IF EXISTS "allow_select_users" ON device_users;
CREATE POLICY "allow_select_users" ON device_users FOR SELECT USING (true);

-- ============================================
-- CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_device_id ON activity_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================
-- Insertar datos de ejemplo
-- ============================================

INSERT INTO devices (name, type, location, status, brightness, temperature, target_temperature) VALUES
('Luz Sala', 'light', 'Sala de estar', true, 75, NULL, NULL),
('Luz Cocina', 'light', 'Cocina', false, 0, NULL, NULL),
('Luz Dormitorio', 'light', 'Dormitorio principal', true, 50, NULL, NULL),
('Cerradura Puerta Principal', 'lock', 'Entrada', true, NULL, NULL, NULL),
('Cerradura Garaje', 'lock', 'Garaje', false, NULL, NULL, NULL),
('Termostato Sala', 'thermostat', 'Sala de estar', true, NULL, 21, 22),
('Sensor Movimiento Entrada', 'motion_sensor', 'Entrada', true, NULL, NULL, NULL),
('Sensor Movimiento Pasillo', 'motion_sensor', 'Pasillo', true, NULL, NULL, NULL),
-- Ejemplo de cámara con datos ficticios (debe actualizarse con datos reales)
('Cámara Entrada', 'camera', 'Entrada principal', true, NULL, NULL, NULL),
('Cámara Garaje', 'camera', 'Garaje', true, NULL, NULL, NULL);

-- ============================================
-- VERIFICAR DATOS
-- ============================================

SELECT 'Dispositivos creados:' as status, COUNT(*) as total FROM devices;
SELECT 'Logs de actividad:' as status, COUNT(*) as total FROM activity_logs;
