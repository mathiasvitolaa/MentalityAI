# Mentality — Prototipo funcional

Asistente académico con IA para estudiantes universitarios. Proyecto de
concepto/prototipado de producto para la materia de Gestión de Mercadeo.

**Mentality integra realmente la API de Google Gemini** (no simulada). Toda
llamada a Gemini ocurre en el backend (FastAPI); el frontend nunca conoce ni
expone la API key.

```
Frontend (Next.js)  →  Backend (FastAPI)  →  Google Gemini API
```

## Funcionalidades

1. **Chat con IA / Tutor**: conversación tipo ChatGPT, con 3 modos (tutor,
   explicación simple, nivel avanzado).
2. **Resumen de documentos**: sube PDF/TXT o pega texto → resumen, puntos
   clave y conceptos importantes generados por Gemini.
3. **Generador de cuestionarios**: preguntas de opción múltiple y abiertas,
   con dificultad configurable, respuestas correctas y explicación.
4. **Flashcards**: convierte apuntes en tarjetas de estudio automáticamente.
5. **Planificador académico**: materias, tareas, fechas de entrega y
   sesiones de estudio.
6. **Panel principal y Estadísticas**: tareas próximas, horas estudiadas,
   progreso y actividad reciente.

## Stack técnico

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Python + FastAPI + SQLAlchemy
- **Base de datos**: PostgreSQL
- **IA**: Google Gemini API (SDK oficial `google-genai`)

## Estructura del proyecto

```
studyai/
├── backend/
│   ├── app/
│   │   ├── main.py            # App FastAPI + routers
│   │   ├── config.py          # Variables de entorno (Settings)
│   │   ├── database.py        # Conexión PostgreSQL (SQLAlchemy)
│   │   ├── models.py          # Modelos de base de datos
│   │   ├── schemas.py         # Esquemas Pydantic
│   │   ├── security.py        # JWT + hashing de contraseñas
│   │   ├── gemini_service.py  # ÚNICO módulo que llama a Gemini
│   │   └── routers/           # auth, chat, documents, quiz, flashcards,
│   │                          # planner, dashboard
│   ├── seed.py                 # Datos de prueba
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                    # (NO subir a git — ya está en .gitignore)
├── frontend/
│   ├── app/                    # Landing, login, register, dashboard, chat,
│   │                            # summarizer, quiz, flashcards, planner,
│   │                            # stats, settings
│   ├── components/
│   ├── lib/                    # api.ts, auth-context.tsx, types.ts
│   └── package.json
├── docker-compose.yml           # PostgreSQL para desarrollo local
└── .gitignore
```

## 1. Requisitos previos

- Node.js 18+ y npm
- Python 3.10+
- PostgreSQL 14+ (o Docker, para levantarlo con `docker-compose`)
- Una API key de Google Gemini (ver sección "Configurar GEMINI_API_KEY")

## 2. Base de datos (PostgreSQL)

Opción rápida con Docker:

```bash
docker compose up -d
```

Esto levanta Postgres en `localhost:5432` con usuario `studyai`, contraseña
`studyai` y base de datos `studyai` (coincide con el `.env.example`).

Si prefieres usar tu propio PostgreSQL, crea una base de datos y ajusta
`DATABASE_URL` en `backend/.env`.

## 3. Backend (FastAPI)

```bash
cd backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Edita backend/.env y coloca tu GEMINI_API_KEY real (ver sección siguiente)

# (Opcional) Cargar datos de prueba
python seed.py

# Ejecutar el servidor
uvicorn app.main:app --reload --port 8000
```

El backend queda disponible en `http://localhost:8000`. Documentación
interactiva (Swagger) en `http://localhost:8000/docs`.

Prueba rápida de salud:

```bash
curl http://localhost:8000/api/health
```

## 4. Frontend (Next.js)

En otra terminal:

```bash
cd frontend

npm install

cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL debe apuntar al backend (por defecto http://localhost:8000)

npm run dev
```

El frontend queda disponible en `http://localhost:3000`.

## 5. Configurar GEMINI_API_KEY

1. Obtén tu API key real en https://aistudio.google.com/apikey
2. Ábrela en `backend/.env` (créalo copiando `backend/.env.example` si no
   existe):

   ```
   GEMINI_API_KEY=tu_api_key_real_aqui
   GEMINI_MODEL=gemini-2.0-flash
   ```

3. **Nunca** coloques la key en el frontend, en `.env.local`, en código
   JavaScript del cliente, en GitHub ni en ningún archivo público.
   `backend/.env` está incluido en `.gitignore`.

> ⚠️ **Importante sobre la clave incluida en `backend/.env.example`**: el
> valor `` que se
> proporcionó como referencia **no tiene el formato de una API key de Gemini**
> (las keys reales generadas en Google AI Studio empiezan con ``).
> El backend ya está completamente integrado y listo para usar Gemini de
> forma real: solo reemplaza ese valor por una API key válida generada en
> https://aistudio.google.com/apikey para que el chat, el resumidor, el
> generador de cuestionarios y las flashcards respondan con Gemini de
> verdad. Mientras la key no sea válida, esos endpoints devolverán un error
> controlado (HTTP 502) explicando el problema, sin romper el resto de la
> aplicación.

## 6. Cuenta de prueba

Si ejecutaste `python seed.py`, puedes iniciar sesión con:

- **Email**: `demo@mentality.com`
- **Contraseña**: `demo1234`

Esta cuenta ya tiene materias, tareas, sesiones de estudio y un mazo de
flashcards de ejemplo para poder navegar toda la app inmediatamente.

## 7. Flujo de uso recomendado

1. Abre `http://localhost:3000` → landing page.
2. Regístrate o inicia sesión con la cuenta demo.
3. Explora el **Panel principal** (dashboard).
4. Prueba el **Tutor IA** en `/chat` (requiere `GEMINI_API_KEY` válida).
5. Sube un PDF o pega texto en **Resumen de documentos**.
6. Genera un cuestionario sobre un tema de tu materia en **Cuestionarios**.
7. Crea un mazo de **Flashcards** a partir de tus apuntes.
8. Organiza tareas y sesiones en el **Planificador**.
9. Revisa tu progreso en **Estadísticas**.
10. Personaliza tu perfil y el modo oscuro/claro en **Configuración**.

## 8. Seguridad de la API key (arquitectura)

- `GEMINI_API_KEY` vive **únicamente** en `backend/.env`, cargada vía
  `pydantic-settings` en `backend/app/config.py`.
- El único archivo que importa el SDK de Gemini es
  `backend/app/gemini_service.py`.
- El frontend solo conoce `NEXT_PUBLIC_API_URL` (la URL del backend), nunca
  la API key.
- `backend/.env` y `frontend/.env.local` están excluidos en `.gitignore`;
  solo se versionan los `*.env.example`.

## 9. Notas del prototipo (MVP)

- Las tablas de PostgreSQL se crean automáticamente al iniciar el backend
  (`Base.metadata.create_all`). Para un entorno de producción real se
  recomendaría migrar a Alembic.
- La autenticación usa JWT simple (`python-jose`) con contraseñas
  hasheadas con bcrypt (`passlib`). Es suficiente para un prototipo
  académico; para producción se recomienda añadir refresh tokens,
  verificación de correo, rate limiting, etc.
- Los límites de tamaño de texto enviado a Gemini (60k/40k caracteres) son
  una medida de seguridad básica para no exceder el contexto del modelo.
