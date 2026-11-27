import { CATALOGO_FUNCIONES } from '../types/rbac';

/**
 * Hook para evaluar permisos y privacidad de precios en la interfaz
 */
export function usePermission(funcionesAsignadas: string[] = [], esAdmin = false) {
  const tieneFuncion = (funcionId: string): boolean => {
    if (esAdmin) return true;
    return funcionesAsignadas.includes(funcionId);
  };

  const puedeVerPrecios = (): boolean => {
    if (esAdmin) return true;
    return tieneFuncion('fn_1_3_privacidad_precios');
  };

  const getModuloFunciones = (modulo: string) => {
    return CATALOGO_FUNCIONES.filter((f) => f.modulo === modulo);
  };

  return {
    tieneFuncion,
    puedeVerPrecios,
    getModuloFunciones,
    todasLasFunciones: CATALOGO_FUNCIONES,
  };
}
