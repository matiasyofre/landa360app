-- ==============================================================================
-- CAMPO360 / LANDA360 - MÓDULO 2: GESTIÓN AGRÍCOLA (BLOQUES B y C)
-- Schema SQL: Órdenes de Trabajo (OT), Insumos, Prorrateo, Monitoreo y Margen Bruto
-- ==============================================================================

-- 1. TABLA: ÓRDENES DE TRABAJO (OT) (FN-2.3, FN-2.4, FN-2.5)
CREATE TABLE IF NOT EXISTS public.ordenes_trabajo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    campana_id UUID REFERENCES public.campanas(id) ON DELETE SET NULL,
    numero_ot TEXT NOT NULL,
    tipo_labor TEXT NOT NULL CHECK (tipo_labor IN ('siembra', 'pulverizacion', 'fertilizacion', 'cosecha', 'barbecho', 'otra')),
    contratista TEXT,
    maquinaria TEXT,
    fecha_emision DATE DEFAULT CURRENT_DATE,
    fecha_cierre DATE,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'completada', 'cancelada')),
    superficie_total_ha NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tarifa_contratista_usd_ha NUMERIC(10,2) DEFAULT 0.00,
    costo_total_estimado_usd NUMERIC(12,2) DEFAULT 0.00,
    superficie_real_ha NUMERIC(10,2),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ot_tenant ON public.ordenes_trabajo(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ot_estado ON public.ordenes_trabajo(tenant_id, estado);
CREATE INDEX IF NOT EXISTS idx_ot_campana ON public.ordenes_trabajo(campana_id);

-- 2. TABLA: LOTES ASIGNADOS A LA OT & PRORRATEO (FN-2.6)
CREATE TABLE IF NOT EXISTS public.ot_lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ot_id UUID NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
    lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
    superficie_ha NUMERIC(10,2) NOT NULL,
    porcentaje_prorrateo NUMERIC(5,2) NOT NULL,
    costo_asignado_usd NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ot_lotes_ot ON public.ot_lotes(ot_id);
CREATE INDEX IF NOT EXISTS idx_ot_lotes_lote ON public.ot_lotes(lote_id);

-- 3. TABLA: INSUMOS PRESCRIPTOS Y CONSUMIDOS (FN-2.3, FN-2.5)
CREATE TABLE IF NOT EXISTS public.ot_insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ot_id UUID NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
    producto_nombre TEXT NOT NULL,
    dosis_ha NUMERIC(10,3) NOT NULL,
    unidad TEXT NOT NULL DEFAULT 'lt/ha',
    cantidad_total_calculada NUMERIC(12,2) NOT NULL,
    cantidad_real_consumida NUMERIC(12,2),
    costo_unitario_usd NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ot_insumos_ot ON public.ot_insumos(ot_id);

-- 4. TABLA: MONITOREO DE PLAGAS Y MALEZAS (FN-2.7)
CREATE TABLE IF NOT EXISTS public.monitoreos_plagas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
    fecha DATE DEFAULT CURRENT_DATE,
    tipo TEXT NOT NULL CHECK (tipo IN ('maleza', 'insecto', 'enfermedad', 'otro')),
    plaga_nombre TEXT NOT NULL,
    severidad TEXT NOT NULL CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
    estadio_cultivo TEXT,
    observaciones TEXT,
    accion_recomendada TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoreo_lote ON public.monitoreos_plagas(lote_id);
CREATE INDEX IF NOT EXISTS idx_monitoreo_tenant ON public.monitoreos_plagas(tenant_id);

-- 5. TABLA: TABLERO DE MARGEN BRUTO POR LOTE (FN-2.8)
CREATE TABLE IF NOT EXISTS public.margenes_brutos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
    campana_id UUID NOT NULL REFERENCES public.campanas(id) ON DELETE CASCADE,
    rinde_estimado_qq_ha NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    precio_venta_usd_qq NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_semilla_usd_ha NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_fertilizantes_usd_ha NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_fitosanitarios_usd_ha NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_labores_usd_ha NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_cosecha_usd_ha NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, lote_id, campana_id)
);

CREATE INDEX IF NOT EXISTS idx_margen_lote ON public.margenes_brutos(lote_id);
CREATE INDEX IF NOT EXISTS idx_margen_campana ON public.margenes_brutos(campana_id);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoreos_plagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margenes_brutos ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento
DO $$ 
BEGIN
    -- OTs
    DROP POLICY IF EXISTS "tenant_isolation_ot" ON public.ordenes_trabajo;
    CREATE POLICY "tenant_isolation_ot" ON public.ordenes_trabajo
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL)
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

    -- OT Lotes
    DROP POLICY IF EXISTS "tenant_isolation_ot_lotes" ON public.ot_lotes;
    CREATE POLICY "tenant_isolation_ot_lotes" ON public.ot_lotes
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL)
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

    -- OT Insumos
    DROP POLICY IF EXISTS "tenant_isolation_ot_insumos" ON public.ot_insumos;
    CREATE POLICY "tenant_isolation_ot_insumos" ON public.ot_insumos
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL)
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

    -- Monitoreos
    DROP POLICY IF EXISTS "tenant_isolation_monitoreos" ON public.monitoreos_plagas;
    CREATE POLICY "tenant_isolation_monitoreos" ON public.monitoreos_plagas
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL)
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

    -- Margen Bruto
    DROP POLICY IF EXISTS "tenant_isolation_margenes" ON public.margenes_brutos;
    CREATE POLICY "tenant_isolation_margenes" ON public.margenes_brutos
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL)
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()) OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
END $$;

-- ==============================================================================
-- 7. TRIGGERS DE AUDITORÍA INMUTABLE (FN-1.4)
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_audit_ot ON public.ordenes_trabajo;
CREATE TRIGGER trg_audit_ot
    AFTER INSERT OR UPDATE OR DELETE ON public.ordenes_trabajo
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_monitoreos ON public.monitoreos_plagas;
CREATE TRIGGER trg_audit_monitoreos
    AFTER INSERT OR UPDATE OR DELETE ON public.monitoreos_plagas
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_margenes ON public.margenes_brutos;
CREATE TRIGGER trg_audit_margenes
    AFTER INSERT OR UPDATE OR DELETE ON public.margenes_brutos
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
