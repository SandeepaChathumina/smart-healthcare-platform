import { useEffect, useState } from 'react';
import { Edit2, Save, X, Heart, Activity, Pill, AlertCircle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMedicalHistory, updateMedicalHistory } from '../../services/patientService';

// Separate component for Chronic Condition inputs to prevent re-renders
const ChronicConditionInput = ({ condition, index, onUpdate, onRemove }) => {
  return (
    <div className="mb-3 rounded-lg border border-slate-200 p-3">
      <input
        type="text"
        value={condition.condition || ''}
        onChange={(e) => onUpdate(index, 'condition', e.target.value)}
        placeholder="Condition name"
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <input
        type="number"
        value={condition.diagnosedYear || ''}
        onChange={(e) => onUpdate(index, 'diagnosedYear', e.target.value)}
        placeholder="Diagnosed year"
        min="1900"
        max="2026"
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <select
        value={condition.status || 'Active'}
        onChange={(e) => onUpdate(index, 'status', e.target.value)}
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="Active">Active</option>
        <option value="In Remission">In Remission</option>
        <option value="Resolved">Resolved</option>
      </select>
      <textarea
        value={condition.notes || ''}
        onChange={(e) => onUpdate(index, 'notes', e.target.value)}
        placeholder="Notes (optional)"
        rows="2"
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <button
        onClick={() => onRemove(index)}
        className="text-sm text-red-600 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
};

// Separate component for Medication inputs
const MedicationInput = ({ medication, index, onUpdate, onRemove }) => {
  return (
    <div className="mb-3 rounded-lg border border-slate-200 p-3">
      <input
        type="text"
        value={medication.medication || ''}
        onChange={(e) => onUpdate(index, 'medication', e.target.value)}
        placeholder="Medication name"
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <input
        type="text"
        value={medication.dosage || ''}
        onChange={(e) => onUpdate(index, 'dosage', e.target.value)}
        placeholder="Dosage (e.g., 500mg)"
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <input
        type="text"
        value={medication.frequency || ''}
        onChange={(e) => onUpdate(index, 'frequency', e.target.value)}
        placeholder="Frequency (e.g., Twice daily)"
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <input
        type="text"
        value={medication.prescribedBy || ''}
        onChange={(e) => onUpdate(index, 'prescribedBy', e.target.value)}
        placeholder="Prescribed by"
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <button
        onClick={() => onRemove(index)}
        className="text-sm text-red-600 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
};

// Separate component for Allergy inputs
const AllergyInput = ({ allergy, index, onUpdate, onRemove }) => {
  return (
    <div className="mb-3 rounded-lg border border-slate-200 p-3">
      <input
        type="text"
        value={allergy.allergen || ''}
        onChange={(e) => onUpdate(index, 'allergen', e.target.value)}
        placeholder="Allergen (e.g., Penicillin, Pollen)"
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <select
        value={allergy.severity || 'Moderate'}
        onChange={(e) => onUpdate(index, 'severity', e.target.value)}
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="Mild">Mild</option>
        <option value="Moderate">Moderate</option>
        <option value="Severe">Severe</option>
      </select>
      <input
        type="text"
        value={allergy.reaction || ''}
        onChange={(e) => onUpdate(index, 'reaction', e.target.value)}
        placeholder="Reaction (e.g., Rash, Difficulty breathing)"
        className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <button
        onClick={() => onRemove(index)}
        className="text-sm text-red-600 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
};

// View mode components
const ChronicConditionView = ({ condition }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="font-medium text-slate-900">{condition.condition}</p>
    <p className="text-sm text-slate-600">
      Diagnosed: {condition.diagnosedYear} | Status: {condition.status}
    </p>
    {condition.notes && (
      <p className="mt-1 text-sm text-slate-500">{condition.notes}</p>
    )}
  </div>
);

const MedicationView = ({ medication }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="font-medium text-slate-900">{medication.medication}</p>
    <p className="text-sm text-slate-600">
      {medication.dosage} - {medication.frequency}
    </p>
    {medication.prescribedBy && (
      <p className="text-xs text-slate-500">Prescribed by: {medication.prescribedBy}</p>
    )}
  </div>
);

const AllergyView = ({ allergy }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="font-medium text-slate-900">{allergy.allergen}</p>
    <p className="text-sm text-slate-600">
      Severity: {allergy.severity}
      {allergy.reaction && ` | Reaction: ${allergy.reaction}`}
    </p>
  </div>
);

const InfoSection = ({ title, icon: Icon, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-blue-600" />
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const MedicalHistoryPage = () => {
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [chronicConditions, setChronicConditions] = useState([]);
  const [currentMedications, setCurrentMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [notes, setNotes] = useState('');

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      const data = await getMedicalHistory();
      const historyData = data.medicalHistory || data;
      setMedicalHistory(historyData);
      
      setChronicConditions(historyData?.chronicConditions || []);
      setCurrentMedications(historyData?.currentMedications || []);
      setAllergies(historyData?.allergies || []);
      setNotes(historyData?.notes || '');
    } catch (error) {
      console.error('Failed to load medical history:', error);
      toast.error('Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        chronicConditions,
        currentMedications,
        allergies,
        notes,
      };
      await updateMedicalHistory(payload);
      toast.success('Medical history updated successfully');
      setEditing(false);
      await loadMedicalHistory();
    } catch (error) {
      console.error('Failed to update medical history:', error);
      toast.error('Failed to update medical history');
    } finally {
      setSaving(false);
    }
  };

  // Chronic Conditions handlers
  const updateChronicCondition = (index, field, value) => {
    const updated = [...chronicConditions];
    updated[index] = { ...updated[index], [field]: value };
    setChronicConditions(updated);
  };

  const addChronicCondition = () => {
    setChronicConditions([...chronicConditions, { condition: '', diagnosedYear: '', status: 'Active', notes: '' }]);
  };

  const removeChronicCondition = (index) => {
    setChronicConditions(chronicConditions.filter((_, i) => i !== index));
  };

  // Medications handlers
  const updateMedication = (index, field, value) => {
    const updated = [...currentMedications];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentMedications(updated);
  };

  const addMedication = () => {
    setCurrentMedications([...currentMedications, { medication: '', dosage: '', frequency: '', prescribedBy: '', startDate: '', isActive: true }]);
  };

  const removeMedication = (index) => {
    setCurrentMedications(currentMedications.filter((_, i) => i !== index));
  };

  // Allergies handlers
  const updateAllergy = (index, field, value) => {
    const updated = [...allergies];
    updated[index] = { ...updated[index], [field]: value };
    setAllergies(updated);
  };

  const addAllergy = () => {
    setAllergies([...allergies, { allergen: '', severity: 'Moderate', reaction: '' }]);
  };

  const removeAllergy = (index) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <DashboardLayout title="Medical History">
        <div className="rounded-2xl bg-slate-100 p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-slate-600">Loading medical history...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Medical History">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-600">
              Manage your health records, conditions, medications, and allergies
            </p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit History
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  loadMedicalHistory();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Chronic Conditions */}
        <InfoSection title="Chronic Conditions" icon={Heart}>
          {editing ? (
            <div>
              {chronicConditions.map((condition, idx) => (
                <ChronicConditionInput
                  key={`condition-${idx}`}
                  condition={condition}
                  index={idx}
                  onUpdate={updateChronicCondition}
                  onRemove={removeChronicCondition}
                />
              ))}
              <button
                onClick={addChronicCondition}
                className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Condition
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {medicalHistory?.chronicConditions?.length > 0 ? (
                medicalHistory.chronicConditions.map((condition, idx) => (
                  <ChronicConditionView key={`view-condition-${idx}`} condition={condition} />
                ))
              ) : (
                <p className="text-sm text-slate-500">No chronic conditions recorded</p>
              )}
            </div>
          )}
        </InfoSection>

        {/* Current Medications */}
        <InfoSection title="Current Medications" icon={Pill}>
          {editing ? (
            <div>
              {currentMedications.map((medication, idx) => (
                <MedicationInput
                  key={`med-${idx}`}
                  medication={medication}
                  index={idx}
                  onUpdate={updateMedication}
                  onRemove={removeMedication}
                />
              ))}
              <button
                onClick={addMedication}
                className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {medicalHistory?.currentMedications?.length > 0 ? (
                medicalHistory.currentMedications.map((medication, idx) => (
                  <MedicationView key={`view-med-${idx}`} medication={medication} />
                ))
              ) : (
                <p className="text-sm text-slate-500">No medications recorded</p>
              )}
            </div>
          )}
        </InfoSection>

        {/* Allergies */}
        <InfoSection title="Allergies" icon={AlertCircle}>
          {editing ? (
            <div>
              {allergies.map((allergy, idx) => (
                <AllergyInput
                  key={`allergy-${idx}`}
                  allergy={allergy}
                  index={idx}
                  onUpdate={updateAllergy}
                  onRemove={removeAllergy}
                />
              ))}
              <button
                onClick={addAllergy}
                className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Allergy
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {medicalHistory?.allergies?.length > 0 ? (
                medicalHistory.allergies.map((allergy, idx) => (
                  <AllergyView key={`view-allergy-${idx}`} allergy={allergy} />
                ))
              ) : (
                <p className="text-sm text-slate-500">No allergies recorded</p>
              )}
            </div>
          )}
        </InfoSection>

        {/* Additional Notes */}
        <InfoSection title="Additional Notes" icon={Activity}>
          {editing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              placeholder="Any additional health notes, concerns, or information you'd like to share with your healthcare provider..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          ) : (
            <p className="text-sm text-slate-600">
              {medicalHistory?.notes || 'No additional notes'}
            </p>
          )}
        </InfoSection>
      </div>
    </DashboardLayout>
  );
};

export default MedicalHistoryPage;