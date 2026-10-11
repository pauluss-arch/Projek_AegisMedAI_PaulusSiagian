import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';

export const AntibioticChecker: React.FC = () => {
  const [selectedIndication, setSelectedIndication] = useState<string>('Pneumonia');
  const [egfr, setEgfr] = useState<number>(45);
  const [hasPenicillinAllergy, setHasPenicillinAllergy] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrescriptionSigned, setIsPrescriptionSigned] = useState(false);

  // Regimen calculation based on indication and patient parameters
  const getRegimen = () => {
    if (selectedIndication === 'Pneumonia') {
      if (hasPenicillinAllergy) {
        return {
          drug: 'Levofloxacin / Azithromycin',
          standardDose: '500mg IV/Oral Q24H',
          adjustedDose: egfr < 30 ? '250mg Oral Q48H (50% renal dose reduction)' : '500mg Oral Q24H',
          duration: '5 Days',
          isBetaLactam: false,
          warning: 'Monitor QT interval. Safe for documented Penicillin allergy.',
        };
      }
      return {
        drug: 'Amoxicillin / Clavulanate (Augmentin)',
        standardDose: '875/125mg Oral Q12H',
        adjustedDose: egfr < 30 ? '500/125mg Oral Q12H' : '875/125mg Oral Q12H',
        duration: '7 Days',
        isBetaLactam: true,
        warning: 'Beta-lactam agent. Requires caution if allergy history is present.',
      };
    } else if (selectedIndication === 'Pyelonephritis') {
      return {
        drug: 'Ciprofloxacin',
        standardDose: '500mg Oral Q12H',
        adjustedDose: egfr < 30 ? '250mg Oral Q12H or 500mg Q24H' : '500mg Oral Q12H',
        duration: '7 Days',
        isBetaLactam: false,
        warning: 'Renally cleared fluoroquinolone. Hydrate adequately to prevent crystalluria.',
      };
    } else {
      // Sepsis / Severe infection
      if (hasPenicillinAllergy) {
        return {
          drug: 'Aztreonam + Vancomycin',
          standardDose: 'Aztreonam 2g IV Q8H + Vancomycin 15mg/kg',
          adjustedDose: egfr < 30 ? 'Aztreonam 1g IV Q8H + Vancomycin trough-guided' : 'Aztreonam 2g IV Q8H',
          duration: '10 Days',
          isBetaLactam: false,
          warning: 'Monobactam regimen safe in severe IgE-mediated penicillin anaphylaxis.',
        };
      }
      return {
        drug: 'Piperacillin / Tazobactam',
        standardDose: '4.5g IV Q6H',
        adjustedDose: egfr < 30 ? '2.25g to 3.375g IV Q8H' : '4.5g IV Q6H',
        duration: '7-10 Days',
        isBetaLactam: true,
        warning: 'Antipseudomonal penicillin. Strictly contraindicated in penicillin allergy.',
      };
    }
  };

  const regimen = getRegimen();
  const hasAllergyConflict = hasPenicillinAllergy && regimen.isBetaLactam;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isPrescriptionSigned && (
        <div
          role="alert"
          className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm flex justify-between items-center"
        >
          <span>
            <strong>Order Signed:</strong> Prescription for {regimen.drug} has been electronically transmitted to the pharmacy.
          </span>
          <button
            onClick={() => setIsPrescriptionSigned(false)}
            className="text-xs text-emerald-800 underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <Card
        title="Smart Antibiotic Stewardship Verification"
        subtitle="Automated organ function checks (eGFR) and allergy cross-reactivity screening"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Clinical Indication */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="indication-select" className="text-sm font-medium text-slate-700">
              Infection Indication
            </label>
            <select
              id="indication-select"
              value={selectedIndication}
              onChange={(e) => setSelectedIndication(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pneumonia">Community-Acquired Pneumonia</option>
              <option value="Pyelonephritis">Complicated Pyelonephritis</option>
              <option value="Sepsis">Severe Hospital Sepsis</option>
            </select>
          </div>

          {/* eGFR Renal Slider */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="egfr-slider" className="text-sm font-medium text-slate-700">
              Renal Clearance (eGFR: {egfr} mL/min)
            </label>
            <input
              id="egfr-slider"
              type="range"
              min="10"
              max="120"
              value={egfr}
              onChange={(e) => setEgfr(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer mt-1"
            />
            <span className="text-xs text-slate-500">
              {egfr < 30
                ? 'Severe CKD (Dose adjustment required)'
                : egfr < 60
                ? 'Moderate impairment'
                : 'Preserved renal function'}
            </span>
          </div>

          {/* Patient Allergies */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Patient Allergies</span>
            <label className="inline-flex items-center gap-2 text-sm text-slate-800 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hasPenicillinAllergy}
                onChange={(e) => setHasPenicillinAllergy(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
              Documented Penicillin Allergy
            </label>
          </div>
        </div>

        {/* Allergy Conflict Alert */}
        {hasAllergyConflict && (
          <div
            role="alert"
            className="p-4 mb-6 bg-red-50 border border-red-300 rounded-xl text-red-900 text-sm space-y-1"
          >
            <p className="font-bold flex items-center gap-1.5 text-red-700">
              ⚠️ Critical Allergy Conflict Detected
            </p>
            <p className="text-xs text-red-800">
              {regimen.drug} belongs to the Beta-lactam class. Administration may trigger severe anaphylaxis. An alternative non-beta-lactam regimen is required.
            </p>
          </div>
        )}

        {/* Evaluated Antibiotic Regimen */}
        <div className="border-t border-slate-200 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h4 className="font-semibold text-slate-900 text-base">
              Recommended Regimen: {regimen.drug}
            </h4>
            <div className="flex flex-wrap gap-2">
              {hasPenicillinAllergy && !regimen.isBetaLactam && (
                <Badge variant="success">Allergy Safe: Non-Beta-Lactam</Badge>
              )}
              {hasAllergyConflict && <Badge variant="danger">Allergy Contraindication</Badge>}
              {egfr < 30 ? (
                <Badge variant="danger">Renal Dose Reduction Applied</Badge>
              ) : (
                <Badge variant="info">Standard Renal Clearance</Badge>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
            <p>
              <strong>Tailored Dosage:</strong> {regimen.adjustedDose}
            </p>
            <p>
              <strong>Course Duration:</strong> {regimen.duration}
            </p>
            <p className="text-xs text-slate-600">
              <strong>Clinical Guidance:</strong> {regimen.warning}
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant={hasAllergyConflict ? 'danger' : 'primary'}
              onClick={() => setIsModalOpen(true)}
            >
              Verify & Sign Prescription
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Electronic Prescription Order Verification"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Confirm and electronically authorize the antibiotic regimen for <strong>{regimen.drug}</strong>:
          </p>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1.5">
            <p>
              <strong>Calculated Dose:</strong> {regimen.adjustedDose}
            </p>
            <p>
              <strong>Patient eGFR:</strong> {egfr} mL/min/1.73m²
            </p>
            <p>
              <strong>Penicillin Allergy Status:</strong>{' '}
              {hasPenicillinAllergy ? 'Positive (Documented)' : 'None reported'}
            </p>
          </div>

          {hasAllergyConflict && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-900">
              <strong>Physician Override Warning:</strong> Documented penicillin allergy alert is active. Confirm clinical desensitization or alternative clearance before proceeding.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={hasAllergyConflict ? 'danger' : 'primary'}
              onClick={() => {
                setIsModalOpen(false);
                setIsPrescriptionSigned(true);
              }}
            >
              Confirm Electronic Signature
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};