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

  if (items.length > 0) {
    console.log('[StayFinder] autocomplete item[0]:', items[0]);
  }

  return items
    .filter((item) => item.dest_id || item.city_ufi || item.id)
    .slice(0, 6)
    .map((item) => {
      // The stays/search endpoint accepts:
      //   - city_ufi  (positive integer) for city/region types
      //   - dest_id   (positive integer) for hotel types
      // dest_id is NEGATIVE for cities in this API (≠ usable for hotel search)
      const destId = Number(item.dest_id);
      const cityUfi = Number(item.city_ufi);
      let locationId;
      if (cityUfi > 0) {
        locationId = cityUfi;         // preferred for city-type results
      } else if (destId > 0) {
        locationId = destId;          // positive dest_id works for hotel/region
      } else {
        locationId = item.id ?? destId; // last resort
      }
      return {
        locationId,
        label: item.label || item.name || query,
        subLabel: item.country || '',
        type: item.dest_type || item.type || 'city',
      };
    })
    .filter((item) => item.locationId); // drop any that still have no valid ID
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

  // Guard: dates must be real YYYY-MM-DD strings
  const checkinOk = typeof checkinDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(checkinDate);
  const checkoutOk = typeof checkoutDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(checkoutDate);
  if (!checkinOk || !checkoutOk) {
    throw new Error(`Invalid dates — checkin: ${checkinDate}, checkout: ${checkoutDate}`);
  }

  const nights = nightsBetween(checkinDate, checkoutDate);

  const params = new URLSearchParams({
    locationId,
    checkinDate,
    checkoutDate,
    adults: String(adults),
    rooms: String(rooms),
    sortBy,
    currency: 'USD',
    units: 'metric',
    pageNumber: String(pageNumber),
  });
  if (children > 0) {
    params.append('children', Array(children).fill(5).join(','));
  }

  const url = `${BASE_URL}/stays/search?${params.toString()}`;
  console.log('[StayFinder] searchProperties →', { locationId, checkinDate, checkoutDate, adults, rooms });

  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) {
    // Try to read the body for a more informative error message
    let body = '';
    try { body = await res.text(); } catch (_) { /* ignore */ }
    console.error('[StayFinder] API error', res.status, body);
    // Surface a user-friendly message based on status
    if (res.status === 403 || res.status === 429) {
      throw new Error(`API quota exceeded or auth error (${res.status}). Please try again later.`);
    }
    throw new Error(`Hotel search failed: ${res.status} — ${body.slice(0, 120)}`);
  }
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

    // Booking deep link.
    // The /hotel/{cc}/{id}.html format uses an internal name-slug, NOT the numeric
    // property ID, so it returns 404. We use the search URL with the hotel name
    // + property type filter which always resolves to the correct hotel page.
    const hotelBookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(h.name ?? '')}&checkin=${checkinDate}&checkout=${checkoutDate}&group_adults=${adults}&no_rooms=${rooms}&selected_currency=USD&src=searchresults&dest_type=hotel`;

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
