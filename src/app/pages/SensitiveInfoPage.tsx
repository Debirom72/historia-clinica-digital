import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Plus, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function SensitiveInfoPage() {
  const navigate = useNavigate();
  const [sensitiveInfo, setSensitiveInfo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    infoType: '',
    description: '',
  });

  useEffect(() => {
    loadSensitiveInfo();
  }, []);

  const loadSensitiveInfo = async () => {
    try {
      const { user } = await localAuth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: patient } = await localAuth.getPatient(user.id);

      if (patient) {
        const { data, error } = await localDB.select<any>('sensitive_info',
          (info) => info.patient_id === patient.id
        );

        if (error) throw error;
        const sorted = (data || []).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setSensitiveInfo(sorted);
      }
    } catch (error: any) {
      toast.error('Error al cargar la información');
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

      const { error } = await localDB.insert('sensitive_info', {
        patient_id: patient!.id,
        info_type: formData.infoType,
        description: formData.description,
      });

      if (error) throw error;

      toast.success('Información agregada exitosamente');
      setIsDialogOpen(false);
      loadSensitiveInfo();
      
      setFormData({
        infoType: '',
        description: '',
      });
    } catch (error: any) {
      toast.error('Error al guardar la información');
    }
  };

  const toggleVisibility = (id: string) => {
    const newVisible = new Set(visibleItems);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleItems(newVisible);
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
                <h1 className="text-xl font-bold text-gray-900">Información Sensible</h1>
                <p className="text-sm text-gray-500">Datos confidenciales protegidos</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Información
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Información Sensible</DialogTitle>
                  <DialogDescription>
                    Esta información estará oculta hasta que decidas revelarla
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="infoType">Tipo de Información</Label>
                    <Select
                      value={formData.infoType}
                      onValueChange={(value) => setFormData({ ...formData, infoType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alergias">Alergias</SelectItem>
                        <SelectItem value="Condiciones Crónicas">Condiciones Crónicas</SelectItem>
                        <SelectItem value="Cirugías Previas">Cirugías Previas</SelectItem>
                        <SelectItem value="Medicación Habitual">Medicación Habitual</SelectItem>
                        <SelectItem value="Enfermedades Hereditarias">Enfermedades Hereditarias</SelectItem>
                        <SelectItem value="Adicciones">Adicciones</SelectItem>
                        <SelectItem value="Salud Mental">Salud Mental</SelectItem>
                        <SelectItem value="Atención Médica">Atención Médica</SelectItem>
                        <SelectItem value="Estudios Médicos">Estudios Médicos</SelectItem>
                        <SelectItem value="Eventos Adversos">Eventos Adversos</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe la información sensible"
                      required
                      rows={5}
                    />
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-orange-900">Importante</p>
                        <p className="text-xs text-orange-700 mt-1">
                          La omisión de información sensible deja libre de responsabilidad al médico
                          si esto afecta el resultado del tratamiento. Se recomienda compartir toda
                          la información relevante.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">Guardar Información</Button>
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
        {/* Warning Banner */}
        <Card className="mb-6 bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Información Protegida
                </h3>
                <p className="text-sm text-gray-700">
                  Esta información está oculta por defecto. Solo tú puedes autorizarsu
                  visualización mediante un token de autenticación. Recuerda que ocultar
                  información relevante puede afectar tu tratamiento médico.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : sensitiveInfo.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay información sensible registrada</p>
              <p className="text-sm text-gray-400 mt-2">
                Puedes agregar información que solo desees revelar cuando sea oportuno
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sensitiveInfo.map((info) => (
              <Card key={info.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{info.info_type}</CardTitle>
                      <CardDescription className="mt-2">
                        Agregado el {new Date(info.created_at).toLocaleDateString('es-AR')}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVisibility(info.id)}
                    >
                      {visibleItems.has(info.id) ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Mostrar
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {visibleItems.has(info.id) ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {info.description}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-500">
                        Información oculta - Haz clic en "Mostrar" para revelar
                      </p>
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