import { supabase } from '../config/supabase';
import { Rol } from '../types/rbac';

export interface TenantInput {
  cuit: string;
  razonSocial: string;
  nombreFantasia: string;
  localidad?: string;
  hectareasTotales?: number;
  perfilProductivo?: 'agricola' | 'ganadero' | 'mixto';
}

export interface TenantRecord extends TenantInput {
  id: string;
  activo: boolean;
  createdAt: string;
}

export const tenantService = {
  /**
   * FN-1.1 & FN-1.6: Registra un nuevo establecimiento / tenant en Supabase
   */
  async crearTenant(input: TenantInput): Promise<{ data: TenantRecord | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          cuit: input.cuit.trim(),
          razon_social: input.razonSocial.trim(),
          nombre_fantasia: input.nombreFantasia.trim(),
          plan: 'escenario_a',
          activo: true
        })
        .select()
        .single();

      if (error) throw error;

      const tenant: TenantRecord = {
        id: data.id,
        cuit: data.cuit,
        razonSocial: data.razon_social,
        nombreFantasia: data.nombre_fantasia,
        activo: data.activo,
        createdAt: data.created_at,
        hectareasTotales: input.hectareasTotales,
        perfilProductivo: input.perfilProductivo
      };

      // Registrar en audit_log inmutable
      await supabase.from('audit_log').insert({
        tenant_id: tenant.id,
        tabla_afectada: 'tenants',
        registro_id: tenant.id,
        accion: 'INSERT',
        valores_nuevos: tenant
      });

      return { data: tenant, error: null };
    } catch (err: unknown) {
      console.error('Error al crear tenant:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Obtiene los datos del establecimiento actual
   */
  async obtenerTenant(tenantId: string): Promise<TenantRecord | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        cuit: data.cuit,
        razonSocial: data.razon_social,
        nombreFantasia: data.nombre_fantasia,
        activo: data.activo,
        createdAt: data.created_at
      };
    } catch {
      return null;
    }
  }
};

export const rbacService = {
  /**
   * Obtiene los roles del tenant con sus funciones asignadas
   */
  async obtenerRoles(tenantId: string): Promise<Rol[]> {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, tenant_id, nombre, descripcion, es_sistema')
        .eq('tenant_id', tenantId);

      if (rolesError || !rolesData) return [];

      const { data: rfData } = await supabase
        .from('rol_funciones')
        .select('rol_id, funcion_id')
        .eq('tenant_id', tenantId);

      const funcionesMap: Record<string, string[]> = {};
      (rfData || []).forEach((rf) => {
        if (!funcionesMap[rf.rol_id]) funcionesMap[rf.rol_id] = [];
        funcionesMap[rf.rol_id].push(rf.funcion_id);
      });

      return rolesData.map((r) => ({
        id: r.id,
        tenantId: r.tenant_id,
        nombre: r.nombre,
        descripcion: r.descripcion,
        esSistema: r.es_sistema,
        funcionesIds: funcionesMap[r.id] || []
      }));
    } catch (err) {
      console.error('Error al obtener roles:', err);
      return [];
    }
  },

  /**
   * FN-1.2: Crea un nuevo rol personalizado para el tenant
   */
  async crearRol(tenantId: string, nombre: string, descripcion: string, funcionesIds: string[]): Promise<Rol | null> {
    try {
      const { data: rol, error: rolError } = await supabase
        .from('roles')
        .insert({
          tenant_id: tenantId,
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          es_sistema: false
        })
        .select()
        .single();

      if (rolError || !rol) throw rolError;

      // Asignar funciones
      if (funcionesIds.length > 0) {
        const rows = funcionesIds.map((fId) => ({
          rol_id: rol.id,
          funcion_id: fId,
          tenant_id: tenantId
        }));
        await supabase.from('rol_funciones').insert(rows);
      }

      // Bitácora inmutable
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        tabla_afectada: 'roles',
        registro_id: rol.id,
        accion: 'INSERT',
        valores_nuevos: { nombre, descripcion, funciones: funcionesIds }
      });

      return {
        id: rol.id,
        tenantId: rol.tenant_id,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        esSistema: false,
        funcionesIds
      };
    } catch (err) {
      console.error('Error al crear rol:', err);
      return null;
    }
  },

  /**
   * FN-1.2: Actualiza las funciones asignadas a un rol
   */
  async actualizarFuncionesDeRol(tenantId: string, rolId: string, nuevasFuncionesIds: string[]): Promise<boolean> {
    try {
      // 1. Eliminar asignaciones previas
      await supabase
        .from('rol_funciones')
        .delete()
        .eq('rol_id', rolId)
        .eq('tenant_id', tenantId);

      // 2. Insertar nuevas
      if (nuevasFuncionesIds.length > 0) {
        const rows = nuevasFuncionesIds.map((fId) => ({
          rol_id: rolId,
          funcion_id: fId,
          tenant_id: tenantId
        }));
        const { error } = await supabase.from('rol_funciones').insert(rows);
        if (error) throw error;
      }

      // 3. Auditoría inmutable
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        tabla_afectada: 'rol_funciones',
        registro_id: rolId,
        accion: 'UPDATE',
        valores_nuevos: { funciones: nuevasFuncionesIds }
      });

      return true;
    } catch (err) {
      console.error('Error al actualizar funciones de rol:', err);
      return false;
    }
  }
};
