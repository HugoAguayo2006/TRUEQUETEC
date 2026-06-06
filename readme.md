# TruequeTec

TruequeTec es una aplicacion web para publicar articulos, descubrir objetos de otros usuarios y proponer trueques de forma digital. El sistema permite crear cuentas, subir publicaciones con imagen, estimar precios de referencia, iniciar solicitudes de intercambio, negociar ofertas, chatear dentro de cada trueque y calificar a la otra persona cuando el intercambio termina.

El proyecto esta pensado como una plataforma full stack: el frontend ofrece una experiencia tipo marketplace movil, mientras que el backend expone una API REST y WebSockets para manejar usuarios, articulos, trueques, mensajes y calificaciones.

## Arquitectura general

La solucion se divide en dos capas principales:

- **Frontend:** aplicacion React construida con Vite. Consume la API mediante `fetch`, guarda el usuario actual en `localStorage` y muestra pantallas para onboarding, login, registro, descubrir articulos, administrar publicaciones, revisar trueques, enviar mensajes, calificar intercambios y gestionar el perfil.
- **Backend:** API desarrollada con FastAPI. Expone routers para usuarios, articulos, trueques y estimacion de precios. Tambien incluye un WebSocket para notificaciones en tiempo real relacionadas con mensajes y cambios de estado de trueques.
- **Base de datos:** SQLModel sobre SQLAlchemy async. En local usa SQLite por defecto (`swap.db`) y en produccion puede usar PostgreSQL, por ejemplo Neon.
- **Almacenamiento de imagenes:** Cloudinary se usa para subir imagenes de articulos y obtener una URL publica segura.
- **Estimacion de precios:** el endpoint `/pricing/estimate` consulta Google Shopping mediante SerpAPI, filtra resultados relevantes y normaliza precios a MXN.
- **Deploy sugerido:** Vercel para el frontend, Render para el backend y Neon PostgreSQL para la base de datos.


## Tecnologias utilizadas

**Frontend**

- React 18
- Vite 6
- TypeScript
- Tailwind CSS 4
- Radix UI
- Material UI
- Lucide React
- Motion

**Backend**

- Python
- FastAPI
- Uvicorn
- SQLModel
- SQLAlchemy async
- Pydantic
- SQLite para desarrollo local
- PostgreSQL/asyncpg para produccion
- WebSockets
- Scalar para documentacion de API

**Servicios externos**

- Cloudinary para imagenes
- SerpAPI para estimacion de precios
- Vercel para frontend
- Render para backend
- Neon PostgreSQL para base de datos en produccion

## Instrucciones de instalacion
### Requisitos previos

- Node.js 18 o superior
- npm
- Python 3.11 o superior
- Cuenta de Cloudinary, si se usara subida de imagenes
- API key de SerpAPI, si se usara estimacion de precios

### Configurar variables de entorno

Frontend:

```bash
cp .env.example .env
```

Backend:

```bash
cp server/.env.example server/.env
```

Edita ambos archivos con los valores necesarios. Para correr localmente, SQLite funciona sin crear una base de datos manualmente.

### Instalar dependencias del frontend

```bash
npm install
```

### Instalar dependencias del backend

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

En Windows, la activacion del entorno virtual puede hacerse con:

```bash
server\.venv\Scripts\activate
```

### Ejecutar backend

Desde la carpeta `server`:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

La API quedara disponible en:

- `http://localhost:8000`
- `http://localhost:8000/docs`
- `http://localhost:8000/scalar`

Al arrancar, el backend crea las tablas automaticamente y registra el usuario administrador demo si no existe.

### Ejecutar frontend

En otra terminal, desde la raiz del proyecto:

```bash
npm run dev
```



## Variables de entorno (.env)

### Frontend (`.env`)

| Variable | Descripcion |
| --- | --- |
| `VITE_API_BASE_URL` | URL base del backend. En local suele ser `http://localhost:8000`; en produccion debe apuntar al servicio de Render. |

### Backend (`server/.env`)

```env
DATABASE_URL=sqlite+aiosqlite:///swap.db
FRONTEND_ORIGINS=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SERP_API_KEY=
USD_TO_MXN_RATE=18.5
```

| Variable | Descripcion |
| --- | --- |
| `DATABASE_URL` | Cadena de conexion a la base de datos. En local puede usarse SQLite; en produccion se recomienda PostgreSQL. |
| `FRONTEND_ORIGINS` | Lista separada por comas con los origenes permitidos por CORS. Ejemplo: `http://localhost:5173,https://truequetec.vercel.app`. |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud de Cloudinary. |
| `CLOUDINARY_API_KEY` | API key de Cloudinary. |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary. |
| `SERP_API_KEY` | API key de SerpAPI para consultar precios de productos. |
| `USD_TO_MXN_RATE` | Tipo de cambio usado para convertir precios USD a MXN cuando SerpAPI devuelve resultados en dolares. |

## Credenciales de demo

El backend crea automaticamente un usuario administrador al inicializar la base de datos:

```text
Correo: admin@truquetec.com
Password: Admin123
Rol: admin
```

Con esta cuenta se puede acceder al panel administrativo de la aplicacion. Los usuarios normales pueden registrarse desde la pantalla de signup.

## Enlaces de deploy

- Frontend Vercel: `https://truequetec.vercel.app`
- Backend Render: `<agregar-url-publica-de-render>`
- Documentacion API Scalar: `<agregar-url-publica-de-render>/scalar`

Si las URLs finales cambian, actualiza tambien:

- `VITE_API_BASE_URL` en Vercel.
- `FRONTEND_ORIGINS` en Render.

## Endpoints principales

- `GET /` - Healthcheck del backend.
- `POST /users/` - Crear usuario.
- `POST /users/login` - Iniciar sesion.
- `GET /items/` - Listar articulos disponibles.
- `POST /items/` - Crear articulo.
- `POST /items/upload-image` - Subir imagen a Cloudinary.
- `POST /swaps/` - Crear solicitud de trueque.
- `PATCH /swaps/{swap_id}/offer` - Agregar articulos ofrecidos.
- `PATCH /swaps/{swap_id}/status` - Actualizar estado del trueque.
- `GET /swaps/{swap_id}/messages` - Obtener mensajes.
- `POST /swaps/{swap_id}/messages` - Enviar mensaje.
- `POST /swaps/{swap_id}/ratings` - Calificar trueque completado.
- `GET /pricing/estimate?q=<producto>` - Estimar precio real de un producto.
