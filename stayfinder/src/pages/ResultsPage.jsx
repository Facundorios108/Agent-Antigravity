import { useState, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { HotelCard } from '../components/HotelCard/HotelCard';
import { FilterPanel } from '../components/FilterPanel/FilterPanel';
import { DetailModal } from '../components/DetailModal/DetailModal';
import { searchProperties } from '../services/hotelsApi';
import './ResultsPage.css';

// Lazy load map to avoid loading leaflet on initial render
const MapView = lazy(() => import('../components/MapView/MapView').then(m => ({ default: m.MapView })));

const DEFAULT_FILTERS = {
    sort: 'popularity',
    stars: [],
    priceMin: '',
    priceMax: '',
    minRating: null,
};

/** Client-side sort based on filter.sort value */
function sortResults(list, sort) {
    const arr = [...list];
    switch (sort) {
        case 'price':
            return arr.sort((a, b) => (a.perNightUsd ?? Infinity) - (b.perNightUsd ?? Infinity));
        case 'bayesian_review_score':
            return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        default:
            return arr; // 'popularity' and 'distance' rely on server order
    }
}

/** Shorten "New York, United States" → "New York" */
function shortDestName(label) {
    if (!label) return '';
    return label.split(',')[0].trim();
}

export function ResultsPage({ results: initialResults, searchParams, isFavorite, onToggleFavorite }) {
    const { t } = useTranslation();
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [results, setResults] = useState(initialResults);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
    const [selectedHotel, setSelectedHotel] = useState(null);

    const destinationName = shortDestName(searchParams?.destination?.label || searchParams?.query || '');

    // Client-side filter + sort (Bug #2 fix: sort applied here)
    const filtered = useMemo(() => {
        const list = results.filter((h) => {
            if (filters.minRating && (h.rating ?? 0) < filters.minRating) return false;
            if (filters.priceMin !== '' && filters.priceMin != null && h.perNightUsd != null && h.perNightUsd < Number(filters.priceMin)) return false;
            if (filters.priceMax !== '' && filters.priceMax != null && h.perNightUsd != null && h.perNightUsd > Number(filters.priceMax)) return false;
            if (filters.stars?.length > 0 && !filters.stars.includes(h.stars)) return false;
            return true;
        });
        return sortResults(list, filters.sort);
    }, [results, filters]);

    // Server-side re-fetch only for sort modes that need it ('popularity', 'distance')
    const handleApplyFilters = async (liveFilters) => {
        setShowFilters(false);
        const serverSortModes = ['popularity', 'distance'];
        const needsRefetch = serverSortModes.includes(liveFilters?.sort || filters.sort);
        if (!needsRefetch || !searchParams?.destination?.locationId) return;
        setLoading(true);
        try {
            const data = await searchProperties({
                locationId: searchParams.destination.locationId,
                checkinDate: searchParams.checkinDate,
                checkoutDate: searchParams.checkoutDate,
                adults: searchParams.adults ?? 2,
                children: searchParams.children ?? 0,
                rooms: searchParams.rooms ?? 1,
                sortBy: liveFilters?.sort || filters.sort,
                currency: 'USD',
            });
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
    };

    return (
        <div className="results-page">
            {/* Header bar */}
            <div className="results-header">
                <div className="results-count">
                    {loading ? `⏳ ${t('results.loading')}` : t('results.found', { count: filtered.length })}
                </div>
                <div className="header-actions">
                    {/* View toggle */}
                    <div className="view-toggle">
                        <button
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                            title="Lista"
                        >☰</button>
                        <button
                            className={viewMode === 'map' ? 'active' : ''}
                            onClick={() => setViewMode('map')}
                            title="Mapa"
                        >🗺️</button>
                    </div>
                    <button
                        className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters((s) => !s)}
                    >
                        ⚙️ {t('filters.title')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <FilterPanel
                filters={filters}
                onChange={setFilters}
                onApply={handleApplyFilters}
                onReset={resetFilters}
                show={showFilters}
            />

            {/* Content */}
            {loading ? (
                <div className="results-loading">
                    <div className="skeleton-grid">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="skeleton-card">
                                <div className="skeleton-img" />
                                <div className="skeleton-line long" />
                                <div className="skeleton-line short" />
                                <div className="skeleton-line medium" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="results-empty">
                    <span className="empty-icon">🔍</span>
                    <h3>{t('results.empty')}</h3>
                    <p>{t('results.emptyHint')}</p>
                    <button className="reset-link" onClick={resetFilters}>{t('results.clearFilters')}</button>
                </div>
            ) : viewMode === 'map' ? (
                <Suspense fallback={<div className="map-loading">{t('results.loadingMap')}</div>}>
                    <MapView hotels={filtered} onHotelClick={setSelectedHotel} />
                </Suspense>
            ) : (
                <div className="hotel-grid">
                    {filtered.map((hotel) => (
                        <HotelCard
                            key={hotel.id}
                            hotel={hotel}
                            isFavorite={isFavorite(hotel.id)}
                            onToggleFavorite={(h) => onToggleFavorite(h, destinationName)}
                            onClick={setSelectedHotel}
                        />
                    ))}
                </div>
            )}

            {selectedHotel && (
                <DetailModal
                    hotel={selectedHotel}
                    checkinDate={searchParams?.checkinDate}
                    checkoutDate={searchParams?.checkoutDate}
                    isFavorite={isFavorite(selectedHotel.id)}
                    onToggleFavorite={onToggleFavorite}
                    destinationName={destinationName}
                    onClose={() => setSelectedHotel(null)}
                />
            )}
        </div>
    );
}
