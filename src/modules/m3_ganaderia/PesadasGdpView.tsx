// ==============================================================================
// LANDA360: FN-3.6 PESADAS PERIÓDICAS Y GANANCIA DIARIA DE PESO (GDP)
// Algoritmo: GDP (kg/día) = (Peso Actual - Peso Anterior) / Días Transcurridos
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { Animal, PesadaAnimal } from '../../types/ganaderia';
import { Scale, TrendingUp, Plus, Award } from 'lucide-react';

export const PesadasGdpView: React.FC = () => {
  const [pesadas, setPesadas] = useState<PesadaAnimal[]>(ganaderiaService.getPesadas());
  const [animales] = useState<Animal[]>(ganaderiaService.getAnimales());

  const [modalPesada, setModalPesada] = useState(false);
  const [formPesada, setFormPesada] = useState({
    animal_id: animales[0]?.id || '',
    fecha: new Date().toISOString().split('T')[0],
    peso_kg: 400,
    origen_pesada: 'Balanza Electrónica Manga',
    observaciones: ''
  });

  const handleGuardarPesada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPesada.animal_id || !formPesada.peso_kg) return;

    ganaderiaService.registrarPesada({
      animal_id: formPesada.animal_id,
      fecha: formPesada.fecha,
      peso_kg: Number(formPesada.peso_kg),
      origen_pesada: formPesada.origen_pesada,
      observaciones: formPesada.observaciones
    });

    setPesadas(ganaderiaService.getPesadas());
    setModalPesada(false);
  };

  // Promedio GDP del establecimiento
  const pesadasConGdp = pesadas.filter(p => p.gdp_kg_dia !== undefined && p.gdp_kg_dia !== 0);
  const gdpPromedio = pesadasConGdp.length > 0
    ? (pesadasConGdp.reduce((acc, p) => acc + (p.gdp_kg_dia || 0), 0) / pesadasConGdp.length).toFixed(3)
    : '0.000';

  return (
    <div className="space-y-6">
      {/* HEADER & RESUMEN DE GDP */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#83A653]" />
            <h3 className="text-lg font-bold text-[#24382C]">Control de Pesadas & Ganancia Diaria de Peso (GDP)</h3>
          </div>
          <p className="text-xs text-[#74796D] mt-0.5">
            Cálculo algorítmico continuo de GDP (kg/día) para evaluación nutricional y eficiencia de conversión (FN-3.6).
          </p>
        </div>

        <button
          onClick={() => setModalPesada(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Registrar Pesada Manual
        </button>
      </div>

      {/* MÉTRICAS CLAVE GDP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#83A653]/15 flex items-center justify-center text-[#83A653]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">GDP Promedio Campo</p>
            <p className="text-2xl font-bold font-mono text-[#24382C]">+{gdpPromedio} <span className="text-sm font-normal text-[#74796D]">kg/día</span></p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#536747]/15 flex items-center justify-center text-[#536747]">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Pesadas Totales</p>
            <p className="text-2xl font-bold font-mono text-[#536747]">{pesadas.length} <span className="text-sm font-normal text-[#74796D]">registros</span></p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#B6A77D]/20 flex items-center justify-center text-[#83A653]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Fórmula Oficial</p>
            <p className="text-xs font-mono font-bold text-[#24382C]">GDP = (P_act - P_ant) / ΔDías</p>
          </div>
        </div>
      </div>

      {/* TABLA DE PESADAS */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DDDCD1] flex justify-between items-center bg-[#F7F7F2]/60">
          <h4 className="font-bold text-sm text-[#24382C]">Registro Histórico de Pesadas</h4>
          <span className="text-xs text-[#74796D]">FN-3.6 Balanza y Nutrición</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#343B2D]">
            <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider border-b border-[#DDDCD1]">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Caravana Visual</th>
                <th className="py-3 px-4">Chip RFID</th>
                <th className="py-3 px-4 text-right">Peso Anterior</th>
                <th className="py-3 px-4 text-right">Peso Registrado</th>
                <th className="py-3 px-4 text-right">Días Inter-Pesada</th>
                <th className="py-3 px-4 text-right">GDP Resultante (📐)</th>
                <th className="py-3 px-4">Origen / Equipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDCD1]">
              {pesadas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#74796D]">
                    No hay pesadas registradas aún. Registre una pesada manual o ingeste un archivo RFID desde la manga.
                  </td>
                </tr>
              ) : (
                pesadas.map(p => (
                  <tr key={p.id} className="hover:bg-[#F7F7F2]/60">
                    <td className="py-3 px-4 font-mono text-[#74796D]">{p.fecha}</td>
                    <td className="py-3 px-4 font-bold text-[#24382C]">{p.caravana_visual}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#536747]">{p.caravana_rfid || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#74796D]">{p.peso_anterior_kg ? `${p.peso_anterior_kg} kg` : '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#24382C]">{p.peso_kg} kg</td>
                    <td className="py-3 px-4 text-right font-mono text-[#74796D]">{p.dias_transcurridos || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {p.gdp_kg_dia !== undefined ? (
                        <span className={p.gdp_kg_dia >= 0 ? 'text-[#38845A]' : 'text-[#C65B50]'}>
                          {p.gdp_kg_dia >= 0 ? `+${p.gdp_kg_dia.toFixed(3)}` : p.gdp_kg_dia.toFixed(3)} kg/d
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-[#74796D] text-[11px]">{p.origen_pesada}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR PESADA */}
      {modalPesada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleGuardarPesada} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DDDCD1]">
            <h3 className="text-base font-bold text-[#24382C] mb-4">Registrar Pesada Individual</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Animal</label>
                <select
                  value={formPesada.animal_id}
                  onChange={e => setFormPesada({ ...formPesada, animal_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-bold text-[#24382C] focus:outline-none focus:border-[#83A653]"
                >
                  {animales.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.caravana_visual} ({a.categoria_nombre}) - Actual: {a.peso_actual_kg} kg
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formPesada.fecha}
                    onChange={e => setFormPesada({ ...formPesada, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Nuevo Peso (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formPesada.peso_kg}
                    onChange={e => setFormPesada({ ...formPesada, peso_kg: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Origen / Dispositivo</label>
                <select
                  value={formPesada.origen_pesada}
                  onChange={e => setFormPesada({ ...formPesada, origen_pesada: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                >
                  <option value="Balanza Electrónica Manga">Balanza Electrónica Manga (Tru-Test)</option>
                  <option value="Bastón RFID Tru-Test">Bastón RFID Tru-Test</option>
                  <option value="Manual / Ocular">Estimación Manual / Ocular</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalPesada(false)}
                className="px-4 py-2 border border-[#DDDCD1] rounded-lg text-xs font-semibold text-[#74796D] hover:bg-[#F7F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Guardar y Calcular GDP
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
