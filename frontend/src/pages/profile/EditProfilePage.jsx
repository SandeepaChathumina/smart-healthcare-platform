import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import TextInput from '../../components/ui/TextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import useAuth from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';
import {
  getDoctorProfile,
  getPatientProfile,
  updateDoctorProfile,
  updatePatientProfile,
} from '../../services/authService';

const normalizeUser = (rawUser, fallbackUser) => {
  if (!rawUser) return fallbackUser;

  return {
    ...fallbackUser,
    id: rawUser._id || rawUser.id || fallbackUser?.id,
    fullName: rawUser.fullName ?? fallbackUser?.fullName ?? '',
    email: rawUser.email ?? fallbackUser?.email ?? '',
    phone: rawUser.phone ?? fallbackUser?.phone ?? '',
    role: rawUser.role ?? fallbackUser?.role,
    isVerified: rawUser.isVerified ?? fallbackUser?.isVerified,
    accountStatus: rawUser.accountStatus ?? fallbackUser?.accountStatus,
    location: rawUser.location ?? fallbackUser?.location ?? {},
  };
};

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.location?.address || '',
    city: user?.location?.city || '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const profileRoute = useMemo(() => {
    switch (user?.role) {
      case 'Admin':
        return APP_ROUTES.ADMIN_PROFILE;
      case 'Doctor':
        return APP_ROUTES.DOCTOR_PROFILE;
      case 'Patient':
        return APP_ROUTES.PATIENT_PROFILE;
      default:
        return APP_ROUTES.HOME;
    }
  }, [user?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
      form: '',
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    return newErrors;
  };

  const getProfileServices = () => {
    switch (user?.role) {
      case 'Doctor':
        return { updateFn: updateDoctorProfile, getFn: getDoctorProfile };
      case 'Patient':
        return { updateFn: updatePatientProfile, getFn: getPatientProfile };
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const services = getProfileServices();

    if (!services) {
      const message = 'Admin profile update backend route is not available yet.';
      setErrors({ form: message });
      toast.error(message);
      return;
    }

    try {
      setSubmitting(true);

      await services.updateFn({
        fullName: formData.fullName,
        phone: formData.phone,
        location: {
          address: formData.address,
          city: formData.city,
        },
      });

      const freshProfileResponse = await services.getFn();
      const normalizedUser = normalizeUser(freshProfileResponse?.profile, user);

      updateUser(normalizedUser);

      toast.success('Profile updated successfully');
      navigate(profileRoute, { replace: true });
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to update profile. Please try again.';
      setErrors({ form: apiMessage });
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Edit Profile">
      <div className="max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Update Profile Information</h2>
        <p className="mt-1 text-sm text-slate-600">
          Edit the fields supported by your backend.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <TextInput
            label="Full name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            error={errors.fullName}
            disabled={submitting}
          />

          <TextInput
            label="Phone number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            error={errors.phone}
            disabled={submitting}
          />

          <TextInput
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
            disabled={submitting}
          />

          <TextInput
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter your city"
            disabled={submitting}
          />

          {errors.form ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryButton type="submit" disabled={submitting} fullWidth={false}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </PrimaryButton>

            <button
              type="button"
              onClick={() => navigate(profileRoute)}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditProfilePage;