// ==============================================================================
// LANDA360: FN-3.7 FICHA INDIVIDUAL DE ANIMAL Y TRAZABILIDAD DE VIDA
// Historial cronológico de pesadas, cambios de potrero, sanidad y genealogía
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { Animal, PesadaAnimal, EventoSanitario } from '../../types/ganaderia';
import { Award, ArrowLeft, HeartPulse, Scale } from 'lucide-react';

interface Props {
  animalInicial?: Animal | null;
  onVolver?: () => void;
}

export const FichaAnimalView: React.FC<Props> = ({ animalInicial, onVolver }) => {
  const [animales] = useState<Animal[]>(ganaderiaService.getAnimales());
  const [animalActivo, setAnimalActivo] = useState<Animal | null>(animalInicial || (animales.length > 0 ? animales[0] : null));
  const [pesadas] = useState<PesadaAnimal[]>(ganaderiaService.getPesadas());
  const [eventosSanitarios] = useState<EventoSanitario[]>(ganaderiaService.getEventosSanitarios());

  if (!animalActivo || animales.length === 0) {
    return (
      <div className="bg-[#FFFFFF] rounded-2xl border border-dashed border-[#DDDCD1] p-12 text-center text-[#74796D] shadow-sm">
        <Award className="w-12 h-12 text-[#B6A77D] mx-auto mb-3 opacity-50" />
        <h4 className="font-bold text-base text-[#24382C] mb-1">No hay animales en el inventario</h4>
        <p className="text-xs max-w-sm mx-auto mb-4">
          Para visualizar fichas individuales con trazabilidad, cargue primero un archivo de bastón Tru-Test en la pestaña RFID o registre un animal en el inventario.
        </p>
        {onVolver && (
          <button
            onClick={onVolver}
            className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold rounded-xl transition-all"
          >
            Ir al Inventario
          </button>
        )}
      </div>
    );
  }

  // Filtrar eventos de este animal
  const historialPesadas = pesadas.filter(p => p.animal_id === animalActivo.id);
  const historialSanitario = eventosSanitarios.filter(s => s.animal_id === animalActivo.id || s.rodeo_id === animalActivo.rodeo_id);

  return (
    <div className="space-y-6">
      {/* HEADER & SELECTOR DE ANIMAL */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onVolver && (
            <button
              onClick={onVolver}
              className="p-2 border border-[#DDDCD1] hover:bg-[#F7F7F2] rounded-xl text-[#74796D] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#83A653]" />
              <h3 className="text-lg font-bold text-[#24382C]">Ficha Individual & Trazabilidad de Vida</h3>
            </div>
            <p className="text-xs text-[#74796D] mt-0.5">
              FN-3.7: Hoja de vida completa, genealogía, pesadas históricas y eventos sanitarios.
            </p>
          </div>
        </div>

        {/* Selector rápido de animal */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-[#74796D] whitespace-nowrap">Cambiar animal:</span>
          <select
            value={animalActivo.id}
            onChange={e => {
              const a = animales.find(item => item.id === e.target.value);
              if (a) setAnimalActivo(a);
            }}
            className="text-xs px-3 py-2 border border-[#DDDCD1] rounded-xl font-bold text-[#24382C] focus:outline-none focus:border-[#83A653] w-full md:w-60"
          >
            {animales.map(a => (
              <option key={a.id} value={a.id}>
                {a.caravana_visual} ({a.categoria_nombre || a.raza}) - {a.peso_actual_kg} kg
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TARJETA DE IDENTIFICACIÓN & GENEALOGÍA */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-[#DDDCD1] gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#24382C] text-[#F7F7F2] flex flex-col items-center justify-center font-bold font-mono">
              <span className="text-[10px] text-[#83A653] uppercase">Caravana</span>
              <span className="text-lg">{animalActivo.caravana_visual}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-[#83A653]/15 text-[#38845A] font-bold text-xs rounded-full">
                  {animalActivo.estado}
                </span>
                <span className="text-xs text-[#74796D]">•</span>
                <span className="text-xs font-semibold text-[#24382C]">{animalActivo.raza}</span>
                <span className="text-xs text-[#74796D]">({animalActivo.sexo})</span>
              </div>
              <p className="text-xs text-[#74796D] font-mono">
                Transponder RFID ISO: <span className="text-[#536747] font-bold">{animalActivo.caravana_rfid || 'Sin Chip'}</span>
              </p>
              {(animalActivo.condicion_corporal || animalActivo.tacto) && (
                <div className="flex items-center gap-2 mt-1 text-xs">
                  {animalActivo.condicion_corporal && (
                    <span className="px-2 py-0.5 bg-[#B6A77D]/20 text-[#343B2D] rounded-full font-bold">
                      Condición Corporal: {animalActivo.condicion_corporal}/9
                    </span>
                  )}
                  {animalActivo.tacto && (
                    <span className="px-2 py-0.5 bg-[#38845A]/15 text-[#38845A] rounded-full font-bold">
                      Tacto: {animalActivo.tacto}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] text-[#74796D] uppercase block">Peso Actual</span>
              <span className="text-2xl font-bold font-mono text-[#24382C]">{animalActivo.peso_actual_kg} kg</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#74796D] uppercase block">Ganancia Diaria (GDP)</span>
              <span className="text-2xl font-bold font-mono text-[#83A653]">+{animalActivo.gdp_historica_kg_dia.toFixed(3)} kg/d</span>
            </div>
          </div>
        </div>

        {/* METADATOS Y GENEALOGÍA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-2 text-xs">
          <div className="p-3 bg-[#F7F7F2] rounded-xl border border-[#DDDCD1]/60">
            <span className="text-[10px] text-[#74796D] uppercase block">Categoría Asignada</span>
            <span className="font-bold text-[#24382C]">{animalActivo.categoria_nombre || 'General'}</span>
            <span className="text-[10px] text-[#83A653] font-bold block mt-0.5">Factor: {(animalActivo.factor_ev || 1.0).toFixed(2)} EV</span>
          </div>

          <div className="p-3 bg-[#F7F7F2] rounded-xl border border-[#DDDCD1]/60">
            <span className="text-[10px] text-[#74796D] uppercase block">Rodeo y Potrero</span>
            <span className="font-bold text-[#24382C] block">{animalActivo.rodeo_nombre || 'Sin rodeo'}</span>
            <span className="text-[11px] text-[#536747] block mt-0.5">{animalActivo.potrero_nombre || 'Sin potrero'}</span>
          </div>

          <div className="p-3 bg-[#F7F7F2] rounded-xl border border-[#DDDCD1]/60">
            <span className="text-[10px] text-[#74796D] uppercase block">Origen y Nacimiento</span>
            <span className="font-bold text-[#24382C] block">{animalActivo.origen}</span>
            <span className="text-[11px] text-[#74796D] block mt-0.5">{animalActivo.fecha_nacimiento || 'Fecha no informada'}</span>
          </div>

          <div className="p-3 bg-[#F7F7F2] rounded-xl border border-[#DDDCD1]/60">
            <span className="text-[10px] text-[#74796D] uppercase block">Genealogía / Padres</span>
            <span className="text-[#343B2D] block">Madre: <b className="font-mono">{animalActivo.madre_caravana || 'Desconocida'}</b></span>
            <span className="text-[#343B2D] block">Padre: <b className="font-mono">{animalActivo.padre_caravana || 'Desconocido'}</b></span>
          </div>
        </div>
      </div>

      {/* LÍNEA DE TIEMPO: HISTORIAL DE PESADAS & SANIDAD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HISTORIAL DE PESADAS */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-4 h-4 text-[#83A653]" />
            <h4 className="font-bold text-sm text-[#24382C]">Historial de Pesadas & Curva de Peso</h4>
          </div>

          {historialPesadas.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#74796D] bg-[#F7F7F2] rounded-xl border border-dashed border-[#DDDCD1]">
              Peso inicial registrado: <b>{animalActivo.peso_actual_kg} kg</b> ({animalActivo.fecha_ultima_pesada || 'Hoy'}).
              <br />Las pesadas futuras en manga calcularán la GDP automáticamente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#343B2D]">
                <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider border-b border-[#DDDCD1]">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3 text-right">Peso (kg)</th>
                    <th className="py-2.5 px-3 text-right">Días</th>
                    <th className="py-2.5 px-3 text-right">GDP (kg/d)</th>
                    <th className="py-2.5 px-3">Balanza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDCD1]">
                  {historialPesadas.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono">{p.fecha}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#24382C]">{p.peso_kg} kg</td>
                      <td className="py-2 px-3 text-right font-mono text-[#74796D]">{p.dias_transcurridos || '-'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#83A653]">
                        {p.gdp_kg_dia !== undefined ? `+${p.gdp_kg_dia.toFixed(3)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-[#74796D] text-[11px]">{p.origen_pesada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* EVENTOS SANITARIOS APLICADOS */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse className="w-4 h-4 text-[#C65B50]" />
            <h4 className="font-bold text-sm text-[#24382C]">Tratamientos y Vacunaciones</h4>
          </div>

          {historialSanitario.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#74796D] bg-[#F7F7F2] rounded-xl border border-dashed border-[#DDDCD1]">
              Sin intervenciones sanitarias o vacunas pendientes para este animal.
            </div>
          ) : (
            <div className="space-y-2.5">
              {historialSanitario.map(s => (
                <div key={s.id} className="p-3 bg-[#F7F7F2] rounded-xl border border-[#DDDCD1]/60 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-[#24382C]">{s.farmaco_nombre}</h5>
                    <p className="text-[11px] text-[#74796D]">
                      Aplicado: {s.fecha} • {s.dosis_aplicada || 'Dosis reglamentaria'}
                    </p>
                  </div>
                  <div className="text-right">
                    {s.fecha_fin_carencia ? (
                      <span className="text-[10px] font-bold text-[#C65B50] bg-[#C65B50]/10 px-2 py-0.5 rounded-full block">
                        Carencia hasta {s.fecha_fin_carencia}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#38845A] bg-[#38845A]/10 px-2 py-0.5 rounded-full block">
                        Libre de Carencia
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
