import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black, DM_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, THEME_SCRIPT } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/feedback";

/* Archivo — grotesque with real weight range, holds up at 11px and 120px. */
const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-sans-ui",
  display: "swap",
});

/* Archivo Black — the poster voice. Single weight, enormous presence. */
const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-ui",
  display: "swap",
});

/* DM Mono — stencil labels, tokens, register numbers. */
const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Laureate 2K26 — College of Engineering Kidangoor",
  description:
    "Graduation management system for Laureate 2K26 at the College of Engineering Kidangoor. Registration, stage flow, photo booths, lunch, certificates and live analytics for 2,000+ graduates.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf9f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e14" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${sans.variable} ${display.variable} ${mono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
