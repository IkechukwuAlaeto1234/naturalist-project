import { connectToDatabase } from "@/lib/db";
import { Coordinate } from "@/models/Coordinate";

const LAGOS_HUB = { lat: 6.4550, lng: 3.3841, label: "Lagos Hub" };

const STATIC_LOOKUP: Record<string, { lat: number; lng: number; label: string }> = {
  "pretoria": { lat: -25.7479, lng: 28.2292, label: "Pretoria, South Africa" },
  "johannesburg": { lat: -26.2041, lng: 28.0473, label: "Johannesburg, South Africa" },
  "cape town": { lat: -33.9249, lng: 18.4241, label: "Cape Town, South Africa" },
  "durban": { lat: -29.8587, lng: 31.0218, label: "Durban, South Africa" },
  "lagos": { lat: 6.5244, lng: 3.3792, label: "Lagos, Nigeria" },
  "abuja": { lat: 9.0765, lng: 7.3986, label: "Abuja, Nigeria" },
  "new york": { lat: 40.7128, lng: -74.0060, label: "New York, USA" },
  "toronto": { lat: 43.6532, lng: -79.3832, label: "Toronto, Canada" },
  "london": { lat: 51.5074, lng: -0.1278, label: "London, UK" },
  "paris": { lat: 48.8566, lng: 2.3522, label: "Paris, France" },
  "berlin": { lat: 52.5200, lng: 13.4050, label: "Berlin, Germany" },
  "tokyo": { lat: 35.6762, lng: 139.6503, label: "Tokyo, Japan" },
  "sydney": { lat: -33.8688, lng: 151.2093, label: "Sydney, Australia" },
};

/**
 * Geocode a destination (city, state, country) using DB caching and Nominatim OpenStreetMap API fallback.
 */
export async function geocodeDestination(
  city: string,
  state: string,
  country: string
): Promise<{ lat: number; lng: number; label: string }> {
  const cleanCity = (city || "").trim();
  const cleanState = (state || "").trim();
  const cleanCountry = (country || "").trim();

  // Primary lookup query e.g. "Pretoria, Gauteng, South Africa"
  const fullQuery = [cleanCity, cleanState, cleanCountry].filter(Boolean).join(", ");
  const queryLower = fullQuery.toLowerCase();

  await connectToDatabase();

  // 1. Try to find in Mongoose database
  try {
    const cached = await Coordinate.findOne({ query: queryLower });
    if (cached) {
      return { lat: cached.lat, lng: cached.lng, label: cached.label };
    }
  } catch (err) {
    console.error("Coordinate cache DB query failed:", err);
  }

  // 2. Try Nominatim Geocoding API (using native fetch with User-Agent)
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      fullQuery
    )}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "NaturalistSkincare/1.0 (contact: hello@naturalist.com)",
      },
    });

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const label = item.display_name.split(",").slice(0, 3).join(","); // Keep first few parts

        // Cache in DB asynchronously
        Coordinate.create({ query: queryLower, lat, lng, label }).catch((e) =>
          console.error("Failed to write coordinate cache:", e)
        );

        return { lat, lng, label };
      }
    }
  } catch (apiErr) {
    console.error("Nominatim geocoding request failed:", apiErr);
  }

  // 3. Fallback to static local lookup dictionary
  const key = cleanCity.toLowerCase();
  if (STATIC_LOOKUP[key]) {
    return STATIC_LOOKUP[key];
  }
  const countryKey = cleanCountry.toLowerCase();
  if (STATIC_LOOKUP[countryKey]) {
    return STATIC_LOOKUP[countryKey];
  }

  // Double fallback to Pretoria if absolutely nothing matched
  return {
    lat: -25.7479,
    lng: 28.2292,
    label: `${cleanCity ? cleanCity + ", " : ""}${cleanCountry || "South Africa"}`,
  };
}

/**
 * Construct route waypoints array starting from Lagos Hub to the destination.
 */
export async function getRouteWaypoints(
  city: string,
  state: string,
  country: string
): Promise<{ lat: number; lng: number; label: string }[]> {
  const dest = await geocodeDestination(city, state, country);
  return [LAGOS_HUB, dest];
}
