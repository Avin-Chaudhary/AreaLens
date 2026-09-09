const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const Tdata = require("./../models/locModel");
const Parser = require("rss-parser");

const airportPath = `${__dirname}/../airportData/india_airports.json`;

function extractNewsPlace(data) {
  if (!data?.address) return "";

  const a = data.address;

  const smallLocalityBlacklist = [
    "sector",
    "phase",
    "block",
    "colony",
    "extension",
    "layout",
  ];

  const isWeak = (name) =>
    !name ||
    name.length < 4 ||
    smallLocalityBlacklist.some((w) => name.toLowerCase().includes(w));

  const locality = a.suburb || a.neighbourhood || a.village || "";

  const city =
    a.city || a.town || a.municipality || a.county || a.state_district || "";

  const state = a.state || "";

  const result = [];

  // Add locality only if meaningful
  if (!isWeak(locality)) {
    result.push(locality);
  }

  // Always try to add city
  if (city && !result.includes(city)) {
    result.push(city);
  }

  // Add state only if city is missing/weak
  if (isWeak(city) && state) {
    result.push(state);
  }

  return result.join(" ");
}

exports.getAreaName = async (lat, lon) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        // REQUIRED by OpenStreetMap Nominatim
        "User-Agent": "AreaLens/1.0 (arealens.api@gmail.com)",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    // If API sends HTML or error page
    if (!res.ok) {
      const text = await res.text();
      console.error("getAreaName HTTP error:", res.status, text);
      return null;
    }

    const data = await res.json();

    return extractNewsPlace(data);
  } catch (err) {
    console.error("getAreaName failed:", err.message);
    return null; // fail gracefully
  }
};

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  // "https://overpass.kumi.systems/api/interpreter",
  // "https://overpass.nchc.org.tw/api/interpreter",
  // "https://overpass.openstreetmap.ru/api/interpreter",
];

function pickOverpassServer() {
  return OVERPASS_SERVERS[Math.floor(Math.random() * OVERPASS_SERVERS.length)];
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Overpass returned non-JSON response");
  }
}

/*
async function fetchOverpass(query) {
  const server = pickOverpassServer();
  console.log("Using Overpass:", server);

  const res = await fetch(server, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });

  if (!res.ok) {
    const body = await res.text();

    console.log("========== OVERPASS ERROR ==========");
    console.log("Server:", server);
    console.log("Status:", res.status);
    console.log("Body:", body);
    console.log("====================================");

    throw new Error("OVERPASS_HTTP_FAILED");
  }

  return safeJson(res);
}
*/

async function fetchOverpass(query) {
  const server = pickOverpassServer();

  console.log("Using:", server);

  try {
    /*
    const res = await fetch(server, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
    });
    */

    const res = await fetch(server, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "AreaLens/1.0 (arealens.api@gmail.com)",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      console.log("Status:", res.status);
      console.log(await res.text());
      throw new Error("OVERPASS_HTTP_FAILED");
    }

    return safeJson(res);
  } catch (err) {
    console.error("Fetch failed:", err);
    throw err;
  }
}

async function fetchOverpassStrict(query, retries = 3) {
  let lastErr;

  for (let i = 1; i <= retries; i++) {
    try {
      return await fetchOverpass(query);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  throw lastErr;
}

function buildQueries(lat, lon, dist) {
  return [
    `[out:json][timeout:45];
    (
      node["amenity"="restaurant"](around:${dist},${lat},${lon});
      node["leisure"="fitness_centre"](around:${dist},${lat},${lon});
      node["amenity"="cinema"](around:${dist},${lat},${lon});
      node["amenity"="bank"](around:${dist},${lat},${lon});
      node["amenity"="police"](around:${dist},${lat},${lon});
      node["amenity"="fire_station"](around:${dist},${lat},${lon});
      way["leisure"="park"](around:${dist},${lat},${lon});
      way["shop"="mall"](around:${dist},${lat},${lon});
      way["amenity"="hospital"](around:${dist},${lat},${lon});
      node["highway"="bus_stop"](around:${dist},${lat},${lon});
      node["railway"="subway_entrance"](around:${dist},${lat},${lon});
      node["railway"="station"](around:${dist},${lat},${lon});
      way["railway"="station"](around:${dist},${lat},${lon});
    );
    out center tags;`,
  ];
}

async function getMinRailwayDistanceKm(
  lat,
  lon,
  startDistance,
  stepKm,
  maxDist,
  retries,
) {
  let currentDist = startDistance + stepKm;

  while (currentDist <= maxDist) {
    let attempt = 0;

    while (attempt < retries) {
      try {
        const query = `
          [out:json][timeout:25];
          node["railway"="station"](around:${currentDist},${lat},${lon});
          way["railway"="station"](around:${currentDist},${lat},${lon});
          out center 1;
        `;

        const res = await fetchOverpassStrict(query, 1);
        const el = res?.elements?.[0];

        if (el) {
          const elLat = el.center?.lat;
          const elLon = el.center?.lon;

          if (elLat != null && elLon != null) {
            return getDistanceKm(lat, lon, elLat, elLon);
          }
        }

        break;
      } catch (e) {
        attempt++;
        if (attempt >= retries) break;
      }
    }

    currentDist += stepKm;
  }

  return Infinity;
}

exports.getCollectedDataOverpass = async (lat, lon, dist, retries = 3) => {
  const allElements = [];

  try {
    const queries = buildQueries(lat, lon, dist);

    for (const query of queries) {
      const res = await fetchOverpassStrict(query, retries);
      allElements.push(...(res.elements || []));
    }

    // Try to get railway distance from INITIAL fetch
    let minRailwayDistance = Infinity;

    for (const el of allElements) {
      if (el.tags?.railway === "station") {
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;

        if (elLat != null && elLon != null) {
          const d = getDistanceKm(lat, lon, elLat, elLon);
          if (d < minRailwayDistance) {
            minRailwayDistance = d;
          }
        }
      }
    }

    // If NOT found → use expanding-radius logic
    if (minRailwayDistance === Infinity) {
      minRailwayDistance = await getMinRailwayDistanceKm(
        lat,
        lon,
        dist, // startDistance
        4000, // stepKm
        45000, // maxDist
        2,
      );
    }

    return {
      elements: allElements,
      railway_station_distance_km: minRailwayDistance,
    };
  } catch (err) {
    console.error(err);
    throw new Error("OVERPASS_INCOMPLETE_DATA");
  }
};

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getNearestAirportDistanceKm(lat, lon, jsonFilePath) {
  const airports = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

  let minDistance = Infinity;

  for (const airport of airports) {
    const d = getDistanceKm(lat, lon, airport.lat, airport.lon);

    if (d < minDistance) {
      minDistance = d;
    }
  }

  return minDistance === Infinity ? null : minDistance;
}

exports.processDataOverpass = async (latC, lonC, data_raw) => {
  const output = {
    bus_stops_count: 0,
    metro_stations_count: 0,

    railway_station_distance_km: Infinity,
    airport_distance_km: Infinity,

    hospitals_count: 0,
    nearest_hospital_distance_km: Infinity,

    banks_count: 0,
    nearest_bank_distance_km: Infinity,

    police_stations_count: 0,
    nearest_police_station_distance_km: Infinity,

    nearest_fire_station_distance_km: Infinity,

    restaurants_count: 0,
    gyms_count: 0,
    parks_count: 0,
    cinemas_count: 0,
    shopping_places_count: 0,

    aqi: -1,
    temperature_c: -1,
    humidity_percent: -1,

    news_is_safe: -1,
    news_is_clean: -1,
    news_is_developing: -1,
    news_is_luxury: -1,
  };

  const data = data_raw.elements;
  output.railway_station_distance_km = data_raw.railway_station_distance_km;

  data.forEach((el) => {
    if (!el.tags) return;

    let latitude = null;
    let longitude = null;
    if (el.type === "node") {
      latitude = el.lat;
      longitude = el.lon;
    } else if (el.type === "way" || el.type == "relation") {
      latitude = el.center.lat;
      longitude = el.center.lon;
    }
    let dist = getDistanceKm(latC, lonC, latitude, longitude);
    const el1 = el.tags;

    switch (el1.amenity) {
      case "hospital": {
        output.hospitals_count++;
        if (dist < output.nearest_hospital_distance_km) {
          output.nearest_hospital_distance_km = dist;
        }
        break;
      }
      case "bank": {
        output.banks_count++;
        if (dist < output.nearest_bank_distance_km) {
          output.nearest_bank_distance_km = dist;
        }
        break;
      }
      case "police": {
        output.police_stations_count++;
        if (dist < output.nearest_police_station_distance_km) {
          output.nearest_police_station_distance_km = dist;
        }
        break;
      }
      case "fire_station": {
        if (dist < output.nearest_fire_station_distance_km) {
          output.nearest_fire_station_distance_km = dist;
        }
        break;
      }
      case "restaurant": {
        output.restaurants_count++;
        break;
      }
      case "cinema": {
        output.cinemas_count++;
        break;
      }
    }
    switch (el1.highway) {
      case "bus_stop": {
        output.bus_stops_count++;
        break;
      }
    }
    switch (el1.railway) {
      case "station": {
        if (dist < output.railway_station_distance_km) {
          output.railway_station_distance_km = dist;
        }
        break;
      }
      case "subway_entrance": {
        output.metro_stations_count++;
        break;
      }
    }
    switch (el1.aeroway) {
      case "aerodrome": {
        if (dist < output.airport_distance_km) {
          output.airport_distance_km = dist;
        }
        break;
      }
    }
    switch (el1.leisure) {
      case "fitness_centre": {
        output.gyms_count++;
        break;
      }
      case "park": {
        output.parks_count++;
        break;
      }
    }
    switch (el1.shop) {
      case "mall": {
        output.shopping_places_count++;
        break;
      }
    }
  });
  output.airport_distance_km = getNearestAirportDistanceKm(
    latC,
    lonC,
    airportPath,
  );
  return output;
};

exports.processDataOverpassForChatbot = async (latC, lonC, data_raw) => {
  try {
    const elements = data_raw?.elements || [];

    // ---------------------------------------------------------
    // CONFIG
    // ---------------------------------------------------------

    // Maximum number of places retained for each category.
    // We keep the nearest ones because they are usually most
    // useful for answering location-based questions.
    const MAX_PER_CATEGORY = 30;

    // Maximum total places in chatbot context.
    // Prevents a huge 10 km query from exploding the prompt.
    const MAX_TOTAL_PLACES = 200;

    // ---------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------

    const getCoordinates = (el) => {
      if (el?.type === "node") {
        return {
          lat: el.lat ?? null,
          lon: el.lon ?? null,
        };
      }

      if ((el?.type === "way" || el?.type === "relation") && el.center) {
        return {
          lat: el.center.lat ?? null,
          lon: el.center.lon ?? null,
        };
      }

      return {
        lat: null,
        lon: null,
      };
    };

    const cleanString = (value) => {
      if (typeof value !== "string") return null;

      const cleaned = value.trim();

      return cleaned.length > 0 ? cleaned : null;
    };

    const getCategory = (tags) => {
      if (!tags) return "other";

      if (tags.amenity === "hospital") return "hospital";
      if (tags.amenity === "bank") return "bank";
      if (tags.amenity === "police") return "police_station";
      if (tags.amenity === "fire_station") return "fire_station";
      if (tags.amenity === "restaurant") return "restaurant";
      if (tags.amenity === "cinema") return "cinema";

      if (tags.highway === "bus_stop") return "bus_stop";

      if (tags.railway === "station") return "railway_station";
      if (tags.railway === "subway_entrance") return "metro_entrance";

      if (tags.aeroway === "aerodrome") return "airport";

      if (tags.leisure === "fitness_centre") return "gym";
      if (tags.leisure === "park") return "park";

      if (tags.shop === "mall") return "mall";

      return "other";
    };

    // Only retain information that can realistically help
    // the chatbot answer questions.
    const extractUsefulInfo = (tags) => {
      const useful = {};

      const fields = [
        "name",
        "brand",
        "operator",

        // Food
        "cuisine",

        // Address
        "addr:housenumber",
        "addr:street",
        "addr:suburb",
        "addr:neighbourhood",
        "addr:city",
        "addr:postcode",

        // Useful practical information
        "opening_hours",
        "phone",
        "website",
        "wheelchair",
      ];

      for (const field of fields) {
        const value = cleanString(tags?.[field]);

        if (value !== null) {
          useful[field] = value;
        }
      }

      return useful;
    };

    const makeAddress = (tags) => {
      if (!tags) return null;

      const parts = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:neighbourhood"],
        tags["addr:suburb"],
        tags["addr:city"],
        tags["addr:postcode"],
      ]
        .map(cleanString)
        .filter(Boolean);

      return parts.length > 0 ? parts.join(", ") : null;
    };

    // ---------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------

    const summary = {
      hospitals: 0,
      banks: 0,
      police_stations: 0,
      fire_stations: 0,

      restaurants: 0,
      cinemas: 0,
      gyms: 0,
      parks: 0,
      shopping_malls: 0,

      bus_stops: 0,
      metro_entrances: 0,
      railway_stations: 0,

      airports: 0,
    };

    // ---------------------------------------------------------
    // PROCESS ELEMENTS
    // ---------------------------------------------------------

    const places = [];

    // Prevent duplicate OSM elements.
    const seen = new Set();

    for (const el of elements) {
      if (!el?.tags) continue;

      const coords = getCoordinates(el);

      if (coords.lat == null || coords.lon == null) {
        continue;
      }

      const tags = el.tags;

      const category = getCategory(tags);

      // Ignore anything outside the categories we explicitly
      // requested from Overpass.
      if (category === "other") {
        continue;
      }

      // Count every valid place.
      switch (category) {
        case "hospital":
          summary.hospitals++;
          break;

        case "bank":
          summary.banks++;
          break;

        case "police_station":
          summary.police_stations++;
          break;

        case "fire_station":
          summary.fire_stations++;
          break;

        case "restaurant":
          summary.restaurants++;
          break;

        case "cinema":
          summary.cinemas++;
          break;

        case "gym":
          summary.gyms++;
          break;

        case "park":
          summary.parks++;
          break;

        case "mall":
          summary.shopping_malls++;
          break;

        case "bus_stop":
          summary.bus_stops++;
          break;

        case "metro_entrance":
          summary.metro_entrances++;
          break;

        case "railway_station":
          summary.railway_stations++;
          break;

        case "airport":
          summary.airports++;
          break;
      }

      // Deduplicate.
      const uniqueId = `${el.type}:${el.id}`;

      if (seen.has(uniqueId)) {
        continue;
      }

      seen.add(uniqueId);

      const distance_km = getDistanceKm(latC, lonC, coords.lat, coords.lon);

      const usefulInfo = extractUsefulInfo(tags);

      // Places without names are usually not useful to an LLM
      // for questions like "which hospital?".
      //
      // BUT counts are already preserved in summary above.
      if (!usefulInfo.name) {
        continue;
      }

      places.push({
        category,
        name: usefulInfo.name,

        distance_km: Number(distance_km.toFixed(3)),

        latitude: Number(coords.lat.toFixed(6)),
        longitude: Number(coords.lon.toFixed(6)),

        ...(usefulInfo.brand && {
          brand: usefulInfo.brand,
        }),

        ...(usefulInfo.operator && {
          operator: usefulInfo.operator,
        }),

        ...(usefulInfo.cuisine && {
          cuisine: usefulInfo.cuisine,
        }),

        ...(makeAddress(tags) && {
          address: makeAddress(tags),
        }),

        ...(usefulInfo.opening_hours && {
          opening_hours: usefulInfo.opening_hours,
        }),

        ...(usefulInfo.phone && {
          phone: usefulInfo.phone,
        }),

        ...(usefulInfo.website && {
          website: usefulInfo.website,
        }),

        ...(usefulInfo.wheelchair && {
          wheelchair: usefulInfo.wheelchair,
        }),
      });
    }

    // ---------------------------------------------------------
    // SORT BY DISTANCE
    // ---------------------------------------------------------

    places.sort((a, b) => a.distance_km - b.distance_km);

    // ---------------------------------------------------------
    // KEEP NEAREST N PLACES PER CATEGORY
    // ---------------------------------------------------------

    const categoryCount = {};

    const selectedPlaces = [];

    for (const place of places) {
      const count = categoryCount[place.category] || 0;

      if (count >= MAX_PER_CATEGORY) {
        continue;
      }

      if (selectedPlaces.length >= MAX_TOTAL_PLACES) {
        break;
      }

      selectedPlaces.push(place);

      categoryCount[place.category] = count + 1;
    }

    // ---------------------------------------------------------
    // GROUP PLACES BY CATEGORY
    // ---------------------------------------------------------

    const placesByCategory = {};

    for (const place of selectedPlaces) {
      if (!placesByCategory[place.category]) {
        placesByCategory[place.category] = [];
      }

      placesByCategory[place.category].push(place);
    }

    // ---------------------------------------------------------
    // IMPORTANT DISTANCES
    // ---------------------------------------------------------

    const railwayDistance = data_raw?.railway_station_distance_km;

    const airportDistance = getNearestAirportDistanceKm(
      latC,
      lonC,
      airportPath,
    );

    // ---------------------------------------------------------
    // FINAL CHATBOT DATA
    // ---------------------------------------------------------

    return {
      location: {
        latitude: latC,
        longitude: lonC,
      },

      summary,

      important_distances: {
        nearest_railway_station_km: Number.isFinite(railwayDistance)
          ? Number(railwayDistance.toFixed(3))
          : null,

        nearest_airport_km: Number.isFinite(airportDistance)
          ? Number(airportDistance.toFixed(3))
          : null,
      },

      places: placesByCategory,

      metadata: {
        total_osm_elements_received: elements.length,

        total_named_places_available: places.length,

        total_places_included: selectedPlaces.length,

        max_places_per_category: MAX_PER_CATEGORY,

        max_total_places: MAX_TOTAL_PLACES,
      },
    };
  } catch (err) {
    console.error("processDataOverpassForChatbot error:", err.message);

    // IMPORTANT:
    // Never allow chatbot preprocessing to break the main
    // AreaLens pipeline.
    return {
      location: {
        latitude: latC,
        longitude: lonC,
      },

      summary: {},

      important_distances: {
        nearest_railway_station_km: null,
        nearest_airport_km: null,
      },

      places: {},

      metadata: {
        error: "Chatbot data preprocessing failed",
      },
    };
  }
};

exports.getCollectedDataAndProcessOwm = async (lat, lon, data) => {
  const r1 = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.OWM_KEY}`,
  );
  const r2 = await r1.json();
  if (r2.list) {
    data.aqi = r2.list[0].main.aqi;
  } else {
    data.aqi = -1;
  }

  const r3 = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OWM_KEY}`,
  );
  const r4 = await r3.json();
  if (r4.main) {
    data.temperature_c = r4.main.temp;
    data.humidity_percent = r4.main.humidity;
  } else {
    data.temperature_c = -1;
    data.humidity_percent = -1;
  }

  return data;
};

function normalizeLabel(val) {
  if (val > 0) return 1;
  if (val < 0) return 0;
  return -1;
}

exports.fitTdata = async (data) => {
  try {
    const newdata = await Tdata.create(data);
    return newdata;
  } catch (err) {
    return { problem: "data not saved in database" };
  }
};

exports.getStarRatingsDescription = async (data) => {
  try {
    const r1 = await fetch(`${process.env.FASTAPI_PY_URL}/get-place-stars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!r1.ok) {
      throw new Error(`ML API error: ${r1.status}`);
    }

    return await r1.json();
  } catch (err) {
    console.error("ML rating fetch failed:", err.message);
    throw new Error("Ratings could not be fetched from ML model");
  }
};

/*
exports.getNewsAndUpdateObject = async (area_name, data_obj) => {
  // ---------------- DEFAULTS ----------------
  data_obj.news_is_safe = -1;
  data_obj.news_is_clean = -1;
  data_obj.news_is_luxury = -1;
  data_obj.news_is_developing = -1;

  const Parser = require("rss-parser");
  const parser = new Parser({ timeout: 2000 });

  const normalize = (v) => (v > 0 ? 1 : v < 0 ? 0 : -1);

  const sanitize = (txt) =>
    txt
      .replace(/\s-\s[^-]+$/g, "") // remove source after " - "
      .replace(/[^\x00-\x7F]/g, "") // remove hindi/unicode
      .replace(/\s{2,}/g, " ")
      .trim();

  const googleRSS = (q) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      q,
    )}&hl=en-IN&gl=IN&ceid=IN:en`;

  const bingRSS = (q) =>
    `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss`;

  const fetchFeed = async (url) => {
    try {
      const feed = await parser.parseURL(url);
      return feed.items?.map((i) => i.title) || [];
    } catch {
      return [];
    }
  };

  const INTENTS = [
    "crime",
    "robbery",
    "theft",
    "arrest",
    "police",
    "luxury apartments",
    "five star hotel",
    "premium housing",
    "metro project",
    "road project",
    "infrastructure development",
    "IT park",
    "smart city project",
    "air quality",
    "pollution",
    "waste management",
    "cleanliness drive",
  ];

  // ---------------- PHASE 1: COLLECT NEWS (≤2.5s) ----------------
  const collected = new Set();
  const startCollect = Date.now();

  const collectors = [];

  for (const intent of INTENTS) {
    const q = `${area_name} ${intent}`;
    collectors.push(fetchFeed(googleRSS(q)));
    collectors.push(fetchFeed(bingRSS(q)));
  }

  const collectPromise = (async () => {
    const results = await Promise.allSettled(collectors);
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const h of r.value) {
        if (Date.now() - startCollect > 2500) break;
        const clean = sanitize(h);
        if (clean.length > 25 && clean.length < 160) {
          collected.add(clean);
          if (collected.size >= 50) break;
        }
      }
    }
  })();

  await Promise.race([collectPromise, new Promise((r) => setTimeout(r, 5000))]);

  const headlines = Array.from(collected).slice(0, 30);
  if (!headlines.length) return data_obj;

  // ---------------- PHASE 2: ML PREDICTION (≤2.5s) ----------------
  const score = {
    is_safe: 0,
    is_clean: 0,
    is_luxury: 0,
    is_developing: 0,
  };

  const startML = Date.now();
  let anyWorked = false;

  for (const title of headlines) {
    if (Date.now() - startML > 5000) break;

    try {
      const res = await fetch(`${process.env.FASTAPI_PY_URL}/predictnews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news: title }),
      });

      if (!res.ok) continue;

      const pred = await res.json();
      anyWorked = true;

      if (pred.is_safe === "1") score.is_safe++;
      else if (pred.is_safe === "0") score.is_safe--;

      if (pred.is_clean === "1") score.is_clean++;
      else if (pred.is_clean === "0") score.is_clean--;

      if (pred.is_luxury === "1") score.is_luxury++;
      else if (pred.is_luxury === "0") score.is_luxury--;

      if (pred.is_developing === "1") score.is_developing++;
      else if (pred.is_developing === "0") score.is_developing--;
    } catch {
      continue;
    }
  }

  if (!anyWorked) return data_obj;

  // ---------------- FINAL RESULT ----------------
  data_obj.news_is_safe = normalize(score.is_safe);
  data_obj.news_is_clean = normalize(score.is_clean);
  data_obj.news_is_luxury = normalize(score.is_luxury);
  data_obj.news_is_developing = normalize(score.is_developing);

  return data_obj;
};
*/

/*
This function:
1. Collects news headlines.
2. Sends ALL headlines together to FastAPI.
3. FastAPI decides whether to use:
   - Local LLM
   - Online LLM
   - Legacy ML
4. FastAPI returns:
{
    is_safe,
    is_clean,
    is_luxury,
    is_developing,
    summary
}
5. Updates data_obj.
*/

exports.getNewsAndUpdateObject = async (area_name, data_obj) => {
  data_obj.news_is_safe = -1;
  data_obj.news_is_clean = -1;
  data_obj.news_is_luxury = -1;
  data_obj.news_is_developing = -1;
  data_obj.news_summary = "";

  const Parser = require("rss-parser");
  const parser = new Parser({ timeout: 2000 });

  const sanitize = (txt) =>
    txt
      .replace(/\s-\s[^-]+$/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

  const googleRSS = (q) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      q,
    )}&hl=en-IN&gl=IN&ceid=IN:en`;

  const bingRSS = (q) =>
    `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss`;

  const fetchFeed = async (url) => {
    try {
      const feed = await parser.parseURL(url);
      return feed.items?.map((i) => i.title) || [];
    } catch {
      return [];
    }
  };

  const INTENTS = [
    "crime",
    "robbery",
    "theft",
    "arrest",
    "police",
    "luxury apartments",
    "five star hotel",
    "premium housing",
    "metro project",
    "road project",
    "infrastructure development",
    "IT park",
    "smart city project",
    "air quality",
    "pollution",
    "waste management",
    "cleanliness drive",
  ];

  const collected = new Set();
  const startCollect = Date.now();

  const collectors = [];

  for (const intent of INTENTS) {
    const q = `${area_name} ${intent}`;

    collectors.push(fetchFeed(googleRSS(q)));
    collectors.push(fetchFeed(bingRSS(q)));
  }

  const collectPromise = (async () => {
    const results = await Promise.allSettled(collectors);

    for (const r of results) {
      if (r.status !== "fulfilled") continue;

      for (const h of r.value) {
        if (Date.now() - startCollect > 2500) break;

        const clean = sanitize(h);

        if (clean.length > 25 && clean.length < 160) {
          collected.add(clean);

          if (collected.size >= 50) break;
        }
      }
    }
  })();

  await Promise.race([collectPromise, new Promise((r) => setTimeout(r, 2500))]);

  const headlines = Array.from(collected).slice(0, 30);

  if (!headlines.length) return data_obj;

  try {
    const res = await fetch(`${process.env.FASTAPI_PY_URL}/predictnews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        news: headlines,
      }),
    });

    if (!res.ok) {
      console.error("FastAPI Error:", res.status);
      return data_obj;
    }

    const pred = await res.json();

    data_obj.news_is_safe =
      pred.is_safe !== undefined ? Number(pred.is_safe) : -1;

    data_obj.news_is_clean =
      pred.is_clean !== undefined ? Number(pred.is_clean) : -1;

    data_obj.news_is_luxury =
      pred.is_luxury !== undefined ? Number(pred.is_luxury) : -1;

    data_obj.news_is_developing =
      pred.is_developing !== undefined ? Number(pred.is_developing) : -1;

    return {
      data_obj,
      news_summary: pred.summary || "",
    };
  } catch (err) {
    console.error("News Prediction Error:", err);
    return {
      data_obj,
      news_summary: "",
    };
  }
};

exports.createRagSession = async (r21, r5) => {
  const session_id = crypto.randomUUID();

  try {
    const response = await fetch(`${process.env.FASTAPI_PY_URL}/rag/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id,
        chatbotdata: r21,
        areadata: r5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("RAG session creation failed:", response.status, errorText);

      throw new Error("Failed to initialize RAG session");
    }

    const result = await response.json();

    console.log("RAG session initialized successfully:", session_id);

    return {
      session_id,
      result,
    };
  } catch (err) {
    console.error("createRagSession error:", err.message);
    throw err;
  }
};
