import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Bot, Send, TrendingUp, Activity, Pill } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';

export function AIAssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de IA médico. Puedo ayudarte a analizar tu historia clínica, buscar tendencias en tus estudios, detectar interacciones medicamentosas y responder preguntas sobre tu salud. ¿En qué puedo ayudarte hoy?'
    }
  ]);
  const [input, setInput] = useState('');

  const quickQuestions = [
    {
      icon: TrendingUp,
      question: '¿Cómo ha evolucionado mi colesterol en los últimos años?',
    },
    {
      icon: Pill,
      question: '¿Hay alguna interacción entre mis medicamentos actuales?',
    },
    {
      icon: Activity,
      question: '¿Cuáles son mis últimos signos vitales?',
    },
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages([...messages, userMessage]);

    // Simular respuesta de IA
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant' as const,
        content: `Basándome en tu historia clínica, he analizado tu pregunta: "${input}". En un sistema real, aquí obtendría información de tus registros médicos y te proporcionaría un análisis detallado. Por ejemplo, podría revisar tus análisis de sangre de los últimos años, verificar interacciones medicamentosas conocidas, o resumir tu evolución clínica.`
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setInput('');
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Asistente IA</h1>
              <p className="text-sm text-gray-500">Consultas sobre tu historia clínica</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Questions */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preguntas Frecuentes</CardTitle>
                <CardDescription>Haz clic para preguntar rápidamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickQuestions.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 px-3 text-left"
                    onClick={() => handleQuickQuestion(item.question)}
                  >
                    <item.icon className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item.question}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Sobre el Asistente IA
                    </p>
                    <p className="text-xs text-gray-700">
                      Este asistente analiza tu historia clínica completa para responder tus
                      preguntas, identificar tendencias y ayudarte a entender mejor tu salud.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Chat con Asistente IA
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 py-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <Bot className="w-4 h-4" />
                              <span className="text-xs font-semibold">Asistente IA</span>
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Escribe tu pregunta sobre tu historia clínica..."
                      className="flex-1"
                    />
                    <Button onClick={handleSend} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Ejemplos: "¿Cuál fue mi último análisis de glucosa?", "¿Qué medicamentos estoy tomando?"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
