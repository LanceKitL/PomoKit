"use client"

import { Bot, Settings } from "lucide-react"

import Link from "next/link"

import { usePathname } from "next/navigation"

import FontPicker from "@/components/ui/font-picker"

import ThemePicker from "@/components/ui/theme-picker"

import Brand from "./brand"

export default function AppHeader() {
  const pathname = usePathname() ?? ""

  return (
    <header className="flex min-h-12 w-full items-center justify-between gap-4">
      <Brand />
      <nav
        aria-label="Main navigation"
        className="flex items-center gap-0 sm:gap-1.5"
      >
        <NavLink
          href="/settings/assistant"
          label="Assistant"
          active={pathname === "/settings/assistant"}
        >
          <Bot aria-hidden="true" size={19} />
        </NavLink>
        <NavLink
          href="/settings"
          label="Settings"
          active={pathname === "/settings"}
        >
          <Settings aria-hidden="true" size={19} />
        </NavLink>
        <ThemePicker />
        <FontPicker />
      </nav>
    </header>
  )
}

function NavLink({
  href,

  label,

  active,

  children,
}: {
  href: string

  label: string

  active: boolean

  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`interactive grid size-11 place-items-center rounded-xl text-muted hover:bg-surface hover:text-ink ${
        active ? "bg-surface text-ink" : ""
      }`}
    >
      {children}
    </Link>
  )
}
