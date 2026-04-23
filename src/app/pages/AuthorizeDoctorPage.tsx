import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Shield, Clock, Key, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localAuth, localDB } from '../../lib/localAuth';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function AuthorizeDoctorPage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTokens, setActiveTokens] = useState<any[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<'basic' | 'sensitive'>('basic');

  useEffect(() => {
    loadPatientAndTokens();
  }, []);

  const loadPatientAndTokens = async () => {
    try {
      const { user } = await localAuth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data: patientData } = await localAuth.getPatient(user.id);
      setPatient(patientData);

      // Load active tokens
      const { data: tokens } = await localDB.select<any>('access_tokens',
        (token) => token.patient_id === patientData?.id &&
                   new Date(token.expires_at) > new Date() &&
                   !token.revoked
      );

      setActiveTokens(tokens || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar información');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    try {
      if (!patient) return;

      // Generate 6-digit token (like Google Authenticator)
      const tokenCode = Math.floor(100000 + Math.random() * 900000).toString();

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 3); // 3 minutes expiry

      const { error } = await localDB.insert('access_tokens', {
        patient_id: patient.id,
        token_code: tokenCode,
        token_type: tokenType,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        revoked: false,
        used: false,
      });

      if (error) throw error;

      // Log the token generation
      await logActivity('token_generated', {
        token_type: tokenType,
        expires_in: '3 minutes',
      });

      setNewToken(tokenCode);
      toast.success('Token generado exitosamente');

      // Refresh tokens list
      loadPatientAndTokens();

      // Clear new token after 30 seconds
      setTimeout(() => setNewToken(null), 30000);

    } catch (error: any) {
      console.error('Error generating token:', error);
      toast.error('Error al generar token');
    }
  };

  const revokeToken = async (tokenId: string) => {
    try {
      await localDB.update('access_tokens', tokenId, {
        revoked: true,
        revoked_at: new Date().toISOString(),
      });

      await logActivity('token_revoked', {
        token_id: tokenId,
      });

      toast.success('Token revocado exitosamente');
      loadPatientAndTokens();
    } catch (error: any) {
      console.error('Error revoking token:', error);
      toast.error('Error al revocar token');
    }
  };

  const logActivity = async (action: string, details: any) => {
    try {
      await localDB.insert('activity_logs', {
        patient_id: patient.id,
        user_type: 'patient',
        user_id: patient.user_id,
        action,
        details: JSON.stringify(details),
        timestamp: new Date().toISOString(),
        ip_address: 'localhost', // In production, get real IP
      });
    } catch (error) {
      console.error('Error logging activity:', error);
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              aria-label="Volver al panel de control"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Autorización Médica</h1>
              <p className="text-sm text-gray-500">Genera tokens para acceso temporal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Info Card */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Sistema de Autorización por Token
                </h3>
                <p className="text-sm text-blue-800">
                  Los médicos necesitan un token temporal para acceder a tu historia clínica desde la web.
                  Cada token es válido por <strong>3 minutos</strong> y puedes revocarlo en cualquier momento.
                  Selecciona el nivel de acceso antes de generar el token.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Token */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Generar Nuevo Token
            </CardTitle>
            <CardDescription>
              Crea un token temporal para que un médico acceda a tu información
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nivel de Acceso</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={tokenType === 'basic' ? 'default' : 'outline'}
                  onClick={() => setTokenType('basic')}
                  className="h-auto flex-col items-start p-4"
                >
                  <span className="font-semibold mb-1">Acceso Básico</span>
                  <span className="text-xs text-left">
                    Datos personales, atención, enfermería, medicación, estudios
                  </span>
                </Button>
                <Button
                  variant={tokenType === 'sensitive' ? 'default' : 'outline'}
                  onClick={() => setTokenType('sensitive')}
                  className="h-auto flex-col items-start p-4"
                >
                  <span className="font-semibold mb-1">Acceso Completo</span>
                  <span className="text-xs text-left">
                    Incluye información sensible adicional
                  </span>
                </Button>
              </div>
            </div>

            <Button
              onClick={generateToken}
              className="w-full"
              size="lg"
              aria-label="Generar token de acceso temporal"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generar Token
            </Button>

            {newToken && (
              <div className="mt-4 p-6 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-green-900 mb-2">
                  Token Generado Exitosamente
                </p>
                <div className="bg-white p-4 rounded-lg border-2 border-green-300 mb-3">
                  <p className="text-4xl font-mono font-bold text-green-700 tracking-wider">
                    {newToken}
                  </p>
                </div>
                <p className="text-xs text-green-800 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Válido por 3 minutos desde ahora
                </p>
                <p className="text-xs text-green-700">
                  Comparte este código con tu médico para que pueda acceder a tu información
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Tokens */}
        <Card>
          <CardHeader>
            <CardTitle>Tokens Activos</CardTitle>
            <CardDescription>
              Tokens generados que aún no han expirado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeTokens.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay tokens activos en este momento
              </p>
            ) : (
              <div className="space-y-3">
                {activeTokens.map((token) => {
                  const expiresAt = new Date(token.expires_at);
                  const now = new Date();
                  const timeLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
                  const minutesLeft = Math.floor(timeLeft / 60);
                  const secondsLeft = timeLeft % 60;

                  return (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-xl font-bold text-gray-900">
                          {token.token_code}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            Tipo: <strong className="capitalize">{token.token_type === 'basic' ? 'Básico' : 'Completo'}</strong>
                          </span>
                          <span className="text-sm text-gray-600">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Expira en: <strong>{minutesLeft}:{secondsLeft.toString().padStart(2, '0')}</strong>
                          </span>
                          {token.used && (
                            <span className="text-sm text-green-600 font-semibold">
                              ✓ Usado
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeToken(token.id)}
                        aria-label="Revocar token de acceso"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Revocar
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions for Doctor */}
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-900">
              Instrucciones para el Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-purple-800">
              <li>Solicita al paciente que genere un token de acceso</li>
              <li>El paciente recibirá un código de 6 dígitos válido por 3 minutos</li>
              <li>Accede a la plataforma web médica e ingresa el token</li>
              <li>Tendrás acceso temporal a la información según el nivel autorizado</li>
              <li>El token expira automáticamente después de 3 minutos</li>
              <li>Cada acceso queda registrado en el sistema de auditoría</li>
            </ol>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
