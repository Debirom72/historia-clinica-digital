import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Pill, Calendar, User, FileText, CheckCircle, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export function MedicationPage() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      const { user } = await localAuth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data: patient } = await localAuth.getPatient(user.id);

      if (patient) {
        const { data, error } = await localDB.select<any>('medications',
          (med) => med.patient_id === patient.id
        );

        if (error) throw error;
        const sorted = (data || []).sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setMedications(sorted);
      }
    } catch (error: any) {
      toast.error('Error al cargar las medicaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrescription = (medication: any) => {
    navigate(`/generate-prescription?id=${medication.id}`);
  };

  const moveToSensitive = async (medication: any) => {
    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const { data: patient } = await localAuth.getPatient(user.id);

      const description = `Medicación Prescrita - ${new Date(medication.date).toLocaleDateString('es-AR')}
Dr. ${medication.doctor_name}

Medicamento: ${medication.medication_name}
Dosis: ${medication.dosage}
Frecuencia: ${medication.frequency}
Duración: ${medication.duration}
${medication.prescription_number ? `\nReceta N°: ${medication.prescription_number}` : ''}`;

      const { error } = await localDB.insert('sensitive_info', {
        patient_id: patient!.id,
        info_type: 'Medicación Habitual',
        description: description,
      });

      if (error) throw error;

      toast.success('Medicación trasladada a sección sensible');
    } catch (error: any) {
      toast.error('Error al trasladar medicación');
    }
  };

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
              <h1 className="text-xl font-bold text-gray-900">Registro de Medicación</h1>
              <p className="text-sm text-gray-500">Medicamentos prescritos y recetas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Información:</strong> Las medicaciones son prescritas por médicos desde el Portal Médico.
              Aquí puedes ver todas tus prescripciones, recetas y órdenes médicas.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : medications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay medicaciones prescritas aún</p>
              <p className="text-sm text-gray-400 mt-2">
                Las prescripciones médicas aparecerán aquí cuando un médico las genere
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {medications.map((medication) => (
              <Card key={medication.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{medication.medication_name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(medication.date).toLocaleDateString('es-AR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Dr. {medication.doctor_name}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    {medication.prescription_url ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleGeneratePrescription(medication)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ver Receta
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGeneratePrescription(medication)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generar Receta
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Dosis:</p>
                      <p className="text-sm text-gray-600">{medication.dosage}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Frecuencia:</p>
                      <p className="text-sm text-gray-600">{medication.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Duración:</p>
                      <p className="text-sm text-gray-600">{medication.duration}</p>
                    </div>
                  </div>
                  {medication.prescription_url && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Receta generada</span>
                        {medication.prescription_number && (
                          <span className="text-gray-500">• N° {medication.prescription_number}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Lock className="w-4 h-4 mr-2" />
                          Trasladar a Información Sensible
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Trasladar a Información Sensible</DialogTitle>
                          <DialogDescription>
                            ¿Deseas trasladar esta medicación a la sección de Información Sensible?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <p className="text-sm text-orange-900">
                            <strong>Nota:</strong> La medicación se mantendrá en esta sección y también
                            aparecerá en Información Sensible para control de acceso adicional.
                          </p>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={() => moveToSensitive(medication)}
                            className="flex-1"
                          >
                            Confirmar Traslado
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}