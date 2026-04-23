# Integración con RCTA.ME

## Descripción General

La aplicación de Historia Clínica Electrónica ahora incluye integración con el sistema RCTA.ME (Receta Digital Electrónica) para la generación de prescripciones médicas digitales.

## Funcionalidades Implementadas

### 1. Generación de Prescripciones

- Los médicos pueden prescribir medicación desde la web
- Cada medicación puede generar una receta electrónica vinculada con RCTA.ME
- Las recetas generadas quedan disponibles en la app del paciente

### 2. Flujo de Trabajo

1. **Prescripción de Medicación**: El médico registra la medicación en la sección "Registro de Medicación"
2. **Generación de Receta**: Al hacer clic en "Generar Receta", se abre una página dedicada
3. **Vinculación con RCTA.ME**: El sistema se conecta con RCTA.ME para generar la receta electrónica
4. **Receta Disponible**: El paciente puede ver y descargar su receta desde la app

### 3. Campos Requeridos para Generar Receta

- Nombre del medicamento
- Dosis
- Frecuencia
- Duración del tratamiento
- Nombre del médico
- Fecha de prescripción

## Arquitectura Técnica

### Frontend

**Página de Medicación** (`src/app/pages/MedicationPage.tsx`)
- Lista todas las medicaciones del paciente
- Muestra indicador visual si la receta ya fue generada
- Botón para generar/ver receta

**Página de Generación** (`src/app/pages/GeneratePrescriptionPage.tsx`)
- Muestra detalles de la medicación
- Integra con el backend para generar la receta
- Muestra el número de receta y permite descargar

### Backend

**Endpoint**: `/make-server-b65c430c/generate-prescription` (POST)

**Request Body**:
```json
{
  "medicationId": "string",
  "medicationName": "string",
  "dosage": "string",
  "frequency": "string",
  "duration": "string",
  "doctorName": "string",
  "patientId": "string",
  "date": "string"
}
```

**Response**:
```json
{
  "success": true,
  "prescriptionNumber": "RCTA-1234567890-ABC123",
  "prescriptionUrl": "https://rcta.me/prescriptions/RCTA-1234567890-ABC123",
  "message": "Receta generada exitosamente en RCTA.ME"
}
```

### Base de Datos Local

Las prescripciones generadas se almacenan con los siguientes campos adicionales en la tabla `medications`:

- `prescription_url`: URL de la receta en RCTA.ME
- `prescription_number`: Número único de la receta
- `prescription_generated_at`: Fecha y hora de generación

## Integración Real con RCTA.ME

### Implementación Actual (Simulada)

Actualmente, la integración está **simulada** para fines de prototipado. El sistema genera:
- Números de receta únicos en formato `RCTA-{timestamp}-{random}`
- URLs simuladas apuntando a `https://rcta.me/prescriptions/{number}`

### Implementación en Producción

Para conectar con el API real de RCTA.ME, se debe:

1. **Obtener Credenciales API**:
   - Registrarse en RCTA.ME como institución médica
   - Obtener API Key

2. **Configurar Variable de Entorno**:
   ```bash
   RCTA_ME_API_KEY=tu-api-key-aqui
   ```

3. **Actualizar el Código** (`supabase/functions/server/index.tsx`):
   
   Descomentar y adaptar el código de integración real:
   ```typescript
   const rctaMeApiKey = Deno.env.get('RCTA_ME_API_KEY');
   const response = await fetch('https://api.rcta.me/v1/prescriptions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${rctaMeApiKey}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       medication: medicationName,
       dosage,
       frequency,
       duration,
       doctor: doctorName,
       patient_id: patientId,
       date,
     }),
   });
   const rctaData = await response.json();
   ```

## Características de Seguridad

- ✅ Las recetas tienen números únicos e intransferibles
- ✅ Se almacena un registro completo de cada receta generada
- ✅ Las recetas están vinculadas al paciente específico
- ✅ Cumple con la Ley de Protección de Datos Personales 25.326

## Experiencia del Usuario

### Para el Paciente:
1. Ve sus medicaciones en la sección "Registro de Medicación"
2. Puede identificar cuáles tienen receta generada (indicador verde)
3. Puede acceder a la receta digital en cualquier momento
4. Puede descargar/presentar la receta en farmacias adheridas

### Para el Médico:
1. Prescribe la medicación normalmente
2. Genera la receta electrónica con un clic
3. La receta queda automáticamente disponible para el paciente
4. Recibe confirmación con el número de receta

## Próximos Pasos

- [ ] Conectar con el API real de RCTA.ME
- [ ] Agregar validación de disponibilidad del medicamento
- [ ] Implementar notificaciones push cuando se genera una receta
- [ ] Agregar historial de recetas generadas
- [ ] Implementar renovación de recetas
- [ ] Agregar código QR para validación en farmacias
