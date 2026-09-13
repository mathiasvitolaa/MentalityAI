"""
Esquemas Pydantic (request/response) para la API de Mentality.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    career: Optional[str] = None
    university: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    career: Optional[str] = None
    university: Optional[str] = None
    theme_preference: str = "light"
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    career: Optional[str] = None
    university: Optional[str] = None
    theme_preference: Optional[str] = None


# ---------- Subjects ----------
class SubjectCreate(BaseModel):
    name: str
    color: Optional[str] = "#6366F1"
    professor: Optional[str] = None
    credits: Optional[int] = 3


class SubjectOut(SubjectCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Tasks (planificador) ----------
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = "medium"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class TaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    subject_id: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Study sessions ----------
class StudySessionCreate(BaseModel):
    title: str
    goal: Optional[str] = None
    subject_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = 60


class StudySessionOut(BaseModel):
    id: str
    title: str
    goal: Optional[str] = None
    subject_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: int
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StudySessionUpdate(BaseModel):
    completed: Optional[bool] = None
    duration_minutes: Optional[int] = None


# ---------- Chat ----------
class ChatMessageIn(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    mode: Optional[str] = "tutor"  # tutor | simple | avanzado


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    title: str
    mode: str
    created_at: datetime
    messages: List[ChatMessageOut] = []

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    conversation_id: str
    reply: ChatMessageOut


# ---------- Documentos / Resúmenes ----------
class DocumentTextIn(BaseModel):
    title: str
    text: str


class DocumentOut(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    key_points: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Quizzes ----------
class QuizGenerateIn(BaseModel):
    title: str
    topic_or_text: str
    difficulty: str = "medium"  # easy | medium | hard
    num_mcq: int = 5
    num_open: int = 2


class QuizQuestionOut(BaseModel):
    id: str
    question_type: str
    question_text: str
    options: List[str] = []
    correct_answer: str
    explanation: Optional[str] = None

    class Config:
        from_attributes = True


class QuizOut(BaseModel):
    id: str
    title: str
    difficulty: str
    created_at: datetime
    questions: List[QuizQuestionOut] = []

    class Config:
        from_attributes = True


# ---------- Flashcards ----------
class FlashcardGenerateIn(BaseModel):
    title: str
    text: str
    subject_id: Optional[str] = None
    num_cards: int = 10


class FlashcardOut(BaseModel):
    id: str
    front: str
    back: str

    class Config:
        from_attributes = True


class FlashcardDeckOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    cards: List[FlashcardOut] = []

    class Config:
        from_attributes = True


# ---------- Dashboard ----------
class DashboardStats(BaseModel):
    total_subjects: int
    pending_tasks: int
    completed_tasks: int
    upcoming_tasks: List[TaskOut]
    study_hours_week: float
    study_hours_total: float
    quizzes_completed: int
    flashcard_decks: int
    recent_activity: List[dict]
