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
    statusBarStyle: "default",
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#4f46e5" },
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
      className={`${fontClass} min-h-full overflow-x-hidden antialiased hide-scrollbar`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden hide-scrollbar">
        <RegisterServiceWorker />
        <I18nProvider initialLocale={locale}>
          <SplashScreen />
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
