import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Phone, User, AlertTriangle, Heart, Pill, Droplet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';

export function EmergencyInfoPage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [medicalInfo, setMedicalInfo] = useState<any>({
    bloodType: '',
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
  });

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      // Intentar obtener el paciente actual (con sesión activa)
      const { user } = await localAuth.getUser();
      let patientData = null;

      if (user) {
        const { data } = await localAuth.getPatient(user.id);
        patientData = data;
      } else {
        // Si no hay sesión, buscar el último paciente registrado
        const patients = JSON.parse(localStorage.getItem('medical_app_patients') || '{}');
        const patientsList = Object.values(patients);
        if (patientsList.length > 0) {
          // Obtener el paciente más reciente
          patientData = patientsList[patientsList.length - 1];
        }
      }

      if (patientData) {
        setPatient(patientData);

        // Load emergency data directly from patient data
        setMedicalInfo({
          bloodType: patientData.emergency_blood_type || 'No registrado',
          allergies: patientData.emergency_allergies ? patientData.emergency_allergies.split(',').map((a: string) => a.trim()) : [],
          chronicConditions: patientData.emergency_chronic_conditions ? patientData.emergency_chronic_conditions.split(',').map((c: string) => c.trim()) : [],
          currentMedications: patientData.emergency_current_medications ? patientData.emergency_current_medications.split(',').map((m: string) => m.trim()) : [],
        });
      }
    } catch (error: any) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleCallEmergencyContact = () => {
    if (patient?.emergency_contact_phone) {
      window.location.href = `tel:${patient.emergency_contact_phone}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Cargando información de emergencia...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center p-4">
        <Card className="max-w-md border-4 border-yellow-400">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No hay información disponible
            </h2>
            <p className="text-gray-700 mb-4">
              No se encontraron datos de pacientes en este dispositivo.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm text-blue-900 font-semibold mb-2">Para cargar datos de emergencia:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Regístrate e inicia sesión</li>
                <li>Ve a "Datos Personales"</li>
                <li>Completa "Contacto de Emergencia"</li>
                <li>Completa "Datos de Emergencia Médica"</li>
              </ol>
            </div>
            <div className="space-y-2">
              <Button onClick={() => navigate('/register')} className="w-full bg-blue-600 hover:bg-blue-700">
                Registrarse Ahora
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 text-white">
      {/* Header */}
      <div className="bg-red-900 shadow-2xl border-b-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="bg-white text-red-900 border-2 border-yellow-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-yellow-400 animate-pulse" />
                <h1 className="text-3xl font-bold">INFORMACIÓN DE EMERGENCIA</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alert if missing critical data */}
        {(!patient.emergency_contact_name || !patient.emergency_blood_type) && (
          <Card className="border-4 border-yellow-400 bg-yellow-50">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-8 h-8 text-yellow-700" />
                <div>
                  <h3 className="text-lg font-bold text-yellow-900 mb-2">Información incompleta</h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    Faltan datos críticos de emergencia. Para una atención óptima, complete:
                  </p>
                  <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                    {!patient.emergency_contact_name && <li>Contacto de Emergencia</li>}
                    {!patient.emergency_blood_type && <li>Tipo de Sangre</li>}
                    {!patient.emergency_allergies && <li>Alergias</li>}
                  </ul>
                  <p className="text-xs text-yellow-700 mt-3">
                    Inicie sesión y vaya a "Datos Personales" para completar esta información.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency Contact - ALWAYS SHOW */}
        <Card className={`border-8 shadow-2xl ${patient.emergency_contact_name ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-gray-50'}`}>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-red-900 mb-2">
                CONTACTO DE EMERGENCIA
              </h2>
              {patient.emergency_contact_name ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {patient.emergency_contact_name}
                  </p>
                  <p className="text-lg text-gray-700 mb-4">
                    {patient.emergency_contact_relationship}
                  </p>
                  <Button
                    onClick={handleCallEmergencyContact}
                    className="bg-green-600 hover:bg-green-700 text-white text-2xl py-8 px-12"
                    size="lg"
                  >
                    <Phone className="w-8 h-8 mr-3" />
                    LLAMAR: {patient.emergency_contact_phone}
                  </Button>
                </>
              ) : (
                <div className="py-8">
                  <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-gray-600 mb-2">NO REGISTRADO</p>
                  <p className="text-sm text-gray-500">
                    Complete esta información en "Datos Personales"
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patient Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border-4 border-red-400">
            <CardHeader className="bg-red-100">
              <CardTitle className="text-red-900 flex items-center gap-2">
                <User className="w-6 h-6" />
                Datos del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-gray-900">
              <div className="space-y-3">
                {patient.profile_photo_url && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={patient.profile_photo_url}
                      alt="Foto del paciente"
                      className="w-32 h-32 rounded-full object-cover border-4 border-red-300"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  <p className="text-2xl font-bold">{patient.full_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">DNI</p>
                    <p className="text-xl font-semibold">{patient.dni}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Edad</p>
                    <p className="text-xl font-semibold">
                      {calculateAge(patient.birth_date)} años
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                  <p className="text-lg font-medium">
                    {new Date(patient.birth_date).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cobertura Médica</p>
                  <p className="text-lg font-medium">{patient.health_coverage}</p>
                  <p className="text-sm text-gray-600">
                    N° Afiliado: {patient.affiliate_number}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blood Type */}
          <Card className="bg-white border-4 border-red-400">
            <CardHeader className="bg-red-100">
              <CardTitle className="text-red-900 flex items-center gap-2">
                <Droplet className="w-6 h-6" />
                Tipo de Sangre
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex items-center justify-center">
              <div className="text-center py-4">
                <p className="text-6xl font-bold text-red-700">
                  {medicalInfo.bloodType || 'No Registrado'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Allergies */}
        <Card className="bg-white border-4 border-orange-400">
          <CardHeader className="bg-orange-100">
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              ALERGIAS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {medicalInfo.allergies.length > 0 ? (
              <ul className="space-y-2">
                {medicalInfo.allergies.map((allergy: string, idx: number) => (
                  <li key={idx} className="text-xl font-semibold text-gray-900 bg-orange-50 p-3 rounded">
                    • {allergy}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-2xl font-bold text-gray-400">No Registrado</p>
                <p className="text-sm text-gray-500 mt-2">
                  Complete esta información en "Datos Personales"
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chronic Conditions */}
        <Card className="bg-white border-4 border-purple-400">
          <CardHeader className="bg-purple-100">
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <Heart className="w-6 h-6" />
              Condiciones Crónicas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {medicalInfo.chronicConditions.length > 0 ? (
              <ul className="space-y-2">
                {medicalInfo.chronicConditions.map((condition: string, idx: number) => (
                  <li key={idx} className="text-lg font-medium text-gray-900 bg-purple-50 p-3 rounded">
                    • {condition}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-2xl font-bold text-gray-400">No Registrado</p>
                <p className="text-sm text-gray-500 mt-2">
                  Complete esta información en "Datos Personales"
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card className="bg-white border-4 border-blue-400">
          <CardHeader className="bg-blue-100">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Pill className="w-6 h-6" />
              Medicación Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {medicalInfo.currentMedications.length > 0 ? (
              <ul className="space-y-2">
                {medicalInfo.currentMedications.map((med: string, idx: number) => (
                  <li key={idx} className="text-lg font-medium text-gray-900 bg-blue-50 p-3 rounded">
                    • {med}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-2xl font-bold text-gray-400">No Registrado</p>
                <p className="text-sm text-gray-500 mt-2">
                  Complete esta información en "Datos Personales"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
