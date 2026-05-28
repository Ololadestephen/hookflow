"use client";

import Link from "next/link";
import Image from "next/image";
import icon from "../icon.png";

const navItems = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/protect", label: "Protect LP", key: "protect" },
  { href: "/create", label: "Create Pool", key: "create" }
] as const;

type AppNavProps = {
  active: (typeof navItems)[number]["key"];
};

export function AppNav({ active }: AppNavProps) {
  return (
    <aside className="border-b border-white/5 bg-surface-container-low/80 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-white/5">
      <div className="flex h-full flex-col gap-6 px-4 py-5 md:px-6 lg:px-5 lg:py-6">
        <div className="border-b border-white/5 pb-5">
          <div className="flex items-center gap-3">
            <Image alt="HookFlow Logo" className="h-9 w-9 rounded-xl shadow-sm" src={icon} />
            <p className="font-display text-[32px] font-semibold tracking-tight text-white">HookFlow</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-3 lg:flex-col lg:gap-3">
          {navItems.map((item) => {
            const isActive = item.key === active;

            return (
              <Link
                className={`group relative inline-flex items-center justify-between overflow-hidden rounded-xl border border-transparent px-4 py-4 text-sm font-bold uppercase tracking-[0.14em] transition duration-200 lg:w-full ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-glow"
                    : "bg-transparent text-on-surface-variant hover:bg-white/5 hover:text-on-background"
                }`}
                href={item.href}
                key={item.key}
              >
                {isActive && <div className="absolute left-0 top-0 h-full w-[3px] bg-primary shadow-[0_0_12px_rgba(78,222,163,0.9)]"></div>}
                <span className="relative z-10">{item.label}</span>
                <span
                  className={`text-base transition ${
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
