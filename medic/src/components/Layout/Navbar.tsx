import { Activity, Database, FileDown, History, LockKeyhole, Shield, Stethoscope } from 'lucide-react';
import type { TabId } from '../../types';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';

const tabs: Array<{ id: TabId; label: string; icon: typeof Activity }> = [
  { id: 'diagnosis', label: 'AI Diagnosis', icon: Stethoscope },
  { id: 'antibiotic', label: 'Antibiotic Stewardship', icon: Shield },
  { id: 'database', label: 'Rare Disease Explorer', icon: Database },
  { id: 'history', label: 'Audit history', icon: History },
];

type NavbarProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  onPrint: () => void;
};

export function Navbar({ activeTab, onChange, onPrint }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#050819]/95 shadow-lg shadow-black/10 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300">
              <Shield size={20} aria-hidden="true" /><span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#050819]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><span className="truncate text-base font-bold tracking-tight text-slate-100">AegisMed AI</span><Badge variant="cyan">CDSS</Badge></div>
              <p className="hidden truncate text-[10px] text-slate-500 sm:block">Clinical decision support & antimicrobial stewardship</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[10px] text-slate-500 lg:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Decision support demo</span>
            <Badge variant="purple" className="hidden sm:inline-flex"><LockKeyhole size={11} className="mr-1" />Local-only · not certified</Badge>
            <Button type="button" onClick={onPrint} className="min-h-9 px-3 py-1.5 text-xs"><FileDown size={13} /><span className="hidden sm:inline">Print report</span><span className="sm:hidden">Print</span></Button>
          </div>
        </div>
        <nav aria-label="Main navigation" className="mt-3">
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => onChange(id)} className={`flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-[11px] font-semibold transition sm:px-4 sm:text-xs ${activeTab === id ? 'bg-cyan-400 text-[#06101c] shadow-[0_0_18px_rgba(6,182,212,0.15)]' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}>
                <Icon size={14} aria-hidden="true" /><span>{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
