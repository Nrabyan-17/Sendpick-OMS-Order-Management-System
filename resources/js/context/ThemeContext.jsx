import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('theme') || 'system';
        } catch (e) {
            return 'system';
        }
    });

    useEffect(() => {
        const root = document.documentElement;

        const applyTheme = () => {
            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                // Treat 'light' and 'system' themes as light mode (white UI)
                root.classList.remove('dark');
            }
        };

        applyTheme();

        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            console.error('Failed to save theme setting to localStorage:', e);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
