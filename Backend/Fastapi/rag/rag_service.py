import time
import threading
from typing import Any

import chromadb
from sentence_transformers import SentenceTransformer


# ============================================================
# CONFIGURATION
# ============================================================

SESSION_TIMEOUT_SECONDS = 4 * 60

# Chroma will keep the vector database on disk.
# Individual session collections will be deleted after timeout.
CHROMA_PATH = "./rag_storage"


# ============================================================
# VECTOR DATABASE
# ============================================================

chroma_client = chromadb.PersistentClient(
    path=CHROMA_PATH
)


# ============================================================
# EMBEDDING MODEL
# ============================================================

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# ============================================================
# SESSION REGISTRY
# ============================================================

sessions = {}

session_lock = threading.Lock()


# ============================================================
# HELPERS
# ============================================================


def _collection_name(session_id: str) -> str:

    # Chroma collection names have naming restrictions.
    # Remove UUID hyphens to keep the name simple.

    clean_id = session_id.replace("-", "")

    return f"session_{clean_id}"


def _create_embedding(text: str):

    return embedding_model.encode(
        text,
        normalize_embeddings=True,
    ).tolist()


def _is_valid_value(value: Any) -> bool:

    """
    Check whether a value should be inserted into the
    vector database.

    None, empty strings and Infinity-like values are ignored.
    """

    if value is None:
        return False

    if isinstance(value, str):

        if not value.strip():
            return False

        if value.lower() in (
            "inf",
            "infinity",
            "+inf",
            "-inf",
        ):
            return False

    return True


def _readable_field_name(field: str) -> str:

    return field.replace("_", " ")


# ============================================================
# R21 → DOCUMENTS
# ============================================================


def _build_r21_documents(
    r21: Any,
    session_id: str,
):
    """
    Convert AreaLens R21 chatbot data into meaningful
    documents for semantic search.

    R21 can contain:

        - location
        - summary
        - important distances
        - places grouped by category
        - metadata

    Each individual place becomes its own document.
    """

    documents = []
    metadatas = []
    ids = []

    if not isinstance(r21, dict):

        return documents, metadatas, ids


    # --------------------------------------------------------
    # LOCATION
    # --------------------------------------------------------

    location = r21.get("location")

    if isinstance(location, dict):

        latitude = location.get("latitude")
        longitude = location.get("longitude")

        if (
            latitude is not None
            and longitude is not None
        ):

            document = (
                "The selected AreaLens location is at "
                f"latitude {latitude} and "
                f"longitude {longitude}."
            )

            documents.append(document)

            metadatas.append({
                "session_id": session_id,
                "category": "location",
                "source": "r21",
            })

            ids.append(
                f"{session_id}_location"
            )


    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    summary = r21.get("summary")

    if isinstance(summary, dict):

        summary_parts = []

        for key, value in summary.items():

            if not _is_valid_value(value):
                continue

            readable_key = _readable_field_name(key)

            summary_parts.append(
                f"{readable_key}: {value}"
            )

        if summary_parts:

            document = (
                "AreaLens location summary:\n"
                + "\n".join(summary_parts)
            )

            documents.append(document)

            metadatas.append({
                "session_id": session_id,
                "category": "summary",
                "source": "r21",
            })

            ids.append(
                f"{session_id}_summary"
            )


    # --------------------------------------------------------
    # IMPORTANT DISTANCES
    # --------------------------------------------------------

    distances = r21.get("important_distances")

    if isinstance(distances, dict):

        distance_counter = 0

        for key, value in distances.items():

            if not _is_valid_value(value):
                continue

            readable_key = _readable_field_name(key)

            document = (
                f"The {readable_key} from the selected "
                f"AreaLens location is {value} km."
            )

            documents.append(document)

            metadatas.append({
                "session_id": session_id,
                "category": "distances",
                "source": "r21",
                "distance_type": readable_key,
            })

            ids.append(
                f"{session_id}_distance_{distance_counter}"
            )

            distance_counter += 1


    # --------------------------------------------------------
    # INDIVIDUAL PLACES
    # --------------------------------------------------------

    places = r21.get("places")

    if isinstance(places, dict):

        place_counter = 0

        for category, category_places in places.items():

            if not isinstance(category_places, list):
                continue

            for place in category_places:

                if not isinstance(place, dict):
                    continue

                name = place.get(
                    "name",
                    "Unnamed place"
                )

                text_parts = [
                    f"Category: {category}",
                    f"Name: {name}",
                ]

                for key, value in place.items():

                    if key == "name":
                        continue

                    if not _is_valid_value(value):
                        continue

                    readable_key = _readable_field_name(key)

                    text_parts.append(
                        f"{readable_key}: {value}"
                    )

                document = "\n".join(text_parts)

                documents.append(document)

                metadatas.append({
                    "session_id": session_id,
                    "category": str(category),
                    "source": "r21",
                    "place_name": str(name),
                })

                ids.append(
                    f"{session_id}_place_{place_counter}"
                )

                place_counter += 1


    return documents, metadatas, ids


# ============================================================
# R5 → DOCUMENTS
# ============================================================


def _build_r5_documents(
    r5: Any,
    session_id: str,
):
    """
    Convert processed AreaLens R5 data into individual,
    natural-language documents.

    IMPORTANT:

    We intentionally create ONE document per field instead
    of ONE document per category.

    Example:

        hospitals_count = 4

    becomes:

        "There are 4 hospitals in the selected area."

    This makes exact factual questions much easier for
    semantic retrieval.
    """

    documents = []
    metadatas = []
    ids = []

    if not isinstance(r5, dict):

        return documents, metadatas, ids


    # ========================================================
    # TRANSPORT
    # ========================================================

    transport_fields = {

        "radius_m": (
            lambda v:
            f"The AreaLens analysis covers a radius of "
            f"{float(v) / 1000:.2f} km."
        ),

        "bus_stops_count": (
            lambda v:
            f"There are {v} bus stops in the selected area."
        ),

        "metro_stations_count": (
            lambda v:
            f"There are {v} metro stations in the selected area."
        ),

        "railway_station_distance_km": (
            lambda v:
            f"The nearest railway station is "
            f"{v} km from the selected location."
        ),

        "airport_distance_km": (
            lambda v:
            f"The nearest airport is "
            f"{v} km from the selected location."
        ),
    }


    # ========================================================
    # BASICS
    # ========================================================

    basics_fields = {

        "hospitals_count": (
            lambda v:
            f"There are {v} hospitals in the selected area."
        ),

        "nearest_hospital_distance_km": (
            lambda v:
            f"The nearest hospital is "
            f"{v} km from the selected location."
        ),

        "banks_count": (
            lambda v:
            f"There are {v} banks in the selected area."
        ),

        "nearest_bank_distance_km": (
            lambda v:
            f"The nearest bank is "
            f"{v} km from the selected location."
        ),

        "police_stations_count": (
            lambda v:
            f"There are {v} police stations in the selected area."
        ),

        "nearest_police_station_distance_km": (
            lambda v:
            f"The nearest police station is "
            f"{v} km from the selected location."
        ),

        "nearest_fire_station_distance_km": (
            lambda v:
            f"The nearest fire station is "
            f"{v} km from the selected location."
        ),
    }


    # ========================================================
    # COMFORT
    # ========================================================

    comfort_fields = {

        "restaurants_count": (
            lambda v:
            f"There are {v} restaurants in the selected area."
        ),

        "gyms_count": (
            lambda v:
            f"There are {v} gyms in the selected area."
        ),

        "parks_count": (
            lambda v:
            f"There are {v} parks in the selected area."
        ),

        "cinemas_count": (
            lambda v:
            f"There are {v} cinemas in the selected area."
        ),

        "shopping_places_count": (
            lambda v:
            f"There are {v} shopping places in the selected area."
        ),
    }


    # ========================================================
    # ENVIRONMENT
    # ========================================================

    environment_fields = {

        "aqi": (
            lambda v:
            f"The AQI (Air Quality Index) of the selected "
            f"area is {v}."
        ),

        "temperature_c": (
            lambda v:
            f"The temperature in the selected area is "
            f"{v} degrees Celsius."
        ),

        "humidity_percent": (
            lambda v:
            f"The humidity in the selected area is "
            f"{v}%."
        ),
    }


    # ========================================================
    # NEWS
    # ========================================================

    news_fields = {

        "news_is_safe": (
            lambda v:
            f"Recent news safety classification for the "
            f"selected area is {v}."
        ),

        "news_is_clean": (
            lambda v:
            f"Recent news cleanliness classification for "
            f"the selected area is {v}."
        ),

        "news_is_developing": (
            lambda v:
            f"Recent news development classification for "
            f"the selected area is {v}."
        ),

        "news_is_luxury": (
            lambda v:
            f"Recent news luxury-area classification for "
            f"the selected area is {v}."
        ),
    }


    groups = {

        "transport": transport_fields,

        "basics": basics_fields,

        "comfort": comfort_fields,

        "environment": environment_fields,

        "news": news_fields,
    }


    # ========================================================
    # CREATE INDIVIDUAL DOCUMENTS
    # ========================================================

    document_counter = 0

    for group_name, fields in groups.items():

        for field, sentence_builder in fields.items():

            if field not in r5:
                continue

            value = r5.get(field)

            if not _is_valid_value(value):
                continue

            try:

                document = sentence_builder(value)

            except Exception:

                # Fallback in case a value has an unexpected
                # format.

                readable_field = _readable_field_name(field)

                document = (
                    f"{readable_field}: {value}"
                )

            documents.append(document)

            metadatas.append({
                "session_id": session_id,
                "category": group_name,
                "source": "r5",
                "field": field,
            })

            ids.append(
                f"{session_id}_r5_{document_counter}"
            )

            document_counter += 1


    return documents, metadatas, ids


# ============================================================
# CREATE RAG SESSION
# ============================================================


def create_rag_session(
    session_id: str,
    r21: Any,
    r5: Any,
):
    """
    Create a vector collection for one AreaLens session.

    Flow:

        r21 + r5
             ↓
        meaningful documents
             ↓
        embeddings
             ↓
        Chroma collection
    """

    collection_name = _collection_name(
        session_id
    )


    # --------------------------------------------------------
    # Remove an old collection with the same session ID
    # --------------------------------------------------------

    try:

        chroma_client.delete_collection(
            name=collection_name
        )

    except Exception:

        pass


    # --------------------------------------------------------
    # Create new collection
    # --------------------------------------------------------

    collection = chroma_client.create_collection(
        name=collection_name,
        metadata={
            "session_id": session_id,
        },
    )


    # --------------------------------------------------------
    # Convert R21 into documents
    # --------------------------------------------------------

    (
        r21_documents,
        r21_metadatas,
        r21_ids,
    ) = _build_r21_documents(
        r21,
        session_id,
    )


    # --------------------------------------------------------
    # Convert R5 into documents
    # --------------------------------------------------------

    (
        r5_documents,
        r5_metadatas,
        r5_ids,
    ) = _build_r5_documents(
        r5,
        session_id,
    )


    # --------------------------------------------------------
    # Combine documents
    # --------------------------------------------------------

    documents = (
        r21_documents
        + r5_documents
    )

    metadatas = (
        r21_metadatas
        + r5_metadatas
    )

    ids = (
        r21_ids
        + r5_ids
    )


    # --------------------------------------------------------
    # Create embeddings
    # --------------------------------------------------------

    if documents:

        embeddings = embedding_model.encode(
            documents,
            normalize_embeddings=True,
        ).tolist()


        # ----------------------------------------------------
        # Store everything inside Chroma
        # ----------------------------------------------------

        collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )


    # --------------------------------------------------------
    # Register session
    # --------------------------------------------------------

    with session_lock:

        sessions[session_id] = {
            "collection_name": collection_name,
            "last_accessed": time.time(),
        }


    print(
        f"RAG session created: {session_id} "
        f"with {len(documents)} documents"
    )


    return {
        "success": True,
        "session_id": session_id,
        "documents_created": len(documents),
    }


# ============================================================
# GET SESSION COLLECTION
# ============================================================


def _get_session_collection(
    session_id: str,
):
    """
    Get the Chroma collection belonging to a session.

    Every successful access also refreshes the session timeout.
    """

    with session_lock:

        session = sessions.get(
            session_id
        )

        if session is None:

            return None

        # User accessed this session.
        # Refresh its inactivity timer.

        session["last_accessed"] = time.time()

        collection_name = session[
            "collection_name"
        ]


    try:

        return chroma_client.get_collection(
            name=collection_name
        )

    except Exception:

        return None


# ============================================================
# RETRIEVE DOCUMENTS
# ============================================================


def retrieve_documents(
    session_id: str,
    question: str,
    top_k: int = 5,
):
    """
    Perform semantic vector search for a question.

    Flow:

        question
            ↓
        embedding
            ↓
        Chroma similarity search
            ↓
        top_k relevant documents
    """

    collection = _get_session_collection(
        session_id
    )


    if collection is None:

        raise ValueError(
            "RAG session not found or expired."
        )


    # --------------------------------------------------------
    # Convert question into embedding
    # --------------------------------------------------------

    question_embedding = _create_embedding(
        question
    )


    # --------------------------------------------------------
    # Search Chroma
    # --------------------------------------------------------

    results = collection.query(
        query_embeddings=[
            question_embedding
        ],
        n_results=top_k,
    )


    documents = results.get(
        "documents",
        [[]],
    )[0]


    return documents


# ============================================================
# DELETE SESSION
# ============================================================


def delete_rag_session(
    session_id: str,
):
    """
    Delete the vector collection and session metadata.
    """

    with session_lock:

        session = sessions.pop(
            session_id,
            None,
        )


    if session is None:

        return False


    try:

        chroma_client.delete_collection(
            name=session["collection_name"]
        )

    except Exception as err:

        print(
            "Error deleting Chroma collection:",
            err,
        )


    print(
        f"RAG session deleted: {session_id}"
    )


    return True


# ============================================================
# CLEANUP EXPIRED SESSIONS
# ============================================================


def cleanup_expired_sessions():
    """
    Delete sessions that have been inactive for more than
    SESSION_TIMEOUT_SECONDS.
    """

    current_time = time.time()

    expired_sessions = []


    # --------------------------------------------------------
    # Find expired sessions
    # --------------------------------------------------------

    with session_lock:

        for session_id, session in sessions.items():

            last_accessed = session[
                "last_accessed"
            ]

            if (
                current_time - last_accessed
                > SESSION_TIMEOUT_SECONDS
            ):

                expired_sessions.append(
                    session_id
                )


    # --------------------------------------------------------
    # Delete expired sessions
    # --------------------------------------------------------

    for session_id in expired_sessions:

        delete_rag_session(
            session_id
        )


# ============================================================
# BACKGROUND CLEANUP LOOP
# ============================================================


def cleanup_loop():

    while True:

        try:

            cleanup_expired_sessions()

        except Exception as err:

            print(
                "RAG cleanup error:",
                err,
            )

        # Check once every minute.

        time.sleep(60)


def start_cleanup_thread():

    thread = threading.Thread(
        target=cleanup_loop,
        daemon=True,
    )

    thread.start()

    print(
        "RAG session cleanup thread started."
    )