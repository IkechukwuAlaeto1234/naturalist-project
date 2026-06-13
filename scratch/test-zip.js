const US_STATE_NAME_TO_CODE = {
  ALABAMA: "AL", ALASKA: "AK", ARIZONA: "AZ", ARKANSAS: "AR", CALIFORNIA: "CA",
  COLORADO: "CO", CONNECTICUT: "CT", DELAWARE: "DE", FLORIDA: "FL", GEORGIA: "GA",
  HAWAII: "HI", IDAHO: "ID", ILLINOIS: "IL", INDIANA: "IN", IOWA: "IA",
  KANSAS: "KS", KENTUCKY: "KY", LOUISIANA: "LA", MAINE: "ME", MARYLAND: "MD",
  MASSACHUSETTS: "MA", MICHIGAN: "MI", MINNESOTA: "MN", MISSISSIPPI: "MS", MISSOURI: "MO",
  MONTANA: "MT", NEBRASKA: "NE", NEVADA: "NV", "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM", "NEW YORK": "NY", "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", OHIO: "OH",
  OKLAHOMA: "OK", OREGON: "OR", PENNSYLVANIA: "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD", TENNESSEE: "TN", TEXAS: "TX", UTAH: "UT", VERMONT: "VT",
  VIRGINIA: "VA", WASHINGTON: "WA", "WEST VIRGINIA": "WV", WISCONSIN: "WI", WYOMING: "WY",
  "DISTRICT OF COLUMBIA": "DC"
};

function getDefaultZipForState(countryCode, stateNameOrCode) {
  const code = (stateNameOrCode || "").toUpperCase().trim();
  const country = (countryCode || "").toUpperCase().trim();

  if (country === "US") {
    let stateCode = code;
    if (US_STATE_NAME_TO_CODE[code]) {
      stateCode = US_STATE_NAME_TO_CODE[code];
    }
    const usZips = {
      AL: "35004", AK: "99501", AZ: "85001", AR: "72201", CA: "90001",
      CO: "80201", CT: "06101", DE: "19801", FL: "32001", GA: "30301",
      HI: "96801", ID: "83701", IL: "60601", IN: "46201", IA: "50301",
      KS: "66101", KY: "40201", LA: "70112", ME: "04101", MD: "21201",
      MA: "02101", MI: "48201", MN: "55401", MS: "39201", MO: "64101",
      MT: "59601", NE: "68101", NV: "89101", NH: "03101", NJ: "07101",
      NM: "87101", NY: "10001", NC: "27601", ND: "58102", OH: "43201",
      OK: "73101", OR: "97201", PA: "19101", RI: "02901", SC: "29201",
      SD: "57101", TN: "37201", TX: "75001", UT: "84101", VT: "05601",
      VA: "23219", WA: "98001", WV: "25301", WI: "53201", WY: "82001",
      DC: "20001"
    };
    return usZips[stateCode] || "10001";
  }

  if (country === "NG") {
    const ngZips = {
      ABIA: "440001", ADAMAWA: "640001", "AKWA IBOM": "520001", ANAMBRA: "420001",
      BAUCHI: "740001", BAYELSA: "560001", BENUE: "970001", BORNO: "600001",
      "CROSS RIVER": "540001", DELTA: "320001", EBONYI: "480001", EDO: "300001",
      EKITI: "360001", ENUGU: "400001", FCT: "900001", "FEDERAL CAPITAL TERRITORY": "900001", GOMBE: "760001",
      IMO: "460001", JIGAWA: "720001", KADUNA: "800001", KANO: "700001",
      KATSINA: "820001", KEBBI: "860001", KOGI: "260001", KWARA: "240001",
      LAGOS: "100001", NASARAWA: "950001", NIGER: "920001", OGUN: "110001",
      ONDO: "340001", OSUN: "230001", OYO: "200001", PLATEAU: "930001",
      RIVERS: "500001", SOKOTO: "840001", TARABA: "660001", YOBE: "620001",
      ZAMFARA: "880001",
      AB: "440001", AD: "640001", AK: "520001", AN: "420001",
      BA: "740001", BY: "560001", BE: "970001", BO: "600001",
      CR: "540001", DE: "320001", EB: "480001", ED: "300001",
      EK: "360001", EN: "400001", FC: "900001", GO: "760001",
      IM: "460001", JI: "720001", KD: "800001", KN: "700001",
      KT: "820001", KE: "860001", KO: "260001", KW: "240001",
      LA: "100001", NA: "950001", NI: "920001", OG: "110001",
      ON: "340001", OS: "230001", OY: "200001", PL: "930001",
      RI: "500001", SO: "840001", TA: "660001", YO: "620001",
      ZA: "880001"
    };
    const cleanState = code.replace(" STATE", "");
    return ngZips[cleanState] || "100001";
  }

  const countryFallbacks = {
    US: "10001", NG: "100001", GB: "SW1A 1AA", CA: "K1A 0B1",
    AU: "2000", DE: "10115", FR: "75001", IN: "110001"
  };

  return countryFallbacks[country] || "";
}

function getDefaultZipForCity(countryCode, stateNameOrCode, cityName) {
  const country = (countryCode || "").toUpperCase().trim();
  const city = (cityName || "").toUpperCase().trim().replace(/\s*\(.*\)\s*/g, "");

  if (country === "NG") {
    const ngCityZips = {
      IBADAN: "200001", LAGOS: "100001", IKEJA: "100001", LEKKI: "105102",
      "VICTORIA ISLAND": "101241", ABUJA: "900001", GARKI: "900211",
      WUSE: "900288", MAITAMA: "900271", ASOKORO: "900231", "PORT HARCOURT": "500001",
      KANO: "700001", KADUNA: "800001", "BENIN CITY": "300001", ABEOKUTA: "110001",
      AKURE: "340001", ENUGU: "400001", ILORIN: "240001", JOS: "930001",
      OWERRI: "460001", WARRI: "332001", UYO: "520001", CALABAR: "540001",
    };
    return ngCityZips[city] || null;
  }
  return null;
}

async function resolvePostalCode(countryCode, stateName, cityName) {
  const cityZip = getDefaultZipForCity(countryCode, stateName, cityName);
  if (cityZip) return cityZip;

  const stateZip = getDefaultZipForState(countryCode, stateName) || getDefaultZipForState(countryCode, "");
  return stateZip;
}

async function runTests() {
  console.log("Country only (AF):", await resolvePostalCode("AF", "", ""));
  console.log("Country + State (AF, Badakhshan):", await resolvePostalCode("AF", "Badakhshan", ""));
  console.log("Country + State + City (AF, BDS, Fayzabad):", await resolvePostalCode("AF", "BDS", "Fayzabad"));
  console.log("Country only (US):", await resolvePostalCode("US", "", ""));
  console.log("Country + State (US, NY):", await resolvePostalCode("US", "NY", ""));
}

runTests();
