import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, security
from app.database import get_db
from app.gemini_service import GeminiError, generate_quiz

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


def _quiz_to_out(quiz: models.Quiz) -> schemas.QuizOut:
    questions = sorted(quiz.questions, key=lambda q: q.order_index)
    return schemas.QuizOut(
        id=quiz.id,
        title=quiz.title,
        difficulty=quiz.difficulty,
        created_at=quiz.created_at,
        questions=[
            schemas.QuizQuestionOut(
                id=q.id,
                question_type=q.question_type,
                question_text=q.question_text,
                options=json.loads(q.options) if q.options else [],
                correct_answer=q.correct_answer,
                explanation=q.explanation,
            )
            for q in questions
        ],
    )


@router.get("", response_model=list[schemas.QuizOut])
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    quizzes = (
        db.query(models.Quiz)
        .filter(models.Quiz.user_id == current_user.id)
        .order_by(models.Quiz.created_at.desc())
        .all()
    )
    return [_quiz_to_out(q) for q in quizzes]


@router.get("/{quiz_id}", response_model=schemas.QuizOut)
def get_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    quiz = (
        db.query(models.Quiz)
        .filter(models.Quiz.id == quiz_id, models.Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=404, detail="Cuestionario no encontrado")
    return _quiz_to_out(quiz)


@router.post("/generate", response_model=schemas.QuizOut)
def create_quiz(
    payload: schemas.QuizGenerateIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    try:
        result = generate_quiz(
            payload.topic_or_text, payload.difficulty, payload.num_mcq, payload.num_open
        )
    except GeminiError as exc:
        raise HTTPException(status_code=502, detail=f"Error al contactar Gemini: {exc}")

    quiz = models.Quiz(
        user_id=current_user.id,
        title=payload.title,
        source_topic=payload.topic_or_text[:2000],
        difficulty=payload.difficulty,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for idx, q in enumerate(result.get("questions", [])):
        question = models.QuizQuestion(
            quiz_id=quiz.id,
            question_type=q.get("type", "mcq"),
            question_text=q.get("question", ""),
            options=json.dumps(q.get("options", []), ensure_ascii=False),
            correct_answer=q.get("correct_answer", ""),
            explanation=q.get("explanation", ""),
            order_index=idx,
        )
        db.add(question)
    db.commit()
    db.refresh(quiz)

    return _quiz_to_out(quiz)


@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    quiz = (
        db.query(models.Quiz)
        .filter(models.Quiz.id == quiz_id, models.Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=404, detail="Cuestionario no encontrado")
    db.delete(quiz)
    db.commit()
    return {"ok": True}
