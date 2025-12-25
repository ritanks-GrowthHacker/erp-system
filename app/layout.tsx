import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AlertProvider } from "@/components/common/CustomAlert";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ERP System - Enterprise Resource Planning",
  description: "Modern ERP system for managing inventory, purchasing, sales, and manufacturing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-gray-50 text-gray-900">
        <AlertProvider>
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}
