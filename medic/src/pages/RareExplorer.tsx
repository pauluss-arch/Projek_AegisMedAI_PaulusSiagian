import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Disease } from '../types';
import { Badge } from '../components/UI/Badge';
import { Card } from '../components/UI/Card';

export function RareExplorer({ diseases, onSelect }: { diseases: Disease[]; onSelect: (disease: Disease) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const rare = diseases.filter((disease) => disease.rare);
  const categories = ['All', ...Array.from(new Set(rare.map((disease) => disease.category))).sort()];
  const filtered = useMemo(() => rare.filter((disease) => {
    const text = `${disease.name} ${disease.icd11} ${disease.category} ${disease.symptoms.join(' ')} ${disease.keywords.join(' ')}`.toLowerCase();
    return (category === 'All' || disease.category === category) && text.includes(query.trim().toLowerCase());
  }), [rare, category, query]);
  return <section>
    <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Rare disease library</p><h2 className="mt-1 text-xl font-bold text-white">Explore clinical signal patterns</h2><p className="mt-1 text-xs text-slate-400">Educational dataset; entries are not diagnostic criteria. ICD-11 values marked unverified require confirmation in the official browser.</p></div>
    <label htmlFor="rare-search" className="sr-only">Search diseases, ICD-11 code, or symptoms</label><div className="relative mb-4"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input id="rare-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, code, category, or symptom..." className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none" /></div>
    <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:#1e293b_#0b0f19]">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${category === item ? 'border-purple-400/40 bg-purple-400/10 text-purple-200' : 'border-slate-700 text-slate-400 hover:text-white'}`}>{item}</button>)}</div>
    <div className="grid gap-3 md:grid-cols-2">{filtered.map((disease) => <button type="button" key={disease.id} onClick={() => onSelect(disease)} className="text-left"><Card className="h-full transition hover:border-purple-400/40"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{disease.name}</h3><p className="mt-1 text-[10px] text-slate-500">{disease.category}</p></div><Badge variant="purple">Rare</Badge></div><p className="mt-3 text-xs leading-5 text-slate-400">{disease.summary}</p><p className="mt-3 text-[10px] text-slate-500">ICD-11: {disease.icd11Verified ? disease.icd11 : `${disease.icd11} · unverified`}</p><div className="mt-3 flex flex-wrap gap-1.5">{disease.symptoms.slice(0, 4).map((signal) => <Badge key={signal} variant="slate">{signal}</Badge>)}</div></Card></button>)}</div>
    {!filtered.length && <Card className="text-center text-sm text-slate-400">No rare-disease entries match this search.</Card>}
  </section>;
}
