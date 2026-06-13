import { NextResponse } from "next/server";
import { Country, State, City } from "country-state-city";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GeoPayload {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  zip: string;
}

// ─── Geoapify (Primary) ────────────────────────────────────────────────────────

function parseGeoapifyResult(props: Record<string, any>): GeoPayload {
  const housenumber = props.housenumber || "";
  const street = props.street || props.name || "";
  const streetAddress = housenumber ? `${housenumber} ${street}`.trim() : street;
  return {
    streetAddress,
    city:
      props.city ||
      props.town ||
      props.village ||
      props.suburb ||
      props.county ||
      props.municipality ||
      "",
    state: props.state || props.state_district || "",
    country: props.country || "",
    countryCode: (props.country_code || "").toUpperCase(),
    zip: props.postcode || "",
  };
}

async function geoapifyAutocomplete(
  input: string,
  apiKey: string,
  countryCode?: string
): Promise<{ description: string; place_id: string }[] | null> {
  try {
    let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&format=json&limit=5&apiKey=${apiKey}`;
    if (countryCode) {
      url += `&filter=countrycode:${countryCode.toLowerCase()}`;
    }
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.results?.length) return null;
    return json.results.map((item: any) => {
      const payload = parseGeoapifyResult(item);
      return {
        description: item.formatted || item.address_line1 || "",
        place_id: `geo-${Buffer.from(JSON.stringify(payload)).toString("base64")}`,
      };
    });
  } catch (e) {
    console.error("Geoapify autocomplete failed:", e);
    return null;
  }
}

async function geoapifyGeocode(
  query: string,
  apiKey: string
): Promise<string | null> {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&limit=1&format=json&apiKey=${apiKey}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.results?.length) return null;
    return json.results[0].postcode || null;
  } catch (e) {
    console.error("Geoapify geocode failed:", e);
    return null;
  }
}

async function geoapifyReverse(
  lat: string,
  lon: string,
  apiKey: string
): Promise<GeoPayload | null> {
  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apiKey}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.results?.length) return null;
    return parseGeoapifyResult(json.results[0]);
  } catch (e) {
    console.error("Geoapify reverse geocode failed:", e);
    return null;
  }
}

// ─── Nominatim (Fallback) ──────────────────────────────────────────────────────

const NOM_HEADERS = {
  "User-Agent": "Naturalist-Checkout/1.0 (contact@naturalist.com)",
};

function parseNominatimAddr(addr: Record<string, string>): GeoPayload {
  const streetNumber = addr.house_number || "";
  const road = addr.road || addr.pedestrian || addr.path || "";
  return {
    streetAddress: streetNumber ? `${streetNumber} ${road}`.trim() : road,
    city: addr.city || addr.town || addr.village || addr.suburb || "",
    state: addr.state || "",
    country: addr.country || "",
    countryCode: (addr.country_code || "").toUpperCase(),
    zip: addr.postcode || "",
  };
}

async function nominatimAutocomplete(
  input: string,
  countryCode?: string
): Promise<{ description: string; place_id: string }[] | null> {
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&addressdetails=1&limit=5`;
    if (countryCode) {
      url += `&countrycodes=${countryCode.toLowerCase()}`;
    }
    const res = await fetch(url, { headers: NOM_HEADERS });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || !json.length) return null;
    return json.map((item: any) => {
      const payload = parseNominatimAddr(item.address || {});
      return {
        description: item.display_name,
        place_id: `osm-${Buffer.from(JSON.stringify(payload)).toString("base64")}`,
      };
    });
  } catch (e) {
    console.error("Nominatim autocomplete failed:", e);
    return null;
  }
}

async function nominatimGeocode(query: string): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`;
    const res = await fetch(url, { headers: NOM_HEADERS });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || !json.length) return null;
    return json[0].address?.postcode || null;
  } catch (e) {
    console.error("Nominatim geocode failed:", e);
    return null;
  }
}

async function nominatimReverse(
  lat: string,
  lon: string
): Promise<GeoPayload | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(url, { headers: NOM_HEADERS });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.address) return null;
    return parseNominatimAddr(json.address);
  } catch (e) {
    console.error("Nominatim reverse geocode failed:", e);
    return null;
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const geoapifyKey = process.env.GEOAPIFY_API_KEY || "";
    const googleKey   = process.env.GOOGLE_MAPS_API_KEY || "";

    const detect      = searchParams.get("detect");
    const countryCode = searchParams.get("countryCode");
    const stateCode   = searchParams.get("stateCode");
    const address     = searchParams.get("address");
    const autocomplete = searchParams.get("autocomplete");
    const input       = searchParams.get("input");
    const placeId     = searchParams.get("placeId");
    const lat         = searchParams.get("lat");
    const lng         = searchParams.get("lng");

    // ── 1. Address Autocomplete ────────────────────────────────────────────────
    if (autocomplete === "true" && input) {

      // Google Places (optional upgrade — active when GOOGLE_MAPS_API_KEY is set)
      if (googleKey) {
        try {
          let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${googleKey}`;
          if (countryCode) {
            url += `&components=country:${countryCode.toLowerCase()}`;
          }
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            if (json.predictions?.length) {
              return NextResponse.json(
                json.predictions.map((p: any) => ({
                  description: p.description,
                  place_id: p.place_id, // Real Google place_id — resolved below
                }))
              );
            }
          }
        } catch (e) { console.error("Google autocomplete failed:", e); }
      }

      // Primary: Geoapify
      if (geoapifyKey) {
        const results = await geoapifyAutocomplete(input, geoapifyKey, countryCode || undefined);
        if (results?.length) return NextResponse.json(results);
      }

      // Fallback: Nominatim
      const results = await nominatimAutocomplete(input, countryCode || undefined);
      return NextResponse.json(results || []);
    }

    // ── 2. Place Details ───────────────────────────────────────────────────────
    if (placeId) {

      // Real Google place_id (no prefix — from the autocomplete above)
      if (googleKey && !placeId.startsWith("geo-") && !placeId.startsWith("osm-")) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_component&key=${googleKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            if (json.status === "OK" && json.result) {
              const comps = json.result.address_components;
              const get = (types: string[], prop: "long_name" | "short_name" = "long_name") => {
                const c = comps.find((c: any) => types.some((t: string) => c.types.includes(t)));
                return c ? c[prop] : "";
              };
              const streetNumber = get(["street_number"]);
              const route        = get(["route"]);
              return NextResponse.json({
                streetAddress: streetNumber ? `${streetNumber} ${route}`.trim() : route,
                city:        get(["locality"]) || get(["sublocality"]) || get(["neighborhood"]),
                state:       get(["administrative_area_level_1"]),
                stateCode:   get(["administrative_area_level_1"], "short_name"),
                country:     get(["country"]),
                countryCode: get(["country"], "short_name"),
                zip:         get(["postal_code"]),
              } satisfies Partial<GeoPayload> & { stateCode: string });
            }
          }
        } catch (e) { console.error("Google place details failed:", e); }
      }

      // Geoapify / Nominatim — base64-encoded payload, just decode it
      try {
        const lastDash  = placeId.lastIndexOf("-");
        const base64Str = lastDash !== -1 ? placeId.substring(lastDash + 1) : placeId;
        const decoded   = JSON.parse(Buffer.from(base64Str, "base64").toString("utf-8"));
        return NextResponse.json(decoded);
      } catch (e) {
        console.error("Failed to decode place payload:", e);
        return NextResponse.json({ error: "Invalid place ID" }, { status: 400 });
      }
    }

    // ── 3. Reverse Geocoding — GPS coordinates → full address ──────────────────
    if (lat && lng) {
      // Primary: Geoapify
      if (geoapifyKey) {
        const result = await geoapifyReverse(lat, lng, geoapifyKey);
        if (result) return NextResponse.json(result);
      }
      // Fallback: Nominatim
      const result = await nominatimReverse(lat, lng);
      if (result) return NextResponse.json(result);
      return NextResponse.json({ error: "Reverse geocode failed" }, { status: 500 });
    }

    // ── 4. Forward Geocoding — city+state+country → ZIP ───────────────────────
    if (address) {
      // Google geocoding (if key available)
      if (googleKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            if (json.status === "OK" && json.results?.length) {
              const postalComp = json.results[0].address_components.find(
                (c: any) => c.types.includes("postal_code")
              );
              if (postalComp) return NextResponse.json({ postal: postalComp.long_name });
            }
          }
        } catch (e) { console.error("Google geocoding failed:", e); }
      }

      // Primary: Geoapify
      if (geoapifyKey) {
        const postal = await geoapifyGeocode(address, geoapifyKey);
        if (postal) return NextResponse.json({ postal });
      }

      // Fallback: Nominatim
      const postal = await nominatimGeocode(address);
      return NextResponse.json({ postal: postal || null });
    }

    // ── 5. IP Country Detection — country ONLY, intentionally ─────────────────
    //       IP geolocation is unreliable below country level (ISP routing bias).
    //       For precise city/state, the user must use the GPS button or type an address.
    if (detect === "true") {
      let ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
      if (ip) ip = ip.split(",")[0].trim();
      const clientIp = ip && ip !== "::1" && ip !== "127.0.0.1" ? ip : "";

      let country     = "";
      let countryName = "";

      // Try 1: ipapi.co
      try {
        const url = clientIp
          ? `https://ipapi.co/${clientIp}/json/`
          : "https://ipapi.co/json/";
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json?.country && json.country !== "Reserved") {
            country     = json.country;
            countryName = json.country_name || "";
          }
        }
      } catch (e) { console.error("ipapi.co failed:", e); }

      // Try 2: ipinfo.io
      if (!country) {
        try {
          const url = clientIp
            ? `https://ipinfo.io/${clientIp}/json`
            : "https://ipinfo.io/json";
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            if (json?.country) {
              country     = json.country;
              countryName = json.org || "";
            }
          }
        } catch (e) { console.error("ipinfo.io failed:", e); }
      }

      // Try 3: freeipapi.com
      if (!country) {
        try {
          const url = clientIp
            ? `https://freeipapi.com/api/json/${clientIp}`
            : "https://freeipapi.com/api/json";
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            if (json?.countryCode) {
              country     = json.countryCode;
              countryName = json.countryName || "";
            }
          }
        } catch (e) { console.error("freeipapi.com failed:", e); }
      }

      // Default: Nigeria
      if (!country) { country = "NG"; countryName = "Nigeria"; }

      // Return country ONLY — never city/state/ZIP from IP
      return NextResponse.json({ country, country_name: countryName });
    }

    // ── 6. Cities of a State ───────────────────────────────────────────────────
    if (countryCode && stateCode) {
      const cities = City.getCitiesOfState(countryCode, stateCode);
      const result  = Array.from(new Set(cities.map(c => c.name))).map(name => ({ name }));
      return NextResponse.json(result);
    }

    // ── 7. States of a Country ─────────────────────────────────────────────────
    if (countryCode) {
      const states = State.getStatesOfCountry(countryCode);
      return NextResponse.json(states.map(s => ({ name: s.name, isoCode: s.isoCode })));
    }

    // ── 8. All Countries ───────────────────────────────────────────────────────
    const countries = Country.getAllCountries();
    return NextResponse.json(
      countries.map(c => ({
        name:      c.name,
        isoCode:   c.isoCode,
        phonecode: c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
      }))
    );
  } catch (error) {
    console.error("Geo API error:", error);
    return NextResponse.json({ error: "Failed to fetch geographic data" }, { status: 500 });
  }
}
