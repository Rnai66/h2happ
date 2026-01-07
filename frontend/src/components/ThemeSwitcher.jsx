import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
    const [theme, setTheme] = useState(() => localStorage.getItem("h2h-theme") || "glass");

    useEffect(() => {
        // Apply theme
        document.documentElement.className = "";
        document.documentElement.classList.add(`theme-${theme}`);

        // Save
        localStorage.setItem("h2h-theme", theme);
    }, [theme]);

    const themes = [
        { id: "glass", label: "✨ Glass" },
        { id: "light", label: "☀️ Light" },
        { id: "dark", label: "🌑 Dark" },
    ];

    return (
        <div className="flex gap-1 bg-white/10 rounded-full p-1 border border-white/20">
            {themes.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`px-3 py-1 text-xs rounded-full transition ${theme === t.id
                        ? "bg-white text-blue-900 font-bold shadow-sm"
                        : "text-white/70 hover:text-white"
                        }`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}
