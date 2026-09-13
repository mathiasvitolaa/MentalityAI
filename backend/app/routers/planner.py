from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, security
from app.database import get_db

router = APIRouter(prefix="/api/planner", tags=["planner"])


# ---------- Subjects ----------
@router.get("/subjects", response_model=list[schemas.SubjectOut])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return (
        db.query(models.Subject)
        .filter(models.Subject.user_id == current_user.id)
        .order_by(models.Subject.created_at.desc())
        .all()
    )


@router.post("/subjects", response_model=schemas.SubjectOut, status_code=201)
def create_subject(
    payload: schemas.SubjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    subject = models.Subject(user_id=current_user.id, **payload.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}")
def delete_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    subject = (
        db.query(models.Subject)
        .filter(models.Subject.id == subject_id, models.Subject.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    db.delete(subject)
    db.commit()
    return {"ok": True}


# ---------- Tasks ----------
@router.get("/tasks", response_model=list[schemas.TaskOut])
def list_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return (
        db.query(models.Task)
        .filter(models.Task.user_id == current_user.id)
        .order_by(models.Task.due_date.asc().nulls_last())
        .all()
    )


@router.post("/tasks", response_model=schemas.TaskOut, status_code=201)
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    task = models.Task(user_id=current_user.id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: str,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    db.delete(task)
    db.commit()
    return {"ok": True}


# ---------- Study sessions ----------
@router.get("/sessions", response_model=list[schemas.StudySessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return (
        db.query(models.StudySession)
        .filter(models.StudySession.user_id == current_user.id)
        .order_by(models.StudySession.scheduled_at.asc().nulls_last())
        .all()
    )


@router.post("/sessions", response_model=schemas.StudySessionOut, status_code=201)
def create_session(
    payload: schemas.StudySessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    session_obj = models.StudySession(user_id=current_user.id, **payload.model_dump())
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj


@router.patch("/sessions/{session_id}", response_model=schemas.StudySessionOut)
def update_session(
    session_id: str,
    payload: schemas.StudySessionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    session_obj = (
        db.query(models.StudySession)
        .filter(models.StudySession.id == session_id, models.StudySession.user_id == current_user.id)
        .first()
    )
    if not session_obj:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session_obj, field, value)
    db.commit()
    db.refresh(session_obj)
    return session_obj


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    session_obj = (
        db.query(models.StudySession)
        .filter(models.StudySession.id == session_id, models.StudySession.user_id == current_user.id)
        .first()
    )
    if not session_obj:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    db.delete(session_obj)
    db.commit()
    return {"ok": True}
