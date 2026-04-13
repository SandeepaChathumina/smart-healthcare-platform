import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import TextInput from '../../components/ui/TextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { forgotPassword } from '../../services/authService';
import { APP_ROUTES } from '../../constants/routes';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      await forgotPassword({ email });

      toast.success('Password reset OTP sent successfully');

      navigate(APP_ROUTES.RESET_PASSWORD, {
        replace: true,
        state: { email },
      });
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to send reset OTP. Please try again.';
      setErrors({ form: apiMessage });
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Forgot password"
        subtitle="Enter your email address to receive a password reset OTP."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <TextInput
            label="Email address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: '', form: '' }));
            }}
            placeholder="Enter your email"
            error={errors.email}
            disabled={submitting}
          />

          {errors.form ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </div>
          ) : null}

          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? 'Sending OTP...' : 'Send reset OTP'}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Remembered your password?{' '}
          <Link
            to={APP_ROUTES.LOGIN}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Back to login
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;