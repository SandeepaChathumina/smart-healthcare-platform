import { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';

const MedicalHistoryForm = ({ initialData, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState(initialData || {
    chronicConditions: [],
    pastSurgeries: [],
    currentMedications: [],
    allergies: [],
    immunizations: [],
    familyHistory: { conditions: [], notes: '' },
    lifestyleFactors: {
      smoking: { status: 'Never', duration: '' },
      alcohol: { status: 'Never', frequency: '' },
      exercise: { frequency: '', type: '' },
    },
    notes: '',
  });

  const [newCondition, setNewCondition] = useState({ condition: '', diagnosedYear: '', status: 'Active', notes: '' });
  const [newSurgery, setNewSurgery] = useState({ surgery: '', year: '', hospital: '', notes: '' });
  const [newMedication, setNewMedication] = useState({ medication: '', dosage: '', frequency: '', prescribedBy: '', startDate: '', isActive: true });
  const [newAllergy, setNewAllergy] = useState({ allergen: '', severity: 'Moderate', reaction: '' });
  const [newImmunization, setNewImmunization] = useState({ vaccine: '', dateAdministered: '', administeredBy: '', nextDueDate: '' });
  const [newFamilyCondition, setNewFamilyCondition] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLifestyleChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      lifestyleFactors: {
        ...prev.lifestyleFactors,
        [category]: {
          ...prev.lifestyleFactors[category],
          [field]: value,
        },
      },
    }));
  };

  // Chronic Conditions
  const addCondition = () => {
    if (newCondition.condition.trim()) {
      setFormData((prev) => ({
        ...prev,
        chronicConditions: [...prev.chronicConditions, { ...newCondition }],
      }));
      setNewCondition({ condition: '', diagnosedYear: '', status: 'Active', notes: '' });
    }
  };

  const removeCondition = (index) => {
    setFormData((prev) => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter((_, i) => i !== index),
    }));
  };

  // Past Surgeries
  const addSurgery = () => {
    if (newSurgery.surgery.trim()) {
      setFormData((prev) => ({
        ...prev,
        pastSurgeries: [...prev.pastSurgeries, { ...newSurgery }],
      }));
      setNewSurgery({ surgery: '', year: '', hospital: '', notes: '' });
    }
  };

  const removeSurgery = (index) => {
    setFormData((prev) => ({
      ...prev,
      pastSurgeries: prev.pastSurgeries.filter((_, i) => i !== index),
    }));
  };

  // Medications
  const addMedication = () => {
    if (newMedication.medication.trim()) {
      setFormData((prev) => ({
        ...prev,
        currentMedications: [...prev.currentMedications, { ...newMedication }],
      }));
      setNewMedication({ medication: '', dosage: '', frequency: '', prescribedBy: '', startDate: '', isActive: true });
    }
  };

  const removeMedication = (index) => {
    setFormData((prev) => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index),
    }));
  };

  // Allergies
  const addAllergy = () => {
    if (newAllergy.allergen.trim()) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, { ...newAllergy }],
      }));
      setNewAllergy({ allergen: '', severity: 'Moderate', reaction: '' });
    }
  };

  const removeAllergy = (index) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  // Immunizations
  const addImmunization = () => {
    if (newImmunization.vaccine.trim()) {
      setFormData((prev) => ({
        ...prev,
        immunizations: [...prev.immunizations, { ...newImmunization }],
      }));
      setNewImmunization({ vaccine: '', dateAdministered: '', administeredBy: '', nextDueDate: '' });
    }
  };

  const removeImmunization = (index) => {
    setFormData((prev) => ({
      ...prev,
      immunizations: prev.immunizations.filter((_, i) => i !== index),
    }));
  };

  // Family History
  const addFamilyCondition = () => {
    if (newFamilyCondition.trim()) {
      setFormData((prev) => ({
        ...prev,
        familyHistory: {
          ...prev.familyHistory,
          conditions: [...prev.familyHistory.conditions, newFamilyCondition],
        },
      }));
      setNewFamilyCondition('');
    }
  };

  const removeFamilyCondition = (index) => {
    setFormData((prev) => ({
      ...prev,
      familyHistory: {
        ...prev.familyHistory,
        conditions: prev.familyHistory.conditions.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Chronic Conditions */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Chronic Conditions</h3>
        
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Condition"
            value={newCondition.condition}
            onChange={(e) => setNewCondition({ ...newCondition, condition: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <input
            type="number"
            placeholder="Diagnosed Year"
            value={newCondition.diagnosedYear}
            onChange={(e) => setNewCondition({ ...newCondition, diagnosedYear: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <select
            value={newCondition.status}
            onChange={(e) => setNewCondition({ ...newCondition, status: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          >
            <option value="Active">Active</option>
            <option value="In Remission">In Remission</option>
            <option value="Resolved">Resolved</option>
          </select>
          <button
            type="button"
            onClick={addCondition}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {formData.chronicConditions.length > 0 && (
          <div className="space-y-2">
            {formData.chronicConditions.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-3">
                <div>
                  <p className="font-medium">{item.condition}</p>
                  <p className="text-xs text-slate-500">
                    Diagnosed: {item.diagnosedYear || 'N/A'} | Status: {item.status}
                  </p>
                </div>
                <button type="button" onClick={() => removeCondition(idx)} className="text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Surgeries */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Past Surgeries</h3>
        
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Surgery"
            value={newSurgery.surgery}
            onChange={(e) => setNewSurgery({ ...newSurgery, surgery: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <input
            type="number"
            placeholder="Year"
            value={newSurgery.year}
            onChange={(e) => setNewSurgery({ ...newSurgery, year: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <input
            type="text"
            placeholder="Hospital"
            value={newSurgery.hospital}
            onChange={(e) => setNewSurgery({ ...newSurgery, hospital: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <button
            type="button"
            onClick={addSurgery}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {formData.pastSurgeries.length > 0 && (
          <div className="space-y-2">
            {formData.pastSurgeries.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-3">
                <div>
                  <p className="font-medium">{item.surgery}</p>
                  <p className="text-xs text-slate-500">Year: {item.year || 'N/A'} | Hospital: {item.hospital || 'N/A'}</p>
                </div>
                <button type="button" onClick={() => removeSurgery(idx)} className="text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Medications */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Current Medications</h3>
        
        <div className="mb-4 grid gap-3 sm:grid-cols-5">
          <input
            type="text"
            placeholder="Medication"
            value={newMedication.medication}
            onChange={(e) => setNewMedication({ ...newMedication, medication: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <input
            type="text"
            placeholder="Dosage"
            value={newMedication.dosage}
            onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <input
            type="text"
            placeholder="Frequency"
            value={newMedication.frequency}
            onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <input
            type="date"
            placeholder="Start Date"
            value={newMedication.startDate}
            onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <button
            type="button"
            onClick={addMedication}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {formData.currentMedications.length > 0 && (
          <div className="space-y-2">
            {formData.currentMedications.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-3">
                <div>
                  <p className="font-medium">{item.medication}</p>
                  <p className="text-xs text-slate-500">
                    {item.dosage} - {item.frequency} | Started: {item.startDate || 'N/A'}
                  </p>
                </div>
                <button type="button" onClick={() => removeMedication(idx)} className="text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allergies */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Allergies</h3>
        
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Allergen"
            value={newAllergy.allergen}
            onChange={(e) => setNewAllergy({ ...newAllergy, allergen: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <select
            value={newAllergy.severity}
            onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          >
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
          </select>
          <input
            type="text"
            placeholder="Reaction"
            value={newAllergy.reaction}
            onChange={(e) => setNewAllergy({ ...newAllergy, reaction: e.target.value })}
            className="rounded-lg border p-2 text-sm"
          />
          <button
            type="button"
            onClick={addAllergy}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {formData.allergies.length > 0 && (
          <div className="space-y-2">
            {formData.allergies.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-3">
                <div>
                  <p className="font-medium">{item.allergen}</p>
                  <p className="text-xs text-slate-500">
                    Severity: {item.severity} | Reaction: {item.reaction || 'N/A'}
                  </p>
                </div>
                <button type="button" onClick={() => removeAllergy(idx)} className="text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lifestyle Factors */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Lifestyle Factors</h3>
        
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Smoking</label>
            <select
              value={formData.lifestyleFactors.smoking.status}
              onChange={(e) => handleLifestyleChange('smoking', 'status', e.target.value)}
              className="w-full rounded-lg border p-2 text-sm"
            >
              <option value="Never">Never</option>
              <option value="Former">Former</option>
              <option value="Current">Current</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Alcohol</label>
            <select
              value={formData.lifestyleFactors.alcohol.status}
              onChange={(e) => handleLifestyleChange('alcohol', 'status', e.target.value)}
              className="w-full rounded-lg border p-2 text-sm"
            >
              <option value="Never">Never</option>
              <option value="Occasional">Occasional</option>
              <option value="Regular">Regular</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Exercise Frequency</label>
            <input
              type="text"
              placeholder="e.g., 3 times/week"
              value={formData.lifestyleFactors.exercise.frequency}
              onChange={(e) => handleLifestyleChange('exercise', 'frequency', e.target.value)}
              className="w-full rounded-lg border p-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Additional Notes</h3>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="4"
          placeholder="Any additional medical notes..."
          className="w-full rounded-lg border p-3 text-sm"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Medical History'}
        </button>
      </div>
    </form>
  );
};

export default MedicalHistoryForm;