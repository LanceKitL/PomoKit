import type { Metadata } from "next"
import {
  Fraunces,
  Lexend,
  Outfit,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google"
import AppProviders from "@/providers/app-providers"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
})

export const metadata: Metadata = {
  title: {
    default: "PomoKit",
    template: "%s · PomoKit",
  },
  description: "Organize what matters and focus on one thing at a time.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${fraunces.variable} ${space.variable} ${outfit.variable} ${lexend.variable}`}
    >
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
