import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { UserProvider } from "@/lib/UserContext";

export const metadata: Metadata = {
  title: "P&P CONSTRUYE | Dashboard",
  description: "Sistema de gestión integral para construcción",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <UserProvider>
          <AppShell>{children}</AppShell>
        </UserProvider>
      </body>
    </html>
  );
}
