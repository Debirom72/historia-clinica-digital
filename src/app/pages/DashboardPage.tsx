import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  User,
  FileText,
  Stethoscope,
  Pill,
  FileBarChart,
  AlertCircle,
  Bot,
  Calendar,
  LogOut,
  Shield,
  AlertTriangle,
  Key,
  FileSearch,
} from 'lucide-react';
import { localAuth } from '../../lib/localAuth';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export function DashboardPage() {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const { user } = await localAuth.getUser();
      if (!user) return;

      const { data } = await localAuth.getPatient(user.id);
      setPatientData(data);
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const handleLogout = async () => {
    await localAuth.signOut();
    toast.success('Sesión cerrada');
    navigate('/');
  };

  const menuItems = [
    {
      icon: User,
      title: 'Datos Personales',
      description: 'Ver y editar información personal',
      path: '/personal-data',
      color: 'bg-blue-500',
    },
    {
      icon: FileText,
      title: 'Registro de Atención',
      description: 'Consultas, evoluciones y prácticas',
      path: '/attention-record',
      color: 'bg-green-500',
    },
    {
      icon: Stethoscope,
      title: 'Registro de Enfermería',
      description: 'Signos vitales y observaciones',
      path: '/nursing-record',
      color: 'bg-purple-500',
    },
    {
      icon: Pill,
      title: 'Registro de Medicación',
      description: 'Medicamentos y recetas',
      path: '/medication',
      color: 'bg-red-500',
    },
    {
      icon: FileBarChart,
      title: 'Estudios Realizados',
      description: 'Análisis y resultados',
      path: '/studies',
      color: 'bg-indigo-500',
    },
    {
      icon: AlertCircle,
      title: 'Información Sensible',
      description: 'Datos confidenciales del paciente',
      path: '/sensitive-info',
      color: 'bg-orange-500',
    },
    {
      icon: Bot,
      title: 'Asistente IA',
      description: 'Consultas sobre tu historia clínica',
      path: '/ai-assistant',
      color: 'bg-cyan-500',
    },
    {
      icon: Calendar,
      title: 'Próximos Controles y Turnos',
      description: 'Gestión de citas médicas',
      path: '/appointments',
      color: 'bg-pink-500',
    },
    {
      icon: Key,
      title: 'Autorizar Médico',
      description: 'Generar tokens de acceso temporal',
      path: '/authorize-doctor',
      color: 'bg-purple-500',
    },
    {
      icon: FileSearch,
      title: 'Registro de Auditoría',
      description: 'Ver accesos a tu información',
      path: '/audit-log',
      color: 'bg-yellow-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" role="main">
      {/* Skip to main content link for screen readers */}
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>

      {/* Header */}
      <header className="bg-white shadow" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {patientData?.profile_photo_url ? (
                <img
                  src={patientData.profile_photo_url}
                  alt="Foto de perfil"
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
                />
              ) : (
                <div
                  className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  <User className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {patientData?.full_name || 'Mi Historia Clínica'}
                </h1>
                <p className="text-sm text-gray-500">Panel de Control</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              aria-label="Cerrar sesión de la aplicación"
            >
              <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido a tu Historia Clínica Digital
          </h2>
          <p className="text-gray-600">
            Toda tu información médica en un solo lugar, segura y siempre disponible
          </p>
        </div>

        <nav aria-label="Menú principal de secciones de historia clínica">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {menuItems.map((item, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                aria-label={`${item.title}: ${item.description}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(item.path);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}
                      aria-hidden="true"
                    >
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </nav>

        {/* Info Card */}
        <aside aria-label="Información sobre seguridad y privacidad">
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Tu información está protegida
                  </h3>
                  <p className="text-sm text-gray-700">
                    Todos tus datos están encriptados y solo tú decides quién puede acceder a ellos.
                    Recuerda que puedes controlar el acceso de los médicos mediante tokens de
                    autenticación que se renuevan cada 3 minutos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}