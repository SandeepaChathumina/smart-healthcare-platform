import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import TextInput from '../../components/ui/TextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import {
  registerAdmin,
  registerDoctor,
  registerPatient,
} from '../../services/authService';
import { APP_ROUTES } from '../../constants/routes';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Patient',
    specialization: '',
    qualifications: '',
    licenseNumber: '',
    hospitalOrClinic: '',
    experience: '',
    consultationFee: '',
    bio: '',
    location: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isDoctor = formData.role === 'Doctor';
  const isAdmin = formData.role === 'Admin';

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.trim().length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isDoctor) {
      if (!formData.specialization.trim()) {
        newErrors.specialization = 'Specialization is required';
      }

      if (!formData.qualifications.trim()) {
        newErrors.qualifications = 'Qualifications are required';
      }

      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = 'License number is required';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);

      if (isDoctor) {
        await registerDoctor({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          specialization: formData.specialization,
          qualifications: formData.qualifications,
          licenseNumber: formData.licenseNumber,
          hospitalOrClinic: formData.hospitalOrClinic,
          experience: formData.experience ? Number(formData.experience) : undefined,
          consultationFee: formData.consultationFee
            ? Number(formData.consultationFee)
            : undefined,
          bio: formData.bio,
          location: formData.location,
        });

        toast.success(
          'Doctor registration successful. You can verify your account now or later.'
        );
      } else if (isAdmin) {
        await registerAdmin({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });

        toast.success('Registration successful. You can verify your account now or later.');
      } else {
        await registerPatient({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });

        toast.success('Registration successful. You can verify your account now or later.');
      }

      navigate(APP_ROUTES.VERIFY_ACCOUNT, {
        replace: true,
        state: {
          email: formData.email,
          role: formData.role,
        },
      });
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Registration failed. Please try again.';
      setErrors({ form: apiMessage });
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Create your account"
        subtitle="Register securely to access the healthcare platform based on your role."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
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
            label="Email address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            error={errors.email}
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

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Role
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="Patient">Patient</option>
              <option value="Doctor">Doctor</option>
              <option value="Admin">Admin</option>
            </select>

            {isDoctor ? (
              <p className="mt-2 text-xs font-medium text-amber-600">
                Doctors must verify email and wait for admin approval before full access.
              </p>
            ) : null}
          </div>

          {isDoctor ? (
            <>
              <TextInput
                label="Specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="Enter specialization"
                error={errors.specialization}
                disabled={submitting}
              />

              <TextInput
                label="Qualifications"
                name="qualifications"
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="Enter qualifications"
                error={errors.qualifications}
                disabled={submitting}
              />

              <TextInput
                label="License Number"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="Enter license number"
                error={errors.licenseNumber}
                disabled={submitting}
              />

              <TextInput
                label="Hospital / Clinic"
                name="hospitalOrClinic"
                value={formData.hospitalOrClinic}
                onChange={handleChange}
                placeholder="Enter hospital or clinic"
                disabled={submitting}
              />

              <TextInput
                label="Experience"
                name="experience"
                type="number"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Enter years of experience"
                disabled={submitting}
              />

              <TextInput
                label="Consultation Fee"
                name="consultationFee"
                type="number"
                value={formData.consultationFee}
                onChange={handleChange}
                placeholder="Enter consultation fee"
                disabled={submitting}
              />

              <TextInput
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Enter short bio"
                disabled={submitting}
              />

              <TextInput
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
                disabled={submitting}
              />
            </>
          ) : null}

          <TextInput
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            error={errors.password}
            disabled={submitting}
          />

          {errors.form ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </div>
          ) : null}

          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            to={APP_ROUTES.LOGIN}
            className="font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
};

export default RegisterPage;