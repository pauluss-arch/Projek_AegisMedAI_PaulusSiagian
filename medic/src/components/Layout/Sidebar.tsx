// AegisMed AI - Responsive Clinical Sidebar Navigation
// Provides access to Patient Diagnosis, Antibiotic Checker, and Rare Disease Database
// Includes Cryptography/Cybersecurity compliance footer

import React from 'react';
import { Activity, Pill, Database, Lock, X } from '../UI/Icons';

export type NavigationTab = 'diagnosis' | 'antibiotics' | 'database';

export interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems: Array<{
    id: NavigationTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'diagnosis',
      label: 'Patient Diagnosis',
      description: 'Differential diagnosis & symptom engine',
      icon: <Activity size={20} />,
      badge: 'AI Core',
    },
    {
      id: 'antibiotics',
      label: 'Antibiotic Checker',
      description: 'Renal dosing & allergy safety filter',
      icon: <Pill size={20} />,
      badge: 'Stewardship',
    },
    {
      id: 'database',
      label: 'Rare Disease Database',
      description: 'ICD-11 & Orphanet clinical knowledge base',
      icon: <Database size={20} />,
      badge: 'ICD-11',
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        aria-label="Main Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Close Button Header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight">AegisMed AI</span>
            <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
              CDSS
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation drawer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section Title */}
        <div className="px-6 pt-6 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Workflows
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto" aria-label="Clinical Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full text-left rounded-xl p-3.5 transition-all duration-150 flex items-start gap-3.5 group
                  ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isActive ? 'bg-teal-700/60 text-white' : 'bg-slate-800 text-teal-400 group-hover:bg-slate-700'
                  }`}
                  aria-hidden="true"
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${
                          isActive
                            ? 'bg-teal-800/80 text-teal-100'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 line-clamp-1 ${
                      isActive ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* University Coursework Integration: Cybersecurity & Cryptography Callout */}
        <div className="p-4 m-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-400">
            <Lock size={16} />
            <span className="text-xs font-bold tracking-wide uppercase">Security & Privacy Protocol</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Connected to future modules in <span className="text-white font-medium">Cybersecurity & Cryptography</span>:
          </p>
          <ul className="text-[10px] space-y-1 text-slate-400 font-mono">
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400"></span>
              <span>Role-Based Access: RBAC Level 3</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400"></span>
              <span>Patient De-identification (SHA-256)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400"></span>
              <span>Audit Logging: Active (#LOG-44910)</span>
            </li>
          </ul>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Hospital Intranet Node 04</span>
          <span className="text-slate-400">HIPAA Compliant</span>
        </div>
      </aside>
    </>
  );
};

