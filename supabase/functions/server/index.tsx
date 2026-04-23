import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-b65c430c/health", (c) => {
  return c.json({ status: "ok" });
});

// Generate prescription with RCTA.ME integration
app.post("/make-server-b65c430c/generate-prescription", async (c) => {
  try {
    const body = await c.req.json();
    const {
      medicationId,
      medicationName,
      dosage,
      frequency,
      duration,
      doctorName,
      patientId,
      date,
    } = body;

    // Validate required fields
    if (!medicationId || !medicationName || !dosage || !frequency || !duration || !doctorName) {
      return c.json({ error: "Faltan campos requeridos" }, 400);
    }

    // In a real implementation, this would integrate with RCTA.ME API
    // For now, we'll simulate the integration

    // Generate a unique prescription number (simulated)
    const prescriptionNumber = `RCTA-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Simulate API call to RCTA.ME
    // In production, this would be:
    // const rctaMeApiKey = Deno.env.get('RCTA_ME_API_KEY');
    // const response = await fetch('https://api.rcta.me/v1/prescriptions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${rctaMeApiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     medication: medicationName,
    //     dosage,
    //     frequency,
    //     duration,
    //     doctor: doctorName,
    //     patient_id: patientId,
    //     date,
    //   }),
    // });
    // const rctaData = await response.json();

    // Simulate a successful response from RCTA.ME
    const prescriptionData = {
      prescriptionNumber,
      prescriptionUrl: `https://rcta.me/prescriptions/${prescriptionNumber}`,
      medication: medicationName,
      dosage,
      frequency,
      duration,
      doctor: doctorName,
      generatedAt: new Date().toISOString(),
      status: 'active',
    };

    // Store prescription data in KV store for reference
    await kv.set(`prescription:${prescriptionNumber}`, prescriptionData);
    await kv.set(`medication:${medicationId}:prescription`, prescriptionNumber);

    console.log(`Prescription generated successfully: ${prescriptionNumber}`);

    return c.json({
      success: true,
      prescriptionNumber: prescriptionData.prescriptionNumber,
      prescriptionUrl: prescriptionData.prescriptionUrl,
      message: "Receta generada exitosamente en RCTA.ME",
    });

  } catch (error: any) {
    console.error("Error generating prescription:", error);
    return c.json(
      { error: `Error al generar la receta: ${error.message}` },
      500
    );
  }
});

// Validate doctor token and return patient data
app.post("/make-server-b65c430c/validate-doctor-token", async (c) => {
  try {
    const body = await c.req.json();
    const { tokenCode, doctorName, doctorLicense } = body;

    // Validate required fields
    if (!tokenCode || !doctorName || !doctorLicense) {
      return c.json({ error: "Faltan campos requeridos" }, 400);
    }

    // Get token from KV store
    const tokens = await kv.getByPrefix('access_tokens');

    // Find matching token
    let validToken = null;
    for (const [key, value] of Object.entries(tokens)) {
      const token = value as any;
      if (token.token_code === tokenCode && !token.revoked && !token.used) {
        // Check if token is expired
        const expiresAt = new Date(token.expires_at);
        const now = new Date();

        if (expiresAt > now) {
          validToken = token;
          break;
        }
      }
    }

    if (!validToken) {
      return c.json({ error: "Token inválido, expirado o ya usado" }, 401);
    }

    // Mark token as used
    validToken.used = true;
    validToken.used_at = new Date().toISOString();
    validToken.doctor_name = doctorName;
    validToken.doctor_license = doctorLicense;

    await kv.set(`access_tokens:${validToken.id || tokenCode}`, validToken);

    // Get patient data from KV store
    const patientId = validToken.patient_id;
    const patient = await kv.get(`patient:${patientId}`);

    // Get medical records based on access level
    const attentionRecords = await kv.getByPrefix(`attention_records:${patientId}`);
    const nursingRecords = await kv.getByPrefix(`nursing_records:${patientId}`);
    const medications = await kv.getByPrefix(`medications:${patientId}`);
    const studies = await kv.getByPrefix(`studies:${patientId}`);

    let sensitiveInfo = null;
    if (validToken.token_type === 'sensitive') {
      sensitiveInfo = await kv.get(`sensitive_info:${patientId}`);
    }

    // Log the access
    const logEntry = {
      patient_id: patientId,
      user_type: 'doctor',
      user_id: doctorLicense,
      action: `doctor_access_${validToken.token_type}`,
      details: JSON.stringify({
        doctor_name: doctorName,
        doctor_license: doctorLicense,
        access_level: validToken.token_type,
        token_code: tokenCode,
      }),
      timestamp: new Date().toISOString(),
      ip_address: c.req.header('x-forwarded-for') || 'unknown',
    };

    await kv.set(`activity_log:${Date.now()}:${Math.random()}`, logEntry);

    console.log(`Doctor access granted: ${doctorName} (${doctorLicense}) - ${validToken.token_type}`);

    return c.json({
      success: true,
      accessLevel: validToken.token_type,
      patientData: {
        patient,
        attentionRecords: Object.values(attentionRecords || {}),
        nursingRecords: Object.values(nursingRecords || {}),
        medications: Object.values(medications || {}),
        studies: Object.values(studies || {}),
        sensitiveInfo,
      },
    });

  } catch (error: any) {
    console.error("Error validating token:", error);
    return c.json(
      { error: `Error al validar el token: ${error.message}` },
      500
    );
  }
});

// Submit study results from authorized institution
app.post("/make-server-b65c430c/submit-study-result", async (c) => {
  try {
    const body = await c.req.json();
    const {
      authorizationToken,
      institutionName,
      studyType,
      studyName,
      result,
      fileUrl,
      patientId,
    } = body;

    // Validate required fields
    if (!authorizationToken || !institutionName || !studyType || !studyName || !result) {
      return c.json({ error: "Faltan campos requeridos" }, 400);
    }

    // Find authorized institution with this token
    const institutions = await kv.getByPrefix('authorized_institutions');

    let authorizedInstitution = null;
    for (const [key, value] of Object.entries(institutions)) {
      const inst = value as any;
      if (inst.authorization_token === authorizationToken && inst.active) {
        authorizedInstitution = inst;
        break;
      }
    }

    if (!authorizedInstitution) {
      return c.json({ error: "Token de autorización inválido o institución no autorizada" }, 401);
    }

    // Check if study type is allowed
    if (!authorizedInstitution.allowed_study_types.includes(studyType)) {
      return c.json({
        error: `La institución no está autorizada para enviar estudios de tipo: ${studyType}`
      }, 403);
    }

    // Create study record
    const studyId = `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const studyRecord = {
      id: studyId,
      patient_id: authorizedInstitution.patient_id,
      study_type: studyType,
      study_name: studyName,
      result,
      file_url: fileUrl || null,
      date: new Date().toISOString().split('T')[0],
      source: 'institution',
      institution_name: institutionName,
      received_at: new Date().toISOString(),
    };

    await kv.set(`studies:${authorizedInstitution.patient_id}:${studyId}`, studyRecord);

    // Log the activity
    const logEntry = {
      patient_id: authorizedInstitution.patient_id,
      user_type: 'institution',
      user_id: institutionName,
      action: 'study_received_from_institution',
      details: JSON.stringify({
        institution_name: institutionName,
        study_type: studyType,
        study_name: studyName,
      }),
      timestamp: new Date().toISOString(),
      ip_address: c.req.header('x-forwarded-for') || 'unknown',
    };

    await kv.set(`activity_log:${Date.now()}:${Math.random()}`, logEntry);

    console.log(`Study received from institution: ${institutionName} - ${studyName}`);

    return c.json({
      success: true,
      studyId,
      message: "Resultado del estudio recibido exitosamente",
    });

  } catch (error: any) {
    console.error("Error submitting study result:", error);
    return c.json(
      { error: `Error al recibir resultado del estudio: ${error.message}` },
      500
    );
  }
});

Deno.serve(app.fetch);