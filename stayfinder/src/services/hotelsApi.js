// ─────────────────────────────────────────────
// StayFinder — Hotels API Service
// Provider: booking-com18 (Things4u) on RapidAPI
// Free plan: $0.00/month, 530 requests/month
// ─────────────────────────────────────────────

const RAPID_API_KEY = '68544aec0amsh90eccd27896778dp16eaebjsn8f571c80ff75';
const RAPID_API_HOST = 'booking-com18.p.rapidapi.com';
const BASE_URL = 'https://booking-com18.p.rapidapi.com';

const headers = {
  'x-rapidapi-key': RAPID_API_KEY,
  'x-rapidapi-host': RAPID_API_HOST,
};

/** Upgrade Booking.com thumbnail URLs to full hi-res */
const hqPhoto = (url) => {
  if (!url) return null;
  return url.replace(/square\d+|max\d+x\d+/, 'max1024x768');
};

/** Number of nights between two YYYY-MM-DD strings */
export function nightsBetween(checkin, checkout) {
  if (!checkin || !checkout) return 1;
  const diff = new Date(checkout) - new Date(checkin);
  return Math.max(1, Math.round(diff / 86400000));
}

/**
 * Autocomplete: search for destinations by query string
 * Returns: [{ locationId, label, subLabel, type }]
 */
export async function searchLocations(query) {
  const url = `${BASE_URL}/stays/auto-complete?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) throw new Error(`Location search failed: ${res.status}`);
  const json = await res.json();

  const items = Array.isArray(json?.data) ? json.data : [];

  return items
    .filter((item) => item.id || item.dest_id)
    .slice(0, 6)
    .map((item) => ({
      locationId: item.id,
      label: item.label || item.name || query,
      subLabel: item.country || '',
      type: item.dest_type || item.type || 'city',
    }));
}

/**
 * Search hotels by destination
 */
export async function searchProperties({
  locationId,
  checkinDate,
  checkoutDate,
  adults = 2,
  children = 0,
  rooms = 1,
  sortBy = 'popularity',
  currency = 'USD',
  pageNumber = 1,
}) {
  if (!locationId) throw new Error('locationId is required');

  const nights = nightsBetween(checkinDate, checkoutDate);

  const params = new URLSearchParams({
    locationId,
    checkinDate,
    checkoutDate,
    adults: String(adults),
    rooms: String(rooms),
    sortBy,
    currency: 'USD', // always fetch in USD, convert client-side
    units: 'metric',
    pageNumber: String(pageNumber),
  });
  if (children > 0) {
    params.append('children', Array(children).fill(5).join(','));
  }

  const url = `${BASE_URL}/stays/search?${params.toString()}`;
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) throw new Error(`Hotel search failed: ${res.status}`);
  const json = await res.json();

  const hotels = Array.isArray(json?.data) ? json.data : [];

  return hotels.map((h) => {
    const gross = h.priceBreakdown?.grossPrice;
    // grossPrice.value = TOTAL for the entire stay
    const totalUsd = gross?.value ?? null;
    // Per-night price
    const perNightUsd = totalUsd ? totalUsd / nights : null;

    // Build deal/badge label
    const badges = h.priceBreakdown?.benefitBadges ?? [];
    const dealLabel = badges[0]?.text ?? null;

    // Strikethrough price (original before deal)
    const strikethrough = h.priceBreakdown?.strikethroughPrice?.value ?? null;

    // Hi-res images
    const imageUrls = (h.photoUrls ?? []).map(hqPhoto).filter(Boolean);
    const mainImage = imageUrls[0] ?? null;

    // Booking deep link
    const hotelBookingUrl = `https://www.booking.com/hotel/${h.countryCode ?? 'xx'}/${h.id}.html?checkin=${checkinDate}&checkout=${checkoutDate}&group_adults=${adults}&no_rooms=${rooms}&selected_currency=USD`;

    return {
      id: String(h.id ?? Math.random()),
      hotelId: h.id,
      name: h.name ?? 'Unknown property',
      image: mainImage,
      images: imageUrls,
      // Prices always in USD internally
      totalPriceUsd: totalUsd,
      perNightUsd: perNightUsd,
      strikethroughUsd: strikethrough ? strikethrough / nights : null,
      // Convenience for display
      priceFormatted: perNightUsd ? `$${Math.round(perNightUsd)}` : 'N/A',
      nights,
      rating: h.reviewScore ?? null,
      reviewCount: h.reviewCount ?? 0,
      reviewScoreWord: h.reviewScoreWord ?? '',
      neighborhood: h.wishlistName ?? '',
      city: h.wishlistName ?? '',
      countryCode: h.countryCode ?? '',
      lat: h.latitude ?? null,
      lng: h.longitude ?? null,
      url: hotelBookingUrl,
      dealLabel,
      badges,
      stars: (h.propertyClass >= 1 && h.propertyClass <= 5) ? h.propertyClass : null,
      checkinTime: h.checkin?.fromTime ?? '',
      checkoutTime: h.checkout?.untilTime ?? '',
    };
  });
}
