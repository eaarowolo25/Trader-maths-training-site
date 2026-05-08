import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraderMath Prep | Prop Trading Training",
  description: "Elite mental arithmetic and auditory training for trading interviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
