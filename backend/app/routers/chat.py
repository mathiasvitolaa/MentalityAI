from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, security
from app.database import get_db
from app.gemini_service import GeminiError, chat_reply

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/conversations", response_model=list[schemas.ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return (
        db.query(models.Conversation)
        .filter(models.Conversation.user_id == current_user.id)
        .order_by(models.Conversation.created_at.desc())
        .all()
    )


@router.get("/conversations/{conversation_id}", response_model=schemas.ConversationOut)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    convo = (
        db.query(models.Conversation)
        .filter(models.Conversation.id == conversation_id, models.Conversation.user_id == current_user.id)
        .first()
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return convo


@router.post("/send", response_model=schemas.ChatResponse)
def send_message(
    payload: schemas.ChatMessageIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    if payload.conversation_id:
        convo = (
            db.query(models.Conversation)
            .filter(
                models.Conversation.id == payload.conversation_id,
                models.Conversation.user_id == current_user.id,
            )
            .first()
        )
        if not convo:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
    else:
        title = payload.message[:60] + ("..." if len(payload.message) > 60 else "")
        convo = models.Conversation(user_id=current_user.id, title=title, mode=payload.mode or "tutor")
        db.add(convo)
        db.commit()
        db.refresh(convo)

    user_msg = models.ChatMessage(conversation_id=convo.id, role="user", content=payload.message)
    db.add(user_msg)
    db.commit()

    history = [
        {"role": m.role, "content": m.content}
        for m in sorted(convo.messages, key=lambda m: m.created_at)
    ]

    try:
        reply_text = chat_reply(history, mode=convo.mode)
    except GeminiError as exc:
        raise HTTPException(status_code=502, detail=f"Error al contactar Gemini: {exc}")

    assistant_msg = models.ChatMessage(conversation_id=convo.id, role="assistant", content=reply_text)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return schemas.ChatResponse(
        conversation_id=convo.id,
        reply=schemas.ChatMessageOut.model_validate(assistant_msg),
    )


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    convo = (
        db.query(models.Conversation)
        .filter(models.Conversation.id == conversation_id, models.Conversation.user_id == current_user.id)
        .first()
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    db.delete(convo)
    db.commit()
    return {"ok": True}
