// ==============================================================================
// LANDA360: FN-3.1 INVENTARIO DE HACIENDA Y CONTROL DE RODEOS
// Control de stock de cabezas vivas, altas, bajas, mortandad y clasificación
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { Animal, CategoriaGanadera, Rodeo } from '../../types/ganaderia';
import { Users, Filter, Plus, ShieldAlert, Award, Trash2 } from 'lucide-react';

interface Props {
  onSelectAnimal?: (animal: Animal) => void;
  onRefresh?: () => void;
}

export const InventarioRodeosView: React.FC<Props> = ({ onSelectAnimal, onRefresh }) => {
  const [animales, setAnimales] = useState<Animal[]>(ganaderiaService.getAnimales());
  const [categorias] = useState<CategoriaGanadera[]>(ganaderiaService.getCategorias());
  const [rodeos] = useState<Rodeo[]>(ganaderiaService.getRodeos());

  const [filtroRodeo, setFiltroRodeo] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  const handleLimpiarBase = () => {
    if (window.confirm('¿Está seguro de que desea eliminar todos los animales y pesadas registradas? Esta acción dejará el inventario en 0.')) {
      ganaderiaService.limpiarDatosDePrueba();
      setAnimales([]);
      onRefresh?.();
    }
  };

  // Modal Alta Rápida de Animal
  const [modalAlta, setModalAlta] = useState(false);
  const [nuevoAnimal, setNuevoAnimal] = useState<Partial<Animal>>({
    caravana_visual: '',
    caravana_rfid: '',
    categoria_id: categorias[0]?.id || '',
    rodeo_id: rodeos[0]?.id || '',
    raza: 'Angus Negro',
    sexo: 'Hembra',
    peso_actual_kg: 400,
    origen: 'Propio (Nacido)',
    estado: 'Activo'
  });

  const handleAltaAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoAnimal.caravana_visual) return;

    const cat = categorias.find(c => c.id === nuevoAnimal.categoria_id);
    const rod = rodeos.find(r => r.id === nuevoAnimal.rodeo_id);

    const a: Animal = {
      id: `ani-${Date.now()}`,
      tenant_id: 'default',
      caravana_visual: nuevoAnimal.caravana_visual,
      caravana_rfid: nuevoAnimal.caravana_rfid || undefined,
      categoria_id: nuevoAnimal.categoria_id || '',
      categoria_nombre: cat?.nombre,
      factor_ev: cat?.factor_ev || 1.0,
      rodeo_id: nuevoAnimal.rodeo_id || '',
      rodeo_nombre: rod?.nombre,
      raza: nuevoAnimal.raza || 'Angus Negro',
      sexo: nuevoAnimal.sexo || 'Hembra',
      peso_actual_kg: Number(nuevoAnimal.peso_actual_kg) || 0,
      fecha_ultima_pesada: new Date().toISOString().split('T')[0],
      gdp_historica_kg_dia: 0,
      estado: 'Activo',
      origen: nuevoAnimal.origen || 'Propio (Nacido)'
    };

    const updated = ganaderiaService.saveAnimal(a);
    setAnimales(updated);
    setModalAlta(false);
    onRefresh?.();
  };

  // Filtrado
  const animalesFiltrados = animales.filter(a => {
    if (filtroRodeo !== 'todos' && a.rodeo_id !== filtroRodeo) return false;
    if (filtroCategoria !== 'todos' && a.categoria_id !== filtroCategoria) return false;
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase();
      const matchVis = a.caravana_visual.toLowerCase().includes(q);
      const matchRfid = a.caravana_rfid?.toLowerCase().includes(q) || false;
      const matchRaza = a.raza.toLowerCase().includes(q);
      if (!matchVis && !matchRfid && !matchRaza) return false;
    }
    return true;
  });

  // Métricas de stock
  const totalCabezas = animales.filter(a => a.estado === 'Activo').length;
  const totalEV = animales
    .filter(a => a.estado === 'Activo')
    .reduce((acc, a) => acc + (a.factor_ev || 1.0), 0);
  const pesoPromedio = totalCabezas > 0
    ? (animales.filter(a => a.estado === 'Activo').reduce((acc, a) => acc + a.peso_actual_kg, 0) / totalCabezas).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* TARJETAS KPI DE STOCK GANADERO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#83A653]/15 flex items-center justify-center text-[#83A653]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Stock Total Activo</p>
            <p className="text-2xl font-bold text-[#24382C]">{totalCabezas} <span className="text-sm font-normal text-[#74796D]">cabezas</span></p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#536747]/15 flex items-center justify-center text-[#536747]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Carga Global Total</p>
            <p className="text-2xl font-bold text-[#536747]">{totalEV.toFixed(1)} <span className="text-sm font-normal text-[#74796D]">EV</span></p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#B6A77D]/20 flex items-center justify-center text-[#83A653]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Peso Promedio Lote</p>
            <p className="text-2xl font-bold text-[#24382C]">{pesoPromedio} <span className="text-sm font-normal text-[#74796D]">kg</span></p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#24382C]/10 flex items-center justify-center text-[#24382C]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Rodeos Activos</p>
            <p className="text-2xl font-bold text-[#24382C]">{rodeos.length} <span className="text-sm font-normal text-[#74796D]">tropas</span></p>
          </div>
        </div>
      </div>

      {/* CONTROLES DE FILTRO Y ACCIONES */}
      <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DDDCD1] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Buscar caravana visual, RFID, raza..."
              value={filtroBusqueda}
              onChange={e => setFiltroBusqueda(e.target.value)}
              className="w-full text-xs px-3 py-2 pl-8 border border-[#DDDCD1] rounded-xl focus:outline-none focus:border-[#83A653]"
            />
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#74796D]" />
          </div>

          <select
            value={filtroRodeo}
            onChange={e => setFiltroRodeo(e.target.value)}
            className="text-xs px-3 py-2 border border-[#DDDCD1] rounded-xl focus:outline-none focus:border-[#83A653] text-[#343B2D]"
          >
            <option value="todos">Todos los Rodeos</option>
            {rodeos.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>

          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            className="text-xs px-3 py-2 border border-[#DDDCD1] rounded-xl focus:outline-none focus:border-[#83A653] text-[#343B2D]"
          >
            <option value="todos">Todas las Categorías</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {animales.length > 0 && (
            <button
              onClick={handleLimpiarBase}
              className="flex items-center justify-center gap-1.5 px-3 py-2 border border-[#C65B50]/30 text-[#C65B50] hover:bg-[#C65B50]/10 text-xs font-semibold rounded-xl transition-all"
              title="Vaciar inventario y resetear datos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Vaciar Datos
            </button>
          )}

          <button
            onClick={() => setModalAlta(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Animal
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE INVENTARIO */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DDDCD1] flex justify-between items-center bg-[#F7F7F2]/60">
          <h3 className="font-bold text-sm text-[#24382C]">
            Existencias de Hacienda ({animalesFiltrados.length} animales listados)
          </h3>
          <span className="text-xs text-[#74796D]">FN-3.1 Control de Rodeos y Trazabilidad</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#343B2D]">
            <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider border-b border-[#DDDCD1]">
              <tr>
                <th className="py-3 px-4">Caravana Visual</th>
                <th className="py-3 px-4">Chip RFID</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Rodeo</th>
                <th className="py-3 px-4">Potrero Actual</th>
                <th className="py-3 px-4 text-center">Condición</th>
                <th className="py-3 px-4">Tacto</th>
                <th className="py-3 px-4 text-right">Peso Actual</th>
                <th className="py-3 px-4 text-right">Factor EV</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDCD1]">
              {animalesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#74796D]">
                    <Users className="w-10 h-10 text-[#B6A77D] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#24382C]">No hay animales en el inventario</p>
                    <p className="text-xs text-[#74796D] mt-1 max-w-sm mx-auto">
                      Suba un archivo de bastón Tru-Test en la pestaña <b>"FN-3.4 Bastón RFID"</b> o registre un animal con el botón superior.
                    </p>
                  </td>
                </tr>
              ) : (
                animalesFiltrados.map(a => (
                  <tr key={a.id} className="hover:bg-[#F7F7F2]/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#24382C]">
                      <span className="px-2 py-0.5 bg-[#E9E5D9] rounded-md text-xs font-mono">
                        {a.caravana_visual}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#74796D]">
                      {a.caravana_rfid ? (
                        <span className="text-[#536747] font-semibold">{a.caravana_rfid}</span>
                      ) : (
                        <span className="italic text-gray-400">Sin chip</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">{a.categoria_nombre || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#24382C]/10 text-[#24382C]">
                        {a.rodeo_nombre || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#74796D]">{a.potrero_nombre || 'Sin asignar'}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {a.condicion_corporal ? (
                        <span className="px-2 py-0.5 bg-[#B6A77D]/20 text-[#343B2D] rounded-full font-bold">
                          {a.condicion_corporal}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {a.tacto ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.tacto === 'PRENADA' ? 'bg-[#38845A]/15 text-[#38845A]' :
                          a.tacto === 'CICLICA' ? 'bg-[#52849A]/15 text-[#52849A]' :
                          'bg-[#C65B50]/15 text-[#C65B50]'
                        }`}>
                          {a.tacto}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#24382C]">
                      {a.peso_actual_kg > 0 ? `${a.peso_actual_kg} kg` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#83A653]">
                      {(a.factor_ev || 1.0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectAnimal?.(a)}
                        className="px-2.5 py-1 bg-[#83A653]/15 hover:bg-[#83A653] text-[#24382C] hover:text-white rounded-lg text-[11px] font-semibold transition-all"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ALTA RÁPIDA */}
      {modalAlta && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAltaAnimal} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#DDDCD1]">
            <h3 className="text-base font-bold text-[#24382C] mb-4">Registrar Nuevo Animal</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Caravana Visual (Tarjeta)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. A-105 o 3482"
                    value={nuevoAnimal.caravana_visual}
                    onChange={e => setNuevoAnimal({ ...nuevoAnimal, caravana_visual: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Chip Electrónico RFID</label>
                  <input
                    type="text"
                    placeholder="Ej. 982000412891008"
                    value={nuevoAnimal.caravana_rfid}
                    onChange={e => setNuevoAnimal({ ...nuevoAnimal, caravana_rfid: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Categoría</label>
                  <select
                    value={nuevoAnimal.categoria_id}
                    onChange={e => setNuevoAnimal({ ...nuevoAnimal, categoria_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.factor_ev} EV)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Rodeo Asignado</label>
                  <select
                    value={nuevoAnimal.rodeo_id}
                    onChange={e => setNuevoAnimal({ ...nuevoAnimal, rodeo_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    {rodeos.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Raza</label>
                  <input
                    type="text"
                    value={nuevoAnimal.raza}
                    onChange={e => setNuevoAnimal({ ...nuevoAnimal, raza: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Sexo</label>
                  <select
                    value={nuevoAnimal.sexo}
                    onChange={e => setNuevoAnimal({ ...nuevoAnimal, sexo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    <option value="Hembra">Hembra</option>
                    <option value="Macho">Macho</option>
                    <option value="Indefinido">Indefinido</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Peso Inicial (kg)</label>
                  <input
                    type="number"
                    value={nuevoAnimal.peso_actual_kg}
                    onChange={e => setNuevoAnimal({ ...nuevoAnimal, peso_actual_kg: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalAlta(false)}
                className="px-4 py-2 border border-[#DDDCD1] rounded-lg text-xs font-semibold text-[#74796D] hover:bg-[#F7F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Guardar en Inventario
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
