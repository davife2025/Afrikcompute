import type { ReactNode } from "react";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { VerifiedProvider } from "@/lib/verified";
import { Header } from "@/components/Header";

export const metadata = {
  title: "AfrikCompute",
  description: "Datasets for African languages, reviewed privately and paid for on NEAR.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600&family=Noto+Sans+Ethiopic:wght@500&display=swap"
        />
      </head>
      <body>
        <I18nProvider>
          <VerifiedProvider>
            <AuthProvider>
              <Header />
              <main>{children}</main>
            </AuthProvider>
          </VerifiedProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
