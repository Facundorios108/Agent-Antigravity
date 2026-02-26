import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { parsePrompt } from '../../services/promptParser';
import { searchLocations, searchProperties } from '../../services/hotelsApi';
import './PromptSearch.css';

const addDays = (d, n) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r.toISOString().split('T')[0];
};

const today = new Date();
const DEFAULT_CHECKIN = addDays(today, 7);
const DEFAULT_CHECKOUT = addDays(today, 14);

export function PromptSearch({ onSearchResults, onLoadingChange }) {
    const { t, i18n } = useTranslation();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsed, setParsed] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef(null);

    // Close help tooltip when clicking outside
    useEffect(() => {
        if (!showHelp) return;
        const handler = (e) => {
            if (helpRef.current && !helpRef.current.contains(e.target)) {
                setShowHelp(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [showHelp]);

    const handleSearch = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError(null);
        onLoadingChange(true);

        try {
            const info = parsePrompt(text);
            setParsed(info);

            // Use parsed dates if found, otherwise fall back to defaults (+7/+14 days)
            const checkinDate = info.checkinDate || DEFAULT_CHECKIN;
            const checkoutDate = info.checkoutDate || DEFAULT_CHECKOUT;

            // Resolve city to a locationId via autocomplete
            const searchQuery = info.resolvedCity || text.trim();
            const suggestions = await searchLocations(searchQuery);
            const location = suggestions[0];

            if (!location) {
                throw new Error(t('errors.promptNoCity', 'No pudimos encontrar la ciudad. Intentá ser más específico.'));
            }

            const results = await searchProperties({
                locationId: location.locationId,
                checkinDate,
                checkoutDate,
                adults: 2,
                children: 0,
                rooms: 1,
                sortBy: 'popularity',
                currency: 'USD',
            });

            onSearchResults(results, {
                destination: location,
                query: searchQuery,
                checkinDate,
                checkoutDate,
                adults: 2,
                children: 0,
                rooms: 1,
                promptInfo: info,
                fromPrompt: true,
            });
        } catch (err) {
            setError(err.message || t('errors.search'));
            console.error(err);
        } finally {
            setLoading(false);
            onLoadingChange(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSearch();
        }
    };

    const isEs = i18n.language === 'es';

    const helpContent = {
        title: isEs ? '💡 ¿Cómo buscar contando?' : '💡 How to search by describing?',
        intro: isEs
            ? 'Describí lo que buscás en lenguaje natural. Podés mencionar:'
            : 'Describe what you\'re looking for in natural language. You can mention:',
        items: isEs
            ? ['📍 Ciudad o lugar', '🏠 Tipo (departamento, casa, habitación, hotel)', '🛏 Cantidad de habitaciones', '🚿 Baños (privado, compartido)', '📅 Fechas: "del 8 de agosto al 23 de agosto"', '🚗 Extras (garage, piscina, jardín)']
            : ['📍 City or place', '🏠 Type (apartment, house, room, hotel)', '🛏 Number of bedrooms', '🚿 Bathrooms (private, shared)', '📅 Dates: "from August 8 to August 23"', '🚗 Extras (garage, pool, garden)'],
        examplesTitle: isEs ? 'Ejemplos:' : 'Examples:',
        examples: isEs
            ? [
                '🏢 "Departamento en Manhattan con baño privado"',
                '🏠 "Casa en Miami con 2 baños y 3 habitaciones y garage"',
                '🛏 "Habitación en París cerca de la torre Eiffel"',
                '📅 "Quiero ir del 8 de agosto al 23 de agosto a Barcelona"',
            ]
            : [
                '🏢 "Apartment in Manhattan with private bathroom"',
                '🏠 "House in Miami with 2 bathrooms and 3 bedrooms and garage"',
                '🛏 "Shared room in Paris near the Eiffel Tower"',
                '📅 "I want to go from August 8 to August 23 to Barcelona"',
            ],
        tip: isEs
            ? 'Tip: Presioná Ctrl+Enter para buscar rápido.'
            : 'Tip: Press Ctrl+Enter to search quickly.',
    };

    return (
        <div className="prompt-search">
            {/* Header row with label and help button */}
            <div className="prompt-header">
                <span className="prompt-label">
                    {isEs ? '✍️ Contanos qué buscás' : '✍️ Describe what you\'re looking for'}
                </span>
                <div className="help-wrap" ref={helpRef}>
                    <button
                        className="help-btn"
                        onClick={() => setShowHelp((s) => !s)}
                        aria-label={isEs ? 'Ayuda para buscar' : 'Search help'}
                        aria-expanded={showHelp}
                    >
                        ?
                    </button>

                    {showHelp && (
                        <div className="help-tooltip" role="tooltip">
                            <button
                                className="help-tooltip-close"
                                onClick={() => setShowHelp(false)}
                                aria-label="Cerrar"
                            >✕</button>
                            <p className="help-title">{helpContent.title}</p>
                            <p className="help-intro">{helpContent.intro}</p>
                            <ul className="help-items">
                                {helpContent.items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                            <p className="help-examples-title">{helpContent.examplesTitle}</p>
                            <ul className="help-examples">
                                {helpContent.examples.map((ex, i) => (
                                    <li
                                        key={i}
                                        className="help-example-item"
                                        onClick={() => {
                                            // Strip emoji prefix for cleaner textarea value
                                            const clean = ex.replace(/^[^\s]+\s+"?/, '').replace(/"$/, '');
                                            setText(clean);
                                            setShowHelp(false);
                                        }}
                                    >
                                        {ex}
                                    </li>
                                ))}
                            </ul>
                            <p className="help-tip">{helpContent.tip}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Textarea */}
            <textarea
                className="prompt-textarea"
                value={text}
                onChange={(e) => { setText(e.target.value); setParsed(null); }}
                onKeyDown={handleKeyDown}
                placeholder={
                    isEs
                        ? 'Ej: Departamento en París con 2 habitaciones y baño privado...'
                        : 'E.g: Apartment in Paris with 2 bedrooms and private bathroom...'
                }
                rows={3}
                disabled={loading}
            />

            {/* Parsed chips */}
            {parsed && parsed.summary && (
                <div className="prompt-parsed">
                    <span className="parsed-label">
                        {isEs ? 'Entendimos:' : 'We understood:'}
                    </span>
                    <span className="parsed-summary">{parsed.summary}</span>
                </div>
            )}

            {/* Error */}
            {error && <div className="prompt-error">{error}</div>}

            {/* Search button */}
            <button
                className="prompt-search-btn"
                onClick={handleSearch}
                disabled={loading || !text.trim()}
            >
                {loading
                    ? (isEs ? '⏳ Buscando...' : '⏳ Searching...')
                    : (isEs ? '🔍 Buscar' : '🔍 Search')
                }
            </button>
        </div>
    );
}
