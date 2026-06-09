"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";

export type NavLink = {
  href: string;
  label: string;
};

type NavMenuProps = {
  links: NavLink[];
  showSignOut: boolean;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function NavMenu({ links, showSignOut }: NavMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
          >
            {link.label}
          </Link>
        ))}
        {showSignOut && <SignOutButton />}
      </nav>

      <div className="md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Zatvori izbornik" : "Otvori izbornik"}
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
        >
          <MenuIcon open={open} />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Zatvori izbornik"
              className="fixed inset-0 z-40 bg-slate-900/20"
              onClick={() => setOpen(false)}
            />
            <nav
              id="mobile-nav"
              className="absolute left-0 right-0 top-full z-50 border-b border-slate-200 bg-white px-4 py-3 shadow-lg"
            >
              <ul className="grid gap-1">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {showSignOut && (
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <SignOutButton
                    className="w-full justify-start px-3 py-3 text-left"
                    onSignedOut={() => setOpen(false)}
                  />
                </div>
              )}
            </nav>
          </>
        )}
      </div>
    </>
  );
}
