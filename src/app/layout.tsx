import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import { GeistPixelCircle } from "geist/font/pixel";
import "./globals.css";

const openRunde = localFont({
  src: [
    { path: "./fonts/open-runde/open-runde-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/open-runde/open-runde-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/open-runde/open-runde-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/open-runde/open-runde-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CheckMate",
  description: "AI-assisted quiz paper checker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${openRunde.variable} ${GeistMono.variable} ${GeistPixelCircle.variable}`}>
      <body>{children}</body>
    </html>
  );
}
