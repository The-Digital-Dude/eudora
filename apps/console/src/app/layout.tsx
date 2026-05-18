import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { inter } from "@/lib/fonts";
import { ReduxProvider } from "@/store/provider";

const browserExtensionHydrationFix = `
(() => {
  const attributes = ["cz-shortcut-listen"];

  function cleanBodyAttributes() {
    if (!document.body) {
      return;
    }

    for (const attribute of attributes) {
      document.body.removeAttribute(attribute);
    }
  }

  cleanBodyAttributes();

  new MutationObserver(cleanBodyAttributes).observe(document.documentElement, {
    attributeFilter: attributes,
    attributes: true,
    childList: true,
    subtree: true
  });
})();
`;

export const metadata: Metadata = {
  title: "Shadcn Dashboard",
  description: "A dashboard built with Next.js and shadcn/ui",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
      
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ReduxProvider>
          <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
            <SidebarConfigProvider>
              {children}
            </SidebarConfigProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
