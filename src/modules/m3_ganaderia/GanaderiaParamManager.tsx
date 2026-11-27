// ==============================================================================
// LANDA360: ADMINISTRADOR DE CATÁLOGOS PARAMÉTRICOS GANADEROS
// Configuración dinámica sin hardcoding (Categorías, Factores EV, Rodeos, Fármacos)
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { CategoriaGanadera, Rodeo, FarmacoVeterinario, PotreroGanadero } from '../../types/ganaderia';
import { Settings, Plus, Edit2, Trash2, ShieldCheck, HeartPulse, Layers, Compass } from 'lucide-react';

interface Props {
  onDataChanged?: () => void;
}

export const GanaderiaParamManager: React.FC<Props> = ({ onDataChanged }) => {
  const [tab, setTab] = useState<'categorias' | 'rodeos' | 'potreros' | 'farmacos'>('categorias');
  const [categorias, setCategorias] = useState<CategoriaGanadera[]>(ganaderiaService.getCategorias());
  const [rodeos, setRodeos] = useState<Rodeo[]>(ganaderiaService.getRodeos());
  const [potreros, setPotreros] = useState<PotreroGanadero[]>(ganaderiaService.getPotreros());
  const [farmacos, setFarmacos] = useState<FarmacoVeterinario[]>(ganaderiaService.getFarmacos());

  // Form states
  const [modalCat, setModalCat] = useState<boolean>(false);
  const [editCat, setEditCat] = useState<Partial<CategoriaGanadera>>({
    nombre: '',
    sexo: 'Macho',
    factor_ev: 1.0,
    peso_referencia_kg: 400,
    activo: true
  });

  const [modalRodeo, setModalRodeo] = useState<boolean>(false);
  const [editRodeo, setEditRodeo] = useState<Partial<Rodeo>>({
    nombre: '',
    finalidad: 'Cría',
    color_identificador: '#83A653',
    activo: true
  });

  const [modalPotrero, setModalPotrero] = useState<boolean>(false);
  const [editPotrero, setEditPotrero] = useState<Partial<PotreroGanadero>>({
    nombre: '',
    superficie_ha: 100,
    recurso_forrajero: 'Pastura Cultivada',
    receptividad_objetivo_ev_ha: 1.0,
    dias_descanso_actual: 0
  });

  const [modalFarmaco, setModalFarmaco] = useState<boolean>(false);
  const [editFarmaco, setEditFarmaco] = useState<Partial<FarmacoVeterinario>>({
    nombre_comercial: '',
    principio_activo: '',
    tipo: 'Vacuna',
    dias_carencia_faena: 0,
    activo: true
  });

  // Handlers Categorías
  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCat.nombre) return;
    const item: CategoriaGanadera = {
      id: editCat.id || `cat-${Date.now()}`,
      tenant_id: 'default',
      nombre: editCat.nombre,
      sexo: editCat.sexo || 'Macho',
      factor_ev: Number(editCat.factor_ev) || 1.0,
      peso_referencia_kg: Number(editCat.peso_referencia_kg) || 400,
      activo: editCat.activo !== undefined ? editCat.activo : true
    };
    const updated = ganaderiaService.saveCategoria(item);
    setCategorias(updated);
    setModalCat(false);
    onDataChanged?.();
  };

  const handleDeleteCat = (id: string, nombre: string) => {
    if (window.confirm(`¿Está seguro de eliminar la categoría "${nombre}"?`)) {
      const updated = ganaderiaService.deleteCategoria(id);
      setCategorias(updated);
      onDataChanged?.();
    }
  };

  // Handlers Rodeos
  const handleSaveRodeo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRodeo.nombre) return;
    const item: Rodeo = {
      id: editRodeo.id || `rod-${Date.now()}`,
      tenant_id: 'default',
      nombre: editRodeo.nombre,
      finalidad: editRodeo.finalidad || 'Cría',
      color_identificador: editRodeo.color_identificador || '#83A653',
      observaciones: editRodeo.observaciones || '',
      activo: true
    };
    const updated = ganaderiaService.saveRodeo(item);
    setRodeos(updated);
    setModalRodeo(false);
    onDataChanged?.();
  };

  const handleDeleteRodeo = (id: string, nombre: string) => {
    if (window.confirm(`¿Está seguro de eliminar el rodeo "${nombre}"?`)) {
      const updated = ganaderiaService.deleteRodeo(id);
      setRodeos(updated);
      onDataChanged?.();
    }
  };

  // Handlers Potreros
  const handleSavePotrero = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPotrero.nombre || !editPotrero.superficie_ha) return;
    const item: PotreroGanadero = {
      id: editPotrero.id || `pot-${Date.now()}`,
      tenant_id: 'default',
      nombre: editPotrero.nombre,
      superficie_ha: Number(editPotrero.superficie_ha),
      recurso_forrajero: editPotrero.recurso_forrajero || 'Campo Natural',
      receptividad_objetivo_ev_ha: Number(editPotrero.receptividad_objetivo_ev_ha) || 0.8,
      dias_descanso_actual: Number(editPotrero.dias_descanso_actual) || 0,
      activo: true
    };
    const updated = ganaderiaService.savePotrero(item);
    setPotreros(updated);
    setModalPotrero(false);
    onDataChanged?.();
  };

  const handleDeletePotrero = (id: string, nombre: string) => {
    if (window.confirm(`¿Está seguro de eliminar el potrero "${nombre}"?`)) {
      const updated = ganaderiaService.deletePotrero(id);
      setPotreros(updated);
      onDataChanged?.();
    }
  };

  // Handlers Fármacos
  const handleSaveFarmaco = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFarmaco.nombre_comercial) return;
    const item: FarmacoVeterinario = {
      id: editFarmaco.id || `far-${Date.now()}`,
      tenant_id: 'default',
      nombre_comercial: editFarmaco.nombre_comercial,
      principio_activo: editFarmaco.principio_activo || '',
      tipo: editFarmaco.tipo || 'Vacuna',
      dias_carencia_faena: Number(editFarmaco.dias_carencia_faena) || 0,
      dosis_sugerida: editFarmaco.dosis_sugerida || '',
      activo: true
    };
    const updated = ganaderiaService.saveFarmaco(item);
    setFarmacos(updated);
    setModalFarmaco(false);
    onDataChanged?.();
  };

  const handleDeleteFarmaco = (id: string, nombre: string) => {
    if (window.confirm(`¿Está seguro de eliminar el fármaco "${nombre}"?`)) {
      const updated = ganaderiaService.deleteFarmaco(id);
      setFarmacos(updated);
      onDataChanged?.();
    }
  };

  const handleLimpiarDatosResiduales = () => {
    if (window.confirm('¿Desea purgar registros huérfanos o de prueba anteriores? (Se vaciarán movimientos antiguos, pesadas de prueba y animales residuales manteniendo sus catálogos).')) {
      ganaderiaService.limpiarDatosDePrueba();
      setPotreros(ganaderiaService.getPotreros());
      onDataChanged?.();
      alert('Datos residuales purgados correctamente.');
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DDDCD1] shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#DDDCD1] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#83A653]" />
            <h3 className="text-lg font-bold text-[#343B2D]">Maestros Paramétricos de Ganadería</h3>
          </div>
          <p className="text-xs text-[#74796D] mt-0.5">
            Personalice categorías, factores de Equivalente Vaca (EV), rodeos y vademécum según el perfil de su establecimiento (cero hardcoding).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLimpiarDatosResiduales}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C65B50]/30 text-[#C65B50] hover:bg-[#C65B50]/10 text-xs font-semibold transition-all"
            title="Purgar registros residuales de prueba"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar Datos Residuales
          </button>

          {/* Selector de Tabs */}
          <div className="flex bg-[#E9E5D9] p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTab('categorias')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                tab === 'categorias' ? 'bg-[#24382C] text-white shadow-sm' : 'text-[#343B2D] hover:text-[#24382C]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Categorías & EV ({categorias.length})
            </button>
            <button
              onClick={() => setTab('rodeos')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                tab === 'rodeos' ? 'bg-[#24382C] text-white shadow-sm' : 'text-[#343B2D] hover:text-[#24382C]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Rodeos / Tropas ({rodeos.length})
            </button>
            <button
              onClick={() => setTab('potreros')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                tab === 'potreros' ? 'bg-[#24382C] text-white shadow-sm' : 'text-[#343B2D] hover:text-[#24382C]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Potreros ({potreros.length})
            </button>
            <button
              onClick={() => setTab('farmacos')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                tab === 'farmacos' ? 'bg-[#24382C] text-white shadow-sm' : 'text-[#343B2D] hover:text-[#24382C]'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              Vademécum & Carencia ({farmacos.length})
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO TAB CATEGORÍAS */}
      {tab === 'categorias' && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#74796D]">
              Defina las categorías de hacienda y su ponderación en Equivalente Vaca (EV) para el cálculo de receptividad forrajera.
            </span>
            <button
              onClick={() => {
                setEditCat({ nombre: '', sexo: 'Macho', factor_ev: 1.0, peso_referencia_kg: 400, activo: true });
                setModalCat(true);
              }}
              className="flex items-center gap-1 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Categoría
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#343B2D]">
              <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider border-b border-[#DDDCD1]">
                <tr>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Sexo</th>
                  <th className="py-2.5 px-3 text-right">Factor EV (📐)</th>
                  <th className="py-2.5 px-3 text-right">Peso Ref. (kg)</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDCD1]">
                {categorias.map(cat => (
                  <tr key={cat.id} className="hover:bg-[#F7F7F2]/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#24382C]">{cat.nombre}</td>
                    <td className="py-2.5 px-3">{cat.sexo}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#83A653]">{cat.factor_ev.toFixed(2)} EV</td>
                    <td className="py-2.5 px-3 text-right font-mono">{cat.peso_referencia_kg} kg</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        cat.activo ? 'bg-[#38845A]/15 text-[#38845A]' : 'bg-[#C65B50]/15 text-[#C65B50]'
                      }`}>
                        {cat.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => { setEditCat(cat); setModalCat(true); }}
                        className="p-1 text-[#74796D] hover:text-[#24382C] transition-colors mr-1"
                        title="Editar Categoría"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCat(cat.id, cat.nombre)}
                        className="p-1 text-[#74796D] hover:text-[#C65B50] transition-colors"
                        title="Eliminar Categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB RODEOS */}
      {tab === 'rodeos' && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#74796D]">
              Gestione los rodeos operativos o tropas de su campo (cría, invernada, cabaña, tambo).
            </span>
            <button
              onClick={() => {
                setEditRodeo({ nombre: '', finalidad: 'Cría', color_identificador: '#83A653', activo: true });
                setModalRodeo(true);
              }}
              className="flex items-center gap-1 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Rodeo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {rodeos.map(rod => (
              <div key={rod.id} className="p-3.5 rounded-xl border border-[#DDDCD1] bg-[#F7F7F2] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: rod.color_identificador || '#83A653' }}
                    />
                    <span className="text-[10px] font-bold text-[#74796D] uppercase px-2 py-0.5 bg-[#E9E5D9] rounded-md">
                      {rod.finalidad}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#24382C]">{rod.nombre}</h4>
                  {rod.observaciones && <p className="text-xs text-[#74796D] mt-1">{rod.observaciones}</p>}
                </div>
                <div className="flex justify-end gap-1 pt-2 border-t border-[#DDDCD1]/60 mt-3">
                  <button
                    onClick={() => { setEditRodeo(rod); setModalRodeo(true); }}
                    className="p-1 text-[#74796D] hover:text-[#24382C] transition-colors rounded hover:bg-[#E9E5D9]"
                    title="Editar Rodeo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRodeo(rod.id, rod.nombre)}
                    className="p-1 text-[#74796D] hover:text-[#C65B50] transition-colors rounded hover:bg-[#C65B50]/15"
                    title="Eliminar Rodeo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB POTREROS */}
      {tab === 'potreros' && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#74796D]">
              Catastro de potreros ganaderos: superficie, tipo de forraje y receptividad objetivo en EV/ha.
            </span>
            <button
              onClick={() => {
                setEditPotrero({ nombre: '', superficie_ha: 100, recurso_forrajero: 'Pastura Cultivada', receptividad_objetivo_ev_ha: 1.0, dias_descanso_actual: 0 });
                setModalPotrero(true);
              }}
              className="flex items-center gap-1 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Potrero
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#343B2D]">
              <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider border-b border-[#DDDCD1]">
                <tr>
                  <th className="py-2.5 px-3">Potrero</th>
                  <th className="py-2.5 px-3 text-right">Superficie (ha)</th>
                  <th className="py-2.5 px-3">Recurso Forrajero</th>
                  <th className="py-2.5 px-3 text-right">Receptividad (EV/ha)</th>
                  <th className="py-2.5 px-3 text-right">Días Descanso</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDCD1]">
                {potreros.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#74796D]">
                      No hay potreros registrados. Haga clic en "Nuevo Potrero" para agregar uno.
                    </td>
                  </tr>
                ) : (
                  potreros.map(pot => (
                    <tr key={pot.id} className="hover:bg-[#F7F7F2]/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#24382C]">{pot.nombre}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#24382C]">{pot.superficie_ha} ha</td>
                      <td className="py-2.5 px-3 text-[#74796D]">{pot.recurso_forrajero}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#83A653]">{pot.receptividad_objetivo_ev_ha} EV/ha</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#74796D]">{pot.dias_descanso_actual} días</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => { setEditPotrero(pot); setModalPotrero(true); }}
                          className="p-1 text-[#74796D] hover:text-[#24382C] transition-colors mr-1"
                          title="Editar Potrero"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePotrero(pot.id, pot.nombre)}
                          className="p-1 text-[#74796D] hover:text-[#C65B50] transition-colors"
                          title="Eliminar Potrero"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB FÁRMACOS */}
      {tab === 'farmacos' && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#74796D]">
              Vademécum veterinario: vacunas oficiales, antiparasitarios y tiempos de carencia pre-faena.
            </span>
            <button
              onClick={() => {
                setEditFarmaco({ nombre_comercial: '', principio_activo: '', tipo: 'Vacuna', dias_carencia_faena: 0, activo: true });
                setModalFarmaco(true);
              }}
              className="flex items-center gap-1 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Fármaco
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#343B2D]">
              <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider border-b border-[#DDDCD1]">
                <tr>
                  <th className="py-2.5 px-3">Producto Comercial</th>
                  <th className="py-2.5 px-3">Principio Activo</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Carencia Faena</th>
                  <th className="py-2.5 px-3">Dosis Sugerida</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDCD1]">
                {farmacos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#74796D]">
                      No hay fármacos registrados. Haga clic en "Nuevo Fármaco" para agregar uno.
                    </td>
                  </tr>
                ) : (
                  farmacos.map(f => (
                    <tr key={f.id} className="hover:bg-[#F7F7F2]/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#24382C]">{f.nombre_comercial}</td>
                      <td className="py-2.5 px-3 text-[#74796D]">{f.principio_activo || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E9E5D9] text-[#24382C]">
                          {f.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {f.dias_carencia_faena > 0 ? (
                          <span className="text-[#C65B50]">{f.dias_carencia_faena} días</span>
                        ) : (
                          <span className="text-[#38845A]">0 días (Libre)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#74796D]">{f.dosis_sugerida || 'Según indicación'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => { setEditFarmaco(f); setModalFarmaco(true); }}
                          className="p-1 text-[#74796D] hover:text-[#24382C] transition-colors mr-1"
                          title="Editar Fármaco"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFarmaco(f.id, f.nombre_comercial)}
                          className="p-1 text-[#74796D] hover:text-[#C65B50] transition-colors"
                          title="Eliminar Fármaco"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍA */}
      {modalCat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveCat} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DDDCD1]">
            <h3 className="text-base font-bold text-[#24382C] mb-4">
              {editCat.id ? 'Editar Categoría' : 'Nueva Categoría Ganadera'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Nombre de Categoría</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Vaquillona para servicio"
                  value={editCat.nombre}
                  onChange={e => setEditCat({ ...editCat, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Sexo</label>
                  <select
                    value={editCat.sexo}
                    onChange={e => setEditCat({ ...editCat, sexo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                    <option value="Indefinido">Indefinido</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Factor EV (Equiv. Vaca)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="3.0"
                    required
                    value={editCat.factor_ev}
                    onChange={e => setEditCat({ ...editCat, factor_ev: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Peso de Referencia (kg)</label>
                <input
                  type="number"
                  value={editCat.peso_referencia_kg}
                  onChange={e => setEditCat({ ...editCat, peso_referencia_kg: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalCat(false)}
                className="px-4 py-2 border border-[#DDDCD1] rounded-lg text-xs font-semibold text-[#74796D] hover:bg-[#F7F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Guardar Categoría
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL RODEO */}
      {modalRodeo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveRodeo} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DDDCD1]">
            <h3 className="text-base font-bold text-[#24382C] mb-4">
              {editRodeo.id ? 'Editar Rodeo' : 'Nuevo Rodeo / Tropa'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Nombre del Rodeo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Invernada Novillos Exportación"
                  value={editRodeo.nombre}
                  onChange={e => setEditRodeo({ ...editRodeo, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Finalidad</label>
                  <select
                    value={editRodeo.finalidad}
                    onChange={e => setEditRodeo({ ...editRodeo, finalidad: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    <option value="Cría">Cría</option>
                    <option value="Recría">Recría</option>
                    <option value="Invernada / Engorde">Invernada / Engorde</option>
                    <option value="Feedlot">Feedlot</option>
                    <option value="Cabaña">Cabaña</option>
                    <option value="Tambo">Tambo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Color Identificador</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editRodeo.color_identificador || '#83A653'}
                      onChange={e => setEditRodeo({ ...editRodeo, color_identificador: e.target.value })}
                      className="w-10 h-8 rounded border border-[#DDDCD1] cursor-pointer"
                    />
                    <span className="font-mono text-xs text-[#74796D]">{editRodeo.color_identificador}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={editRodeo.observaciones || ''}
                  onChange={e => setEditRodeo({ ...editRodeo, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalRodeo(false)}
                className="px-4 py-2 border border-[#DDDCD1] rounded-lg text-xs font-semibold text-[#74796D] hover:bg-[#F7F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Guardar Rodeo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL POTRERO */}
      {modalPotrero && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSavePotrero} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DDDCD1]">
            <h3 className="text-base font-bold text-[#24382C] mb-4">
              {editPotrero.id ? 'Editar Potrero Ganadero' : 'Nuevo Potrero Ganadero'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Nombre o Número de Potrero</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Potrero 1 - El Trébol"
                  value={editPotrero.nombre}
                  onChange={e => setEditPotrero({ ...editPotrero, nombre: e.target.value })}
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
                    value={editPotrero.superficie_ha}
                    onChange={e => setEditPotrero({ ...editPotrero, superficie_ha: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Receptividad Obj. (EV/ha)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editPotrero.receptividad_objetivo_ev_ha}
                    onChange={e => setEditPotrero({ ...editPotrero, receptividad_objetivo_ev_ha: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Recurso Forrajero / Pastura</label>
                <input
                  type="text"
                  placeholder="Ej. Alfalfa / Festuca o Campo Natural"
                  value={editPotrero.recurso_forrajero}
                  onChange={e => setEditPotrero({ ...editPotrero, recurso_forrajero: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Días de Descanso Acumulados</label>
                <input
                  type="number"
                  min="0"
                  value={editPotrero.dias_descanso_actual || 0}
                  onChange={e => setEditPotrero({ ...editPotrero, dias_descanso_actual: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
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
                Guardar Potrero
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL FÁRMACO */}
      {modalFarmaco && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveFarmaco} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DDDCD1]">
            <h3 className="text-base font-bold text-[#24382C] mb-4">
              {editFarmaco.id ? 'Editar Fármaco' : 'Nuevo Fármaco Veterinario'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Vacuna Anticarbunclosa Pasteur"
                  value={editFarmaco.nombre_comercial}
                  onChange={e => setEditFarmaco({ ...editFarmaco, nombre_comercial: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Tipo</label>
                  <select
                    value={editFarmaco.tipo}
                    onChange={e => setEditFarmaco({ ...editFarmaco, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    <option value="Vacuna">Vacuna</option>
                    <option value="Antiparasitario">Antiparasitario</option>
                    <option value="Antibiótico">Antibiótico</option>
                    <option value="Vitamínico / Mineral">Vitamínico / Mineral</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Días Carencia Faena</label>
                  <input
                    type="number"
                    min="0"
                    value={editFarmaco.dias_carencia_faena}
                    onChange={e => setEditFarmaco({ ...editFarmaco, dias_carencia_faena: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Principio Activo</label>
                <input
                  type="text"
                  value={editFarmaco.principio_activo || ''}
                  onChange={e => setEditFarmaco({ ...editFarmaco, principio_activo: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalFarmaco(false)}
                className="px-4 py-2 border border-[#DDDCD1] rounded-lg text-xs font-semibold text-[#74796D] hover:bg-[#F7F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Guardar Fármaco
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
