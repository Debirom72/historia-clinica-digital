import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, FileText, Calendar, User, PenTool, AlertTriangle, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export function AttentionRecordPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const { user } = await localAuth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data: patient } = await localAuth.getPatient(user.id);

      if (patient) {
        const { data, error } = await localDB.select<any>('attention_records',
          (record) => record.patient_id === patient.id
        );

        if (error) throw error;

        const sorted = (data || []).sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecords(sorted);
      }
    } catch (error: any) {
      toast.error('Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  const moveToSensitive = async (record: any) => {
    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const { data: patient } = await localAuth.getPatient(user.id);

      const description = `Registro de Atención - ${new Date(record.date).toLocaleDateString('es-AR')}
Dr. ${record.doctor_name}

Motivo de Consulta: ${record.consultation_reason}
${record.patient_evolution ? `\nEvolución: ${record.patient_evolution}` : ''}
${record.intervention ? `\nIntervención: ${record.intervention}` : ''}
${record.practice ? `\nPráctica: ${record.practice}` : ''}
${record.requested_studies ? `\nEstudios Solicitados: ${record.requested_studies}` : ''}
${record.adverse_events ? `\nEventos Adversos: ${record.adverse_events}` : ''}`;

      const { error } = await localDB.insert('sensitive_info', {
        patient_id: patient!.id,
        info_type: record.adverse_events ? 'Eventos Adversos' : 'Atención Médica',
        description: description,
      });

      if (error) throw error;

      toast.success('Información trasladada a sección sensible');
    } catch (error: any) {
      toast.error('Error al trasladar información');
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
              <h1 className="text-xl font-bold text-gray-900">Registro de Atención</h1>
              <p className="text-sm text-gray-500">Consultas y evolución registradas por médicos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Información:</strong> Los registros de atención son creados por médicos desde el Portal Médico.
              Aquí puedes visualizar toda tu historia clínica.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay registros de atención aún</p>
              <p className="text-sm text-gray-400 mt-2">
                Los registros agregados por los médicos aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{record.consultation_reason}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(record.date).toLocaleDateString('es-AR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Dr. {record.doctor_name}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Lock className="w-4 h-4 mr-2" />
                          Mover a Sensible
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Trasladar a Información Sensible</DialogTitle>
                          <DialogDescription>
                            ¿Deseas trasladar este registro a la sección de Información Sensible?
                            Esto creará una copia en esa sección protegida.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <p className="text-sm text-orange-900">
                            <strong>Nota:</strong> El registro se mantendrá en esta sección y también
                            aparecerá en Información Sensible para control de acceso adicional.
                          </p>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={() => moveToSensitive(record)}
                            className="flex-1"
                          >
                            Confirmar Traslado
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {record.patient_evolution && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Evolución:</p>
                      <p className="text-sm text-gray-600">{record.patient_evolution}</p>
                    </div>
                  )}
                  {record.intervention && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Intervención:</p>
                      <p className="text-sm text-gray-600">{record.intervention}</p>
                    </div>
                  )}
                  {record.practice && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Práctica:</p>
                      <p className="text-sm text-gray-600">{record.practice}</p>
                    </div>
                  )}
                  {record.requested_studies && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Estudios Solicitados:</p>
                      <p className="text-sm text-gray-600">{record.requested_studies}</p>
                    </div>
                  )}
                  {record.adverse_events && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-700 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-900">Eventos Adversos:</p>
                          <p className="text-sm text-yellow-800">{record.adverse_events}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {record.signature && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-start gap-3">
                        <PenTool className="w-4 h-4 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Firma Digital del Médico:</p>
                          <div className="bg-white border-2 border-blue-200 rounded-lg p-2">
                            <img
                              src={record.signature}
                              alt={`Firma digital de Dr. ${record.doctor_name}`}
                              className="h-24 mx-auto"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Firmado el {new Date(record.signed_at).toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}