import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelCircle } from "geist/font/pixel";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheckMate",
  description: "AI-assisted quiz paper checker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelCircle.variable}`}>
      <body>{children}</body>
    </html>
  );
}
