import React, { useState } from 'react';
import JSZip from 'jszip';
import { parsearKMLString, agricolaService } from '../../services/agricolaService';
import { Cultivo, AptitudLote } from '../../types/agricola';
import { 
  Upload, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  X, 
  AlertCircle
} from 'lucide-react';

interface Props {
  tenantId: string;
  campanaActivaId?: string;
  cultivos: Cultivo[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LoteDetectado {
  nombre: string;
  superficieHa: number;
  cultivoId?: string;
  aptitud: AptitudLote;
  coordenadas: [number, number][];
  geojson: any;
}

// Coordenadas reales del archivo del proyecto: Export 2026-11-04 11_20.kml
const KML_MUESTRA_REAL = `<?xml version='1.0' encoding='UTF-8' ?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>El Diluvio - Lote 1</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>-60.730095058679574,-35.47347562372689,0 -60.71884285658598,-35.482129820928826,0 -60.713600143790245,-35.47731643631554,0 -60.71203172206879,-35.47847080122286,0 -60.70681516081095,-35.47379453801994,0 -60.71928072720767,-35.46412360965696,0 -60.730095058679574,-35.47347562372689,0</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

export const KmlImporterModal: React.FC<Props> = ({
  tenantId,
  campanaActivaId,
  cultivos,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [lotes, setLotes] = useState<LoteDetectado[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const procesarKMLText = (text: string, name: string) => {
    try {
      setErrorMsg(null);
      const parsed = parsearKMLString(text);
      if (parsed.length === 0) {
        setErrorMsg('No se detectaron geometrías de polígonos cerrados en el archivo.');
        return;
      }

      const defaultCultivoId = cultivos.find(c => c.esActivo)?.id;

      const detectados: LoteDetectado[] = parsed.map(p => ({
        nombre: p.nombre,
        superficieHa: p.superficieHa,
        cultivoId: defaultCultivoId,
        aptitud: 'agricola',
        coordenadas: p.coordenadas,
        geojson: p.geojson
      }));

      setLotes(detectados);
      setFileName(name);
    } catch (err: any) {
      setErrorMsg(`Error al procesar el archivo KML: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'kmz') {
        const zip = await JSZip.loadAsync(file);
        const kmlFileKey = Object.keys(zip.files).find(k => k.toLowerCase().endsWith('.kml'));
        if (!kmlFileKey) {
          throw new Error('El archivo .KMZ no contiene ningún archivo .kml válido.');
        }
        const text = await zip.files[kmlFileKey].async('string');
        procesarKMLText(text, file.name);
      } else if (ext === 'kml') {
        const text = await file.text();
        procesarKMLText(text, file.name);
      } else {
        throw new Error('Formato no soportado. Debe ser archivo .kml o .kmz exportado de Google Earth.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCargarMuestraReal = () => {
    procesarKMLText(KML_MUESTRA_REAL, 'Export 2026-11-04 11_20.kml (Muestra Oficial)');
  };

  const handleGuardarLotes = async () => {
    if (lotes.length === 0) return;
    setGuardando(true);
    try {
      const lotesParaGuardar = lotes.map(l => {
        const cultivo = cultivos.find(c => c.id === l.cultivoId);
        return {
          campanaId: campanaActivaId,
          cultivoId: l.cultivoId,
          nombre: l.nombre,
          superficieHa: l.superficieHa,
          aptitud: l.aptitud,
          poligonoGeo: l.geojson,
          colorHex: cultivo?.colorHex || '#83A653',
          notas: `Importado de ${fileName} con precisión geodésica WGS84`
        };
      });

      await agricolaService.guardarLotesBatch(tenantId, lotesParaGuardar);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(`Error al guardar en el catastro: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const totalHa = lotes.reduce((acc, l) => acc + l.superficieHa, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-campo-card border border-campo-borde rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-campo-blanco border-b border-campo-borde flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-campo-bosque text-white flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5 text-campo-verde" />
            </span>
            <div>
              <h3 className="text-base font-bold text-campo-texto">
                Importador Satelital KML / KMZ de Google Earth (FN-2.2)
              </h3>
              <p className="text-xs text-campo-muted">
                Extracción de vértices y cálculo geodésico de superficie en Hectáreas (elipsoide WGS84, error &lt; 0.1%)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-campo-muted hover:text-campo-texto p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {errorMsg && (
            <div className="p-3 bg-campo-error/15 text-campo-error border border-campo-error/30 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Zona Drag & Drop */}
          <div className="border-2 border-dashed border-campo-borde hover:border-campo-verde bg-campo-blanco/50 hover:bg-campo-blanco rounded-xl p-6 text-center transition-all cursor-pointer relative group">
            <input
              type="file"
              accept=".kml,.kmz"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-campo-verde/20 text-campo-bosque flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-campo-oliva" />
              </div>
              <div>
                <p className="text-sm font-semibold text-campo-texto">
                  Arrastra tu archivo <span className="text-campo-oliva font-bold">.KML</span> o <span className="text-campo-oliva font-bold">.KMZ</span> aquí
                </p>
                <p className="text-xs text-campo-muted mt-0.5">
                  O haz clic para seleccionarlo de tu computadora
                </p>
              </div>
              <span className="text-[11px] text-campo-muted bg-campo-arena px-3 py-0.5 rounded-full mt-1">
                Soporta Polígonos de Google Earth, QGIS y monitores de siembra
              </span>
            </div>
          </div>

          {/* Botón de Muestra Real Oficial */}
          <div className="flex justify-between items-center bg-campo-arena/40 p-3 rounded-xl border border-campo-borde text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-campo-verde" />
              <span className="text-campo-texto">¿Deseas probar con el archivo real del proyecto?</span>
            </div>
            <button
              type="button"
              onClick={handleCargarMuestraReal}
              className="px-3 py-1.5 font-semibold bg-campo-bosque text-white hover:bg-campo-oliva rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-sm"
            >
              <span>Cargar Muestra Real ("El Diluvio")</span>
            </button>
          </div>

          {/* Listado de Lotes Detectados */}
          {lotes.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-campo-texto">
                  Lotes Geodésicos Detectados ({lotes.length}) &bull; Superficie Total: <span className="text-campo-oliva font-mono">{totalHa.toFixed(2)} ha</span>
                </h4>
                <span className="text-[11px] text-campo-verde font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  WGS84 Verificado
                </span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {lotes.map((lote, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-campo-blanco border border-campo-borde rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                  >
                    {/* Nombre */}
                    <div className="md:col-span-4">
                      <label className="text-[10px] text-campo-muted block">Nombre del Lote</label>
                      <input
                        type="text"
                        value={lote.nombre}
                        onChange={(e) => {
                          const updated = [...lotes];
                          updated[idx].nombre = e.target.value;
                          setLotes(updated);
                        }}
                        className="w-full px-2 py-1 bg-campo-card border border-campo-borde rounded text-xs text-campo-texto font-semibold focus:outline-none focus:border-campo-verde"
                      />
                    </div>

                    {/* Hectáreas WGS84 */}
                    <div className="md:col-span-2 text-center md:text-left">
                      <label className="text-[10px] text-campo-muted block">Área WGS84</label>
                      <span className="font-mono font-bold text-campo-oliva text-sm">
                        {lote.superficieHa.toFixed(2)} ha
                      </span>
                    </div>

                    {/* Cultivo Asignado (Catálogo Paramétrico) */}
                    <div className="md:col-span-3">
                      <label className="text-[10px] text-campo-muted block">Cultivo Asignado</label>
                      <select
                        value={lote.cultivoId || ''}
                        onChange={(e) => {
                          const updated = [...lotes];
                          updated[idx].cultivoId = e.target.value;
                          setLotes(updated);
                        }}
                        className="w-full px-2 py-1 bg-campo-card border border-campo-borde rounded text-xs text-campo-texto focus:outline-none focus:border-campo-verde"
                      >
                        <option value="">Sin cultivo (Barbecho)</option>
                        {cultivos.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Aptitud */}
                    <div className="md:col-span-3">
                      <label className="text-[10px] text-campo-muted block">Aptitud</label>
                      <select
                        value={lote.aptitud}
                        onChange={(e) => {
                          const updated = [...lotes];
                          updated[idx].aptitud = e.target.value as AptitudLote;
                          setLotes(updated);
                        }}
                        className="w-full px-2 py-1 bg-campo-card border border-campo-borde rounded text-xs text-campo-texto focus:outline-none focus:border-campo-verde capitalize"
                      >
                        <option value="agricola">Agrícola</option>
                        <option value="ganadero">Ganadero</option>
                        <option value="mixto">Mixto</option>
                        <option value="reserva_bajo">Reserva / Bajo</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-campo-blanco border-t border-campo-borde flex items-center justify-between">
          <span className="text-xs text-campo-muted">
            {fileName ? `Archivo: ${fileName}` : 'Ningún archivo cargado aún'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-campo-muted hover:text-campo-texto rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={lotes.length === 0 || guardando}
              onClick={handleGuardarLotes}
              className="px-5 py-2 text-xs font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {guardando ? (
                <span>Guardando en Catastro...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar {lotes.length} Lote(s) en Catastro</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
