import os
import json
import joblib
import requests
from typing import List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "news_model.joblib")

# -----------------------------
# Load old ML model
# -----------------------------
models = joblib.load(MODEL_PATH)

BINARY_LABELS = {"is_safe", "is_clean"}
PRESENCE_ONLY_LABELS = {"is_luxury", "is_developing"}

THRESHOLDS = {
    "is_safe": (0.20, 0.5),
    "is_clean": (0.20, 0.5),
    "is_luxury": (0.20, None),
    "is_developing": (0.20, None)
}

# -----------------------------
# Environment configuration
# -----------------------------
LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL")
LOCAL_MODELS_URL = os.getenv("LOCAL_MODELS_URL")
LOCAL_LLM_MODEL = os.getenv("LOCAL_LLM_MODEL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = os.getenv("GEMINI_URL")

# ============================================================
# MAIN ROUTER
# ============================================================
def predict_news(*news_list: List[str]):
    if is_local_model_running():
        print("Using Local LLM")
        return predict_news_local(news_list)
    elif is_online_model_available():
        print("Using Online LLM")
        return predict_news_online(news_list)
    else:
        print("Using Legacy ML Model")
        return predict_news_ml(news_list)

# ============================================================
# CHECK LOCAL MODEL
# ============================================================
def is_local_model_running():
    try:
        response = requests.get(LOCAL_MODELS_URL, timeout=2)
        return response.status_code == 200
    except Exception:
        return False

# ============================================================
# CHECK ONLINE MODEL
# ============================================================
def is_online_model_available():
    return bool(GEMINI_API_KEY)

# ============================================================
# LOCAL LLM
# ============================================================
def predict_news_local(*news_list: List[str]):
    headlines = "\n".join(f"- {x}" for x in news_list)
    prompt = f"""
You are AreaLens AI.

Analyze the locality based on ALL news headlines.

Do NOT summarize each headline.

Infer the overall locality.

Return ONLY JSON.

Format:

{{
    "is_safe":1,
    "is_clean":0,
    "is_luxury":1,
    "is_developing":1,
    "summary":"..."
}}

News:

{headlines}
"""
    payload = {
        "model": LOCAL_LLM_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "Return only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.1,
        "max_tokens": 500
    }
    response = requests.post(
        LOCAL_LLM_URL,
        json=payload,
        timeout=60
    )
    response.raise_for_status()
    result = response.json()
    content = result["choices"][0]["message"]["content"].strip()

    # Remove ```json if model returns it
    if content.startswith("```"):
        lines = content.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        content = "\n".join(lines)
    return json.loads(content)

# ============================================================
# ONLINE LLM (GEMINI)
# ============================================================
def predict_news_online(*news_list):
    return predict_news_gemini(news_list)

def predict_news_gemini(*news_list):
    headlines = "\n".join(f"- {x}" for x in news_list)
    prompt = f"""
You are AreaLens AI.

Analyze the locality based on ALL news headlines.

Do NOT summarize each headline.

Infer the overall locality.

Aim for 5-6 lines summary output that covers most news whether positive or negative.

Return ONLY valid JSON.

Format:

{{
    "is_safe":1,
    "is_clean":0,
    "is_luxury":1,
    "is_developing":1,
    "summary":"..."
}}

News Headlines:

{headlines}
"""
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 500,
            "responseMimeType": "application/json"
        }
    }
    response = requests.post(
        f"{GEMINI_URL}?key={GEMINI_API_KEY}",
        json=payload,
        timeout=60
    )
    response.raise_for_status()
    result = response.json()
    content = result["candidates"][0]["content"]["parts"][0]["text"].strip()

    if content.startswith("```"):
        lines = content.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        content = "\n".join(lines)
    return json.loads(content)

# ============================================================
# OLD ML MODEL
# ============================================================
def predict_news_ml(*news_list: List[str]):
    aggregate = {
        "is_safe": [],
        "is_clean": [],
        "is_luxury": [],
        "is_developing": []
    }
    for headline in news_list:
        for label, model in models.items():
            proba = float(model.predict_proba([headline])[0][1])
            high, low = THRESHOLDS[label]
            if label in BINARY_LABELS:
                if proba >= high:
                    value = 1
                elif proba <= low:
                    value = 0
                else:
                    value = -1
            else:
                value = 1 if proba >= high else -1
            aggregate[label].append(value)
    result = {}
    for label, values in aggregate.items():
        if 1 in values:
            result[label] = 1
        elif 0 in values:
            result[label] = 0
        else:
            result[label] = -1
    result["summary"] = ""
    return result