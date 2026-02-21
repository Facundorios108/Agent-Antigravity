import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { searchLocations } from '../../services/hotelsApi';
import './SearchBar.css';

function GuestSelector({ adults, children, setAdults, setChildren }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <div className="guest-selector">
            <button className="guest-btn" onClick={() => setOpen((o) => !o)} type="button">
                <span className="guest-icon">👥</span>
                <span>{adults} {t('search.adults')}{children > 0 ? `, ${children} ${t('search.children')}` : ''}</span>
                <span className="chevron">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="guest-dropdown">
                    <div className="guest-row">
                        <div>
                            <div className="guest-label">{t('search.adults')}</div>
                            <div className="guest-sub">18+</div>
                        </div>
                        <div className="guest-counter">
                            <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}>−</button>
                            <span>{adults}</span>
                            <button type="button" onClick={() => setAdults(adults + 1)}>+</button>
                        </div>
                    </div>
                    <div className="guest-row">
                        <div>
                            <div className="guest-label">{t('search.children')}</div>
                            <div className="guest-sub">0–17</div>
                        </div>
                        <div className="guest-counter">
                            <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0}>−</button>
                            <span>{children}</span>
                            <button type="button" onClick={() => setChildren(children + 1)}>+</button>
                        </div>
                    </div>
                    <button className="guest-done" type="button" onClick={() => setOpen(false)}>{t('search.searchBtn')}</button>
                </div>
            )}
        </div>
    );
}

export function SearchBar({ onSearch, loading }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selected, setSelected] = useState(null);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [dateError, setDateError] = useState('');
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!query || query.length < 2 || selected) {
            setSuggestions([]);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSuggestLoading(true);
            try {
                const results = await searchLocations(query);
                setSuggestions(results.slice(0, 6));
            } catch {
                setSuggestions([]);
            } finally {
                setSuggestLoading(false);
            }
        }, 450);
        return () => clearTimeout(debounceRef.current);
    }, [query, selected]);

    const handleSelect = (s) => {
        setSelected(s);
        setQuery(s.label);
        setSuggestions([]);
    };

    // Bug #7 fix: validate checkout strictly after checkin
    const handleCheckoutChange = (value) => {
        setCheckOut(value);
        if (checkIn && value && value <= checkIn) {
            setDateError(t('search.dateError'));
        } else {
            setDateError('');
        }
    };

    const handleCheckinChange = (value) => {
        setCheckIn(value);
        // If checkout is now invalid, clear it
        if (checkOut && checkOut <= value) {
            setCheckOut('');
        }
        setDateError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!checkIn || !checkOut) return;
        if (checkOut <= checkIn) {
            setDateError(t('search.dateError'));
            return;
        }
        setDateError('');
        onSearch({
            destination: selected,
            query,
            checkinDate: checkIn,
            checkoutDate: checkOut,
            adults,
            children,
            rooms: 1,
        });
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <form className="search-bar" onSubmit={handleSubmit}>
            {/* Destination */}
            <div className="search-field destination-field">
                <label>{t('search.destination')}</label>
                <div className="input-wrapper">
                    <span className="input-icon">📍</span>
                    <input
                        type="text"
                        value={query}
                        placeholder={t('search.destinationPlaceholder')}
                        onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                        required
                        autoComplete="off"
                    />
                </div>
                {(suggestions.length > 0 || suggestLoading) && (
                    <ul className="suggestions">
                        {suggestLoading && <li className="suggest-loading">{t('search.searching')}</li>}
                        {suggestions.map((s, i) => (
                            <li key={i} onClick={() => handleSelect(s)}>
                                <span className="suggest-icon">{s.type === 'HOTEL' ? '🏨' : '📍'}</span>
                                <div>
                                    <div>{s.label}</div>
                                    {s.subLabel && <div style={{ fontSize: '11px', color: '#717171' }}>{s.subLabel}</div>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Dates */}
            <div className="search-dates">
                <div className="search-field">
                    <label>{t('search.checkIn')}</label>
                    <div className="input-wrapper">
                        <span className="input-icon">📅</span>
                        <input
                            type="date"
                            value={checkIn}
                            min={today}
                            onChange={(e) => handleCheckinChange(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="search-field">
                    <label>{t('search.checkOut')}</label>
                    <div className="input-wrapper">
                        <span className="input-icon">📅</span>
                        <input
                            type="date"
                            value={checkOut}
                            min={checkIn ? (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() : today}
                            onChange={(e) => handleCheckoutChange(e.target.value)}
                            required
                        />
                    </div>
                </div>
            </div>
            {dateError && <div className="date-error">⚠️ {dateError}</div>}

            {/* Guests */}
            <div className="search-field">
                <label>{t('search.guests')}</label>
                <GuestSelector
                    adults={adults}
                    children={children}
                    setAdults={setAdults}
                    setChildren={setChildren}
                />
            </div>

            <button type="submit" className="search-submit" disabled={loading || !!dateError}>
                {loading ? '⏳' : '🔍'} {t('search.searchBtn')}
            </button>
        </form>
    );
}
