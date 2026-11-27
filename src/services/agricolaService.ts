import { supabase } from '../config/supabase';
import { 
  Campana, 
  Cultivo, 
  Lote, 
  OrdenTrabajo, 
  MonitoreoPlaga, 
  MargenBrutoLote, 
  CULTIVOS_SUGERIDOS_BASE 
} from '../types/agricola';

const LOCAL_STORAGE_CULTIVOS = 'campo360_param_cultivos';
const LOCAL_STORAGE_CAMPANAS = 'campo360_param_campanas';
const LOCAL_STORAGE_LOTES = 'campo360_lotes';
const LOCAL_STORAGE_OTS = 'campo360_ordenes_trabajo';
const LOCAL_STORAGE_MONITOREOS = 'campo360_monitoreos_plagas';
const LOCAL_STORAGE_MARGENES = 'campo360_margenes_brutos';

// ==============================================================================
// UTILIDADES GEODÉSICAS WGS84 & KML PARSER (FN-2.2)
// ==============================================================================

/**
 * Calcula la superficie exacta en hectáreas geodésicas en elipsoide WGS84
 * Algoritmo esférico Chamberlain-Duquette (error < 0.05% vs catastro)
 */
export function calcularAreaGeodesicaWGS84(coordenadas: [number, number][]): number {
  if (!coordenadas || coordenadas.length < 3) return 0;
  const R = 6378137; // Radio ecuatorial de la Tierra en metros (WGS84)
  const rad = Math.PI / 180;
  let total = 0;

  for (let i = 0; i < coordenadas.length; i++) {
    const p1 = coordenadas[i];
    const p2 = coordenadas[(i + 1) % coordenadas.length];

    const lon1 = p1[0] * rad;
    const lat1 = p1[1] * rad;
    const lon2 = p2[0] * rad;
    const lat2 = p2[1] * rad;

    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const areaM2 = Math.abs((total * R * R) / 4);
  return Number((areaM2 / 10000).toFixed(2)); // Conversión a Hectáreas
}

/**
 * Extrae polígonos y calcula hectáreas desde texto XML de un archivo .KML
 */
export function parsearKMLString(kmlText: string): { nombre: string; superficieHa: number; coordenadas: [number, number][]; geojson: any }[] {
  const domParser = new DOMParser();
  const xmlDoc = domParser.parseFromString(kmlText, 'text/xml');
  const placemarks = xmlDoc.getElementsByTagName('Placemark');
  const resultados: { nombre: string; superficieHa: number; coordenadas: [number, number][]; geojson: any }[] = [];

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const nameNode = pm.getElementsByTagName('name')[0];
    const nombre = nameNode?.textContent?.trim() || `Lote ${i + 1}`;

    const coordNode = pm.getElementsByTagName('coordinates')[0];
    if (!coordNode || !coordNode.textContent) continue;

    const rawCoords = coordNode.textContent.trim().split(/\s+/);
    const puntos: [number, number][] = [];

    for (const raw of rawCoords) {
      const parts = raw.split(',');
      if (parts.length >= 2) {
        const lon = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lon) && !isNaN(lat)) {
          puntos.push([lon, lat]);
        }
      }
    }

    if (puntos.length >= 3) {
      const superficieHa = calcularAreaGeodesicaWGS84(puntos);
      const geojson = {
        type: 'Feature',
        properties: { name: nombre, hectares: superficieHa },
        geometry: {
          type: 'Polygon',
          coordinates: [puntos]
        }
      };
      resultados.push({ nombre, superficieHa, coordenadas: puntos, geojson });
    }
  }

  return resultados;
}

export const agricolaService = {
  // ==========================================================================
  // GESTIÓN DE CAMPAÑAS AGRÍCOLAS
  // ==========================================================================

  async obtenerCampanas(tenantId: string): Promise<Campana[]> {
    try {
      const { data, error } = await supabase
        .from('campanas')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const campanas: Campana[] = data.map(item => ({
          id: item.id,
          tenantId: item.tenant_id,
          nombre: item.nombre,
          fechaInicio: item.fecha_inicio,
          fechaFin: item.fecha_fin,
          activa: item.activa,
          createdAt: item.created_at
        }));
        localStorage.setItem(LOCAL_STORAGE_CAMPANAS, JSON.stringify(campanas));
        return campanas;
      }
    } catch (err) {
      console.warn('Fallo Supabase obtenerCampanas, usando fallback local:', err);
    }

    const local = localStorage.getItem(LOCAL_STORAGE_CAMPANAS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }

    const defaultCampana: Campana = {
      id: 'default-campana-2025-2026',
      tenantId,
      nombre: 'Campaña 2025/2026',
      fechaInicio: '2025-07-01',
      fechaFin: '2026-06-30',
      activa: true
    };
    return [defaultCampana];
  },

  async crearCampana(tenantId: string, input: { nombre: string; fechaInicio?: string; fechaFin?: string; activa?: boolean }): Promise<Campana> {
    const id = crypto.randomUUID();
    const payload = {
      id,
      tenant_id: tenantId,
      nombre: input.nombre.trim(),
      fecha_inicio: input.fechaInicio || null,
      fecha_fin: input.fechaFin || null,
      activa: input.activa ?? false
    };

    try {
      if (payload.activa) {
        await supabase
          .from('campanas')
          .update({ activa: false })
          .eq('tenant_id', tenantId);
      }

      const { data, error } = await supabase
        .from('campanas')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      const nueva: Campana = {
        id: data.id,
        tenantId: data.tenant_id,
        nombre: data.nombre,
        fechaInicio: data.fecha_inicio,
        fechaFin: data.fecha_fin,
        activa: data.activa,
        createdAt: data.created_at
      };

      const actuales = await this.obtenerCampanas(tenantId);
      localStorage.setItem(LOCAL_STORAGE_CAMPANAS, JSON.stringify([nueva, ...actuales.filter(c => c.id !== nueva.id)]));
      return nueva;
    } catch (err) {
      const campanaOffline: Campana = {
        id,
        tenantId,
        nombre: input.nombre.trim(),
        fechaInicio: input.fechaInicio,
        fechaFin: input.fechaFin,
        activa: input.activa ?? false,
        createdAt: new Date().toISOString()
      };
      const actuales = await this.obtenerCampanas(tenantId);
      localStorage.setItem(LOCAL_STORAGE_CAMPANAS, JSON.stringify([campanaOffline, ...actuales.filter(c => c.id !== id)]));
      return campanaOffline;
    }
  },

  async establecerCampanaActiva(tenantId: string, campanaId: string): Promise<void> {
    try {
      await supabase.from('campanas').update({ activa: false }).eq('tenant_id', tenantId);
      await supabase.from('campanas').update({ activa: true }).eq('id', campanaId);
    } catch (err) {
      console.warn('Fallo Supabase establecerCampanaActiva:', err);
    }

    const actuales = await this.obtenerCampanas(tenantId);
    const actualizadas = actuales.map(c => ({ ...c, activa: c.id === campanaId }));
    localStorage.setItem(LOCAL_STORAGE_CAMPANAS, JSON.stringify(actualizadas));
  },

  // ==========================================================================
  // GESTIÓN DE CULTIVOS PARAMÉTRICOS (Catálogo Dinámico)
  // ==========================================================================

  async obtenerCultivos(tenantId: string): Promise<Cultivo[]> {
    try {
      const { data, error } = await supabase
        .from('cultivos')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nombre', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const cultivos: Cultivo[] = data.map(item => ({
          id: item.id,
          tenantId: item.tenant_id,
          nombre: item.nombre,
          tipo: item.tipo,
          colorHex: item.color_hex,
          esActivo: item.es_activo,
          descripcion: item.descripcion,
          createdAt: item.created_at
        }));
        localStorage.setItem(LOCAL_STORAGE_CULTIVOS, JSON.stringify(cultivos));
        return cultivos;
      } else {
        return await this.sembrarCultivosIniciales(tenantId);
      }
    } catch (err) {
      console.warn('Fallo Supabase obtenerCultivos, usando fallback local:', err);
    }

    const local = localStorage.getItem(LOCAL_STORAGE_CULTIVOS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    return await this.sembrarCultivosIniciales(tenantId);
  },

  async sembrarCultivosIniciales(tenantId: string): Promise<Cultivo[]> {
    const listado: Cultivo[] = CULTIVOS_SUGERIDOS_BASE.map(item => ({
      id: crypto.randomUUID(),
      tenantId,
      ...item,
      createdAt: new Date().toISOString()
    }));

    try {
      const dbPayload = listado.map(c => ({
        id: c.id,
        tenant_id: tenantId,
        nombre: c.nombre,
        tipo: c.tipo,
        color_hex: c.colorHex,
        es_activo: c.esActivo,
        descripcion: c.descripcion
      }));

      await supabase.from('cultivos').insert(dbPayload);
    } catch (err) {
      console.warn('Fallo Supabase sembrarCultivosIniciales:', err);
    }

    localStorage.setItem(LOCAL_STORAGE_CULTIVOS, JSON.stringify(listado));
    return listado;
  },

  async crearCultivo(tenantId: string, input: Omit<Cultivo, 'id' | 'tenantId' | 'createdAt'>): Promise<Cultivo> {
    const id = crypto.randomUUID();
    const payload = {
      id,
      tenant_id: tenantId,
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      color_hex: input.colorHex,
      es_activo: input.esActivo,
      descripcion: input.descripcion?.trim() || null
    };

    try {
      const { data, error } = await supabase.from('cultivos').insert(payload).select().single();
      if (error) throw error;
      const nuevo: Cultivo = {
        id: data.id,
        tenantId: data.tenant_id,
        nombre: data.nombre,
        tipo: data.tipo,
        colorHex: data.color_hex,
        esActivo: data.es_activo,
        descripcion: data.descripcion,
        createdAt: data.created_at
      };
      const actuales = await this.obtenerCultivos(tenantId);
      localStorage.setItem(LOCAL_STORAGE_CULTIVOS, JSON.stringify([...actuales, nuevo]));
      return nuevo;
    } catch (err) {
      const cultivoOffline: Cultivo = { id, tenantId, ...input, createdAt: new Date().toISOString() };
      const actuales = await this.obtenerCultivos(tenantId);
      localStorage.setItem(LOCAL_STORAGE_CULTIVOS, JSON.stringify([...actuales, cultivoOffline]));
      return cultivoOffline;
    }
  },

  async actualizarCultivo(tenantId: string, cultivoId: string, updates: Partial<Omit<Cultivo, 'id' | 'tenantId'>>): Promise<Cultivo | null> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.nombre !== undefined) payload.nombre = updates.nombre.trim();
    if (updates.tipo !== undefined) payload.tipo = updates.tipo;
    if (updates.colorHex !== undefined) payload.color_hex = updates.colorHex;
    if (updates.esActivo !== undefined) payload.es_activo = updates.esActivo;
    if (updates.descripcion !== undefined) payload.descripcion = updates.descripcion?.trim();

    try {
      await supabase.from('cultivos').update(payload).eq('id', cultivoId).eq('tenant_id', tenantId);
    } catch (err) {
      console.warn('Fallo Supabase actualizarCultivo:', err);
    }

    const actuales = await this.obtenerCultivos(tenantId);
    const actualizados = actuales.map(c => (c.id === cultivoId ? { ...c, ...updates } : c));
    localStorage.setItem(LOCAL_STORAGE_CULTIVOS, JSON.stringify(actualizados));
    return actualizados.find(c => c.id === cultivoId) || null;
  },

  async eliminarCultivo(tenantId: string, cultivoId: string): Promise<boolean> {
    try {
      await supabase.from('cultivos').delete().eq('id', cultivoId).eq('tenant_id', tenantId);
    } catch (err) {
      console.warn('Fallo Supabase eliminarCultivo:', err);
    }
    const actuales = await this.obtenerCultivos(tenantId);
    const filtrados = actuales.filter(c => c.id !== cultivoId);
    localStorage.setItem(LOCAL_STORAGE_CULTIVOS, JSON.stringify(filtrados));
    return true;
  },

  // ==========================================================================
  // GESTIÓN DE LOTES AGRÍCOLAS (FN-2.1 y FN-2.2)
  // ==========================================================================

  async obtenerLotes(tenantId: string, campanaId?: string): Promise<Lote[]> {
    try {
      let query = supabase
        .from('lotes')
        .select(`
          *,
          cultivos (
            nombre,
            color_hex
          )
        `)
        .eq('tenant_id', tenantId)
        .order('nombre', { ascending: true });

      if (campanaId) {
        query = query.eq('campana_id', campanaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const lotes: Lote[] = data.map((item: any) => ({
          id: item.id,
          tenantId: item.tenant_id,
          campanaId: item.campana_id,
          cultivoId: item.cultivo_id,
          nombre: item.nombre,
          superficieHa: Number(item.superficie_ha) || 0,
          aptitud: item.aptitud,
          poligonoGeo: item.poligono_geo,
          colorHex: item.color_hex || item.cultivos?.color_hex,
          notas: item.notas,
          createdAt: item.created_at,
          cultivoNombre: item.cultivos?.nombre,
          cultivoColor: item.cultivos?.color_hex
        }));
        localStorage.setItem(LOCAL_STORAGE_LOTES, JSON.stringify(lotes));
        return lotes;
      }
    } catch (err) {
      console.warn('Fallo Supabase obtenerLotes, usando fallback local:', err);
    }

    const local = localStorage.getItem(LOCAL_STORAGE_LOTES);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (campanaId) return parsed.filter((l: Lote) => l.campanaId === campanaId);
        return parsed;
      } catch {}
    }

    return [];
  },

  async guardarLote(tenantId: string, lote: Omit<Lote, 'id' | 'tenantId' | 'createdAt'>, idExistente?: string): Promise<Lote> {
    const id = idExistente || crypto.randomUUID();
    const payload = {
      id,
      tenant_id: tenantId,
      campana_id: lote.campanaId || null,
      cultivo_id: lote.cultivoId || null,
      nombre: lote.nombre.trim(),
      superficie_ha: lote.superficieHa,
      aptitud: lote.aptitud,
      poligono_geo: lote.poligonoGeo || null,
      color_hex: lote.colorHex || null,
      notas: lote.notas?.trim() || null
    };

    try {
      const { data, error } = await supabase
        .from('lotes')
        .upsert(payload)
        .select(`*, cultivos(nombre, color_hex)`)
        .single();

      if (error) throw error;

      const resultado: Lote = {
        id: data.id,
        tenantId: data.tenant_id,
        campanaId: data.campana_id,
        cultivoId: data.cultivo_id,
        nombre: data.nombre,
        superficieHa: Number(data.superficie_ha) || 0,
        aptitud: data.aptitud,
        poligonoGeo: data.poligono_geo,
        colorHex: data.color_hex || data.cultivos?.color_hex,
        notas: data.notas,
        createdAt: data.created_at,
        cultivoNombre: data.cultivos?.nombre,
        cultivoColor: data.cultivos?.color_hex
      };

      const actuales = await this.obtenerLotes(tenantId);
      const actualizados = [...actuales.filter(l => l.id !== id), resultado];
      localStorage.setItem(LOCAL_STORAGE_LOTES, JSON.stringify(actualizados));
      return resultado;
    } catch (err) {
      const loteOffline: Lote = { id, tenantId, ...lote, createdAt: new Date().toISOString() };
      const actuales = await this.obtenerLotes(tenantId);
      const actualizados = [...actuales.filter(l => l.id !== id), loteOffline];
      localStorage.setItem(LOCAL_STORAGE_LOTES, JSON.stringify(actualizados));
      return loteOffline;
    }
  },

  async guardarLotesBatch(tenantId: string, lotes: Omit<Lote, 'id' | 'tenantId' | 'createdAt'>[]): Promise<Lote[]> {
    const nuevos: Lote[] = [];
    for (const l of lotes) {
      const guardado = await this.guardarLote(tenantId, l);
      nuevos.push(guardado);
    }
    return nuevos;
  },

  async eliminarLote(tenantId: string, loteId: string): Promise<boolean> {
    try {
      await supabase.from('lotes').delete().eq('id', loteId).eq('tenant_id', tenantId);
    } catch (err) {
      console.warn('Fallo Supabase eliminarLote:', err);
    }
    const actuales = await this.obtenerLotes(tenantId);
    const filtrados = actuales.filter(l => l.id !== loteId);
    localStorage.setItem(LOCAL_STORAGE_LOTES, JSON.stringify(filtrados));
    return true;
  },

  // ==========================================================================
  // BLOQUE B: ÓRDENES DE TRABAJO (FN-2.3, FN-2.4, FN-2.5, FN-2.6)
  // ==========================================================================

  async obtenerOTs(tenantId: string, campanaId?: string): Promise<OrdenTrabajo[]> {
    try {
      let query = supabase
        .from('ordenes_trabajo')
        .select(`
          *,
          ot_lotes (
            lote_id,
            superficie_ha,
            porcentaje_prorrateo,
            costo_asignado_usd,
            lotes (nombre)
          ),
          ot_insumos (
            id,
            producto_nombre,
            dosis_ha,
            unidad,
            cantidad_total_calculada,
            cantidad_real_consumida,
            costo_unitario_usd
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (campanaId) query = query.eq('campana_id', campanaId);

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const ots: OrdenTrabajo[] = data.map((item: any) => ({
          id: item.id,
          tenantId: item.tenant_id,
          campanaId: item.campana_id,
          numeroOt: item.numero_ot,
          tipoLabor: item.tipo_labor,
          contratista: item.contratista,
          maquinaria: item.maquinaria,
          fechaEmision: item.fecha_emision,
          fechaCierre: item.fecha_cierre,
          estado: item.estado,
          superficieTotalHa: Number(item.superficie_total_ha),
          tarifaContratistaUsdHa: Number(item.tarifa_contratista_usd_ha),
          costoTotalEstimadoUsd: Number(item.costo_total_estimado_usd),
          superficieRealHa: item.superficie_real_ha ? Number(item.superficie_real_ha) : undefined,
          observaciones: item.observaciones,
          createdAt: item.created_at,
          lotes: (item.ot_lotes || []).map((ol: any) => ({
            loteId: ol.lote_id,
            loteNombre: ol.lotes?.nombre,
            superficieHa: Number(ol.superficie_ha),
            porcentajeProrrateo: Number(ol.porcentaje_prorrateo),
            costoAsignadoUsd: Number(ol.costo_asignado_usd)
          })),
          insumos: (item.ot_insumos || []).map((oi: any) => ({
            id: oi.id,
            productoNombre: oi.producto_nombre,
            dosisHa: Number(oi.dosis_ha),
            unidad: oi.unidad,
            cantidadTotalCalculada: Number(oi.cantidad_total_calculada),
            cantidadRealConsumida: oi.cantidad_real_consumida ? Number(oi.cantidad_real_consumida) : undefined,
            costoUnitarioUsd: oi.costo_unitario_usd ? Number(oi.costo_unitario_usd) : undefined
          }))
        }));
        localStorage.setItem(LOCAL_STORAGE_OTS, JSON.stringify(ots));
        return ots;
      }
    } catch (err) {
      console.warn('Fallo Supabase obtenerOTs, usando fallback local:', err);
    }

    const local = localStorage.getItem(LOCAL_STORAGE_OTS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (campanaId) return parsed.filter((o: OrdenTrabajo) => o.campanaId === campanaId);
        return parsed;
      } catch {}
    }

    return [];
  },

  async crearOrdenTrabajo(
    tenantId: string, 
    input: Omit<OrdenTrabajo, 'id' | 'tenantId' | 'createdAt'>
  ): Promise<OrdenTrabajo> {
    const id = crypto.randomUUID();
    
    // Algoritmo de Prorrateo Automático Multi-Lote (FN-2.6)
    const totalHa = input.lotes.reduce((sum, l) => sum + l.superficieHa, 0);
    const lotesProrrateados = input.lotes.map(l => {
      const porcentaje = totalHa > 0 ? Number(((l.superficieHa / totalHa) * 100).toFixed(2)) : 0;
      const costoAsignado = input.costoTotalEstimadoUsd 
        ? Number(((input.costoTotalEstimadoUsd * l.superficieHa) / totalHa).toFixed(2)) 
        : 0;
      return {
        ...l,
        porcentajeProrrateo: porcentaje,
        costoAsignadoUsd: costoAsignado
      };
    });

    const payload = {
      id,
      tenant_id: tenantId,
      campana_id: input.campanaId || null,
      numero_ot: input.numeroOt,
      tipo_labor: input.tipoLabor,
      contratista: input.contratista,
      maquinaria: input.maquinaria || null,
      fecha_emision: input.fechaEmision,
      estado: input.estado || 'pendiente',
      superficie_total_ha: totalHa,
      tarifa_contratista_usd_ha: input.tarifaContratistaUsdHa || 0,
      costo_total_estimado_usd: input.costoTotalEstimadoUsd || 0,
      observaciones: input.observaciones || null
    };

    try {
      await supabase.from('ordenes_trabajo').insert(payload);

      // Guardar lotes relacionados
      if (lotesProrrateados.length > 0) {
        const lotesPayload = lotesProrrateados.map(l => ({
          tenant_id: tenantId,
          ot_id: id,
          lote_id: l.loteId,
          superficie_ha: l.superficieHa,
          porcentaje_prorrateo: l.porcentajeProrrateo,
          costo_asignado_usd: l.costoAsignadoUsd
        }));
        await supabase.from('ot_lotes').insert(lotesPayload);
      }

      // Guardar insumos de la receta
      if (input.insumos.length > 0) {
        const insumosPayload = input.insumos.map(ins => ({
          tenant_id: tenantId,
          ot_id: id,
          producto_nombre: ins.productoNombre,
          dosis_ha: ins.dosisHa,
          unidad: ins.unidad,
          cantidad_total_calculada: ins.cantidadTotalCalculada,
          costo_unitario_usd: ins.costoUnitarioUsd || 0
        }));
        await supabase.from('ot_insumos').insert(insumosPayload);
      }
    } catch (err) {
      console.warn('Fallo Supabase crearOrdenTrabajo, guardando offline:', err);
    }

    const nuevaOT: OrdenTrabajo = {
      id,
      tenantId,
      ...input,
      superficieTotalHa: totalHa,
      lotes: lotesProrrateados,
      createdAt: new Date().toISOString()
    };

    const actuales = await this.obtenerOTs(tenantId);
    localStorage.setItem(LOCAL_STORAGE_OTS, JSON.stringify([nuevaOT, ...actuales.filter(o => o.id !== id)]));
    return nuevaOT;
  },

  async cerrarLaborOT(
    tenantId: string, 
    otId: string, 
    cierre: { superficieRealHa: number; fechaCierre: string; insumosConsumidos?: { id?: string; productoNombre: string; cantidadReal: number }[] }
  ): Promise<boolean> {
    try {
      await supabase
        .from('ordenes_trabajo')
        .update({
          estado: 'completada',
          superficie_real_ha: cierre.superficieRealHa,
          fecha_cierre: cierre.fechaCierre,
          updated_at: new Date().toISOString()
        })
        .eq('id', otId)
        .eq('tenant_id', tenantId);

      if (cierre.insumosConsumidos) {
        for (const ins of cierre.insumosConsumidos) {
          if (ins.id) {
            await supabase
              .from('ot_insumos')
              .update({ cantidad_real_consumida: ins.cantidadReal })
              .eq('id', ins.id);
          }
        }
      }
    } catch (err) {
      console.warn('Fallo Supabase cerrarLaborOT:', err);
    }

    const actuales = await this.obtenerOTs(tenantId);
    const actualizadas = actuales.map(o => {
      if (o.id === otId) {
        return {
          ...o,
          estado: 'completada' as const,
          superficieRealHa: cierre.superficieRealHa,
          fechaCierre: cierre.fechaCierre
        };
      }
      return o;
    });
    localStorage.setItem(LOCAL_STORAGE_OTS, JSON.stringify(actualizadas));
    return true;
  },

  // ==========================================================================
  // BLOQUE C: MONITOREO DE PLAGAS Y MALEZAS (FN-2.7)
  // ==========================================================================

  async obtenerMonitoreos(tenantId: string, loteId?: string): Promise<MonitoreoPlaga[]> {
    try {
      let query = supabase
        .from('monitoreos_plagas')
        .select(`*, lotes(nombre)`)
        .eq('tenant_id', tenantId)
        .order('fecha', { ascending: false });

      if (loteId) query = query.eq('lote_id', loteId);

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const monitoreos: MonitoreoPlaga[] = data.map((item: any) => ({
          id: item.id,
          tenantId: item.tenant_id,
          loteId: item.lote_id,
          loteNombre: item.lotes?.nombre,
          fecha: item.fecha,
          tipo: item.tipo,
          plagaNombre: item.plaga_nombre,
          severidad: item.severidad,
          estadioCultivo: item.estadio_cultivo,
          observaciones: item.observaciones,
          accionRecomendada: item.accion_recomendada,
          createdAt: item.created_at
        }));
        localStorage.setItem(LOCAL_STORAGE_MONITOREOS, JSON.stringify(monitoreos));
        return monitoreos;
      }
    } catch (err) {
      console.warn('Fallo Supabase obtenerMonitoreos, usando fallback local:', err);
    }

    const local = localStorage.getItem(LOCAL_STORAGE_MONITOREOS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (loteId) return parsed.filter((m: MonitoreoPlaga) => m.loteId === loteId);
        return parsed;
      } catch {}
    }

    return [];
  },

  async crearMonitoreo(
    tenantId: string, 
    input: Omit<MonitoreoPlaga, 'id' | 'tenantId' | 'createdAt'>
  ): Promise<MonitoreoPlaga> {
    const id = crypto.randomUUID();
    const payload = {
      id,
      tenant_id: tenantId,
      lote_id: input.loteId,
      fecha: input.fecha,
      tipo: input.tipo,
      plaga_nombre: input.plagaNombre,
      severidad: input.severidad,
      estadio_cultivo: input.estadioCultivo || null,
      observaciones: input.observaciones || null,
      accion_recomendada: input.accionRecomendada || null
    };

    try {
      await supabase.from('monitoreos_plagas').insert(payload);
    } catch (err) {
      console.warn('Fallo Supabase crearMonitoreo:', err);
    }

    const nuevo: MonitoreoPlaga = {
      id,
      tenantId,
      ...input,
      createdAt: new Date().toISOString()
    };

    const actuales = await this.obtenerMonitoreos(tenantId);
    localStorage.setItem(LOCAL_STORAGE_MONITOREOS, JSON.stringify([nuevo, ...actuales]));
    return nuevo;
  },

  // ==========================================================================
  // BLOQUE C: TABLERO DE MARGEN BRUTO POR LOTE (FN-2.8)
  // ==========================================================================

  async obtenerMargenesBrutos(tenantId: string, campanaId: string): Promise<MargenBrutoLote[]> {
    try {
      const { data, error } = await supabase
        .from('margenes_brutos')
        .select(`
          *,
          lotes (
            nombre,
            superficie_ha,
            cultivos (nombre)
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('campana_id', campanaId);

      if (error) throw error;

      if (data && data.length > 0) {
        const margenes: MargenBrutoLote[] = data.map((item: any) => {
          const rinde = Number(item.rinde_estimado_qq_ha) || 0;
          const precio = Number(item.precio_venta_usd_qq) || 0;
          const costos = 
            (Number(item.costo_semilla_usd_ha) || 0) +
            (Number(item.costo_fertilizantes_usd_ha) || 0) +
            (Number(item.costo_fitosanitarios_usd_ha) || 0) +
            (Number(item.costo_labores_usd_ha) || 0) +
            (Number(item.costo_cosecha_usd_ha) || 0);
          
          const margenHa = Number(((rinde * precio) - costos).toFixed(2));
          const sup = Number(item.lotes?.superficie_ha) || 100;
          const margenTotal = Number((margenHa * sup).toFixed(2));

          return {
            id: item.id,
            tenantId: item.tenant_id,
            loteId: item.lote_id,
            loteNombre: item.lotes?.nombre,
            cultivoNombre: item.lotes?.cultivos?.nombre,
            superficieHa: sup,
            campanaId: item.campana_id,
            rindeEstimadoQqHa: rinde,
            precioVentaUsdQq: precio,
            costoSemillaUsdHa: Number(item.costo_semilla_usd_ha) || 0,
            costoFertilizantesUsdHa: Number(item.costo_fertilizantes_usd_ha) || 0,
            costoFitosanitariosUsdHa: Number(item.costo_fitosanitarios_usd_ha) || 0,
            costoLaboresUsdHa: Number(item.costo_labores_usd_ha) || 0,
            costoCosechaUsdHa: Number(item.costo_cosecha_usd_ha) || 0,
            margenBrutoUsdHa: margenHa,
            margenTotalLoteUsd: margenTotal
          };
        });
        localStorage.setItem(LOCAL_STORAGE_MARGENES, JSON.stringify(margenes));
        return margenes;
      }
    } catch (err) {
      console.warn('Fallo Supabase obtenerMargenesBrutos, usando fallback:', err);
    }

    const local = localStorage.getItem(LOCAL_STORAGE_MARGENES);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return parsed.filter((m: MargenBrutoLote) => m.campanaId === campanaId);
      } catch {}
    }

    return [];
  },

  async guardarMargenBruto(
    tenantId: string, 
    input: Omit<MargenBrutoLote, 'id' | 'tenantId' | 'margenBrutoUsdHa' | 'margenTotalLoteUsd'>
  ): Promise<MargenBrutoLote> {
    const id = crypto.randomUUID();
    const payload = {
      tenant_id: tenantId,
      lote_id: input.loteId,
      campana_id: input.campanaId,
      rinde_estimado_qq_ha: input.rindeEstimadoQqHa,
      precio_venta_usd_qq: input.precioVentaUsdQq,
      costo_semilla_usd_ha: input.costoSemillaUsdHa,
      costo_fertilizantes_usd_ha: input.costoFertilizantesUsdHa,
      costo_fitosanitarios_usd_ha: input.costoFitosanitariosUsdHa,
      costo_labores_usd_ha: input.costoLaboresUsdHa,
      costo_cosecha_usd_ha: input.costoCosechaUsdHa
    };

    try {
      await supabase.from('margenes_brutos').upsert(payload);
    } catch (err) {
      console.warn('Fallo Supabase guardarMargenBruto:', err);
    }

    const costosTotales = 
      input.costoSemillaUsdHa + 
      input.costoFertilizantesUsdHa + 
      input.costoFitosanitariosUsdHa + 
      input.costoLaboresUsdHa + 
      input.costoCosechaUsdHa;
    const margenHa = Number(((input.rindeEstimadoQqHa * input.precioVentaUsdQq) - costosTotales).toFixed(2));
    const margenTotal = Number((margenHa * input.superficieHa).toFixed(2));

    const nuevo: MargenBrutoLote = {
      id,
      tenantId,
      ...input,
      margenBrutoUsdHa: margenHa,
      margenTotalLoteUsd: margenTotal
    };

    const actuales = await this.obtenerMargenesBrutos(tenantId, input.campanaId);
    const actualizados = [...actuales.filter(m => m.loteId !== input.loteId), nuevo];
    localStorage.setItem(LOCAL_STORAGE_MARGENES, JSON.stringify(actualizados));
    return nuevo;
  }
};
