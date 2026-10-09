"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { localFontRepository } from "@/features/preferences/local-font.repository"
import {
  defaultFontName,
  type FontName,
} from "@/features/preferences/font.model"

type FontContextValue = {
  font: FontName
  setFont: (font: FontName) => void
}

const FontContext = createContext<FontContextValue | null>(null)

export default function FontProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [font, setFontState] = useState<FontName>(defaultFontName)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setFontState(localFontRepository.load())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    document.documentElement.dataset.font = font
    localFontRepository.save(font)
  }, [font, ready])

  function setFont(next: FontName) {
    setFontState(next)
  }

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  )
}

export function useFont() {
  const context = useContext(FontContext)
  if (!context) {
    throw new Error("useFont must be used within FontProvider")
  }
  return context
}
