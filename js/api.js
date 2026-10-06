// ============================================
// HealthGuide API Module
// ============================================

const FDA_API_URL = "https://api.fda.gov/drug/label.json";


// ============================================
// Search Medicines
// ============================================

export async function searchMedicines(searchTerm) {

  const query = encodeURIComponent(searchTerm.trim());

  const url =
    `${FDA_API_URL}?search=openfda.generic_name:"${query}"` +
    `+OR+openfda.brand_name:"${query}"` +
    `&limit=12`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `FDA API request failed: ${response.status}`
    );
  }

  const data = await response.json();

  return data.results || [];
}


// ============================================
// Get Medicine Details
// ============================================

export async function getMedicineBySetId(setId) {

  const query = encodeURIComponent(setId.trim());

  const url =
    `${FDA_API_URL}?search=set_id:"${query}"&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `FDA API request failed: ${response.status}`
    );
  }

  const data = await response.json();

  return data.results?.[0] || null;
}