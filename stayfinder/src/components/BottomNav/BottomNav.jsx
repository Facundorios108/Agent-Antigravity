import { useTranslation } from 'react-i18next';
import './BottomNav.css';

export function BottomNav({ activePage, setActivePage }) {
    const { t } = useTranslation();

    return (
        <nav className="bottom-nav">
            <button
                className={`nav-item ${activePage === 'search' ? 'active' : ''}`}
                onClick={() => setActivePage('search')}
            >
                <span className="nav-icon">🔍</span>
                <span className="nav-label">{t('nav.search')}</span>
            </button>
            <button
                className={`nav-item ${activePage === 'favorites' ? 'active' : ''}`}
                onClick={() => setActivePage('favorites')}
            >
                <span className="nav-icon">❤️</span>
                <span className="nav-label">{t('nav.favorites')}</span>
            </button>
        </nav>
    );
}
