-- ============================================
-- SISTEMA DE CONTROL DE DISPOSITIVOS INTELIGENTES
-- Database Setup Script para Supabase
-- ============================================
-- 
-- PASOS A SEGUIR:
-- 1. Entra a tu proyecto Supabase en https://supabase.com
-- 2. Ve a "SQL Editor"
-- 3. Crea una nueva query
-- 4. Copia y pega TODO el código de este archivo
-- 5. Ejecuta (Run)
--
-- ============================================

-- Tabla de dispositivos actualizada con campos específicos para cada tipo
CREATE TABLE IF NOT EXISTS devices (
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de logs actualizada con estructura simplificada
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de usuarios (opcional para futura autenticación)
CREATE TABLE IF NOT EXISTS device_users (
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

-- Políticas RLS simplificadas para permitir acceso sin autenticación (demo)
-- Permitir lectura en dispositivos
CREATE POLICY IF NOT EXISTS "Allow all SELECT on devices" ON devices
    FOR SELECT USING (true);

-- Permitir lectura en logs
CREATE POLICY IF NOT EXISTS "Allow all SELECT on activity_logs" ON activity_logs
    FOR SELECT USING (true);

-- Permitir lectura en usuarios
CREATE POLICY IF NOT EXISTS "Allow all SELECT on device_users" ON device_users
    FOR SELECT USING (true);

-- Permitir actualización en dispositivos
CREATE POLICY IF NOT EXISTS "Allow all UPDATE on devices" ON devices
    FOR UPDATE USING (true);

-- Permitir inserción en logs
CREATE POLICY IF NOT EXISTS "Allow all INSERT on activity_logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Permitir inserción en dispositivos
CREATE POLICY IF NOT EXISTS "Allow all INSERT on devices" ON devices
    FOR INSERT WITH CHECK (true);

-- ============================================
-- CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_device_id ON activity_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================
-- INSERTAR DATOS DE EJEMPLO
-- ============================================

-- Datos de ejemplo actualizados con estructura nueva
INSERT INTO devices (name, type, location, status, brightness, temperature, target_temperature) VALUES
('Luz Sala', 'light', 'Sala de estar', true, 75, NULL, NULL),
('Luz Cocina', 'light', 'Cocina', false, 0, NULL, NULL),
('Luz Dormitorio', 'light', 'Dormitorio principal', true, 50, NULL, NULL),
('Cerradura Puerta Principal', 'lock', 'Entrada', true, NULL, NULL, NULL),
('Cerradura Garaje', 'lock', 'Garaje', false, NULL, NULL, NULL),
('Termostato Sala', 'thermostat', 'Sala de estar', true, NULL, 21, 22),
('Sensor Movimiento Entrada', 'motion_sensor', 'Entrada', true, NULL, NULL, NULL),
('Sensor Movimiento Pasillo', 'motion_sensor', 'Pasillo', true, NULL, NULL, NULL),
('Cámara Entrada', 'camera', 'Entrada principal', true, NULL, NULL, NULL),
('Cámara Garaje', 'camera', 'Garaje', true, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAR DATOS INSERTADOS
-- ============================================

-- Mostrar dispositivos
SELECT id, name, type, location, status FROM devices;

-- Mostrar logs (si existen)
SELECT id, device_id, action, created_at FROM activity_logs LIMIT 10;
