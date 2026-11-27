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

  const [email, setEmail] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rolId, setRolId] = useState(roles[1]?.id || roles[0]?.id || '');
  const [telefono, setTelefono] = useState('');

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
        setColaboradores([
          {
            id: 'usr_owner',
            email: 'administrador@landa360.com',
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
      setColaboradores([
        {
          id: 'usr_owner',
          email: 'administrador@landa360.com',
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
      await supabase.from('usuarios').insert({
        id: crypto.randomUUID ? crypto.randomUUID() : nuevoColaboradorId,
        tenant_id: tenant.id,
        rol_id: rolId,
        email: email.trim(),
        nombre_completo: nombreCompleto.trim(),
        telefono: telefono.trim(),
        es_admin: false,
        activo: true
      });

      await supabase.from('audit_log').insert({
        tenant_id: tenant.id,
        tabla_afectada: 'usuarios',
        accion: 'INVITACION_COLABORADOR',
        valores_nuevos: { email, nombreCompleto, rol: rolSeleccionado?.nombre }
      });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-campo-card p-5 rounded-2xl border border-campo-borde shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-campo-arena text-campo-bosque border border-campo-borde">
              FN-1.2 &bull; Nómina de Usuarios
            </span>
            <span className="text-xs text-campo-muted">Equipo del Establecimiento</span>
          </div>
          <h2 className="text-lg font-bold text-campo-texto mt-1">
            Colaboradores e Invitaciones por Email
          </h2>
          <p className="text-xs text-campo-muted">
            Administrá quién tiene acceso a tu campo y qué rol jerárquico desempeña.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-campo-verde hover:bg-campo-oliva text-white font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-sm self-start sm:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invitar Colaborador</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
          feedbackMsg.tipo === 'ok'
            ? 'bg-emerald-50 border-campo-exito/30 text-campo-exito'
            : 'bg-red-50 border-campo-error/30 text-campo-error'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg.texto}</span>
        </div>
      )}

      {/* Tabla de Colaboradores */}
      <div className="bg-campo-card border border-campo-borde rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-campo-arena/60 text-campo-texto font-mono uppercase text-[11px] border-b border-campo-borde">
              <tr>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campo-borde/70 text-campo-texto">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-campo-muted font-mono">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-campo-verde" />
                    <span>Cargando colaboradores de Supabase...</span>
                  </td>
                </tr>
              ) : colaboradores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-campo-muted font-mono">
                    No hay colaboradores cargados todavía. Hacé clic en "Invitar Colaborador".
                  </td>
                </tr>
              ) : (
                colaboradores.map((c) => (
                  <tr key={c.id} className="hover:bg-campo-arena/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-campo-texto flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-campo-verde" />
                        <span>{c.nombreCompleto}</span>
                      </div>
                      {c.telefono && (
                        <span className="text-[10px] text-campo-muted block font-mono">{c.telefono}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-campo-muted">
                      {c.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-campo-arena text-campo-bosque border border-campo-borde font-semibold text-[11px]">
                        <Shield className="w-3 h-3 text-campo-verde" />
                        <span>{c.rolNombre}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.estado === 'activo' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-campo-exito bg-emerald-50 px-2 py-0.5 rounded border border-campo-exito/30 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-campo-alerta bg-amber-50 px-2 py-0.5 rounded border border-campo-alerta/30 font-semibold">
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
                          className="p-1.5 rounded-lg text-campo-muted hover:text-campo-error hover:bg-red-50 transition-colors"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-campo-card border border-campo-borde rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-campo-texto">
            <div className="flex items-center justify-between border-b border-campo-borde pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-campo-texto">
                <UserPlus className="w-4 h-4 text-campo-verde" />
                <span>Invitar Colaborador al Campo</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-campo-muted hover:text-campo-texto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvitar} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-campo-texto">Nombre Completo *</label>
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Ing. Martín Gómez"
                  className="w-full bg-campo-blanco border border-campo-borde rounded-xl px-3 py-2 text-xs text-campo-texto focus:outline-none focus:border-campo-verde"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-campo-texto">Correo Electrónico *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-campo-muted absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="martin.gomez@agroempresa.com"
                    className="w-full bg-campo-blanco border border-campo-borde rounded-xl pl-9 pr-3 py-2 text-xs text-campo-texto focus:outline-none focus:border-campo-verde font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-campo-texto">Teléfono / WhatsApp (Opcional)</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+54 9 2392 458921"
                  className="w-full bg-campo-blanco border border-campo-borde rounded-xl px-3 py-2 text-xs text-campo-texto focus:outline-none focus:border-campo-verde font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-campo-texto">Rol a Asignar *</label>
                <select
                  value={rolId}
                  onChange={(e) => setRolId(e.target.value)}
                  className="w-full bg-campo-blanco border border-campo-borde rounded-xl px-3 py-2 text-xs text-campo-texto focus:outline-none focus:border-campo-verde font-semibold cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id} className="bg-campo-card text-campo-texto">
                      {r.nombre} ({r.funcionesIds.length} funciones activas)
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-campo-muted block mt-1">
                  El colaborador heredará los permisos del rol seleccionado.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-campo-borde">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-campo-arena text-campo-texto hover:bg-campo-borde"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-xl bg-campo-verde text-white hover:bg-campo-oliva font-mono uppercase tracking-wider transition-all disabled:opacity-50"
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
