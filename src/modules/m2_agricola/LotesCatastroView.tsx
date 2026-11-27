import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import { agricolaService } from '../../services/agricolaService';
import { Lote, Cultivo, Campana, AptitudLote } from '../../types/agricola';
import { KmlImporterModal } from './KmlImporterModal';
import { 
  MapPin, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar,
  ShieldAlert
} from 'lucide-react';

export const LotesCatastroView: React.FC = () => {
  const { tenant, rolActivo } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant-id';

  // Control de Permisos RBAC: Dueño / Agrónomo = Edición; Capataz = Solo Lectura
  const puedeEditar = rolActivo?.nombre.toLowerCase().includes('dueño') || 
                      rolActivo?.nombre.toLowerCase().includes('agrónomo') || 
                      rolActivo?.nombre.toLowerCase().includes('administrador') ||
                      rolActivo?.funcionesIds.includes('fn_2_1_catastro_lotes');

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [campanaSeleccionadaId, setCampanaSeleccionadaId] = useState<string>('');
  const [capaMapa, setCapaMapa] = useState<'google' | 'esri' | 'osm'>('google');
  const [modalKmlOpen, setModalKmlOpen] = useState(false);
  const [modalLoteManualOpen, setModalLoteManualOpen] = useState(false);
  const [loteEnEdicion, setLoteEnEdicion] = useState<Lote | null>(null);

  // Formulario manual
  const [formLote, setFormLote] = useState<{
    nombre: string;
    superficieHa: number;
    cultivoId?: string;
    aptitud: AptitudLote;
    notas: string;
  }>({
    nombre: '',
    superficieHa: 0,
    cultivoId: '',
    aptitud: 'agricola',
    notas: ''
  });

  // Referencias de Leaflet
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geojsonLayersGroupRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const cargarDatos = async () => {
    try {
      const [cultivosData, campanasData] = await Promise.all([
        agricolaService.obtenerCultivos(tenantId),
        agricolaService.obtenerCampanas(tenantId)
      ]);
      setCultivos(cultivosData);
      setCampanas(campanasData);

      const activa = campanasData.find(c => c.activa) || campanasData[0];
      const campId = activa ? activa.id : '';
      setCampanaSeleccionadaId(campId);

      const lotesData = await agricolaService.obtenerLotes(tenantId, campId);
      setLotes(lotesData);
    } catch (err) {
      console.error('Error al cargar catastro:', err);
    }
  };

  const cambiarCampana = async (campId: string) => {
    setCampanaSeleccionadaId(campId);
    try {
      const lotesData = await agricolaService.obtenerLotes(tenantId, campId);
      setLotes(lotesData);
    } catch (err) {
      console.error('Error al cambiar campaña:', err);
    }
  };

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN DEL MAPA LEAFLET CON SATÉLITE HD & CAPAS DINÁMICAS
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-35.473, -60.718], // Coordenadas del archivo real Export 2026-11-04 (El Diluvio)
        zoom: 13,
        zoomControl: true
      });

      // Capa Inicial Predeterminada: Google Satelital Híbrido (100% Gratuito, Sin API Key, Satélite + Rutas)
      const initialLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: 'Tiles &copy; Google Maps &mdash; Catastro Landa360',
        maxZoom: 20
      }).addTo(map);

      tileLayerRef.current = initialLayer;
      geojsonLayersGroupRef.current = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    renderizarPoligonosEnMapa();

    const t = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(t);
  }, [lotes]);

  const cambiarCapa = (tipo: 'google' | 'esri' | 'osm') => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let nuevaCapa: L.TileLayer;
    if (tipo === 'google') {
      // Google Satelital Híbrido (Satélite HD + nombres de rutas, parajes y límites) - 100% Gratis sin API Key
      nuevaCapa = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: 'Tiles &copy; Google Satelital &mdash; Catastro Landa360',
        maxZoom: 20
      });
    } else if (tipo === 'esri') {
      // Esri World Imagery (Fotografía Satelital Global de Alta Definición) - 100% Gratis sin API Key
      nuevaCapa = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri World Imagery &mdash; Catastro Landa360',
        maxZoom: 19
      });
    } else {
      // Esri World Street Map (Topografía, Catastro y Calles) - 100% Gratis sin API Key
      nuevaCapa = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri World Street Map &mdash; Catastro Landa360',
        maxZoom: 19
      });
    }

    nuevaCapa.addTo(map);
    tileLayerRef.current = nuevaCapa;
    setCapaMapa(tipo);
    map.invalidateSize();
  };

  const renderizarPoligonosEnMapa = () => {
    const map = mapInstanceRef.current;
    const group = geojsonLayersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const bounds: L.LatLngBounds[] = [];

    lotes.forEach((lote) => {
      if (lote.poligonoGeo) {
        try {
          const color = lote.colorHex || lote.cultivoColor || '#83A653';
          const layer = L.geoJSON(lote.poligonoGeo, {
            style: {
              color: color,
              weight: 3,
              fillColor: color,
              fillOpacity: 0.45
            }
          });

          layer.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 4px;">
              <h4 style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px; color: #24382C;">
                ${lote.nombre}
              </h4>
              <p style="margin: 2px 0;"><strong>Cultivo:</strong> ${lote.cultivoNombre || 'Sin asignar'}</p>
              <p style="margin: 2px 0;"><strong>Superficie:</strong> <span style="color: #38845A; font-weight: bold;">${lote.superficieHa} ha</span></p>
              <p style="margin: 2px 0; text-transform: capitalize;"><strong>Aptitud:</strong> ${lote.aptitud}</p>
            </div>
          `);

          group.addLayer(layer);
          bounds.push(layer.getBounds());
        } catch (e) {
          console.warn('Error al proyectar polígono:', e);
        }
      }
    });

    if (bounds.length > 0) {
      const combined = bounds.reduce((acc, curr) => acc.extend(curr), bounds[0]);
      map.fitBounds(combined, { padding: [50, 50] });
      setTimeout(() => map.invalidateSize(), 200);
    }
  };

  const enfocarLoteEnMapa = (lote: Lote) => {
    const map = mapInstanceRef.current;
    if (!map || !lote.poligonoGeo) return;
    try {
      const tempLayer = L.geoJSON(lote.poligonoGeo);
      map.fitBounds(tempLayer.getBounds(), { padding: [60, 60] });
    } catch {}
  };

  // --------------------------------------------------------------------------
  // ACCIONES CRUD LOTES
  // --------------------------------------------------------------------------

  const handleGuardarLoteManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLote.nombre.trim() || formLote.superficieHa <= 0) return;

    try {
      const cultivo = cultivos.find(c => c.id === formLote.cultivoId);
      await agricolaService.guardarLote(
        tenantId,
        {
          campanaId: campanaSeleccionadaId,
          cultivoId: formLote.cultivoId || undefined,
          nombre: formLote.nombre,
          superficieHa: Number(formLote.superficieHa),
          aptitud: formLote.aptitud,
          colorHex: cultivo?.colorHex,
          notas: formLote.notas
        },
        loteEnEdicion?.id
      );

      setModalLoteManualOpen(false);
      setLoteEnEdicion(null);
      await cambiarCampana(campanaSeleccionadaId);
    } catch (err) {
      console.error('Error al guardar lote:', err);
    }
  };

  const handleEliminarLote = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el lote "${nombre}" del catastro?`)) return;
    try {
      await agricolaService.eliminarLote(tenantId, id);
      await cambiarCampana(campanaSeleccionadaId);
    } catch (err) {
      console.error('Error al eliminar lote:', err);
    }
  };

  const totalHectareas = lotes.reduce((acc, l) => acc + l.superficieHa, 0);

  return (
    <div className="space-y-6">
      
      {/* Barra Superior de Control y Campañas */}
      <div className="bg-campo-card p-5 rounded-2xl border border-campo-borde shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-campo-oliva bg-campo-arena px-2 py-0.5 rounded border border-campo-borde">
              FN-2.1 & FN-2.2 &bull; Cartografía y Catastro Base
            </span>
            {!puedeEditar && (
              <span className="text-xs font-semibold text-campo-muted flex items-center gap-1 bg-campo-blanco px-2 py-0.5 rounded border border-campo-borde">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Rol Operativo: Modo Solo Lectura
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-campo-texto">
            Catastro de Lotes y Visor Satelital WGS84
          </h2>
          <p className="text-xs text-campo-muted">
            Proyección cartográfica en alta definición y delimitación geodésica de parcelas agrícolas
          </p>
        </div>

        {/* Selector de Campaña y Botones de Acción */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-campo-blanco px-3 py-1.5 rounded-xl border border-campo-borde">
            <Calendar className="w-4 h-4 text-campo-oliva" />
            <select
              value={campanaSeleccionadaId}
              onChange={(e) => cambiarCampana(e.target.value)}
              className="bg-transparent text-xs font-bold text-campo-texto focus:outline-none cursor-pointer"
            >
              {campanas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.activa ? '(Vigente)' : ''}
                </option>
              ))}
            </select>
          </div>

          {puedeEditar && (
            <>
              <button
                onClick={() => setModalKmlOpen(true)}
                className="px-4 py-2 text-xs font-bold bg-campo-bosque hover:bg-campo-oliva text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                title="Arrastrar KML de Google Earth"
              >
                <Upload className="w-4 h-4 text-campo-verde" />
                <span>Importar KML / KMZ</span>
              </button>

              <button
                onClick={() => {
                  setLoteEnEdicion(null);
                  setFormLote({
                    nombre: '',
                    superficieHa: 0,
                    cultivoId: cultivos[0]?.id || '',
                    aptitud: 'agricola',
                    notas: ''
                  });
                  setModalLoteManualOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Lote</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid Principal: Mapa Satelital (7 cols) + Lista de Lotes (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Visor Cartográfico Satelital Esri HD (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="bg-campo-card border border-campo-borde rounded-2xl p-4 shadow-sm flex flex-col h-[560px]">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-campo-borde mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-campo-verde animate-pulse"></span>
                <span className="text-xs font-bold text-campo-texto">
                  Visor Satelital WGS84 &bull; Catastro Oficial
                </span>
              </div>

              {/* Selector de Capa de Satélite */}
              <div className="flex items-center bg-campo-arena/60 p-0.5 rounded-lg border border-campo-borde text-[11px]">
                <button
                  type="button"
                  onClick={() => cambiarCapa('google')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    capaMapa === 'google'
                      ? 'bg-campo-bosque text-white shadow-xs'
                      : 'text-campo-muted hover:text-campo-texto'
                  }`}
                >
                  🛰️ Google Híbrido
                </button>
                <button
                  type="button"
                  onClick={() => cambiarCapa('esri')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    capaMapa === 'esri'
                      ? 'bg-campo-bosque text-white shadow-xs'
                      : 'text-campo-muted hover:text-campo-texto'
                  }`}
                >
                  🌍 Esri Satelital
                </button>
                <button
                  type="button"
                  onClick={() => cambiarCapa('osm')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    capaMapa === 'osm'
                      ? 'bg-campo-bosque text-white shadow-xs'
                      : 'text-campo-muted hover:text-campo-texto'
                  }`}
                >
                  🗺️ Calles OSM
                </button>
              </div>
            </div>

            {/* Contenedor del Mapa */}
            <div className="flex-1 w-full rounded-xl overflow-hidden border border-campo-borde relative z-10 bg-slate-900">
              <div 
                ref={mapContainerRef} 
                className="w-full h-full min-h-[460px]" 
                style={{ minHeight: '460px', height: '100%', width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Panel Lateral: Métricas y Listado de Lotes (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Métricas Rápidas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-campo-card border border-campo-borde rounded-xl p-3 text-center shadow-sm">
              <p className="text-[11px] text-campo-muted font-medium">Lotes Activos</p>
              <p className="text-xl font-extrabold text-campo-texto mt-0.5">{lotes.length}</p>
            </div>
            <div className="bg-campo-card border border-campo-borde rounded-xl p-3 text-center shadow-sm">
              <p className="text-[11px] text-campo-muted font-medium">Superficie Total</p>
              <p className="text-xl font-extrabold text-campo-verde mt-0.5 font-mono">{totalHectareas.toFixed(1)} ha</p>
            </div>
            <div className="bg-campo-card border border-campo-borde rounded-xl p-3 text-center shadow-sm">
              <p className="text-[11px] text-campo-muted font-medium">Campaña</p>
              <p className="text-xs font-bold text-campo-oliva mt-1 truncate">
                {campanas.find(c => c.id === campanaSeleccionadaId)?.nombre || 'Activa'}
              </p>
            </div>
          </div>

          {/* Tarjetas de Lotes */}
          <div className="bg-campo-card border border-campo-borde rounded-2xl p-4 shadow-sm flex-1 flex flex-col min-h-[440px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-campo-texto">
                Lotes Registrados ({lotes.length})
              </h3>
              <span className="text-[11px] text-campo-muted">Clic para centrar en mapa</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-1 flex-1">
              {lotes.map((lote) => (
                <div
                  key={lote.id}
                  onClick={() => enfocarLoteEnMapa(lote)}
                  className="p-3 bg-campo-blanco border border-campo-borde hover:border-campo-verde rounded-xl transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10 shadow-sm"
                        style={{ backgroundColor: lote.colorHex || lote.cultivoColor || '#83A653' }}
                        title={`Cultivo: ${lote.cultivoNombre || 'Sin asignar'}`}
                      />
                      <div>
                        <h4 className="text-xs font-bold text-campo-texto group-hover:text-campo-bosque">
                          {lote.nombre}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-campo-muted mt-0.5">
                          <span className="font-semibold text-campo-oliva">
                            {lote.cultivoNombre || 'Barbecho'}
                          </span>
                          <span>&bull;</span>
                          <span className="capitalize">{lote.aptitud}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-campo-texto bg-campo-arena/60 px-2 py-0.5 rounded border border-campo-borde">
                        {lote.superficieHa.toFixed(1)} ha
                      </span>

                      {puedeEditar && (
                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLoteEnEdicion(lote);
                              setFormLote({
                                nombre: lote.nombre,
                                superficieHa: lote.superficieHa,
                                cultivoId: lote.cultivoId || '',
                                aptitud: lote.aptitud,
                                notas: lote.notas || ''
                              });
                              setModalLoteManualOpen(true);
                            }}
                            className="p-1 hover:text-campo-bosque hover:bg-campo-arena rounded"
                            title="Editar lote"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarLote(lote.id, lote.nombre);
                            }}
                            className="p-1 hover:text-campo-error hover:bg-campo-arena rounded"
                            title="Eliminar lote"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {lotes.length === 0 && (
                <div className="text-center py-16 text-campo-muted text-xs border border-dashed border-campo-borde rounded-xl">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-campo-oliva" />
                  <p className="font-semibold text-campo-texto">Aún no hay lotes en esta campaña</p>
                  <p className="text-[11px] mt-1">
                    Arrastra tu archivo KML de Google Earth para importar todos los polígonos automáticamente.
                  </p>
                  {puedeEditar && (
                    <button
                      onClick={() => setModalKmlOpen(true)}
                      className="mt-3 px-3 py-1.5 text-xs font-bold bg-campo-verde text-white rounded-lg shadow-sm"
                    >
                      Importar KML Ahora
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Modal KML Importer */}
      <KmlImporterModal
        isOpen={modalKmlOpen}
        onClose={() => setModalKmlOpen(false)}
        onSuccess={() => cambiarCampana(campanaSeleccionadaId)}
        tenantId={tenantId}
        campanaActivaId={campanaSeleccionadaId}
        cultivos={cultivos}
      />

      {/* Modal Alta / Edición Manual de Lote */}
      {modalLoteManualOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-campo-card border border-campo-borde rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-campo-blanco border-b border-campo-borde flex items-center justify-between">
              <h3 className="text-sm font-bold text-campo-texto">
                {loteEnEdicion ? 'Editar Lote Agrícola' : 'Nuevo Lote en el Catastro'}
              </h3>
              <button onClick={() => setModalLoteManualOpen(false)} className="text-campo-muted hover:text-campo-texto">
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarLoteManual} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">Nombre del Lote *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Lote 1 - El Bajo, La Legua..."
                  value={formLote.nombre}
                  onChange={(e) => setFormLote({ ...formLote, nombre: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-campo-texto mb-1">Superficie (ha) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={formLote.superficieHa || ''}
                    onChange={(e) => setFormLote({ ...formLote, superficieHa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-campo-texto mb-1">Aptitud</label>
                  <select
                    value={formLote.aptitud}
                    onChange={(e) => setFormLote({ ...formLote, aptitud: e.target.value as AptitudLote })}
                    className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde capitalize"
                  >
                    <option value="agricola">Agrícola</option>
                    <option value="ganadero">Ganadero</option>
                    <option value="mixto">Mixto</option>
                    <option value="reserva_bajo">Reserva / Bajo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">Cultivo Asignado</label>
                <select
                  value={formLote.cultivoId || ''}
                  onChange={(e) => setFormLote({ ...formLote, cultivoId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                >
                  <option value="">Sin cultivo (Barbecho)</option>
                  {cultivos.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  value={formLote.notas}
                  onChange={(e) => setFormLote({ ...formLote, notas: e.target.value })}
                  placeholder="Tipo de suelo, antecesor, observaciones..."
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-campo-borde">
                <button
                  type="button"
                  onClick={() => setModalLoteManualOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-campo-muted hover:text-campo-texto rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg shadow-sm"
                >
                  {loteEnEdicion ? 'Actualizar Lote' : 'Guardar Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
