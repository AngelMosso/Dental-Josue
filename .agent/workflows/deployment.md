---
description: Cómo desplegar DentalCare Pro a Internet para acceso desde cualquier red
---

Para que la aplicación sea accesible desde cualquier lugar (fuera de tu red local), debes "desplegarla" en un servidor. La opción más profesional, rápida y gratuita para este proyecto es **Vercel**.

### Requisitos Previos
1. Una cuenta gratuita en [GitHub](https://github.com).
2. Haber subido tu código a un repositorio de GitHub.

### 🚀 Paso 1: Preparar el Código
Asegúrate de que tus variables de entorno (Supabase URL y Key) estén configuradas en un archivo `.env` o en la configuración del servidor.

### 📦 Paso 2: Desplegar en Vercel
1. Ve a [Vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New"** > **"Project"**.
3. Selecciona tu repositorio `dentalcare-pro`.
4. **Configuración Importante**:
   - En **Environment Variables**, añade:
     - `VITE_SUPABASE_URL`: Tu URL de Supabase.
     - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima.
5. Haz clic en **"Deploy"**.

### 🛠️ Opción Alternativa (Rápida pero Temporal)
Si solo quieres mostrar la app un momento sin subirla a internet permanentemente, puedes usar un "túnel" desde tu computadora actual:

1. Abre una nueva terminal.
2. Ejecuta: `npx localtunnel --port 5173`.
3. Esto te dará una dirección web temporal (ej: `https://shaggy-pets-show.locallto.me`) que puedes abrir desde cualquier celular o PC en el mundo mientras tu computadora esté encendida con el comando `npm run dev` activo.

### 🌐 Opción Profesional (Dominio Propio)
Si deseas usar un dominio como `clinicadentalpro.com`, puedes comprarlo directamente en Vercel o configurar uno que ya tengas siguiendo sus instrucciones de DNS.
