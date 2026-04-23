# Funcionalidad de Información de Emergencia

## Descripción General

Se ha implementado un sistema completo de información de emergencia para pacientes que estén impedidos o en situación crítica. Esta funcionalidad permite mostrar rápidamente información médica crítica y contacto de emergencia sin necesidad de autenticación compleja.

## Características Principales

### 1. Botón de Emergencia Prominente

**Ubicación**: Dashboard principal (parte superior)

**Características**:
- Diseño en rojo brillante con animación pulsante
- Acceso con un solo toque/clic
- Altamente visible y diferenciado del resto de la interfaz
- Texto claro: "INFORMACIÓN DE EMERGENCIA"

### 2. Página de Información de Emergencia

**Ruta**: `/emergency-info`

**Información Mostrada**:

#### Contacto de Emergencia (Sección Principal)
- Nombre completo del contacto
- Relación con el paciente
- Número de teléfono
- Botón de llamada directa (funciona en móviles)

#### Datos Básicos del Paciente
- Nombre completo
- DNI
- Edad
- Fecha de nacimiento
- Cobertura de salud
- Plan médico
- Número de afiliado

#### Información Médica Crítica

**Tipo de Sangre**
- Destacado en rojo
- Fácilmente visible para personal médico

**Alergias**
- Lista completa de alergias registradas
- Destacado en naranja con símbolo de alerta

**Condiciones Crónicas**
- Lista de enfermedades crónicas
- Importante para tratamiento de emergencia

**Medicación Actual**
- Últimos 5 medicamentos registrados
- Dosis y frecuencia

### 3. Registro de Contacto de Emergencia

**Durante el Registro Inicial**:
- Campos obligatorios en paso 2 del registro
- Nombre completo
- Teléfono
- Relación (padre/madre, hijo/a, hermano/a, cónyuge, pareja, amigo/a, otro)

**Visualización**:
- Sección dedicada en "Datos Personales"
- Tarjeta destacada en rojo
- Indicador visual si no hay contacto registrado

## Flujo de Uso

### Caso de Uso 1: Emergencia con Paciente Impedido

1. Personal médico/paramédico toma el teléfono del paciente
2. Accede a la aplicación
3. Ve el botón rojo de "INFORMACIÓN DE EMERGENCIA" en el dashboard
4. Accede con un toque
5. Ve inmediatamente:
   - Contacto de emergencia con botón para llamar
   - Datos del paciente
   - Información médica crítica (alergias, tipo sangre, condiciones)

### Caso de Uso 2: Registro de Contacto

1. Usuario completa registro inicial
2. En paso 2, ingresa datos de contacto de emergencia
3. Datos quedan guardados en el perfil
4. Pueden visualizarse y editarse desde "Datos Personales"

### Caso de Uso 3: Actualización de Contacto

1. Usuario accede a "Datos Personales"
2. Ve sección de "Contacto de Emergencia"
3. Click en "Editar Contacto de Emergencia"
4. Actualiza la información

## Diseño Visual

### Colores y Estilo

**Página de Emergencia**:
- Fondo: Rojo (#DC2626)
- Header: Rojo oscuro (#B91C1C)
- Iconos: Amarillo de advertencia para énfasis
- Tarjetas: Blanco sobre fondo rojo para máxima legibilidad

**Botón de Dashboard**:
- Gradiente rojo (#DC2626 a #B91C1C)
- Borde grueso rojo oscuro
- Icono de advertencia con animación pulsante
- Efecto hover con escala aumentada

**Sección de Contacto (Datos Personales)**:
- Fondo rojo claro (#FEF2F2)
- Borde rojo (#FECACA)
- Iconos rojos

### Elementos de UX

- **Botón de llamada**: Grande, verde, con icono de teléfono
- **Información organizada**: Cards separadas por tipo de información
- **Alta legibilidad**: Textos grandes, contraste alto
- **Iconos descriptivos**: Cada sección tiene su ícono representativo
- **Instrucciones para personal médico**: Nota al final con indicaciones

## Cumplimiento Legal

✅ **Ley 25.326 de Protección de Datos Personales**
- El contacto de emergencia es opcional pero recomendado
- Usuario tiene control sobre su información
- Datos almacenados de forma segura

✅ **Seguridad**
- Información visible sin necesidad de desbloqueo complejo
- Balance entre accesibilidad y privacidad
- No requiere token de autenticación (apropiado para emergencias)

## Arquitectura Técnica

### Frontend

**Componentes**:
- `EmergencyInfoPage.tsx`: Página principal de emergencia
- `DashboardPage.tsx`: Botón de acceso rápido
- `PersonalDataPage.tsx`: Visualización y edición de contacto
- `RegisterPage.tsx`: Captura inicial de datos

### Base de Datos

**Campos en PatientData**:
```typescript
interface PatientData {
  // ... campos existentes
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}
```

**Almacenamiento**:
- LocalStorage (sistema actual)
- Campos opcionales en el perfil del paciente

### Integración con Datos Médicos

La página de emergencia obtiene información de múltiples fuentes:
1. **Datos personales**: Del perfil del paciente
2. **Tipo de sangre y alergias**: De "Información Sensible"
3. **Medicación actual**: De "Registro de Medicación" (últimos 5)

## Mejoras Futuras

- [ ] Modo "Mostrar en pantalla de bloqueo" para emergencias extremas
- [ ] QR code con información de emergencia
- [ ] Múltiples contactos de emergencia (primario, secundario)
- [ ] Historial de accesos a información de emergencia
- [ ] Integración con servicios de emergencia (911, SAME)
- [ ] Traducción automática para personal médico extranjero
- [ ] Alertas médicas específicas (ej: "Diabético insulinodependiente")

## Testing

Para probar la funcionalidad:

1. Crear un nuevo usuario con contacto de emergencia
2. Navegar al dashboard
3. Verificar que el botón rojo sea visible y prominente
4. Acceder a la página de emergencia
5. Verificar que toda la información se muestre correctamente
6. Probar el botón de llamada (en móvil)
7. Agregar información sensible (alergias, tipo de sangre)
8. Agregar medicaciones
9. Verificar que aparezcan en la página de emergencia

## Notas Importantes

⚠️ **Privacidad vs Accesibilidad**: Esta funcionalidad balancea la necesidad de acceso rápido en emergencias con la privacidad del paciente. En una emergencia real, esta información puede salvar vidas.

✅ **Recomendaciones al Usuario**: Se debe educar al usuario sobre la importancia de:
- Mantener actualizado el contacto de emergencia
- Registrar alergias y condiciones médicas críticas
- Mantener actualizada la medicación
- Considerar agregar esta pantalla como acceso directo en el teléfono
