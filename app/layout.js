import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import RegisterSW from "./components/RegisterSW";

const APP_URL = "https://my-manajemen-keuangan.vercel.app";
const APP_TITLE = "Manajemen Keuangan";
const APP_DESC =
  "Aplikasi web untuk mencatat keuangan pribadi & proyek. Multi-buku, kategori, laporan, dark mode, offline, dan sinkron antar device.";

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_TITLE,
    template: `%s · ${APP_TITLE}`,
  },
  description: APP_DESC,
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Keuangan",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    url: APP_URL,
    title: APP_TITLE,
    description: APP_DESC,
    siteName: APP_TITLE,
    locale: "id_ID",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: APP_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: APP_TITLE,
    description: APP_DESC,
    images: ["/icon.svg"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10b981",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
