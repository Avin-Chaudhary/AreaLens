const mongoose = require("mongoose");

const locSchema = new mongoose.Schema(
  {
    radius_m: {
      type: Number,
      required: true,
      enum: [2000, 5000, 10000],
    },

    bus_stops_count: { type: Number, required: true },
    metro_stations_count: { type: Number, required: true },

    railway_station_distance_km: { type: Number, required: true },
    airport_distance_km: { type: Number, required: true },

    hospitals_count: { type: Number, required: true },
    nearest_hospital_distance_km: { type: Number, required: true },

    banks_count: { type: Number, required: true },
    nearest_bank_distance_km: { type: Number, required: true },

    police_stations_count: { type: Number, required: true },
    nearest_police_station_distance_km: { type: Number, required: true },

    nearest_fire_station_distance_km: { type: Number, required: true },

    restaurants_count: { type: Number, required: true },
    gyms_count: { type: Number, required: true },
    parks_count: { type: Number, required: true },
    cinemas_count: { type: Number, required: true },
    shopping_places_count: { type: Number, required: true },

    aqi: { type: Number, required: true },
    temperature_c: { type: Number, required: true },
    humidity_percent: { type: Number, required: true },

    news_is_safe: { type: Number, enum: [-1, 0, 1], default: -1 },
    news_is_clean: { type: Number, enum: [-1, 0, 1], default: -1 },
    news_is_developing: { type: Number, enum: [-1, 0, 1], default: -1 },
    news_is_luxury: { type: Number, enum: [-1, 0, 1], default: -1 },
  },
  {
    timestamps: true,
  }
);

const locModel = mongoose.model("apiCallsData", locSchema);
module.exports = locModel;
