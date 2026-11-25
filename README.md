# Amigo Secreto

Aplicación web full-stack para organizar sorteos de **Amigo Secreto** con persistencia en **Firebase Firestore (plan gratuito Spark)**, lista para desplegar gratuitamente en **Vercel**.

## Características principales

- **Sin auto-asignaciones ni parejas cruzadas (`A ↔ B`):** Mezcla aleatoria con **Fisher-Yates** (`crypto.getRandomValues`) y asignación en **ciclo cerrado único** (`participante[i]` regala a `participante[(i + 1) % n]`).
- **Privacidad en enlaces y lista:** Cada participante recibe un enlace único `/sorteo/[id]?t=[token]`, y los nombres se ordenan alfabéticamente al guardar y mostrar para no revelar el orden circular.
- **Control anti-suplantación y anti-duplicados:** Al abrir el enlace con `?t=...`, el selector queda preseleccionado y bloqueado en ese participante. Una vez revelado (`revelado: true`, `reveladoEn` ISO), el nombre se deshabilita para futuras selecciones mediante una transacción atómica en Firestore.
- **Estado general en tiempo real:** Panel inferior con `Pendiente` / `✓ Revelado` sincronizado entre dispositivos sin exponer a quién le tocó cada persona.

## Configuración local

1. Instala dependencias:

```bash
npm install
```

2. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/) (plan gratuito Spark), habilita **Cloud Firestore** y registra una app Web.
3. Copia `.env.example` a `.env.local` y completa tus credenciales:

```bash
cp .env.example .env.local
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

## Despliegue gratuito en Vercel

1. Sube este repositorio a GitHub (`.env.local` está ignorado en `.gitignore`; `.env.example` sí se incluye como plantilla).
2. Importa el repositorio en [Vercel](https://vercel.com/new).
3. Añade las 6 variables `NEXT_PUBLIC_FIREBASE_*` en **Settings → Environment Variables**.
4. Haz clic en **Deploy**.

## Scripts disponibles

- `npm run dev` — Inicia el servidor de desarrollo.
- `npm run build` — Compila la aplicación para producción.
- `npm run lint` — Ejecuta ESLint.
- `npm test` — Ejecuta las pruebas unitarias del algoritmo de sorteo.
