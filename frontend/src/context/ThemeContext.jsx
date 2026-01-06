import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    theme: 'dark', // 'dark' | 'nature' | 'work'
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('h2h-theme') || 'dark';
    });

    useEffect(() => {
        // Save to local storage
        localStorage.setItem('h2h-theme', theme);

        // Apply dataset attribute to HTML tag
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Handle switching
    function switchTheme(newTheme) {
        if (['dark', 'nature', 'work'].includes(newTheme)) {
            setTheme(newTheme);
        }
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme: switchTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
