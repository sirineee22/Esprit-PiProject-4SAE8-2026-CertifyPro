import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    theme = signal<string>('light');
    accentColor = signal<string>('blue');

    constructor() {
        this.loadPreferences();
    }

    setTheme(newTheme: string) {
        this.theme.set(newTheme);
        localStorage.setItem('theme-pref', newTheme);
        this.applyTheme();
    }

    setAccentColor(color: string) {
        this.accentColor.set(color);
        localStorage.setItem('accent-color-pref', color);
        this.applyAccentColor();
    }

    getTheme() {
        return this.theme();
    }

    getAccentColor() {
        return this.accentColor();
    }

    loadPreferences() {
        const savedTheme = localStorage.getItem('theme-pref') || 'light';
        const savedAccent = localStorage.getItem('accent-color-pref') || 'blue';

        this.theme.set(savedTheme);
        this.accentColor.set(savedAccent);

        this.applyTheme();
        this.applyAccentColor();
    }

    private applyTheme() {
        const currentTheme = this.theme();
        const isDark = currentTheme === 'dark' ||
            (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    private applyAccentColor() {
        const colors: { [key: string]: string } = {
            blue: 'hsl(217, 91%, 60%)',
            orange: 'hsl(38, 92%, 50%)',
            green: 'hsl(142, 70%, 45%)',
            purple: 'hsl(262, 83%, 58%)',
            rose: 'hsl(346, 84%, 61%)'
        };

        const colorValue = colors[this.accentColor()] || colors['blue'];
        document.documentElement.style.setProperty('--accent', colorValue);
        document.documentElement.style.setProperty('--primary-color', colorValue);
    }
}
