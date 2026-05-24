import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lab Orders Lite",
  description: "Manage patients, lab tests, and orders.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-6">
            <Link href="/" className="font-semibold">
              Lab Orders Lite
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/patients" className="hover:underline">
                Patients
              </Link>
              <Link href="/orders" className="hover:underline">
                Orders
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
