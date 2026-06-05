# Deployment: Vercel + Render + Neon

Esta guia deja TruequeTec publico con:

- Frontend: Vercel
- Backend: Render
- Base de datos: Neon PostgreSQL

## 1. Neon

1. Crea un proyecto en Neon.
2. Copia el connection string de la base de datos. Debe verse parecido a:
   `postgresql://usuario:password@host.neon.tech/dbname?sslmode=require`
3. Guarda ese valor para usarlo en Render como `DATABASE_URL`.

No necesitas crear tablas manualmente. El backend ejecuta `SQLModel.metadata.create_all` al arrancar y crea las tablas faltantes.

## 2. Render

1. Sube esta rama a GitHub:
   `git push -u origin feature/online`
2. En Render crea un `Web Service` conectado al repo.
3. Si usas configuracion manual:
   - Root Directory: `server`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Agrega variables de entorno:
   - `DATABASE_URL`: connection string de Neon.
   - `FRONTEND_ORIGINS`: URL de Vercel, por ejemplo `https://tu-app.vercel.app`.
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `SERP_API_KEY`
   - `USD_TO_MXN_RATE`: `18.5`
5. Deploy.
6. Abre la URL de Render. La ruta `/` debe responder:
   `{"status":"ok","service":"truquetec-api"}`

## 3. Vercel

1. En Vercel importa el mismo repo.
2. Configura:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Agrega variable de entorno:
   - `VITE_API_BASE_URL`: URL publica de Render, por ejemplo `https://truquetec-api.onrender.com`
4. Deploy.

## 4. Ajuste final de CORS

Cuando Vercel termine, copia la URL publica y ponla en Render como:

`FRONTEND_ORIGINS=https://tu-app.vercel.app`

Si quieres permitir local y produccion a la vez:

`FRONTEND_ORIGINS=http://localhost:5173,https://tu-app.vercel.app`

Luego haz redeploy del backend en Render.

## 5. Checklist de entrega

- Frontend publico en Vercel.
- Backend publico en Render.
- Base de datos PostgreSQL en Neon.
- `.env` configurado mediante variables de entorno en Vercel y Render.
- Build de frontend funcionando.
- Integracion completa: crear usuario, iniciar sesion, crear publicacion, subir imagen y probar un trueque.
