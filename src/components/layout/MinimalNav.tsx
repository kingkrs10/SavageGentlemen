"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";

const MinimalNav = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Events", href: "/events" },
        { name: "Shop", href: "/shop" },
        { name: "Membership", href: "/socapassport" },
    ];

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-6 py-4",
                    scrolled ? "bg-black/50 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="relative z-50 group">
                        <img
                            src={SGFlyerLogoPng.src}
                            alt="Savage Gentlemen"
                            className={cn("transition-all duration-500", scrolled ? "h-10 w-auto" : "h-12 w-auto")}
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-white/80 hover:text-primary transition-colors uppercase tracking-widest text-[11px]"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="w-px h-4 bg-white/20" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:text-primary hover:bg-white/5"
                        >
                            <ShoppingBag className="w-5 h-5" />
                        </Button>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden z-50 text-white p-2"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-background/95 backdrop-blur-3xl z-40 flex items-center justify-center transition-all duration-500 md:hidden",
                    menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            >
                <div className="flex flex-col items-center gap-8">
                    {navLinks.map((link, i) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-3xl font-heading text-white hover:text-primary transition-colors"
                            onClick={() => setMenuOpen(false)}
                            style={{ transitionDelay: `${i * 100}ms` }}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
};

export default MinimalNav;
