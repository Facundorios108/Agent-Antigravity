import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchPage } from './pages/SearchPage';
import { ResultsPage } from './pages/ResultsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { BottomNav } from './components/BottomNav/BottomNav';
import { LanguageToggle } from './components/LanguageToggle/LanguageToggle';
import { useFavorites } from './hooks/useFavorites';
import { useCurrency } from './context/CurrencyContext';
import './App.css';

function CurrencyToggle() {
  const { currency, setCurrency, label } = useCurrency();
  return (
    <button
      className="currency-toggle"
      onClick={() => setCurrency(currency === 'USD' ? 'ARS' : 'USD')}
      title={currency === 'USD' ? 'Cambiar a Pesos ARS' : 'Switch to USD'}
    >
      {currency === 'USD' ? '🇺🇸 USD' : '🇦🇷 ARS'}
    </button>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState('search');
  const [searchResults, setSearchResults] = useState([]);
  const [searchParams, setSearchParams] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  const { favorites, folders, isFavorite, toggleFavorite } = useFavorites();

  const handleSearchResults = (results, params) => {
    setSearchResults(results);
    setSearchParams(params);
    setActivePage('results');
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div
          className="app-logo"
          onClick={() => setActivePage('search')}
          style={{ cursor: 'pointer' }}
        >
          🌍 StayFinder
        </div>
        <div className="header-controls">
          <CurrencyToggle />
          <LanguageToggle />
        </div>
      </header>

      {/* Global loading bar */}
      {globalLoading && <div className="loading-bar" />}

      {/* Pages */}
      <main className="app-main">
        {activePage === 'search' && (
          <SearchPage
            onSearchResults={handleSearchResults}
            onLoadingChange={setGlobalLoading}
          />
        )}
        {activePage === 'results' && (
          <ResultsPage
            results={searchResults}
            searchParams={searchParams}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}
        {activePage === 'favorites' && (
          <FavoritesPage
            folders={folders}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>

      <BottomNav
        activePage={activePage === 'results' ? 'search' : activePage}
        setActivePage={setActivePage}
        favoritesCount={favorites.length}
      />
    </div>
  );
}
