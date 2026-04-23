import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { localAuth } from '../../lib/localAuth';
import { toast } from 'sonner';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData;

  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedDataProtection, setAcceptedDataProtection] = useState(false);
  const [acceptedTokenAuth, setAcceptedTokenAuth] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleComplete = async () => {
    if (!acceptedPrivacy || !acceptedDataProtection || !acceptedTokenAuth) {
      toast.error('Debes aceptar todas las políticas para continuar');
      return;
    }

    setLoading(true);

    try {
      // Crear usuario
      const { user, error: authError } = await localAuth.signUp(
        formData.email,
        formData.password
      );

      if (authError) throw authError;

      // Convertir foto de perfil a base64 si existe
      let profilePhotoUrl = null;
      if (formData.profilePhoto) {
        profilePhotoUrl = await fileToBase64(formData.profilePhoto);
      }

      // Crear perfil del paciente
      const { error: profileError } = await localAuth.createPatient({
        user_id: user!.id,
        full_name: formData.fullName,
        dni: formData.dni,
        dni_image_url: null,
        profile_photo_url: profilePhotoUrl,
        birth_date: formData.birthDate,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        marital_status: formData.maritalStatus,
        gender: formData.gender,
        ethnicity: formData.ethnicity,
        health_coverage: formData.healthCoverage,
        medical_plan: formData.medicalPlan,
        affiliate_number: formData.affiliateNumber,
        face_registered: false,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relationship: formData.emergencyContactRelationship,
      });

      if (profileError) throw profileError;

      toast.success('Registro completado exitosamente');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error al completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/register')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Políticas de Privacidad y Protección de Datos</CardTitle>
            <CardDescription>
              Lee y acepta las siguientes políticas antes de continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Protección de Datos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Protección de Datos Personales</h3>
              </div>
              <ScrollArea className="h-32 border rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    En cumplimiento de la Ley 25.326 de Protección de Datos Personales de Argentina,
                    te informamos que:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Tus datos personales serán tratados con estricta confidencialidad</li>
                    <li>Solo tú tienes control total sobre tu información médica</li>
                    <li>Los datos se almacenan con encriptación de última generación</li>
                    <li>Puedes solicitar la eliminación de tus datos en cualquier momento</li>
                    <li>Tu información nunca será vendida ni compartida sin tu consentimiento</li>
                  </ul>
                </div>
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                />
                <Label htmlFor="privacy" className="cursor-pointer">
                  He leído y acepto la política de protección de datos
                </Label>
              </div>
            </div>

            {/* Autorización Token Authenticator */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Sistema de Autorización por Token</h3>
              </div>
              <ScrollArea className="h-32 border rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    Para garantizar la máxima seguridad de tu historia clínica:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Cuando un médico necesite acceder a tu historia clínica vía web, deberás
                      autorizar el acceso mediante un token de Authenticator
                    </li>
                    <li>El token se renueva automáticamente cada 3 minutos</li>
                    <li>
                      Para datos sensibles, se requerirá una autorización adicional por token
                    </li>
                    <li>Puedes revocar el acceso en cualquier momento</li>
                    <li>Se registra cada acceso a tu información con fecha y hora</li>
                  </ul>
                </div>
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="token"
                  checked={acceptedTokenAuth}
                  onCheckedChange={(checked) => setAcceptedTokenAuth(checked as boolean)}
                />
                <Label htmlFor="token" className="cursor-pointer">
                  Acepto el sistema de autorización por token de Authenticator
                </Label>
              </div>
            </div>

            {/* Datos Sensibles */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Información Sensible</h3>
              </div>
              <ScrollArea className="h-32 border rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    Respecto a la información sensible de tu historia clínica:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Tendrás una sección especial donde podrás registrar información que solo
                      deseas revelar cuando lo consideres oportuno
                    </li>
                    <li>
                      Esta información estará oculta por defecto y solo tú podrás autorizarsu visualización
                    </li>
                    <li>
                      <strong>Importante:</strong> La omisión de información sensible deja libre de
                      responsabilidad al médico si esto afecta el resultado del tratamiento
                    </li>
                    <li>
                      Se recomienda compartir toda la información relevante para un tratamiento
                      adecuado
                    </li>
                  </ul>
                </div>
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sensitive"
                  checked={acceptedDataProtection}
                  onCheckedChange={(checked) => setAcceptedDataProtection(checked as boolean)}
                />
                <Label htmlFor="sensitive" className="cursor-pointer">
                  Entiendo la responsabilidad sobre la información sensible
                </Label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleComplete}
                className="w-full"
                disabled={!acceptedPrivacy || !acceptedDataProtection || !acceptedTokenAuth || loading}
              >
                {loading ? 'Completando registro...' : 'Completar Registro'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}