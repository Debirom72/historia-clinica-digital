# Sistema de Gestión de Estudios Médicos

## Descripción General

Sistema completo para la gestión de estudios médicos (laboratorio, imágenes, diagnósticos) con tres modalidades de incorporación:
1. **Carga Manual**: Ingreso directo de resultados por el paciente
2. **Carga de Estudios Antiguos**: Digitalización de estudios previos en papel o archivos
3. **Recepción Automática**: Instituciones autorizadas envían resultados directamente

---

## ÍNDICE

1. [Carga Manual de Estudios](#1-carga-manual-de-estudios)
2. [Carga de Estudios Antiguos](#2-carga-de-estudios-antiguos)
3. [Autorización de Instituciones](#3-autorización-de-instituciones)
4. [Recepción Automática de Resultados](#4-recepción-automática-de-resultados)
5. [Visualización de Estudios](#5-visualización-de-estudios)
6. [Trazabilidad y Auditoría](#6-trazabilidad-y-auditoría)
7. [Integración con Portal Médico](#7-integración-con-portal-médico)

---

## 1. CARGA MANUAL DE ESTUDIOS

### Descripción

Permite al paciente o médico ingresar manualmente los resultados de estudios realizados.

### Características

**Botón**: "Nuevo Estudio" (Header de la página)

**Campos del Formulario**:
- **Fecha**: Fecha de realización del estudio
- **Tipo de Estudio**: Dropdown con opciones:
  - Laboratorio
  - Radiología
  - Ecografía
  - Tomografía
  - Resonancia Magnética
  - Electrocardiograma
  - Otro
- **Nombre del Estudio**: Descripción específica (ej: "Análisis de sangre completo")
- **Resultado**: Área de texto para resultados detallados
- **Archivo** (opcional): Adjuntar PDF, imagen o documento

### Flujo de Uso

```
1. Click en "Nuevo Estudio"
2. Completar formulario
3. Opcionalmente adjuntar archivo
4. Click "Guardar Estudio"
5. Estudio aparece en la lista con badge "Manual"
6. Se registra en auditoría
```

### Registro en Auditoría

```json
{
  "action": "study_uploaded",
  "details": {
    "study_type": "laboratorio",
    "study_name": "Hemograma completo",
    "source": "manual"
  }
}
```

---

## 2. CARGA DE ESTUDIOS ANTIGUOS

### Descripción

Funcionalidad para digitalizar y cargar estudios médicos realizados con anterioridad, permitiendo al paciente incorporar su historial médico previo a la plataforma digital.

### Características

**Botón**: "Cargar Estudios Antiguos" (Header de la página)

**Funcionalidad**:
- ✅ Carga múltiple de archivos simultáneos
- ✅ Formatos aceptados: PDF, JPG, PNG, DICOM
- ✅ Sin límite de cantidad de archivos
- ✅ Vista previa de archivos seleccionados
- ✅ Tamaño de archivo visible

### Interfaz de Carga

```
┌────────────────────────────────────────┐
│ Cargar Estudios Antiguos               │
├────────────────────────────────────────┤
│                                        │
│ Seleccionar Archivos:                 │
│ [Elegir archivos...]                  │
│                                        │
│ Formatos: PDF, JPG, PNG, DICOM        │
│ Múltiples archivos permitidos         │
│                                        │
│ ┌────────────────────────────────────┐│
│ │ Archivos Seleccionados (3):        ││
│ │ ✓ Analisis_2020_01.pdf (2.3 MB)   ││
│ │ ✓ Radiografia_torax.jpg (1.5 MB)  ││
│ │ ✓ Ecografia_2019.pdf (3.1 MB)     ││
│ └────────────────────────────────────┘│
│                                        │
│ ⚠ Importante:                         │
│ Los estudios serán incorporados a tu  │
│ historia clínica y disponibles para   │
│ médicos autorizados.                  │
│                                        │
│ [Cargar 3 Estudio(s)]  [Cancelar]    │
└────────────────────────────────────────┘
```

### Procesamiento de Archivos

**Para cada archivo cargado**:
1. Se crea un registro en la tabla `studies`
2. Campo `study_type`: "archivo-antiguo"
3. Campo `study_name`: Nombre del archivo
4. Campo `source`: "old_upload"
5. Campo `file_url`: Referencia al archivo almacenado

### Almacenamiento

En producción, los archivos se almacenarían en:
- **Supabase Storage**: Bucket privado del paciente
- **Nomenclatura**: `patient_{id}/old_studies/{timestamp}_{filename}`
- **Acceso**: Solo con autorización del paciente

Actualmente (prototipo):
- Simula almacenamiento con URL local
- Formato: `local://{filename}`

### Casos de Uso

**Ejemplo 1**: Paciente nuevo digitaliza historial
```
Paciente se registra en la plataforma
→ Tiene 10 años de estudios en papel/CD
→ Escanea o fotografía estudios importantes
→ Carga múltiples archivos a la vez
→ Historia clínica completa digitalizada
```

**Ejemplo 2**: Migración de sistema anterior
```
Paciente cambia de obra social
→ Exporta estudios del sistema antiguo
→ Carga todos los PDFs en un solo paso
→ Continuidad de atención asegurada
```

### Registro en Auditoría

```json
{
  "action": "old_studies_uploaded",
  "details": {
    "count": 5,
    "files": [
      "Analisis_2020.pdf",
      "Radiografia_2019.jpg",
      "Ecografia_2018.pdf",
      "Tomografia_2021.dcm",
      "Laboratorio_2020.pdf"
    ]
  }
}
```

---

## 3. AUTORIZACIÓN DE INSTITUCIONES

### Descripción

Sistema que permite al paciente autorizar a instituciones médicas (hospitales, laboratorios, centros de diagnóstico) para que envíen resultados de estudios directamente a su historia clínica electrónica, sin necesidad de carga manual.

### Características

**Botón**: "Autorizar Institución" (Header de la página)

### Formulario de Autorización

**Campos Requeridos**:

1. **Nombre de la Institución** *
   - Texto libre
   - Ejemplo: "Hospital Italiano", "Laboratorio Stamboulian"

2. **Tipo de Institución** *
   - Hospital
   - Clínica
   - Laboratorio
   - Centro de Diagnóstico
   - Centro de Radiología

3. **Email de Contacto** *
   - Email institucional
   - Para envío de credenciales de acceso

4. **Teléfono**
   - Opcional
   - Para contacto directo

5. **Tipos de Estudios Autorizados** * (Multi-selección)
   - ☐ Laboratorio
   - ☐ Radiología
   - ☐ Ecografía
   - ☐ Tomografía
   - ☐ Resonancia Magnética
   - ☐ Electrocardiograma
   - ☐ Anatomía Patológica
   - ☐ Otros

### Proceso de Autorización

```
PASO 1: PACIENTE AUTORIZA
┌─────────────────────────────────┐
│ Paciente completa formulario    │
│ - Nombre: Hospital Italiano     │
│ - Tipo: Hospital                │
│ - Email: resultados@hi.com.ar   │
│ - Estudios: Laboratorio, Rx     │
│ Click "Autorizar Institución"   │
└─────────────────────────────────┘
         │
         ▼
PASO 2: SISTEMA GENERA TOKEN
┌─────────────────────────────────┐
│ Token único: abc123def456...    │
│ Se almacena en BD               │
│ Se envía email a institución    │
└─────────────────────────────────┘
         │
         ▼
PASO 3: INSTITUCIÓN RECIBE CREDENCIALES
┌─────────────────────────────────┐
│ Email automático:               │
│ "Ha sido autorizado por         │
│ [Nombre Paciente] para enviar   │
│ resultados de estudios."        │
│                                 │
│ Token: abc123def456...          │
│ API Endpoint: [URL]             │
│ Tipos permitidos: Lab, Rx       │
└─────────────────────────────────┘
         │
         ▼
PASO 4: INSTITUCIÓN INTEGRA
┌─────────────────────────────────┐
│ Institución configura sistema   │
│ Usa token en llamadas API       │
│ Envía resultados automáticamente│
└─────────────────────────────────┘
```

### Token de Autorización

**Generación**:
```javascript
const authToken = Math.random().toString(36).substring(2, 15) +
                 Math.random().toString(36).substring(2, 15);
// Resultado: "k2j5h8g9f3d1a4"
```

**Características**:
- ✅ Único por institución
- ✅ Permanente hasta revocación
- ✅ Asociado a tipos de estudios específicos
- ✅ Permite auditoría de origen de datos

### Visualización de Instituciones Autorizadas

**Card Verde** (destacado en la página):

```
┌────────────────────────────────────────────────────────┐
│ 🏥 Instituciones Autorizadas                           │
│ Estas instituciones pueden enviar resultados directamente│
├────────────────────────────────────────────────────────┤
│                                                        │
│ ┌──────────────────────────────────────────────┐     │
│ │ Hospital Italiano                   [Revocar] │     │
│ │ Hospital                                      │     │
│ │ [laboratorio] [radiologia] [tomografia]      │     │
│ │ Autorizado el 22/04/2026                     │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ ┌──────────────────────────────────────────────┐     │
│ │ Laboratorio Stamboulian         [Revocar]    │     │
│ │ Laboratorio                                   │     │
│ │ [laboratorio]                                │     │
│ │ Autorizado el 20/04/2026                     │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Revocación de Autorización

**Proceso**:
1. Paciente click en "Revocar"
2. Institución marcada como `active: false`
3. `revoked_at` timestamp guardado
4. Institución ya no puede enviar más resultados
5. Token queda inválido
6. Se registra en auditoría

**Efecto**:
- ❌ API rechaza nuevos envíos con ese token
- ✅ Estudios ya recibidos permanecen en historia clínica
- ✅ Institución puede ser re-autorizada generando nuevo token

### Casos de Uso

**Ejemplo 1**: Paciente con obra social
```
Paciente tiene OSDE
→ Autoriza a todos los laboratorios de la red
→ Laboratorios envían resultados automáticamente
→ Paciente no tiene que cargar manualmente
→ Historia clínica siempre actualizada
```

**Ejemplo 2**: Tratamiento oncológico
```
Paciente en tratamiento de cáncer
→ Autoriza a:
  - Hospital donde recibe quimio
  - Laboratorio para análisis periódicos
  - Centro de diagnóstico para tomografías
→ Todos envían resultados directamente
→ Médico oncólogo accede a info completa y actualizada
```

### Registro en Auditoría

**Autorización**:
```json
{
  "action": "institution_authorized",
  "details": {
    "institution_name": "Hospital Italiano",
    "institution_type": "hospital",
    "allowed_study_types": ["laboratorio", "radiologia"]
  }
}
```

**Revocación**:
```json
{
  "action": "institution_revoked",
  "details": {
    "institution_id": "inst_123456"
  }
}
```

---

## 4. RECEPCIÓN AUTOMÁTICA DE RESULTADOS

### Descripción

API endpoint que permite a instituciones autorizadas enviar resultados de estudios directamente al sistema del paciente.

### Endpoint

**URL**: `POST /make-server-b65c430c/submit-study-result`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {publicAnonKey}
```

**Request Body**:
```json
{
  "authorizationToken": "k2j5h8g9f3d1a4",
  "institutionName": "Hospital Italiano",
  "studyType": "laboratorio",
  "studyName": "Hemograma completo",
  "result": "Glóbulos rojos: 4.5 M/uL\nGlóbulos blancos: 7.2 K/uL\nHemoglobina: 14.2 g/dL\nHematocrito: 42%",
  "fileUrl": "https://storage.hospitalitaliano.org.ar/results/12345.pdf",
  "patientId": "patient_123"
}
```

**Response (Éxito)**:
```json
{
  "success": true,
  "studyId": "study_1713812345_abc123",
  "message": "Resultado del estudio recibido exitosamente"
}
```

**Response (Error - Token inválido)**:
```json
{
  "error": "Token de autorización inválido o institución no autorizada"
}
```

**Response (Error - Tipo no autorizado)**:
```json
{
  "error": "La institución no está autorizada para enviar estudios de tipo: tomografia"
}
```

### Validaciones del Backend

1. ✅ **Token válido**: Existe en BD y está activo
2. ✅ **Institución activa**: No ha sido revocada
3. ✅ **Tipo permitido**: El estudio es de un tipo autorizado
4. ✅ **Campos completos**: Todos los campos requeridos presentes

### Procesamiento

**Al recibir resultado**:
1. Valida token y permisos
2. Crea registro en tabla `studies`
3. Marca `source: 'institution'`
4. Incluye `institution_name`
5. Guarda `received_at` timestamp
6. Registra en auditoría
7. (Futuro) Envía notificación push al paciente

### Integración Institucional

**Ejemplo de Código (Python)**:
```python
import requests

# Configuración
API_URL = "https://proyecto.supabase.co/functions/v1/make-server-b65c430c/submit-study-result"
AUTH_TOKEN = "k2j5h8g9f3d1a4"  # Token recibido al autorizar
ANON_KEY = "eyJ..."  # Public anon key

def enviar_resultado_estudio(paciente_dni, tipo_estudio, nombre, resultado, archivo_url=None):
    # Obtener patient_id del DNI (requeriría endpoint adicional)
    patient_id = obtener_patient_id_por_dni(paciente_dni)
    
    payload = {
        "authorizationToken": AUTH_TOKEN,
        "institutionName": "Hospital Italiano",
        "studyType": tipo_estudio,
        "studyName": nombre,
        "result": resultado,
        "fileUrl": archivo_url,
        "patientId": patient_id
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ANON_KEY}"
    }
    
    response = requests.post(API_URL, json=payload, headers=headers)
    
    if response.status_code == 200:
        print(f"✓ Resultado enviado: {response.json()['studyId']}")
    else:
        print(f"✗ Error: {response.json()['error']}")

# Uso
enviar_resultado_estudio(
    paciente_dni="12345678",
    tipo_estudio="laboratorio",
    nombre="Hemograma completo",
    resultado="Glóbulos rojos: 4.5 M/uL\n...",
    archivo_url="https://storage.hi.com.ar/results/12345.pdf"
)
```

### Notificaciones al Paciente

**Cuando llega nuevo estudio** (futuro):
1. Push notification:
   ```
   📊 Nuevo resultado disponible
   Hospital Italiano ha enviado:
   "Hemograma completo"
   
   [Ver ahora]
   ```

2. Email:
   ```
   Asunto: Nuevo resultado de estudio - Hospital Italiano
   
   Estimado paciente,
   
   Se ha recibido un nuevo resultado de estudio:
   
   Institución: Hospital Italiano
   Tipo: Laboratorio
   Estudio: Hemograma completo
   Fecha: 22/04/2026
   
   Ingresa a tu app para ver los resultados.
   ```

---

## 5. VISUALIZACIÓN DE ESTUDIOS

### Lista de Estudios

**Organización**: Orden cronológico descendente (más reciente primero)

**Card de Estudio**:
```
┌─────────────────────────────────────────────────┐
│ Hemograma completo              [Ver Archivo]   │
│                                                 │
│ 📅 22/04/2026  [Laboratorio]  [Institución]   │
│                                                 │
│ Resultado:                                      │
│ Glóbulos rojos: 4.5 M/uL                       │
│ Glóbulos blancos: 7.2 K/uL                     │
│ Hemoglobina: 14.2 g/dL                         │
│ Hematocrito: 42%                               │
└─────────────────────────────────────────────────┘
```

### Badges de Origen

**Color coding**:
- 🔵 **Azul** - Tipo de estudio (laboratorio, radiología, etc.)
- 🟢 **Verde** - Enviado por institución autorizada
- 🟣 **Morado** - Archivo antiguo cargado
- ⚪ **Gris** - Carga manual

### Filtros (Futuro)

- Por tipo de estudio
- Por institución
- Por rango de fechas
- Por origen (manual/institución/antiguo)

---

## 6. TRAZABILIDAD Y AUDITORÍA

### Eventos Registrados

**Carga Manual**:
```json
{
  "action": "study_uploaded",
  "user_type": "patient",
  "details": {
    "study_type": "laboratorio",
    "study_name": "Hemograma"
  }
}
```

**Carga Antigua**:
```json
{
  "action": "old_studies_uploaded",
  "user_type": "patient",
  "details": {
    "count": 5,
    "files": ["file1.pdf", "file2.jpg", ...]
  }
}
```

**Autorización Institución**:
```json
{
  "action": "institution_authorized",
  "user_type": "patient",
  "details": {
    "institution_name": "Hospital Italiano",
    "allowed_study_types": ["laboratorio"]
  }
}
```

**Recepción de Institución**:
```json
{
  "action": "study_received_from_institution",
  "user_type": "institution",
  "user_id": "Hospital Italiano",
  "details": {
    "study_type": "laboratorio",
    "study_name": "Hemograma completo"
  }
}
```

**Revocación**:
```json
{
  "action": "institution_revoked",
  "user_type": "patient",
  "details": {
    "institution_id": "inst_123"
  }
}
```

### Visualización en Registro de Auditoría

Todos estos eventos aparecen en `/audit-log` con:
- Fecha y hora exacta
- Usuario que realizó la acción
- Detalles completos
- IP de origen

---

## 7. INTEGRACIÓN CON PORTAL MÉDICO

### Acceso Médico a Estudios

**Tab "Estudios"** en Portal Médico:

```
Estudios Realizados
┌─────────────────────────────────────────┐
│ Hemograma completo                      │
│ Laboratorio • 22/04/2026                │
│ Enviado por: Hospital Italiano          │
│ Glóbulos rojos: 4.5 M/uL...            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Radiografía de tórax                    │
│ Radiología • 15/04/2026                 │
│ Archivo antiguo (cargado por paciente) │
│ Sin alteraciones patológicas           │
└─────────────────────────────────────────┘
```

**Información Visible**:
- ✅ Todos los estudios (manuales, antiguos, instituciones)
- ✅ Origen de cada estudio
- ✅ Resultados completos
- ✅ Archivos adjuntos
- ✅ Fechas de realización

---

## VENTAJAS DEL SISTEMA

### Para Pacientes

✅ **Historia completa**: Incorpora estudios viejos y nuevos
✅ **Sin carga manual**: Instituciones envían automáticamente
✅ **Control total**: Autoriza/revoca instituciones cuando quiera
✅ **Centralizado**: Todo en un solo lugar
✅ **Trazable**: Sabe de dónde vino cada estudio

### Para Médicos

✅ **Información completa**: Accede a todos los estudios del paciente
✅ **Actualizada**: Resultados llegan en tiempo real
✅ **Histórica**: Ve estudios antiguos digitalizados
✅ **Confiable**: Sabe el origen de cada estudio

### Para Instituciones

✅ **Automatizado**: Integración API simple
✅ **Seguro**: Token único por paciente
✅ **Controlado**: Solo envían tipos autorizados
✅ **Eficiente**: Elimina carga manual y errores

---

## SEGURIDAD Y PRIVACIDAD

### Autorización Granular

- ✅ Paciente autoriza institución específica
- ✅ Para tipos de estudios específicos
- ✅ Revocable en cualquier momento
- ✅ Tokens únicos no reutilizables

### Validación Estricta

- ✅ Token verificado en cada envío
- ✅ Tipo de estudio validado contra permisos
- ✅ Institución debe estar activa
- ✅ Todos los campos obligatorios

### Trazabilidad Completa

- ✅ Origen registrado en cada estudio
- ✅ Timestamp de recepción
- ✅ Institución emisora identificada
- ✅ Auditoría de autorizaciones y revocaciones

### Cumplimiento Legal

- ✅ Ley 25.326 - Consentimiento explícito
- ✅ Control del paciente sobre datos
- ✅ Trazabilidad de accesos
- ✅ Derecho a revocación

---

## PRÓXIMOS PASOS

### Mejoras Técnicas

- [ ] Almacenamiento real de archivos (Supabase Storage)
- [ ] Procesamiento OCR de PDFs escaneados
- [ ] Extracción automática de valores numéricos
- [ ] Normalización de resultados de laboratorio
- [ ] Gráficos de evolución de valores

### Mejoras de UX

- [ ] Notificaciones push al recibir estudios
- [ ] Email al autorizar institución
- [ ] Preview de archivos PDF/imágenes en la app
- [ ] Filtros y búsqueda de estudios
- [ ] Comparación de resultados entre fechas

### Integraciones

- [ ] HL7 FHIR para interoperabilidad
- [ ] DICOM para imágenes médicas
- [ ] QR code para compartir estudios temporalmente
- [ ] Integración con farmacias para recetas
- [ ] API pública para instituciones

---

## CONTACTO Y SOPORTE

Para integración institucional:
- Documentación API: Ver sección 4
- Ejemplos de código: Incluidos en este documento
- Soporte técnico: Crear issue en repositorio
