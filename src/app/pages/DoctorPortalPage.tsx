import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Shield, Key, User, FileText, AlertCircle, Clock, Loader2, Plus, Mic, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { SignaturePad } from '../components/SignaturePad';
import { AudioRecorder } from '../components/AudioRecorder';
import { localDB } from '../../lib/localAuth';

export function DoctorPortalPage() {
  const [tokenCode, setTokenCode] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorLicense, setDoctorLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [accessLevel, setAccessLevel] = useState<'basic' | 'sensitive'>('basic');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    consultationReason: '',
    patientEvolution: '',
    intervention: '',
    practice: '',
    requestedStudies: '',
    adverseEvents: '',
    date: new Date().toISOString().split('T')[0],
    signature: '',
  });
  const [medicationFormData, setMedicationFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!tokenCode || !doctorName || !doctorLicense) {
        toast.error('Completa todos los campos');
        setLoading(false);
        return;
      }

      // Get token from local database
      const tokens = await localDB.getByPrefix('access_tokens');

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
        throw new Error('Token inválido, expirado o ya usado');
      }

      // Mark token as used
      validToken.used = true;
      validToken.used_at = new Date().toISOString();
      validToken.doctor_name = doctorName;
      validToken.doctor_license = doctorLicense;

      await localDB.set(`access_tokens:${validToken.id || tokenCode}`, validToken);

      // Get patient data from local database
      const patientId = validToken.patient_id;
      const patient = await localDB.get(`patient:${patientId}`);

      // Get medical records based on access level
      const attentionRecords = await localDB.getByPrefix(`attention_records:${patientId}`);
      const nursingRecords = await localDB.getByPrefix(`nursing_records:${patientId}`);
      const medications = await localDB.getByPrefix(`medications:${patientId}`);
      const studies = await localDB.getByPrefix(`studies:${patientId}`);

      let sensitiveInfo = null;
      if (validToken.token_type === 'sensitive') {
        sensitiveInfo = await localDB.get(`sensitive_info:${patientId}`);
      }

      // Log the access
      await localDB.insert('activity_log', {
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
        ip_address: 'web_portal',
      });

      setPatientData({
        patient,
        attentionRecords: Object.values(attentionRecords || {}),
        nursingRecords: Object.values(nursingRecords || {}),
        medications: Object.values(medications || {}),
        studies: Object.values(studies || {}),
        sensitiveInfo,
      });
      setAccessLevel(validToken.token_type);
      setAuthenticated(true);
      setTimeRemaining(180); // 3 minutes in seconds

      toast.success('Acceso autorizado exitosamente');

      // Start countdown timer
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSessionExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Error al validar token');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionExpired = () => {
    toast.error('Sesión expirada. Token vencido.');
    setAuthenticated(false);
    setPatientData(null);
    setTokenCode('');
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.signature) {
        toast.error('Debes firmar el registro antes de guardarlo');
        return;
      }

      if (!formData.consultationReason) {
        toast.error('El motivo de consulta es obligatorio');
        return;
      }

      const { error } = await localDB.insert('attention_records', {
        patient_id: patientData.patient.id,
        consultation_reason: formData.consultationReason,
        patient_evolution: formData.patientEvolution,
        intervention: formData.intervention,
        practice: formData.practice,
        requested_studies: formData.requestedStudies,
        adverse_events: formData.adverseEvents,
        doctor_name: doctorName,
        signature: formData.signature,
        signed_at: new Date().toISOString(),
        date: formData.date,
      });

      if (error) throw error;

      // Log the activity
      await localDB.insert('activity_log', {
        patient_id: patientData.patient.id,
        user_type: 'doctor',
        user_id: doctorLicense,
        action: 'create_attention_record',
        details: JSON.stringify({
          doctor_name: doctorName,
          doctor_license: doctorLicense,
          consultation_reason: formData.consultationReason,
        }),
        timestamp: new Date().toISOString(),
        ip_address: 'web_portal',
      });

      toast.success('Registro de atención creado exitosamente');
      setIsRecordDialogOpen(false);

      // Refresh patient data
      const attentionRecords = await localDB.getByPrefix(`attention_records:${patientData.patient.id}`);
      setPatientData({
        ...patientData,
        attentionRecords: Object.values(attentionRecords || {}),
      });

      // Reset form
      setFormData({
        consultationReason: '',
        patientEvolution: '',
        intervention: '',
        practice: '',
        requestedStudies: '',
        adverseEvents: '',
        date: new Date().toISOString().split('T')[0],
        signature: '',
      });
    } catch (error: any) {
      console.error('Error creating attention record:', error);
      toast.error('Error al guardar el registro');
    }
  };

  const handleSubmitMedication = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!medicationFormData.medicationName || !medicationFormData.dosage || !medicationFormData.frequency || !medicationFormData.duration) {
        toast.error('Completa todos los campos requeridos');
        return;
      }

      const { error } = await localDB.insert('medications', {
        patient_id: patientData.patient.id,
        medication_name: medicationFormData.medicationName,
        dosage: medicationFormData.dosage,
        frequency: medicationFormData.frequency,
        duration: medicationFormData.duration,
        doctor_name: doctorName,
        prescription_url: null,
        date: medicationFormData.date,
      });

      if (error) throw error;

      // Log the activity
      await localDB.insert('activity_log', {
        patient_id: patientData.patient.id,
        user_type: 'doctor',
        user_id: doctorLicense,
        action: 'prescribe_medication',
        details: JSON.stringify({
          doctor_name: doctorName,
          doctor_license: doctorLicense,
          medication_name: medicationFormData.medicationName,
        }),
        timestamp: new Date().toISOString(),
        ip_address: 'web_portal',
      });

      toast.success('Medicación prescrita exitosamente');
      setIsMedicationDialogOpen(false);

      // Refresh patient data
      const medications = await localDB.getByPrefix(`medications:${patientData.patient.id}`);
      setPatientData({
        ...patientData,
        medications: Object.values(medications || {}),
      });

      // Reset form
      setMedicationFormData({
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      console.error('Error prescribing medication:', error);
      toast.error('Error al prescribir medicación');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-green-600" />
              <div>
                <CardTitle className="text-2xl">Portal Médico</CardTitle>
                <CardDescription>Acceso a Historia Clínica Electrónica</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Nombre del Médico *</Label>
                <Input
                  id="doctorName"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Dr. Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorLicense">Matrícula Profesional *</Label>
                <Input
                  id="doctorLicense"
                  value={doctorLicense}
                  onChange={(e) => setDoctorLicense(e.target.value)}
                  placeholder="MN 12345"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenCode">Token de Acceso *</Label>
                <Input
                  id="tokenCode"
                  value={tokenCode}
                  onChange={(e) => setTokenCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-2xl font-mono text-center tracking-widest"
                  required
                />
                <p className="text-xs text-gray-600">
                  Solicita al paciente que genere un token desde su aplicación móvil
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-900 font-semibold mb-1">
                      Importante
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• El token es válido por 3 minutos</li>
                      <li>• Cada acceso queda registrado en auditoría</li>
                      <li>• El nivel de acceso lo determina el paciente</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Acceder
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal Médico</h1>
                <p className="text-sm text-gray-500">Dr. {doctorName} - {doctorLicense}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-lg">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="font-mono font-bold text-orange-900">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                accessLevel === 'sensitive'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {accessLevel === 'sensitive' ? 'Acceso Completo' : 'Acceso Básico'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Datos del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre Completo</p>
                <p className="font-semibold">{patientData?.patient?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">DNI</p>
                <p className="font-semibold">{patientData?.patient?.dni}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                <p className="font-semibold">
                  {new Date(patientData?.patient?.birth_date).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cobertura</p>
                <p className="font-semibold">{patientData?.patient?.health_coverage}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="attention" className="space-y-4">
          <TabsList className={`grid w-full ${accessLevel === 'sensitive' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="attention">Atención</TabsTrigger>
            <TabsTrigger value="nursing">Enfermería</TabsTrigger>
            <TabsTrigger value="medication">Medicación</TabsTrigger>
            <TabsTrigger value="studies">Estudios</TabsTrigger>
            {accessLevel === 'sensitive' && (
              <TabsTrigger value="sensitive">Info Sensible</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="attention">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Registros de Atención</CardTitle>
                  <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Registro
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Nuevo Registro de Atención</DialogTitle>
                        <DialogDescription>
                          Graba o escribe la información de la consulta médica
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitRecord} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Fecha *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Motivo de Consulta *</Label>
                          <Tabs defaultValue="write" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="write" className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4" />
                                Escribir
                              </TabsTrigger>
                              <TabsTrigger value="record" className="flex items-center gap-2">
                                <Mic className="w-4 h-4" />
                                Grabar
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="write" className="mt-3">
                              <Textarea
                                value={formData.consultationReason}
                                onChange={(e) => setFormData({ ...formData, consultationReason: e.target.value })}
                                placeholder="Describe el motivo de la consulta"
                                rows={4}
                                required={!formData.consultationReason}
                              />
                            </TabsContent>
                            <TabsContent value="record" className="mt-3">
                              <AudioRecorder
                                fieldLabel="Motivo de Consulta"
                                placeholder="La transcripción del motivo de consulta aparecerá aquí..."
                                onTranscriptionComplete={(transcription) =>
                                  setFormData({ ...formData, consultationReason: transcription })
                                }
                              />
                            </TabsContent>
                          </Tabs>
                        </div>

                        <div className="space-y-2">
                          <Label>Evolución del Paciente</Label>
                          <Tabs defaultValue="write" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="write" className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4" />
                                Escribir
                              </TabsTrigger>
                              <TabsTrigger value="record" className="flex items-center gap-2">
                                <Mic className="w-4 h-4" />
                                Grabar
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="write" className="mt-3">
                              <Textarea
                                value={formData.patientEvolution}
                                onChange={(e) => setFormData({ ...formData, patientEvolution: e.target.value })}
                                placeholder="Describe la evolución"
                                rows={4}
                              />
                            </TabsContent>
                            <TabsContent value="record" className="mt-3">
                              <AudioRecorder
                                fieldLabel="Evolución del Paciente"
                                placeholder="La transcripción de la evolución aparecerá aquí..."
                                onTranscriptionComplete={(transcription) =>
                                  setFormData({ ...formData, patientEvolution: transcription })
                                }
                              />
                            </TabsContent>
                          </Tabs>
                        </div>

                        <div className="space-y-2">
                          <Label>Intervención</Label>
                          <Tabs defaultValue="write" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="write" className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4" />
                                Escribir
                              </TabsTrigger>
                              <TabsTrigger value="record" className="flex items-center gap-2">
                                <Mic className="w-4 h-4" />
                                Grabar
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="write" className="mt-3">
                              <Textarea
                                value={formData.intervention}
                                onChange={(e) => setFormData({ ...formData, intervention: e.target.value })}
                                placeholder="Describe la intervención realizada"
                                rows={4}
                              />
                            </TabsContent>
                            <TabsContent value="record" className="mt-3">
                              <AudioRecorder
                                fieldLabel="Intervención"
                                placeholder="La transcripción de la intervención aparecerá aquí..."
                                onTranscriptionComplete={(transcription) =>
                                  setFormData({ ...formData, intervention: transcription })
                                }
                              />
                            </TabsContent>
                          </Tabs>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="practice">Práctica</Label>
                          <Input
                            id="practice"
                            value={formData.practice}
                            onChange={(e) => setFormData({ ...formData, practice: e.target.value })}
                            placeholder="Práctica realizada"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Estudios Solicitados</Label>
                          <Tabs defaultValue="write" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="write" className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4" />
                                Escribir
                              </TabsTrigger>
                              <TabsTrigger value="record" className="flex items-center gap-2">
                                <Mic className="w-4 h-4" />
                                Grabar
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="write" className="mt-3">
                              <Textarea
                                value={formData.requestedStudies}
                                onChange={(e) => setFormData({ ...formData, requestedStudies: e.target.value })}
                                placeholder="Lista de estudios solicitados"
                                rows={4}
                              />
                            </TabsContent>
                            <TabsContent value="record" className="mt-3">
                              <AudioRecorder
                                fieldLabel="Estudios Solicitados"
                                placeholder="La transcripción de los estudios solicitados aparecerá aquí..."
                                onTranscriptionComplete={(transcription) =>
                                  setFormData({ ...formData, requestedStudies: transcription })
                                }
                              />
                            </TabsContent>
                          </Tabs>
                        </div>

                        <div className="space-y-2">
                          <Label>Eventos Adversos</Label>
                          <p className="text-xs text-gray-600">
                            Registra eventos adversos relacionados con medicación o situaciones de vida del paciente
                          </p>
                          <Tabs defaultValue="write" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="write" className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4" />
                                Escribir
                              </TabsTrigger>
                              <TabsTrigger value="record" className="flex items-center gap-2">
                                <Mic className="w-4 h-4" />
                                Grabar
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="write" className="mt-3">
                              <Textarea
                                value={formData.adverseEvents}
                                onChange={(e) => setFormData({ ...formData, adverseEvents: e.target.value })}
                                placeholder="Describe eventos adversos por medicación o situaciones de vida relevantes"
                                rows={4}
                              />
                            </TabsContent>
                            <TabsContent value="record" className="mt-3">
                              <AudioRecorder
                                fieldLabel="Eventos Adversos"
                                placeholder="La transcripción de eventos adversos aparecerá aquí..."
                                onTranscriptionComplete={(transcription) =>
                                  setFormData({ ...formData, adverseEvents: transcription })
                                }
                              />
                            </TabsContent>
                          </Tabs>
                        </div>

                        <SignaturePad
                          doctorName={doctorName}
                          onSignatureComplete={(signature) => setFormData({ ...formData, signature })}
                        />

                        <div className="flex gap-2 pt-4">
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={!formData.signature || !formData.consultationReason}
                          >
                            Guardar Registro
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsRecordDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {patientData?.attentionRecords?.length > 0 ? (
                  <div className="space-y-4">
                    {patientData.attentionRecords.map((record: any) => (
                      <div key={record.id} className="border-l-4 border-blue-500 pl-4 space-y-2">
                        <p className="font-semibold">{record.consultation_reason}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString('es-AR')} - Dr. {record.doctor_name}
                        </p>
                        {record.patient_evolution && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Evolución:</p>
                            <p className="text-sm text-gray-600">{record.patient_evolution}</p>
                          </div>
                        )}
                        {record.intervention && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Intervención:</p>
                            <p className="text-sm text-gray-600">{record.intervention}</p>
                          </div>
                        )}
                        {record.practice && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Práctica:</p>
                            <p className="text-sm text-gray-600">{record.practice}</p>
                          </div>
                        )}
                        {record.requested_studies && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Estudios Solicitados:</p>
                            <p className="text-sm text-gray-600">{record.requested_studies}</p>
                          </div>
                        )}
                        {record.adverse_events && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                            <p className="text-xs font-semibold text-yellow-900">Eventos Adversos:</p>
                            <p className="text-sm text-yellow-800">{record.adverse_events}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Sin registros</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nursing">
            <Card>
              <CardHeader>
                <CardTitle>Registros de Enfermería</CardTitle>
              </CardHeader>
              <CardContent>
                {patientData?.nursingRecords?.length > 0 ? (
                  <div className="space-y-4">
                    {patientData.nursingRecords.map((record: any) => (
                      <div key={record.id} className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-xs text-gray-600">Presión</p>
                          <p className="font-semibold">{record.blood_pressure}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Temperatura</p>
                          <p className="font-semibold">{record.temperature}°C</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">FC</p>
                          <p className="font-semibold">{record.heart_rate} bpm</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Fecha</p>
                          <p className="font-semibold">
                            {new Date(record.date).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Sin registros</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medication">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Medicación</CardTitle>
                  <Dialog open={isMedicationDialogOpen} onOpenChange={setIsMedicationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Prescribir Medicación
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nueva Prescripción de Medicación</DialogTitle>
                        <DialogDescription>
                          Prescribe un medicamento para el paciente
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitMedication} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="med-date">Fecha *</Label>
                          <Input
                            id="med-date"
                            type="date"
                            value={medicationFormData.date}
                            onChange={(e) => setMedicationFormData({ ...medicationFormData, date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="medicationName">Medicamento *</Label>
                          <Input
                            id="medicationName"
                            value={medicationFormData.medicationName}
                            onChange={(e) => setMedicationFormData({ ...medicationFormData, medicationName: e.target.value })}
                            placeholder="Nombre del medicamento"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="dosage">Dosis *</Label>
                            <Input
                              id="dosage"
                              value={medicationFormData.dosage}
                              onChange={(e) => setMedicationFormData({ ...medicationFormData, dosage: e.target.value })}
                              placeholder="Ej: 500mg"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="frequency">Frecuencia *</Label>
                            <Input
                              id="frequency"
                              value={medicationFormData.frequency}
                              onChange={(e) => setMedicationFormData({ ...medicationFormData, frequency: e.target.value })}
                              placeholder="Ej: Cada 8 horas"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duración *</Label>
                          <Input
                            id="duration"
                            value={medicationFormData.duration}
                            onChange={(e) => setMedicationFormData({ ...medicationFormData, duration: e.target.value })}
                            placeholder="Ej: 7 días"
                            required
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button type="submit" className="flex-1">
                            Prescribir
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsMedicationDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {patientData?.medications?.length > 0 ? (
                  <div className="space-y-3">
                    {patientData.medications.map((med: any) => (
                      <div key={med.id} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">{med.medication_name}</p>
                          <p className="text-sm text-gray-600">
                            {med.dosage} - {med.frequency} - {med.duration}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Dr. {med.doctor_name}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(med.date).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Sin medicación registrada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="studies">
            <Card>
              <CardHeader>
                <CardTitle>Estudios Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                {patientData?.studies?.length > 0 ? (
                  <div className="space-y-3">
                    {patientData.studies.map((study: any) => (
                      <div key={study.id} className="p-3 bg-gray-50 rounded">
                        <p className="font-semibold">{study.study_type}</p>
                        <p className="text-sm text-gray-600 mt-1">{study.results}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(study.date).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Sin estudios registrados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {accessLevel === 'sensitive' && (
            <TabsContent value="sensitive">
              <Card className="border-2 border-purple-300">
                <CardHeader>
                  <CardTitle className="text-purple-900">Información Sensible</CardTitle>
                  <CardDescription>
                    Acceso autorizado por el paciente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {patientData?.sensitiveInfo ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Tipo de Sangre</p>
                        <p className="text-lg">{patientData.sensitiveInfo.blood_type || 'No registrado'}</p>
                      </div>
                      {patientData.sensitiveInfo.allergies?.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Alergias</p>
                          <ul className="list-disc list-inside">
                            {patientData.sensitiveInfo.allergies.map((allergy: string, idx: number) => (
                              <li key={idx}>{allergy}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {patientData.sensitiveInfo.chronic_conditions?.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Condiciones Crónicas</p>
                          <ul className="list-disc list-inside">
                            {patientData.sensitiveInfo.chronic_conditions.map((condition: string, idx: number) => (
                              <li key={idx}>{condition}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Sin información sensible registrada</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <Card className="mt-6 border-2 border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-2">Recordatorio Legal</p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Este acceso está siendo registrado en el sistema de auditoría</li>
                  <li>• La sesión expirará automáticamente en {formatTime(timeRemaining)}</li>
                  <li>• El uso de esta información está sujeto a la Ley 25.326</li>
                  <li>• Mantén la confidencialidad de los datos del paciente</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
