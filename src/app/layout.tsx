import type { Metadata } from "next";
// Fonts are installed from npm, so the app doesn't depend on Google Fonts at build time.
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turnable — product photos to 3D",
  description: "Upload four photos of a product and get a 3D model you can recolor and restyle.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
