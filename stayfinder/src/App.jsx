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
  const { currency, setCurrency } = useCurrency();
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
  // Bug #8 fix: 'activePage' only controls which tab is shown in BottomNav.
  // We use a separate 'view' state for actual page rendering so that going to
  // Favorites and back to Search doesn't wipe out the search results.
  const [view, setView] = useState('search'); // 'search' | 'results' | 'favorites'
  const [searchResults, setSearchResults] = useState([]);
  const [searchParams, setSearchParams] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  const { favorites, folders, isFavorite, toggleFavorite } = useFavorites();

  const handleSearchResults = (results, params) => {
    setSearchResults(results);
    setSearchParams(params);
    setView('results');
  };

  // BottomNav tab handler — keeps results alive when switching back to search tab
  const handleNavChange = (page) => {
    if (page === 'search') {
      // If we have results, go back to results; otherwise go to search form
      setView(searchResults.length > 0 ? 'results' : 'search');
    } else {
      setView(page);
    }
  };

  // BottomNav shows which tab is "active" (highlight)
  const activeTab = view === 'results' ? 'search' : view;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div
          className="app-logo"
          onClick={() => setView('search')}
          style={{ cursor: 'pointer' }}
        >
          <img src="/icon-512.png" alt="StayFinder" className="app-logo-img" />
          <span className="app-logo-name">StayFinder</span>
        </div>
        <div className="header-controls">
          <CurrencyToggle />
          <LanguageToggle />
        </div>
      </header>

      {/* Global loading bar */}
      {globalLoading && <div className="loading-bar" />}

      {/* Pages — kept mounted when possible for state preservation */}
      <main className="app-main">
        {view === 'search' && (
          <SearchPage
            onSearchResults={handleSearchResults}
            onLoadingChange={setGlobalLoading}
          />
        )}
        {view === 'results' && (
          <ResultsPage
            results={searchResults}
            searchParams={searchParams}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}
        {view === 'favorites' && (
          <FavoritesPage
            folders={folders}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>

      <BottomNav
        activePage={activeTab}
        setActivePage={handleNavChange}
        favoritesCount={favorites.length}
      />
    </div>
  );
}
