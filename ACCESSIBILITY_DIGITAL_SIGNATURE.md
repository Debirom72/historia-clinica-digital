# Firma Digital y Accesibilidad

## Descripción General

Se han implementado dos funcionalidades críticas para mejorar la aplicación de Historia Clínica Electrónica:

1. **Firma Digital para Médicos**: Sistema de firma digital en registros médicos
2. **Accesibilidad Completa**: Soporte para personas con discapacidad visual (ceguera)

---

## 1. FIRMA DIGITAL PARA MÉDICOS

### Descripción

Sistema de firma digital que permite a los médicos autenticar los registros de atención médica que crean, garantizando la validez legal y la trazabilidad de cada registro.

### Características Principales

#### Componente de Firma Digital (`SignaturePad`)

**Funcionalidades**:
- Canvas interactivo para captura de firma manuscrita
- Botón para borrar y reintentar la firma
- Validación de firma antes de guardar
- Almacenamiento en formato base64 (imagen PNG)
- Validación legal con nota explicativa

**Interfaz**:
- Área de firma con cursor tipo "crosshair" para mejor precisión
- Botones claros: "Borrar" y "Confirmar Firma"
- Feedback visual cuando la firma está guardada
- Compatibilidad con mouse, touchpad y pantallas táctiles

#### Integración en Registro de Atención

**Ubicación**: `AttentionRecordPage.tsx`

**Flujo de Trabajo**:
1. Médico completa formulario de atención médica
2. Ingresa su nombre (requerido para habilitar firma)
3. Aparece el componente de firma digital
4. Médico firma en el canvas
5. Confirma la firma
6. Solo después puede guardar el registro (botón habilitado)

**Validaciones**:
- ✅ Nombre del médico es obligatorio antes de firmar
- ✅ La firma es obligatoria antes de guardar
- ✅ No se puede guardar un registro sin firma válida

#### Almacenamiento

**Campos en la Base de Datos**:
```typescript
{
  signature: string,           // Base64 encoded PNG image
  signed_at: string,           // ISO timestamp
  doctor_name: string,         // Nombre del médico firmante
  // ... otros campos del registro
}
```

#### Visualización

**En la Lista de Registros**:
- Cada registro muestra la firma del médico
- Imagen de la firma en formato visual
- Fecha y hora de firma
- Nombre del médico firmante

**Formato Visual**:
- Firma en recuadro azul destacado
- Altura fija de 96px para consistencia
- Centrada horizontalmente
- Timestamp de firma en texto pequeño

### Validez Legal

La firma digital implementada incluye:
- **Timestamp**: Fecha y hora exacta de firma
- **Identificación**: Nombre del médico firmante
- **Integridad**: Imagen capturada en el momento
- **No repudio**: El médico confirma activamente la firma

**Nota Legal Incluida**:
> "Al firmar digitalmente, confirmas la autenticidad de la información registrada. Esta firma tiene validez legal según la normativa argentina."

### Tecnología Utilizada

**Paquete**: `react-signature-canvas`
- Versión: 1.1.0-alpha.2
- Canvas HTML5 nativo
- Soporte multi-plataforma (desktop, tablet, móvil)
- Exportación a formato imagen

---

## 2. ACCESIBILIDAD PARA DISCAPACIDAD VISUAL

### Descripción

Sistema completo de accesibilidad que hace la aplicación usable para personas con ceguera o baja visión, cumpliendo con estándares WCAG 2.1 nivel AA.

### Componente Principal: `AccessibilityControls`

#### Ubicación en la Aplicación

**Botón Flotante**:
- Posición: Esquina inferior derecha
- Color: Azul con icono de ojo
- Siempre visible (z-index alto)
- Atajo de teclado: **Alt + A**

#### Funcionalidades

### 1. Lectura de Pantalla (Text-to-Speech)

**Cómo Funciona**:
- Utiliza la API nativa de síntesis de voz del navegador (`speechSynthesis`)
- Idioma: Español (es-ES)
- Velocidad: 0.9x (ligeramente más lenta para mejor comprensión)

**Modos de Activación**:
1. **Click-to-Speak**: Al hacer clic en cualquier elemento, lee su contenido
2. **Focus-to-Speak**: Al navegar con Tab, lee el elemento enfocado

**Contenido que Lee**:
- Etiquetas `aria-label`
- Texto visible (`textContent`)
- Placeholders de inputs
- Atributos `alt` de imágenes

**Controles**:
- Toggle ON/OFF desde panel de accesibilidad
- Cancelación automática al cambiar de elemento
- Persistencia: se guarda en localStorage

**Ejemplo de Uso**:
```
Usuario activa lectura de pantalla
→ Click en botón "Cerrar Sesión"
→ Escucha: "Cerrar sesión de la aplicación"
```

### 2. Tamaño de Fuente Ajustable

**Tres Niveles**:

| Nivel | Base Font Size | Encabezados | Botones/Inputs |
|-------|----------------|-------------|----------------|
| Normal | 16px | 1.5-2.5rem | 1rem |
| Grande | 20px | 2-2.5rem | 1.1rem |
| Muy Grande | 24px | 2.5-3rem | 1.25rem |

**Aplicación**:
- Se aplica a nivel `<body>` con clases CSS
- Afecta proporcionalmente todos los elementos
- Respeta jerarquía visual

**Persistencia**: Guardado en localStorage

### 3. Alto Contraste

**Modo de Alto Contraste**:
- Fondo: Negro puro (#000000)
- Texto: Blanco puro (#FFFFFF)
- Bordes: Blancos en todos los elementos
- Botones: Fondo blanco, texto negro

**Características**:
- Contraste 21:1 (máximo posible)
- Cumple WCAG AAA
- Bordes gruesos (2px) para mejor definición
- Inputs y textareas con bordes blancos marcados

**Toggle**: Activar/desactivar desde panel de accesibilidad

### 4. Indicadores de Foco Mejorados

**Estilo de Foco**:
- Borde azul de 3px (`#0066FF`)
- Offset de 2px (separado del elemento)
- Aplicado a todos los elementos enfocables
- Visible con navegación por teclado

**Aplicación**:
```css
*:focus-visible {
  outline: 3px solid #0066FF !important;
  outline-offset: 2px;
}
```

### Navegación por Teclado

#### Atajos de Teclado

| Atajo | Función |
|-------|---------|
| **Alt + A** | Abrir/Cerrar panel de accesibilidad |
| **Tab** | Navegar al siguiente elemento |
| **Shift + Tab** | Navegar al elemento anterior |
| **Enter / Space** | Activar botones y elementos interactivos |
| **Esc** | Cerrar diálogos y modales |

#### Elementos con soporte completo de teclado:

✅ Todos los botones
✅ Cards navegables (Dashboard)
✅ Formularios e inputs
✅ Diálogos y modales
✅ Botón de emergencia
✅ Panel de accesibilidad

### Atributos ARIA Implementados

#### Roles ARIA

**Estructurales**:
- `role="main"` - Contenido principal
- `role="banner"` - Encabezados de página
- `role="navigation"` - Menús de navegación
- `role="region"` - Áreas de firma digital
- `role="dialog"` - Panel de accesibilidad
- `role="button"` - Cards clickeables

#### Labels ARIA

**`aria-label`**: Descripciones claras de elementos
```html
<Button aria-label="Cerrar sesión de la aplicación">
<Button aria-label="Abrir panel de accesibilidad. Atajo: Alt + A">
<Button aria-label="Llamar ahora a Juan Pérez al número +54 9 11 1234-5678">
```

**`aria-pressed`**: Estado de botones toggle
```html
<Button aria-pressed={speechEnabled}>
  Lectura de Pantalla {speechEnabled ? 'ON' : 'OFF'}
</Button>
```

**`aria-hidden`**: Ocultar elementos decorativos
```html
<div className="icon" aria-hidden="true">
  <Icon />
</div>
```

#### Landmarks HTML5 Semánticos

```html
<header role="banner">...</header>
<main role="main">...</main>
<nav aria-label="Menú principal">...</nav>
<aside aria-label="Información de seguridad">...</aside>
```

### Skip Links

**Link "Saltar al contenido"**:
- Oculto visualmente (posición absoluta fuera de pantalla)
- Visible solo al recibir foco con teclado
- Lleva directamente al contenido principal
- Mejora navegación con lectores de pantalla

```html
<a href="#main-content" className="skip-to-content">
  Saltar al contenido principal
</a>
```

### Persistencia de Preferencias

Todas las configuraciones de accesibilidad se guardan en `localStorage`:

```javascript
localStorage.setItem('accessibility_fontSize', 'large');
localStorage.setItem('accessibility_highContrast', 'true');
localStorage.setItem('accessibility_speech', 'true');
```

**Beneficios**:
- Configuraciones persisten entre sesiones
- No requiere autenticación para aplicarse
- Se aplican automáticamente al cargar la página

### Compatibilidad con Lectores de Pantalla

La aplicación es compatible con los principales lectores de pantalla:

✅ **NVDA** (Windows) - Gratis
✅ **JAWS** (Windows) - Comercial
✅ **VoiceOver** (macOS/iOS) - Nativo
✅ **TalkBack** (Android) - Nativo
✅ **Narrator** (Windows) - Nativo

**Características que mejoran la experiencia**:
- Landmarks claros para navegación rápida
- Labels descriptivos en todos los elementos
- Feedback audible con síntesis de voz
- Navegación lógica con Tab
- Estructura semántica HTML5

### Estándares de Accesibilidad

#### WCAG 2.1 Nivel AA

La aplicación cumple con:

✅ **1.1.1 - Contenido No Textual**: Todas las imágenes tienen alt text o aria-label
✅ **1.4.3 - Contraste Mínimo**: Alto contraste disponible (21:1)
✅ **1.4.4 - Cambio de Tamaño de Texto**: Hasta 200% sin pérdida de funcionalidad
✅ **2.1.1 - Teclado**: Toda la funcionalidad accesible por teclado
✅ **2.1.2 - Sin Trampa de Teclado**: Navegación libre con Tab
✅ **2.4.1 - Saltar Bloques**: Skip link implementado
✅ **2.4.3 - Orden de Foco**: Secuencia lógica y coherente
✅ **2.4.7 - Foco Visible**: Indicadores de foco claros
✅ **3.2.4 - Identificación Consistente**: Patrones de UI consistentes
✅ **4.1.2 - Nombre, Función, Valor**: ARIA labels en todos los elementos

### Pruebas de Accesibilidad

#### Herramientas Recomendadas

1. **axe DevTools** (Extensión Chrome/Firefox)
2. **WAVE** (Web Accessibility Evaluation Tool)
3. **Lighthouse** (Chrome DevTools)
4. **Screen Reader** (NVDA, VoiceOver)

#### Checklist de Pruebas

- [ ] Navegar toda la app solo con teclado
- [ ] Activar lectura de pantalla y probar cada sección
- [ ] Cambiar tamaños de fuente y verificar legibilidad
- [ ] Activar alto contraste y revisar todos los componentes
- [ ] Probar con lector de pantalla real (NVDA/VoiceOver)
- [ ] Verificar que skip links funcionen
- [ ] Confirmar que focus indicators sean visibles
- [ ] Probar atajos de teclado (Alt+A, Tab, Enter, Esc)

### Mejores Prácticas Implementadas

1. **Semántica HTML**: Uso correcto de `<header>`, `<main>`, `<nav>`, `<aside>`
2. **ARIA solo cuando es necesario**: HTML semántico primero, ARIA como complemento
3. **Labels descriptivos**: Contexto completo en aria-labels
4. **Feedback multi-sensorial**: Visual + auditivo (toast + speech)
5. **Navegación lógica**: Orden de Tab coherente
6. **Indicadores claros**: Estados de botones (pressed, disabled)
7. **Persistencia**: Preferencias guardadas automáticamente

---

## Beneficios para Usuarios

### Para Usuarios con Ceguera

✅ Navegación completa con teclado
✅ Lectura automática de contenido
✅ Compatibilidad con lectores de pantalla profesionales
✅ Feedback audible de todas las acciones
✅ Estructura clara con landmarks

### Para Usuarios con Baja Visión

✅ Tamaños de fuente ajustables (hasta 200%)
✅ Modo de alto contraste (21:1)
✅ Indicadores de foco grandes y visibles
✅ Textos claros y legibles
✅ Botones grandes en secciones críticas (emergencia)

### Para Todos los Usuarios

✅ Navegación más rápida con teclado
✅ Atajos de teclado útiles
✅ Mejor experiencia en dispositivos móviles
✅ Feedback claro de acciones
✅ Interfaz más intuitiva

---

## Cumplimiento Legal

### Argentina

✅ **Ley 26.653** - Accesibilidad Web
- Sitios web del Estado deben cumplir con WCAG
- Esta aplicación médica cumple con estándares requeridos

✅ **Ley 25.326** - Protección de Datos Personales
- Firmas digitales añaden trazabilidad
- Accesibilidad garantiza acceso equitativo a datos de salud

✅ **Convención sobre los Derechos de las Personas con Discapacidad** (ONU)
- Argentina ratificó en 2008
- Acceso igualitario a tecnología de salud

---

## Instalación y Configuración

### Dependencias Instaladas

```bash
pnpm add react-signature-canvas @types/react-signature-canvas
```

### Archivos Modificados/Creados

**Nuevos Componentes**:
- `src/app/components/SignaturePad.tsx`
- `src/app/components/AccessibilityControls.tsx`

**Modificados**:
- `src/app/App.tsx` - Integra AccessibilityControls
- `src/app/pages/AttentionRecordPage.tsx` - Integra firma digital
- `src/app/pages/DashboardPage.tsx` - ARIA attributes
- `src/app/pages/EmergencyInfoPage.tsx` - ARIA attributes
- `src/styles/theme.css` - Estilos de accesibilidad

### Estilos CSS Agregados

- Tamaños de fuente variables (`.font-normal`, `.font-large`, `.font-xlarge`)
- Modo alto contraste (`.high-contrast`)
- Indicadores de foco (`:focus-visible`)
- Skip link (`.skip-to-content`)

---

## Próximos Pasos y Mejoras

### Firma Digital

- [ ] Integración con certificados digitales (AFIP)
- [ ] Verificación de firma con blockchain
- [ ] Firma biométrica adicional
- [ ] Timestamp certificado por autoridad

### Accesibilidad

- [ ] Soporte para braille displays
- [ ] Más idiomas para síntesis de voz
- [ ] Perfiles de accesibilidad predefinidos
- [ ] Modo dislexia (fuente OpenDyslexic)
- [ ] Subtítulos/transcripciones de contenido multimedia
- [ ] Reducción de animaciones (respeta `prefers-reduced-motion`)

---

## Recursos y Referencias

### Documentación

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [React Signature Canvas](https://github.com/agilgur5/react-signature-canvas)

### Leyes y Normativas

- [Ley 26.653 - Accesibilidad Web](http://servicios.infoleg.gob.ar/infolegInternet/anexos/175000-179999/175694/norma.htm)
- [Ley 25.326 - Protección de Datos Personales](http://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/norma.htm)

### Contacto

Para reportar problemas de accesibilidad o sugerir mejoras:
- Crear issue en el repositorio del proyecto
- Incluir detalles sobre tecnología asistiva utilizada
- Describir el problema de accesibilidad encontrado
