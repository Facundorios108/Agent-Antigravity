import { useTranslation } from 'react-i18next';
import './LanguageToggle.css';

export function LanguageToggle() {
    const { i18n } = useTranslation();
    const isEs = i18n.language === 'es';

    return (
        <button
            className="lang-toggle"
            onClick={() => i18n.changeLanguage(isEs ? 'en' : 'es')}
            title="Switch language"
        >
            {isEs ? '🇺🇸 EN' : '🇦🇷 ES'}
        </button>
    );
}
