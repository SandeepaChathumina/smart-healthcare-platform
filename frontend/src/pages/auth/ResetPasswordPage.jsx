import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import TextInput from '../../components/ui/TextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { resetPassword } from '../../services/authService';
import { APP_ROUTES } from '../../constants/routes';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    otp: '',
    newPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setFormData((prev) => ({
        ...prev,
        email: location.state.email,
      }));
    }
  }, [location.state]);

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

  const validatePassword = (password) => {
    const trimmed = password.trim();

    if (!trimmed) return 'New password is required';
    if (trimmed.length < 8) return 'Password must be at least 8 characters';
    if (trimmed.length > 100) return 'Password must be less than 100 characters';
    if (!/[A-Z]/.test(trimmed)) return 'Password must include at least one uppercase letter';
    if (!/[a-z]/.test(trimmed)) return 'Password must include at least one lowercase letter';
    if (!/\d/.test(trimmed)) return 'Password must include at least one number';

    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
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

      await resetPassword({
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        newPassword: formData.newPassword.trim(),
      });

      toast.success('Password reset successful. Please login.');
      navigate(APP_ROUTES.LOGIN, { replace: true });
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Password reset failed. Please try again.';
      setErrors({ form: apiMessage });
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Reset password"
        subtitle="Enter the OTP and your new password to complete the password reset."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
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
            label="OTP code"
            name="otp"
            value={formData.otp}
            onChange={handleChange}
            placeholder="Enter your OTP"
            error={errors.otp}
            disabled={submitting}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              New password
            </label>

            <div className="relative">
              <input
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                disabled={submitting}
                className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                  errors.newPassword
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

            {errors.newPassword ? (
              <p className="mt-2 text-sm text-red-600">{errors.newPassword}</p>
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
            {submitting ? 'Resetting...' : 'Reset password'}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Back to{' '}
          <Link
            to={APP_ROUTES.LOGIN}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            login
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
};

export default ResetPasswordPage;