import localFont from "next/font/local";
import "../globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ModeToggle } from "@/components/ui/dark-toggle";
import { SettingsIcon } from "lucide-react";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Feedbomb</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="grid grid-rows-[50px_calc(100vh_-_50px)] h-full w-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="p-2 pl-4 pr-4 flex justify-between gap-4 items-center select-none">
            <div className="flex gap-4 items-center">
              <a href="/" className="text-black dark:text-white">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </a>
            </div>
            <div className="flex gap-2 items-center">
              <ModeToggle />
              <a href="/settings" className="text-black dark:text-white">
                <Button variant="outline" size="icon">
                  <SettingsIcon className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </a>
            </div>
          </header>
          <main className="overflow-y-auto custom-scrollbar">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}