// AegisMed AI - AppLayout Shell
// Assembles Navbar, Sidebar, Skip-to-content accessibility link, and main clinical workspace

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar, NavigationTab } from './Sidebar';

export interface AppLayoutProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabTitles: Record<NavigationTab, string> = {
    diagnosis: 'Patient Differential Diagnosis',
    antibiotics: 'Antibiotic Safety & Stewardship Checker',
    database: 'Rare Disease Knowledge Base',
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
      {/* Skip to Main Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700"
      >
        Skip to main clinical content
      </a>

      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => onSelectTab(t as NavigationTab)}
        onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
        activeTabTitle={tabTitles[activeTab]}
      />

      {/* Main Body Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Clinical Content Canvas */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
