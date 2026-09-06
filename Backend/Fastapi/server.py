from fastapi import FastAPI
from pydantic import BaseModel
import joblib
from typing import Optional
from typing import List
import math
import pandas as pd
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL")
    ],
    allow_credentials=True,               # 🔴 REQUIRED
    allow_methods=["*"],
    allow_headers=["*"],
)

# news model part starts

from mlNews.model_use_function import predict_news

class NewsInput(BaseModel):
    news: List[str]

@app.post("/predictnews")
def predict(data: NewsInput):
    return predict_news(data.news)

@app.get("/health")
def health():
    return {"status": "ok"}

#news model part ends


#stars model part starts here

from modelControllers.ml2000Controller import getStarsValue2000
from modelControllers.ml5000Controller import getStarsValue5000
from modelControllers.ml10000Controller import getStarsValue10000


def _is_infinite(val):
    """Helper to detect infinity coming from Node in any form."""
    if val is None:
        return True
    if isinstance(val, (int, float)) and math.isinf(val):
        return True
    if isinstance(val, str) and val.lower() in ("inf", "infinity", "+inf", "-inf"):
        return True
    return False


def preprocess_payload(data: dict) -> dict:
    INF_REPLACEMENT_DISTANCES = {
        "railway_station_distance_km": 25,
        "airport_distance_km": 150,
        "nearest_hospital_distance_km": 8,
        "nearest_bank_distance_km": 5,
        "nearest_police_station_distance_km": 10,
        "nearest_fire_station_distance_km": 10
    }

    TEMP_OPT = 26.0
    HUMIDITY_OPT = 50.0

    cleaned = dict(data)

    for col, max_val in INF_REPLACEMENT_DISTANCES.items():
        if col in cleaned:
            val = cleaned[col]

            if _is_infinite(val):
                val = max_val
            else:
                try:
                    val = float(val)
                except Exception:
                    val = max_val

            cleaned[col] = -val

    if "aqi" in cleaned and cleaned["aqi"] is not None:
        try:
            cleaned["aqi"] = -float(cleaned["aqi"])
        except Exception:
            pass

    if "temperature_c" in cleaned and cleaned["temperature_c"] is not None:
        try:
            cleaned["temperature_c"] = -abs(
                float(cleaned["temperature_c"]) - TEMP_OPT
            )
        except Exception:
            pass

    if "humidity_percent" in cleaned and cleaned["humidity_percent"] is not None:
        try:
            cleaned["humidity_percent"] = -abs(
                float(cleaned["humidity_percent"]) - HUMIDITY_OPT
            )
        except Exception:
            pass

    return cleaned


def _is_valid(val):
    if val is None:
        return False
    if isinstance(val, (int, float)) and math.isinf(val):
        return False
    return True


def generate_area_description(data: dict) -> dict:
    def valid(v):
        return v is not None and v != -1

    radius_m = data.get("radius_m")
    radius_km = radius_m / 1000 if valid(radius_m) else None

    # =========================
    # 1️⃣ Transport & Connectivity
    # =========================
    transport = []

    if valid(data.get("bus_stops_count")):
        transport.append(f"{data['bus_stops_count']} bus stops")

    if valid(data.get("metro_stations_count")):
        transport.append(f"{data['metro_stations_count']} metro station(s)")

    if transport:
        prefix = (
            f"Within a {radius_km:.0f} km radius, the area offers access to "
            if radius_km else
            "The area offers access to "
        )
        transport_desc = prefix + " and ".join(transport) + "."
    else:
        transport_desc = ""

    if valid(data.get("railway_station_distance_km")):
        transport_desc += (
            f" The nearest railway station is approximately "
            f"{data['railway_station_distance_km']:.2f} km away."
        )

    if valid(data.get("airport_distance_km")):
        transport_desc += (
            f" The nearest airport is about "
            f"{data['airport_distance_km']:.0f} km from the location."
        )

    # =========================
    # 2️⃣ Basics / Essentials
    # =========================
    basics = []

    if valid(data.get("hospitals_count")):
        basics.append(f"{data['hospitals_count']} hospitals")

    if valid(data.get("banks_count")):
        basics.append(f"{data['banks_count']} banks")

    if valid(data.get("police_stations_count")):
        basics.append(f"{data['police_stations_count']} police stations")

    if basics:
        prefix = (
            f"Essential services within the {radius_km:.0f} km area include "
            if radius_km else
            "Essential services in the area include "
        )
        basics_desc = prefix + ", ".join(basics) + "."
    else:
        basics_desc = ""

    if valid(data.get("nearest_hospital_distance_km")):
        basics_desc += (
            f" The nearest hospital is roughly "
            f"{data['nearest_hospital_distance_km']:.2f} km away."
        )

    if valid(data.get("nearest_bank_distance_km")):
        basics_desc += (
            f" The closest bank is about "
            f"{data['nearest_bank_distance_km']:.2f} km away."
        )

    if valid(data.get("nearest_fire_station_distance_km")):
        basics_desc += (
            f" Fire emergency services are available with the nearest station "
            f"approximately {data['nearest_fire_station_distance_km']:.2f} km away."
        )

    # =========================
    # 3️⃣ Lifestyle & Comfort
    # =========================
    comfort_items = []

    if valid(data.get("restaurants_count")):
        comfort_items.append(f"{data['restaurants_count']} restaurants")
    if valid(data.get("parks_count")):
        comfort_items.append(f"{data['parks_count']} parks")
    if valid(data.get("gyms_count")):
        comfort_items.append(f"{data['gyms_count']} gyms")
    if valid(data.get("cinemas_count")):
        comfort_items.append(f"{data['cinemas_count']} cinemas")
    if valid(data.get("shopping_places_count")):
        comfort_items.append(f"{data['shopping_places_count']} shopping destinations")

    if comfort_items:
        prefix = (
            f"Within the {radius_km:.0f} km radius, residents can enjoy "
            if radius_km else
            "Residents can enjoy "
        )
        comfort_desc = prefix + ", ".join(comfort_items[:-1]) + (
            " and " + comfort_items[-1] if len(comfort_items) > 1 else comfort_items[0]
        ) + "."
    else:
        comfort_desc = ""

    # =========================
    # 4️⃣ Environment & Climate
    # =========================
    environment = []

    if valid(data.get("aqi")):
        if data["aqi"] <= 2:
            environment.append("Air quality in the area is generally good.")
        elif data["aqi"] == 3:
            environment.append("Air quality levels are moderate.")
        else:
            environment.append("The area experiences relatively poor air quality.")

    if valid(data.get("temperature_c")) and valid(data.get("humidity_percent")):
        environment.append(
            f"The local climate typically sees temperatures around "
            f"{data['temperature_c']:.1f}°C with humidity near "
            f"{data['humidity_percent']:.0f}%."
        )

    environment_desc = " ".join(environment)

    # =========================
    # 5️⃣ News-based Perception (Blended)
    # =========================
    news_sentences = []

    if data.get("news_is_safe") == 1:
        news_sentences.append(
            "Recent news coverage generally portrays the area as safe and stable."
        )
    elif data.get("news_is_safe") == 0:
        news_sentences.append(
            "Some recent news reports raise concerns related to safety in the area."
        )

    if data.get("news_is_clean") == 1:
        news_sentences.append(
            "Cleanliness and civic maintenance have been highlighted positively in news reports."
        )
    elif data.get("news_is_clean") == 0:
        news_sentences.append(
            "There are occasional news mentions of cleanliness-related challenges."
        )

    if data.get("news_is_developing") == 1:
        news_sentences.append(
            "Ongoing infrastructure and development activities are frequently mentioned in recent news."
        )

    if data.get("news_is_luxury") == 1:
        news_sentences.append(
            "The locality is increasingly being described as a premium or upscale area."
        )

    if news_sentences:
        news_desc = " ".join(news_sentences)
    else:
        news_desc = (
            "There is currently limited or neutral news coverage that significantly "
            "influences the overall perception of the area."
        )

    # =========================
    # FINAL RETURN
    # =========================
    return {
        "transport": transport_desc.strip(),
        "basics": basics_desc.strip(),
        "comfort": comfort_desc.strip(),
        "environment": environment_desc.strip(),
        "news": news_desc.strip(),
    }


class RequestInput(BaseModel):
    radius_m: Optional[int] = None
    bus_stops_count: Optional[int] = None
    metro_stations_count: Optional[int] = None
    railway_station_distance_km: Optional[float] = None
    airport_distance_km: Optional[float] = None
    hospitals_count: Optional[int] = None
    nearest_hospital_distance_km: Optional[float] = None
    banks_count: Optional[int] = None
    nearest_bank_distance_km: Optional[float] = None
    police_stations_count: Optional[int] = None
    nearest_police_station_distance_km: Optional[float] = None
    nearest_fire_station_distance_km: Optional[float] = None
    restaurants_count: Optional[int] = None
    gyms_count: Optional[int] = None
    parks_count: Optional[int] = None
    cinemas_count: Optional[int] = None
    shopping_places_count: Optional[int] = None
    aqi: Optional[int] = None
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    news_is_safe: Optional[int] = None        # 1 / 0 / -1
    news_is_clean: Optional[int] = None       # 1 / 0 / -1
    news_is_developing: Optional[int] = None  # 1 / 0 / -1
    news_is_luxury: Optional[int] = None      # 1 / 0 / -1


@app.post("/get-place-stars")
def get_stars_data(payload: RequestInput):
    data = payload.dict()
    description = generate_area_description(data)
    clean_data = preprocess_payload(data)

    stars = {
        "transport": -1,
        "basics": -1,
        "comfort": -1,
        "environment": -1
    }

    if payload.radius_m == 2000:
        stars = getStarsValue2000(clean_data)
    elif payload.radius_m == 5000:
        stars = getStarsValue5000(clean_data)
    elif payload.radius_m == 10000:
        stars = getStarsValue10000(clean_data)

    return {
        "ratings": stars,
        "overallDescription": description
    }