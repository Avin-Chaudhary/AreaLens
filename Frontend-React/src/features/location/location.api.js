const BACKEND_URL = import.meta.env.VITE_NODE_API_URL;

/**
 * Fetch area insights from backend
 * Backend endpoint:
 * /api/v1/location-info?lat=..&lon=..&dist=..
 */
export const fetchLocationOverview = async (lat, lon, radius) => {
  const url = new URL(`${BACKEND_URL}/v1/location-info`);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("dist", radius);

  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch location overview");
  }

  return res.json();
};
