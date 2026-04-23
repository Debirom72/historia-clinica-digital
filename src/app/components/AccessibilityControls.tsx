import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Volume2, VolumeX, Eye, Type, Circle } from 'lucide-react';
import { toast } from 'sonner';

export function AccessibilityControls() {
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedFontSize = localStorage.getItem('accessibility_fontSize') as any;
    const savedHighContrast = localStorage.getItem('accessibility_highContrast') === 'true';
    const savedSpeechEnabled = localStorage.getItem('accessibility_speech') === 'true';

    if (savedFontSize) setFontSize(savedFontSize);
    if (savedHighContrast) setHighContrast(savedHighContrast);
    if (savedSpeechEnabled) setSpeechEnabled(savedSpeechEnabled);

    // Apply font size
    applyFontSize(savedFontSize || 'normal');

    // Apply high contrast
    if (savedHighContrast) {
      document.body.classList.add('high-contrast');
    }
  }, []);

  const applyFontSize = (size: string) => {
    document.body.classList.remove('font-normal', 'font-large', 'font-xlarge');
    document.body.classList.add(`font-${size}`);
  };

  const toggleSpeech = () => {
    const newState = !speechEnabled;
    setSpeechEnabled(newState);
    localStorage.setItem('accessibility_speech', String(newState));

    if (newState) {
      speak('Lectura de pantalla activada. Presiona cualquier texto para escucharlo.');
      // Enable click-to-speak on all interactive elements
      enableClickToSpeak();
    } else {
      speak('Lectura de pantalla desactivada');
      window.speechSynthesis.cancel();
      disableClickToSpeak();
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Tu navegador no soporta síntesis de voz');
    }
  };

  const enableClickToSpeak = () => {
    document.addEventListener('click', handleClickToSpeak);
    document.addEventListener('focus', handleFocusToSpeak, true);
  };

  const disableClickToSpeak = () => {
    document.removeEventListener('click', handleClickToSpeak);
    document.removeEventListener('focus', handleFocusToSpeak, true);
  };

  const handleClickToSpeak = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const text = target.getAttribute('aria-label') ||
                 target.textContent ||
                 target.getAttribute('placeholder') ||
                 target.getAttribute('alt');

    if (text && speechEnabled) {
      speak(text);
    }
  };

  const handleFocusToSpeak = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    const text = target.getAttribute('aria-label') ||
                 target.textContent ||
                 target.getAttribute('placeholder') ||
                 target.getAttribute('alt');

    if (text && speechEnabled) {
      speak(text);
    }
  };

  const changeFontSize = () => {
    const sizes: Array<'normal' | 'large' | 'xlarge'> = ['normal', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(fontSize);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];

    setFontSize(nextSize);
    applyFontSize(nextSize);
    localStorage.setItem('accessibility_fontSize', nextSize);

    const sizeNames = { normal: 'Normal', large: 'Grande', xlarge: 'Muy Grande' };
    speak(`Tamaño de fuente cambiado a ${sizeNames[nextSize]}`);
    toast.success(`Tamaño de fuente: ${sizeNames[nextSize]}`);
  };

  const toggleHighContrast = () => {
    const newState = !highContrast;
    setHighContrast(newState);
    localStorage.setItem('accessibility_highContrast', String(newState));

    if (newState) {
      document.body.classList.add('high-contrast');
      speak('Alto contraste activado');
    } else {
      document.body.classList.remove('high-contrast');
      speak('Alto contraste desactivado');
    }
  };

  // Keyboard shortcut: Alt + A to toggle accessibility panel
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        setIsVisible(!isVisible);
        if (!isVisible) {
          speak('Panel de accesibilidad abierto');
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  return (
    <>
      {/* Floating accessibility button */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
        aria-label="Abrir panel de accesibilidad. Atajo de teclado: Alt + A"
        title="Accesibilidad (Alt + A)"
      >
        <Eye className="w-6 h-6" />
      </Button>

      {/* Accessibility Panel */}
      {isVisible && (
        <Card
          className="fixed bottom-20 right-4 z-50 w-80 shadow-2xl"
          role="dialog"
          aria-label="Panel de controles de accesibilidad"
        >
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Accesibilidad</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                aria-label="Cerrar panel de accesibilidad"
              >
                ✕
              </Button>
            </div>

            <Button
              onClick={toggleSpeech}
              variant={speechEnabled ? 'default' : 'outline'}
              className="w-full justify-start"
              aria-label={speechEnabled ? 'Desactivar lectura de pantalla' : 'Activar lectura de pantalla'}
              aria-pressed={speechEnabled}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
              Lectura de Pantalla {speechEnabled ? 'ON' : 'OFF'}
            </Button>

            <Button
              onClick={changeFontSize}
              variant="outline"
              className="w-full justify-start"
              aria-label={`Cambiar tamaño de fuente. Actual: ${fontSize}`}
            >
              <Type className="w-4 h-4 mr-2" />
              Tamaño de Fuente: {fontSize === 'normal' ? 'Normal' : fontSize === 'large' ? 'Grande' : 'Muy Grande'}
            </Button>

            <Button
              onClick={toggleHighContrast}
              variant={highContrast ? 'default' : 'outline'}
              className="w-full justify-start"
              aria-label={highContrast ? 'Desactivar alto contraste' : 'Activar alto contraste'}
              aria-pressed={highContrast}
            >
              <Circle className="w-4 h-4 mr-2" />
              Alto Contraste {highContrast ? 'ON' : 'OFF'}
            </Button>

            <div className="pt-3 border-t">
              <p className="text-xs text-gray-600">
                <strong>Atajos de teclado:</strong><br />
                Alt + A: Abrir/Cerrar panel<br />
                Tab: Navegar entre elementos<br />
                Enter/Space: Activar botones
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
