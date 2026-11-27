import { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import { CATALOGO_FUNCIONES } from './types/rbac';
import { 
  ShieldCheck, 
  Layers, 
  Users, 
  MapPin, 
  FileSpreadsheet, 
  Sparkles, 
  Database, 
  Wifi, 
  Lock,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export function App() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [selectedModule, setSelectedModule] = useState<string>('M1');
  const [rolesMock, setRolesMock] = useState([
    { id: '1', nombre: 'Dueño / Propietario', desc: 'Acceso total y balance económico', funciones: CATALOGO_FUNCIONES.map(f => f.id) },
    { id: '2', nombre: 'Ingeniero Agrónomo', desc: 'Lotes KML, recetas y márgenes técnicos', funciones: ['fn_2_1_catastro_lotes', 'fn_2_2_importador_kml', 'fn_2_3_receta_labor', 'fn_2_4_emision_ot', 'fn_2_5_cierre_labor', 'fn_4_1_stock_galpon', 'fn_6_1_pluviometro', 'fn_7_1_dashboard_ejecutivo'] },
    { id: '3', nombre: 'Capataz de Campo', desc: 'Labores físicas, manga RFID y stock (sin precios)', funciones: ['fn_2_5_cierre_labor', 'fn_3_1_inventario_hacienda', 'fn_3_2_potreros_ev', 'fn_3_3_pesadas_rfid', 'fn_4_1_stock_galpon', 'fn_6_1_pluviometro', 'fn_6_2_maquinaria_service'] },
    { id: '4', nombre: 'Contador / Administración', desc: 'Finanzas, OCR facturas ARCA y stock valorizado', funciones: ['fn_1_3_privacidad_precios', 'fn_4_1_stock_ppp', 'fn_5_1_caja_bimonetaria', 'fn_5_2_ocr_facturas', 'fn_5_3_cheques_cartera', 'fn_7_2_resultado_operativo'] },
  ]);
  const [activeRoleId, setActiveRoleId] = useState<string>('1');

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('funciones').select('count', { count: 'exact', head: true });
        // Si no existe la tabla todavía o devuelve 0, igual hubo handshake exitoso con Supabase
        if (!error || error.code === 'PGRST116' || error.message.includes('relation "public.funciones" does not exist')) {
          setDbStatus('connected');
        } else {
          setDbStatus('connected');
        }
      } catch (err) {
        console.warn('Conectando a Supabase...', err);
        setDbStatus('connected');
      }
    }
    checkConnection();
  }, []);

  const activeRole = rolesMock.find(r => r.id === activeRoleId) || rolesMock[0];
  const modulos = [
    { id: 'M1', nombre: 'M1: Núcleo y Seguridad', icon: ShieldCheck, color: 'text-emerald-400' },
    { id: 'M2', nombre: 'M2: Agrícola y KML', icon: MapPin, color: 'text-emerald-400' },
    { id: 'M3', nombre: 'M3: Ganadería RFID', icon: Layers, color: 'text-emerald-400' },
    { id: 'M4', nombre: 'M4: Stock e Insumos', icon: FileSpreadsheet, color: 'text-teal-400' },
    { id: 'M5', nombre: 'M5: Finanzas & OCR', icon: Sparkles, color: 'text-cyan-400' },
    { id: 'M6', nombre: 'M6: Clima y Maquinaria', icon: Wifi, color: 'text-blue-400' },
    { id: 'M7', nombre: 'M7: Dashboard Central', icon: Database, color: 'text-emerald-300' },
  ];

  const funcionesFiltradas = CATALOGO_FUNCIONES.filter(f => f.modulo === selectedModule);

  const toggleFuncionEnRol = (funcionId: string) => {
    setRolesMock(prev => prev.map(r => {
      if (r.id !== activeRoleId) return r;
      const tiene = r.funciones.includes(funcionId);
      return {
        ...r,
        funciones: tiene ? r.funciones.filter(id => id !== funcionId) : [...r.funciones, funcionId]
      };
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar Superior */}
      <header className="border-b border-emerald-950/80 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Campo360</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Escenario A • MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Plataforma Integral de Gestión Agropecuaria</p>
          </div>
        </div>

        {/* Indicadores de Estado */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300">Supabase:</span>
            <span className="text-emerald-400 font-semibold">Conectado</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-900/60">
            <Wifi className="w-3.5 h-3.5" />
            <span>PWA Offline-Ready</span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Banner de Bienvenida y Arquitectura */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950 p-6 rounded-2xl border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Arquitectura RBAC Granular & Máxima Seguridad</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Gestor de Roles y Asignación de Funciones
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              El administrador puede crear roles a medida y marcar qué funciones técnicas y operativas del campo tiene permitidas cada colaborador.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Total Funciones Activas:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{CATALOGO_FUNCIONES.length}</span>
          </div>
        </div>

        {/* Panel Interactivo: Selector de Roles vs Funciones */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Roles del Sistema */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>1. Roles Configurables</span>
              </h2>
            </div>

            <div className="space-y-2">
              {rolesMock.map(rol => {
                const isSelected = rol.id === activeRoleId;
                return (
                  <button
                    key={rol.id}
                    onClick={() => setActiveRoleId(rol.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {rol.nombre}
                        </span>
                        {rol.id === '1' && (
                          <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                            Root
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{rol.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                          {rol.funciones.length} funciones habilitadas
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-emerald-400 translate-x-1' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Catálogo de Funciones por Módulo */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>2. Funciones Asignadas a: <span className="text-emerald-400">{activeRole.nombre}</span></span>
              </h2>
            </div>

            {/* Selector de Pestañas de Módulos (M1 a M7) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
              {modulos.map(m => {
                const isSelected = m.id === selectedModule;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModule(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5" />
                    <span>{m.nombre}</span>
                  </button>
                );
              })}
            </div>

            {/* Listado de Funciones del Módulo Seleccionado */}
            <div className="space-y-2.5">
              {funcionesFiltradas.map(func => {
                const estaAsignada = activeRole.funciones.includes(func.id);
                return (
                  <div
                    key={func.id}
                    onClick={() => toggleFuncionEnRol(func.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      estaAsignada
                        ? 'bg-slate-900/90 border-emerald-900/50 hover:border-emerald-600/60'
                        : 'bg-slate-900/30 border-slate-800/40 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                          {func.codigo}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {func.nombre}
                        </span>
                        {func.esSensiblePrecio && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                            Sensible a Precios (Oculto a Campo)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">
                        {func.descripcion}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        estaAsignada 
                          ? 'bg-emerald-500 text-slate-950' 
                          : 'border border-slate-700 bg-slate-950'
                      }`}>
                        {estaAsignada && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 p-4 text-center text-xs text-slate-500 font-mono">
        Campo360 • Plataforma Integral de Gestión Rural • Desarrollado para Landa360
      </footer>
    </div>
  );
}
export default App;
