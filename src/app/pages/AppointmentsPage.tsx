import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Plus, Calendar as CalendarIcon, Clock, MapPin, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function AppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    appointmentType: '',
    doctorName: '',
    location: '',
    date: '',
    time: '',
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const { user } = await localAuth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: patient } = await localAuth.getPatient(user.id);

      if (patient) {
        const { data, error } = await localDB.select<any>('appointments',
          (apt) => apt.patient_id === patient.id
        );

        if (error) throw error;
        const sorted = (data || []).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setAppointments(sorted);
      }
    } catch (error: any) {
      toast.error('Error al cargar los turnos');
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

      const { error } = await localDB.insert('appointments', {
        patient_id: patient!.id,
        appointment_type: formData.appointmentType,
        doctor_name: formData.doctorName,
        location: formData.location,
        date: formData.date,
        time: formData.time,
        status: 'confirmado',
      });

      if (error) throw error;

      toast.success('Turno agendado exitosamente');
      setIsDialogOpen(false);
      loadAppointments();
      
      setFormData({
        appointmentType: '',
        doctorName: '',
        location: '',
        date: '',
        time: '',
      });
    } catch (error: any) {
      toast.error('Error al agendar el turno');
    }
  };

  const upcomingAppointments = appointments.filter(
    apt => new Date(apt.date) >= new Date() && apt.status === 'confirmado'
  );

  const pastAppointments = appointments.filter(
    apt => new Date(apt.date) < new Date() || apt.status === 'completado'
  );

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
                <h1 className="text-xl font-bold text-gray-900">Próximos Controles y Turnos</h1>
                <p className="text-sm text-gray-500">Gestiona tus citas médicas</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Solicitar Turno
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Solicitar Nuevo Turno</DialogTitle>
                  <DialogDescription>
                    Agenda una consulta médica
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentType">Tipo de Consulta</Label>
                    <Select
                      value={formData.appointmentType}
                      onValueChange={(value) => setFormData({ ...formData, appointmentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consulta-general">Consulta General</SelectItem>
                        <SelectItem value="control">Control</SelectItem>
                        <SelectItem value="especialista">Especialista</SelectItem>
                        <SelectItem value="estudios">Estudios</SelectItem>
                        <SelectItem value="laboratorio">Laboratorio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctorName">Médico / Especialista</Label>
                    <Input
                      id="doctorName"
                      value={formData.doctorName}
                      onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      placeholder="Nombre del médico"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Lugar de Atención</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Hospital, clínica o consultorio"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="time">Hora</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Recordatorio Automático</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Recibirás una notificación 24 horas antes de tu cita
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">Agendar Turno</Button>
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
        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Próximos Turnos</h2>
          {loading ? (
            <p className="text-center">Cargando...</p>
          ) : upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tienes turnos agendados próximamente</p>
                <p className="text-sm text-gray-400 mt-2">
                  Solicita un turno para agendar tu próxima consulta
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg">{appointment.appointment_type}</CardTitle>
                    <CardDescription>Dr. {appointment.doctor_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(appointment.date).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {appointment.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {appointment.location}
                    </div>
                    <div className="pt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Ver Detalles
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1">
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Historial de Turnos</h2>
            <div className="space-y-3">
              {pastAppointments.map((appointment) => (
                <Card key={appointment.id} className="opacity-75">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{appointment.appointment_type}</p>
                        <p className="text-sm text-gray-600">Dr. {appointment.doctor_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.date).toLocaleDateString('es-AR')}
                        </p>
                        <p className="text-xs text-gray-500">{appointment.time}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}