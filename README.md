# Crexative Design System Builder

Sistema de construcción de diseño gráfico basado en atomic design con grilla modular de 50px.

## 📁 Estructura del Proyecto

```
builder/
├── index.html              # HTML principal (estructura DOM)
├── styles.css              # Estilos CSS (diseño y apariencia)
├── app.js                  # Lógica JavaScript (funcionalidad)
└── README.md               # Documentación
```

## 🎨 Características

### Sistema de Componentes
- **Átomos**: Módulos y conectores básicos
- **Moléculas**: Combinaciones de 2+ átomos
- **Organismos**: Estructuras complejas de múltiples moléculas

### Herramientas de Diseño
- ✅ **10 Patrones Predefinidos**: L, Y, X, Diamond, Arc, Wave, V, Diagonal, S, Question
- ✅ **3 Logotipos**: Logo Principal, Mascota, Mascota Mini
- ✅ **4 Tipos de Formas**: Módulo, Conector, Conector Circular, Línea de Conexión
- ✅ **Grilla de 50px**: Sistema de snap automático para alineación perfecta
- ✅ **Agrupación**: Crea y manipula grupos de elementos
- ✅ **Multi-selección**: Selecciona múltiples elementos con Ctrl/Cmd + Click
- ✅ **Guías de Alineación**: Líneas visuales que muestran elementos alineados
- ✅ **Indicador de Distancia**: Muestra la distancia entre elementos en unidades de grilla

### Controles
- **Colores**: 6 colores predefinidos del sistema de diseño
- **Tamaño**: Ajuste de ancho, alto y border radius
- **Opacidad**: Control de transparencia (10-100%)
- **Spacing**: Padding/margen interno (0-20px)

## 🚀 Uso

1. **Abrir**: Simplemente abre `index.html` en tu navegador
2. **Crear Formas**:
   - Click en el canvas para agregar elementos individuales
   - Usa los botones de patrones para crear formas predefinidas
   - Usa los botones de logos para crear logotipos
3. **Editar**:
   - Click para seleccionar elementos
   - Arrastra para mover (snap automático a grilla)
   - Usa los sliders en el sidebar para ajustar propiedades
4. **Agrupar**:
   - Ctrl/Cmd + Click para seleccionar múltiples elementos
   - Click en "Agrupar Selección" para crear un grupo
   - Los grupos se mueven juntos como una unidad
5. **Exportar**: Click en "Exportar SVG" para guardar tu diseño

## ⌨️ Atajos de Teclado

- **Delete**: Eliminar elemento(s) seleccionado(s)
- **Escape**: Deseleccionar todo
- **Ctrl/Cmd + Click**: Multi-selección

## 🔧 Arquitectura del Código

### app.js - Módulos Principales

```javascript
// Constants
- GRID_SIZE, DEFAULT_COLOR, SHAPE_SIZES

// State Management
- state: objeto global con todo el estado de la aplicación

// DOM References
- DOM: referencias centralizadas a elementos del DOM

// Core Modules
- Utils: funciones de utilidad (snap, grid, coords)
- ShapeFactory: creación de formas y elementos visuales
- PatternBuilder: construcción de patrones complejos
- AlignmentHelper: guías de alineación y distancia
- GroupManager: manejo de grupos de elementos

// Main Functions
- createElement(): crea elementos en el canvas
- makeDraggable(): habilita arrastre con snap
- selectElement(): manejo de selección
- initEventHandlers(): inicializa todos los event listeners
```

### styles.css - Secciones

```css
/* Reset & Base */
/* Layout (Grid) */
/* Sidebar */
/* Buttons */
/* Canvas Container */
/* Elements on Canvas */
/* Snap Guide */
/* Shapes */
/* Pattern Buttons */
/* Grouped Elements */
/* Alignment Guides */
/* Distance Indicator */
```

### index.html - Estructura

```html
<!-- Sidebar -->
  - Tipo de Elemento
  - Color
  - Tamaño
  - Opacidad
  - Spacing
  - Formas
  - Logosímbolo
  - Agrupación
  - Acciones
  - Info

<!-- Canvas Area -->
  - Toolbar
  - Canvas Wrapper
    - Grid Background
    - Snap Guide
    - Alignment Guides
    - Canvas
```

## 🎯 Principios de Código Limpio Aplicados

- **DRY (Don't Repeat Yourself)**: Funciones reutilizables y módulos centralizados
- **KISS (Keep It Simple, Stupid)**: Código simple y fácil de entender
- **YAGNI (You Aren't Gonna Need It)**: Solo características necesarias
- **Separación de Responsabilidades**: HTML, CSS y JS en archivos separados
- **Modularidad**: Código organizado en módulos con responsabilidades claras

## 🐛 Solución de Problemas

### La grilla no se alinea correctamente con el snap-guide
✅ **Soluciones Implementadas**:

**Grilla del Fondo:**
```css
background-image:
    repeating-linear-gradient(0deg,
        #1F2937 0px, #1F2937 1px,        /* Línea en posición 0 */
        transparent 1px, transparent 50px /* Espacio hasta siguiente línea */
    )
```
- Líneas de 1px en posiciones exactas: 0, 50, 100, 150, 200...
- No hay offset inicial

**Snap Guide:**
```css
.snap-guide {
    width: 50px;
    height: 50px;
    box-shadow: inset 0 0 0 1px #00FFD1;  /* Borde interno, no afecta tamaño */
    transform: translate3d(0, 0, 0);       /* Renderizado píxel-perfecto */
}
```
- Tamaño exacto de 50px (sin bordes que agreguen píxeles)
- `box-shadow inset` para borde visual sin afectar dimensiones
- `transform: translate3d` fuerza renderizado en capa GPU para píxeles exactos

**JavaScript:**
```javascript
getCanvasCoords(clientX, clientY) {
    const rect = DOM.canvas.getBoundingClientRect();
    return {
        x: Math.round(clientX - rect.left),  // Sin decimales
        y: Math.round(clientY - rect.top)    // Sin decimales
    };
}
```
- `Math.round()` elimina problemas de sub-píxeles
- `getBoundingClientRect()` obtiene posición exacta del canvas

### Herramientas de Debug

Si la grilla sigue desalineada, abre `debug.html` para:
- Ver coordenadas del mouse en tiempo real
- Verificar cálculo de posiciones grid
- Comprobar valores de `getBoundingClientRect()`

También puedes descomentar esta línea en `app.js` (línea 787):
```javascript
console.log(`Mouse: (${coords.x}, ${coords.y}) → Grid: (${gridX}, ${gridY})`);
```

### Los elementos no se centran en la grilla
✅ **Solucionado**: La función `Utils.snapToGrid()` centra automáticamente los elementos en cada celda de la grilla.

### Coordenadas incorrectas al hacer click
✅ **Solucionado**: `Utils.getCanvasCoords()` convierte coordenadas del viewport a coordenadas relativas al canvas, tomando en cuenta el toolbar y otros elementos.

## 📝 Notas de Desarrollo

- **Grid Size**: 50px (constante GRID_SIZE)
- **Default Color**: #00FFD1 (cyan de Crexative)
- **Snap**: Siempre activo para mantener simetría perfecta
- **Frameworks**: Vanilla JavaScript (sin dependencias externas)

## 🔄 Próximas Mejoras Sugeridas

- [ ] Deshacer/Rehacer (Undo/Redo)
- [ ] Duplicar elementos (Ctrl+D)
- [ ] Copiar/Pegar (Ctrl+C/Ctrl+V)
- [ ] Zoom in/out
- [ ] Capas (layers)
- [ ] Guardar/Cargar proyectos (JSON)
- [ ] Más opciones de exportación (PNG, PDF)
- [ ] Temas de color personalizados
- [ ] Atajos de teclado para herramientas

## 📄 Licencia

Proyecto educativo - Crexative Design System
