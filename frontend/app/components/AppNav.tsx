"use client";

import Link from "next/link";
import Image from "next/image";
import icon from "../icon.png";

const navItems = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", key: "dashboard" },
  { href: "/protect", label: "Protect LP", shortLabel: "Protect", key: "protect" },
  { href: "/create", label: "Create Pool", shortLabel: "Create", key: "create" }
] as const;

type AppNavProps = {
  active: (typeof navItems)[number]["key"];
};

export function AppNav({ active }: AppNavProps) {
  return (
    <aside className="sticky top-0 z-50 border-b border-white/5 bg-surface-container-low/95 backdrop-blur-xl lg:h-screen lg:border-b-0 lg:border-r lg:border-white/5">
      <div className="flex h-full flex-col gap-3 px-3 py-3 md:px-6 lg:gap-6 lg:px-5 lg:py-6">
        <div className="border-b border-white/5 pb-3 lg:pb-5">
          <div className="flex items-center gap-3">
            <Image alt="HookFlow Logo" className="h-8 w-8 rounded-lg shadow-sm lg:h-9 lg:w-9 lg:rounded-xl" src={icon} />
            <p className="font-display text-2xl font-semibold tracking-tight text-white lg:text-[32px]">HookFlow</p>
          </div>
        </div>

        <nav className="grid grid-cols-3 gap-2 lg:flex lg:flex-col lg:gap-3">
          {navItems.map((item) => {
            const isActive = item.key === active;

            return (
              <Link
                className={`group relative inline-flex min-w-0 items-center justify-center gap-2 overflow-hidden rounded-lg border border-transparent px-2 py-3 text-[10px] font-bold uppercase tracking-[0.1em] transition duration-200 lg:w-full lg:justify-between lg:gap-3 lg:rounded-xl lg:px-4 lg:py-4 lg:text-sm lg:tracking-[0.14em] ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-glow"
                    : "bg-transparent text-on-surface-variant hover:bg-white/5 hover:text-on-background"
                }`}
                href={item.href}
                key={item.key}
              >
                {isActive && <div className="absolute left-0 top-0 h-full w-[3px] bg-primary shadow-[0_0_12px_rgba(78,222,163,0.9)]"></div>}
                <span className="relative z-10 truncate lg:hidden">{item.shortLabel}</span>
                <span className="relative z-10 hidden lg:inline">{item.label}</span>
                <span
                  className={`hidden text-base transition lg:inline ${
                    isActive ? "translate-x-0 text-primary" : "text-on-surface-variant group-hover:translate-x-1 group-hover:text-primary"
                  }`}
                >
                  {isActive ? "•" : "→"}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
