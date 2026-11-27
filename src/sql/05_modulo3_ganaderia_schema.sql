-- ==============================================================================
-- LANDA360: MÓDULO 3 - GANADERÍA & RFID
-- Tablas maestras parametrizables, animales, potreros, pesadas, sanidad y costos
-- Con aislamiento multi-tenant RLS y auditoría.
-- ==============================================================================

-- 1. MAESTRO PARAMETRIZABLE: Categorías Ganaderas
CREATE TABLE IF NOT EXISTS ganaderia_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    sexo VARCHAR(20) NOT NULL CHECK (sexo IN ('Macho', 'Hembra', 'Indefinido')),
    factor_ev NUMERIC(5,2) NOT NULL DEFAULT 1.00, -- Factor Equivalente Vaca
    peso_referencia_kg NUMERIC(7,2) DEFAULT 400.0,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MAESTRO PARAMETRIZABLE: Rodeos / Tropas
CREATE TABLE IF NOT EXISTS ganaderia_rodeos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    finalidad VARCHAR(50) NOT NULL DEFAULT 'Cría' CHECK (finalidad IN ('Cría', 'Recría', 'Invernada / Engorde', 'Feedlot', 'Cabaña', 'Tambo')),
    color_identificador VARCHAR(20) DEFAULT '#536747',
    observaciones TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MAESTRO PARAMETRIZABLE: Potreros Ganaderos
CREATE TABLE IF NOT EXISTS ganaderia_potreros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    superficie_ha NUMERIC(8,2) NOT NULL CHECK (superficie_ha > 0),
    recurso_forrajero VARCHAR(100) DEFAULT 'Campo Natural',
    receptividad_objetivo_ev_ha NUMERIC(5,2) DEFAULT 0.80,
    dias_descanso_actual INTEGER DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MAESTRO PARAMETRIZABLE: Razas
CREATE TABLE IF NOT EXISTS ganaderia_razas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MAESTRO PARAMETRIZABLE: Fármacos y Sanidad
CREATE TABLE IF NOT EXISTS ganaderia_farmacos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nombre_comercial VARCHAR(150) NOT NULL,
    principio_activo VARCHAR(150),
    tipo VARCHAR(50) NOT NULL DEFAULT 'Vacuna' CHECK (tipo IN ('Vacuna', 'Antiparasitario', 'Antibiótico', 'Vitamínico / Mineral', 'Otro')),
    dias_carencia_faena INTEGER DEFAULT 0,
    dosis_sugerida VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Animales (Registro individual con trazabilidad)
CREATE TABLE IF NOT EXISTS ganaderia_animales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    caravana_rfid VARCHAR(50) UNIQUE, -- Chip RFID ISO 11784/11785 (15 dígitos o hexadecimal)
    caravana_visual VARCHAR(50) NOT NULL, -- Caravana tipo tarjeta o botón visual
    categoria_id UUID REFERENCES ganaderia_categorias(id) ON DELETE SET NULL,
    rodeo_id UUID REFERENCES ganaderia_rodeos(id) ON DELETE SET NULL,
    potrero_id UUID REFERENCES ganaderia_potreros(id) ON DELETE SET NULL,
    raza VARCHAR(100) DEFAULT 'Angus',
    sexo VARCHAR(20) NOT NULL CHECK (sexo IN ('Macho', 'Hembra', 'Indefinido')),
    fecha_nacimiento DATE,
    peso_actual_kg NUMERIC(7,2) DEFAULT 0.0,
    fecha_ultima_pesada DATE,
    gdp_historica_kg_dia NUMERIC(5,3) DEFAULT 0.000,
    estado VARCHAR(30) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Vendido', 'Muerto', 'Faena Consumo', 'Trasladado')),
    origen VARCHAR(50) DEFAULT 'Propio (Nacido)' CHECK (origen IN ('Propio (Nacido)', 'Compra', 'Capitalización')),
    madre_caravana VARCHAR(50),
    padre_caravana VARCHAR(50),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Movimientos de Hacienda entre Potreros y Rodeos (FN-3.3)
CREATE TABLE IF NOT EXISTS ganaderia_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rodeo_id UUID REFERENCES ganaderia_rodeos(id) ON DELETE CASCADE,
    potrero_origen_id UUID REFERENCES ganaderia_potreros(id) ON DELETE SET NULL,
    potrero_destino_id UUID REFERENCES ganaderia_potreros(id) ON DELETE SET NULL,
    cantidad_cabezas INTEGER NOT NULL CHECK (cantidad_cabezas > 0),
    motivo VARCHAR(100) DEFAULT 'Rotación de pasturas' CHECK (motivo IN ('Rotación de pasturas', 'Encierre a corral', 'Control de manga / Balanza', 'Sanitario', 'Climático / Emergencia')),
    responsable VARCHAR(150),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Pesadas Periódicas y Ganancia Diaria de Peso (GDP) (FN-3.6)
CREATE TABLE IF NOT EXISTS ganaderia_pesadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    animal_id UUID REFERENCES ganaderia_animales(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    peso_kg NUMERIC(7,2) NOT NULL CHECK (peso_kg > 0),
    peso_anterior_kg NUMERIC(7,2),
    dias_transcurridos INTEGER,
    gdp_kg_dia NUMERIC(5,3), -- (peso_kg - peso_anterior_kg) / dias_transcurridos
    origen_pesada VARCHAR(50) DEFAULT 'Balanza Electrónica Manga' CHECK (origen_pesada IN ('Balanza Electrónica Manga', 'Bastón RFID Tru-Test', 'Manual / Ocular')),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Eventos Sanitarios y Vacunaciones (FN-3.8)
CREATE TABLE IF NOT EXISTS ganaderia_eventos_sanitarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    fecha DATE NOT NULL,
    farmaco_id UUID REFERENCES ganaderia_farmacos(id) ON DELETE SET NULL,
    rodeo_id UUID REFERENCES ganaderia_rodeos(id) ON DELETE SET NULL,
    potrero_id UUID REFERENCES ganaderia_potreros(id) ON DELETE SET NULL,
    animal_id UUID REFERENCES ganaderia_animales(id) ON DELETE SET NULL, -- Null si fue en lote
    cantidad_animales INTEGER DEFAULT 1,
    dosis_aplicada VARCHAR(100),
    fecha_fin_carencia DATE,
    requiere_refuerzo BOOLEAN DEFAULT false,
    fecha_refuerzo DATE,
    veterinario VARCHAR(150),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Costos Ganaderos Directos (FN-3.9 - Protegido por FN-1.3)
CREATE TABLE IF NOT EXISTS ganaderia_costos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    fecha DATE NOT NULL,
    rodeo_id UUID REFERENCES ganaderia_rodeos(id) ON DELETE SET NULL,
    rubro VARCHAR(50) NOT NULL CHECK (rubro IN ('Alimentación y Pasturas', 'Sanidad y Veterinaria', 'Manga y Personal', 'Fletes y Guías', 'Otros')),
    monto_usd NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    monto_ars NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    descripcion TEXT NOT NULL,
    comprobante_nro VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Habilitación en todas las tablas
ALTER TABLE ganaderia_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganaderia_rodeos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganaderia_potreros ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganaderia_razas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganaderia_farmacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganaderia_animales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganaderia_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganaderia_pesadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganaderia_eventos_sanitarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganaderia_costos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS genéricas para tenant_id
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'ganaderia_%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_tenant_policy ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY %I_tenant_policy ON %I FOR ALL USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid)', tbl, tbl);
    END LOOP;
END $$;
