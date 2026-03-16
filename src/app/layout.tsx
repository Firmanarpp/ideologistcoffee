import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ideologist POS",
  description: "Point of Sale System for Ideologist Coffee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#FDFBF7] text-[#1A1A1A] antialiased`}>
        {children}
      </body>
    </html>
  );
}
