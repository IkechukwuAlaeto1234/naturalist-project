"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { ShoppingBag, ArrowLeft, Loader2, ShieldCheck, CreditCard, Lock, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import CustomDropdown from "@/components/ui/CustomDropdown";

/* ─── Phone Country Data ─── */
const PHONE_COUNTRIES = [
  { name: "United States",  code: "US",  dial: "+1",   format: "(XXX) XXX-XXXX", max: 10 },
  { name: "Canada",         code: "CA",  dial: "+1",   format: "(XXX) XXX-XXXX", max: 10 },
  { name: "United Kingdom", code: "GB",  dial: "+44",  format: "XXXX XXX XXXX",  max: 11 },
  { name: "Nigeria",        code: "NG",  dial: "+234", format: "XXX XXX XXXX",   max: 10 },
  { name: "Germany",        code: "DE",  dial: "+49",  format: "XXX XXXXXXXX",   max: 11 },
  { name: "France",         code: "FR",  dial: "+33",  format: "X XX XX XX XX",  max: 9  },
  { name: "Australia",      code: "AU",  dial: "+61",  format: "XXX XXX XXX",    max: 9  },
  { name: "India",          code: "IN",  dial: "+91",  format: "XXXXX XXXXX",    max: 10 },
  { name: "South Africa",   code: "ZA",  dial: "+27",  format: "XX XXX XXXX",    max: 9  },
  { name: "Kenya",          code: "KE",  dial: "+254", format: "XXX XXX XXX",    max: 9  },
  { name: "Ghana",          code: "GH",  dial: "+233", format: "XX XXX XXXX",    max: 9  },
  { name: "Brazil",         code: "BR",  dial: "+55",  format: "XX XXXXX XXXX",  max: 11 },
  { name: "China",          code: "CN",  dial: "+86",  format: "XXX XXXX XXXX",  max: 11 },
  { name: "Japan",          code: "JP",  dial: "+81",  format: "XX XXXX XXXX",   max: 10 },
  { name: "UAE",            code: "AE",  dial: "+971", format: "XX XXX XXXX",    max: 9  },
  { name: "Saudi Arabia",   code: "SA",  dial: "+966", format: "XX XXX XXXX",    max: 9  },
  { name: "Pakistan",       code: "PK",  dial: "+92",  format: "XXX XXX XXXX",   max: 10 },
  { name: "Indonesia",      code: "ID",  dial: "+62",  format: "XXX XXXX XXXX",  max: 11 },
  { name: "Netherlands",    code: "NL",  dial: "+31",  format: "X XXXX XXXX",    max: 9  },
  { name: "Sweden",         code: "SE",  dial: "+46",  format: "XX XXX XX XX",   max: 9  },
  { name: "Spain",          code: "ES",  dial: "+34",  format: "XXX XXX XXX",    max: 9  },
  { name: "Italy",          code: "IT",  dial: "+39",  format: "XXX XXX XXXX",   max: 10 },
  { name: "Portugal",       code: "PT",  dial: "+351", format: "XXX XXX XXX",    max: 9  },
  { name: "Mexico",         code: "MX",  dial: "+52",  format: "XX XXXXX XXXX",  max: 10 },
  { name: "Argentina",      code: "AR",  dial: "+54",  format: "XXX XXX XXXX",   max: 10 },
];
type PhoneCountry = (typeof PHONE_COUNTRIES)[number];

const inputCls = "px-4 py-2.5 text-sm rounded-xl border border-[#e2dacd] dark:border-white/10 bg-white dark:bg-[#0f1411] text-foreground focus:outline-none focus:ring-2 focus:ring-[#b07e3a] focus:border-transparent transition-all placeholder:text-muted-foreground/40";

function applyPhoneFormat(digits: string, format: string): string {
  let result = "";
  let di = 0;
  for (let i = 0; i < format.length && di < digits.length; i++) {
    result += format[i] === "X" ? digits[di++] : format[i];
  }
  return result;
}

async function resolvePostalCode(countryCode: string, stateName: string, cityName: string): Promise<string | null> {
  const parts = [];
  if (cityName) parts.push(cityName);
  if (stateName) parts.push(stateName);
  if (countryCode) parts.push(countryCode);
  
  if (parts.length > 0) {
    try {
      const query = parts.join(", ");
      const res = await fetch(`/api/geo?address=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.postal) {
          return data.postal;
        }
      }
    } catch (err) {
      console.error("Failed to query API geocoding:", err);
    }
  }
  return "";
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { data: session, status } = useSession();
  const { cartItems, cartSubtotal, loading: cartLoading } = useCart();
  const { formatPrice, currency } = useCurrency();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Loading and database lists
  const [countriesList, setCountriesList] = useState<{ name: string; isoCode: string; phonecode: string }[]>([]);
  const [statesList, setStatesList] = useState<{ name: string; isoCode: string }[]>([]);
  const [citiesList, setCitiesList] = useState<{ name: string }[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Geolocation and selections
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [detectedData, setDetectedData] = useState<any>(null);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [loadingZip, setLoadingZip] = useState(false);

  // GPS Permission states
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<PermissionState | "prompt">("prompt");
  const [showGPSModal, setShowGPSModal] = useState(false);

  // Check GPS permission status on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((permissionStatus) => {
        setGpsPermissionStatus(permissionStatus.state);
        permissionStatus.onchange = () => {
          setGpsPermissionStatus(permissionStatus.state);
        };
      }).catch((err) => {
        console.warn("Permissions API query failed:", err);
      });
    }
  }, []);

  // Address Autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, address: val }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 4) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/geo?autocomplete=true&input=${encodeURIComponent(val)}&countryCode=${formData.countryCode}`);
        if (res.ok) {
          const data = await res.json();
          setAddressSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = async (placeId: string) => {
    setLoadingZip(true);
    setLoadingStates(true);
    setLoadingCities(true);
    setShowSuggestions(false);
    setAddressSuggestions([]);

    try {
      const res = await fetch(`/api/geo?placeId=${placeId}`);
      if (res.ok) {
        const data = await res.json();

        let targetCountry = data.country || formData.country;
        let targetCountryCode = data.countryCode || formData.countryCode;

        if (data.countryCode) {
          const matchCountry = countriesList.find(c => c.isoCode.toLowerCase() === data.countryCode.toLowerCase());
          if (matchCountry) {
            targetCountry = matchCountry.name;
            targetCountryCode = matchCountry.isoCode;
          }
        }

        let resolvedStateCode = "";
        if (data.state && targetCountryCode) {
          try {
            const statesRes = await fetch(`/api/geo?countryCode=${targetCountryCode}`);
            if (statesRes.ok) {
              const states = await statesRes.json();
              setStatesList(states);

              const cleanRegion = (data.state || "").toLowerCase()
                .replace(/\b(state|province|territory|region|governorate|department|prefecture)\b/g, "")
                .trim();

              const matchState = states.find((s: any) => {
                const cleanDbState = s.name.toLowerCase()
                  .replace(/\b(state|province|territory|region|governorate|department|prefecture)\b/g, "")
                  .trim();
                return cleanDbState === cleanRegion || s.isoCode.toLowerCase() === cleanRegion;
              });

              if (matchState) {
                resolvedStateCode = matchState.isoCode;
                setSelectedStateCode(matchState.isoCode);
              }
            }
          } catch (e) {
            console.error("Failed to fetch states during autocomplete resolution:", e);
          }
        }

        setDetectedData({
          country: targetCountryCode,
          region: data.state || "",
          city: data.city || "",
        });

        setFormData(prev => ({
          ...prev,
          address: data.streetAddress || prev.address,
          country: targetCountry,
          countryCode: targetCountryCode,
          state: data.state || prev.state,
          city: data.city || prev.city,
          zip: data.zip || ""
        }));

        if (targetCountryCode && resolvedStateCode) {
          try {
            const citiesRes = await fetch(`/api/geo?countryCode=${targetCountryCode}&stateCode=${resolvedStateCode}`);
            if (citiesRes.ok) {
              const cities = await citiesRes.json();
              setCitiesList(cities);
            }
          } catch (e) {
            console.error("Failed to fetch cities during autocomplete resolution:", e);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch place details:", err);
    } finally {
      setLoadingZip(false);
      setLoadingStates(false);
      setLoadingCities(false);
    }
  };

  const handleDetectGPSLocation = () => {
    if (gpsPermissionStatus === "denied") {
      alert("Location access is denied. Please enable location permissions in your browser settings to use this feature.");
      return;
    }
    if (gpsPermissionStatus === "granted") {
      triggerActualGPSLocation(false);
    } else {
      setShowGPSModal(true);
    }
  };

  const triggerActualGPSLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingGPS(true);

    const retrievePosition = (options: PositionOptions) => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    // Try high accuracy first (20 seconds timeout). If that fails/times out, try low accuracy (15 seconds timeout).
    retrievePosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
      .catch((err) => {
        console.warn("High accuracy geolocation failed or timed out, trying low accuracy...", err);
        return retrievePosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 });
      })
      .then(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`/api/geo?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            
            let targetCountry = data.country || formData.country;
            let targetCountryCode = data.countryCode || formData.countryCode;
            
            if (data.countryCode) {
              const matchCountry = countriesList.find(
                c => c.isoCode.toLowerCase() === data.countryCode.toLowerCase()
              );
              if (matchCountry) {
                targetCountry = matchCountry.name;
                targetCountryCode = matchCountry.isoCode;
              }
            }

            setDetectedData({
              country: targetCountryCode,
              region: data.state || "",
              city: data.city || "",
            });

            setFormData(prev => ({
              ...prev,
              address: data.streetAddress || prev.address,
              country: targetCountry,
              countryCode: targetCountryCode,
              state: data.state || prev.state,
              city: data.city || prev.city,
              zip: data.zip || "",
            }));

            // Sync phone country format
            const matchPhone = PHONE_COUNTRIES.find(
              p => p.code.toLowerCase() === targetCountryCode.toLowerCase()
            );
            if (matchPhone) {
              setPhoneCountry(matchPhone);
            }

            if (targetCountryCode && data.state) {
              const statesRes = await fetch(`/api/geo?countryCode=${targetCountryCode}`);
              if (statesRes.ok) {
                const states = await statesRes.json();
                setStatesList(states);
                
                const cleanRegion = (data.state || "").toLowerCase()
                  .replace(/\b(state|province|territory|region|governorate|department|prefecture)\b/g, "")
                  .trim();
                const matchState = states.find((s: any) => {
                  const cleanDbState = s.name.toLowerCase()
                    .replace(/\b(state|province|territory|region|governorate|department|prefecture)\b/g, "")
                    .trim();
                  return cleanDbState === cleanRegion || s.isoCode.toLowerCase() === cleanRegion;
                });
                
                if (matchState) {
                  setSelectedStateCode(matchState.isoCode);
                  const citiesRes = await fetch(`/api/geo?countryCode=${targetCountryCode}&stateCode=${matchState.isoCode}`);
                  if (citiesRes.ok) {
                    const cities = await citiesRes.json();
                    setCitiesList(cities);
                  }
                }
              }
            }
          } else {
            if (!silent) alert("Unable to resolve address from coordinates.");
          }
        } catch (err: any) {
          console.warn("GPS Reverse Geocoding failed:", err.message || err);
          if (!silent) alert("Failed to resolve location details.");
        } finally {
          setIsDetectingGPS(false);
        }
      })
      .catch((error) => {
        console.warn("Geolocation error:", error.message || error.code || error);
        if (!silent) {
          let errorMsg = "Unable to retrieve your location.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = "Location access was denied. Please check your browser permission settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            errorMsg = "The request to get your location timed out.";
          }
          alert(errorMsg);
        }
        setIsDetectingGPS(false);
      });
  };

  // Phone code
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(PHONE_COUNTRIES[3]); // Nigeria default
  const [localPhone, setLocalPhone] = useState("");

  // Form input data
  const [formData, setFormData] = useState({
    name: "", email: "", address: "", city: "",
    state: "", zip: "", country: "Nigeria", countryCode: "NG",
    phone: "",
  });

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // If there is cached shipping info from a previous session, restore it
    const token = sessionStorage.getItem("naturalist_checkout_token");
    if (token) {
      const cached = sessionStorage.getItem(`naturalist_shipping_${token}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setFormData(prev => ({
            ...prev,
            ...parsed
          }));
          // Restoring local phone formatting helper
          if (parsed.phone) {
            const matchDial = PHONE_COUNTRIES.find(c => parsed.phone.startsWith(c.dial)) || 
                             countriesList.find(c => parsed.phone.startsWith(c.phonecode));
            const dialStr = matchDial ? ((matchDial as any).dial || (matchDial as any).phonecode) : "";
            if (dialStr) {
              const localPart = parsed.phone.replace(dialStr, "").trim();
              setLocalPhone(localPart);
              if (matchDial) {
                setPhoneCountry(matchDial as any);
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse cached shipping address:", e);
        }
      }
    }
  }, [countriesList]);

  // 1. Fetch all countries from database API on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const res = await fetch("/api/geo");
        if (res.ok) {
          const data = await res.json();
          setCountriesList(data);
        }
      } catch (err) {
        console.error("Error fetching countries:", err);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // 2. Geolocation check once countries are loaded
  useEffect(() => {
    if (countriesList.length === 0) return;

    const autoDetectLocation = async () => {
      // Check if geolocation permission is already granted
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const permission = await navigator.permissions.query({ name: "geolocation" });
          if (permission.state === "granted") {
            triggerActualGPSLocation(true);
            return;
          }
        } catch (e) {
          console.warn("Silent GPS check failed, falling back to IP:", e);
        }
      }

      setIsDetectingLocation(true);
      try {
        const res = await fetch("/api/geo?detect=true");
        if (!res.ok) throw new Error("Location detection failed");
        const data = await res.json();

        // If we succeeded in resolving country details, pre-fill country only
        if (data && data.country) {
          const matchCountry = countriesList.find(
            c => c.isoCode.toLowerCase() === data.country.toLowerCase()
          );

          if (matchCountry) {
            // Set detectedData with country only (no region/city for IP geolocations)
            setDetectedData({
              country: matchCountry.isoCode,
            });

            setFormData(prev => ({
              ...prev,
              country: matchCountry.name,
              countryCode: matchCountry.isoCode,
              zip: "",
              state: "",
              city: "",
            }));

            // Set phone country matching detected country
            const matchPhone = PHONE_COUNTRIES.find(
              p => p.code.toLowerCase() === data.country.toLowerCase()
            );
            if (matchPhone) {
              setPhoneCountry(matchPhone);
            }
          }
        }
      } catch (err: any) {
        console.warn("Auto detect location error:", err.message || err);
      } finally {
        setIsDetectingLocation(false);
      }
    };

    autoDetectLocation();
  }, [countriesList, gpsPermissionStatus]);

  // 3. Fetch states list when countryCode changes
  useEffect(() => {
    if (!formData.countryCode) {
      setStatesList([]);
      setSelectedStateCode("");
      return;
    }

    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const res = await fetch(`/api/geo?countryCode=${formData.countryCode}`);
        if (res.ok) {
          const data = await res.json();
          setStatesList(data);

          // Auto-match region if detected data matches current country selection
          if (detectedData && detectedData.country === formData.countryCode && detectedData.region) {
            const cleanDetectedRegion = detectedData.region.toLowerCase()
              .replace(/\b(state|province|territory|region|governorate|department|prefecture)\b/g, "")
              .trim();

            const matchState = data.find((s: any) => {
              const cleanDbState = s.name.toLowerCase()
                .replace(/\b(state|province|territory|region|governorate|department|prefecture)\b/g, "")
                .trim();
              
              return cleanDbState === cleanDetectedRegion ||
                     s.isoCode.toLowerCase() === cleanDetectedRegion ||
                     cleanDbState.includes(cleanDetectedRegion) ||
                     cleanDetectedRegion.includes(cleanDbState);
            });

            if (matchState) {
              setSelectedStateCode(matchState.isoCode);
              if (!formData.zip) {
                resolvePostalCode(formData.countryCode, matchState.name, "").then(zip => {
                  setFormData(prev => ({
                    ...prev,
                    state: matchState.name,
                    zip: zip || prev.zip
                  }));
                });
              } else {
                setFormData(prev => ({
                  ...prev,
                  state: matchState.name
                }));
              }
              return;
            }
          }

          // Reset selection only if states exist in the database
          if (data.length > 0) {
            setSelectedStateCode("");
            setFormData(prev => ({ ...prev, state: "" }));
          }
        }
      } catch (err) {
        console.error("Error fetching states:", err);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, [formData.countryCode, detectedData]);

  // 4. Fetch cities list when selectedStateCode changes
  useEffect(() => {
    if (!formData.countryCode || !selectedStateCode) {
      setCitiesList([]);
      return;
    }

    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch(
          `/api/geo?countryCode=${formData.countryCode}&stateCode=${selectedStateCode}`
        );
        if (res.ok) {
          const data = await res.json();
          setCitiesList(data);

          // Auto-match city name if matches current country selection
          if (detectedData && detectedData.country === formData.countryCode && detectedData.city) {
            const cleanDetectedCity = detectedData.city.toLowerCase().replace(/\s*\(.*\)\s*/g, "").trim();
            const matchCity = data.find((c: any) => {
              const cleanDbCity = c.name.toLowerCase().replace(/\s*\(.*\)\s*/g, "").trim();
              return cleanDbCity === cleanDetectedCity ||
                     cleanDbCity.includes(cleanDetectedCity) ||
                     cleanDetectedCity.includes(cleanDbCity);
            });
            if (matchCity) {
              const stateName = statesList.find(s => s.isoCode === selectedStateCode)?.name || "";
              if (!formData.zip) {
                resolvePostalCode(formData.countryCode, stateName, matchCity.name).then(zip => {
                  setFormData(prev => ({
                    ...prev,
                    city: matchCity.name,
                    zip: zip || prev.zip
                  }));
                });
              } else {
                setFormData(prev => ({
                  ...prev,
                  city: matchCity.name
                }));
              }
              return;
            }
          }

          // Reset selection only if cities exist in the database
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, city: "" }));
          }
        }
      } catch (err) {
        console.error("Error fetching cities:", err);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [formData.countryCode, selectedStateCode, detectedData]);

  // 5. Synchronize Phone Country dial code with selected shipping country
  useEffect(() => {
    if (countriesList.length === 0) return;
    const match = PHONE_COUNTRIES.find(c => c.code === formData.countryCode);
    if (match) {
      setPhoneCountry(match);
    } else {
      const cDetails = countriesList.find(c => c.isoCode === formData.countryCode);
      if (cDetails) {
        setPhoneCountry({
          name: cDetails.name,
          code: cDetails.isoCode,
          dial: cDetails.phonecode,
          format: "XXXXXXXXXX",
          max: 12
        });
      }
    }
    setLocalPhone("");
    setFormData(prev => ({ ...prev, phone: "" }));
  }, [formData.countryCode, countriesList]);

  // 6. Navigation block check for auth and token session
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=" + encodeURIComponent(`/checkout?token=${token || ""}`));
      return;
    }

    const sessionToken = sessionStorage.getItem("naturalist_checkout_token");
    if (!token || token !== sessionToken) {
      alert("Invalid checkout session. Redirecting to cart.");
      router.replace("/cart");
      setIsValidToken(false);
      return;
    }
    setIsValidToken(true);
  }, [token, status, router]);

  // 7. Title and session pre-fills
  useEffect(() => {
    const t = setTimeout(() => { document.title = "Checkout | Naturalist"; }, 120);
    const sessionTimer = session?.user
      ? setTimeout(() => {
          setFormData(prev => ({ ...prev, name: session.user?.name || "", email: session.user?.email || "" }));
        }, 0)
      : undefined;
    return () => {
      clearTimeout(t);
      if (sessionTimer) clearTimeout(sessionTimer);
    };
  }, [session]);

  // Formatting options for CustomDropdown components
  const countryOptions = useMemo(() =>
    countriesList.map(c => ({
      value: c.isoCode,
      label: c.name,
      countryCode: c.isoCode,
    })),
    [countriesList]
  );

  const stateOptions = useMemo(() =>
    statesList.map(s => ({
      value: s.isoCode,
      label: s.name,
    })),
    [statesList]
  );

  const cityOptions = useMemo(() =>
    citiesList.map(c => ({
      value: c.name,
      label: c.name,
    })),
    [citiesList]
  );

  const phoneCountryOptions = useMemo(() => {
    // Collect standard phone countries
    const standardCodes = new Set(PHONE_COUNTRIES.map(p => p.code));
    const list = PHONE_COUNTRIES.map(c => ({
      value: c.code,
      label: c.name,
      buttonLabel: c.code, // Render only 2-letter code on selected button
      countryCode: c.code,
      subLabel: c.dial,
    }));

    // If active country selection is not in standard list, dynamically append it
    if (formData.countryCode && !standardCodes.has(formData.countryCode)) {
      const activeGeo = countriesList.find(c => c.isoCode === formData.countryCode);
      if (activeGeo) {
        list.push({
          value: activeGeo.isoCode,
          label: activeGeo.name,
          buttonLabel: activeGeo.isoCode, // Render only 2-letter code
          countryCode: activeGeo.isoCode,
          subLabel: activeGeo.phonecode,
        });
      }
    }
    return list;
  }, [formData.countryCode, countriesList]);

  if (cartLoading || status === "loading" || isValidToken === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2d4c38]" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/60" />
          <h2 className="font-serif text-xl font-bold">Checkout is locked</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Please add products to your cart before entering checkout.
          </p>
          <Link href="/shop" className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md">
            Go to Shop
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocalPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.startsWith("0")) {
      raw = raw.substring(1);
    }
    raw = raw.slice(0, phoneCountry.max);
    const fmt = applyPhoneFormat(raw, phoneCountry.format);
    setLocalPhone(fmt);
    setFormData(prev => ({ ...prev, phone: `${phoneCountry.dial} ${fmt}` }));
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.state || !formData.zip || !formData.phone) {
      alert("Please fill in all shipping details.");
      return;
    }

    if (!token) {
      alert("Checkout session has expired. Redirecting to cart.");
      router.push("/cart");
      return;
    }

    // Save form details to sessionStorage under the existing token
    sessionStorage.setItem(`naturalist_shipping_${token}`, JSON.stringify(formData));

    // Redirect to the payment step
    router.push(`/checkout/payment?token=${token}`);
  };

  const shippingThreshold = formData.countryCode === "US" ? 75 : 120;
  const finalTotal = cartSubtotal + (cartSubtotal >= shippingThreshold ? 0 : 9);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1411] transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <Link href="/cart" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Cart
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#141f19] dark:text-[#f4f6f4] tracking-tight leading-none mt-2">
            Secure Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form onSubmit={handleProceedToPayment} className="lg:col-span-8 space-y-6">

            {/* ── STEP 1: Delivery Address ── */}
            <div className="bg-white dark:bg-[#151c18]/30 rounded-3xl border border-[#e2dacd] dark:border-white/[0.08] p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2dacd]/40 dark:border-white/[0.05]">
                <h2 className="font-serif text-xl font-bold text-foreground">
                  1. Delivery Address
                </h2>
                {gpsPermissionStatus !== "denied" && (
                  <button
                    type="button"
                    onClick={handleDetectGPSLocation}
                    disabled={isDetectingGPS}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border border-[#e2dacd] dark:border-white/10 hover:border-[#b07e3a] dark:hover:border-[#b07e3a] text-muted-foreground hover:text-foreground bg-transparent transition-all duration-300"
                  >
                    {isDetectingGPS ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-[#b07e3a]" />
                        Locating...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3 text-[#2d4c38] dark:text-[#f4f6f4]" />
                        Use GPS Location
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Jane Doe" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="jane@example.com" className={inputCls} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 relative" ref={suggestionsRef}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Street Address</label>
                <div className="relative w-full">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleAddressChange}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    required
                    placeholder="123 Botanical Street"
                    className={`${inputCls} w-full pr-10`}
                    autoComplete="off"
                  />
                  {loadingSuggestions && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                      <Loader2 className="h-4 w-4 animate-spin text-[#b07e3a]" />
                    </div>
                  )}
                </div>

                {/* Autocomplete Suggestions Menu */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute top-[calc(100%+6px)] left-0 w-full z-[999] bg-white dark:bg-[#151c18] border border-[#e2dacd] dark:border-white/10 rounded-2xl shadow-2xl p-1.5 flex flex-col space-y-0.5 max-h-60 overflow-y-auto custom-thin-scroll animate-menu-pop">
                    {addressSuggestions.map((suggestion, idx) => (
                      <button
                        key={`${suggestion.place_id}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion.place_id)}
                        className="w-full text-left h-10 px-3.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted dark:hover:bg-[#1a241e] bg-transparent transition-all truncate cursor-pointer"
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Country dropdown using centralized CustomDropdown */}
              <div className="flex flex-col gap-1.5 relative">
                {loadingCountries || isDetectingLocation ? (
                  <div className="flex items-center justify-between px-4 h-12 rounded-xl border border-[#e2dacd] dark:border-white/10 bg-[#faf8f4] dark:bg-[#151c18] opacity-65">
                    <span className="text-xs text-muted-foreground">Detecting country...</span>
                    <Loader2 className="h-4 w-4 animate-spin text-[#b07e3a]" />
                  </div>
                ) : (
                  <CustomDropdown
                    options={countryOptions}
                    value={formData.countryCode}
                    onChange={async (code) => {
                      const match = countriesList.find(c => c.isoCode === code);
                      if (match) {
                        setFormData(prev => ({
                          ...prev,
                          country: match.name,
                          countryCode: code,
                          state: "",
                          city: "",
                          zip: "",
                        }));
                        setSelectedStateCode("");
                      }
                    }}
                    label="Country"
                    placeholder="Select shipping country"
                    searchable={true}
                    searchPlaceholder="Search country..."
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* State selection - dropdown if list exists, else text fallback */}
                <div className="flex flex-col gap-1.5">
                  {loadingStates || isDetectingLocation ? (
                    <>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">State / Province</label>
                      <div className="flex items-center justify-between px-4 h-12 rounded-xl border border-[#e2dacd] dark:border-white/10 bg-[#faf8f4] dark:bg-[#151c18] opacity-65">
                        <span className="text-[11px] text-muted-foreground">Detecting state...</span>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#b07e3a]" />
                      </div>
                    </>
                  ) : statesList.length > 0 ? (
                    <CustomDropdown
                      options={stateOptions}
                      value={selectedStateCode}
                      onChange={async (code) => {
                        const match = statesList.find(s => s.isoCode === code);
                        if (match) {
                          setLoadingZip(true);
                          setSelectedStateCode(code);
                          const zip = await resolvePostalCode(formData.countryCode, match.name, "");
                          setFormData(prev => ({
                            ...prev,
                            state: match.name,
                            city: "",
                            zip: zip || "",
                          }));
                          setLoadingZip(false);
                        }
                      }}
                      label="State / Province"
                      placeholder="Select state"
                      searchable={true}
                      searchPlaceholder="Search state..."
                    />
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">State / Province</label>
                      <input 
                        type="text" 
                        name="state" 
                        value={formData.state} 
                        onChange={handleInputChange} 
                        onBlur={async () => {
                          if (formData.state) {
                            setLoadingZip(true);
                            const zip = await resolvePostalCode(formData.countryCode, formData.state, formData.city);
                            setFormData(prev => ({ ...prev, zip: zip || prev.zip }));
                            setLoadingZip(false);
                          }
                        }}
                        required 
                        placeholder="State / Province" 
                        className={inputCls} 
                      />
                    </div>
                  )}
                </div>

                {/* City selection - dropdown if list exists, else text fallback */}
                <div className="flex flex-col gap-1.5">
                  {loadingCities || isDetectingLocation ? (
                    <>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">City</label>
                      <div className="flex items-center justify-between px-4 h-12 rounded-xl border border-[#e2dacd] dark:border-white/10 bg-[#faf8f4] dark:bg-[#151c18] opacity-65">
                        <span className="text-[11px] text-muted-foreground">Detecting city...</span>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#b07e3a]" />
                      </div>
                    </>
                  ) : statesList.length > 0 ? (
                    <CustomDropdown
                      options={cityOptions}
                      value={formData.city}
                      onChange={async (val) => {
                        setLoadingZip(true);
                        const stateName = statesList.find(s => s.isoCode === selectedStateCode)?.name || "";
                        const zip = await resolvePostalCode(formData.countryCode, stateName, val);
                        setFormData(prev => ({
                          ...prev,
                          city: val,
                          zip: zip !== null ? zip : prev.zip
                        }));
                        setLoadingZip(false);
                      }}
                      label="City"
                      placeholder={selectedStateCode ? "Select city" : "Select state first"}
                      disabled={!selectedStateCode}
                      searchable={true}
                      searchPlaceholder="Search city..."
                    />
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">City</label>
                      <input 
                        type="text" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        onBlur={async () => {
                          if (formData.city) {
                            setLoadingZip(true);
                            const zip = await resolvePostalCode(formData.countryCode, formData.state, formData.city);
                            setFormData(prev => ({ ...prev, zip: zip || prev.zip }));
                            setLoadingZip(false);
                          }
                        }}
                        required 
                        placeholder="City name" 
                        className={inputCls} 
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ZIP / Postal Code</label>
                  <div className="relative w-full">
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      required
                      placeholder="100001"
                      className={`${inputCls} w-full pr-10`}
                    />
                    {(loadingStates || loadingCities || isDetectingLocation || loadingZip) && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                        <Loader2 className="h-4 w-4 animate-spin text-[#b07e3a]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone number field utilizing dial dropdown selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center w-full">
                  <span>Phone Number</span>
                  <span className="text-[9px] text-[#b07e3a] font-bold uppercase tracking-wider">Exclude leading 0</span>
                </label>
                
                <div className="flex gap-2.5 items-end">
                  <div className="w-44 flex-shrink-0">
                    <CustomDropdown
                      options={phoneCountryOptions}
                      value={phoneCountry.code}
                      onChange={(code) => {
                        const match = PHONE_COUNTRIES.find(c => c.code === code) ||
                          (countriesList.find(c => c.isoCode === code) && {
                            name: countriesList.find(c => c.isoCode === code)!.name,
                            code: code,
                            dial: countriesList.find(c => c.isoCode === code)!.phonecode,
                            format: "XXXXXXXXXX",
                            max: 12
                          });
                        if (match) {
                          setPhoneCountry(match);
                          setLocalPhone("");
                          setFormData(prev => ({ ...prev, phone: "" }));
                        }
                      }}
                      placeholder="Dial Code"
                      searchable={true}
                      searchPlaceholder="Search code..."
                    />
                  </div>
                  <div className="flex-1">
                    <input type="tel" value={localPhone} onChange={handleLocalPhone} required inputMode="tel" autoComplete="tel-national"
                      placeholder={phoneCountry.format.replace(/X/g, "0")}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#e2dacd] dark:border-white/10 bg-white dark:bg-[#0f1411] text-foreground focus:outline-none focus:ring-2 focus:ring-[#b07e3a] focus:border-transparent transition-all placeholder:text-muted-foreground/40" />
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground/75 mt-0.5 select-none pl-1">
                  * Please omit the leading zero of your phone number (e.g. enter 8031234567).
                </p>
              </div>
            </div>

            {/* Proceed to Payment Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-2">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-[#2d4c38]" />
                Secure checkout guaranteed by Naturalist
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto flex h-12 min-w-[200px] items-center justify-center gap-2.5 rounded-xl bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 shadow-md cursor-pointer"
              >
                Proceed to Payment
              </button>
            </div>
          </form>

          {/* ── Right: Cart Summary ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-white/90 dark:bg-[#151c18]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-[32px] p-6 shadow-xl flex flex-col gap-5">
              <h3 className="font-serif text-lg font-bold text-foreground">Your Selection</h3>
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative h-12 w-12 rounded-lg bg-muted border border-border/20 overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-bold text-foreground leading-normal truncate">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Qty {item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#2d4c38] dark:text-[#f4f6f4] font-serif shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#e2dacd]/60 dark:border-white/[0.05] pt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span><span className="font-semibold text-foreground">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping</span><span className="font-semibold text-foreground">{cartSubtotal >= shippingThreshold ? "Free" : formatPrice(9)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-foreground pt-1 border-t border-[#e2dacd]/40 dark:border-white/[0.03]">
                  <span>Total</span>
                  <span className="text-base font-bold text-[#2d4c38] dark:text-white font-serif">{formatPrice(finalTotal)}</span>
                </div>
                {currency !== "USD" && (
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-1">
                    * Prices shown in {currency} for reference. Payment is processed in USD.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Geolocation Pre-Permission priming modal */}
      {showGPSModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/45 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-[#faf8f4] dark:bg-[#151c18] border border-[#e2dacd] dark:border-white/10 rounded-[32px] p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-6 animate-scale-up">
            <div className="h-16 w-16 rounded-full bg-[#2d4c38]/10 dark:bg-white/5 flex items-center justify-center animate-pulse">
              <MapPin className="h-8 w-8 text-[#2d4c38] dark:text-[#b07e3a]" />
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Enable Precise Shipping
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Naturalist needs your device's location to automatically find your street address, city, state, and ZIP code to ensure accurate delivery.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowGPSModal(false);
                  triggerActualGPSLocation();
                }}
                className="flex-grow h-11 rounded-xl bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer"
              >
                Allow Access
              </button>
              <button
                type="button"
                onClick={() => setShowGPSModal(false)}
                className="flex-grow h-11 rounded-xl border border-[#e2dacd] dark:border-white/10 hover:bg-muted dark:hover:bg-[#1a241e] text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2d4c38]" />
      </div>
    }>
      <CheckoutPageContent />
    </React.Suspense>
  );
}
