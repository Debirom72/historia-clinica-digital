import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mic, MicOff, Square, Play, Pause, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcription: string, audioUrl?: string) => void;
  fieldLabel?: string;
  placeholder?: string;
}

export function AudioRecorder({
  onTranscriptionComplete,
  fieldLabel = "Grabación de Audio",
  placeholder = "La transcripción aparecerá aquí..."
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasAudioSupport, setHasAudioSupport] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports audio recording
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasAudioSupport(false);
      toast.error('Tu navegador no soporta grabación de audio');
      return;
    }

    // Initialize Speech Recognition (for Chrome/Edge)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = transcription;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscription(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          toast.warning('No se detectó voz. Habla más cerca del micrófono.');
        }
      };

      recognitionRef.current.onend = () => {
        if (isRecording && !isPaused) {
          // Restart recognition if still recording
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.log('Recognition already started');
          }
        }
      };
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setTranscription('');
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsTranscribing(true);
        } catch (error) {
          console.log('Recognition start error:', error);
        }
      } else {
        toast.warning('Transcripción automática no disponible. La grabación de audio funcionará normalmente.');
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('Grabación iniciada');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Error al acceder al micrófono. Verifica los permisos.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      toast.info('Grabación pausada');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.log('Recognition already started');
        }
      }

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('Grabación reanudada');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsTranscribing(false);
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      toast.success('Grabación finalizada');
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setTranscription('');
    setRecordingTime(0);
    audioChunksRef.current = [];
    toast.info('Grabación eliminada');
  };

  const confirmTranscription = () => {
    if (transcription.trim()) {
      onTranscriptionComplete(transcription.trim(), audioUrl || undefined);
      toast.success('Transcripción confirmada');
    } else {
      toast.error('La transcripción está vacía');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasAudioSupport) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-red-900 font-semibold">
                Grabación de audio no disponible
              </p>
              <p className="text-sm text-red-800 mt-1">
                Tu navegador no soporta grabación de audio. Por favor, usa la opción de escritura manual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mic className="w-5 h-5" />
          {fieldLabel}
        </CardTitle>
        <CardDescription>
          Graba tu voz y se transcribirá automáticamente a texto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Recording Controls */}
        {!audioUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <Button
                  type="button"
                  onClick={startRecording}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Iniciar Grabación
                </Button>
              ) : (
                <>
                  {!isPaused ? (
                    <Button
                      type="button"
                      onClick={pauseRecording}
                      variant="outline"
                      size="lg"
                    >
                      <Pause className="w-5 h-5 mr-2" />
                      Pausar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={resumeRecording}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Reanudar
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Detener
                  </Button>
                </>
              )}
            </div>

            {isRecording && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-2xl font-mono font-bold text-red-900">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                {isTranscribing && (
                  <p className="text-sm text-gray-600 mt-2">
                    Transcribiendo en tiempo real...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Audio Playback */}
        {audioUrl && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-green-900">
                  Grabación completada ({formatTime(recordingTime)})
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deleteRecording}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          </div>
        )}

        {/* Transcription */}
        {(transcription || audioUrl) && (
          <div className="space-y-2">
            <Label htmlFor="transcription">Transcripción (editable)</Label>
            <Textarea
              id="transcription"
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder={placeholder}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-600">
              Puedes editar la transcripción antes de confirmar
            </p>
          </div>
        )}

        {/* Confirm Button */}
        {audioUrl && transcription && (
          <Button
            type="button"
            onClick={confirmTranscription}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Confirmar y Usar Transcripción
          </Button>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <strong>Instrucciones:</strong>
          </p>
          <ul className="text-xs text-blue-800 space-y-1 mt-2">
            <li>1. Click "Iniciar Grabación" y habla cerca del micrófono</li>
            <li>2. La transcripción aparecerá automáticamente mientras hablas</li>
            <li>3. Puedes pausar/reanudar durante la grabación</li>
            <li>4. Click "Detener" cuando termines</li>
            <li>5. Edita la transcripción si es necesario</li>
            <li>6. Click "Confirmar" para usar el texto</li>
          </ul>
        </div>

        {!recognitionRef.current && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-900">
              <strong>Nota:</strong> La transcripción automática no está disponible en este navegador.
              Se guardará el audio pero deberás transcribirlo manualmente. Recomendamos usar Google Chrome o Microsoft Edge.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
