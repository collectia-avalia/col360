import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avalia SaaS - Infraestructura Digital para Financiación Inteligente",
  description: "Plataforma B2B para la gestión financiera y el análisis de riesgo crediticio. Digitaliza y agiliza la radicación de facturas y aprobación de cupos.",
  icons: {
    icon: "/favicon-avalia.png",
    apple: "/favicon-avalia.png",
  },
  openGraph: {
    title: "Avalia SaaS - Infraestructura Digital para Financiación Inteligente",
    description: "Plataforma B2B para la gestión financiera y el análisis de riesgo crediticio.",
    url: "https://avaliab2b.com",
    siteName: "Avalia SaaS",
    images: [
      {
        url: "/logo-avalia.png",
        width: 800,
        height: 600,
        alt: "Avalia SaaS Logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
