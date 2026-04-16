import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

  const isDoctor = formData.role === 'Doctor';
  const isAdmin = formData.role === 'Admin';

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    if (name === 'phone') {
      updatedValue = value.replace(/[^\d+]/g, '');
    }

    if (name === 'experience') {
      updatedValue = value.replace(/[^\d]/g, '');
    }

    if (name === 'consultationFee') {
      updatedValue = value.replace(/[^\d.]/g, '');
    }

    setFormData((prev) => {
      const updatedForm = {
        ...prev,
        [name]: updatedValue,
      };

      if (name === 'role' && value !== 'Doctor') {
        updatedForm.specialization = '';
        updatedForm.qualifications = '';
        updatedForm.licenseNumber = '';
        updatedForm.hospitalOrClinic = '';
        updatedForm.experience = '';
        updatedForm.consultationFee = '';
        updatedForm.bio = '';
        updatedForm.location = '';
      }

      return updatedForm;
    });

    setErrors((prev) => {
      const updatedErrors = {
        ...prev,
        [name]: '',
        form: '',
      };

      if (name === 'role' && value !== 'Doctor') {
        updatedErrors.specialization = '';
        updatedErrors.qualifications = '';
        updatedErrors.licenseNumber = '';
        updatedErrors.hospitalOrClinic = '';
        updatedErrors.experience = '';
        updatedErrors.consultationFee = '';
        updatedErrors.bio = '';
        updatedErrors.location = '';
      }

      return updatedErrors;
    });
  };

  const validateFullName = (name) => {
    const trimmed = name.trim();

    if (!trimmed) return 'Full name is required';
    if (trimmed.length < 3) return 'Full name must be at least 3 characters';
    if (trimmed.length > 80) return 'Full name must be less than 80 characters';
    if (!/^[A-Za-z\s.'-]+$/.test(trimmed)) {
      return 'Full name can only contain letters, spaces, dots, apostrophes, and hyphens';
    }

    return '';
  };

  const validateEmail = (email) => {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) return 'Email is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address';

    return '';
  };

  const validatePhone = (phone) => {
    const trimmed = phone.trim();

    if (!trimmed) return 'Phone number is required';

    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(trimmed)) {
      return 'Phone number must contain 10 to 15 digits';
    }

    return '';
  };

  const validatePassword = (password) => {
    const trimmed = password.trim();

    if (!trimmed) return 'Password is required';
    if (trimmed.length < 8) return 'Password must be at least 8 characters';
    if (trimmed.length > 100) return 'Password must be less than 100 characters';
    if (!/[A-Z]/.test(trimmed)) return 'Password must include at least one uppercase letter';
    if (!/[a-z]/.test(trimmed)) return 'Password must include at least one lowercase letter';
    if (!/\d/.test(trimmed)) return 'Password must include at least one number';

    return '';
  };

  const validateDoctorField = (value, fieldName, min = 2, max = 100) => {
    const trimmed = value.trim();

    if (!trimmed) return `${fieldName} is required`;
    if (trimmed.length < min) return `${fieldName} must be at least ${min} characters`;
    if (trimmed.length > max) return `${fieldName} must be less than ${max} characters`;

    return '';
  };

  const validateOptionalText = (value, fieldName, min = 2, max = 100) => {
    const trimmed = value.trim();

    if (!trimmed) return '';
    if (trimmed.length < min) return `${fieldName} must be at least ${min} characters`;
    if (trimmed.length > max) return `${fieldName} must be less than ${max} characters`;

    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    const fullNameError = validateFullName(formData.fullName);
    if (fullNameError) newErrors.fullName = fullNameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (!['Patient', 'Doctor', 'Admin'].includes(formData.role)) {
      newErrors.role = 'Please select a valid role';
    }

    if (isDoctor) {
      const specializationError = validateDoctorField(
        formData.specialization,
        'Specialization',
        2,
        80
      );
      if (specializationError) newErrors.specialization = specializationError;

      const qualificationsError = validateDoctorField(
        formData.qualifications,
        'Qualifications',
        2,
        120
      );
      if (qualificationsError) newErrors.qualifications = qualificationsError;

      const licenseNumberError = validateDoctorField(
        formData.licenseNumber,
        'License number',
        4,
        30
      );
      if (licenseNumberError) newErrors.licenseNumber = licenseNumberError;

      const hospitalError = validateOptionalText(
        formData.hospitalOrClinic,
        'Hospital / Clinic',
        2,
        100
      );
      if (hospitalError) newErrors.hospitalOrClinic = hospitalError;

      if (formData.experience !== '') {
        const experienceValue = Number(formData.experience);
        if (Number.isNaN(experienceValue)) {
          newErrors.experience = 'Experience must be a valid number';
        } else if (experienceValue < 0 || experienceValue > 60) {
          newErrors.experience = 'Experience must be between 0 and 60 years';
        }
      }

      if (formData.consultationFee !== '') {
        const feeValue = Number(formData.consultationFee);
        if (Number.isNaN(feeValue)) {
          newErrors.consultationFee = 'Consultation fee must be a valid number';
        } else if (feeValue < 0) {
          newErrors.consultationFee = 'Consultation fee cannot be negative';
        }
      }

      if (formData.bio.trim() && formData.bio.trim().length > 300) {
        newErrors.bio = 'Bio must be less than 300 characters';
      }

      const locationError = validateOptionalText(
        formData.location,
        'Location',
        2,
        100
      );
      if (locationError) newErrors.location = locationError;
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

      const cleanedData = {
        ...formData,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password.trim(),
        specialization: formData.specialization.trim(),
        qualifications: formData.qualifications.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        hospitalOrClinic: formData.hospitalOrClinic.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
      };

      if (isDoctor) {
        await registerDoctor({
          fullName: cleanedData.fullName,
          email: cleanedData.email,
          password: cleanedData.password,
          phone: cleanedData.phone,
          specialization: cleanedData.specialization,
          qualifications: cleanedData.qualifications,
          licenseNumber: cleanedData.licenseNumber,
          hospitalOrClinic: cleanedData.hospitalOrClinic || undefined,
          experience: cleanedData.experience ? Number(cleanedData.experience) : undefined,
          consultationFee: cleanedData.consultationFee
            ? Number(cleanedData.consultationFee)
            : undefined,
          bio: cleanedData.bio || undefined,
          location: cleanedData.location || undefined,
        });

        toast.success(
          'Doctor registration successful. You can verify your account now or later.'
        );
      } else if (isAdmin) {
        await registerAdmin({
          fullName: cleanedData.fullName,
          email: cleanedData.email,
          phone: cleanedData.phone,
          password: cleanedData.password,
        });

        toast.success('Registration successful. You can verify your account now or later.');
      } else {
        await registerPatient({
          fullName: cleanedData.fullName,
          email: cleanedData.email,
          phone: cleanedData.phone,
          password: cleanedData.password,
        });

        toast.success('Registration successful. You can verify your account now or later.');
      }

      navigate(APP_ROUTES.VERIFY_ACCOUNT, {
        replace: true,
        state: {
          email: cleanedData.email,
          role: cleanedData.role,
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

            {errors.role ? (
              <p className="mt-2 text-sm text-red-600">{errors.role}</p>
            ) : null}

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
                error={errors.hospitalOrClinic}
                disabled={submitting}
              />

              <TextInput
                label="Experience"
                name="experience"
                type="number"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Enter years of experience"
                error={errors.experience}
                disabled={submitting}
              />

              <TextInput
                label="Consultation Fee"
                name="consultationFee"
                type="number"
                value={formData.consultationFee}
                onChange={handleChange}
                placeholder="Enter consultation fee"
                error={errors.consultationFee}
                disabled={submitting}
              />

              <TextInput
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Enter short bio"
                error={errors.bio}
                disabled={submitting}
              />

              <TextInput
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
                error={errors.location}
                disabled={submitting}
              />
            </>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="relative">
              <input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                disabled={submitting}
                className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                  errors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={submitting}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errors.password ? (
              <p className="mt-2 text-sm text-red-600">{errors.password}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Use at least 8 characters with uppercase, lowercase, and a number.
              </p>
            )}
          </div>

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