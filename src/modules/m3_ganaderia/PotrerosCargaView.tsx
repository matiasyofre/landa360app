// ==============================================================================
// LANDA360: FN-3.2 GESTIÓN DE POTREROS Y CARGA ANIMAL EN EV/HA
// & FN-3.3 MOVIMIENTO ÁGIL DE RODEO ENTRE POTREROS (MOBILE FIRST)
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { PotreroGanadero, Rodeo, MovimientoHacienda } from '../../types/ganaderia';
import { Compass, ArrowRightLeft, Plus, Clock, Trees } from 'lucide-react';

interface Props {
  onDataChanged?: () => void;
}

export const PotrerosCargaView: React.FC<Props> = ({ onDataChanged }) => {
  const [potreros, setPotreros] = useState<PotreroGanadero[]>(ganaderiaService.getPotreros());
  const [rodeos] = useState<Rodeo[]>(ganaderiaService.getRodeos());
  const [movimientos, setMovimientos] = useState<MovimientoHacienda[]>(ganaderiaService.getMovimientos());

  // Modal Movimiento Ágil en 2 Toques (FN-3.3)
  const [modalMov, setModalMov] = useState(false);
  const [movForm, setMovForm] = useState({
    rodeo_id: rodeos[0]?.id || '',
    potrero_origen_id: potreros[0]?.id || '',
    potrero_destino_id: potreros[1]?.id || '',
    motivo: 'Rotación de pasturas',
    responsable: 'Capataz de Campo',
    observaciones: ''
  });

  // Modal Nuevo Potrero
  const [modalPotrero, setModalPotrero] = useState(false);
  const [nuevoPotrero, setNuevoPotrero] = useState<Partial<PotreroGanadero>>({
    nombre: '',
    superficie_ha: 100,
    recurso_forrajero: 'Pastura Polifítica (Alfalfa / Festuca)',
    receptividad_objetivo_ev_ha: 1.0,
    dias_descanso_actual: 0
  });

  const handleCrearPotrero = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPotrero.nombre || !nuevoPotrero.superficie_ha) return;

    const item: PotreroGanadero = {
      id: `pot-${Date.now()}`,
      tenant_id: 'default',
      nombre: nuevoPotrero.nombre,
      superficie_ha: Number(nuevoPotrero.superficie_ha),
      recurso_forrajero: nuevoPotrero.recurso_forrajero || 'Campo Natural',
      receptividad_objetivo_ev_ha: Number(nuevoPotrero.receptividad_objetivo_ev_ha) || 0.8,
      dias_descanso_actual: Number(nuevoPotrero.dias_descanso_actual) || 0,
      activo: true
    };

    ganaderiaService.savePotrero(item);
    setPotreros(ganaderiaService.getPotreros());
    setModalPotrero(false);
    onDataChanged?.();
  };

  const handleEjecutarMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movForm.potrero_destino_id || !movForm.rodeo_id) return;

    // Calcular cuántos animales tiene ese rodeo
    const animalesDelRodeo = ganaderiaService.getAnimales().filter(a => a.rodeo_id === movForm.rodeo_id && a.estado === 'Activo');
    const cabezas = animalesDelRodeo.length > 0 ? animalesDelRodeo.length : 1;

    ganaderiaService.registrarMovimiento({
      tenant_id: 'default',
      rodeo_id: movForm.rodeo_id,
      potrero_origen_id: movForm.potrero_origen_id,
      potrero_destino_id: movForm.potrero_destino_id,
      cantidad_cabezas: cabezas,
      motivo: movForm.motivo,
      responsable: movForm.responsable,
      observaciones: movForm.observaciones
    });

    setPotreros(ganaderiaService.getPotreros());
    setMovimientos(ganaderiaService.getMovimientos());
    setModalMov(false);
    onDataChanged?.();
  };

  return (
    <div className="space-y-6">
      {/* HEADER CON BOTONES ACCIÓN */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#83A653]" />
            <h3 className="text-lg font-bold text-[#24382C]">Manejo de Potreros y Pastoreo Rotativo</h3>
          </div>
          <p className="text-xs text-[#74796D] mt-0.5">
            Cálculo instantáneo de carga en Equivalente Vaca por Hectárea (EV/ha) y registro ágil de cambios de potrero (FN-3.2 y FN-3.3).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setModalPotrero(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 border border-[#DDDCD1] hover:bg-[#F7F7F2] text-[#24382C] text-xs font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 text-[#83A653]" />
            Nuevo Potrero
          </button>
          <button
            onClick={() => setModalMov(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Mover Rodeo (2 toques)
          </button>
        </div>
      </div>

      {/* GRID DE POTREROS CON SEMÁFORO DE CARGA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {potreros.map(pot => {
          const carga = pot.carga_actual_ev_ha || 0;
          const receptividad = pot.receptividad_objetivo_ev_ha || 1.0;
          const pctUso = Math.min(100, Math.round((carga / receptividad) * 100));

          let badgeColor = 'bg-[#38845A]/15 text-[#38845A] border-[#38845A]/30';
          let statusText = 'Carga Óptima';
          if (pot.estado_pastoreo === 'Vacio') {
            badgeColor = 'bg-[#E9E5D9] text-[#74796D] border-[#DDDCD1]';
            statusText = 'En Descanso (Vacío)';
          } else if (pot.estado_pastoreo === 'Alerta') {
            badgeColor = 'bg-[#D9A441]/15 text-[#D9A441] border-[#D9A441]/30';
            statusText = 'Carga Próxima al Límite';
          } else if (pot.estado_pastoreo === 'Sobrepastoreo') {
            badgeColor = 'bg-[#C65B50]/15 text-[#C65B50] border-[#C65B50]/30';
            statusText = 'Sobrepastoreo Crítico';
          }

          return (
            <div key={pot.id} className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                    {statusText}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-[#74796D]">
                    <Clock className="w-3.5 h-3.5 text-[#83A653]" />
                    <span>{pot.dias_descanso_actual} días desc.</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-[#24382C] mb-1">{pot.nombre}</h4>
                <p className="text-xs text-[#74796D] flex items-center gap-1 mb-3">
                  <Trees className="w-3.5 h-3.5 text-[#536747]" />
                  {pot.recurso_forrajero}
                </p>

                {/* KPI METRICS */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#F7F7F2] rounded-xl mb-3 border border-[#DDDCD1]/60">
                  <div>
                    <span className="text-[10px] text-[#74796D] uppercase block">Superficie</span>
                    <span className="text-sm font-bold text-[#24382C]">{pot.superficie_ha} ha</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#74796D] uppercase block">Hacienda</span>
                    <span className="text-sm font-bold text-[#536747]">{pot.cabezas_actuales || 0} cabezas</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#74796D] uppercase block">Carga Instantánea</span>
                    <span className="text-sm font-mono font-bold text-[#83A653]">{carga.toFixed(2)} EV/ha</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#74796D] uppercase block">Receptividad Obj.</span>
                    <span className="text-sm font-mono text-[#74796D]">{receptividad.toFixed(2)} EV/ha</span>
                  </div>
                </div>

                {/* Barra de presión de pastoreo */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold mb-1 text-[#343B2D]">
                    <span>Presión Forrajera</span>
                    <span>{pctUso}%</span>
                  </div>
                  <div className="w-full bg-[#E9E5D9] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pctUso > 100 ? 'bg-[#C65B50]' : pctUso > 85 ? 'bg-[#D9A441]' : 'bg-[#83A653]'
                      }`}
                      style={{ width: `${Math.min(100, pctUso)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Botón rápido mover a este potrero */}
              <div className="pt-4 border-t border-[#DDDCD1]/60 mt-4">
                <button
                  onClick={() => {
                    setMovForm(prev => ({ ...prev, potrero_destino_id: pot.id }));
                    setModalMov(true);
                  }}
                  className="w-full py-1.5 text-xs font-bold text-[#536747] hover:text-[#24382C] bg-[#F7F7F2] hover:bg-[#E9E5D9] rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Mudar rodeo aquí
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* HISTORIAL RECIENTE DE MOVIMIENTOS (FN-3.3) */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] shadow-sm p-5">
        <h4 className="font-bold text-sm text-[#24382C] mb-3 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-[#83A653]" />
          Últimos Movimientos de Pastoreo Registrados
        </h4>
        {movimientos.length === 0 ? (
          <p className="text-xs text-[#74796D] italic">No hay movimientos registrados recientemente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#343B2D]">
              <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider border-b border-[#DDDCD1]">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Rodeo</th>
                  <th className="py-2.5 px-3">Origen</th>
                  <th className="py-2.5 px-3">Destino</th>
                  <th className="py-2.5 px-3 text-right">Cabezas</th>
                  <th className="py-2.5 px-3">Motivo</th>
                  <th className="py-2.5 px-3">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDCD1]">
                {movimientos.slice(0, 5).map(m => (
                  <tr key={m.id} className="hover:bg-[#F7F7F2]/60">
                    <td className="py-2.5 px-3 font-mono text-[#74796D]">
                      {new Date(m.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#24382C]">{m.rodeo_nombre}</td>
                    <td className="py-2.5 px-3 text-[#74796D]">{m.potrero_origen_nombre}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#536747]">{m.potrero_destino_nombre}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{m.cantidad_cabezas}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E9E5D9] text-[#24382C]">
                        {m.motivo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#74796D]">{m.responsable || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL MOVIMIENTO ÁGIL EN 2 TOQUES (FN-3.3) */}
      {modalMov && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleEjecutarMovimiento} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DDDCD1]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#83A653]/15 flex items-center justify-center text-[#83A653]">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#24382C]">Movimiento Ágil de Rodeo</h3>
                <p className="text-[11px] text-[#74796D]">Registro de campo en 2 toques (FN-3.3)</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Rodeo a Mover</label>
                <select
                  value={movForm.rodeo_id}
                  onChange={e => setMovForm({ ...movForm, rodeo_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-bold text-[#24382C] focus:outline-none focus:border-[#83A653]"
                >
                  {rodeos.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} ({r.finalidad})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Potrero Origen</label>
                  <select
                    value={movForm.potrero_origen_id}
                    onChange={e => setMovForm({ ...movForm, potrero_origen_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    {potreros.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Potrero Destino</label>
                  <select
                    value={movForm.potrero_destino_id}
                    onChange={e => setMovForm({ ...movForm, potrero_destino_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#83A653] bg-[#83A653]/5 font-bold rounded-lg focus:outline-none"
                  >
                    {potreros.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.superficie_ha} ha)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Motivo del Movimiento</label>
                <select
                  value={movForm.motivo}
                  onChange={e => setMovForm({ ...movForm, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                >
                  <option value="Rotación de pasturas">Rotación de pasturas / Descanso</option>
                  <option value="Encierre a corral">Encierre a corral / Destete</option>
                  <option value="Control de manga / Balanza">Control de manga / Balanza</option>
                  <option value="Sanitario">Tratamiento Sanitario</option>
                  <option value="Climático / Emergencia">Climático / Emergencia</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Responsable</label>
                <input
                  type="text"
                  value={movForm.responsable}
                  onChange={e => setMovForm({ ...movForm, responsable: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalMov(false)}
                className="px-4 py-2 border border-[#DDDCD1] rounded-lg text-xs font-semibold text-[#74796D] hover:bg-[#F7F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#83A653] hover:bg-[#536747] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Confirmar y Mudar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NUEVO POTRERO */}
      {modalPotrero && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCrearPotrero} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DDDCD1]">
            <h3 className="text-base font-bold text-[#24382C] mb-4">Nuevo Potrero Ganadero</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Nombre o Número de Potrero</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Potrero 5 - El Molino"
                  value={nuevoPotrero.nombre}
                  onChange={e => setNuevoPotrero({ ...nuevoPotrero, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Superficie (ha)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={nuevoPotrero.superficie_ha}
                    onChange={e => setNuevoPotrero({ ...nuevoPotrero, superficie_ha: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Receptividad Obj. (EV/ha)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={nuevoPotrero.receptividad_objetivo_ev_ha}
                    onChange={e => setNuevoPotrero({ ...nuevoPotrero, receptividad_objetivo_ev_ha: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Recurso Forrajero / Pastura</label>
                <input
                  type="text"
                  placeholder="Ej. Pastura Alfalfa / Festuca o Campo Natural"
                  value={nuevoPotrero.recurso_forrajero}
                  onChange={e => setNuevoPotrero({ ...nuevoPotrero, recurso_forrajero: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalPotrero(false)}
                className="px-4 py-2 border border-[#DDDCD1] rounded-lg text-xs font-semibold text-[#74796D] hover:bg-[#F7F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Crear Potrero
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
