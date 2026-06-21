"use client";

import Link from "next/link";
import { ShoppingBag, Heart, Search, Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser, AuthChangeEvent, Session } from "@supabase/supabase-js";

const navLinks = [
  { href: "/shop", label: "All Jewellery" },
  { href: "/shop?category=necklace", label: "Necklaces" },
  { href: "/shop?category=earring", label: "Earrings" },
  { href: "/shop?category=ring", label: "Rings" },
  { href: "/shop?category=handband", label: "Handbands" },
];

export function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { getTotalItems, toggleCart } = useCartStore();
  const totalItems = getTotalItems();
  const supabase = createClient();
  const router = useRouter();

  // Detect auth state on mount and listen for changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: SupabaseUser | null } }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = () => setShowUserMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showUserMenu]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        Free shipping in India on orders above ₹499 &nbsp;·&nbsp; Get 10% off, use code{" "}
        <strong className="font-medium">NOW10</strong>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between py-4">

          {/* Left — Desktop Nav / Mobile Hamburger */}
          <div className="flex items-center gap-8">
            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden p-1 text-[#6B6B6B] hover:text-[#2A2A2A] transition-colors"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#6B6B6B] hover:text-[#2A2A2A] transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center — Logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 font-serif text-2xl font-bold tracking-[0.25em] text-[#2A2A2A] uppercase"
          >
            KAIVA
          </Link>

          {/* Right — Icons */}
          <div className="flex items-center gap-1">
            <Link
              href="/shop"
              className="p-2.5 text-[#6B6B6B] hover:text-[#2A2A2A] transition-colors"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>

            {/* User icon — shows dropdown if logged in, goes to /login if not */}
            <div className="relative hidden md:block">
              {user ? (
                <>
                  <button
                    id="user-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu((prev) => !prev);
                    }}
                    className="p-2.5 text-[#6B6B6B] hover:text-[#2A2A2A] transition-colors"
                    aria-label="My account"
                  >
                    <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </button>

                  {showUserMenu && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E5E5E5] rounded-xl shadow-lg py-1 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-2.5 border-b border-[#F0EEEA]">
                        <p className="text-xs text-[#6B6B6B] truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#2A2A2A] hover:bg-[#F3EFEC] transition-colors"
                      >
                        <User className="h-3.5 w-3.5" />
                        My Orders
                      </Link>
                      <button
                        id="logout-btn"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="p-2.5 text-[#6B6B6B] hover:text-[#2A2A2A] transition-colors"
                  aria-label="Sign in"
                >
                  <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </Link>
              )}
            </div>

            <Link
              href="/account"
              className="hidden md:flex p-2.5 text-[#6B6B6B] hover:text-[#2A2A2A] transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>

            <button
              id="cart-toggle-btn"
              onClick={toggleCart}
              className="relative p-2.5 text-[#6B6B6B] hover:text-[#2A2A2A] transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-[#C5A059] text-white text-[9px] font-semibold flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-[#E5E5E5] bg-[#FAFAFA]">
            <nav className="flex flex-col py-4 px-6 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[#6B6B6B] hover:text-[#2A2A2A] border-b border-[#F0EEEA] transition-colors"
                  onClick={() => setIsMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[#6B6B6B] hover:text-[#2A2A2A] border-b border-[#F0EEEA] transition-colors"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    id="mobile-logout-btn"
                    onClick={() => { setIsMobileOpen(false); handleLogout(); }}
                    className="py-3 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-red-500 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[#6B6B6B] hover:text-[#2A2A2A] transition-colors"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
