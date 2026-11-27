/**
 * Tipos de datos para el Módulo 2: Gestión Agrícola y Catálogos Paramétricos (M2)
 */

export type TipoCultivo = 'agricola' | 'forrajero' | 'cobertura' | 'barbecho' | 'ganadero' | 'otro';

export type AptitudLote = 'agricola' | 'ganadero' | 'mixto' | 'reserva_bajo';

export type TipoLabor = 'siembra' | 'pulverizacion' | 'fertilizacion' | 'cosecha' | 'barbecho' | 'otra';

export type EstadoOT = 'pendiente' | 'en_curso' | 'completada' | 'cancelada';

export type TipoPlaga = 'maleza' | 'insecto' | 'enfermedad' | 'otro';

export type SeveridadPlaga = 'baja' | 'media' | 'alta' | 'critica';

// ==============================================================================
// BLOQUE A: CATASTRO Y CARTOGRAFÍA BASE
// ==============================================================================

export interface Campana {
  id: string;
  tenantId: string;
  nombre: string;
  fechaInicio?: string;
  fechaFin?: string;
  activa: boolean;
  createdAt?: string;
}

export interface Cultivo {
  id: string;
  tenantId: string;
  nombre: string;
  tipo: TipoCultivo;
  colorHex: string;
  esActivo: boolean;
  descripcion?: string;
  createdAt?: string;
}

export interface Lote {
  id: string;
  tenantId: string;
  campanaId?: string;
  cultivoId?: string;
  nombre: string;
  superficieHa: number;
  aptitud: AptitudLote;
  poligonoGeo?: any; // GeoJSON Geometry / Feature
  colorHex?: string;
  notas?: string;
  createdAt?: string;
  // Campos calculados o de join
  cultivoNombre?: string;
  cultivoColor?: string;
}

// ==============================================================================
// BLOQUE B: OPERACIONES Y ÓRDENES DE TRABAJO
// ==============================================================================

export interface OTInsumo {
  id?: string;
  productoNombre: string;
  dosisHa: number;
  unidad: string; // lt/ha, kg/ha, bolsas/ha
  cantidadTotalCalculada: number;
  cantidadRealConsumida?: number;
  costoUnitarioUsd?: number;
}

export interface OTLote {
  loteId: string;
  loteNombre?: string;
  superficieHa: number;
  porcentajeProrrateo: number; // 0-100%
  costoAsignadoUsd?: number;
}

export interface OrdenTrabajo {
  id: string;
  tenantId: string;
  campanaId?: string;
  numeroOt: string;
  tipoLabor: TipoLabor;
  contratista: string;
  maquinaria?: string;
  fechaEmision: string;
  fechaCierre?: string;
  estado: EstadoOT;
  superficieTotalHa: number;
  tarifaContratistaUsdHa?: number; // Sensible de precio
  costoTotalEstimadoUsd?: number;  // Sensible de precio
  superficieRealHa?: number;
  observaciones?: string;
  createdAt?: string;
  // Relaciones
  lotes: OTLote[];
  insumos: OTInsumo[];
}

// ==============================================================================
// BLOQUE C: SANIDAD Y MARGEN BRUTO
// ==============================================================================

export interface MonitoreoPlaga {
  id: string;
  tenantId: string;
  loteId: string;
  loteNombre?: string;
  fecha: string;
  tipo: TipoPlaga;
  plagaNombre: string;
  severidad: SeveridadPlaga;
  estadioCultivo?: string;
  observaciones?: string;
  accionRecomendada?: string;
  createdAt?: string;
}

export interface MargenBrutoLote {
  id: string;
  tenantId: string;
  loteId: string;
  loteNombre?: string;
  cultivoNombre?: string;
  superficieHa: number;
  campanaId: string;
  rindeEstimadoQqHa: number;       // Quintales por hectárea
  precioVentaUsdQq: number;        // USD por quintal
  costoSemillaUsdHa: number;
  costoFertilizantesUsdHa: number;
  costoFitosanitariosUsdHa: number;
  costoLaboresUsdHa: number;
  costoCosechaUsdHa: number;
  margenBrutoUsdHa?: number;       // Calculado
  margenTotalLoteUsd?: number;     // margenBrutoUsdHa * superficieHa
}

/**
 * Cultivos sugeridos por defecto para inicializar tenants
 */
export const CULTIVOS_SUGERIDOS_BASE: Omit<Cultivo, 'id' | 'tenantId'>[] = [
  { nombre: 'Soja 1ra', tipo: 'agricola', colorHex: '#83A653', esActivo: true, descripcion: 'Soja de primera época' },
  { nombre: 'Maíz Tardío', tipo: 'agricola', colorHex: '#D9A441', esActivo: true, descripcion: 'Maíz tardío o de segunda' },
  { nombre: 'Maíz Temprano', tipo: 'agricola', colorHex: '#E5A93C', esActivo: true, descripcion: 'Maíz temprano de primera' },
  { nombre: 'Trigo', tipo: 'agricola', colorHex: '#B6A77D', esActivo: true, descripcion: 'Fino ciclo invernal' },
  { nombre: 'Girasol', tipo: 'agricola', colorHex: '#EAB308', esActivo: true, descripcion: 'Girasol tradicional o confitero' },
  { nombre: 'Cebada Cervecera', tipo: 'agricola', colorHex: '#C8B27B', esActivo: true, descripcion: 'Cebada bajo contrato cervecero' },
  { nombre: 'Barbecho Químico', tipo: 'barbecho', colorHex: '#74796D', esActivo: true, descripcion: 'Lote en descanso con control de malezas' },
  { nombre: 'Pastura Alfalfa', tipo: 'forrajero', colorHex: '#38845A', esActivo: true, descripcion: 'Pastura perenne para pastoreo / rollos' }
];
