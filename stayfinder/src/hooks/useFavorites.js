import { useState } from 'react';
import { useEffect } from 'react';

const STORAGE_KEY = 'stayfinder_favorites_v2';

// Structure: { [cityName]: Hotel[] }
function loadFolders() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

export function useFavorites() {
    const [folders, setFolders] = useState(loadFolders);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    }, [folders]);

    // All hotels flattened
    const favorites = Object.values(folders).flat();

    const isFavorite = (hotelId) =>
        favorites.some((h) => h.id === String(hotelId));

    const toggleFavorite = (hotel, destinationName = 'Other') => {
        const id = String(hotel.id);
        setFolders((prev) => {
            const next = { ...prev };

            // Remove from any folder where it exists
            let wasFound = false;
            for (const city of Object.keys(next)) {
                const before = next[city].length;
                next[city] = next[city].filter((h) => h.id !== id);
                if (next[city].length < before) wasFound = true;
                if (next[city].length === 0) delete next[city];
            }

            // If it wasn't found, add it to the destination folder
            if (!wasFound) {
                const key = destinationName || 'Other';
                next[key] = [...(next[key] || []), { ...hotel }];
            }

            return next;
        });
    };

    return { favorites, folders, isFavorite, toggleFavorite };
}
