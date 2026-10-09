"use client"

import React from "react"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import { localPreferencesRepository } from "@/features/preferences/local-preferences.repository"

import { playButtonTap } from "@/lib/sounds"

type SoundSettings = {
  soundEnabled: boolean

  setSoundEnabled: (enabled: boolean) => void
}

const SoundContext = createContext<SoundSettings | null>(null)

export default function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(true)

  useEffect(() => {
    setSoundEnabledState(localPreferencesRepository.load().soundEnabled)
  }, [])

  const setSoundEnabled = useCallback((enabled: boolean) => {
    const current = localPreferencesRepository.load()

    localPreferencesRepository.save({ ...current, soundEnabled: enabled })

    setSoundEnabledState(enabled)
  }, [])

  useEffect(() => {
    function playForButton(event: MouseEvent) {
      if (!soundEnabled || !(event.target instanceof Element)) return

      const button = event.target.closest(
        'button:not(:disabled):not([aria-disabled="true"]), [role="button"]:not([aria-disabled="true"])',
      )

      if (button) playButtonTap()
    }

    document.addEventListener("click", playForButton, true)

    return () => document.removeEventListener("click", playForButton, true)
  }, [soundEnabled])

  return (
    <SoundContext.Provider value={{ soundEnabled, setSoundEnabled }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSoundSettings() {
  const context = useContext(SoundContext)

  if (!context) {
    throw new Error("useSoundSettings must be used within SoundProvider.")
  }

  return context
}
