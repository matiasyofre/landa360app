import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { Rol, CATALOGO_FUNCIONES } from '../types/rbac';
import { TenantRecord, rbacService } from '../services/tenantRbacService';

export interface UserSession {
  id: string;
  email: string;
  nombreCompleto: string;
}

interface AuthContextType {
  user: UserSession | null;
  tenant: TenantRecord | null;
  roles: Rol[];
  rolActivo: Rol | null;
  funcionesActivas: string[];
  esAdmin: boolean;
  puedeVerPrecios: boolean;
  isLoading: boolean;
  setUser: (user: UserSession | null) => void;
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
  // Inicializa en null para forzar la pantalla de Login siempre si no hay sesión real de Supabase
  const [user, setUser] = useState<UserSession | null>(null);

  const [tenant, setTenantState] = useState<TenantRecord | null>(() => {
    const saved = localStorage.getItem('campo360_active_tenant');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolActivoId, setRolActivoId] = useState<string>('rol_dueno');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Escuchar sesión en vivo de Supabase Auth
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser: UserSession = {
            id: session.user.id,
            email: session.user.email || '',
            nombreCompleto: session.user.user_metadata?.nombre_completo || session.user.email?.split('@')[0] || 'Usuario'
          };
          setUser(authUser);
        } else {
          // Si no hay sesión real activa en Supabase, forzar null y limpiar almacenamiento previo
          setUser(null);
          localStorage.removeItem('campo360_active_user');
        }
      } catch (err) {
        console.warn('Error al verificar sesión de Supabase:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const authUser: UserSession = {
          id: session.user.id,
          email: session.user.email || '',
          nombreCompleto: session.user.user_metadata?.nombre_completo || session.user.email?.split('@')[0] || 'Usuario'
        };
        setUser(authUser);
        localStorage.setItem('campo360_active_user', JSON.stringify(authUser));
      } else if (!localStorage.getItem('campo360_active_user')) {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Persistir usuario activo
  useEffect(() => {
    if (user) {
      localStorage.setItem('campo360_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('campo360_active_user');
    }
  }, [user]);

  // Inicializar o sincronizar roles del tenant
  const recargarRoles = async () => {
    if (!tenant) return;
    try {
      const dbRoles = await rbacService.obtenerRoles(tenant.id);
      if (dbRoles.length > 0) {
        setRoles(dbRoles);
      } else {
        setRoles(ROLES_PREDETERMINADOS(tenant.id));
      }
    } catch {
      setRoles(ROLES_PREDETERMINADOS(tenant.id));
    }
  };

  useEffect(() => {
    if (tenant) {
      localStorage.setItem('campo360_active_tenant', JSON.stringify(tenant));
      recargarRoles();
    }
  }, [tenant]);

  const setTenant = (nuevoTenant: TenantRecord) => {
    setTenantState(nuevoTenant);
  };

  const rolActivo = roles.find((r) => r.id === rolActivoId) || roles[0] || null;
  const funcionesActivas = rolActivo ? rolActivo.funcionesIds : [];
  const esAdmin = Boolean(rolActivo?.id === 'rol_dueno' || user?.email?.includes('dueno') || user?.email?.includes('admin'));
  
  // FN-1.3: Matriz de Privacidad Estricta
  const puedeVerPrecios = Boolean(esAdmin || funcionesActivas.includes('fn_1_3_privacidad_precios'));

  const cambiarRolActivo = (rolId: string) => {
    setRolActivoId(rolId);
  };

  const crearNuevoRol = async (nombre: string, descripcion: string, funcionesIds: string[]): Promise<Rol | null> => {
    if (!tenant) return null;
    
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

    setRoles((prev) =>
      prev.map((r) => (r.id === rolId ? { ...r, funcionesIds } : r))
    );

    return await rbacService.actualizarFuncionesDeRol(tenant.id, rolId, funcionesIds);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTenantState(null);
    localStorage.removeItem('campo360_active_user');
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
        setUser,
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
