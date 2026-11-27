import { supabase } from '../config/supabase';
import { Campana, Cultivo, Lote, CULTIVOS_SUGERIDOS_BASE } from '../types/agricola';

const LOCAL_STORAGE_CULTIVOS = 'campo360_param_cultivos';
const LOCAL_STORAGE_CAMPANAS = 'campo360_param_campanas';
const LOCAL_STORAGE_LOTES = 'campo360_lotes';

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

    // Fallback Local
    const local = localStorage.getItem(LOCAL_STORAGE_CAMPANAS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }

    // Default si no existe ninguna
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
        // Desactivar las demás campañas activas
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
      console.warn('Fallo Supabase crearCampana, guardando offline:', err);
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
      await supabase
        .from('campanas')
        .update({ activa: false })
        .eq('tenant_id', tenantId);

      await supabase
        .from('campanas')
        .update({ activa: true })
        .eq('id', campanaId);
    } catch (err) {
      console.warn('Fallo Supabase establecerCampanaActiva:', err);
    }

    const actuales = await this.obtenerCampanas(tenantId);
    const actualizadas = actuales.map(c => ({
      ...c,
      activa: c.id === campanaId
    }));
    localStorage.setItem(LOCAL_STORAGE_CAMPANAS, JSON.stringify(actualizadas));
  },

  // ==========================================================================
  // GESTIÓN DE CULTIVOS PARAMÉTRICOS (Catálogo Paramétrico)
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
        // Sembrar automáticamente si está vacío en Supabase
        return await this.sembrarCultivosIniciales(tenantId);
      }
    } catch (err) {
      console.warn('Fallo Supabase obtenerCultivos, usando fallback local:', err);
    }

    // Fallback Local
    const local = localStorage.getItem(LOCAL_STORAGE_CULTIVOS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    // Inicializar seed local
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
      const { data, error } = await supabase
        .from('cultivos')
        .insert(payload)
        .select()
        .single();

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
      console.warn('Fallo Supabase crearCultivo, guardando offline:', err);
      const cultivoOffline: Cultivo = {
        id,
        tenantId,
        ...input,
        createdAt: new Date().toISOString()
      };
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
      await supabase
        .from('cultivos')
        .update(payload)
        .eq('id', cultivoId)
        .eq('tenant_id', tenantId);
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
      await supabase
        .from('cultivos')
        .delete()
        .eq('id', cultivoId)
        .eq('tenant_id', tenantId);
    } catch (err) {
      console.warn('Fallo Supabase eliminarCultivo:', err);
    }

    const actuales = await this.obtenerCultivos(tenantId);
    const filtrados = actuales.filter(c => c.id !== cultivoId);
    localStorage.setItem(LOCAL_STORAGE_CULTIVOS, JSON.stringify(filtrados));
    return true;
  },

  // ==========================================================================
  // GESTIÓN DE LOTES AGRÍCOLAS
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

    // Fallback Local
    const local = localStorage.getItem(LOCAL_STORAGE_LOTES);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (campanaId) {
          return parsed.filter((l: Lote) => l.campanaId === campanaId);
        }
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
        .select(`
          *,
          cultivos (
            nombre,
            color_hex
          )
        `)
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
      console.warn('Fallo Supabase guardarLote, guardando offline:', err);
      const loteOffline: Lote = {
        id,
        tenantId,
        ...lote,
        createdAt: new Date().toISOString()
      };
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
      await supabase
        .from('lotes')
        .delete()
        .eq('id', loteId)
        .eq('tenant_id', tenantId);
    } catch (err) {
      console.warn('Fallo Supabase eliminarLote:', err);
    }

    const actuales = await this.obtenerLotes(tenantId);
    const filtrados = actuales.filter(l => l.id !== loteId);
    localStorage.setItem(LOCAL_STORAGE_LOTES, JSON.stringify(filtrados));
    return true;
  }
};
