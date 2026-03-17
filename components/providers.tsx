"use client"

import { useEffect } from "react"
import { Provider } from "react-redux"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { store } from "@/store"
import { checkProfile, hydrateAuth } from "@/store/slices/auth-slice"

function AuthHydrator() {
  useEffect(() => {
    store.dispatch(hydrateAuth())

    const state = store.getState().auth
    if (state.tokens?.accessToken && !state.user?.id) {
      void store.dispatch(checkProfile())
    }

    const intervalId = window.setInterval(() => {
      const currentState = store.getState().auth
      if (currentState.tokens?.accessToken) {
        void store.dispatch(checkProfile())
      }
    }, 60_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return null
}

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthHydrator />
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </Provider>
  )
}
