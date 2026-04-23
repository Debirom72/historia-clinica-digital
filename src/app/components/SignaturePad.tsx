import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Eraser, CheckCircle } from 'lucide-react';

interface SignaturePadProps {
  onSignatureComplete: (signature: string) => void;
  doctorName: string;
}

export function SignaturePad({ onSignatureComplete, doctorName }: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsSigned(false);
  };

  const handleSave = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureData = signatureRef.current.toDataURL('image/png');
      onSignatureComplete(signatureData);
      setIsSigned(true);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">Firma Digital del Médico</CardTitle>
        <CardDescription>
          Dr. {doctorName} - Firma para autenticar el registro médico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-gray-300 rounded-lg bg-white"
          role="region"
          aria-label="Área de firma digital"
        >
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              className: 'w-full h-48 cursor-crosshair',
              'aria-label': 'Canvas de firma digital',
            }}
            onEnd={() => setIsSigned(false)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="flex-1"
            aria-label="Borrar firma"
          >
            <Eraser className="w-4 h-4 mr-2" />
            Borrar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1"
            disabled={isSigned}
            aria-label="Guardar firma digital"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isSigned ? 'Firma Guardada' : 'Confirmar Firma'}
          </Button>
        </div>

        <p className="text-xs text-gray-600">
          <strong>Nota:</strong> Al firmar digitalmente, confirmas la autenticidad de la información
          registrada. Esta firma tiene validez legal según la normativa argentina.
        </p>
      </CardContent>
    </Card>
  );
}
