import type { Metadata } from "next";
import { Lato, Playwrite_AU_QLD, Winky_Rough } from "next/font/google";
import "../styles/globals.css";
import AuthProvider from "@/app/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import PageTransition from "@/components/PageTransition";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-lato",
  display: "swap",
});

const winky = Winky_Rough({
  subsets: ["latin"],
  variable: "--font-winky",
  display: "swap",
  adjustFontFallback: false,
});

const playwrite = Playwrite_AU_QLD({
  variable: "--font-playwrite",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "InkShelf", template: "%s · InkShelf" },
  description: "InkShelf – Discover, track, and love your books.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${lato.variable} ${winky.variable} ${playwrite.variable} antialiased bg-white dark:bg-ink-950`}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <PageTransition>
                {children}
              </PageTransition>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
