import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './modules/m1_nucleo/AuthScreen';
import { OnboardingWizard } from './modules/m1_nucleo/OnboardingWizard';
import { ColaboradoresManager } from './modules/m1_nucleo/ColaboradoresManager';
import { RolesManager } from './modules/m1_nucleo/RolesManager';
import { AuditLogViewer } from './modules/m1_nucleo/AuditLogViewer';
import { ExportBackupButton } from './modules/m1_nucleo/ExportBackupButton';
import { CultivosParamManager } from './modules/m2_agricola/CultivosParamManager';
import { ModuloAgricolaHub } from './modules/m2_agricola/ModuloAgricolaHub';
import { LockScreen } from './modules/m1_nucleo/LockScreen';
import { useInactivityLock } from './hooks/useInactivityLock';
import { 
  Layers, 
  Building2, 
  Wifi, 
  ShieldCheck, 
  Users, 
  FileText, 
  Download, 
  RefreshCw,
  LogOut,
  User,
  Sparkles,
  Sprout,
  Tractor,
  Shield
} from 'lucide-react';

function DashboardView() {
  const { user, setUser, tenant, rolActivo, cambiarRolActivo, roles, logout } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [moduloActivo, setModuloActivo] = useState<'M1' | 'M2'>('M2');
  const [activeTab, setActiveTab] = useState<'colaboradores' | 'roles' | 'auditoria' | 'respaldo' | 'parametros_agricolas'>('colaboradores');
  
  // Blindaje Zero-Trust: Auto-Logout por inactividad a los 15 minutos
  const { isLocked, unlock } = useInactivityLock(15, Boolean(user && tenant));

  // 1. Si no está autenticado, muestra Pantalla de Login / Registro
  if (!user) {
    return (
      <AuthScreen 
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
        }} 
      />
    );
  }

  // 2. Bloqueo por inactividad
  if (isLocked) {
    return <LockScreen onUnlock={unlock} />;
  }

  // 3. Onboarding: si el usuario aún no configuró su campo
  if (!tenant || showWizard) {
    return (
      <div className="min-h-screen bg-campo-blanco p-4 sm:p-8 flex flex-col justify-center">
        <OnboardingWizard onComplete={() => setShowWizard(false)} />
      </div>
    );
  }

  // 4. Dashboard Principal
  return (
    <div className="min-h-screen bg-campo-blanco text-campo-texto flex flex-col font-sans">
      {/* Top Navbar en Verde Bosque Profundo */}
      <header className="bg-campo-bosque text-white shadow-md sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-campo-verde text-white flex items-center justify-center shrink-0 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Campo360</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-campo-verde/30 text-campo-arena border border-campo-verde/50 font-semibold">
                Módulo 1 &bull; Seguridad & RLS
              </span>
            </div>
            {/* Establecimiento activo */}
            <div className="flex items-center gap-2 text-[11px] text-campo-arena">
              <Building2 className="w-3 h-3 text-campo-verde" />
              <span className="text-white font-medium">{tenant.nombreFantasia}</span>
              <span className="font-mono text-campo-arena/80">CUIT: {tenant.cuit}</span>
            </div>
          </div>
        </div>

        {/* Simulador de Rol, Usuario y Acciones */}
        <div className="flex items-center gap-3">
          {/* Selector de Rol Activo */}
          <div className="hidden sm:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg border border-white/10 text-xs">
            <span className="text-campo-arena text-[11px]">Rol Activo:</span>
            <select
              value={rolActivo?.id || ''}
              onChange={(e) => cambiarRolActivo(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-campo-bosque text-white">
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Badge Usuario Logueado */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-white bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
            <User className="w-3.5 h-3.5 text-campo-verde" />
            <span className="truncate max-w-[130px]">{user.nombreCompleto}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-campo-verde/20 text-campo-arena border border-campo-verde/40">
            <Wifi className="w-3.5 h-3.5 text-campo-verde" />
            <span className="hidden md:inline">PWA Offline</span>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            title="Reconfigurar Campo (Asistente)"
            className="p-1.5 rounded-lg bg-white/10 text-campo-arena hover:text-white hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={logout}
            title="Cerrar Sesión Segura"
            className="p-1.5 rounded-lg bg-campo-error/20 text-red-200 hover:text-white hover:bg-campo-error transition-colors border border-campo-error/40"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {/* Selector Maestro de Módulos (Catálogo de Funcionalidades) */}
        <div className="flex items-center gap-2 bg-campo-card p-1.5 rounded-2xl border border-campo-borde shadow-sm overflow-x-auto">
          <button
            onClick={() => setModuloActivo('M1')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              moduloActivo === 'M1'
                ? 'bg-campo-bosque text-white shadow-sm'
                : 'text-campo-muted hover:text-campo-texto hover:bg-campo-blanco'
            }`}
          >
            <Shield className="w-4 h-4 text-campo-verde" />
            <span>M1: Seguridad & RLS (6)</span>
          </button>

          <button
            onClick={() => setModuloActivo('M2')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              moduloActivo === 'M2'
                ? 'bg-campo-bosque text-white shadow-sm ring-2 ring-campo-verde/50'
                : 'text-campo-muted hover:text-campo-texto hover:bg-campo-blanco'
            }`}
          >
            <Tractor className="w-4 h-4 text-campo-verde" />
            <span>M2: Gestión Agrícola & Lotes (8)</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-campo-verde text-white rounded font-bold">Activo</span>
          </button>

          <button
            onClick={() => setShowWizard(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-campo-oliva hover:text-campo-bosque bg-campo-card border border-campo-borde hover:bg-campo-arena transition-colors ml-auto flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-campo-verde" />
            <span>"Armá tu campo" (FN-1.6)</span>
          </button>
        </div>

        {/* ================================================================== */}
        {/* VISTAS DEL MÓDULO 2: GESTIÓN AGRÍCOLA (8 FUNCIONES COMPLETAS)      */}
        {/* ================================================================== */}
        {moduloActivo === 'M2' && <ModuloAgricolaHub />}

        {/* ================================================================== */}
        {/* VISTAS DEL MÓDULO 1: SEGURIDAD & RLS                               */}
        {/* ================================================================== */}
        {moduloActivo === 'M1' && (
          <div className="space-y-6">
            {/* Banner del Establecimiento M1 */}
            <div className="bg-campo-card p-6 rounded-2xl border border-campo-borde shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-campo-oliva uppercase tracking-wider">
                    M1: Núcleo del Sistema & Seguridad
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-campo-arena text-campo-bosque border border-campo-borde font-semibold">
                    Aislamiento RLS Activo
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-campo-texto tracking-tight">
                  Consola de Administración y Seguridad
                </h1>
                <p className="text-xs sm:text-sm text-campo-muted max-w-3xl leading-relaxed">
                  Gestión de colaboradores, roles dinámicos, permisos con privacidad estricta y bitácora de auditoría inmutable de {tenant.nombreFantasia}.
                </p>
              </div>

              {/* Quick Stats del Tenant */}
              <div className="flex items-center gap-3 self-start sm:self-auto text-xs font-mono bg-campo-arena p-3 rounded-xl border border-campo-borde">
                <div>
                  <span className="text-campo-muted block text-[10px] uppercase font-semibold">Superficie</span>
                  <span className="text-campo-texto font-bold text-sm">{tenant.hectareasTotales || 1250} ha</span>
                </div>
                <div className="border-l border-campo-borde pl-3">
                  <span className="text-campo-muted block text-[10px] uppercase font-semibold">Perfil</span>
                  <span className="text-campo-oliva font-bold text-sm capitalize">{tenant.perfilProductivo || 'Mixto'}</span>
                </div>
              </div>
            </div>

            {/* Pestañas de Navegación Oficiales del Módulo 1 */}
            <div className="flex items-center gap-2 border-b border-campo-borde pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('colaboradores')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'colaboradores'
                    ? 'bg-campo-verde text-white shadow-sm'
                    : 'bg-campo-card text-campo-muted hover:text-campo-texto border border-campo-borde'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Colaboradores (FN-1.2)</span>
              </button>

              <button
                onClick={() => setActiveTab('roles')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'roles'
                    ? 'bg-campo-verde text-white shadow-sm'
                    : 'bg-campo-card text-campo-muted hover:text-campo-texto border border-campo-borde'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Roles y Permisos (FN-1.2 & FN-1.3)</span>
              </button>

              <button
                onClick={() => setActiveTab('auditoria')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'auditoria'
                    ? 'bg-campo-verde text-white shadow-sm'
                    : 'bg-campo-card text-campo-muted hover:text-campo-texto border border-campo-borde'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Bitácora de Auditoría (FN-1.4)</span>
              </button>

              <button
                onClick={() => setActiveTab('respaldo')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'respaldo'
                    ? 'bg-campo-verde text-white shadow-sm'
                    : 'bg-campo-card text-campo-muted hover:text-campo-texto border border-campo-borde'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Respaldo en 1 Clic (FN-1.5)</span>
              </button>

              <button
                onClick={() => setActiveTab('parametros_agricolas')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'parametros_agricolas'
                    ? 'bg-campo-verde text-white shadow-sm'
                    : 'bg-campo-card text-campo-muted hover:text-campo-texto border border-campo-borde'
                }`}
              >
                <Sprout className="w-4 h-4" />
                <span>Cultivos & Campañas</span>
              </button>
            </div>

            {/* Vistas Módulo 1 */}
            {activeTab === 'colaboradores' && <ColaboradoresManager />}
            {activeTab === 'roles' && <RolesManager />}
            {activeTab === 'auditoria' && <AuditLogViewer />}
            {activeTab === 'respaldo' && <ExportBackupButton />}
            {activeTab === 'parametros_agricolas' && <CultivosParamManager />}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-campo-borde p-4 text-center text-xs text-campo-muted font-mono bg-campo-blanco">
        Campo360 &bull; Plataforma Integral de Gestión Agropecuaria &bull; Sistema Oficial
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardView />
    </AuthProvider>
  );
}

export default App;
