import type { ReactNode } from "react";

export const metadata = { title: "AfrikCompute" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FBF3E6", color: "#2A1A12" }}>
        {children}
      </body>
    </html>
  );
}
