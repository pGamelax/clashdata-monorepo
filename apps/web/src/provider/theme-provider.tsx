import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Always use dark theme - no switching allowed
  const [theme] = useState<Theme>("dark")

  useEffect(() => {
    const root = window.document.documentElement

    // Always ensure dark theme is applied
    root.classList.remove("light", "system")
    root.classList.add("dark")
    
    // Ensure localStorage is set to dark
    localStorage.setItem(storageKey, "dark")
  }, [storageKey])

  const value = {
    theme,
    setTheme: () => {
      // Theme switching disabled - always dark
      // This function exists for compatibility but does nothing
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}