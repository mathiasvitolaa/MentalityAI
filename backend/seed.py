"""
Script de datos de prueba (seed) para Mentality.

Crea un usuario demo con materias, tareas, sesiones de estudio y un mazo de
flashcards de ejemplo, para poder navegar la app sin depender de Gemini
antes de tener la API key configurada.

Uso:
    (venv) $ python seed.py
"""
from datetime import datetime, timedelta

from app.database import Base, SessionLocal, engine
from app import models, security

DEMO_EMAIL = "demo@mentality.com"
DEMO_PASSWORD = "demo1234"


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == DEMO_EMAIL).first()
        if user:
            print(f"El usuario demo ya existe ({DEMO_EMAIL}). No se vuelve a sembrar.")
            return

        user = models.User(
            full_name="Estudiante Demo",
            email=DEMO_EMAIL,
            hashed_password=security.hash_password(DEMO_PASSWORD),
            career="Ingeniería de Sistemas",
            university="Universidad Nacional",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        subjects_data = [
            ("Cálculo II", "#6366F1", "Prof. Martínez", 4),
            ("Gestión de Mercadeo", "#EC4899", "Prof. Rodríguez", 3),
            ("Bases de Datos", "#10B981", "Prof. Gómez", 4),
            ("Física Mecánica", "#F59E0B", "Prof. López", 3),
        ]
        subjects = []
        for name, color, prof, credits in subjects_data:
            s = models.Subject(user_id=user.id, name=name, color=color, professor=prof, credits=credits)
            db.add(s)
            subjects.append(s)
        db.commit()
        for s in subjects:
            db.refresh(s)

        now = datetime.utcnow()
        tasks_data = [
            ("Entregar taller de derivadas", subjects[0], now + timedelta(days=2), "high"),
            ("Plan de mercadeo - avance 1", subjects[1], now + timedelta(days=5), "high"),
            ("Normalizar base de datos del proyecto", subjects[2], now + timedelta(days=7), "medium"),
            ("Repasar leyes de Newton", subjects[3], now + timedelta(days=1), "medium"),
            ("Leer capítulo 4 del libro guía", subjects[1], now + timedelta(days=10), "low"),
        ]
        for title, subject, due, priority in tasks_data:
            t = models.Task(
                user_id=user.id,
                subject_id=subject.id,
                title=title,
                description="Tarea de ejemplo generada por el seed de datos de prueba.",
                due_date=due,
                priority=priority,
            )
            db.add(t)
        db.commit()

        sessions_data = [
            ("Sesión de repaso: límites y derivadas", subjects[0], now - timedelta(days=1), 90, True),
            ("Estudio: segmentación de mercado", subjects[1], now - timedelta(days=2), 60, True),
            ("Práctica de SQL", subjects[2], now - timedelta(days=3), 45, True),
            ("Repaso general antes del parcial", subjects[3], now + timedelta(days=3), 120, False),
        ]
        for title, subject, sched, dur, completed in sessions_data:
            ss = models.StudySession(
                user_id=user.id,
                subject_id=subject.id,
                title=title,
                goal="Reforzar los conceptos vistos en clase",
                scheduled_at=sched,
                duration_minutes=dur,
                completed=completed,
            )
            db.add(ss)
        db.commit()

        deck = models.FlashcardDeck(
            user_id=user.id,
            subject_id=subjects[1].id,
            title="Fundamentos de Marketing",
            source_text="Mazo de ejemplo sembrado manualmente.",
        )
        db.add(deck)
        db.commit()
        db.refresh(deck)

        cards_data = [
            ("¿Qué es el marketing mix?", "Conjunto de herramientas (producto, precio, plaza, promoción) que una empresa usa para alcanzar sus objetivos comerciales."),
            ("¿Qué es la segmentación de mercado?", "Dividir un mercado amplio en grupos más pequeños de consumidores con necesidades o características similares."),
            ("¿Qué es una propuesta de valor?", "La razón por la cual un cliente elegiría el producto o servicio de una empresa sobre el de la competencia."),
            ("¿Qué es el customer journey?", "El recorrido completo que atraviesa un cliente desde que conoce una marca hasta que realiza (y repite) una compra."),
        ]
        for idx, (front, back) in enumerate(cards_data):
            db.add(models.Flashcard(deck_id=deck.id, front=front, back=back, order_index=idx))
        db.commit()

        print("✅ Datos de prueba creados correctamente.")
        print(f"   Usuario demo -> email: {DEMO_EMAIL} | contraseña: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
