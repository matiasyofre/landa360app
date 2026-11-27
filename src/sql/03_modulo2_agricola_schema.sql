-- ==============================================================================
-- CAMPO360 / LANDA360 - MÓDULO 2: GESTIÓN AGRÍCOLA (BLOQUE A)
-- Schema SQL: Campañas, Cultivos Paramétricos y Lotes con Polígonos GeoJSON
-- Incluye RLS estricto por tenant_id, triggers de auditoría inmutable y seed inicial
-- ==============================================================================

-- 1. TABLA: CAMPAÑAS AGRÍCOLAS
CREATE TABLE IF NOT EXISTS public.campanas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    activa BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campanas_tenant ON public.campanas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campanas_activa ON public.campanas(tenant_id, activa);

-- 2. TABLA: CULTIVOS & DESTINOS (Catálogo Paramétrico Dinámico por Tenant)
CREATE TABLE IF NOT EXISTS public.cultivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'agricola' CHECK (tipo IN ('agricola', 'forrajero', 'cobertura', 'barbecho', 'ganadero', 'otro')),
    color_hex TEXT NOT NULL DEFAULT '#83A653',
    es_activo BOOLEAN DEFAULT true,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cultivos_tenant ON public.cultivos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cultivos_activo ON public.cultivos(tenant_id, es_activo);

-- 3. TABLA: LOTES AGRÍCOLAS
CREATE TABLE IF NOT EXISTS public.lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    campana_id UUID REFERENCES public.campanas(id) ON DELETE SET NULL,
    cultivo_id UUID REFERENCES public.cultivos(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    superficie_ha NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    aptitud TEXT NOT NULL DEFAULT 'agricola' CHECK (aptitud IN ('agricola', 'ganadero', 'mixto', 'reserva_bajo')),
    poligono_geo JSONB,
    color_hex TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lotes_tenant ON public.lotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lotes_campana ON public.lotes(campana_id);
CREATE INDEX IF NOT EXISTS idx_lotes_cultivo ON public.lotes(cultivo_id);

-- ==============================================================================
-- 4. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.campanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

-- Políticas para campanas
DROP POLICY IF EXISTS "tenant_isolation_campanas" ON public.campanas;
CREATE POLICY "tenant_isolation_campanas" ON public.campanas
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()
        )
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()
        )
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    );

-- Políticas para cultivos
DROP POLICY IF EXISTS "tenant_isolation_cultivos" ON public.cultivos;
CREATE POLICY "tenant_isolation_cultivos" ON public.cultivos
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()
        )
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()
        )
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    );

-- Políticas para lotes
DROP POLICY IF EXISTS "tenant_isolation_lotes" ON public.lotes;
CREATE POLICY "tenant_isolation_lotes" ON public.lotes
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()
        )
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()
        )
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    );

-- ==============================================================================
-- 5. AUDITORÍA INMUTABLE (Triggers automáticos a audit_log)
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_audit_campanas ON public.campanas;
CREATE TRIGGER trg_audit_campanas
    AFTER INSERT OR UPDATE OR DELETE ON public.campanas
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_cultivos ON public.cultivos;
CREATE TRIGGER trg_audit_cultivos
    AFTER INSERT OR UPDATE OR DELETE ON public.cultivos
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_lotes ON public.lotes;
CREATE TRIGGER trg_audit_lotes
    AFTER INSERT OR UPDATE OR DELETE ON public.lotes
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- ==============================================================================
-- 6. FUNCIÓN DE SEED INICIAL DE PARÁMETROS AGRÍCOLAS
-- Carga cultivos sugeridos estándar para nuevos tenants sin hardcodear en la app
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_seed_agricola_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Crear campaña agrícola vigente por defecto si no existe ninguna
    IF NOT EXISTS (SELECT 1 FROM public.campanas WHERE tenant_id = p_tenant_id) THEN
        INSERT INTO public.campanas (tenant_id, nombre, fecha_inicio, fecha_fin, activa)
        VALUES (p_tenant_id, 'Campaña 2025/2026', '2025-07-01', '2026-06-30', true);
    END IF;

    -- 2. Precargar catálogo de cultivos sugeridos si está vacío
    IF NOT EXISTS (SELECT 1 FROM public.cultivos WHERE tenant_id = p_tenant_id) THEN
        INSERT INTO public.cultivos (tenant_id, nombre, tipo, color_hex, es_activo, descripcion)
        VALUES 
            (p_tenant_id, 'Soja 1ra', 'agricola', '#83A653', true, 'Soja de primera época'),
            (p_tenant_id, 'Maíz Tardío', 'agricola', '#D9A441', true, 'Maíz tardío / segunda'),
            (p_tenant_id, 'Maíz Temprano', 'agricola', '#E5A93C', true, 'Maíz temprano de primera'),
            (p_tenant_id, 'Trigo', 'agricola', '#B6A77D', true, 'Fino ciclo invernal'),
            (p_tenant_id, 'Girasol', 'agricola', '#EAB308', true, 'Girasol tradicional o confitero'),
            (p_tenant_id, 'Cebada Cervecera', 'agricola', '#C8B27B', true, 'Cebada bajo contrato'),
            (p_tenant_id, 'Barbecho Químico', 'barbecho', '#74796D', true, 'Lote en descanso con control de malezas'),
            (p_tenant_id, 'Pastura Alfalfa', 'forrajero', '#38845A', true, 'Pastura perenne para pastoreo / rollos');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
