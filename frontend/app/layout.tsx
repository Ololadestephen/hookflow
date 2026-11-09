import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HookFlow | BOT Chain Mainnet Treasury Guard",
  description: "Bounded native-BOT treasury payout guard with shared daily limits, burst rate-limiting, and automated cooldown defense on BOT Chain Mainnet."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
