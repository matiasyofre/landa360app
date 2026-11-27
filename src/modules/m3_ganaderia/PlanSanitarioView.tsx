// ==============================================================================
// LANDA360: FN-3.8 PLAN SANITARIO Y AGENDA VETERINARIA CON REFUERZOS
// Calendario de vacunación obligatoria y control estricto de días de carencia
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { EventoSanitario, FarmacoVeterinario, Rodeo, PotreroGanadero } from '../../types/ganaderia';
import { HeartPulse, ShieldCheck, AlertCircle, Plus, Clock } from 'lucide-react';

export const PlanSanitarioView: React.FC = () => {
  const [eventos, setEventos] = useState<EventoSanitario[]>(ganaderiaService.getEventosSanitarios());
  const [farmacos] = useState<FarmacoVeterinario[]>(ganaderiaService.getFarmacos());
  const [rodeos] = useState<Rodeo[]>(ganaderiaService.getRodeos());
  const [potreros] = useState<PotreroGanadero[]>(ganaderiaService.getPotreros());

  const [modalSanitario, setModalSanitario] = useState(false);
  const [formSan, setFormSan] = useState({
    farmaco_id: farmacos[0]?.id || '',
    rodeo_id: rodeos[0]?.id || '',
    potrero_id: potreros[0]?.id || '',
    fecha: new Date().toISOString().split('T')[0],
    cantidad_animales: 80,
    dosis_aplicada: '2 ml subcutáneo',
    requiere_refuerzo: false,
    fecha_refuerzo: '',
    veterinario: 'Dr. Martín Valenzuela (M.P. 4921)',
    notas: 'Campaña obligatoria de vacunación'
  });

  const handleGuardarSanitario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSan.farmaco_id) return;

    const farm = farmacos.find(f => f.id === formSan.farmaco_id);
    const rod = rodeos.find(r => r.id === formSan.rodeo_id);
    const pot = potreros.find(p => p.id === formSan.potrero_id);

    ganaderiaService.registrarEventoSanitario({
      tenant_id: 'default',
      fecha: formSan.fecha,
      farmaco_id: formSan.farmaco_id,
      farmaco_nombre: farm?.nombre_comercial,
      rodeo_id: formSan.rodeo_id,
      rodeo_nombre: rod?.nombre,
      potrero_id: formSan.potrero_id,
      potrero_nombre: pot?.nombre,
      cantidad_animales: Number(formSan.cantidad_animales),
      dosis_aplicada: formSan.dosis_aplicada,
      requiere_refuerzo: formSan.requiere_refuerzo,
      fecha_refuerzo: formSan.requiere_refuerzo ? formSan.fecha_refuerzo : undefined,
      veterinario: formSan.veterinario,
      notas: formSan.notas
    });

    setEventos(ganaderiaService.getEventosSanitarios());
    setModalSanitario(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SANITARIO */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#C65B50]" />
            <h3 className="text-lg font-bold text-[#24382C]">Plan Sanitario Oficial & Agenda Veterinaria</h3>
          </div>
          <p className="text-xs text-[#74796D] mt-0.5">
            Registro y seguimiento de planes oficiales (Aftosa, Carbunclo, Brucelosis), refuerzos y bloqueo preventivo de faena por carencia (FN-3.8).
          </p>
        </div>

        <button
          onClick={() => setModalSanitario(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Registrar Tratamiento
        </button>
      </div>

      {/* AGENDA & ALERTAS DE REFUERZO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#38845A]/15 flex items-center justify-center text-[#38845A]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Estado Sanitario General</p>
            <p className="text-base font-bold text-[#38845A]">Al Día (SENASA OK)</p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#D9A441]/15 flex items-center justify-center text-[#D9A441]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Refuerzos Programados</p>
            <p className="text-base font-bold text-[#24382C]">2 Tropas este mes</p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#C65B50]/15 flex items-center justify-center text-[#C65B50]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">En Período de Carencia</p>
            <p className="text-base font-bold text-[#C65B50]">0 Tropas Bloqueadas</p>
          </div>
        </div>
      </div>

      {/* TABLA DE TRATAMIENTOS REALIZADOS */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DDDCD1] flex justify-between items-center bg-[#F7F7F2]/60">
          <h4 className="font-bold text-sm text-[#24382C]">Tratamientos y Vacunaciones Registradas</h4>
          <span className="text-xs text-[#74796D]">FN-3.8 Vademécum y Carencias</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#343B2D]">
            <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider border-b border-[#DDDCD1]">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Fármaco Aplicado</th>
                <th className="py-3 px-4">Rodeo / Potrero</th>
                <th className="py-3 px-4 text-right">Cabezas</th>
                <th className="py-3 px-4">Dosis / Vía</th>
                <th className="py-3 px-4">Carencia Faena</th>
                <th className="py-3 px-4">Refuerzo</th>
                <th className="py-3 px-4">Veterinario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDCD1]">
              {eventos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#74796D]">
                    No hay eventos sanitarios registrados en este ciclo.
                  </td>
                </tr>
              ) : (
                eventos.map(ev => (
                  <tr key={ev.id} className="hover:bg-[#F7F7F2]/60">
                    <td className="py-3 px-4 font-mono text-[#74796D]">{ev.fecha}</td>
                    <td className="py-3 px-4 font-bold text-[#24382C]">{ev.farmaco_nombre}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold block">{ev.rodeo_nombre || 'General'}</span>
                      <span className="text-[11px] text-[#74796D]">{ev.potrero_nombre}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{ev.cantidad_animales}</td>
                    <td className="py-3 px-4 text-[#74796D]">{ev.dosis_aplicada}</td>
                    <td className="py-3 px-4">
                      {ev.fecha_fin_carencia ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C65B50]/15 text-[#C65B50]">
                          Hasta {ev.fecha_fin_carencia}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#38845A]/15 text-[#38845A]">
                          Libre
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {ev.requiere_refuerzo ? (
                        <span className="text-[11px] font-semibold text-[#D9A441] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {ev.fecha_refuerzo || 'A los 30 días'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#74796D]">No requiere</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#74796D]">{ev.veterinario}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR TRATAMIENTO */}
      {modalSanitario && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleGuardarSanitario} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#DDDCD1]">
            <h3 className="text-base font-bold text-[#24382C] mb-4">Registrar Aplicación Veterinaria</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Fármaco / Vacuna</label>
                  <select
                    value={formSan.farmaco_id}
                    onChange={e => setFormSan({ ...formSan, farmaco_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-bold text-[#24382C] focus:outline-none focus:border-[#83A653]"
                  >
                    {farmacos.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.nombre_comercial} ({f.tipo} - {f.dias_carencia_faena}d carencia)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Fecha de Aplicación</label>
                  <input
                    type="date"
                    required
                    value={formSan.fecha}
                    onChange={e => setFormSan({ ...formSan, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Rodeo Destino</label>
                  <select
                    value={formSan.rodeo_id}
                    onChange={e => setFormSan({ ...formSan, rodeo_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    {rodeos.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Cantidad de Cabezas</label>
                  <input
                    type="number"
                    value={formSan.cantidad_animales}
                    onChange={e => setFormSan({ ...formSan, cantidad_animales: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Dosis Aplicada</label>
                  <input
                    type="text"
                    value={formSan.dosis_aplicada}
                    onChange={e => setFormSan({ ...formSan, dosis_aplicada: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Veterinario Responsable</label>
                  <input
                    type="text"
                    value={formSan.veterinario}
                    onChange={e => setFormSan({ ...formSan, veterinario: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F7F7F2] rounded-xl border border-[#DDDCD1] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSan.requiere_refuerzo}
                    onChange={e => setFormSan({ ...formSan, requiere_refuerzo: e.target.checked })}
                    className="w-4 h-4 text-[#83A653] rounded"
                  />
                  <span className="font-semibold text-[#343B2D]">¿Requiere Dosis de Refuerzo / Revacunación?</span>
                </label>
                {formSan.requiere_refuerzo && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#74796D] mb-1">Fecha Programada de Refuerzo</label>
                    <input
                      type="date"
                      value={formSan.fecha_refuerzo}
                      onChange={e => setFormSan({ ...formSan, fecha_refuerzo: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#DDDCD1] rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalSanitario(false)}
                className="px-4 py-2 border border-[#DDDCD1] rounded-lg text-xs font-semibold text-[#74796D] hover:bg-[#F7F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Registrar Tratamiento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
