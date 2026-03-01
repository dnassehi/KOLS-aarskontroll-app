import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOLS Årskontroll App",
  description: "Browser-basert verktøy for KOLS årskontroll",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
