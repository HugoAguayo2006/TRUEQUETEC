# TRUEQUETEC

Aplicacion web para intercambio de articulos. El proyecto tiene dos partes:

- Frontend: React + Vite
- Backend: FastAPI + SQLite

## Requisitos

- Node.js y npm
- Python 3.12 o compatible

## Instalar dependencias

Desde la raiz del proyecto, instala las dependencias del frontend:

```bash
npm install
```

Para el backend, entra a la carpeta `server`, crea/activa un entorno virtual e instala las dependencias:

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Correr el backend

En una terminal, desde la carpeta `server`:

```bash
source venv/bin/activate
uvicorn main:app --reload
```

El backend queda disponible en:

```text
http://localhost:8000
```

La documentacion de la API esta en:

```text
http://localhost:8000/docs
http://localhost:8000/scalar
```

## Correr el frontend

En otra terminal, desde la raiz del proyecto:

```bash
npm run dev
```

El frontend queda disponible normalmente en:

```text
http://localhost:5173
```

## Configurar la URL del backend

Por defecto, el frontend usa:

```text
http://localhost:8000
```

Si necesitas cambiar la URL del backend, crea un archivo `.env` en la raiz del proyecto con:

```bash
VITE_API_URL=http://localhost:8000
```

Luego reinicia el servidor de Vite.

## Flujo recomendado

1. Abre una terminal para el backend y corre `uvicorn main:app --reload` dentro de `server`.
2. Abre otra terminal para el frontend y corre `npm run dev` desde la raiz.
3. Entra a `http://localhost:5173` en el navegador.
