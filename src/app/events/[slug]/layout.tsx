import React from "react";
import '../../globals.css';

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground">
      {/* ===== Header (Logo + actions) ===== */}
      <header className="h-12 flex items-center justify-center w-full px-4 md:px-6 gap-4 border-b bg-background z-50">
        {/* Left side (Logo) */}
        <a 
          href="/" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity p-1 -m-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Go to homepage"
        >

          {/* Light Mode — Desktop */}
          <img
            src="/Asset2.png"
            alt="Logo Long Light"
            className="dark:hidden h-5 w-auto object-contain"
          />

          {/* Dark Mode — Desktop */}
          <img
            src="/Asset 1.svg"
            alt="Logo Long Dark"
            className="h-5 w-auto object-contain hidden dark:block"
          />
        </a>

        {/* <div className="hidden md:block w-3/5">
          <AnimatePresence initial={false}>
            {!isOpen && (
              <div key="search-trigger-wrapper">
                <SearchTrigger className="w-xl shadow-none" triggerId="event"/>
              </div>
            )}
          </AnimatePresence>
        </div> */}
      </header>
      <main className="relative flex-1 overflow-hidden bg-muted/20">
        {children}
      </main>
    </div>
  );
}
