import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './FilterPanel.css';

const SORT_OPTIONS = [
    { value: 'popularity', labelKey: 'filters.sortPopular' },
    { value: 'price', labelKey: 'filters.sortPriceLow' },
    { value: 'bayesian_review_score', labelKey: 'filters.sortRating' },
    { value: 'distance', labelKey: 'filters.sortDistance' },
];

const STARS = [1, 2, 3, 4, 5];

export function FilterPanel({ filters, onChange, onApply, onReset, show }) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);

    const update = (key, value) => {
        const updated = { ...localFilters, [key]: value };
        setLocalFilters(updated);
        onChange(updated);
    };

    const toggleStar = (star) => {
        const stars = localFilters.stars || [];
        const next = stars.includes(star) ? stars.filter((s) => s !== star) : [...stars, star];
        update('stars', next);
    };

    const handleApply = () => {
        onChange(localFilters);
        onApply(localFilters);
    };

    const handleReset = () => {
        const defaults = { sort: 'popularity', priceMin: '', priceMax: '', minRating: null, stars: [] };
        setLocalFilters(defaults);
        onChange(defaults);
        onReset();
    };

    if (!show) return null;

    return (
        <div className="filter-panel">
            {/* Sort */}
            <div className="filter-section">
                <div className="filter-label">{t('filters.sortBy')}</div>
                <div className="sort-chips">
                    {SORT_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            className={`sort-chip ${localFilters.sort === opt.value ? 'active' : ''}`}
                            onClick={() => update('sort', opt.value)}
                        >
                            {t(opt.labelKey)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stars */}
            <div className="filter-section">
                <div className="filter-label">{t('filters.starsCategory')}</div>
                <div className="stars-row">
                    {STARS.map((s) => (
                        <button
                            key={s}
                            className={`star-chip ${(localFilters.stars || []).includes(s) ? 'active' : ''}`}
                            onClick={() => toggleStar(s)}
                        >
                            {'★'.repeat(s)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rating */}
            <div className="filter-section">
                <div className="filter-label">{t('filters.minRating')}</div>
                <div className="rating-row">
                    {[7, 8, 8.5, 9].map((r) => (
                        <button
                            key={r}
                            className={`rating-chip ${localFilters.minRating === r ? 'active' : ''}`}
                            onClick={() => update('minRating', localFilters.minRating === r ? null : r)}
                        >
                            {r}+
                        </button>
                    ))}
                </div>
            </div>

            {/* Price */}
            <div className="filter-section">
                <div className="filter-label">{t('filters.pricePerNight')}</div>
                <div className="price-row">
                    <div className="price-input-wrap">
                        <span>$</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={localFilters.priceMin ?? ''}
                            onChange={(e) => update('priceMin', e.target.value ? Number(e.target.value) : '')}
                        />
                    </div>
                    <span className="price-dash">—</span>
                    <div className="price-input-wrap">
                        <span>$</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={localFilters.priceMax ?? ''}
                            onChange={(e) => update('priceMax', e.target.value ? Number(e.target.value) : '')}
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="filter-actions">
                <button className="filter-reset-btn" onClick={handleReset}>{t('filters.clear')}</button>
                <button className="filter-apply-btn" onClick={handleApply}>{t('filters.apply')}</button>
            </div>
        </div>
    );
}
