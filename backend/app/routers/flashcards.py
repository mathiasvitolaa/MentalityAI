from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, security
from app.database import get_db
from app.gemini_service import GeminiError, generate_flashcards

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])


def _deck_to_out(deck: models.FlashcardDeck) -> schemas.FlashcardDeckOut:
    cards = sorted(deck.cards, key=lambda c: c.order_index)
    return schemas.FlashcardDeckOut(
        id=deck.id,
        title=deck.title,
        created_at=deck.created_at,
        cards=[schemas.FlashcardOut.model_validate(c) for c in cards],
    )


@router.get("", response_model=list[schemas.FlashcardDeckOut])
def list_decks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    decks = (
        db.query(models.FlashcardDeck)
        .filter(models.FlashcardDeck.user_id == current_user.id)
        .order_by(models.FlashcardDeck.created_at.desc())
        .all()
    )
    return [_deck_to_out(d) for d in decks]


@router.post("/generate", response_model=schemas.FlashcardDeckOut)
def create_deck(
    payload: schemas.FlashcardGenerateIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    try:
        cards = generate_flashcards(payload.text, payload.num_cards)
    except GeminiError as exc:
        raise HTTPException(status_code=502, detail=f"Error al contactar Gemini: {exc}")

    deck = models.FlashcardDeck(
        user_id=current_user.id,
        subject_id=payload.subject_id,
        title=payload.title,
        source_text=payload.text[:4000],
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)

    for idx, c in enumerate(cards):
        card = models.Flashcard(
            deck_id=deck.id,
            front=c.get("front", ""),
            back=c.get("back", ""),
            order_index=idx,
        )
        db.add(card)
    db.commit()
    db.refresh(deck)

    return _deck_to_out(deck)


@router.delete("/{deck_id}")
def delete_deck(
    deck_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    deck = (
        db.query(models.FlashcardDeck)
        .filter(models.FlashcardDeck.id == deck_id, models.FlashcardDeck.user_id == current_user.id)
        .first()
    )
    if not deck:
        raise HTTPException(status_code=404, detail="Mazo no encontrado")
    db.delete(deck)
    db.commit()
    return {"ok": True}
