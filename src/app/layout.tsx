import type { Metadata } from "next";
import ThemeSync from "@/components/ThemeSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "IAB Repository Service",
  description: "IAB-Backend-Repository-Service mit serverseitigem DataHub-Proxy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
