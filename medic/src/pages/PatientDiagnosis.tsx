import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { mockDiagnoses } from '../mock/data';
import { DiagnosisResult } from '../types';

export const PatientDiagnosis: React.FC = () => {
  const [patientName, setPatientName] = useState('Siti Rahma');
  const [age, setAge] = useState('45');
  const [symptoms, setSymptoms] = useState(
    'High fever (38.8 C), productive cough with purulent sputum, and right-sided pleuritic chest pain on deep inspiration.'
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [results, setResults] = useState<DiagnosisResult[] | null>(mockDiagnoses);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisResult | null>(null);

  const handleValidation = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!patientName.trim()) {
      newErrors.patientName = 'Patient name is required.';
    }
    if (!age || Number(age) <= 0 || isNaN(Number(age))) {
      newErrors.age = 'Please enter a valid positive age.';
    }
    if (!symptoms.trim() || symptoms.trim().length < 10) {
      newErrors.symptoms = `Please enter at least 10 characters describing clinical symptoms (currently ${symptoms.trim().length} chars).`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidation()) {
      setResults(mockDiagnoses);
    }
  };

  const handleLoadSample = (sample: 'pneumonia' | 'melioidosis' | 'pyelo') => {
    if (sample === 'pneumonia') {
      setPatientName('Siti Rahma');
      setAge('45');
      setSymptoms('High fever (38.8 C), productive cough with purulent sputum, and pleuritic chest pain.');
    } else if (sample === 'melioidosis') {
      setPatientName('Ahmad Putra');
      setAge('52');
      setSymptoms('Prolonged persistent fever, night sweats, localized subcutaneous abscesses, and productive cough.');
    } else {
      setPatientName('Budi Santoso');
      setAge('58');
      setSymptoms('Severe costovertebral flank pain, shaking chills, fever (39.2 C), and painful dysuria.');
    }
    setErrors({});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Patient Intake Form */}
      <section className="lg:col-span-5 space-y-4">
        <Card
          title="Patient Symptom Analyzer"
          subtitle="Input patient parameters for AI-assisted differential diagnosis"
        >
          {/* Quick Presets */}
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs font-semibold text-slate-700 block mb-2">
              Load Sample Clinical Presentation:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleLoadSample('pneumonia')}
                className="text-xs px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700"
              >
                Pneumonia Case
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('melioidosis')}
                className="text-xs px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded font-medium text-purple-900"
              >
                Rare: Melioidosis
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('pyelo')}
                className="text-xs px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700"
              >
                Pyelonephritis
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <Input
              id="patientName"
              label="Patient Name"
              required
              placeholder="e.g. Siti Rahma"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              error={errors.patientName}
            />

            <Input
              id="age"
              label="Age (Years)"
              type="number"
              required
              min={1}
              max={130}
              placeholder="e.g. 45"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              error={errors.age}
            />

            <div className="flex flex-col gap-1.5 mb-4">
              <div className="flex justify-between items-center">
                <label htmlFor="symptoms" className="text-sm font-medium text-slate-800">
                  Clinical Symptoms & History <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500">
                  {symptoms.trim().length} chars (min 10)
                </span>
              </div>
              <textarea
                id="symptoms"
                rows={4}
                required
                aria-invalid={!!errors.symptoms}
                aria-describedby={errors.symptoms ? 'symptoms-error' : undefined}
                className={`min-h-[100px] px-3.5 py-2.5 border rounded-lg text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.symptoms
                    ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
                placeholder="High fever (38.8 C), productive cough with purulent sputum, chest pain on deep inspiration..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
              {errors.symptoms && (
                <span id="symptoms-error" role="alert" className="text-xs font-medium text-red-600 mt-0.5">
                  {errors.symptoms}
                </span>
              )}
            </div>

            <Button type="submit" className="w-full">
              Run AI Diagnostic Analysis
            </Button>
          </form>
        </Card>
      </section>

      {/* Differential Results */}
      <section className="lg:col-span-7">
        <Card
          title="Differential Diagnosis Results"
          subtitle="AI-computed clinical probabilities based on symptom pattern matching"
          badge={
            results ? (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {results.length} Matches Found
              </span>
            ) : undefined
          }
        >
          {!results ? (
            <div className="text-center py-12 text-slate-500">
              Fill out the patient form and click analyze to display differential diagnosis.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.isRareDisease
                      ? 'border-purple-200 bg-purple-50/30'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        {item.diseaseName}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">ICD Reference: {item.icdCode}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.isRareDisease && <Badge variant="Rare Disease">Rare Disease Entity</Badge>}
                      <Badge variant={item.probability >= 50 ? 'danger' : 'info'}>
                        {item.probability}% Probability
                      </Badge>
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.probability >= 70
                          ? 'bg-blue-600'
                          : item.probability >= 30
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${item.probability}%` }}
                    />
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed mb-3">{item.description}</p>

                  {item.recommendedAntibiotic && (
                    <div className="text-xs bg-blue-50 text-blue-900 p-2.5 rounded-lg border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span>
                        <strong>Suggested Regimen:</strong> {item.recommendedAntibiotic}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedDiagnosis(item)}
                        className="text-xs py-1 px-2.5 min-h-[30px] shrink-0"
                      >
                        View Protocol
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Disease Protocol Modal */}
      {selectedDiagnosis && (
        <Modal
          isOpen={Boolean(selectedDiagnosis)}
          onClose={() => setSelectedDiagnosis(null)}
          title={`Clinical Guideline: ${selectedDiagnosis.diseaseName}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                ICD: {selectedDiagnosis.icdCode}
              </span>
              {selectedDiagnosis.isRareDisease ? (
                <Badge variant="Rare Disease">Rare Pathology</Badge>
              ) : (
                <Badge variant="Normal">Common Infectious Disease</Badge>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Pathology Overview</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedDiagnosis.description}
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
              <h4 className="font-bold">First-Line Antimicrobial Strategy:</h4>
              <p>{selectedDiagnosis.recommendedAntibiotic || 'Symptomatic supportive therapy.'}</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedDiagnosis(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};