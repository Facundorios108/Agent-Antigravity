import { useCurrency } from '../../context/CurrencyContext';
import './HotelCard.css';

export function HotelCard({ hotel, isFavorite, onToggleFavorite, onClick }) {
    const { formatPrice } = useCurrency();

    const rating = hotel.rating ? Number(hotel.rating).toFixed(1) : null;
    const perNight = hotel.perNightUsd != null ? formatPrice(hotel.perNightUsd) : 'N/A';
    const strikethrough = hotel.strikethroughUsd ? formatPrice(hotel.strikethroughUsd) : null;

    return (
        <div className="hotel-card" onClick={() => onClick(hotel)}>
            <div className="card-image-wrap">
                {hotel.image ? (
                    <img src={hotel.image} alt={hotel.name} loading="lazy" className="card-img" />
                ) : (
                    <div className="card-img-placeholder">🏨</div>
                )}
                {hotel.dealLabel && (
                    <span className="deal-badge">{hotel.dealLabel}</span>
                )}
                <button
                    className={`fav-btn ${isFavorite ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(hotel); }}
                    aria-label={isFavorite ? 'Saved' : 'Save'}
                >
                    {isFavorite ? '❤️' : '🤍'}
                </button>
            </div>

            <div className="card-body">
                <div className="card-top">
                    <span className="card-neighborhood">{hotel.neighborhood}</span>
                    {rating && (
                        <span className="card-rating">
                            <span className="rating-star">⭐</span>
                            <span className="rating-val">{rating}</span>
                            {hotel.reviewCount > 0 && (
                                <span className="rating-count">({hotel.reviewCount})</span>
                            )}
                        </span>
                    )}
                </div>
                <h3 className="card-name">{hotel.name}</h3>
                {hotel.stars && (
                    <div className="card-stars">{'★'.repeat(hotel.stars)}</div>
                )}
                <div className="card-footer">
                    <span className="card-price">
                        {strikethrough && (
                            <span className="price-strike">{strikethrough}</span>
                        )}
                        <strong>{perNight}</strong>
                        <span className="price-night"> /noche</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
