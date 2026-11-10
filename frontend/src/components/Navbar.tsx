import { useState } from "react";
import { Link, useLocation } from "react-router";
import { GraduationCap, LayoutDashboard, ClipboardList, Menu, X } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (path: string) =>
    `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
      location.pathname === path
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" onClick={() => setMenuOpen(false)} className="flex min-w-0 items-center gap-3 text-slate-900">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-700 text-white shadow-sm shadow-indigo-200">
            <GraduationCap size={23} strokeWidth={2.2} />
          </span>
          <span className="truncate text-base font-bold tracking-tight sm:text-lg">Admission Portal</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/" className={linkClass("/")}>
            <LayoutDashboard size={17} /> Dashboard
          </Link>

          <Link to="/my-applications" className={linkClass("/my-applications")}>
            <ClipboardList size={17} /> My Applications
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 md:hidden"
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-navigation" className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className={linkClass("/")}>
              <LayoutDashboard size={17} /> Dashboard
            </Link>
            <Link
              to="/my-applications"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/my-applications")}
            >
              <ClipboardList size={17} /> My Applications
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}