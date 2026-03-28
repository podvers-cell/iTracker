import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { SplashScreen } from "@/components/shell/SplashScreen";

export const metadata: Metadata = {
  title: "iTrack",
  description: "Simple finishing tracker",
  manifest: "/manifest.json",
  applicationName: "iTrack",
  appleWebApp: {
    capable: true,
    title: "iTrack",
    /* default = white status-bar well; use translucent so purple header shows in safe area */
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

/** Matches mobile AppShell purple chrome (violet-600 / violet-900) for OS status / address bar */
const MOBILE_CHROME_THEME_LIGHT = "#6d28d9";
const MOBILE_CHROME_THEME_DARK = "#4c1d95";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: MOBILE_CHROME_THEME_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: MOBILE_CHROME_THEME_DARK },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "en" ? "en" : "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const fontClass = locale === "ar" ? "font-ar" : "font-en";
  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontClass} min-h-dvh overflow-x-hidden antialiased hide-scrollbar`}
    >
      <body className="flex min-h-dvh flex-col overflow-x-hidden hide-scrollbar">
        <RegisterServiceWorker />
        <I18nProvider initialLocale={locale}>
          <div className="flex min-h-dvh flex-1 flex-col">
            <SplashScreen />
            <AuthProvider>{children}</AuthProvider>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
