import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import './DetailModal.css';

export function DetailModal({ hotel, checkinDate, checkoutDate, isFavorite, onToggleFavorite, onClose, destinationName }) {
    const { formatPrice } = useCurrency();
    const [activeImg, setActiveImg] = useState(0);
    if (!hotel) return null;

    const nights = hotel.nights ?? 1;
    const images = hotel.images?.length > 0 ? hotel.images : (hotel.image ? [hotel.image] : []);
    const currentImg = images[activeImg] ?? null;

    const perNightFmt = hotel.perNightUsd != null ? formatPrice(hotel.perNightUsd) : null;
    const totalFmt = hotel.totalPriceUsd != null ? formatPrice(hotel.totalPriceUsd) : null;
    const strikeFmt = hotel.strikethroughUsd ? formatPrice(hotel.strikethroughUsd) : null;
    const rating = hotel.rating ? Number(hotel.rating).toFixed(1) : null;
    const showStars = hotel.stars && hotel.stars >= 1;

    const ratingLabel = () => {
        if (!rating) return '';
        const r = Number(rating);
        if (r >= 9.5) return 'Excepcional';
        if (r >= 9) return 'Fabuloso';
        if (r >= 8.5) return 'Excelente';
        if (r >= 8) return 'Muy bueno';
        if (r >= 7) return 'Bueno';
        return hotel.reviewScoreWord || '';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="modal-handle" />
                <button className="modal-close" onClick={onClose}>✕</button>

                {/* Gallery */}
                <div className="modal-gallery">
                    {currentImg ? (
                        <img src={currentImg} alt={hotel.name} className="modal-main-img" />
                    ) : (
                        <div className="modal-img-placeholder">🏨</div>
                    )}
                    {/* Image count badge */}
                    {images.length > 1 && (
                        <div className="img-count">{activeImg + 1} / {images.length}</div>
                    )}
                    {/* Thumbnail strip */}
                    {images.length > 1 && (
                        <div className="thumbnail-strip">
                            {images.map((url, i) => (
                                <button
                                    key={i}
                                    className={`thumb ${i === activeImg ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                                >
                                    <img src={url} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-content">
                    {/* Header */}
                    <div className="modal-header">
                        <div style={{ flex: 1 }}>
                            <p className="modal-neighborhood">
                                {hotel.neighborhood || hotel.city}
                                {hotel.countryCode && ` · ${hotel.countryCode.toUpperCase()}`}
                            </p>
                            <h2 className="modal-title">{hotel.name}</h2>
                            {showStars && (
                                <div className="modal-stars">{'★'.repeat(hotel.stars)}</div>
                            )}
                        </div>
                        <button
                            className={`fav-btn-lg ${isFavorite ? 'active' : ''}`}
                            onClick={() => onToggleFavorite(hotel, destinationName)}
                        >
                            {isFavorite ? '❤️' : '🤍'}
                        </button>
                    </div>

                    {/* Rating */}
                    {rating && (
                        <div className="modal-rating">
                            <span className="rating-badge">{rating}</span>
                            <span className="rating-label">{ratingLabel()}</span>
                            {hotel.reviewCount > 0 && (
                                <span className="review-count">· {hotel.reviewCount} reseñas</span>
                            )}
                        </div>
                    )}

                    {/* Deal badge */}
                    {hotel.dealLabel && (
                        <div className="deal-tag">🏷️ {hotel.dealLabel}</div>
                    )}

                    {/* Price Box */}
                    {perNightFmt && (
                        <div className="modal-price-box">
                            <div className="price-box-header">
                                {strikeFmt && (
                                    <span className="price-strike-lg">{strikeFmt}/noche</span>
                                )}
                                <span className="price-per-night">
                                    <strong>{perNightFmt}</strong>
                                    <span className="price-night-label"> /noche</span>
                                </span>
                            </div>
                            <div className="price-breakdown">
                                <span>{perNightFmt} × {nights} {nights === 1 ? 'noche' : 'noches'}</span>
                                <strong>{totalFmt}</strong>
                            </div>
                            <div className="price-total-row">
                                <span>Total estadía</span>
                                <strong>{totalFmt}</strong>
                            </div>
                        </div>
                    )}

                    {/* Checkin info */}
                    {(hotel.checkinTime || hotel.checkoutTime) && (
                        <div className="checkin-info">
                            {hotel.checkinTime && (
                                <div className="checkin-row">
                                    <span className="checkin-icon">🏠</span>
                                    <span>Check-in desde las {hotel.checkinTime}</span>
                                </div>
                            )}
                            {hotel.checkoutTime && (
                                <div className="checkin-row">
                                    <span className="checkin-icon">🧳</span>
                                    <span>Check-out hasta las {hotel.checkoutTime}</span>
                                </div>
                            )}
                            {checkinDate && checkoutDate && (
                                <div className="checkin-row">
                                    <span className="checkin-icon">📅</span>
                                    <span>{checkinDate} → {checkoutDate} ({nights} noches)</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Badges / Amenities */}
                    {hotel.badges?.length > 0 && (
                        <div className="modal-amenities">
                            <h4>Ventajas destacadas</h4>
                            <div className="badges-wrap">
                                {hotel.badges.map((b, i) => (
                                    <span key={i} className="amenity-badge">✓ {b.text}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Book button */}
                    <a
                        href={hotel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="book-btn"
                    >
                        Ver en Booking.com →
                    </a>
                </div>
            </div>
        </div>
    );
}
