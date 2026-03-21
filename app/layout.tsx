import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mission Control — Jerome's Empire",
  description: "Command center dashboard for empire operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0c10] text-slate-200">
        {children}
      </body>
    </html>
  );
}
