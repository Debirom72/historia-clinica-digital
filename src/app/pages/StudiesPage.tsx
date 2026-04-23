import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Plus, FileBarChart, Calendar, Upload, Building2, ShieldCheck, FileUp, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

export function StudiesPage() {
  const navigate = useNavigate();
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOldStudiesDialogOpen, setIsOldStudiesDialogOpen] = useState(false);
  const [isInstitutionDialogOpen, setIsInstitutionDialogOpen] = useState(false);
  const [authorizedInstitutions, setAuthorizedInstitutions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    studyType: '',
    studyName: '',
    result: '',
    file: null as File | null,
    date: new Date().toISOString().split('T')[0],
  });
  const [oldStudiesFiles, setOldStudiesFiles] = useState<File[]>([]);
  const [institutionData, setInstitutionData] = useState({
    name: '',
    type: '',
    email: '',
    phone: '',
    allowedStudyTypes: [] as string[],
  });

  useEffect(() => {
    loadStudies();
    loadAuthorizedInstitutions();
  }, []);

  const loadStudies = async () => {
    try {
      const { user } = await localAuth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: patient } = await localAuth.getPatient(user.id);

      if (patient) {
        const { data, error } = await localDB.select<any>('studies',
          (study) => study.patient_id === patient.id
        );

        if (error) throw error;
        const sorted = (data || []).sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setStudies(sorted);
      }
    } catch (error: any) {
      toast.error('Error al cargar los estudios');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
      toast.success('Archivo cargado');
    }
  };

  const loadAuthorizedInstitutions = async () => {
    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const { data: patient } = await localAuth.getPatient(user.id);

      if (patient) {
        const { data, error } = await localDB.select<any>('authorized_institutions',
          (inst) => inst.patient_id === patient.id && inst.active
        );

        if (error) throw error;
        setAuthorizedInstitutions(data || []);
      }
    } catch (error: any) {
      console.error('Error loading institutions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const { data: patient } = await localAuth.getPatient(user.id);

      const { error } = await localDB.insert('studies', {
        patient_id: patient!.id,
        study_type: formData.studyType,
        study_name: formData.studyName,
        result: formData.result,
        file_url: null,
        date: formData.date,
        source: 'manual',
      });

      if (error) throw error;

      // Log activity
      await logActivity('study_uploaded', {
        study_type: formData.studyType,
        study_name: formData.studyName,
      });

      toast.success('Estudio agregado exitosamente');
      setIsDialogOpen(false);
      loadStudies();

      setFormData({
        studyType: '',
        studyName: '',
        result: '',
        file: null,
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      toast.error('Error al guardar el estudio');
    }
  };

  const handleOldStudiesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setOldStudiesFiles(files);
    toast.success(`${files.length} archivo(s) seleccionado(s)`);
  };

  const handleOldStudiesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const { data: patient } = await localAuth.getPatient(user.id);

      if (oldStudiesFiles.length === 0) {
        toast.error('Selecciona al menos un archivo');
        return;
      }

      // In a real implementation, files would be uploaded to storage
      // For now, we'll create records for each file

      for (const file of oldStudiesFiles) {
        await localDB.insert('studies', {
          patient_id: patient!.id,
          study_type: 'archivo-antiguo',
          study_name: file.name,
          result: `Estudio antiguo cargado desde archivo: ${file.name}`,
          file_url: `local://${file.name}`, // Simulated
          date: new Date().toISOString().split('T')[0],
          source: 'old_upload',
        });
      }

      // Log activity
      await logActivity('old_studies_uploaded', {
        count: oldStudiesFiles.length,
        files: oldStudiesFiles.map(f => f.name),
      });

      toast.success(`${oldStudiesFiles.length} estudio(s) antiguo(s) cargado(s)`);
      setIsOldStudiesDialogOpen(false);
      setOldStudiesFiles([]);
      loadStudies();
    } catch (error: any) {
      console.error('Error uploading old studies:', error);
      toast.error('Error al cargar estudios antiguos');
    }
  };

  const handleAuthorizeInstitution = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const { data: patient } = await localAuth.getPatient(user.id);

      if (institutionData.allowedStudyTypes.length === 0) {
        toast.error('Selecciona al menos un tipo de estudio');
        return;
      }

      // Generate authorization token
      const authToken = Math.random().toString(36).substring(2, 15) +
                       Math.random().toString(36).substring(2, 15);

      const { error } = await localDB.insert('authorized_institutions', {
        patient_id: patient!.id,
        institution_name: institutionData.name,
        institution_type: institutionData.type,
        institution_email: institutionData.email,
        institution_phone: institutionData.phone,
        allowed_study_types: institutionData.allowedStudyTypes,
        authorization_token: authToken,
        authorized_at: new Date().toISOString(),
        active: true,
      });

      if (error) throw error;

      // Log activity
      await logActivity('institution_authorized', {
        institution_name: institutionData.name,
        institution_type: institutionData.type,
        allowed_study_types: institutionData.allowedStudyTypes,
      });

      toast.success('Institución autorizada exitosamente');
      setIsInstitutionDialogOpen(false);
      setInstitutionData({
        name: '',
        type: '',
        email: '',
        phone: '',
        allowedStudyTypes: [],
      });
      loadAuthorizedInstitutions();
    } catch (error: any) {
      console.error('Error authorizing institution:', error);
      toast.error('Error al autorizar institución');
    }
  };

  const handleRevokeInstitution = async (institutionId: string) => {
    try {
      await localDB.update('authorized_institutions', institutionId, {
        active: false,
        revoked_at: new Date().toISOString(),
      });

      // Log activity
      await logActivity('institution_revoked', {
        institution_id: institutionId,
      });

      toast.success('Autorización revocada');
      loadAuthorizedInstitutions();
    } catch (error: any) {
      console.error('Error revoking institution:', error);
      toast.error('Error al revocar autorización');
    }
  };

  const toggleStudyType = (studyType: string) => {
    setInstitutionData(prev => ({
      ...prev,
      allowedStudyTypes: prev.allowedStudyTypes.includes(studyType)
        ? prev.allowedStudyTypes.filter(t => t !== studyType)
        : [...prev.allowedStudyTypes, studyType],
    }));
  };

  const logActivity = async (action: string, details: any) => {
    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const { data: patient } = await localAuth.getPatient(user.id);

      await localDB.insert('activity_logs', {
        patient_id: patient!.id,
        user_type: 'patient',
        user_id: user.id,
        action,
        details: JSON.stringify(details),
        timestamp: new Date().toISOString(),
        ip_address: 'localhost',
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Estudios Realizados</h1>
                <p className="text-sm text-gray-500">Análisis, laboratorios e imágenes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isOldStudiesDialogOpen} onOpenChange={setIsOldStudiesDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileUp className="w-4 h-4 mr-2" />
                    Cargar Estudios Antiguos
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Cargar Estudios Antiguos</DialogTitle>
                    <DialogDescription>
                      Sube archivos de estudios realizados anteriormente
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleOldStudiesSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldStudiesFiles">Seleccionar Archivos</Label>
                      <Input
                        id="oldStudiesFiles"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.dcm"
                        multiple
                        onChange={handleOldStudiesUpload}
                      />
                      <p className="text-xs text-gray-600">
                        Formatos aceptados: PDF, JPG, PNG, DICOM. Puedes seleccionar múltiples archivos.
                      </p>
                    </div>

                    {oldStudiesFiles.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          Archivos Seleccionados ({oldStudiesFiles.length}):
                        </p>
                        <ul className="space-y-1">
                          {oldStudiesFiles.map((file, idx) => (
                            <li key={idx} className="text-sm text-blue-800 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3" />
                              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-900">
                        <strong>Importante:</strong> Los estudios antiguos serán incorporados a tu historia clínica
                        y estarán disponibles para los médicos que autorices.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={oldStudiesFiles.length === 0}
                      >
                        Cargar {oldStudiesFiles.length} Estudio(s)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsOldStudiesDialogOpen(false);
                          setOldStudiesFiles([]);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isInstitutionDialogOpen} onOpenChange={setIsInstitutionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Building2 className="w-4 h-4 mr-2" />
                    Autorizar Institución
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Autorizar Institución Médica</DialogTitle>
                    <DialogDescription>
                      Permite que una institución envíe resultados directamente a tu historia clínica
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAuthorizeInstitution} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="instName">Nombre de la Institución *</Label>
                        <Input
                          id="instName"
                          value={institutionData.name}
                          onChange={(e) => setInstitutionData({ ...institutionData, name: e.target.value })}
                          placeholder="Hospital Italiano, Laboratorio Stamboulian, etc."
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instType">Tipo de Institución *</Label>
                        <Select
                          value={institutionData.type}
                          onValueChange={(value) => setInstitutionData({ ...institutionData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hospital">Hospital</SelectItem>
                            <SelectItem value="clinica">Clínica</SelectItem>
                            <SelectItem value="laboratorio">Laboratorio</SelectItem>
                            <SelectItem value="centro-diagnostico">Centro de Diagnóstico</SelectItem>
                            <SelectItem value="radiologia">Centro de Radiología</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instEmail">Email de Contacto *</Label>
                        <Input
                          id="instEmail"
                          type="email"
                          value={institutionData.email}
                          onChange={(e) => setInstitutionData({ ...institutionData, email: e.target.value })}
                          placeholder="resultados@institucion.com"
                          required
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="instPhone">Teléfono</Label>
                        <Input
                          id="instPhone"
                          type="tel"
                          value={institutionData.phone}
                          onChange={(e) => setInstitutionData({ ...institutionData, phone: e.target.value })}
                          placeholder="+54 11 1234-5678"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Tipos de Estudios Autorizados *</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'laboratorio', label: 'Laboratorio' },
                          { value: 'radiologia', label: 'Radiología' },
                          { value: 'ecografia', label: 'Ecografía' },
                          { value: 'tomografia', label: 'Tomografía' },
                          { value: 'resonancia', label: 'Resonancia Magnética' },
                          { value: 'electrocardiograma', label: 'Electrocardiograma' },
                          { value: 'anatomia-patologica', label: 'Anatomía Patológica' },
                          { value: 'otros', label: 'Otros' },
                        ].map((studyType) => (
                          <div key={studyType.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`study-${studyType.value}`}
                              checked={institutionData.allowedStudyTypes.includes(studyType.value)}
                              onCheckedChange={() => toggleStudyType(studyType.value)}
                            />
                            <Label
                              htmlFor={`study-${studyType.value}`}
                              className="cursor-pointer font-normal"
                            >
                              {studyType.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-green-900 mb-1">
                            ¿Cómo funciona?
                          </p>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>1. Autorizas a la institución médica</li>
                            <li>2. La institución recibe un token de autorización único</li>
                            <li>3. Los resultados se envían automáticamente a tu historia clínica</li>
                            <li>4. Recibes notificación cuando lleguen nuevos estudios</li>
                            <li>5. Puedes revocar la autorización en cualquier momento</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={institutionData.allowedStudyTypes.length === 0}
                      >
                        Autorizar Institución
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInstitutionDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Estudio
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Cargar Nuevo Estudio</DialogTitle>
                  <DialogDescription>
                    Agrega un estudio o resultado de análisis
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studyType">Tipo de Estudio</Label>
                    <Select
                      value={formData.studyType}
                      onValueChange={(value) => setFormData({ ...formData, studyType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laboratorio">Laboratorio</SelectItem>
                        <SelectItem value="radiologia">Radiología</SelectItem>
                        <SelectItem value="ecografia">Ecografía</SelectItem>
                        <SelectItem value="tomografia">Tomografía</SelectItem>
                        <SelectItem value="resonancia">Resonancia Magnética</SelectItem>
                        <SelectItem value="electrocardiograma">Electrocardiograma</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studyName">Nombre del Estudio</Label>
                    <Input
                      id="studyName"
                      value={formData.studyName}
                      onChange={(e) => setFormData({ ...formData, studyName: e.target.value })}
                      placeholder="Ej: Análisis de sangre completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="result">Resultado</Label>
                    <Textarea
                      id="result"
                      value={formData.result}
                      onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                      placeholder="Describe los resultados del estudio"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">Archivo del Estudio (opcional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="icon">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Formatos aceptados: PDF, JPG, PNG
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">Guardar Estudio</Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Authorized Institutions */}
        {authorizedInstitutions.length > 0 && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Building2 className="w-5 h-5" />
                Instituciones Autorizadas
              </CardTitle>
              <CardDescription>
                Estas instituciones pueden enviar resultados directamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {authorizedInstitutions.map((institution) => (
                  <div
                    key={institution.id}
                    className="flex items-start justify-between p-4 bg-white rounded-lg border border-green-200"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{institution.institution_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{institution.institution_type}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {institution.allowed_study_types.map((type: string) => (
                          <span
                            key={type}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Autorizado el {new Date(institution.authorized_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeInstitution(institution.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Revocar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Studies List */}
        <div>
          {loading ? (
            <p className="text-center">Cargando...</p>
          ) : studies.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay estudios cargados aún</p>
                <p className="text-sm text-gray-400 mt-2">
                  Puedes cargar estudios anteriores o esperar a que se carguen nuevos resultados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {studies.map((study) => (
                <Card key={study.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{study.study_name}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(study.date).toLocaleDateString('es-AR')}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                              {study.study_type}
                            </span>
                            {study.source && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                study.source === 'institution'
                                  ? 'bg-green-100 text-green-700'
                                  : study.source === 'old_upload'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {study.source === 'institution' ? 'Institución' :
                                 study.source === 'old_upload' ? 'Archivo Antiguo' : 'Manual'}
                              </span>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      {study.file_url && (
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Ver Archivo
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Resultado:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{study.result}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}