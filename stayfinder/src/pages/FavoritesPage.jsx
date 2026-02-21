import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HotelCard } from '../components/HotelCard/HotelCard';
import { DetailModal } from '../components/DetailModal/DetailModal';
import './FavoritesPage.css';

export function FavoritesPage({ folders, isFavorite, onToggleFavorite }) {
    const { t } = useTranslation();
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);

    const cityList = Object.keys(folders).sort();
    const totalCount = Object.values(folders).flat().length;

    return (
        <div className="favorites-page">
            <div className="favorites-header">
                <h2>❤️ {t('nav.favorites')}</h2>
                {totalCount > 0 && (
                    <span className="fav-count">{totalCount} guardado{totalCount !== 1 ? 's' : ''}</span>
                )}
            </div>

            {totalCount === 0 ? (
                <div className="favorites-empty">
                    <span className="empty-icon">🤍</span>
                    <h3>{t('favorites.empty')}</h3>
                    <p>{t('favorites.emptyHint')}</p>
                </div>
            ) : (
                <div className="folders-list">
                    {cityList.map((city) => {
                        const hotels = folders[city];
                        return (
                            <div key={city} className="folder">
                                <div className="folder-header">
                                    <span className="folder-icon">📁</span>
                                    <div className="folder-info">
                                        <span className="folder-name">{city}</span>
                                        <span className="folder-count">{hotels.length} {hotels.length === 1 ? 'alojamiento' : 'alojamientos'}</span>
                                    </div>
                                </div>
                                <div className="hotel-grid folder-grid">
                                    {hotels.map((hotel) => (
                                        <HotelCard
                                            key={hotel.id}
                                            hotel={hotel}
                                            isFavorite={isFavorite(hotel.id)}
                                            onToggleFavorite={(h) => onToggleFavorite(h, city)}
                                            onClick={(h) => { setSelectedHotel(h); setSelectedDestination(city); }}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedHotel && (
                <DetailModal
                    hotel={selectedHotel}
                    isFavorite={isFavorite(selectedHotel.id)}
                    onToggleFavorite={onToggleFavorite}
                    destinationName={selectedDestination}
                    onClose={() => setSelectedHotel(null)}
                />
            )}
        </div>
    );
}
