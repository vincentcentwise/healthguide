// ============================================
// HealthGuide API Module - Combined FIXED
// ============================================

const FDA_API_URL = "https://api.fda.gov/drug/label.json";
const FDA_EVENT_URL = "https://api.fda.gov/drug/event.json";
const FDA_NDC_URL = "https://api.fda.gov/drug/ndc.json";
const RXNAV_API = "https://rxnav.nlm.nih.gov/REST";

async function safeFetch(url) {
  const res = await fetch(url);
  if (res.status === 404) return null; // Drug not found = not an error
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

// UK to US drug name map
const DRUG_ALIAS = {
  "paracetamol": "acetaminophen",
  "paracetamol": "acetaminophen",
  "co-codamol": "acetaminophen+hydrocodone",
  "nurofen": "ibuprofen",
  "panadol": "acetaminophen"
};

export async function searchMedicines(searchTerm) {
  const raw = searchTerm.trim().toLowerCase();
  if (!raw) return [];

  // Convert UK name to US name
  const searchName = DRUG_ALIAS[raw] || raw;
  const q = encodeURIComponent(searchName);

  const url = `${FDA_API_URL}?search=openfda.generic_name:${q}+openfda.brand_name:${q}+openfda.substance_name:${q}&limit=12`;

  const data = await safeFetch(url);

  if (data?.results?.length) {
    return data.results;
  }

  // If FDA still finds nothing, try RxNav which understands paracetamol
  try {
    const rxUrl = `${RXNAV_API}/drugs.json?name=${encodeURIComponent(raw)}`;
    const res = await fetch(rxUrl);
    if (res.ok) {
      const rxData = await res.json();
      const groups = rxData.drugGroup?.conceptGroup || [];
      const flat = groups.flatMap(g => g.conceptProperties || []);
      if (flat.length) {
        // Take the first RxCUI and use it to search FDA with its US name
        const firstName = flat[0].name; // e.g. "Acetaminophen"
        const q2 = encodeURIComponent(firstName);
        const url2 = `${FDA_API_URL}?search=openfda.generic_name:${q2}+openfda.brand_name:${q2}&limit=50`;
        const data2 = await safeFetch(url2);
        return data2?.results || [];
      }
    }
  } catch(e) {}

  return [];
}

// 2. Get Medicine Details by Set ID
export async function getMedicineBySetId(setId) {
  const q = encodeURIComponent(setId.trim());
  const url = `${FDA_API_URL}?search=set_id:${q}&limit=1`;
  const data = await safeFetch(url);
  return data?.results?.[0] || null;
}

// 3. Get NDC Data
export async function getDrugByNDC(searchTerm) {
  const q = encodeURIComponent(searchTerm.trim());
  const url = `${FDA_NDC_URL}?search=brand_name:${q}+generic_name:${q}&limit=10`;
  const data = await safeFetch(url);
  return data?.results || [];
}

// 4. Get Side Effects
export async function getDrugSideEffects(drugName) {
  const q = encodeURIComponent(drugName.trim());
  const url = `${FDA_EVENT_URL}?search=patient.drug.medicinalproduct:${q}&limit=5`;
  const data = await safeFetch(url);
  return data?.results || [];
}

// 5. RxNav API
export async function searchMedicinesRxNav(searchTerm) {
  const url = `${RXNAV_API}/drugs.json?name=${encodeURIComponent(searchTerm)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.drugGroup?.conceptGroup || [];
}

export async function getDrugInteractions(rxcui) {
  const url = `${RXNAV_API}/interaction/interaction.json?rxcui=${rxcui}`;
  const data = await safeFetch(url);
  return data?.interactionTypeGroup || [];
}