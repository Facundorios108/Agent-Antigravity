// ─────────────────────────────────────────────
// StayFinder — Prompt Parser v2 (local, no AI)
// Changes from v1:
//  - Whole-word matching (no more false positives like "aire" on unrelated text)
//  - Date range parsing: "del 8 de agosto al 23 de agosto", "from Aug 8 to Aug 23"
//  - Extras aliases are now more specific (no single-letter aliases)
// ─────────────────────────────────────────────

// ── Word boundary helper ──────────────────────────────────────────────────────
// Test if `alias` appears as a whole word in `text` (case-insensitive).
// Uses \b where possible; for multi-word aliases, does a case-insensitive indexOf.
function hasWord(text, alias) {
    if (!alias || !text) return false;
    // For short aliases or those with accented chars, \b may not work reliably,
    // so we use a more robust approach: surround with non-word-char lookarounds.
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])${escaped}(?![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])`, 'i').test(text);
}

// ── Month dictionaries ────────────────────────────────────────────────────────
const MONTHS = {
    // Spanish
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
    // English
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    // English short
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8,
    sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function zeroPad(n) { return String(n).padStart(2, '0'); }

function makeDate(year, month, day) {
    return `${year}-${zeroPad(month)}-${zeroPad(day)}`;
}

/**
 * Parse a date range from free text.
 * Handles:
 *  - "del 8 de agosto al 23 de agosto"
 *  - "del 8/8 al 23/8"  /  "del 08-08 al 23-08"
 *  - "from August 8 to August 23"
 *  - "August 8 to August 23"
 *  - "8 agosto - 23 agosto"
 *  - "8 de ago al 23 de sep"
 * Returns { checkinDate, checkoutDate } or { checkinDate: null, checkoutDate: null }
 */
function parseDateRange(text) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    // Choose the correct year for a given (month, day):
    // If the month has already passed this year, use next year.
    function resolveYear(month) {
        if (month < currentMonth) return currentYear + 1;
        return currentYear;
    }

    const lower = text.toLowerCase();

    // ── Pattern 1: "del 8 de agosto al 23 de agosto" / "del 8 de ago. al 23 de sep"
    {
        const m = lower.match(
            /\bdel?\s+(\d{1,2})\s+de\s+([a-záéíóú]+)\.?\s+al?\s+(\d{1,2})\s+de\s+([a-záéíóú]+)/
        );
        if (m) {
            const [, d1, mn1, d2, mn2] = m;
            const mo1 = MONTHS[mn1.replace(/\.$/, '')];
            const mo2 = MONTHS[mn2.replace(/\.$/, '')];
            if (mo1 && mo2) {
                const y1 = resolveYear(mo1);
                const y2 = resolveYear(mo2);
                return { checkinDate: makeDate(y1, mo1, +d1), checkoutDate: makeDate(y2, mo2, +d2) };
            }
        }
    }

    // ── Pattern 2: "del 8/08 al 23/08" or "del 8-8 al 23-8"
    {
        const m = lower.match(/\bdel?\s+(\d{1,2})[\/\-](\d{1,2})\s+al?\s+(\d{1,2})[\/\-](\d{1,2})/);
        if (m) {
            const [, d1, mo1raw, d2, mo2raw] = m;
            const mo1 = +mo1raw;
            const mo2 = +mo2raw;
            if (mo1 >= 1 && mo1 <= 12 && mo2 >= 1 && mo2 <= 12) {
                const y1 = resolveYear(mo1);
                const y2 = resolveYear(mo2);
                return { checkinDate: makeDate(y1, mo1, +d1), checkoutDate: makeDate(y2, mo2, +d2) };
            }
        }
    }

    // ── Pattern 3: "from August 8 to August 23" / "August 8 to August 23"
    {
        const m = lower.match(
            /(?:from\s+)?([a-z]+)\s+(\d{1,2})\s+to\s+([a-z]+)\s+(\d{1,2})/
        );
        if (m) {
            const [, mn1, d1, mn2, d2] = m;
            const mo1 = MONTHS[mn1];
            const mo2 = MONTHS[mn2];
            if (mo1 && mo2) {
                const y1 = resolveYear(mo1);
                const y2 = resolveYear(mo2);
                return { checkinDate: makeDate(y1, mo1, +d1), checkoutDate: makeDate(y2, mo2, +d2) };
            }
        }
    }

    // ── Pattern 4: "8 agosto - 23 agosto" / "8 agosto al 23 agosto"
    {
        const m = lower.match(
            /(\d{1,2})\s+([a-záéíóú]+)\s+(?:al?|[-–—])\s+(\d{1,2})\s+([a-záéíóú]+)/
        );
        if (m) {
            const [, d1, mn1, d2, mn2] = m;
            const mo1 = MONTHS[mn1];
            const mo2 = MONTHS[mn2];
            if (mo1 && mo2) {
                const y1 = resolveYear(mo1);
                const y2 = resolveYear(mo2);
                return { checkinDate: makeDate(y1, mo1, +d1), checkoutDate: makeDate(y2, mo2, +d2) };
            }
        }
    }

    // ── Pattern 5: "8 y 23 de agosto" — same month
    {
        const m = lower.match(/(\d{1,2})\s+(?:y|and)\s+(\d{1,2})\s+de\s+([a-záéíóú]+)/);
        if (m) {
            const [, d1, d2, mn] = m;
            const mo = MONTHS[mn];
            if (mo) {
                const y = resolveYear(mo);
                return { checkinDate: makeDate(y, mo, +d1), checkoutDate: makeDate(y, mo, +d2) };
            }
        }
    }

    return { checkinDate: null, checkoutDate: null };
}

// ── Cities ────────────────────────────────────────────────────────────────────
const KNOWN_CITIES = [
    { aliases: ['manhattan', 'new york', 'nueva york', 'nyc'], city: 'New York' },
    { aliases: ['miami', 'miami beach'], city: 'Miami' },
    { aliases: ['los angeles', 'los ángeles'], city: 'Los Angeles' },
    { aliases: ['chicago'], city: 'Chicago' },
    { aliases: ['san francisco'], city: 'San Francisco' },
    { aliases: ['las vegas', 'vegas'], city: 'Las Vegas' },
    { aliases: ['boston'], city: 'Boston' },
    { aliases: ['washington', 'washington dc'], city: 'Washington DC' },
    { aliases: ['cancun', 'cancún'], city: 'Cancun' },
    { aliases: ['mexico city', 'ciudad de mexico', 'ciudad de méxico', 'cdmx'], city: 'Mexico City' },
    { aliases: ['paris', 'parís'], city: 'Paris' },
    { aliases: ['london', 'londres'], city: 'London' },
    { aliases: ['barcelona'], city: 'Barcelona' },
    { aliases: ['madrid'], city: 'Madrid' },
    { aliases: ['rome', 'roma'], city: 'Rome' },
    { aliases: ['milan', 'milán', 'milano'], city: 'Milan' },
    { aliases: ['amsterdam'], city: 'Amsterdam' },
    { aliases: ['berlin', 'berlín'], city: 'Berlin' },
    { aliases: ['lisbon', 'lisboa'], city: 'Lisbon' },
    { aliases: ['prague', 'praga'], city: 'Prague' },
    { aliases: ['vienna', 'viena'], city: 'Vienna' },
    { aliases: ['athens', 'atenas'], city: 'Athens' },
    { aliases: ['istanbul', 'estambul'], city: 'Istanbul' },
    { aliases: ['buenos aires', 'bsas'], city: 'Buenos Aires' },
    { aliases: ['rio de janeiro', 'río de janeiro', 'rio'], city: 'Rio de Janeiro' },
    { aliases: ['sao paulo', 'são paulo', 'san pablo'], city: 'São Paulo' },
    { aliases: ['bogota', 'bogotá'], city: 'Bogota' },
    { aliases: ['santiago'], city: 'Santiago de Chile' },
    { aliases: ['lima'], city: 'Lima' },
    { aliases: ['medellin', 'medellín'], city: 'Medellin' },
    { aliases: ['cartagena'], city: 'Cartagena' },
    { aliases: ['tokyo', 'tokio'], city: 'Tokyo' },
    { aliases: ['osaka'], city: 'Osaka' },
    { aliases: ['bangkok'], city: 'Bangkok' },
    { aliases: ['bali'], city: 'Bali' },
    { aliases: ['singapore', 'singapur'], city: 'Singapore' },
    { aliases: ['hong kong'], city: 'Hong Kong' },
    { aliases: ['beijing', 'pekin', 'pekín'], city: 'Beijing' },
    { aliases: ['shanghai'], city: 'Shanghai' },
    { aliases: ['sydney', 'sídney'], city: 'Sydney' },
    { aliases: ['melbourne'], city: 'Melbourne' },
    { aliases: ['dubai'], city: 'Dubai' },
    { aliases: ['abu dhabi'], city: 'Abu Dhabi' },
    { aliases: ['marrakech', 'marrakesh'], city: 'Marrakech' },
    { aliases: ['cape town', 'ciudad del cabo'], city: 'Cape Town' },
    { aliases: ['cairo', 'el cairo'], city: 'Cairo' },
    { aliases: ['orlando'], city: 'Orlando' },
];

// ── Landmarks ─────────────────────────────────────────────────────────────────
const LANDMARKS = [
    { pattern: /torre\s+eiffel|eiffel\s+tower/i, city: 'Paris' },
    { pattern: /coliseo|colosseum/i, city: 'Rome' },
    { pattern: /sagrada\s+familia/i, city: 'Barcelona' },
    { pattern: /big\s+ben|tower\s+of\s+london/i, city: 'London' },
    { pattern: /times\s+square|central\s+park/i, city: 'New York' },
    { pattern: /cristo\s+redentor|christ\s+the\s+redeemer/i, city: 'Rio de Janeiro' },
    { pattern: /disney(land|world)?/i, city: 'Orlando' },
    { pattern: /burj\s+khalifa|palm\s+jumeirah/i, city: 'Dubai' },
    { pattern: /ópera\s+de\s+sydney|opera\s+house/i, city: 'Sydney' },
];

// ── Accommodation types ───────────────────────────────────────────────────────
const PROP_TYPES = [
    { aliases: ['departamento', 'depto', 'apartment', 'apartamento', 'piso', 'flat', 'loft'], type: 'apartment', label: '🏢 Departamento' },
    { aliases: ['casa', 'house', 'chalet', 'villa', 'finca', 'quinta'], type: 'house', label: '🏠 Casa' },
    { aliases: ['habitación', 'habitacion', 'cuarto', 'pieza', 'room'], type: 'room', label: '🛏 Habitación' },
    { aliases: ['hotel'], type: 'hotel', label: '🏨 Hotel' },
    { aliases: ['hostel', 'hostal', 'albergue'], type: 'hostel', label: '🏕 Hostel' },
    { aliases: ['cabaña', 'cabana', 'cabin', 'bungalow', 'glamping'], type: 'cabin', label: '🏕 Cabaña' },
    { aliases: ['penthouse', 'ático', 'atico'], type: 'penthouse', label: '🌆 Penthouse' },
    { aliases: ['estudio', 'studio'], type: 'studio', label: '🪴 Estudio' },
];

// ── Extras (only specific, multi-word or unambiguous terms) ───────────────────
// IMPORTANT: Single-character or very short aliases (like "ac") are removed to
// avoid false positives. Phrases must appear as whole words.
const EXTRAS_MAP = [
    { aliases: ['garage', 'garaje', 'cochera', 'estacionamiento', 'parking'], label: '🚗 Garage' },
    { aliases: ['piscina', 'pileta', 'pool'], label: '🏊 Piscina' },
    { aliases: ['jardín', 'jardin', 'garden', 'patio', 'terraza', 'balcón', 'balcon', 'balcony'], label: '🌿 Jardín/Terraza' },
    { aliases: ['wifi', 'wi-fi'], label: '📶 WiFi' },
    // "aire acondicionado" only when the FULL phrase appears:
    { aliases: ['aire acondicionado', 'air conditioning', 'climatizado', 'climatización', 'air conditioned'], label: '❄️ Aire acondicionado' },
    { aliases: ['mascotas', 'pets', 'perros', 'animales', 'pet friendly'], label: '🐾 Mascotas OK' },
    { aliases: ['gimnasio', 'gym', 'fitness'], label: '💪 Gimnasio' },
    { aliases: ['cocina equipada', 'cocina completa', 'full kitchen', 'kitchenette'], label: '🍳 Cocina' },
];

// ── Number extractor ──────────────────────────────────────────────────────────
function extractNumber(text, patterns) {
    for (const p of patterns) {
        const m1 = text.match(new RegExp(`(\\d+)\\s+${p}`, 'i'));
        if (m1) return parseInt(m1[1], 10);
        const m2 = text.match(new RegExp(`${p}\\s+(\\d+)`, 'i'));
        if (m2) return parseInt(m2[1], 10);
    }
    return null;
}

// ── Format YYYY-MM-DD to display string ───────────────────────────────────────
function fmtDate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-');
    return `${parseInt(d)}/${parseInt(m)}/${y}`;
}

/**
 * Main parser — extracts structured data from a free-text accommodation query.
 *
 * @param {string} text
 * @returns {{
 *   city: string|null, rawCity: string|null, resolvedCity: string|null,
 *   type: object|null, rooms: number|null, bathrooms: number|null,
 *   hasPrivateBath: boolean, hasSharedBath: boolean,
 *   extras: string[], checkinDate: string|null, checkoutDate: string|null,
 *   summary: string
 * }}
 */
export function parsePrompt(text) {
    const lower = text.toLowerCase();

    // ── 1. Dates ─────────────────────────────────────────────────────────────────
    const { checkinDate, checkoutDate } = parseDateRange(lower);

    // ── 2. City via landmarks ─────────────────────────────────────────────────────
    let city = null;
    for (const { pattern, city: c } of LANDMARKS) {
        if (pattern.test(lower)) { city = c; break; }
    }

    // ── 3. City via known cities (whole-word match) ───────────────────────────────
    if (!city) {
        for (const entry of KNOWN_CITIES) {
            for (const alias of entry.aliases) {
                if (hasWord(lower, alias)) { city = entry.city; break; }
            }
            if (city) break;
        }
    }

    // ── 4. Fallback raw city extraction ─────────────────────────────────────────
    let rawCity = null;
    if (!city) {
        const cityPatterns = [
            /\ben\s+([a-záéíóúüñ][a-záéíóúüñ\s]{1,30}?)(?:\s+con|\s+cerca|\s+del?\b|\s+y\s|\s*,|$)/i,
            /\bin\s+([a-z][a-z\s]{1,30}?)(?:\s+with|\s+near|\s*,|$)/i,
            /\bcerca\s+de\s+([a-záéíóúüñ\s]{2,25}?)(?:\s+con|\s*,|$)/i,
            /\bnear\s+([a-z\s]{2,25}?)(?:\s+with|\s*,|$)/i,
        ];
        for (const p of cityPatterns) {
            const m = text.match(p);
            if (m && m[1].trim().length > 1) { rawCity = m[1].trim(); break; }
        }
    }

    // ── 5. Accommodation type (whole-word) ────────────────────────────────────────
    let propType = null;
    for (const entry of PROP_TYPES) {
        for (const alias of entry.aliases) {
            if (hasWord(lower, alias)) { propType = entry; break; }
        }
        if (propType) break;
    }

    // ── 6. Rooms ─────────────────────────────────────────────────────────────────
    const rooms = extractNumber(lower, [
        'habitacion(?:es)?', 'cuartos?', 'bedrooms?', 'dormitorios?', 'ambientes?', 'recámaras?',
    ]);

    // ── 7. Bathrooms ─────────────────────────────────────────────────────────────
    const bathrooms = extractNumber(lower, ['baños?', 'bathrooms?', 'aseos?', 'lavabos?']);

    // ── 8. Bathroom type ─────────────────────────────────────────────────────────
    const hasPrivateBath = /baño\s+privado|private\s+bath(?:room)?/i.test(lower);
    const hasSharedBath = /baño\s+compartido|shared\s+bath(?:room)?/i.test(lower);

    // ── 9. Extras (whole-word match for every alias) ──────────────────────────────
    const extras = [];
    for (const entry of EXTRAS_MAP) {
        for (const alias of entry.aliases) {
            if (hasWord(lower, alias)) { extras.push(entry.label); break; }
        }
    }

    // ── 10. Summary chips ────────────────────────────────────────────────────────
    const parts = [];
    if (propType) parts.push(propType.label);
    if (city || rawCity) parts.push(`📍 ${city || rawCity}`);
    if (rooms) parts.push(`🛏 ${rooms} hab.`);
    if (bathrooms) parts.push(`🚿 ${bathrooms} baños`);
    else if (hasPrivateBath) parts.push('🚿 Baño privado');
    else if (hasSharedBath) parts.push('🚿 Baño compartido');
    if (checkinDate) parts.push(`📅 ${fmtDate(checkinDate)} → ${fmtDate(checkoutDate)}`);
    if (extras.length > 0) parts.push(extras[0]); // show only 1st extra in chips
    if (extras.length > 1) parts.push(`+${extras.length - 1} más`);

    return {
        city,
        rawCity,
        resolvedCity: city || rawCity,
        type: propType,
        rooms,
        bathrooms,
        hasPrivateBath,
        hasSharedBath,
        extras,
        checkinDate,
        checkoutDate,
        summary: parts.join(' · ') || text.slice(0, 60),
    };
}
