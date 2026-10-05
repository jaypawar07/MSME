import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Settlr | MSME Delayed Payment & Section 16 Interest Tracker",
  description:
    "Settlr helps Udyam-registered MSMEs track overdue receivables, auto-calculate 16.5% compound statutory interest under Section 16 of the MSMED Act 2006, and generate escalating recovery notices.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full bg-slate-50 ${inter.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
