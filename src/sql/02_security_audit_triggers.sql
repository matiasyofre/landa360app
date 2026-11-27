-- ==============================================================================
-- BLINDAJE DE SEGURIDAD 2: TRIGGERS AUTOMÁTICOS DE AUDITORÍA EN POSTGRESQL (FN-1.4)
-- Garantiza que cualquier cambio a nivel base de datos quede registrado de forma 
-- autónoma e inmutable, sin depender de llamadas manuales desde el frontend.
-- ==============================================================================

-- 1. Función Universal de Auditoría
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_record_id UUID;
    v_old_values JSONB := NULL;
    v_new_values JSONB := NULL;
BEGIN
    -- Determinar tenant_id y record_id según la operación
    IF TG_OP = 'DELETE' THEN
        v_record_id := CASE WHEN TG_TABLE_NAME = 'tenants' THEN OLD.id ELSE NULL END;
        v_tenant_id := CASE 
            WHEN TG_TABLE_NAME = 'tenants' THEN OLD.id 
            WHEN TG_TABLE_NAME = 'audit_log' THEN OLD.tenant_id
            ELSE OLD.tenant_id 
        END;
        v_old_values := to_jsonb(OLD);
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := CASE WHEN TG_TABLE_NAME = 'tenants' THEN NEW.id ELSE NULL END;
        v_tenant_id := CASE 
            WHEN TG_TABLE_NAME = 'tenants' THEN NEW.id 
            ELSE NEW.tenant_id 
        END;
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        v_record_id := CASE WHEN TG_TABLE_NAME = 'tenants' THEN NEW.id ELSE NULL END;
        v_tenant_id := CASE 
            WHEN TG_TABLE_NAME = 'tenants' THEN NEW.id 
            ELSE NEW.tenant_id 
        END;
        v_new_values := to_jsonb(NEW);
    END IF;

    -- Insertar en la bitácora inmutable audit_log
    INSERT INTO public.audit_log (
        tenant_id,
        user_id,
        tabla_afectada,
        registro_id,
        accion,
        valores_anteriores,
        valores_nuevos,
        created_at
    ) VALUES (
        v_tenant_id,
        auth.uid(),
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        v_old_values,
        v_new_values,
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Activar Triggers Automáticos en Tablas Sensibles
DROP TRIGGER IF EXISTS trg_audit_tenants ON public.tenants;
CREATE TRIGGER trg_audit_tenants
    AFTER INSERT OR UPDATE OR DELETE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_roles ON public.roles;
CREATE TRIGGER trg_audit_roles
    AFTER INSERT OR UPDATE OR DELETE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_rol_funciones ON public.rol_funciones;
CREATE TRIGGER trg_audit_rol_funciones
    AFTER INSERT OR UPDATE OR DELETE ON public.rol_funciones
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_usuarios ON public.usuarios;
CREATE TRIGGER trg_audit_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
