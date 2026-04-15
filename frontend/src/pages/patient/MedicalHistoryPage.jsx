import { useEffect, useState } from 'react';
import { Plus, Edit2, Save, X, Heart, Activity, Pill, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMedicalHistory, updateMedicalHistory } from '../../services/patientService';

const MedicalHistoryPage = () => {
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    chronicConditions: [],
    pastSurgeries: [],
    currentMedications: [],
    allergies: [],
    immunizations: [],
    familyHistory: { conditions: [], notes: '' },
    lifestyleFactors: {
      smoking: { status: 'Never', duration: '' },
      alcohol: { status: 'Never', frequency: '' },
      exercise: { frequency: '', type: '' }
    },
    notes: ''
  });

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      const data = await getMedicalHistory();
      setMedicalHistory(data.medicalHistory);
      setFormData(data.medicalHistory || formData);
    } catch (error) {
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
      setLoading(true);
      await updateMedicalHistory(formData);
      toast.success('Medical history updated successfully');
      setEditing(false);
      loadMedicalHistory();
    } catch (error) {
      toast.error('Failed to update medical history');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (section, newItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
  };

  const removeItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const updateItem = (section, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const InfoSection = ({ title, icon: Icon, children }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-blue-600" />
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  if (loading && !medicalHistory) {
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
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                Save Changes
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
              {formData.chronicConditions.map((condition, idx) => (
                <div key={idx} className="mb-3 rounded-lg border p-3">
                  <input
                    type="text"
                    value={condition.condition}
                    onChange={(e) => updateItem('chronicConditions', idx, 'condition', e.target.value)}
                    placeholder="Condition name"
                    className="mb-2 w-full rounded-lg border p-2"
                  />
                  <input
                    type="number"
                    value={condition.diagnosedYear}
                    onChange={(e) => updateItem('chronicConditions', idx, 'diagnosedYear', e.target.value)}
                    placeholder="Diagnosed year"
                    className="mb-2 w-full rounded-lg border p-2"
                  />
                  <select
                    value={condition.status}
                    onChange={(e) => updateItem('chronicConditions', idx, 'status', e.target.value)}
                    className="mb-2 w-full rounded-lg border p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="In Remission">In Remission</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  <button
                    onClick={() => removeItem('chronicConditions', idx)}
                    className="text-sm text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItem('chronicConditions', { condition: '', diagnosedYear: '', status: 'Active', notes: '' })}
                className="mt-2 text-sm text-blue-600"
              >
                + Add Condition
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {medicalHistory?.chronicConditions?.length > 0 ? (
                medicalHistory.chronicConditions.map((condition, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-medium">{condition.condition}</p>
                    <p className="text-sm text-slate-600">
                      Diagnosed: {condition.diagnosedYear} | Status: {condition.status}
                    </p>
                  </div>
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
              {formData.currentMedications.map((med, idx) => (
                <div key={idx} className="mb-3 rounded-lg border p-3">
                  <input
                    type="text"
                    value={med.medication}
                    onChange={(e) => updateItem('currentMedications', idx, 'medication', e.target.value)}
                    placeholder="Medication name"
                    className="mb-2 w-full rounded-lg border p-2"
                  />
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateItem('currentMedications', idx, 'dosage', e.target.value)}
                    placeholder="Dosage"
                    className="mb-2 w-full rounded-lg border p-2"
                  />
                  <input
                    type="text"
                    value={med.frequency}
                    onChange={(e) => updateItem('currentMedications', idx, 'frequency', e.target.value)}
                    placeholder="Frequency"
                    className="mb-2 w-full rounded-lg border p-2"
                  />
                  <button
                    onClick={() => removeItem('currentMedications', idx)}
                    className="text-sm text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItem('currentMedications', { medication: '', dosage: '', frequency: '', startDate: '', isActive: true })}
                className="mt-2 text-sm text-blue-600"
              >
                + Add Medication
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {medicalHistory?.currentMedications?.length > 0 ? (
                medicalHistory.currentMedications.map((med, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-medium">{med.medication}</p>
                    <p className="text-sm text-slate-600">
                      {med.dosage} - {med.frequency}
                    </p>
                  </div>
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
              {formData.allergies.map((allergy, idx) => (
                <div key={idx} className="mb-3 rounded-lg border p-3">
                  <input
                    type="text"
                    value={allergy.allergen}
                    onChange={(e) => updateItem('allergies', idx, 'allergen', e.target.value)}
                    placeholder="Allergen"
                    className="mb-2 w-full rounded-lg border p-2"
                  />
                  <select
                    value={allergy.severity}
                    onChange={(e) => updateItem('allergies', idx, 'severity', e.target.value)}
                    className="mb-2 w-full rounded-lg border p-2"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                  <button
                    onClick={() => removeItem('allergies', idx)}
                    className="text-sm text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItem('allergies', { allergen: '', severity: 'Moderate', reaction: '' })}
                className="mt-2 text-sm text-blue-600"
              >
                + Add Allergy
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {medicalHistory?.allergies?.length > 0 ? (
                medicalHistory.allergies.map((allergy, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-medium">{allergy.allergen}</p>
                    <p className="text-sm text-slate-600">Severity: {allergy.severity}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No allergies recorded</p>
              )}
            </div>
          )}
        </InfoSection>

        {/* Notes */}
        <InfoSection title="Additional Notes" icon={Activity}>
          {editing ? (
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows="4"
              placeholder="Any additional health notes..."
              className="w-full rounded-lg border p-3"
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