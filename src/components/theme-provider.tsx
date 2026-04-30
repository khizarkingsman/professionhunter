"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// No explicit types here to avoid import errors before npm install finishes
export function ThemeProvider({ children, ...props }: any) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NextThemesProvider 
      {...props} 
      enableSystem={false} 
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
