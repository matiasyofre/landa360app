import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CATALOGO_FUNCIONES, ModuloId } from '../../types/rbac';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  MapPin, 
  Layers, 
  FileSpreadsheet, 
  Sparkles, 
  Wifi, 
  Database,
  Save,
  Check
} from 'lucide-react';

export function RolesManager() {
  const { 
    roles, 
    rolActivo, 
    cambiarRolActivo, 
    crearNuevoRol, 
    actualizarFuncionesRol
  } = useAuth();

  const [selectedModule, setSelectedModule] = useState<ModuloId>('M1');
  const [modalNuevoRol, setModalNuevoRol] = useState<boolean>(false);
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevaDesc, setNuevaDesc] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  const modulos: { id: ModuloId; nombre: string; icon: typeof ShieldCheck }[] = [
    { id: 'M1', nombre: 'M1: Núcleo y Seguridad', icon: ShieldCheck },
    { id: 'M2', nombre: 'M2: Agrícola y KML', icon: MapPin },
    { id: 'M3', nombre: 'M3: Ganadería RFID', icon: Layers },
    { id: 'M4', nombre: 'M4: Stock e Insumos', icon: FileSpreadsheet },
    { id: 'M5', nombre: 'M5: Finanzas & OCR', icon: Sparkles },
    { id: 'M6', nombre: 'M6: Clima y Maquinaria', icon: Wifi },
    { id: 'M7', nombre: 'M7: Dashboard Central', icon: Database },
  ];

  const funcionesDelModulo = CATALOGO_FUNCIONES.filter((f) => f.modulo === selectedModule);

  const toggleFuncion = async (funcionId: string) => {
    if (!rolActivo) return;
    const tiene = rolActivo.funcionesIds.includes(funcionId);
    const nuevas = tiene
      ? rolActivo.funcionesIds.filter((id) => id !== funcionId)
      : [...rolActivo.funcionesIds, funcionId];

    setIsSaving(true);
    await actualizarFuncionesRol(rolActivo.id, nuevas);
    setIsSaving(false);
    setMensajeGuardado('Permisos actualizados y persistidos en Supabase');
    setTimeout(() => setMensajeGuardado(null), 3000);
  };

  const handleCrearRol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    setIsSaving(true);
    // Rol nuevo nace con permisos operativos base
    const funcionesIniciales = ['fn_2_5_cierre_labor', 'fn_4_1_stock_galpon', 'fn_6_1_pluviometro'];
    await crearNuevoRol(nuevoNombre, nuevaDesc, funcionesIniciales);
    setIsSaving(false);
    setNuevoNombre('');
    setNuevaDesc('');
    setModalNuevoRol(false);
    setMensajeGuardado(`Rol "${nuevoNombre}" creado exitosamente`);
    setTimeout(() => setMensajeGuardado(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Notificación de guardado */}
      {mensajeGuardado && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{mensajeGuardado}</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-900/50 px-2 py-0.5 rounded">
            Auto-Sync Supabase
          </span>
        </div>
      )}

      {/* Grid Principal: Roles a la Izquierda, Funciones a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: Roles (FN-1.2) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Roles del Establecimiento</span>
            </h3>

            <button
              onClick={() => setModalNuevoRol(true)}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Rol</span>
            </button>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = rolActivo?.id === r.id;
              const tienePermisoPrecios = r.funcionesIds.includes('fn_1_3_privacidad_precios');

              return (
                <div
                  key={r.id}
                  onClick={() => cambiarRolActivo(r.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/70 shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {r.nombre}
                      </span>
                      {r.esSistema && (
                        <span className="text-[9px] font-mono uppercase bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          Nativo
                        </span>
                      )}
                    </div>
                    {r.descripcion && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.descripcion}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {r.funcionesIds.length} funciones
                      </span>

                      {!tienePermisoPrecios ? (
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Sin costos</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">
                          Finanzas OK
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-emerald-400 translate-x-1' : 'text-slate-600'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA: Asignación Granular de Funciones */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase text-slate-400">Editando permisos para:</span>
                <span className="text-sm font-bold text-white">{rolActivo?.nombre}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Activá o desactivá funciones para este rol. Cada cambio impacta en la tabla <code className="text-emerald-400 font-mono text-[11px]">rol_funciones</code>.
              </p>
            </div>

            {isSaving && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-900/50 shrink-0">
                <Save className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </span>
            )}
          </div>

          {/* Tabs de Módulos M1 a M7 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
            {modulos.map((m) => {
              const isSelected = selectedModule === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.nombre}</span>
                </button>
              );
            })}
          </div>

          {/* Lista de Funciones del Módulo */}
          <div className="space-y-2">
            {funcionesDelModulo.map((func) => {
              const isChecked = rolActivo?.funcionesIds.includes(func.id);

              return (
                <div
                  key={func.id}
                  onClick={() => toggleFuncion(func.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isChecked
                      ? 'bg-slate-900/90 border-emerald-900/50 hover:border-emerald-600/60'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-55 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-900/60">
                        {func.codigo}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {func.nombre}
                      </span>
                      {func.esSensiblePrecio && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Dato Económico Sensible</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{func.descripcion}</p>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40' : 'border border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Crear Nuevo Rol */}
      {modalNuevoRol && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-emerald-900/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Crear Rol Personalizado</span>
            </div>
            <p className="text-xs text-slate-400">
              Creá un rol a medida (ej: Tractorista, Veterinario, Asesor Agronómico) y luego asignale funciones específicas.
            </p>

            <form onSubmit={handleCrearRol} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Nombre del Rol *</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Tractorista / Maquinista"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Descripción u Objetivo</label>
                <input
                  type="text"
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                  placeholder="Ej: Cierre de labores mecánicas y pulverización a campo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNuevoRol(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!nuevoNombre.trim()}
                  className="text-xs font-bold px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-mono disabled:opacity-50"
                >
                  Crear Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
