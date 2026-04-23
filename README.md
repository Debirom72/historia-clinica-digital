# Historia Clínica Digital

Sistema completo de gestión de historia clínica digital con características de seguridad y accesibilidad.

## Características

- ✅ Registro de pacientes con validación de identidad
- ✅ Portal médico para atención remota
- ✅ Información de emergencia sin login
- ✅ Gestión de medicación y recetas
- ✅ Información sensible con control de acceso
- ✅ Autorización temporal con tokens de 3 minutos
- ✅ Firma digital para documentos médicos
- ✅ Grabación de audio con transcripción automática
- ✅ Accesibilidad completa (contraste, tamaño de fuente)

## Deployment en Vercel

### Opción 1: Deploy desde interfaz web (Más fácil)

1. Subí este código a GitHub
2. Andá a [vercel.com](https://vercel.com)
3. Click en "New Project"
4. Importá tu repositorio de GitHub
5. Vercel detectará automáticamente que es un proyecto Vite
6. Click en "Deploy"
7. ¡Listo! Tu app estará online en 2 minutos

### Opción 2: Deploy desde línea de comandos

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm dev

# Build para producción
pnpm build
```

## Tecnologías

- React 18.3
- TypeScript
- Vite 6.3
- Tailwind CSS v4
- React Router 7
- Radix UI
- localStorage para persistencia
