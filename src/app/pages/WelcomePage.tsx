import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { FileHeart, Shield, AlertTriangle } from 'lucide-react';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* Logo y título */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full">
            <FileHeart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Historia Clínica</h1>
          <p className="text-gray-600">
            Tu información médica completa, siempre disponible y bajo tu control
          </p>
        </div>

        {/* Características */}
        <div className="bg-blue-50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Seguridad garantizada</h3>
              <p className="text-sm text-gray-600">
                Tus datos están protegidos con los más altos estándares de seguridad
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileHeart className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Acceso centralizado</h3>
              <p className="text-sm text-gray-600">
                Toda tu información médica en un solo lugar
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            Iniciar Sesión
          </Button>
          <Button
            onClick={() => navigate('/register')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Registrarse
          </Button>

          {/* EMERGENCY BUTTON INTEGRATED */}
          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-red-600 font-semibold">
                ACCESO DE EMERGENCIA
              </span>
            </div>
          </div>

          <Button
            onClick={() => navigate('/emergency-info')}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-2 border-red-800"
            size="lg"
          >
            <AlertTriangle className="w-5 h-5 mr-2 animate-pulse" />
            INFORMACIÓN DE EMERGENCIA
          </Button>
        </div>

        {/* Pie de página */}
        <p className="text-xs text-center text-gray-500 pt-4">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad
        </p>
        </div>
      </div>
    </div>
  );
}
