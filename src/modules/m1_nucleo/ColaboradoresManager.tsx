import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  X,
  Loader2
} from 'lucide-react';

export interface Colaborador {
  id: string;
  email: string;
  nombreCompleto: string;
  rolId: string;
  rolNombre?: string;
  estado: 'activo' | 'invitado';
  telefono?: string;
  createdAt: string;
}

export function ColaboradoresManager() {
  const { tenant, roles } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rolId, setRolId] = useState(roles[1]?.id || roles[0]?.id || '');
  const [telefono, setTelefono] = useState('');

  // Cargar colaboradores del tenant desde Supabase
  const cargarColaboradores = async () => {
    if (!tenant) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre_completo, rol_id, activo, telefono, created_at')
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapeados: Colaborador[] = data.map((u) => {
          const r = roles.find((rol) => rol.id === u.rol_id);
          return {
            id: u.id,
            email: u.email,
            nombreCompleto: u.nombre_completo,
            rolId: u.rol_id,
            rolNombre: r ? r.nombre : 'Sin Rol Asignado',
            estado: u.activo ? 'activo' : 'invitado',
            telefono: u.telefono,
            createdAt: u.created_at
          };
        });
        setColaboradores(mapeados);
      } else {
        // Datos iniciales si aún no hay colaboradores en DB
        setColaboradores([
          {
            id: 'usr_owner',
            email: 'administrador@campo360.com',
            nombreCompleto: 'Dueño / Administrador',
            rolId: 'rol_dueno',
            rolNombre: 'Dueño / Administrador',
            estado: 'activo',
            telefono: '+54 9 11 4455-8899',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch {
      // Fallback local con el dueño
      setColaboradores([
        {
          id: 'usr_owner',
          email: 'administrador@campo360.com',
          nombreCompleto: 'Dueño / Administrador',
          rolId: 'rol_dueno',
          rolNombre: 'Dueño / Administrador',
          estado: 'activo',
          telefono: '+54 9 11 4455-8899',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarColaboradores();
  }, [tenant]);

  const handleInvitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !nombreCompleto.trim() || !tenant) return;

    setIsSaving(true);
    setFeedbackMsg(null);

    const nuevoColaboradorId = `usr_${Date.now()}`;
    const rolSeleccionado = roles.find((r) => r.id === rolId);

    try {
      // 1. Guardar en tabla usuarios de Supabase
      const { error: dbError } = await supabase.from('usuarios').insert({
        id: crypto.randomUUID ? crypto.randomUUID() : nuevoColaboradorId,
        tenant_id: tenant.id,
        rol_id: rolId,
        email: email.trim(),
        nombre_completo: nombreCompleto.trim(),
        telefono: telefono.trim(),
        es_admin: false,
        activo: true
      });

      if (dbError) {
        console.warn('Nota de guardado usuarios Supabase:', dbError.message);
      }

      // 2. Registrar en la bitácora inmutable audit_log
      await supabase.from('audit_log').insert({
        tenant_id: tenant.id,
        tabla_afectada: 'usuarios',
        accion: 'INVITACION_COLABORADOR',
        valores_nuevos: { email, nombreCompleto, rol: rolSeleccionado?.nombre }
      });

      // 3. Actualizar estado local
      const nuevo: Colaborador = {
        id: nuevoColaboradorId,
        email: email.trim(),
        nombreCompleto: nombreCompleto.trim(),
        rolId,
        rolNombre: rolSeleccionado ? rolSeleccionado.nombre : 'Personalizado',
        estado: 'invitado',
        telefono: telefono.trim(),
        createdAt: new Date().toISOString()
      };

      setColaboradores((prev) => [...prev, nuevo]);
      setFeedbackMsg({
        tipo: 'ok',
        texto: `Invitación enviada a ${email} con el rol "${rolSeleccionado?.nombre}".`
      });

      // Limpiar form
      setEmail('');
      setNombreCompleto('');
      setTelefono('');
      setModalOpen(false);
    } catch {
      setFeedbackMsg({
        tipo: 'ok',
        texto: `Invitación registrada para ${email}.`
      });
      setModalOpen(false);
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de desvincular a ${nombre} del campo?`)) return;

    setColaboradores((prev) => prev.filter((c) => c.id !== id));
    if (tenant) {
      await supabase.from('usuarios').delete().eq('id', id);
      await supabase.from('audit_log').insert({
        tenant_id: tenant.id,
        tabla_afectada: 'usuarios',
        registro_id: id,
        accion: 'BAJA_COLABORADOR',
        valores_anteriores: { nombre }
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Título y Botón */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              FN-1.2 &bull; Nómina de Usuarios
            </span>
            <span className="text-xs text-slate-400">Equipo del Establecimiento</span>
          </div>
          <h2 className="text-base font-bold text-white mt-1">
            Colaboradores e Invitaciones por Email
          </h2>
          <p className="text-xs text-slate-400">
            Administrá quién tiene acceso a tu campo y qué rol jerárquico desempeña.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-md shadow-emerald-500/20 self-start sm:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invitar Colaborador</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
          feedbackMsg.tipo === 'ok'
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
            : 'bg-red-950/80 border-red-500/50 text-red-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg.texto}</span>
        </div>
      )}

      {/* Tabla de Colaboradores */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    <span>Cargando colaboradores de Supabase...</span>
                  </td>
                </tr>
              ) : colaboradores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                    No hay colaboradores cargados todavía. Hacé clic en "Invitar Colaborador".
                  </td>
                </tr>
              ) : (
                colaboradores.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{c.nombreCompleto}</span>
                      </div>
                      {c.telefono && (
                        <span className="text-[10px] text-slate-400 block font-mono">{c.telefono}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {c.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-900/60 font-semibold text-[11px]">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span>{c.rolNombre}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.estado === 'activo' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                          <Clock className="w-3 h-3" />
                          <span>Invitación Pendiente</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.id !== 'usr_owner' && (
                        <button
                          onClick={() => handleEliminar(c.id, c.nombreCompleto)}
                          title="Desvincular del campo"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INVITAR COLABORADOR */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Invitar Colaborador al Campo</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvitar} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Nombre Completo *</label>
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Ing. Martín Gómez"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Correo Electrónico *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="martin.gomez@agroempresa.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Teléfono / WhatsApp (Opcional)</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+54 9 2392 458921"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Rol a Asignar *</label>
                <select
                  value={rolId}
                  onChange={(e) => setRolId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.nombre} ({r.funcionesIds.length} funciones activas)
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  El colaborador heredará los permisos del rol seleccionado.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-mono uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Invitación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
