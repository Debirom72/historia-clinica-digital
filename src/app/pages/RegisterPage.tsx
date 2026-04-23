import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Upload, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    dni: '',
    dniImage: null as File | null,
    profilePhoto: null as File | null,
    birthDate: '',
    address: '',
    phone: '',
    maritalStatus: '',
    gender: '',
    ethnicity: '',
    healthCoverage: '',
    medicalPlan: '',
    affiliateNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, dniImage: file });
      toast.success('Imagen de DNI cargada correctamente');
    }
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, profilePhoto: file });
      toast.success('Foto de perfil cargada correctamente');
    }
  };

  const handleRegisterFace = () => {
    // Simular registro facial
    setFaceRegistered(true);
    toast.success('Rostro registrado correctamente');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      navigate('/privacy-policy', { state: { formData } });
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-4">
        <Button
          variant="ghost"
          onClick={() => step === 1 ? navigate('/') : setStep(step - 1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Paciente</CardTitle>
            <CardDescription>
              Paso {step} de 2 - Completa tus datos personales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre Completo *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dni">DNI *</Label>
                      <Input
                        id="dni"
                        value={formData.dni}
                        onChange={(e) => handleInputChange('dni', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dniImage">Imagen de DNI *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="dniImage"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" size="icon">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profilePhoto">Foto de Perfil</Label>
                      <div className="flex gap-2">
                        <Input
                          id="profilePhoto"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" size="icon">
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                      {formData.profilePhoto && (
                        <p className="text-sm text-green-600">
                          ✓ {formData.profilePhoto.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Domicilio *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono de Contacto *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Continuar
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Estado Civil *</Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(value) => handleInputChange('maritalStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soltero">Soltero/a</SelectItem>
                          <SelectItem value="casado">Casado/a</SelectItem>
                          <SelectItem value="divorciado">Divorciado/a</SelectItem>
                          <SelectItem value="viudo">Viudo/a</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Género *</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleInputChange('gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="femenino">Femenino</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                          <SelectItem value="prefiero-no-decir">Prefiero no decir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ethnicity">Etnia</Label>
                      <Input
                        id="ethnicity"
                        value={formData.ethnicity}
                        onChange={(e) => handleInputChange('ethnicity', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="healthCoverage">Cobertura de Salud *</Label>
                      <Input
                        id="healthCoverage"
                        value={formData.healthCoverage}
                        onChange={(e) => handleInputChange('healthCoverage', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medicalPlan">Plan Médico *</Label>
                      <Input
                        id="medicalPlan"
                        value={formData.medicalPlan}
                        onChange={(e) => handleInputChange('medicalPlan', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="affiliateNumber">Número de Afiliado *</Label>
                      <Input
                        id="affiliateNumber"
                        value={formData.affiliateNumber}
                        onChange={(e) => handleInputChange('affiliateNumber', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-4 text-red-700">Contacto de Emergencia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Nombre Completo *</Label>
                        <Input
                          id="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                          placeholder="Nombre de la persona a contactar"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone">Teléfono *</Label>
                        <Input
                          id="emergencyContactPhone"
                          type="tel"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                          placeholder="+54 9 11 1234-5678"
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="emergencyContactRelationship">Relación *</Label>
                        <Select
                          value={formData.emergencyContactRelationship}
                          onValueChange={(value) => handleInputChange('emergencyContactRelationship', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar relación" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="padre">Padre/Madre</SelectItem>
                            <SelectItem value="hijo">Hijo/a</SelectItem>
                            <SelectItem value="hermano">Hermano/a</SelectItem>
                            <SelectItem value="conyuge">Cónyuge</SelectItem>
                            <SelectItem value="pareja">Pareja</SelectItem>
                            <SelectItem value="amigo">Amigo/a</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold mb-2">Registro Facial</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Para mayor seguridad, registra tu rostro para acceder a la aplicación
                      </p>
                      <Button
                        type="button"
                        variant={faceRegistered ? 'outline' : 'default'}
                        onClick={handleRegisterFace}
                        className="w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {faceRegistered ? 'Rostro Registrado ✓' : 'Registrar Rostro'}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Continuar a Políticas de Privacidad
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
