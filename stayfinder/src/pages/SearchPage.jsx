import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { PromptSearch } from '../components/PromptSearch/PromptSearch';
import { searchProperties } from '../services/hotelsApi';
import './SearchPage.css';

const HERO_QUOTES = {
    en: ['Where will your story take you?', 'Your next adventure starts here', 'Explore. Stay. Remember.'],
    es: ['¿Dónde te llevará tu historia?', 'Tu próxima aventura empieza aquí', 'Explorar. Quedarse. Recordar.'],
};

const POPULAR_DESTINATIONS = [
    { name: 'Paris', emoji: '🗼' },
    { name: 'New York', emoji: '🗽' },
    { name: 'Tokyo', emoji: '🗾' },
    { name: 'Barcelona', emoji: '🎨' },
    { name: 'Buenos Aires', emoji: '🌆' },
    { name: 'Dubai', emoji: '🏙️' },
];

export function SearchPage({ onSearchResults, onLoadingChange }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTab, setSearchTab] = useState('filters'); // 'filters' | 'prompt'

    const quoteList = HERO_QUOTES[i18n.language] || HERO_QUOTES.en;
    const quote = quoteList[Math.floor(Date.now() / 86400000) % quoteList.length];
    const isEs = i18n.language === 'es';

    const handleSearch = async (params) => {
        setLoading(true);
        setError(null);
        onLoadingChange(true);
        try {
            const results = await searchProperties({
                locationId: params.destination?.locationId,
                checkinDate: params.checkinDate,
                checkoutDate: params.checkoutDate,
                adults: params.adults,
                children: params.children,
                rooms: params.rooms,
                sortBy: 'popularity',
                currency: 'USD',
            });
            onSearchResults(results, params);
        } catch (err) {
            setError(t('errors.search'));
            console.error(err);
        } finally {
            setLoading(false);
            onLoadingChange(false);
        }
    };

    const handleQuickSearch = async (dest) => {
        const { searchLocations } = await import('../services/hotelsApi');
        const today = new Date();
        const addDays = (d, n) => {
            const r = new Date(d);
            r.setDate(r.getDate() + n);
            return r.toISOString().split('T')[0];
        };

        setLoading(true);
        setError(null);
        onLoadingChange(true);
        try {
            const suggestions = await searchLocations(dest.name);
            const first = suggestions[0];
            if (!first) throw new Error('No location found');

            const results = await searchProperties({
                locationId: first.locationId,
                checkinDate: addDays(today, 7),
                checkoutDate: addDays(today, 14),
                adults: 2,
                children: 0,
                rooms: 1,
                sortBy: 'popularity',
                currency: 'USD',
            });
            onSearchResults(results, {
                destination: first,
                query: dest.name,
                checkinDate: addDays(today, 7),
                checkoutDate: addDays(today, 14),
                adults: 2,
                children: 0,
                rooms: 1,
            });
        } catch (err) {
            setError(t('errors.search'));
            console.error(err);
        } finally {
            setLoading(false);
            onLoadingChange(false);
        }
    };

    return (
        <div className="search-page">
            {/* Hero */}
            <div className="hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <div className="hero-logo">🌍 StayFinder</div>
                    <p className="hero-quote">{quote}</p>
                </div>
            </div>

            {/* Search Card with tabs */}
            <div className="search-card">
                {/* Tab switcher */}
                <div className="search-tabs">
                    <button
                        className={`search-tab ${searchTab === 'filters' ? 'active' : ''}`}
                        onClick={() => setSearchTab('filters')}
                    >
                        🔍 {isEs ? 'Buscar por filtros' : 'Search by filters'}
                    </button>
                    <button
                        className={`search-tab ${searchTab === 'prompt' ? 'active' : ''}`}
                        onClick={() => setSearchTab('prompt')}
                    >
                        💬 {isEs ? 'Buscar contando' : 'Describe it'}
                    </button>
                </div>

                {/* Tab content */}
                <div className="search-tab-content">
                    {searchTab === 'filters' ? (
                        <>
                            <SearchBar onSearch={handleSearch} loading={loading} />
                            {error && <div className="search-error">{error}</div>}
                        </>
                    ) : (
                        <PromptSearch
                            onSearchResults={onSearchResults}
                            onLoadingChange={onLoadingChange}
                        />
                    )}
                </div>
            </div>

            {/* Popular Destinations */}
            <div className="popular-section">
                <h2 className="popular-title">
                    {isEs ? 'Destinos populares' : 'Popular destinations'}
                </h2>
                <div className="popular-grid">
                    {POPULAR_DESTINATIONS.map((dest) => (
                        <button
                            key={dest.name}
                            className="popular-card"
                            onClick={() => handleQuickSearch(dest)}
                            disabled={loading}
                        >
                            <span className="pop-emoji">{dest.emoji}</span>
                            <span className="pop-name">{dest.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
