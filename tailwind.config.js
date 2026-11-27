/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campo: {
          bosque: '#24382C',     // Verde bosque profundo (Navbar, sidebar)
          oliva: '#536747',      // Verde oliva (Acciones secundarias)
          verde: '#83A653',      // Verde natural (Botones principales, acentos)
          tierra: '#B6A77D',     // Tierra suave (Categorías, detalles)
          arena: '#E9E5D9',      // Arena (Fondos secundarios)
          blanco: '#F7F7F2',     // Blanco cálido (Fondo general)
          texto: '#343B2D',      // Texto principal (Títulos y contenido)
          muted: '#74796D',      // Texto secundario (Descripciones)
          borde: '#DDDCD1',      // Bordes (Separadores y tarjetas)
          card: '#FFFFFF',       // Blanco puro (Tarjetas y formularios)
          exito: '#38845A',      // Verde éxito
          alerta: '#D9A441',     // Amarillo alerta
          error: '#C65B50',      // Rojo error
          info: '#52849A',       // Azul información
        }
      }
    },
  },
  plugins: [],
}
