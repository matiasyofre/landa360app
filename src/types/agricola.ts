/**
/**
 * Tipos de datos para el Módulo 2: Gestión Agrícola y Catálogos Paramétricos
 */

export type TipoCultivo = 'agricola' | 'forrajero' | 'cobertura' | 'barbecho' | 'ganadero' | 'otro';

export type AptitudLote = 'agricola' | 'ganadero' | 'mixto' | 'reserva_bajo';

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

/**
 * Cultivos sugeridos por defecto para inicializar tenants
 * No están hardcodeados en los formularios: se insertan en la BD y el usuario los administra libremente.
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
