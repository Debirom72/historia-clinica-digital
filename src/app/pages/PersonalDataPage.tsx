import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Heart, CreditCard, AlertTriangle, Camera, Droplet, Pill, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth } from '../../lib/localAuth';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export function PersonalDataPage() {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState({
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    currentMedications: '',
  });

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const { user } = await localAuth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await localAuth.getPatient(user.id);

      if (error) throw error;
      setPatientData(data);

      // Load emergency data
      if (data) {
        setEmergencyData({
          bloodType: data.emergency_blood_type || '',
          allergies: data.emergency_allergies || '',
          chronicConditions: data.emergency_chronic_conditions || '',
          currentMedications: data.emergency_current_medications || '',
        });
      }
    } catch (error: any) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmergencyData = async () => {
    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const updatedData = {
        ...patientData,
        emergency_blood_type: emergencyData.bloodType,
        emergency_allergies: emergencyData.allergies,
        emergency_chronic_conditions: emergencyData.chronicConditions,
        emergency_current_medications: emergencyData.currentMedications,
      };

      // Save to localStorage
      const patients = JSON.parse(localStorage.getItem('medical_app_patients') || '{}');
      patients[patientData.id] = updatedData;
      localStorage.setItem('medical_app_patients', JSON.stringify(patients));

      setPatientData(updatedData);
      setIsEmergencyDialogOpen(false);
      toast.success('Datos de emergencia actualizados');
    } catch (error: any) {
      toast.error('Error al guardar datos de emergencia');
    }
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;

        // Update patient data
        const { user } = await localAuth.getUser();
        if (!user) return;

        const updatedData = {
          ...patientData,
          profile_photo_url: base64,
        };

        // Save to localStorage
        const patients = JSON.parse(localStorage.getItem('medical_app_patients') || '{}');
        patients[patientData.id] = updatedData;
        localStorage.setItem('medical_app_patients', JSON.stringify(patients));

        setPatientData(updatedData);
        toast.success('Foto de perfil actualizada');
      };
    } catch (error: any) {
      toast.error('Error al actualizar la foto');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  const personalInfo = [
    { icon: User, label: 'Nombre Completo', value: patientData?.full_name || 'N/A' },
    { icon: CreditCard, label: 'DNI', value: patientData?.dni || 'N/A' },
    { icon: Calendar, label: 'Fecha de Nacimiento', value: patientData?.birth_date || 'N/A' },
    { icon: Mail, label: 'Correo Electrónico', value: patientData?.email || 'N/A' },
    { icon: Phone, label: 'Teléfono', value: patientData?.phone || 'N/A' },
    { icon: MapPin, label: 'Domicilio', value: patientData?.address || 'N/A' },
    { icon: User, label: 'Estado Civil', value: patientData?.marital_status || 'N/A' },
    { icon: User, label: 'Género', value: patientData?.gender || 'N/A' },
    { icon: User, label: 'Etnia', value: patientData?.ethnicity || 'N/A' },
    { icon: Heart, label: 'Cobertura de Salud', value: patientData?.health_coverage || 'N/A' },
    { icon: Heart, label: 'Plan Médico', value: patientData?.medical_plan || 'N/A' },
    { icon: CreditCard, label: 'Nro. de Afiliado', value: patientData?.affiliate_number || 'N/A' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Datos Personales</h1>
              <p className="text-sm text-gray-500">Información del paciente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>
              Tu foto personal en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                {patientData?.profile_photo_url ? (
                  <img
                    src={patientData.profile_photo_url}
                    alt="Foto de perfil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-blue-200">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-gray-600 mb-3">
                  {patientData?.profile_photo_url
                    ? 'Cambia tu foto de perfil seleccionando una nueva imagen'
                    : 'Agrega tu foto de perfil para personalizar tu cuenta'}
                </p>
                <label htmlFor="profile-photo-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      {patientData?.profile_photo_url ? 'Cambiar Foto' : 'Subir Foto'}
                    </span>
                  </Button>
                </label>
                <Input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Tus datos registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {personalInfo.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="font-medium text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button className="w-full md:w-auto">
                Editar Información
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact Card */}
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-900">Contacto de Emergencia</CardTitle>
            </div>
            <CardDescription>
              Persona a contactar en caso de emergencia médica
            </CardDescription>
          </CardHeader>
          <CardContent>
            {patientData?.emergency_contact_name ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-semibold text-gray-900">{patientData.emergency_contact_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-semibold text-gray-900">{patientData.emergency_contact_phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Relación</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {patientData.emergency_contact_relationship || 'No especificada'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-800 font-semibold mb-2">
                  No hay contacto de emergencia registrado
                </p>
                <p className="text-sm text-red-700 mb-4">
                  Es importante tener un contacto de emergencia para situaciones críticas
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-red-200">
              <Button variant="outline" className="w-full md:w-auto border-red-300 text-red-700 hover:bg-red-100">
                {patientData?.emergency_contact_name ? 'Editar Contacto de Emergencia' : 'Agregar Contacto de Emergencia'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Medical Data Card */}
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-orange-900">Datos de Emergencia Médica</CardTitle>
            </div>
            <CardDescription>
              Información crítica para situaciones de emergencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-semibold text-gray-700">Tipo de Sangre</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {patientData?.emergency_blood_type || 'No registrado'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-semibold text-gray-700">Alergias</p>
                  </div>
                  <p className="text-sm text-gray-900">
                    {patientData?.emergency_allergies || 'No registrado'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-semibold text-gray-700">Condiciones Crónicas</p>
                  </div>
                  <p className="text-sm text-gray-900">
                    {patientData?.emergency_chronic_conditions || 'No registrado'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-700">Medicación Actual</p>
                  </div>
                  <p className="text-sm text-gray-900">
                    {patientData?.emergency_current_medications || 'No registrado'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-orange-200">
                <Dialog open={isEmergencyDialogOpen} onOpenChange={setIsEmergencyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto border-orange-300 text-orange-700 hover:bg-orange-100">
                      Editar Datos de Emergencia
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Datos de Emergencia Médica</DialogTitle>
                      <DialogDescription>
                        Esta información será visible en la pantalla de emergencia
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bloodType">Tipo de Sangre</Label>
                        <Input
                          id="bloodType"
                          value={emergencyData.bloodType}
                          onChange={(e) => setEmergencyData({ ...emergencyData, bloodType: e.target.value })}
                          placeholder="Ej: A+, O-, AB+, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allergies">Alergias</Label>
                        <Textarea
                          id="allergies"
                          value={emergencyData.allergies}
                          onChange={(e) => setEmergencyData({ ...emergencyData, allergies: e.target.value })}
                          placeholder="Ej: Penicilina, Mariscos, Polen, etc."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="chronicConditions">Condiciones Crónicas</Label>
                        <Textarea
                          id="chronicConditions"
                          value={emergencyData.chronicConditions}
                          onChange={(e) => setEmergencyData({ ...emergencyData, chronicConditions: e.target.value })}
                          placeholder="Ej: Diabetes, Hipertensión, Asma, etc."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currentMedications">Medicación Actual</Label>
                        <Textarea
                          id="currentMedications"
                          value={emergencyData.currentMedications}
                          onChange={(e) => setEmergencyData({ ...emergencyData, currentMedications: e.target.value })}
                          placeholder="Ej: Ibuprofeno 400mg, Enalapril 10mg, etc."
                          rows={3}
                        />
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-orange-900">Importante</p>
                            <p className="text-xs text-orange-700 mt-1">
                              Esta información será visible en la pantalla de emergencia sin necesidad de iniciar sesión.
                              Asegúrate de que sea precisa y esté actualizada.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleSaveEmergencyData} className="flex-1">
                          Guardar
                        </Button>
                        <Button variant="outline" onClick={() => setIsEmergencyDialogOpen(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}