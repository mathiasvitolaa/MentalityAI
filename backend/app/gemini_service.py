"""
Servicio de integración REAL con la API de Google Gemini.

Este es el ÚNICO módulo de todo el proyecto que habla con Gemini.
La API key se lee desde `settings.gemini_api_key` (variable de entorno
GEMINI_API_KEY, cargada vía .env) y NUNCA se envía al frontend ni se
hardcodea en el código fuente.

Frontend  →  FastAPI (este backend)  →  Gemini API
El navegador jamás llama a Gemini directamente.
"""
import json
import logging
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger("mentality.gemini")

_client: Optional[genai.Client] = None


def get_client() -> genai.Client:
    """Crea (una sola vez) el cliente de Gemini usando la API key del backend."""
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY no está configurada. Define la variable de entorno "
                "en backend/.env (ver backend/.env.example)."
            )
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


class GeminiError(Exception):
    """Error controlado al llamar a la API de Gemini."""


def _extract_text(response) -> str:
    text = getattr(response, "text", None)
    if text:
        return text
    # Fallback por si el SDK no expone `.text` directamente
    try:
        return response.candidates[0].content.parts[0].text
    except Exception as exc:  # pragma: no cover
        raise GeminiError(f"No se pudo extraer texto de la respuesta de Gemini: {exc}")


def _generate(
    prompt: str,
    system_instruction: Optional[str] = None,
    json_mode: bool = False,
    temperature: float = 0.6,
) -> str:
    """Llamada base (sincrónica) a Gemini. Se ejecuta en threadpool desde los routers async."""
    client = get_client()
    config_kwargs: Dict[str, Any] = {"temperature": temperature}
    if system_instruction:
        config_kwargs["system_instruction"] = system_instruction
    if json_mode:
        config_kwargs["response_mime_type"] = "application/json"

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(**config_kwargs),
        )
    except Exception as exc:
        logger.exception("Error llamando a Gemini")
        raise GeminiError(str(exc)) from exc

    return _extract_text(response)


def _parse_json(raw: str) -> Any:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Respuesta no era JSON válido: %s", raw[:500])
        raise GeminiError(f"Gemini devolvió una respuesta no parseable como JSON: {exc}")


# ---------------------------------------------------------------------------
# 1. Chat / Tutor IA
# ---------------------------------------------------------------------------
TUTOR_SYSTEM_PROMPTS = {
    "tutor": (
        "Eres Mentality, un tutor universitario paciente y motivador. "
        "Explica los conceptos paso a paso, usa analogías cuando ayude a entender, "
        "y termina con una pregunta breve para verificar comprensión cuando tenga sentido. "
        "Responde siempre en español, usando formato Markdown (negrillas, listas, pasos "
        "numerados y bloques de código cuando ayude a la claridad)."
    ),
    "simple": (
        "Eres Mentality. Explica los conceptos de la forma más simple y sencilla posible, "
        "como si hablaras con alguien que ve el tema por primera vez. Usa ejemplos cotidianos. "
        "Responde en español, usando formato Markdown (negrillas, listas) cuando ayude a la claridad."
    ),
    "avanzado": (
        "Eres Mentality, un asistente académico riguroso para estudiantes universitarios avanzados. "
        "Da explicaciones técnicas y precisas, usa terminología propia de la disciplina y profundiza "
        "en matices y excepciones cuando sea relevante. Responde en español, usando formato Markdown "
        "(negrillas, listas, bloques de código) cuando ayude a la claridad."
    ),
}


def chat_reply(history: List[Dict[str, str]], mode: str = "tutor") -> str:
    """
    history: lista de {"role": "user"|"assistant", "content": str} en orden cronológico.
    """
    system_instruction = TUTOR_SYSTEM_PROMPTS.get(mode, TUTOR_SYSTEM_PROMPTS["tutor"])
    client = get_client()

    contents = []
    for turn in history:
        role = "model" if turn["role"] == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=turn["content"])]))

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            ),
        )
    except Exception as exc:
        logger.exception("Error en chat_reply")
        raise GeminiError(str(exc)) from exc

    return _extract_text(response)


# ---------------------------------------------------------------------------
# 2. Resumen de documentos
# ---------------------------------------------------------------------------
def summarize_text(text: str) -> Dict[str, Any]:
    text = text[:60000]  # límite de seguridad para no exceder contexto
    prompt = f"""
Eres un asistente académico. Analiza el siguiente texto/apunte de un estudiante universitario
y responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones adicionales) con esta forma exacta:

{{
  "summary": "resumen claro y conciso del texto, de 3 a 6 párrafos",
  "key_points": ["punto clave 1", "punto clave 2", "..."],
  "key_concepts": ["concepto importante 1", "concepto importante 2", "..."]
}}

TEXTO:
\"\"\"{text}\"\"\"
"""
    raw = _generate(prompt, json_mode=True, temperature=0.4)
    data = _parse_json(raw)
    return {
        "summary": data.get("summary", ""),
        "key_points": data.get("key_points", []),
        "key_concepts": data.get("key_concepts", []),
    }


# ---------------------------------------------------------------------------
# 3. Generador de cuestionarios
# ---------------------------------------------------------------------------
def generate_quiz(topic_or_text: str, difficulty: str, num_mcq: int, num_open: int) -> Dict[str, Any]:
    topic_or_text = topic_or_text[:40000]
    prompt = f"""
Eres un generador de cuestionarios académicos para estudiantes universitarios.
Con base en el siguiente tema o texto, crea un cuestionario de dificultad "{difficulty}".

Genera exactamente {num_mcq} preguntas de opción múltiple (4 opciones cada una, solo una correcta)
y exactamente {num_open} preguntas abiertas (de desarrollo/reflexión).

Responde ÚNICAMENTE con JSON válido (sin markdown) con esta forma exacta:
{{
  "questions": [
    {{
      "type": "mcq",
      "question": "texto de la pregunta",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "correct_answer": "texto EXACTO de la opción correcta",
      "explanation": "por qué esa respuesta es correcta"
    }},
    {{
      "type": "open",
      "question": "texto de la pregunta abierta",
      "options": [],
      "correct_answer": "respuesta modelo/esperada",
      "explanation": "criterios clave que debería cubrir una buena respuesta"
    }}
  ]
}}

TEMA O TEXTO:
\"\"\"{topic_or_text}\"\"\"
"""
    raw = _generate(prompt, json_mode=True, temperature=0.5)
    data = _parse_json(raw)
    return {"questions": data.get("questions", [])}


# ---------------------------------------------------------------------------
# 4. Flashcards
# ---------------------------------------------------------------------------
def generate_flashcards(text: str, num_cards: int) -> List[Dict[str, str]]:
    text = text[:40000]
    prompt = f"""
Convierte el siguiente texto/apuntes de un estudiante universitario en {num_cards} tarjetas de estudio
(flashcards) tipo pregunta-respuesta o término-definición, cubriendo los conceptos más importantes.

Responde ÚNICAMENTE con JSON válido (sin markdown) con esta forma exacta:
{{
  "cards": [
    {{"front": "pregunta o término", "back": "respuesta o definición concisa"}}
  ]
}}

TEXTO:
\"\"\"{text}\"\"\"
"""
    raw = _generate(prompt, json_mode=True, temperature=0.5)
    data = _parse_json(raw)
    return data.get("cards", [])
