import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import TextInput from '../../components/ui/TextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import {
  requestVerificationOtp,
  verifyEmailOtp,
} from '../../services/authService';
import { APP_ROUTES } from '../../constants/routes';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    otp: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

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

  const handleVerify = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);

      await verifyEmailOtp({
        email: formData.email,
        otp: formData.otp,
      });

      toast.success('Email verified successfully. Please login.');

      navigate(APP_ROUTES.LOGIN, {
        replace: true,
        state: { email: formData.email },
      });
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Email verification failed. Please try again.';
      setErrors({ form: apiMessage });
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!formData.email.trim()) {
      setErrors((prev) => ({
        ...prev,
        email: 'Email is required',
      }));
      return;
    }

    try {
      setResending(true);

      await requestVerificationOtp({
        email: formData.email,
      });

      toast.success('Verification OTP sent successfully');
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to resend OTP. Please try again.';
      toast.error(apiMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Enter verification OTP"
        subtitle="Enter the OTP sent to your email address to verify your account."
      >
        <form onSubmit={handleVerify} className="space-y-5">
          <TextInput
            label="Email address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            error={errors.email}
            disabled={submitting || resending}
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

          {errors.form ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </div>
          ) : null}

          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? 'Verifying...' : 'Verify Email'}
          </PrimaryButton>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending || submitting}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {resending ? 'Sending OTP...' : 'Resend OTP'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need to change email?{' '}
          <Link
            to={APP_ROUTES.VERIFY_ACCOUNT}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Go back
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
};

export default VerifyEmailPage;