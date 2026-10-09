"use client"

import { Bot, Github, Settings } from "lucide-react"

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
      <a
        href="https://github.com/LanceKitL/PomoKit"
        target="_blank"
        rel="noreferrer"
        aria-label="Star PomoKit on GitHub"
        className="interactive inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-2.5 text-muted hover:-translate-y-0.5 hover:bg-peach hover:text-ink focus-visible:-translate-y-0.5 focus-visible:bg-peach focus-visible:text-ink sm:px-3"
      >
        <Github aria-hidden="true" size={19} />
        <span className="hidden text-sm font-semibold min-[520px]:inline">
          Star this on GitHub
        </span>
      </a>
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
