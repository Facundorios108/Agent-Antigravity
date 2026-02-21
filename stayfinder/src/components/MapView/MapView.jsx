import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCurrency } from '../../context/CurrencyContext';
import './MapView.css';

// Fix leaflet default marker icons (broken in bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const priceIcon = (label) =>
    L.divIcon({
        className: '',
        html: `<div class="map-pin">${label}</div>`,
        iconSize: [64, 28],
        iconAnchor: [32, 14],
    });

export function MapView({ hotels, onHotelClick }) {
    const { formatPrice } = useCurrency();

    const validHotels = hotels.filter((h) => h.lat && h.lng);
    if (validHotels.length === 0) {
        return (
            <div className="map-empty">
                <span>🗺️</span>
                <p>No map data available for these results</p>
            </div>
        );
    }

    const center = [validHotels[0].lat, validHotels[0].lng];

    return (
        <div className="map-wrapper">
            <MapContainer center={center} zoom={13} className="leaflet-map" scrollWheelZoom>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                {validHotels.map((hotel) => (
                    <Marker
                        key={hotel.id}
                        position={[hotel.lat, hotel.lng]}
                        icon={priceIcon(hotel.perNightUsd ? formatPrice(hotel.perNightUsd) : '?')}
                        eventHandlers={{ click: () => onHotelClick(hotel) }}
                    >
                        <Popup>
                            <div className="map-popup">
                                {hotel.image && (
                                    <img src={hotel.image} alt={hotel.name} className="popup-img" />
                                )}
                                <strong>{hotel.name}</strong>
                                {hotel.perNightUsd && (
                                    <span className="popup-price">{formatPrice(hotel.perNightUsd)}/noche</span>
                                )}
                                {hotel.rating && (
                                    <span className="popup-rating">⭐ {Number(hotel.rating).toFixed(1)}</span>
                                )}
                                <button className="popup-btn" onClick={() => onHotelClick(hotel)}>
                                    Ver detalle →
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
