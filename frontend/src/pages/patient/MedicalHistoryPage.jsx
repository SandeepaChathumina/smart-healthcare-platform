import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import MedicalHistoryForm from '../../components/patient/MedicalHistoryForm';
import { getMedicalHistory, updateMedicalHistory } from '../../services/patientService';

const MedicalHistoryPage = () => {
  const navigate = useNavigate();
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      const response = await getMedicalHistory();
      setMedicalHistory(response.medicalHistory);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to load medical history';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  const handleSubmit = async (data) => {
    try {
      setSubmitting(true);
      await updateMedicalHistory(data);
      toast.success('Medical history updated successfully!');
      loadMedicalHistory();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update medical history';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Medical History">
        <div className="flex items-center justify-center rounded-3xl bg-white p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Medical History">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-2xl bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800">
                Your medical history is private and secure. This information helps healthcare
                providers give you better care. Keep this information up to date.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <MedicalHistoryForm
            initialData={medicalHistory}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MedicalHistoryPage;