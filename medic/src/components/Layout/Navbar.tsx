import React from 'react';

export interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  activeTabTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onMenuToggle,
  isMobileMenuOpen,
  activeTabTitle,
}) => {
  const navItems = [
    { id: 'diagnosis', label: 'AI Differential Diagnosis' },
    { id: 'antibiotic', label: 'Antibiotic Stewardship' },
    { id: 'database', label: 'Rare Disease Registry' },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center py-3 md:py-0 md:h-16 gap-3 md:gap-0">
        {/* Brand & Telemetry */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            {onMenuToggle && (
              <button
                type="button"
                onClick={onMenuToggle}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ☰
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-sm">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight">AegisMed AI</span>
                <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800 font-mono">
                  CDSS v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Clinical Decision Support & Antimicrobial Resistance Prevention
              </p>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 text-[11px] text-emerald-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main Clinical Navigation" className="w-full md:w-auto">
          <ul className="flex items-center justify-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Cryptography / Role Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 pl-4 border-l border-slate-800">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          <span>{activeTabTitle || 'Dr. Sarah Vance, MD'}</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-[11px] text-slate-500">SHA-256 Masked</span>
        </div>
      </div>
    </header>
  );
};