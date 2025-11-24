-- Crear tabla de dispositivos
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('light', 'lock', 'thermostat', 'motion', 'camera')),
  status JSONB DEFAULT '{"power": false}',
  ip_address VARCHAR(15),
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de histórico de cambios
CREATE TABLE device_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_device_logs_device_id ON device_logs(device_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para devices
CREATE POLICY "Users can view their own devices"
  ON devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON devices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON devices FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas de seguridad para device_logs
CREATE POLICY "Users can view logs of their devices"
  ON device_logs FOR SELECT
  USING (
    device_id IN (SELECT id FROM devices WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert logs for their devices"
  ON device_logs FOR INSERT
  WITH CHECK (
    device_id IN (SELECT id FROM devices WHERE user_id = auth.uid())
  );
