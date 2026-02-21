import { createContext, useContext, useState } from 'react';

const ARS_RATE = 1430; // 1 USD = 1430 ARS

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState('USD');

    const formatPrice = (usdAmount, opts = {}) => {
        if (usdAmount == null) return 'N/A';
        if (currency === 'ARS') {
            const ars = usdAmount * ARS_RATE;
            return `$${Math.round(ars).toLocaleString('es-AR')}`;
        }
        return `$${Math.round(usdAmount).toLocaleString('en-US')}`;
    };

    const symbol = currency === 'ARS' ? '$' : '$';
    const label = currency === 'ARS' ? 'ARS' : 'USD';

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, symbol, label, ARS_RATE }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
    return ctx;
}
