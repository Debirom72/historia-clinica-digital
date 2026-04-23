import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Loader2, FileText, Download, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function GeneratePrescriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const medicationId = searchParams.get('id');

  const [medication, setMedication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [prescription, setPrescription] = useState<any>(null);

  useEffect(() => {
    loadMedication();
  }, [medicationId]);

  const loadMedication = async () => {
    try {
      const { user } = await localAuth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      if (!medicationId) {
        toast.error('ID de medicación no encontrado');
        navigate('/medication');
        return;
      }

      const { data: medications, error } = await localDB.select<any>('medications',
        (med) => med.id === medicationId
      );

      if (error) throw error;

      if (medications && medications.length > 0) {
        setMedication(medications[0]);

        // Check if prescription already exists
        if (medications[0].prescription_url) {
          setPrescription({
            url: medications[0].prescription_url,
            number: medications[0].prescription_number,
            generatedAt: medications[0].prescription_generated_at,
          });
        }
      } else {
        toast.error('Medicación no encontrada');
        navigate('/medication');
      }
    } catch (error: any) {
      toast.error('Error al cargar la medicación');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrescription = async () => {
    setGenerating(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b65c430c/generate-prescription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            medicationId: medication.id,
            medicationName: medication.medication_name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            duration: medication.duration,
            doctorName: medication.doctor_name,
            patientId: medication.patient_id,
            date: medication.date,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar la receta');
      }

      const data = await response.json();

      // Update local medication with prescription data
      await localDB.update('medications', medication.id, {
        prescription_url: data.prescriptionUrl,
        prescription_number: data.prescriptionNumber,
        prescription_generated_at: new Date().toISOString(),
      });

      setPrescription({
        url: data.prescriptionUrl,
        number: data.prescriptionNumber,
        generatedAt: new Date().toISOString(),
      });

      toast.success('Receta generada exitosamente');

    } catch (error: any) {
      console.error('Error generating prescription:', error);
      toast.error(error.message || 'Error al generar la receta');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPrescription = () => {
    if (prescription?.url) {
      window.open(prescription.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/medication')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Generar Prescripción</h1>
              <p className="text-sm text-gray-500">Vinculado con RCTA.ME</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Medication Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Medicación</CardTitle>
              <CardDescription>Información a incluir en la receta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Medicamento:</p>
                  <p className="text-base text-gray-900">{medication?.medication_name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Médico:</p>
                  <p className="text-base text-gray-900">Dr. {medication?.doctor_name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Dosis:</p>
                  <p className="text-base text-gray-900">{medication?.dosage}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Frecuencia:</p>
                  <p className="text-base text-gray-900">{medication?.frequency}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Duración:</p>
                  <p className="text-base text-gray-900">{medication?.duration}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Fecha:</p>
                  <p className="text-base text-gray-900">
                    {new Date(medication?.date).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RCTA.ME Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Integración con RCTA.ME
              </CardTitle>
              <CardDescription>
                Sistema de Receta Digital Electrónica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!prescription ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      Al generar la prescripción, se creará una receta electrónica vinculada con el sistema RCTA.ME
                      que permitirá al paciente obtener su medicación en cualquier farmacia habilitada.
                    </p>
                  </div>
                  <Button
                    onClick={handleGeneratePrescription}
                    disabled={generating}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando Receta...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generar Receta en RCTA.ME
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900">Receta generada exitosamente</p>
                        <p className="text-sm text-green-700 mt-1">
                          La receta electrónica ha sido creada y vinculada con RCTA.ME
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Número de Receta:</p>
                      <p className="text-base text-gray-900 font-mono">{prescription.number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Fecha de Generación:</p>
                      <p className="text-base text-gray-900">
                        {new Date(prescription.generatedAt).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleDownloadPrescription}
                      className="flex-1"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Receta
                    </Button>
                    <Button
                      onClick={() => navigate('/medication')}
                      variant="outline"
                      size="lg"
                    >
                      Volver
                    </Button>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600">
                      <strong>Nota:</strong> Esta receta está disponible en su historia clínica digital y puede ser
                      presentada en cualquier farmacia adherida al sistema RCTA.ME. El número de receta es único
                      e intransferible.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
