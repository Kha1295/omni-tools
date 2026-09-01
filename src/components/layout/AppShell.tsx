"use client";

import * as React from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { CommandSearch } from "./CommandSearch";
import { ThemeProvider } from "./ThemeProvider";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <ThemeProvider>
      <div className="relative min-h-screen flex flex-col bg-background text-foreground bg-grid-pattern">
        {/* Navigation Header */}
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Search Modal Overlay */}
        <CommandSearch
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />

        <div className="flex-1 flex w-full">
          {/* Categorized Tools Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Content Area (with sidebar margin on desktop) */}
          <main className="flex-1 lg:pl-72 flex flex-col min-w-0 transition-all">
            <div className="flex-1">{children}</div>
            <Footer />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
