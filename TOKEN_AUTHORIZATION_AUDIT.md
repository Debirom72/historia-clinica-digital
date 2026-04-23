# Sistema de Autorización por Token y Trazabilidad

## Descripción General

Sistema completo de autorización por token temporal para acceso médico y registro de auditoría/trazabilidad que cumple con la **Ley 25.326 de Protección de Datos Personales** de Argentina.

---

## ÍNDICE

1. [Sistema de Tokens de Autorización](#1-sistema-de-tokens-de-autorización)
2. [Portal Médico](#2-portal-médico)
3. [Sistema de Auditoría y Trazabilidad](#3-sistema-de-auditoría-y-trazabilidad)
4. [Cumplimiento Legal](#4-cumplimiento-legal)
5. [Arquitectura Técnica](#5-arquitectura-técnica)
6. [Flujos de Trabajo](#6-flujos-de-trabajo)
7. [Seguridad y Privacidad](#7-seguridad-y-privacidad)

---

## 1. SISTEMA DE TOKENS DE AUTORIZACIÓN

### Descripción

Sistema de tokens temporales tipo "Authenticator" que permite al paciente autorizar el acceso de médicos a su historia clínica electrónica por períodos limitados de 3 minutos.

### Características Principales

#### Generación de Tokens

**Página**: `AuthorizeDoctorPage.tsx` (`/authorize-doctor`)

**Proceso**:
1. Paciente selecciona nivel de acceso:
   - **Básico**: Datos personales, atención, enfermería, medicación, estudios
   - **Completo**: Incluye información sensible adicional

2. Sistema genera código de 6 dígitos aleatorio (formato: `123456`)

3. Token válido por **3 minutos** desde generación

4. Cada token es de un solo uso (no reutilizable)

5. Paciente puede revocar tokens antes de su vencimiento

**Características del Token**:
- Código numérico de 6 dígitos
- Generación aleatoria segura
- Válido por 180 segundos (3 minutos)
- Vinculado a nivel de acceso específico
- Único y no reutilizable
- Revocable en cualquier momento

#### Niveles de Acceso

**Acceso Básico**:
- ✅ Datos personales (nombre, DNI, cobertura)
- ✅ Registros de atención médica
- ✅ Registros de enfermería
- ✅ Medicación prescrita
- ✅ Estudios realizados
- ❌ Información sensible (alergias, condiciones crónicas específicas, etc.)

**Acceso Completo (Sensible)**:
- ✅ Todo lo del acceso básico
- ✅ Tipo de sangre
- ✅ Alergias detalladas
- ✅ Condiciones crónicas
- ✅ Información psiquiátrica (si existe)
- ✅ Historial de adicciones (si existe)

#### Gestión de Tokens Activos

**Visualización**:
- Lista de todos los tokens activos no expirados
- Contador en tiempo real de tiempo restante
- Estado: Usado/No usado
- Tipo de acceso otorgado

**Revocación**:
- Botón para revocar cualquier token activo
- Revocación instantánea
- Token queda inválido inmediatamente
- Se registra en auditoría

#### Interfaz de Usuario

**Token Generado**:
```
┌─────────────────────────────────┐
│  ✓ Token Generado Exitosamente  │
│                                  │
│      ┌──────────────┐            │
│      │   123456     │  ← 6 dígitos
│      └──────────────┘            │
│                                  │
│   ⏱ Válido por 3 minutos        │
│                                  │
│   Comparte este código con      │
│   tu médico para que acceda     │
└─────────────────────────────────┘
```

**Token Activo**:
```
Token: 456789
Tipo: Acceso Completo
⏱ Expira en: 2:37
✓ Usado
[Revocar]
```

---

## 2. PORTAL MÉDICO

### Descripción

Interfaz web separada para que médicos accedan a información de pacientes mediante tokens temporales autorizados.

### Acceso al Portal

**URL**: `/doctor-portal`

**Disponible desde**:
- Página de bienvenida (botón "Portal Médico")
- Link directo compartido por la institución

### Autenticación Médica

**Campos Requeridos**:
1. **Nombre del Médico**: Nombre completo del profesional
2. **Matrícula Profesional**: Número de matrícula (ej: MN 12345, MP 6789)
3. **Token de Acceso**: Código de 6 dígitos proporcionado por el paciente

**Proceso de Validación**:
```
1. Médico ingresa credenciales + token
2. Sistema valida token en backend
3. Verifica que no esté expirado, revocado o usado
4. Marca token como "usado"
5. Registra acceso en auditoría
6. Otorga acceso temporal (3 minutos)
7. Muestra información del paciente
```

### Sesión Médica

**Duración**: 3 minutos desde autenticación

**Contador Visible**:
- Temporizador en tiempo real
- Formato: `MM:SS`
- Color naranja para visibilidad
- Alerta cuando expira

**Al Expirar**:
- Sesión se cierra automáticamente
- Médico debe solicitar nuevo token
- No se puede extender la sesión
- Debe volver a autenticarse

### Visualización de Datos

**Tabs Organizados por Sección**:

#### Tab 1: Atención
- Registros de consultas médicas
- Motivo de consulta
- Evolución del paciente
- Intervenciones realizadas
- Prácticas
- Estudios solicitados
- Médico tratante y fecha

#### Tab 2: Enfermería
- Signos vitales
- Presión arterial
- Temperatura
- Frecuencia cardíaca
- Saturación de oxígeno
- Observaciones de enfermería
- Fecha y hora de cada registro

#### Tab 3: Medicación
- Medicamentos prescritos
- Dosis
- Frecuencia de administración
- Duración del tratamiento
- Médico que prescribió
- Fecha de prescripción
- Recetas generadas (RCTA.ME)

#### Tab 4: Estudios
- Tipo de estudio
- Resultados
- Fecha de realización
- Observaciones

#### Tab 5: Info Sensible (solo si acceso completo)
- Tipo de sangre
- Alergias
- Condiciones crónicas
- ⚠️ Solo visible con token de "Acceso Completo"

### Restricciones y Recordatorios

**Banner Legal**:
```
⚠️ Recordatorio Legal
• Este acceso está siendo registrado
• Sesión expira en: [contador]
• Sujeto a Ley 25.326
• Mantén confidencialidad
```

**Acciones NO Permitidas**:
- ❌ Editar información del paciente
- ❌ Descargar datos masivos
- ❌ Exportar a formatos externos
- ❌ Compartir el token con terceros
- ❌ Extender la sesión más allá de 3 minutos

---

## 3. SISTEMA DE AUDITORÍA Y TRAZABILIDAD

### Descripción

Registro completo de todos los accesos y modificaciones a la información médica del paciente, cumpliendo con la **Ley 25.326**.

### Página de Auditoría

**URL**: `/audit-log`

**Accesible desde**: Dashboard del paciente

### Eventos Registrados

#### Categorías de Eventos

**Gestión de Tokens**:
- `token_generated`: Token de acceso generado
- `token_revoked`: Token revocado manualmente
- `token_used`: Token utilizado por médico

**Accesos Médicos**:
- `doctor_access_basic`: Médico accedió con permiso básico
- `doctor_access_sensitive`: Médico accedió a información sensible

**Acciones del Paciente**:
- `patient_login`: Paciente inició sesión
- `patient_logout`: Paciente cerró sesión
- `data_viewed`: Información visualizada
- `data_updated`: Información actualizada

**Creación de Contenido**:
- `record_created`: Nuevo registro médico creado
- `prescription_generated`: Nueva receta generada

### Estructura de Registro de Auditoría

**Campos Almacenados**:
```json
{
  "id": "unique_id",
  "patient_id": "patient_123",
  "user_type": "doctor" | "patient",
  "user_id": "MN12345" | "user_456",
  "action": "doctor_access_basic",
  "details": {
    "doctor_name": "Dr. Juan Pérez",
    "doctor_license": "MN 12345",
    "access_level": "basic",
    "token_code": "123456"
  },
  "timestamp": "2026-04-22T14:30:00Z",
  "ip_address": "192.168.1.1"
}
```

### Visualización de Logs

#### Filtros Disponibles

**Por Tipo de Usuario**:
- Todos
- Solo Paciente
- Solo Médicos

**Búsqueda**:
- Por acción
- Por detalles
- Búsqueda de texto libre

#### Vista de Registro

```
┌────────────────────────────────────────┐
│ 🔑 Token Generado                      │
│ [Paciente]                             │
│ 22/04/2026 14:30:25                   │
│                                        │
│ Detalles:                              │
│ {                                      │
│   "token_type": "basic",               │
│   "expires_in": "3 minutes"            │
│ }                                      │
│ IP: localhost                          │
└────────────────────────────────────────┘
```

#### Estadísticas

**Dashboard de Auditoría**:

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Total     │   Accesos   │   Tokens    │  Acciones   │
│   Eventos   │   Médicos   │  Generados  │  Paciente   │
│             │             │             │             │
│     156     │      23     │      45     │     88      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Exportación de Registros

**Formato**: CSV

**Contenido**:
- Fecha/Hora
- Tipo de Usuario
- Acción
- Detalles
- IP Address

**Uso**:
- Auditorías legales
- Cumplimiento normativo
- Investigaciones de seguridad
- Reportes para autoridades

**Ejemplo CSV**:
```csv
Fecha/Hora,Tipo Usuario,Acción,Detalles,IP
22/04/2026 14:30:25,doctor,Acceso Médico Básico,"...",192.168.1.1
22/04/2026 14:25:10,patient,Token Generado,"...",localhost
```

### Retención de Datos

**Política de Retención**:
- Logs almacenados indefinidamente
- Paciente puede exportar en cualquier momento
- No se eliminan automáticamente
- Cumple con requisitos legales de conservación

---

## 4. CUMPLIMIENTO LEGAL

### Ley 25.326 - Protección de Datos Personales (Argentina)

#### Artículos Aplicables

**Artículo 4** - Calidad de los Datos
- ✅ Datos exactos y actualizados
- ✅ Almacenamiento seguro
- ✅ Conservación por tiempo necesario

**Artículo 11** - Consentimiento
- ✅ Paciente autoriza explícitamente cada acceso
- ✅ Puede revocar autorización en cualquier momento
- ✅ Token expira automáticamente

**Artículo 13** - Derecho de Acceso
- ✅ Paciente puede ver todos los accesos
- ✅ Información clara y comprensible
- ✅ Acceso gratuito al registro de auditoría

**Artículo 14** - Derecho de Rectificación
- ✅ Paciente puede actualizar su información
- ✅ Cambios registrados en auditoría

**Artículo 43** - Seguridad
- ✅ Medidas técnicas y organizativas
- ✅ Tokens temporales y no reutilizables
- ✅ Registro completo de accesos

### Firma Digital

**Ley 25.506** - Firma Digital
- ✅ Firmas de médicos en registros
- ✅ No repudio de actos médicos
- ✅ Integridad de documentos

### Secreto Profesional Médico

**Código de Ética Médica**
- ✅ Acceso solo con autorización del paciente
- ✅ Registro de cada acceso
- ✅ Limitación temporal del acceso

---

## 5. ARQUITECTURA TÉCNICA

### Frontend

**Páginas Implementadas**:

1. **AuthorizeDoctorPage.tsx** (`/authorize-doctor`)
   - Generación de tokens
   - Gestión de tokens activos
   - Revocación

2. **AuditLogPage.tsx** (`/audit-log`)
   - Visualización de logs
   - Filtros y búsqueda
   - Exportación CSV
   - Estadísticas

3. **DoctorPortalPage.tsx** (`/doctor-portal`)
   - Autenticación médica
   - Visualización de datos del paciente
   - Contador de sesión
   - Tabs organizados

### Backend

**Endpoint**: `/make-server-b65c430c/validate-doctor-token` (POST)

**Flujo**:
```
1. Recibe: tokenCode, doctorName, doctorLicense
2. Busca token en KV store
3. Valida:
   - Token existe
   - No está revocado
   - No ha sido usado
   - No ha expirado
4. Marca token como usado
5. Registra acceso en auditoría
6. Obtiene datos del paciente según nivel
7. Retorna información autorizada
```

**Request**:
```json
{
  "tokenCode": "123456",
  "doctorName": "Dr. Juan Pérez",
  "doctorLicense": "MN 12345"
}
```

**Response (Éxito)**:
```json
{
  "success": true,
  "accessLevel": "basic" | "sensitive",
  "patientData": {
    "patient": { ... },
    "attentionRecords": [ ... ],
    "nursingRecords": [ ... ],
    "medications": [ ... ],
    "studies": [ ... ],
    "sensitiveInfo": { ... } // solo si accessLevel = sensitive
  }
}
```

**Response (Error)**:
```json
{
  "error": "Token inválido, expirado o ya usado"
}
```

### Base de Datos (LocalStorage/KV Store)

#### Colecciones

**access_tokens**:
```typescript
{
  id: string,
  patient_id: string,
  token_code: string,        // 6 dígitos
  token_type: 'basic' | 'sensitive',
  created_at: string,        // ISO timestamp
  expires_at: string,        // created_at + 3 min
  revoked: boolean,
  revoked_at?: string,
  used: boolean,
  used_at?: string,
  doctor_name?: string,      // Al usar
  doctor_license?: string    // Al usar
}
```

**activity_logs**:
```typescript
{
  id: string,
  patient_id: string,
  user_type: 'patient' | 'doctor',
  user_id: string,
  action: string,
  details: string,           // JSON stringified
  timestamp: string,         // ISO timestamp
  ip_address: string
}
```

---

## 6. FLUJOS DE TRABAJO

### Flujo Completo: Consulta Médica

```
PASO 1: ANTES DE LA CONSULTA
┌─────────────────────────────────┐
│ Paciente en su app              │
│ 1. Va a "Autorizar Médico"      │
│ 2. Selecciona nivel: Básico     │
│ 3. Genera token: 456789         │
│ 4. Comparte código con médico   │
└─────────────────────────────────┘
         │
         ▼
PASO 2: DURANTE LA CONSULTA
┌─────────────────────────────────┐
│ Médico en Portal Médico         │
│ 1. Ingresa su nombre             │
│ 2. Ingresa matrícula: MN 12345  │
│ 3. Ingresa token: 456789        │
│ 4. Click "Acceder"              │
└─────────────────────────────────┘
         │
         ▼
PASO 3: VALIDACIÓN (Backend)
┌─────────────────────────────────┐
│ Sistema valida token            │
│ ✓ Token existe                  │
│ ✓ No expirado (< 3 min)         │
│ ✓ No revocado                   │
│ ✓ No usado previamente          │
│ ✓ Marca como usado              │
│ ✓ Registra en auditoría         │
└─────────────────────────────────┘
         │
         ▼
PASO 4: ACCESO OTORGADO
┌─────────────────────────────────┐
│ Médico ve información           │
│ • Datos del paciente            │
│ • Historia clínica              │
│ • Contador: 3:00 → 0:00         │
│ • Al expirar: Sesión cierra     │
└─────────────────────────────────┘
         │
         ▼
PASO 5: DESPUÉS DE LA CONSULTA
┌─────────────────────────────────┐
│ Paciente revisa auditoría       │
│ • Ve acceso del Dr. Pérez       │
│ • Fecha: 22/04 14:30           │
│ • Tipo: Acceso Básico          │
│ • Duración: 3 minutos          │
└─────────────────────────────────┘
```

### Flujo: Revocación de Token

```
1. Paciente genera token: 123456
2. Comparte con médico
3. Paciente cambia de opinión
4. Va a "Tokens Activos"
5. Click "Revocar" en token 123456
6. Token queda inválido
7. Si médico intenta usar → ERROR
8. Revocación registrada en auditoría
```

---

## 7. SEGURIDAD Y PRIVACIDAD

### Medidas de Seguridad Implementadas

#### Tokens

✅ **Corta Duración**: 3 minutos (180 segundos)
✅ **Un Solo Uso**: No reutilizable después de validación
✅ **Revocables**: Paciente puede invalidar en cualquier momento
✅ **Aleatorios**: Generación criptográficamente segura
✅ **Específicos**: Vinculados a nivel de acceso

#### Sesiones Médicas

✅ **Temporales**: Máximo 3 minutos
✅ **No Extendibles**: No se puede renovar sin nuevo token
✅ **Monitoreadas**: Contador visible en todo momento
✅ **Registradas**: Cada segundo de acceso en auditoría

#### Auditoría

✅ **Completa**: Todos los eventos registrados
✅ **Inmutable**: Logs no se pueden editar
✅ **Trazable**: IP, timestamp, usuario identificado
✅ **Transparente**: Paciente ve todo

### Principios de Privacidad

**Consentimiento Informado**:
- Paciente decide qué compartir
- Conoce quién accederá
- Sabe exactamente qué verán

**Control Total**:
- Genera tokens cuando quiere
- Revoca cuando quiere
- Ve todos los accesos

**Transparencia**:
- Registro completo de accesos
- Sin accesos ocultos
- Exportación disponible

**Minimización de Datos**:
- Dos niveles de acceso
- Médico solo ve lo necesario
- Información sensible protegida

---

## RESUMEN EJECUTIVO

### Para Pacientes

✅ **Control Total**: Tú decides quién accede y cuándo
✅ **Transparencia**: Ves todos los accesos en tiempo real
✅ **Seguridad**: Tokens temporales de 3 minutos
✅ **Legalidad**: Cumple Ley 25.326

### Para Médicos

✅ **Acceso Rápido**: Token de 6 dígitos, 3 minutos
✅ **Información Completa**: Según autorización del paciente
✅ **Legal**: Todos los accesos registrados
✅ **Profesional**: Interfaz clara y organizada

### Para el Sistema

✅ **Cumplimiento Legal**: Ley 25.326 completa
✅ **Auditoría**: Registro completo e inmutable
✅ **Seguridad**: Tokens temporales, no reutilizables
✅ **Trazabilidad**: Cada acción registrada

---

## PRÓXIMOS PASOS

### Mejoras Futuras

- [ ] Integración con sistemas de identidad digital (RENAPER)
- [ ] Autenticación de dos factores para médicos
- [ ] Tokens con QR code para facilitar compartir
- [ ] Notificaciones push cuando médico accede
- [ ] Blockchain para registro inmutable de auditoría
- [ ] Integración con colegios médicos para validar matrículas
- [ ] Análisis de patrones de acceso sospechosos
- [ ] Geo-localización de accesos para detección de anomalías

---

## CONTACTO Y SOPORTE

Para consultas sobre el sistema de tokens y auditoría:
- Documentación técnica: Ver este archivo
- Soporte legal: Consultar con asesoría legal sobre Ley 25.326
- Soporte técnico: Crear issue en repositorio del proyecto
