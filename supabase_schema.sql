-- Tabla de Pacientes
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  birth_date DATE,
  age INTEGER,
  phone TEXT,
  email TEXT,
  occupation TEXT,
  consultation_reason TEXT,
  medical_history TEXT,
  medical_alerts JSONB DEFAULT '[]'::jsonb,
  questionnaire JSONB DEFAULT '{}'::jsonb,
  deep_history JSONB DEFAULT '{}'::jsonb,
  treatment_status TEXT DEFAULT 'Diagnóstico',
  status TEXT DEFAULT 'Activo',
  readable_id TEXT,
  digital_seal TEXT,
  sex TEXT,
  address TEXT,
  curp TEXT,
  rfc TEXT,
  last_visit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);

-- Tabla de Notas de Evolución (Expediente Clínico)
CREATE TABLE clinical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Odontogramas (Estado de los dientes)
CREATE TABLE odontograms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  teeth_data JSONB NOT NULL, -- Almacena un objeto con el estado de los 32 dientes
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Archivos/Radiografías
CREATE TABLE patient_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
