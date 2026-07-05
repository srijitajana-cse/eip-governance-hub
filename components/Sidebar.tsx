"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", id: "00" },
  { href: "/assistant/chat", label: "Governance Assistant", id: "01" },
  { href: "/pr/EIPs/9001", label: "PR Review (demo)", id: "02" },
  { href: "/profile/notifications", label: "Notifications", id: "03" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between bg-ink text-white/90">
      <div>
        <div className="border-b border-white/10 px-6 py-6">
          <p className="font-display text-lg font-semibold tracking-tight text-white">
            EIP Governance Hub
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-white/40">
            editor console
          </p>
        </div>

        <nav className="px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="font-mono text-[11px] text-white/40">{item.id}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 px-6 py-4 font-mono text-[11px] text-white/30">
        mock mode active — see README
      </div>
    </aside>
  );
}
