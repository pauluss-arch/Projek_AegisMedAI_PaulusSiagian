import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { mockRareDiseases } from '../mock/data';
import { RareDisease } from '../types';

export const DiseaseDatabase: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDisease, setSelectedDisease] = useState<RareDisease | null>(null);

  const categories = ['All', 'Infectious Disease', 'Metabolic Disorder', 'Autoimmune'];

  const filteredDiseases = mockRareDiseases.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.icd11Code.toLowerCase().includes(q) ||
      item.keySymptoms.some((s) => s.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Card
        title="Rare Disease Knowledge Base & Diagnostic Registry"
        subtitle="Explore rare pathologies, ICD-11 classifications, and specialized clinical protocols"
      >
        <div className="space-y-4">
          <Input
            id="search-rare"
            label="Search Rare Diseases"
            placeholder="Search by disease name, ICD-11 code, or clinical symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide mr-1">
              Filter Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiseases.map((disease) => (
          <Card key={disease.id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="warning">{disease.category}</Badge>
                <span className="text-xs text-slate-400 font-mono">ICD-11: {disease.icd11Code}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{disease.name}</h3>
              <p className="text-xs text-slate-500 mb-3">Est. Prevalence: {disease.prevalence}</p>
              <p className="text-sm text-slate-700 mb-4 leading-relaxed">{disease.description}</p>

              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-900 block mb-1">Key Manifestations:</span>
                <div className="flex flex-wrap gap-1">
                  {disease.keySymptoms.map((sym, idx) => (
                    <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {sym}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
              <span className="text-xs text-slate-500 font-mono">{disease.id}</span>
              <Button
                variant="secondary"
                onClick={() => setSelectedDisease(disease)}
                className="text-xs py-1.5 px-3 min-h-[36px]"
              >
                View Protocol
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Disease Detail Protocol Modal */}
      {selectedDisease && (
        <Modal
          isOpen={Boolean(selectedDisease)}
          onClose={() => setSelectedDisease(null)}
          title={`${selectedDisease.name} — Clinical Reference`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="warning">{selectedDisease.category}</Badge>
              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                ICD-11: {selectedDisease.icd11Code}
              </span>
              <span className="text-xs text-slate-500">
                Prevalence: {selectedDisease.prevalence}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Clinical Overview</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedDisease.description}
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Hallmark Manifestations</h4>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                {selectedDisease.keySymptoms.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
              <h4 className="font-bold">Recommended Treatment & Management Protocol:</h4>
              <p>{selectedDisease.treatmentSummary}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedDisease(null)}>
                Close Reference
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};