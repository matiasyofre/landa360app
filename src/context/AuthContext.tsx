import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { Rol, CATALOGO_FUNCIONES } from '../types/rbac';
import { TenantRecord, rbacService } from '../services/tenantRbacService';

interface AuthContextType {
  user: { id: string; email: string; nombreCompleto: string } | null;
  tenant: TenantRecord | null;
  roles: Rol[];
  rolActivo: Rol | null;
  funcionesActivas: string[];
  esAdmin: boolean;
  puedeVerPrecios: boolean;
  isLoading: boolean;
  setTenant: (tenant: TenantRecord) => void;
  cambiarRolActivo: (rolId: string) => void;
  recargarRoles: () => Promise<void>;
  crearNuevoRol: (nombre: string, descripcion: string, funcionesIds: string[]) => Promise<Rol | null>;
  actualizarFuncionesRol: (rolId: string, funcionesIds: string[]) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Roles por defecto del sistema (Escenario A)
const ROLES_PREDETERMINADOS = (tenantId: string): Rol[] => [
  {
    id: 'rol_dueno',
    tenantId,
    nombre: 'Dueño / Administrador',
    descripcion: 'Acceso irrestricto operativo, económico y de auditoría',
    esSistema: true,
    funcionesIds: CATALOGO_FUNCIONES.map((f) => f.id)
  },
  {
    id: 'rol_agronomo',
    tenantId,
    nombre: 'Ingeniero Agrónomo',
    descripcion: 'Gestión de lotes, recetas agronómicas, prescripciones y órdenes de labor',
    esSistema: true,
    funcionesIds: [
      'fn_1_4_auditoria',
      'fn_2_1_catastro_lotes',
      'fn_2_2_importador_kml',
      'fn_2_3_receta_labor',
      'fn_2_4_emision_ot',
      'fn_2_5_cierre_labor',
      'fn_4_1_stock_galpon',
      'fn_6_1_pluviometro',
      'fn_7_1_dashboard_ejecutivo'
    ]
  },
  {
    id: 'rol_capataz',
    tenantId,
    nombre: 'Capataz / Operario',
    descripcion: 'Registro físico a campo: labores, pesadas de manga y lluvias. Costos y finanzas 100% ocultos',
    esSistema: true,
    funcionesIds: [
      'fn_2_5_cierre_labor',
      'fn_3_1_inventario_hacienda',
      'fn_3_2_potreros_ev',
      'fn_3_3_pesadas_rfid',
      'fn_4_1_stock_galpon',
      'fn_6_1_pluviometro',
      'fn_6_2_maquinaria_service'
    ]
  },
  {
    id: 'rol_contador',
    tenantId,
    nombre: 'Contador / Administración',
    descripcion: 'Finanzas bimonetarias, tesorería, escaneo de facturas OCR y valuación PPP de stock',
    esSistema: true,
    funcionesIds: [
      'fn_1_3_privacidad_precios',
      'fn_4_1_stock_ppp',
      'fn_5_1_caja_bimonetaria',
      'fn_5_2_ocr_facturas',
      'fn_5_3_cheques_cartera',
      'fn_7_2_resultado_operativo'
    ]
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; nombreCompleto: string } | null>({
    id: 'usr_demo_admin',
    email: 'administrador@campo360.com',
    nombreCompleto: 'Propietario Establecimiento'
  });

  const [tenant, setTenantState] = useState<TenantRecord | null>(() => {
    const saved = localStorage.getItem('campo360_active_tenant');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolActivoId, setRolActivoId] = useState<string>('rol_dueno');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar o sincronizar roles del tenant
  const recargarRoles = async () => {
    if (!tenant) return;
    try {
      const dbRoles = await rbacService.obtenerRoles(tenant.id);
      if (dbRoles.length > 0) {
        setRoles(dbRoles);
      } else {
        // Si aún no existen en DB, usamos los defaults
        setRoles(ROLES_PREDETERMINADOS(tenant.id));
      }
    } catch {
      setRoles(ROLES_PREDETERMINADOS(tenant.id));
    }
  };

  useEffect(() => {
    if (tenant) {
      localStorage.setItem('campo360_active_tenant', JSON.stringify(tenant));
      recargarRoles().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [tenant]);

  const setTenant = (nuevoTenant: TenantRecord) => {
    setTenantState(nuevoTenant);
  };

  const rolActivo = roles.find((r) => r.id === rolActivoId) || roles[0] || null;
  const funcionesActivas = rolActivo ? rolActivo.funcionesIds : [];
  const esAdmin = rolActivo?.id === 'rol_dueno' || user?.email === 'administrador@campo360.com';
  
  // FN-1.3: Matriz de Privacidad Estricta
  const puedeVerPrecios = esAdmin || funcionesActivas.includes('fn_1_3_privacidad_precios');

  const cambiarRolActivo = (rolId: string) => {
    setRolActivoId(rolId);
  };

  const crearNuevoRol = async (nombre: string, descripcion: string, funcionesIds: string[]): Promise<Rol | null> => {
    if (!tenant) return null;
    
    // 1. Guardar en Supabase
    const dbRol = await rbacService.crearRol(tenant.id, nombre, descripcion, funcionesIds);
    
    const nuevoRol: Rol = dbRol || {
      id: `rol_${Date.now()}`,
      tenantId: tenant.id,
      nombre,
      descripcion,
      esSistema: false,
      funcionesIds
    };

    setRoles((prev) => [...prev, nuevoRol]);
    setRolActivoId(nuevoRol.id);
    return nuevoRol;
  };

  const actualizarFuncionesRol = async (rolId: string, funcionesIds: string[]): Promise<boolean> => {
    if (!tenant) return false;

    // Actualizar localmente de inmediato para UX fluida
    setRoles((prev) =>
      prev.map((r) => (r.id === rolId ? { ...r, funcionesIds } : r))
    );

    // Persistir en Supabase
    return await rbacService.actualizarFuncionesDeRol(tenant.id, rolId, funcionesIds);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTenantState(null);
    localStorage.removeItem('campo360_active_tenant');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        roles,
        rolActivo,
        funcionesActivas,
        esAdmin,
        puedeVerPrecios,
        isLoading,
        setTenant,
        cambiarRolActivo,
        recargarRoles,
        crearNuevoRol,
        actualizarFuncionesRol,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
}
