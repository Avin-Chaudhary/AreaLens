"""
RAG Service for AreaLens

Pipeline:
1. Receive R21 chatbot data and R5 area data.
2. Convert the data into LangChain Documents.
3. Split documents into smaller chunks.
4. Generate embeddings using HuggingFace.
5. Store vectors in a session-specific Chroma database.
6. Retrieve relevant chunks for chatbot questions.
7. Automatically clean up expired sessions.

Compatible with server.py imports:

    create_rag_session
    retrieve_documents
    delete_rag_session
    start_cleanup_thread
"""

from __future__ import annotations

import json
import logging
import re
import shutil
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma


# ---------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------

logger = logging.getLogger(__name__)

if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
CHROMA_DIR = BASE_DIR / "chroma_sessions"

# Session expiration time.
# Example: 3600 seconds = 1 hour.
SESSION_TTL_SECONDS = 60 * 60

# Cleanup interval.
# Example: every 10 minutes.
CLEANUP_INTERVAL_SECONDS = 10 * 60

# Embedding model.
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Chunk configuration.
CHUNK_SIZE = 700
CHUNK_OVERLAP = 100

# Default number of retrieved documents.
DEFAULT_TOP_K = 5


# ---------------------------------------------------------------------
# Internal session storage
# ---------------------------------------------------------------------

@dataclass
class RagSession:
    """
    Stores the Chroma vector database and last access time
    for a particular RAG session.
    """

    vectorstore: Chroma
    last_accessed: float


_sessions: dict[str, RagSession] = {}

_sessions_lock = threading.RLock()

_embeddings: HuggingFaceEmbeddings | None = None
_embeddings_lock = threading.Lock()

_cleanup_thread: threading.Thread | None = None
_cleanup_stop_event = threading.Event()


# ---------------------------------------------------------------------
# Directory setup
# ---------------------------------------------------------------------

CHROMA_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------

def _get_embeddings() -> HuggingFaceEmbeddings:
    """
    Lazily initialize and reuse the HuggingFace embedding model.

    This prevents the embedding model from loading repeatedly
    for every new RAG session.
    """

    global _embeddings

    if _embeddings is None:
        with _embeddings_lock:
            if _embeddings is None:
                logger.info(
                    "Loading HuggingFace embedding model: %s",
                    EMBEDDING_MODEL_NAME,
                )

                _embeddings = HuggingFaceEmbeddings(
                    model_name=EMBEDDING_MODEL_NAME,
                    model_kwargs={
                        "device": "cpu",
                    },
                    encode_kwargs={
                        "normalize_embeddings": True,
                    },
                )

                logger.info("Embedding model loaded successfully.")

    return _embeddings


# ---------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------

def _sanitize_session_id(session_id: str) -> str:
    """
    Convert a session ID into a safe directory and Chroma collection name.
    """

    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "_", str(session_id))

    if not cleaned:
        cleaned = "default_session"

    return cleaned[:100]


def _session_directory(session_id: str) -> Path:
    """
    Return the persistent Chroma directory for a session.
    """

    safe_session_id = _sanitize_session_id(session_id)
    return CHROMA_DIR / safe_session_id


def _collection_name(session_id: str) -> str:
    """
    Return a valid Chroma collection name.

    Chroma collection names must follow naming restrictions.
    """

    safe_session_id = _sanitize_session_id(session_id)

    collection_name = f"arealens_{safe_session_id}"

    # Ensure reasonable collection-name length.
    return collection_name[:180]


def _convert_data_to_text(data: Any, title: str = "") -> str:
    """
    Convert arbitrary Python data into readable text.

    Supports:
    - dictionaries
    - lists
    - strings
    - numbers
    - booleans
    - None
    - nested structures
    """

    if data is None:
        return ""

    if isinstance(data, str):
        text = data.strip()

        if title and text:
            return f"{title}\n{text}"

        return text

    try:
        serialized = json.dumps(
            data,
            indent=2,
            ensure_ascii=False,
            default=str,
        )
    except Exception:
        serialized = str(data)

    if title:
        return f"{title}\n{serialized}"

    return serialized


def _build_documents(r21: Any, r5: Any) -> list[Document]:
    """
    Convert R21 and R5 data into LangChain Documents.

    R21 generally contains chatbot/question-answer or recommendation
    information.

    R5 generally contains area/location information.

    The function is intentionally flexible because the incoming data
    can be a dictionary, list, string, or nested JSON structure.
    """

    documents: list[Document] = []

    # -------------------------------------------------------------
    # R21 document
    # -------------------------------------------------------------

    if r21 is not None:
        r21_text = _convert_data_to_text(
            r21,
            title="R21 Chatbot Data",
        )

        if r21_text.strip():
            documents.append(
                Document(
                    page_content=r21_text,
                    metadata={
                        "source": "r21",
                        "document_type": "chatbot_data",
                    },
                )
            )

    # -------------------------------------------------------------
    # R5 document
    # -------------------------------------------------------------

    if r5 is not None:
        r5_text = _convert_data_to_text(
            r5,
            title="R5 Area Data",
        )

        if r5_text.strip():
            documents.append(
                Document(
                    page_content=r5_text,
                    metadata={
                        "source": "r5",
                        "document_type": "area_data",
                    },
                )
            )

    return documents


def _split_documents(documents: list[Document]) -> list[Document]:
    """
    Split documents into smaller chunks for embedding and retrieval.
    """

    if not documents:
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=[
            "\n\n",
            "\n",
            ". ",
            ", ",
            " ",
            "",
        ],
    )

    chunks = splitter.split_documents(documents)

    # Add chunk index metadata.
    for index, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = index

    return chunks


# ---------------------------------------------------------------------
# Session creation
# ---------------------------------------------------------------------

def create_rag_session(
    session_id: str,
    r21: Any,
    r5: Any,
) -> dict[str, Any]:
    """
    Create or replace a RAG session.

    Parameters:
        session_id:
            Session ID received from the frontend.

        r21:
            Chatbot-related data.

        r5:
            Area-related data.

    Returns:
        JSON-serializable session information.
    """

    if not session_id or not str(session_id).strip():
        raise ValueError("session_id is required.")

    session_id = str(session_id).strip()

    logger.info("Creating RAG session: %s", session_id)

    # Convert input data into documents.
    documents = _build_documents(
        r21=r21,
        r5=r5,
    )

    if not documents:
        raise ValueError(
            "No valid data was provided for RAG session creation."
        )

    # Split documents into chunks.
    chunks = _split_documents(documents)

    if not chunks:
        raise ValueError(
            "No text chunks were generated from the supplied data."
        )

    # Remove an existing session if it already exists.
    delete_rag_session(session_id)

    session_path = _session_directory(session_id)
    session_path.mkdir(parents=True, exist_ok=True)

    embeddings = _get_embeddings()

    logger.info(
        "Creating Chroma vector store for session '%s' with %d chunks.",
        session_id,
        len(chunks),
    )

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=_collection_name(session_id),
        persist_directory=str(session_path),
    )

    # Older Chroma versions may require persist().
    # Newer versions persist automatically.
    persist_method = getattr(vectorstore, "persist", None)

    if callable(persist_method):
        try:
            persist_method()
        except Exception as exc:
            logger.debug(
                "Chroma persist() was not required or failed: %s",
                exc,
            )

    with _sessions_lock:
        _sessions[session_id] = RagSession(
            vectorstore=vectorstore,
            last_accessed=time.time(),
        )

    logger.info(
        "RAG session '%s' created successfully.",
        session_id,
    )

    return {
        "success": True,
        "session_id": session_id,
        "documents_created": len(documents),
        "chunks_created": len(chunks),
        "embedding_model": EMBEDDING_MODEL_NAME,
    }


# ---------------------------------------------------------------------
# Document retrieval
# ---------------------------------------------------------------------

def retrieve_documents(
    session_id: str,
    question: str,
    top_k: int = DEFAULT_TOP_K,
) -> list[str]:
    """
    Retrieve relevant text chunks for a question.

    This is the function expected by server.py.

    Parameters:
        session_id:
            Existing RAG session ID.

        question:
            User's question.

        top_k:
            Number of relevant chunks to retrieve.

    Returns:
        List of relevant chunk texts.
    """

    if not session_id or not str(session_id).strip():
        raise ValueError("session_id is required.")

    if not question or not str(question).strip():
        return []

    session_id = str(session_id).strip()

    try:
        top_k = int(top_k)
    except (TypeError, ValueError):
        top_k = DEFAULT_TOP_K

    top_k = max(1, min(top_k, 20))

    with _sessions_lock:
        session = _sessions.get(session_id)

        if session is None:
            raise ValueError(
                "RAG session not found or expired."
            )

        # Update session activity time.
        session.last_accessed = time.time()

        vectorstore = session.vectorstore

    logger.info(
        "Retrieving documents for session '%s'. Question: %s",
        session_id,
        question,
    )

    results = vectorstore.similarity_search(
        query=str(question),
        k=top_k,
    )

    retrieved_texts: list[str] = []

    for document in results:
        if not document or not document.page_content:
            continue

        retrieved_texts.append(
            document.page_content.strip()
        )

    return retrieved_texts


def retrieve_relevant_chunks(
    session_id: str,
    question: str,
    top_k: int = DEFAULT_TOP_K,
) -> list[str]:
    """
    Alias for retrieve_documents().

    This is useful if another module uses the name
    retrieve_relevant_chunks.
    """

    return retrieve_documents(
        session_id=session_id,
        question=question,
        top_k=top_k,
    )


# ---------------------------------------------------------------------
# Session deletion
# ---------------------------------------------------------------------

def delete_rag_session(session_id: str) -> dict[str, Any]:
    """
    Delete a RAG session from memory and disk.
    """

    if not session_id:
        return {
            "success": False,
            "message": "session_id is required.",
        }

    session_id = str(session_id).strip()

    with _sessions_lock:
        existed = session_id in _sessions

        _sessions.pop(session_id, None)

    session_path = _session_directory(session_id)

    if session_path.exists():
        try:
            shutil.rmtree(session_path)
            logger.info(
                "Deleted Chroma directory for session '%s'.",
                session_id,
            )
        except Exception as exc:
            logger.warning(
                "Could not delete Chroma directory for session '%s': %s",
                session_id,
                exc,
            )

    if existed:
        logger.info(
            "RAG session '%s' deleted successfully.",
            session_id,
        )

        return {
            "success": True,
            "session_id": session_id,
            "message": "RAG session deleted successfully.",
        }

    return {
        "success": True,
        "session_id": session_id,
        "message": "RAG session did not exist or was already deleted.",
    }


# ---------------------------------------------------------------------
# Cleanup logic
# ---------------------------------------------------------------------

def _cleanup_expired_sessions() -> None:
    """
    Remove sessions that have not been accessed within the TTL.
    """

    current_time = time.time()
    expired_session_ids: list[str] = []

    with _sessions_lock:
        for session_id, session in _sessions.items():
            age = current_time - session.last_accessed

            if age > SESSION_TTL_SECONDS:
                expired_session_ids.append(session_id)

    for session_id in expired_session_ids:
        logger.info(
            "Cleaning up expired RAG session: %s",
            session_id,
        )

        delete_rag_session(session_id)


def _cleanup_worker() -> None:
    """
    Background cleanup worker.
    """

    logger.info("RAG cleanup thread started.")

    while not _cleanup_stop_event.is_set():
        try:
            _cleanup_expired_sessions()
        except Exception as exc:
            logger.exception(
                "Error during RAG session cleanup: %s",
                exc,
            )

        _cleanup_stop_event.wait(
            CLEANUP_INTERVAL_SECONDS
        )

    logger.info("RAG cleanup thread stopped.")


def start_cleanup_thread() -> None:
    """
    Start the background cleanup thread.

    This function is safe to call multiple times.
    """

    global _cleanup_thread

    if (
        _cleanup_thread is not None
        and _cleanup_thread.is_alive()
    ):
        logger.debug(
            "RAG cleanup thread is already running."
        )
        return

    _cleanup_stop_event.clear()

    _cleanup_thread = threading.Thread(
        target=_cleanup_worker,
        name="rag-session-cleanup",
        daemon=True,
    )

    _cleanup_thread.start()

    logger.info("RAG cleanup thread initialized.")


def stop_cleanup_thread() -> None:
    """
    Stop the background cleanup thread.

    Optional utility function for testing or shutdown handling.
    """

    _cleanup_stop_event.set()


# ---------------------------------------------------------------------
# Optional inspection helper
# ---------------------------------------------------------------------

def get_rag_session_info() -> list[dict[str, Any]]:
    """
    Return basic information about currently active sessions.

    Useful for debugging.
    """

    current_time = time.time()
    session_info: list[dict[str, Any]] = []

    with _sessions_lock:
        for session_id, session in _sessions.items():
            session_info.append(
                {
                    "session_id": session_id,
                    "last_accessed": session.last_accessed,
                    "age_seconds": round(
                        current_time - session.last_accessed,
                        2,
                    ),
                }
            )

    return session_info