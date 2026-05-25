import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Geist } from "next/font/google";
import { NavLink } from "@/components/nav-link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lab Orders Lite",
  description: "Manage patients, lab tests, and orders.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
          <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md"
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform duration-200"
              />
              <span className="font-display text-[1.0625rem] tracking-tight text-foreground">
                Lab Orders{" "}
                <span className="italic text-muted-foreground/80">Lite</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink href="/patients">Patients</NavLink>
              <span className="mx-2 h-4 w-px bg-border" aria-hidden />
              <NavLink href="/orders">Orders</NavLink>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">{children}</div>
        </main>
        <footer className="border-t border-border/60 py-6">
          <div className="mx-auto max-w-5xl px-6 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-display italic">Lab Orders Lite</span>
            <span className="tabular-nums">v0.1</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
