import io
import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app import models, schemas, security
from app.database import get_db
from app.gemini_service import GeminiError, summarize_text

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _document_to_out(doc: models.Document) -> schemas.DocumentOut:
    return schemas.DocumentOut(
        id=doc.id,
        title=doc.title,
        summary=doc.summary,
        key_points=json.loads(doc.key_points) if doc.key_points else [],
        created_at=doc.created_at,
    )


@router.get("", response_model=list[schemas.DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    docs = (
        db.query(models.Document)
        .filter(models.Document.user_id == current_user.id)
        .order_by(models.Document.created_at.desc())
        .all()
    )
    return [_document_to_out(d) for d in docs]


def _store_and_summarize(
    db: Session, user_id: str, title: str, text: str
) -> schemas.DocumentOut:
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="El documento no contiene texto legible")

    try:
        result = summarize_text(text)
    except GeminiError as exc:
        raise HTTPException(status_code=502, detail=f"Error al contactar Gemini: {exc}")

    key_concepts = result.get("key_concepts", [])
    key_points = result.get("key_points", [])
    combined_points = key_points + [f"Concepto clave: {c}" for c in key_concepts]

    doc = models.Document(
        user_id=user_id,
        title=title,
        original_text=text[:60000],
        summary=result.get("summary", ""),
        key_points=json.dumps(combined_points, ensure_ascii=False),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _document_to_out(doc)


@router.post("/summarize-text", response_model=schemas.DocumentOut)
def summarize_from_text(
    payload: schemas.DocumentTextIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return _store_and_summarize(db, current_user.id, payload.title, payload.text)


@router.post("/summarize-file", response_model=schemas.DocumentOut)
async def summarize_from_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    raw = await file.read()
    text = ""

    if file.filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(raw))
            text = "\n".join((page.extract_text() or "") for page in reader.pages)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"No se pudo leer el PDF: {exc}")
    else:
        try:
            text = raw.decode("utf-8", errors="ignore")
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"No se pudo leer el archivo: {exc}")

    title = file.filename
    return _store_and_summarize(db, current_user.id, title, text)


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    doc = (
        db.query(models.Document)
        .filter(models.Document.id == document_id, models.Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    db.delete(doc)
    db.commit()
    return {"ok": True}
