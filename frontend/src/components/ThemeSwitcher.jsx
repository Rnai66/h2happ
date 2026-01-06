import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher({ className = "" }) {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const themes = [
        { id: 'dark', label: '🌙 Dark', color: '#0f172a' },
        { id: 'nature', label: '🌿 Nature', color: '#f0f4ee' },
        { id: 'work', label: '💼 Work', color: '#ffffff' },
    ];

    return (
        <div className={`relative z-50 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full 
                   shadow-silk backdrop-blur-md
                   border border-white/20 bg-white/10
                   flex items-center justify-center
                   hover:scale-110 active:scale-95 transition
                   text-lg"
                style={{ color: 'var(--text-main)' }}
                title="Change Theme"
            >
                🎨
            </button>

            {/* Dropdown Menu */}
            <div
                className={`absolute top-full right-0 mt-2 p-2 rounded-2xl shadow-xl backdrop-blur-xl border border-white/20 bg-white/10 min-w-[120px]
                            flex flex-col gap-2 transition-all duration-300 origin-top-right
                            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            >
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => {
                            setTheme(t.id);
                            setIsOpen(false);
                        }}
                        className={`
              flex items-center gap-2 px-3 py-2 rounded-xl
              text-xs font-medium text-left
              transition hover:bg-white/20
              ${theme === t.id ? 'bg-white/20 ring-1 ring-yellow-400' : ''}
            `}
                        style={{
                            color: 'var(--text-main)'
                        }}
                    >
                        <span className="text-base">{t.label.split(' ')[0]}</span>
                        <span>{t.label.split(' ')[1]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
