import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Plus, Activity, Calendar, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

export function NursingRecordPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vitalSigns: '',
    observations: '',
    nurseName: '',
    date: new Date().toISOString().split('T')[0],
  });

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
        const { data, error } = await localDB.select<any>('nursing_records',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const { data: patient } = await localAuth.getPatient(user.id);

      const { error } = await localDB.insert('nursing_records', {
        patient_id: patient!.id,
        vital_signs: formData.vitalSigns,
        observations: formData.observations,
        nurse_name: formData.nurseName,
        date: formData.date,
      });

      if (error) throw error;

      toast.success('Registro agregado exitosamente');
      setIsDialogOpen(false);
      loadRecords();
      
      setFormData({
        vitalSigns: '',
        observations: '',
        nurseName: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      toast.error('Error al guardar el registro');
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
                <h1 className="text-xl font-bold text-gray-900">Registro de Enfermería</h1>
                <p className="text-sm text-gray-500">Signos vitales y observaciones</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nuevo Registro de Enfermería</DialogTitle>
                  <DialogDescription>
                    Registra signos vitales y observaciones
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
                    <Label htmlFor="nurseName">Enfermero/a</Label>
                    <Input
                      id="nurseName"
                      value={formData.nurseName}
                      onChange={(e) => setFormData({ ...formData, nurseName: e.target.value })}
                      placeholder="Nombre del enfermero/a"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vitalSigns">Signos Vitales</Label>
                    <Textarea
                      id="vitalSigns"
                      value={formData.vitalSigns}
                      onChange={(e) => setFormData({ ...formData, vitalSigns: e.target.value })}
                      placeholder="Ej: Presión arterial: 120/80, Frecuencia cardíaca: 72, Temperatura: 36.5°C"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observations">Observaciones</Label>
                    <Textarea
                      id="observations"
                      value={formData.observations}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                      placeholder="Observaciones generales"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">Guardar Registro</Button>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay registros de enfermería aún</p>
              <p className="text-sm text-gray-400 mt-2">
                Los registros de signos vitales aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <CardTitle className="text-lg">Registro de Enfermería</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(record.date).toLocaleDateString('es-AR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {record.nurse_name}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Signos Vitales:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{record.vital_signs}</p>
                  </div>
                  {record.observations && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Observaciones:</p>
                      <p className="text-sm text-gray-600">{record.observations}</p>
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