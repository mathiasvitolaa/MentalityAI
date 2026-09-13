from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas, security
from app.database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    subjects = db.query(models.Subject).filter(models.Subject.user_id == current_user.id).all()
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
    sessions = (
        db.query(models.StudySession).filter(models.StudySession.user_id == current_user.id).all()
    )
    quizzes = db.query(models.Quiz).filter(models.Quiz.user_id == current_user.id).all()
    decks = (
        db.query(models.FlashcardDeck)
        .filter(models.FlashcardDeck.user_id == current_user.id)
        .all()
    )

    pending = [t for t in tasks if t.status != models.TaskStatus.completed]
    completed = [t for t in tasks if t.status == models.TaskStatus.completed]
    upcoming = sorted(
        [t for t in pending if t.due_date], key=lambda t: t.due_date
    )[:5]

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    hours_week = sum(
        s.duration_minutes for s in sessions if s.completed and s.scheduled_at and s.scheduled_at >= week_ago
    ) / 60.0
    hours_total = sum(s.duration_minutes for s in sessions if s.completed) / 60.0

    recent_activity = []
    for d in decks[:3]:
        recent_activity.append(
            {"type": "flashcards", "title": d.title, "date": d.created_at.isoformat()}
        )
    for q in quizzes[:3]:
        recent_activity.append(
            {"type": "quiz", "title": q.title, "date": q.created_at.isoformat()}
        )
    recent_activity.sort(key=lambda a: a["date"], reverse=True)

    return schemas.DashboardStats(
        total_subjects=len(subjects),
        pending_tasks=len(pending),
        completed_tasks=len(completed),
        upcoming_tasks=upcoming,
        study_hours_week=round(hours_week, 1),
        study_hours_total=round(hours_total, 1),
        quizzes_completed=len(quizzes),
        flashcard_decks=len(decks),
        recent_activity=recent_activity[:6],
    )
