import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import TextInput from '../../components/ui/TextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { requestVerificationOtp } from '../../services/authService';
import { APP_ROUTES } from '../../constants/routes';

const VerifyAccountPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      await requestVerificationOtp({ email });

      toast.success('Verification OTP sent successfully');

      navigate(APP_ROUTES.VERIFY_EMAIL, {
        replace: true,
        state: { email },
      });
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to send OTP. Please try again.';

      setErrors({ form: apiMessage });
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Verify your account"
        subtitle="Enter your email address and we will send a verification OTP."
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
            {submitting ? 'Sending OTP...' : 'Send OTP'}
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

export default VerifyAccountPage;