import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheckMate",
  description: "AI-assisted quiz paper checker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
