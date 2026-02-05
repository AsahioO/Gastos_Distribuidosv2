import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// ALWAYS default to light - only use dark if user explicitly set it
const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light'

    try {
        const stored = localStorage.getItem('theme')
        // Only return dark if explicitly set to dark, otherwise light
        if (stored === 'dark') {
            return 'dark'
        }
    } catch (e) {
        console.error('Error reading theme from localStorage:', e)
    }

    // Default is ALWAYS light
    return 'light'
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme)

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement

        // Remove both classes first
        root.classList.remove('light', 'dark')
        // Add the current theme
        root.classList.add(theme)

        // Save to localStorage
        try {
            localStorage.setItem('theme', theme)
        } catch (e) {
            console.error('Error saving theme to localStorage:', e)
        }
    }, [theme])

    const toggleTheme = useCallback(() => {
        setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
    }, [])

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
