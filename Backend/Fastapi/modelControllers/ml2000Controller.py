import joblib
import math
import pandas as pd
from pathlib import Path

# Equivalent of __dirname
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "mlDataStarPrediction2000"

# ---------------- Transport ----------------
transport_scaler = joblib.load(DATA_DIR / "transport_scaler.joblib")
transport_kmeans = joblib.load(DATA_DIR / "transport_kmeans.joblib")
cluster_to_star = joblib.load(DATA_DIR / "transport_cluster_to_star.joblib")

# ---------------- Basics ----------------
basics_scaler = joblib.load(DATA_DIR / "basics_scaler.joblib")
basics_kmeans = joblib.load(DATA_DIR / "basics_kmeans.joblib")
basics_cluster_to_star = joblib.load(DATA_DIR / "basics_cluster_to_star.joblib")

# ---------------- Comfort ----------------
comfort_scaler = joblib.load(DATA_DIR / "comfort_scaler.joblib")
comfort_kmeans = joblib.load(DATA_DIR / "comfort_kmeans.joblib")
comfort_cluster_to_star = joblib.load(DATA_DIR / "comfort_cluster_to_star.joblib")

# ---------------- Environment ----------------
environment_scaler = joblib.load(DATA_DIR / "environment_scaler.joblib")
environment_kmeans = joblib.load(DATA_DIR / "environment_kmeans.joblib")
environment_cluster_to_star = joblib.load(DATA_DIR / "environment_cluster_to_star.joblib")



def predict_transport_stars(x_transport_row):
    TRANSPORT_FEATURES = [
        "bus_stops_count",
        "metro_stations_count",
        "railway_station_distance_km",
        "airport_distance_km"
    ]
    """
    predict_transport_stars([30, 5, -15, -40])
    x_transport_row: list like [30, 5, -15, -40]
    Returns: stars (1–5)
    """

    # convert to DataFrame with correct feature names
    X_df = pd.DataFrame(
        [x_transport_row],
        columns=TRANSPORT_FEATURES
    )

    # scale
    X_scaled = transport_scaler.transform(X_df)

    # predict cluster
    cluster = transport_kmeans.predict(X_scaled)[0]

    # map to stars
    stars = cluster_to_star[cluster]

    return stars


def predict_basics_stars(x_basics_row):
    BASICS_FEATURES = [
        "hospitals_count",
        "nearest_hospital_distance_km",
        "banks_count",
        "nearest_bank_distance_km",
        "police_stations_count",
        "nearest_police_station_distance_km",
        "nearest_fire_station_distance_km"
    ]
    """
    x_basics_row: list
    Example:
    [
      hospitals_count,
      -nearest_hospital_distance_km,
      banks_count,
      -nearest_bank_distance_km,
      police_stations_count,
      -nearest_police_station_distance_km,
      -nearest_fire_station_distance_km
    ]

    Returns: int (1–5 stars)
    """

    # convert to DataFrame with correct feature names
    X_df = pd.DataFrame(
        [x_basics_row],
        columns=BASICS_FEATURES
    )

    # scale using trained scaler
    X_scaled = basics_scaler.transform(X_df)

    # predict cluster
    cluster = basics_kmeans.predict(X_scaled)[0]

    # map cluster to stars
    stars = basics_cluster_to_star[cluster]

    return stars

def predict_comfort_stars(x_comfort_row):
    COMFORT_FEATURES = [
        "restaurants_count",
        "gyms_count",
        "parks_count",
        "cinemas_count",
        "shopping_places_count"
    ]

    """
    x_comfort_row: list
    Example:
    [restaurants, gyms, parks, cinemas, shopping_places]

    Returns: int (1–5 stars)
    """

    # convert input to DataFrame with correct feature names
    X_df = pd.DataFrame(
        [x_comfort_row],
        columns=COMFORT_FEATURES
    )

    # scale using trained scaler
    X_scaled = comfort_scaler.transform(X_df)

    # predict cluster
    cluster = comfort_kmeans.predict(X_scaled)[0]

    # map cluster to stars
    stars = comfort_cluster_to_star[cluster]

    return stars


def predict_environment_stars(x_environment_row):
    ENVIRONMENT_FEATURES = [
        "aqi",
        "temperature_c",
        "humidity_percent"
    ]
    """
    x_environment_row: list
    Example:
    [
      -aqi,              # NEGATED (1 best → -1, 5 worst → -5)
      temperature_c,
      humidity_percent
    ]

    Returns: int (1–5 stars)
    """

    # convert input to DataFrame with correct feature names
    X_df = pd.DataFrame(
        [x_environment_row],
        columns=ENVIRONMENT_FEATURES
    )

    # scale using trained scaler
    X_scaled = environment_scaler.transform(X_df)

    # predict cluster
    cluster = environment_kmeans.predict(X_scaled)[0]

    # map cluster to stars
    stars = environment_cluster_to_star[cluster]

    return stars


def getStarsValue2000(clean_data):
    transport_list = [clean_data["bus_stops_count"],clean_data["metro_stations_count"],clean_data["railway_station_distance_km"],clean_data["airport_distance_km"]]
    transport_stars = predict_transport_stars(transport_list)

    basics_list = [clean_data["hospitals_count"],clean_data["nearest_hospital_distance_km"],clean_data["banks_count"],clean_data["nearest_bank_distance_km"],clean_data["police_stations_count"],clean_data["nearest_police_station_distance_km"],clean_data["nearest_fire_station_distance_km"]]
    basics_stars = predict_basics_stars(basics_list)

    comfort_list = [clean_data["restaurants_count"],clean_data["gyms_count"],clean_data["parks_count"],clean_data["cinemas_count"],clean_data["shopping_places_count"]]
    comfort_stars = predict_comfort_stars(comfort_list)

    environment_list = [clean_data["aqi"],clean_data["temperature_c"],clean_data["humidity_percent"]]
    environment_stars = predict_environment_stars(environment_list)

    return {
        "transport":transport_stars,
        "basics":basics_stars,
        "comfort":comfort_stars,
        "environment":environment_stars
    }