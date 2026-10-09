import type { Metadata } from "next"
import {
  DM_Sans,
  Fraunces,
  Inter,
  Lexend,
  Manrope,
  Nunito_Sans,
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
})

export const metadata: Metadata = {
  applicationName: "PomoKit",
  title: {
    default: "PomoKit",
    template: "%s · PomoKit",
  },
  description:
    "Plan your tasks, capture notes, and focus on one thing at a time with PomoKit.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "PomoKit",
    description:
      "Plan your tasks, capture notes, and focus on one thing at a time.",
    siteName: "PomoKit",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PomoKit",
    description:
      "Plan your tasks, capture notes, and focus on one thing at a time.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${fraunces.variable} ${space.variable} ${outfit.variable} ${lexend.variable} ${inter.variable} ${dmSans.variable} ${manrope.variable} ${nunitoSans.variable}`}
    >
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
