import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, chat, dashboard, documents, flashcards, planner, quiz

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Mentality API",
    description="Backend de Mentality: asistente académico con integración real a Google Gemini.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Crea las tablas si no existen (para el MVP; en producción usar migraciones Alembic).
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "gemini_configured": bool(settings.gemini_api_key),
        "gemini_model": settings.gemini_model,
    }


app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(quiz.router)
app.include_router(flashcards.router)
app.include_router(planner.router)
app.include_router(dashboard.router)
