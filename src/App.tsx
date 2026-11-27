import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './modules/m1_nucleo/AuthScreen';
import { OnboardingWizard } from './modules/m1_nucleo/OnboardingWizard';
import { ColaboradoresManager } from './modules/m1_nucleo/ColaboradoresManager';
import { RolesManager } from './modules/m1_nucleo/RolesManager';
import { AuditLogViewer } from './modules/m1_nucleo/AuditLogViewer';
import { ExportBackupButton } from './modules/m1_nucleo/ExportBackupButton';
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
  Sparkles
} from 'lucide-react';

function DashboardView() {
  const { user, setUser, tenant, rolActivo, cambiarRolActivo, roles, logout } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'colaboradores' | 'roles' | 'auditoria' | 'respaldo'>('colaboradores');

  // 1. BLOQUEO ZERO-TRUST: Si no está autenticado, muestra Pantalla de Login / Registro
  if (!user) {
    return (
      <AuthScreen 
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
        }} 
      />
    );
  }

  // 2. ONBOARDING: Si el usuario está autenticado pero aún no configuró su campo (o pidió reconfigurar)
  if (!tenant || showWizard) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex flex-col justify-center">
        <OnboardingWizard onComplete={() => setShowWizard(false)} />
      </div>
    );
  }

  // 3. DASHBOARD DEL MÓDULO 1 (NÚCLEO Y SEGURIDAD)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-emerald-950/80 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Campo360</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Módulo 1 &bull; Seguridad & RLS
              </span>
            </div>
            {/* Establecimiento activo */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Building2 className="w-3 h-3 text-emerald-400" />
              <span className="text-white font-medium">{tenant.nombreFantasia}</span>
              <span className="font-mono text-slate-500">CUIT: {tenant.cuit}</span>
            </div>
          </div>
        </div>

        {/* Simulador de Rol, Usuario y Acciones */}
        <div className="flex items-center gap-3">
          {/* Selector de Rol Activo */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Rol Activo:</span>
            <select
              value={rolActivo?.id || ''}
              onChange={(e) => cambiarRolActivo(e.target.value)}
              className="bg-transparent text-emerald-300 font-bold focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Badge Usuario Logueado */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[130px]">{user.nombreCompleto}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-900/60">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PWA Offline</span>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            title="Reconfigurar Campo (Asistente)"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={logout}
            title="Cerrar Sesión Segura"
            className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:text-red-300 hover:bg-red-900/60 border border-red-900/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {/* Banner del Establecimiento */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950 p-5 rounded-2xl border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
                M1: Núcleo del Sistema & Seguridad
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/50">
                Aislamiento RLS Activo
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Consola de Administración y Seguridad del Campo
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl">
              Gestión de colaboradores, roles dinámicos, permisos con privacidad estricta y bitácora de auditoría inmutable de {tenant.nombreFantasia}.
            </p>
          </div>

          {/* Quick Stats del Tenant */}
          <div className="flex items-center gap-3 self-start sm:self-auto text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">Superficie</span>
              <span className="text-white font-bold">{tenant.hectareasTotales || 1250} ha</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-500 block text-[10px]">Perfil</span>
              <span className="text-emerald-400 font-bold capitalize">{tenant.perfilProductivo || 'Mixto'}</span>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación Oficiales del Módulo 1 (FN-1.1 a FN-1.6) */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('colaboradores')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'colaboradores'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Colaboradores (FN-1.2)</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'roles'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Roles y Permisos (FN-1.2 & FN-1.3)</span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'auditoria'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bitácora de Auditoría (FN-1.4)</span>
          </button>

          <button
            onClick={() => setActiveTab('respaldo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'respaldo'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Respaldo en 1 Clic (FN-1.5)</span>
          </button>

          <button
            onClick={() => setShowWizard(true)}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors ml-auto flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>"Armá tu campo" (FN-1.6)</span>
          </button>
        </div>

        {/* Vistas Reales y Operativas del Módulo 1 */}
        {activeTab === 'colaboradores' && <ColaboradoresManager />}
        {activeTab === 'roles' && <RolesManager />}
        {activeTab === 'auditoria' && <AuditLogViewer />}
        {activeTab === 'respaldo' && <ExportBackupButton />}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 p-4 text-center text-xs text-slate-500 font-mono">
        Campo360 &bull; Núcleo de Seguridad y Aislamiento Multi-Tenant &bull; Supabase PostgreSQL 16
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
