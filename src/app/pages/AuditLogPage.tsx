import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, FileText, User, Eye, Key, Shield, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function AuditLogPage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'patient' | 'doctor'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, filterType, searchTerm]);

  const loadAuditLogs = async () => {
    try {
      const { user } = await localAuth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data: patientData } = await localAuth.getPatient(user.id);
      setPatient(patientData);

      // Load all activity logs for this patient
      const { data: activityLogs } = await localDB.select<any>('activity_logs',
        (log) => log.patient_id === patientData?.id
      );

      // Sort by timestamp descending (most recent first)
      const sorted = (activityLogs || []).sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setLogs(sorted);
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
      toast.error('Error al cargar registros de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by user type
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.user_type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredLogs(filtered);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('token')) return <Key className="w-4 h-4" />;
    if (action.includes('access') || action.includes('view')) return <Eye className="w-4 h-4" />;
    if (action.includes('update') || action.includes('edit')) return <FileText className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'token_generated': 'Token Generado',
      'token_revoked': 'Token Revocado',
      'token_used': 'Token Utilizado',
      'doctor_access_basic': 'Acceso Médico Básico',
      'doctor_access_sensitive': 'Acceso Médico Completo',
      'patient_login': 'Inicio de Sesión',
      'patient_logout': 'Cierre de Sesión',
      'data_viewed': 'Información Visualizada',
      'data_updated': 'Información Actualizada',
      'prescription_generated': 'Receta Generada',
      'record_created': 'Registro Creado',
    };

    return labels[action] || action;
  };

  const getUserTypeBadge = (userType: string) => {
    if (userType === 'patient') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <User className="w-3 h-3 mr-1" />
          Paciente
        </span>
      );
    } else if (userType === 'doctor') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <User className="w-3 h-3 mr-1" />
          Médico
        </span>
      );
    }
    return null;
  };

  const exportLogs = () => {
    try {
      const csvContent = [
        ['Fecha/Hora', 'Tipo Usuario', 'Acción', 'Detalles', 'IP'].join(','),
        ...filteredLogs.map(log => [
          new Date(log.timestamp).toLocaleString('es-AR'),
          log.user_type,
          getActionLabel(log.action),
          log.details || '',
          log.ip_address || 'N/A',
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `auditoria_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Registro de auditoría exportado');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Error al exportar registros');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                aria-label="Volver al panel de control"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Registro de Auditoría</h1>
                <p className="text-sm text-gray-500">Trazabilidad completa de accesos</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={exportLogs}
              aria-label="Exportar registro de auditoría"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Info Card */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Cumplimiento Ley 25.326 - Protección de Datos Personales
                </h3>
                <p className="text-sm text-blue-800">
                  Este registro de auditoría documenta todos los accesos a tu información médica,
                  garantizando transparencia y control total sobre tus datos personales. Cada acceso
                  queda registrado con fecha, hora, usuario y tipo de información consultada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtra los registros de auditoría</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Usuario</Label>
                <div className="flex gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterType('all')}
                    size="sm"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filterType === 'patient' ? 'default' : 'outline'}
                    onClick={() => setFilterType('patient')}
                    size="sm"
                  >
                    Paciente
                  </Button>
                  <Button
                    variant={filterType === 'doctor' ? 'default' : 'outline'}
                    onClick={() => setFilterType('doctor')}
                    size="sm"
                  >
                    Médico
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Buscar en acciones o detalles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{logs.length}</p>
                <p className="text-sm text-gray-600 mt-1">Total de Eventos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {logs.filter(l => l.user_type === 'doctor').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Accesos Médicos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {logs.filter(l => l.action.includes('token')).length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Tokens Generados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {logs.filter(l => l.user_type === 'patient').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Acciones Paciente</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Actividad</CardTitle>
            <CardDescription>
              {filteredLogs.length} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay registros que coincidan con los filtros
              </p>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {getActionLabel(log.action)}
                        </p>
                        {getUserTypeBadge(log.user_type)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString('es-AR', {
                          dateStyle: 'medium',
                          timeStyle: 'medium',
                        })}
                      </p>
                      {log.details && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-xs text-gray-700">
                            <strong>Detalles:</strong>
                          </p>
                          <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                            {JSON.stringify(JSON.parse(log.details), null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.ip_address && (
                        <p className="text-xs text-gray-500 mt-1">
                          IP: {log.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
